import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import {
  type EphemeralStudentHandshakeKeys,
  buildChallengeTranscript,
  buildCompanionReceiptMessage,
  buildStudentProofMessage,
  buildStudentTicketMessage,
  computeHmacSha256Base64,
  deriveSessionHmacKey,
  generateCsprngNonce,
  signEd25519,
  verifyEd25519Signature,
} from "./handshakeCrypto";
import {
  type StudentHandshakeTicketResponse,
  type WebRtcSignalPayload,
  relayStudentWebRtcSignal,
  relayTeacherWebRtcSignal,
} from "./attendanceService";

export const DEFAULT_HOTSPOT_LAN_SUBNETS = "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16";
export const WEBRTC_MDNS_LOCAL_TOKEN = "WEBRTC_MDNS_LOCAL";

export interface ParsedIceCandidate {
  address: string;
  port: number;
  type: string;
  protocol: string;
}

export function resolveWsEndpoint(): string {
  const configured = import.meta.env.VITE_WS_ENDPOINT as string | undefined;
  if (typeof window !== "undefined") {
    const currentHost = window.location.hostname;
    const isPrivateOrLocal =
      currentHost === "localhost" ||
      currentHost === "127.0.0.1" ||
      /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(currentHost);
    if (isPrivateOrLocal) {
      if (!configured) {
        return `${window.location.protocol}//${currentHost}:7777/ws`;
      }
      try {
        const parsed = new URL(configured);
        const cfgLocal =
          parsed.hostname === "localhost" ||
          parsed.hostname === "127.0.0.1" ||
          /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(parsed.hostname);
        if (cfgLocal && parsed.hostname !== currentHost) {
          const port = parsed.port || "7777";
          return `${window.location.protocol}//${currentHost}:${port}/ws`;
        }
      } catch {
        // fallback below
      }
    }
  }
  return configured || "http://localhost:7777/ws";
}

export function parseIceCandidateLine(candidateLine: string): ParsedIceCandidate | null {
  if (!candidateLine) return null;
  const match = candidateLine.match(
    /candidate:\S+\s+\d+\s+(\S+)\s+\d+\s+(\S+)\s+(\d+)\s+typ\s+(\S+)/i
  );
  if (!match) return null;
  return {
    protocol: match[1].toLowerCase(),
    address: match[2].trim(),
    port: Number(match[3]),
    type: match[4].toLowerCase(),
  };
}

export function isLinkLocalIpv6(rawIp: string): boolean {
  if (!rawIp) return false;
  let ip = rawIp.trim();
  const zoneIdx = ip.indexOf("%");
  if (zoneIdx > 0) ip = ip.slice(0, zoneIdx);
  if (ip.startsWith("[") && ip.endsWith("]")) ip = ip.slice(1, -1);
  if (!ip.includes(":")) return false;
  const firstHextet = parseInt(ip.split(":")[0] || "0", 16);
  return !Number.isNaN(firstHextet) && (firstHextet & 0xffc0) === 0xfe80;
}

export function isPrivateLanOrHotspotIp(rawIp: string): boolean {
  if (!rawIp) return false;
  let ip = rawIp.trim();
  const zoneIdx = ip.indexOf("%");
  if (zoneIdx > 0) ip = ip.slice(0, zoneIdx);
  if (ip.startsWith("[") && ip.endsWith("]")) ip = ip.slice(1, -1);

  // IPv4 RFC 1918 (covers Wi-Fi routers & Android/iOS/Windows/macOS hotspots)
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (v4) {
    const [b0, b1, b2, b3] = [Number(v4[1]), Number(v4[2]), Number(v4[3]), Number(v4[4])];
    if ([b0, b1, b2, b3].some((n) => n < 0 || n > 255)) return false;
    if (b0 === 10) return true;
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
    if (b0 === 192 && b1 === 168) return true;
    return false;
  }

  // IPv6 Unique Local Address (fc00::/7) or L2 link-local (fe80::/10)
  if (ip.includes(":")) {
    const firstHextet = parseInt(ip.split(":")[0] || "0", 16);
    if (!Number.isNaN(firstHextet) && ((firstHextet & 0xfe00) === 0xfc00 || (firstHextet & 0xffc0) === 0xfe80)) {
      return true;
    }
  }
  return false;
}

function ipv4ToUint32(ip: string): number | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip.trim());
  if (!m) return null;
  const octets = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
  if (octets.some((o) => o < 0 || o > 255)) return null;
  return (((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0);
}

export function isIpInCidr(ip: string, cidr: string): boolean {
  const [netRaw, prefixRaw] = cidr.trim().split("/", 2);
  const ipNum = ipv4ToUint32(ip);
  const netNum = ipv4ToUint32(netRaw || "");
  const prefix = Number(prefixRaw);
  if (ipNum === null || netNum === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return false;
  }
  const mask = prefix === 0 ? 0 : ((0xffffffff << (32 - prefix)) >>> 0);
  return (ipNum & mask) === (netNum & mask);
}

export function isAllowedWebRtcCandidate(candidateLine: string, allowedSubnetsCsv?: string): boolean {
  const parsed = parseIceCandidateLine(candidateLine);
  if (!parsed) return false;
  // Strictly allow direct local host candidates only — reject srflx (STUN) and relay (TURN)
  if (parsed.type !== "host") {
    return false;
  }
  if (parsed.address.toLowerCase().endsWith(".local")) {
    return true;
  }
  if (!isPrivateLanOrHotspotIp(parsed.address)) {
    return false;
  }
  const cidrs = (allowedSubnetsCsv && allowedSubnetsCsv.trim() ? allowedSubnetsCsv : DEFAULT_HOTSPOT_LAN_SUBNETS)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parsed.address.includes(":")) {
    return true; // ULA IPv6 already verified above
  }
  return cidrs.some((cidr) => isIpInCidr(parsed.address, cidr));
}

async function computeHmacSha256ConstantTimeEqual(key: Uint8Array, message: string, providedB64: string): Promise<boolean> {
  const expected = await computeHmacSha256Base64(key, message);
  if (expected.length !== providedB64.trim().length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ providedB64.trim().charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Pure @noble cryptographic state machine executed by the Teacher's browser over the encrypted WebRTC DataChannel.
 * Holds private Ed25519 & X25519 keys in memory only for the duration of the active attendance session.
 */
export function createTeacherCryptoResponder(config: {
  sessionUuid: string;
  teacherId: number;
  backendPublicKey: string;
  teacherKeys: EphemeralStudentHandshakeKeys;
  allowedSubnets?: string;
}) {
  const pending = new Map<
    string,
    {
      ticket: StudentHandshakeTicketResponse;
      teacherNonce: string;
      challengeExpiresAt: number;
      sessionHmacKey: Uint8Array;
    }
  >();
  const consumedTickets = new Set<string>();
  let closed = false;

  return {
    stop() {
      closed = true;
      pending.clear();
      consumedTickets.clear();
      config.teacherKeys.wipe();
    },

    async handleDataChannelMessage(
      rawPayload: string,
      peerTransport: { clientIp: string; iceCandidateType: string }
    ): Promise<Record<string, unknown>> {
      if (closed) {
        return { kind: "ERROR", error: "Attendance session has stopped and ephemeral keys are wiped." };
      }

      if (peerTransport.iceCandidateType !== "host" && peerTransport.iceCandidateType !== "prflx") {
        return {
          kind: "ERROR",
          error: `Rejected non-local WebRTC transport (${peerTransport.iceCandidateType}); only direct Wi-Fi/Hotspot P2P allowed.`,
        };
      }
      if (
        peerTransport.clientIp !== WEBRTC_MDNS_LOCAL_TOKEN &&
        (!isPrivateLanOrHotspotIp(peerTransport.clientIp) ||
          (config.allowedSubnets &&
            !peerTransport.clientIp.includes(":") &&
            !config.allowedSubnets
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean)
              .some((cidr) => isIpInCidr(peerTransport.clientIp, cidr))))
      ) {
        return {
          kind: "ERROR",
          error: `Peer IP (${peerTransport.clientIp}) rejected outside private classroom/hotspot subnet.`,
        };
      }

      const msg = JSON.parse(rawPayload);

      if (msg.kind === "CHALLENGE_REQ") {
        const ticket = msg.ticket as StudentHandshakeTicketResponse;
        if (!ticket || !ticket.ticketId || !ticket.backendTicketSignature) {
          return { kind: "ERROR", error: "Missing Spring Boot signed handshake ticket." };
        }
        if (ticket.sessionUuid !== config.sessionUuid) {
          return { kind: "ERROR", error: "Session UUID mismatch on student handshake ticket." };
        }
        if (Date.now() > ticket.expiresAt || ticket.issuedAt > ticket.expiresAt) {
          return { kind: "ERROR", error: "Student handshake ticket has expired." };
        }
        if (consumedTickets.has(ticket.ticketId) || pending.has(ticket.ticketId)) {
          return { kind: "ERROR", error: "Replay rejected: ticket already active or consumed." };
        }

        const canonicalTicket = buildStudentTicketMessage(ticket);
        const ticketValid = await verifyEd25519Signature(
          config.backendPublicKey,
          canonicalTicket,
          ticket.backendTicketSignature
        );
        if (!ticketValid) {
          return { kind: "ERROR", error: "Invalid Spring Boot Ed25519 signature on student ticket." };
        }

        const sessionHmacKey = await deriveSessionHmacKey(
          config.teacherKeys.x25519PrivateKey,
          ticket.studentX25519PublicKey,
          ticket.ticketId,
          config.sessionUuid
        );

        const teacherNonce = generateCsprngNonce(24);
        const challengeExpiresAt = Date.now() + 30_000;
        const challengeTranscript = buildChallengeTranscript({
          sessionUuid: config.sessionUuid,
          ticketId: ticket.ticketId,
          studentNonce: ticket.studentNonce,
          teacherNonce,
          challengeExpiresAt,
        });
        const teacherChallengeSignature = await signEd25519(
          config.teacherKeys.ed25519PrivateKey,
          challengeTranscript
        );

        pending.set(ticket.ticketId, {
          ticket,
          teacherNonce,
          challengeExpiresAt,
          sessionHmacKey,
        });

        return {
          kind: "CHALLENGE_RES",
          ticketId: ticket.ticketId,
          teacherId: config.teacherId,
          teacherNonce,
          challengeExpiresAt,
          teacherChallengeSignature,
          teacherEd25519PublicKey: config.teacherKeys.ed25519PublicKeyBase64,
          teacherX25519PublicKey: config.teacherKeys.x25519PublicKeyBase64,
        };
      }

      if (msg.kind === "COMPLETE_REQ") {
        const entry = pending.get(msg.ticketId);
        if (!entry) {
          return { kind: "ERROR", error: "Handshake challenge not found or already used." };
        }
        pending.delete(msg.ticketId);

        if (Date.now() > entry.challengeExpiresAt) {
          return { kind: "ERROR", error: "WebRTC handshake challenge expired." };
        }

        const canonicalProof = buildStudentProofMessage({
          sessionUuid: config.sessionUuid,
          ticketId: entry.ticket.ticketId,
          studentRef: entry.ticket.studentRef,
          studentNonce: entry.ticket.studentNonce,
          teacherNonce: entry.teacherNonce,
          teacherEd25519PublicKey: config.teacherKeys.ed25519PublicKeyBase64,
          teacherX25519PublicKey: config.teacherKeys.x25519PublicKeyBase64,
          studentProofTimestamp: Number(msg.studentProofTimestamp),
        });

        const studentSigOk = await verifyEd25519Signature(
          entry.ticket.studentEd25519PublicKey,
          canonicalProof,
          msg.studentProofSignature
        );
        if (!studentSigOk) {
          return { kind: "ERROR", error: "Invalid student Ed25519 proof signature." };
        }

        const hmacOk = await computeHmacSha256ConstantTimeEqual(
          entry.sessionHmacKey,
          canonicalProof,
          msg.studentHmacProof
        );
        if (!hmacOk) {
          return { kind: "ERROR", error: "Invalid X25519/HKDF-SHA256 derived HMAC proof." };
        }

        consumedTickets.add(entry.ticket.ticketId);

        const companionReceiptId = `HSR-${generateCsprngNonce(16)}`;
        const receiptIssuedAt = Date.now();
        const receiptExpiresAt = receiptIssuedAt + 60_000;
        const clientIp = peerTransport.clientIp || WEBRTC_MDNS_LOCAL_TOKEN;

        const canonicalReceipt = buildCompanionReceiptMessage({
          companionReceiptId,
          sessionUuid: config.sessionUuid,
          teacherId: config.teacherId,
          studentRef: entry.ticket.studentRef,
          ticketId: entry.ticket.ticketId,
          teacherNonce: entry.teacherNonce,
          studentNonce: entry.ticket.studentNonce,
          clientIp,
          teacherEd25519PublicKey: config.teacherKeys.ed25519PublicKeyBase64,
          teacherX25519PublicKey: config.teacherKeys.x25519PublicKeyBase64,
          studentEd25519PublicKey: entry.ticket.studentEd25519PublicKey,
          studentX25519PublicKey: entry.ticket.studentX25519PublicKey,
          receiptIssuedAt,
          receiptExpiresAt,
        });

        const teacherReceiptSignature = await signEd25519(
          config.teacherKeys.ed25519PrivateKey,
          canonicalReceipt
        );
        const receiptHmac = await computeHmacSha256Base64(entry.sessionHmacKey, canonicalReceipt);

        return {
          kind: "RECEIPT_RES",
          companionReceiptId,
          finalAttendanceToken: `${companionReceiptId}.${teacherReceiptSignature}`,
          sessionUuid: config.sessionUuid,
          teacherId: config.teacherId,
          studentRef: entry.ticket.studentRef,
          ticketId: entry.ticket.ticketId,
          teacherNonce: entry.teacherNonce,
          studentNonce: entry.ticket.studentNonce,
          clientIp,
          iceCandidateType: peerTransport.iceCandidateType,
          teacherEd25519PublicKey: config.teacherKeys.ed25519PublicKeyBase64,
          teacherX25519PublicKey: config.teacherKeys.x25519PublicKeyBase64,
          studentEd25519PublicKey: entry.ticket.studentEd25519PublicKey,
          studentX25519PublicKey: entry.ticket.studentX25519PublicKey,
          receiptIssuedAt,
          receiptExpiresAt,
          teacherReceiptSignature,
          receiptHmac,
        };
      }

      return { kind: "ERROR", error: "Unsupported WebRTC handshake message type." };
    },
  };
}

export async function waitForLocalIceGathering(pc: RTCPeerConnection, maxWaitMs = 1200): Promise<void> {
  if (pc.iceGatheringState === "complete") {
    return;
  }
  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      pc.removeEventListener("icegatheringstatechange", onStateChange);
      clearTimeout(timer);
      resolve();
    };
    const onStateChange = () => {
      if (pc.iceGatheringState === "complete") {
        finish();
      }
    };
    pc.addEventListener("icegatheringstatechange", onStateChange);
    const timer = setTimeout(finish, maxWaitMs);
  });
}

export async function flushQueuedIceCandidates(
  pc: RTCPeerConnection,
  queue: RTCIceCandidateInit[]
): Promise<void> {
  while (queue.length > 0) {
    const candidate = queue.shift();
    if (!candidate) continue;
    try {
      await pc.addIceCandidate(candidate);
    } catch {
      // Ignore benign duplicate/late trickle candidate
    }
  }
}

async function resolveSelectedPeerTransport(pc: RTCPeerConnection, allowedSubnetsCsv?: string): Promise<{
  clientIp: string;
  iceCandidateType: string;
}> {
  let remote: any = null;
  let candidateType = "host";

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const stats = await pc.getStats();
    let selectedPair: any = null;
    const remoteCandidates = new Map<string, any>();

    stats.forEach((report: any) => {
      if (report.type === "remote-candidate") {
        remoteCandidates.set(report.id, report);
      } else if (report.type === "candidate-pair" && (report.selected || report.nominated || report.state === "succeeded")) {
        if (!selectedPair || report.selected) {
          selectedPair = report;
        }
      }
    });

    remote = selectedPair ? remoteCandidates.get(selectedPair.remoteCandidateId) : null;
    if (remote) {
      break;
    }
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 60));
    }
  }

  if (!remote) {
    return { clientIp: WEBRTC_MDNS_LOCAL_TOKEN, iceCandidateType: "host" };
  }

  candidateType = String(remote.candidateType || "host").toLowerCase();
  const rawAddress = String(remote.address || remote.ip || "").trim();
  // With iceServers: [], both `host` and `prflx` (peer-reflexive on incoming LAN/Hotspot UDP binding check) are direct local P2P;
  // `srflx` (external STUN) and `relay` (external TURN) are always rejected.
  if (candidateType !== "host" && candidateType !== "prflx") {
    throw new Error(`Non-local ICE transport (${candidateType}) rejected.`);
  }
  if (!rawAddress || rawAddress.toLowerCase().endsWith(".local")) {
    return { clientIp: WEBRTC_MDNS_LOCAL_TOKEN, iceCandidateType: candidateType };
  }
  if (isLinkLocalIpv6(rawAddress)) {
    return { clientIp: WEBRTC_MDNS_LOCAL_TOKEN, iceCandidateType: candidateType };
  }
  if (!isPrivateLanOrHotspotIp(rawAddress)) {
    throw new Error(`Public remote ICE IP (${rawAddress}) rejected.`);
  }
  if (
    allowedSubnetsCsv &&
    !rawAddress.includes(":") &&
    !allowedSubnetsCsv
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
      .some((cidr) => isIpInCidr(rawAddress, cidr))
  ) {
    throw new Error(`Peer IP (${rawAddress}) outside configured classroom/hotspot subnet.`);
  }
  return { clientIp: rawAddress, iceCandidateType: candidateType };
}

/**
 * Active Teacher-side WebRTC host running inside the browser tab while an attendance session is ACTIVE.
 * Accepts P2P connections directly over classroom Wi-Fi OR Teacher's Hotspot (iceServers=[]).
 */
export class TeacherWebRtcHost {
  private stompClient: Client;
  private responder: ReturnType<typeof createTeacherCryptoResponder>;
  private peers = new Map<string, RTCPeerConnection>();
  private pendingIce = new Map<string, RTCIceCandidateInit[]>();
  private allowedSubnets?: string;
  private sessionUuid: string;

  constructor(params: {
    sessionUuid: string;
    teacherId: number;
    backendPublicKey: string;
    teacherKeys: EphemeralStudentHandshakeKeys;
    allowedSubnets?: string;
    onPeerVerified?: (studentRef: string, companionReceiptId?: string) => void;
    onHostError?: (err: string) => void;
  }) {
    this.sessionUuid = params.sessionUuid;
    this.allowedSubnets = params.allowedSubnets;
    this.responder = createTeacherCryptoResponder({
      sessionUuid: params.sessionUuid,
      teacherId: params.teacherId,
      backendPublicKey: params.backendPublicKey,
      teacherKeys: params.teacherKeys,
      allowedSubnets: params.allowedSubnets,
    });

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(resolveWsEndpoint()),
      reconnectDelay: 3000,
      debug: () => {},
    });

    this.stompClient.onConnect = () => {
      this.stompClient.subscribe(`/topic/webrtc/teacher/${params.sessionUuid}`, (frame) => {
        try {
          const signal: WebRtcSignalPayload = JSON.parse(frame.body);
          if (signal.senderRole !== "STUDENT") return;
          this.handleStudentSignal(signal, params.onPeerVerified, params.onHostError);
        } catch (err: any) {
          params.onHostError?.(err?.message || "Invalid WebRTC student signal");
        }
      });
    };

    this.stompClient.activate();
  }

  private async handleStudentSignal(
    signal: WebRtcSignalPayload,
    onPeerVerified?: (studentRef: string, companionReceiptId?: string) => void,
    onHostError?: (err: string) => void
  ) {
    const { ticketId } = signal;
    if (!ticketId) return;

    try {
      if (signal.signalType === "OFFER" && signal.sdp) {
        const existing = this.peers.get(ticketId);
        if (existing) existing.close();

        // iceServers: [] forces direct local Wi-Fi / Hotspot P2P only — zero external STUN or TURN
        const pc = new RTCPeerConnection({ iceServers: [] });
        this.peers.set(ticketId, pc);
        if (!this.pendingIce.has(ticketId)) {
          this.pendingIce.set(ticketId, []);
        }

        pc.onicecandidate = (ev) => {
          if (ev.candidate && ev.candidate.candidate) {
            if (!isAllowedWebRtcCandidate(ev.candidate.candidate, this.allowedSubnets)) {
              return;
            }
            relayTeacherWebRtcSignal({
              sessionUuid: this.sessionUuid,
              ticketId,
              signalType: "ICE",
              candidate: ev.candidate.candidate,
              sdpMid: ev.candidate.sdpMid || undefined,
              sdpMLineIndex: ev.candidate.sdpMLineIndex,
            }).catch(() => {});
          }
        };

        pc.ondatachannel = (ev) => {
          const dc = ev.channel;
          dc.onmessage = async (msgEvent) => {
            try {
              const transport = await resolveSelectedPeerTransport(pc, this.allowedSubnets);
              const reply = await this.responder.handleDataChannelMessage(String(msgEvent.data), transport);
              dc.send(JSON.stringify(reply));
              if (reply.kind === "RECEIPT_RES") {
                onPeerVerified?.(
                  String(reply.studentRef || "Student"),
                  reply.companionReceiptId ? String(reply.companionReceiptId) : undefined
                );
                setTimeout(() => {
                  pc.close();
                  this.peers.delete(ticketId);
                  this.pendingIce.delete(ticketId);
                }, 1500);
              }
            } catch (e: any) {
              dc.send(JSON.stringify({ kind: "ERROR", error: e?.message || "WebRTC handshake failed" }));
            }
          };
        };

        await pc.setRemoteDescription({ type: "offer", sdp: signal.sdp });
        const queued = this.pendingIce.get(ticketId) || [];
        await flushQueuedIceCandidates(pc, queued);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await waitForLocalIceGathering(pc, 1200);

        await relayTeacherWebRtcSignal({
          sessionUuid: this.sessionUuid,
          ticketId,
          signalType: "ANSWER",
          sdp: pc.localDescription?.sdp || answer.sdp,
        });
      } else if (signal.signalType === "ICE" && signal.candidate) {
        if (!isAllowedWebRtcCandidate(signal.candidate, this.allowedSubnets)) {
          return;
        }
        const candidateInit: RTCIceCandidateInit = {
          candidate: signal.candidate,
          sdpMid: signal.sdpMid,
          sdpMLineIndex: signal.sdpMLineIndex ?? undefined,
        };
        const pc = this.peers.get(ticketId);
        if (!pc || !pc.remoteDescription) {
          const queue = this.pendingIce.get(ticketId) || [];
          queue.push(candidateInit);
          this.pendingIce.set(ticketId, queue);
          return;
        }
        await flushQueuedIceCandidates(pc, [candidateInit]);
      }
    } catch (err: any) {
      onHostError?.(err?.message || "WebRTC teacher signal handling failed");
    }
  }

  destroy() {
    this.responder.stop();
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    this.pendingIce.clear();
    this.stompClient.deactivate();
  }
}

/**
 * Executes Student-side WebRTC DataChannel cryptographic handshake directly with Teacher browser
 * over classroom Wi-Fi or Teacher's Hotspot (`iceServers: []`, host-only ICE).
 */
export async function performStudentWebRtcHandshake(params: {
  sessionUuid: string;
  teacherId: number;
  teacherEd25519PublicKey: string;
  teacherX25519PublicKey: string;
  allowedSubnets?: string;
  ticket: StudentHandshakeTicketResponse;
  studentKeys: EphemeralStudentHandshakeKeys;
  timeoutMs?: number;
  onProgress?: (stage: string) => void;
}): Promise<{
  companionReceiptId: string;
  finalAttendanceToken?: string;
  teacherNonce: string;
  clientIp: string;
  iceCandidateType: string;
  studentProofTimestamp: number;
  studentProofSignature: string;
  receiptIssuedAt: number;
  receiptExpiresAt: number;
  teacherReceiptSignature: string;
  receiptHmac: string;
}> {
  const timeoutMs = params.timeoutMs ?? 25_000;

  return new Promise((resolve, reject) => {
    const pc = new RTCPeerConnection({ iceServers: [] });
    const dc = pc.createDataChannel("smart-erp-handshake", { ordered: true });
    const pendingRemoteIce: RTCIceCandidateInit[] = [];
    let settled = false;
    let stompClient: Client | null = null;

    const cleanup = () => {
      clearTimeout(timer);
      try {
        dc.close();
      } catch {}
      try {
        pc.close();
      } catch {}
      try {
        stompClient?.deactivate();
      } catch {}
    };

    const fail = (errMsg: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(errMsg));
    };

    const succeed = (result: any) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const timer = setTimeout(() => {
      fail(
        `Direct WebRTC classroom/hotspot P2P connection timed out (ICE state: ${pc.iceConnectionState}). Ensure both devices are on the same classroom Wi-Fi or Teacher Hotspot (no VPN/AP isolation) and the Teacher session tab is open.`
      );
    }, timeoutMs);

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "checking") {
        params.onProgress?.("Probing direct Wi-Fi / Hotspot peer route (ICE)...");
      } else if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        params.onProgress?.("Direct P2P tunnel connected — verifying Ed25519/X25519...");
      } else if (pc.iceConnectionState === "failed") {
        fail(
          "WebRTC ICE direct connection failed. Check that Student & Teacher are on the same Wi-Fi or Teacher's Hotspot without client/AP isolation or VPN."
        );
      }
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate && ev.candidate.candidate) {
        if (!isAllowedWebRtcCandidate(ev.candidate.candidate, params.allowedSubnets)) {
          return;
        }
        relayStudentWebRtcSignal({
          sessionUuid: params.sessionUuid,
          ticketId: params.ticket.ticketId,
          signalType: "ICE",
          candidate: ev.candidate.candidate,
          sdpMid: ev.candidate.sdpMid || undefined,
          sdpMLineIndex: ev.candidate.sdpMLineIndex,
        }).catch(() => {});
      }
    };

    let expectedProofTs = 0;
    let studentProofSignature = "";

    dc.onopen = () => {
      params.onProgress?.("DataChannel open — exchanging cryptographic proofs...");
      dc.send(JSON.stringify({ kind: "CHALLENGE_REQ", ticket: params.ticket }));
    };

    dc.onerror = () => {
      fail("WebRTC DataChannel error during local classroom/hotspot handshake.");
    };

    dc.onmessage = async (event) => {
      try {
        const msg = JSON.parse(String(event.data));
        if (msg.kind === "ERROR") {
          return fail(msg.error || "Teacher browser rejected WebRTC handshake.");
        }

        if (msg.kind === "CHALLENGE_RES") {
          if (msg.teacherEd25519PublicKey !== params.teacherEd25519PublicKey) {
            return fail("Security mismatch: Peer Ed25519 key differs from signed Teacher QR.");
          }
          const challengeOk = await verifyEd25519Signature(
            params.teacherEd25519PublicKey,
            buildChallengeTranscript({
              sessionUuid: params.sessionUuid,
              ticketId: params.ticket.ticketId,
              studentNonce: params.ticket.studentNonce,
              teacherNonce: msg.teacherNonce,
              challengeExpiresAt: msg.challengeExpiresAt,
            }),
            msg.teacherChallengeSignature
          );
          if (!challengeOk) {
            return fail("Invalid Teacher Ed25519 challenge signature over WebRTC.");
          }

          const sessionHmacKey = await deriveSessionHmacKey(
            params.studentKeys.x25519PrivateKey,
            params.teacherX25519PublicKey,
            params.ticket.ticketId,
            params.sessionUuid
          );
          expectedProofTs = Date.now();
          const proofMsg = buildStudentProofMessage({
            sessionUuid: params.sessionUuid,
            ticketId: params.ticket.ticketId,
            studentRef: params.ticket.studentRef,
            studentNonce: params.ticket.studentNonce,
            teacherNonce: msg.teacherNonce,
            teacherEd25519PublicKey: params.teacherEd25519PublicKey,
            teacherX25519PublicKey: params.teacherX25519PublicKey,
            studentProofTimestamp: expectedProofTs,
          });
          studentProofSignature = await signEd25519(params.studentKeys.ed25519PrivateKey, proofMsg);
          const studentHmacProof = await computeHmacSha256Base64(sessionHmacKey, proofMsg);
          params.studentKeys.wipe();

          dc.send(
            JSON.stringify({
              kind: "COMPLETE_REQ",
              ticketId: params.ticket.ticketId,
              studentProofTimestamp: expectedProofTs,
              studentProofSignature,
              studentHmacProof,
            })
          );
          return;
        }

        if (msg.kind === "RECEIPT_RES") {
          params.onProgress?.("Received Final Signed Attendance Token from Teacher device!");
          const transport = await resolveSelectedPeerTransport(pc, params.allowedSubnets);
          const clientIp =
            msg.clientIp && msg.clientIp !== WEBRTC_MDNS_LOCAL_TOKEN ? msg.clientIp : transport.clientIp;

          const receiptCanonical = buildCompanionReceiptMessage({
            companionReceiptId: msg.companionReceiptId,
            sessionUuid: params.sessionUuid,
            teacherId: params.teacherId,
            studentRef: params.ticket.studentRef,
            ticketId: params.ticket.ticketId,
            teacherNonce: msg.teacherNonce,
            studentNonce: params.ticket.studentNonce,
            clientIp: msg.clientIp,
            teacherEd25519PublicKey: params.teacherEd25519PublicKey,
            teacherX25519PublicKey: params.teacherX25519PublicKey,
            studentEd25519PublicKey: params.ticket.studentEd25519PublicKey,
            studentX25519PublicKey: params.ticket.studentX25519PublicKey,
            receiptIssuedAt: msg.receiptIssuedAt,
            receiptExpiresAt: msg.receiptExpiresAt,
          });
          const receiptOk = await verifyEd25519Signature(
            params.teacherEd25519PublicKey,
            receiptCanonical,
            msg.teacherReceiptSignature
          );
          if (!receiptOk) {
            return fail("Teacher WebRTC receipt Ed25519 signature verification failed.");
          }

          return succeed({
            companionReceiptId: msg.companionReceiptId,
            finalAttendanceToken: msg.finalAttendanceToken,
            teacherNonce: msg.teacherNonce,
            clientIp: msg.clientIp || clientIp,
            iceCandidateType: msg.iceCandidateType || transport.iceCandidateType || "host",
            studentProofTimestamp: expectedProofTs,
            studentProofSignature,
            receiptIssuedAt: msg.receiptIssuedAt,
            receiptExpiresAt: msg.receiptExpiresAt,
            teacherReceiptSignature: msg.teacherReceiptSignature,
            receiptHmac: msg.receiptHmac,
          });
        }
      } catch (err: any) {
        fail(err?.message || "WebRTC cryptographic exchange error.");
      }
    };

    stompClient = new Client({
      webSocketFactory: () => new SockJS(resolveWsEndpoint()),
      reconnectDelay: 2000,
      debug: () => {},
    });

    stompClient.onConnect = async () => {
      params.onProgress?.("Connected to signaling broker — gathering local Wi-Fi / Hotspot ICE...");
      stompClient!.subscribe(`/topic/webrtc/student/${params.ticket.ticketId}`, async (frame) => {
        try {
          const signal: WebRtcSignalPayload = JSON.parse(frame.body);
          if (signal.senderRole !== "TEACHER") return;
          if (signal.signalType === "ANSWER" && signal.sdp) {
            await pc.setRemoteDescription({ type: "answer", sdp: signal.sdp });
            await flushQueuedIceCandidates(pc, pendingRemoteIce);
          } else if (signal.signalType === "ICE" && signal.candidate) {
            if (!isAllowedWebRtcCandidate(signal.candidate, params.allowedSubnets)) {
              return;
            }
            const candInit: RTCIceCandidateInit = {
              candidate: signal.candidate,
              sdpMid: signal.sdpMid,
              sdpMLineIndex: signal.sdpMLineIndex ?? undefined,
            };
            if (!pc.remoteDescription) {
              pendingRemoteIce.push(candInit);
            } else {
              await flushQueuedIceCandidates(pc, [candInit]);
            }
          } else if (signal.signalType === "ERROR") {
            fail(signal.errorMessage || "Teacher WebRTC responder returned error.");
          }
        } catch (err: any) {
          fail(err?.message || "Failed to apply Teacher WebRTC answer/ICE.");
        }
      });

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await waitForLocalIceGathering(pc, 1200);
        await relayStudentWebRtcSignal({
          sessionUuid: params.sessionUuid,
          ticketId: params.ticket.ticketId,
          signalType: "OFFER",
          sdp: pc.localDescription?.sdp || offer.sdp,
        });
      } catch (err: any) {
        fail(err?.message || "Failed to initiate WebRTC offer.");
      }
    };

    stompClient.onStompError = () => {
      fail("WebSocket signaling error connecting to Spring Boot for WebRTC handshake.");
    };

    stompClient.activate();
  });
}
