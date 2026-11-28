import crypto from "node:crypto";
import { describe, it, expect } from "vitest";
import {
  generateEphemeralStudentKeys,
  buildChallengeTranscript,
  buildStudentProofMessage,
  buildCompanionReceiptMessage,
  computeHmacSha256Base64,
  deriveSessionHmacKey,
  signEd25519,
  verifyEd25519Signature,
} from "./handshakeCrypto";
import {
  WEBRTC_MDNS_LOCAL_TOKEN,
  createTeacherCryptoResponder,
  flushQueuedIceCandidates,
  isAllowedWebRtcCandidate,
} from "./webrtcHandshake";

function issueSignedTestTicket({
  backendPrivateKey,
  backendPublicKey,
  sessionUuid,
  studentId,
  studentRef,
  studentEd25519PublicKey,
  studentX25519PublicKey,
  studentNonce,
  expiresAt = Date.now() + 60_000,
}: {
  backendPrivateKey: crypto.KeyObject;
  backendPublicKey: string;
  sessionUuid: string;
  studentId: number;
  studentRef: string;
  studentEd25519PublicKey: string;
  studentX25519PublicKey: string;
  studentNonce: string;
  expiresAt?: number;
}) {
  const ticketId = `HST-${crypto.randomUUID()}`;
  const issuedAt = Math.min(Date.now(), expiresAt - 1000);
  const canonical = [
    "STUDENT_TICKET_V1",
    ticketId,
    sessionUuid,
    String(studentId),
    studentRef,
    studentEd25519PublicKey,
    studentX25519PublicKey,
    studentNonce,
    String(issuedAt),
    String(expiresAt),
  ].join("|");
  const backendTicketSignature = crypto
    .sign(null, Buffer.from(canonical, "utf8"), backendPrivateKey)
    .toString("base64");
  return {
    ticketId,
    sessionUuid,
    studentId,
    studentRef,
    studentEd25519PublicKey,
    studentX25519PublicKey,
    studentNonce,
    issuedAt,
    expiresAt,
    backendPublicKey,
    backendTicketSignature,
  };
}

describe("WebRTC Local Wi-Fi & Teacher Hotspot Cryptographic Handshake", () => {
  it("accepts RFC 1918 hotspot/Wi-Fi and mDNS .local host candidates and rejects srflx/relay/public candidates", () => {
    // Valid campus Wi-Fi & Teacher Hotspots (Android 192.168.43.x, iOS 172.20.10.x, Windows 192.168.137.x, Enterprise 10.x)
    expect(isAllowedWebRtcCandidate("candidate:1 1 udp 2122260223 192.168.43.25 51234 typ host")).toBe(true);
    expect(isAllowedWebRtcCandidate("candidate:1 1 udp 2122260223 172.20.10.4 51234 typ host")).toBe(true);
    expect(isAllowedWebRtcCandidate("candidate:1 1 udp 2122260223 192.168.137.42 51234 typ host")).toBe(true);
    expect(isAllowedWebRtcCandidate("candidate:1 1 udp 2122260223 10.214.224.14 51234 typ host")).toBe(true);
    expect(isAllowedWebRtcCandidate("candidate:1 1 udp 2122260223 a1b2c3d4-1111.local 51234 typ host")).toBe(true);
    expect(isAllowedWebRtcCandidate("candidate:1 1 udp 2122260223 fe80::1ff:fe23:4567:890a 51234 typ host")).toBe(true);

    // Reject public IPs, loopback, STUN srflx, TURN relay, and mismatched custom hotspot subnet
    expect(isAllowedWebRtcCandidate("candidate:1 1 udp 1686052607 203.0.113.5 51234 typ srflx")).toBe(false);
    expect(isAllowedWebRtcCandidate("candidate:1 1 udp 41885439 198.51.100.8 3478 typ relay")).toBe(false);
    expect(isAllowedWebRtcCandidate("candidate:1 1 udp 2122260223 8.8.8.8 51234 typ host")).toBe(false);
    expect(isAllowedWebRtcCandidate("candidate:1 1 udp 2122260223 2001:4860:4860::8888 51234 typ host")).toBe(false);
    expect(isAllowedWebRtcCandidate("candidate:1 1 udp 2122260223 127.0.0.1 51234 typ host")).toBe(false);
    expect(
      isAllowedWebRtcCandidate("candidate:1 1 udp 2122260223 192.168.99.50 51234 typ host", "192.168.43.0/24")
    ).toBe(false);
  });

  it("completes mutual Ed25519 + X25519/HKDF-SHA256 handshake over hotspot peer IP and blocks replay/stop/non-host", async () => {
    const backendPair = crypto.generateKeyPairSync("ed25519");
    const backendPublicKey = backendPair.publicKey
      .export({ type: "spki", format: "der" })
      .toString("base64");

    const teacherKeys = await generateEphemeralStudentKeys();
    const studentKeys = await generateEphemeralStudentKeys();

    const responder = createTeacherCryptoResponder({
      sessionUuid: "WEBRTC-SESS-1",
      teacherId: 42,
      backendPublicKey,
      teacherKeys,
      allowedSubnets: "192.168.43.0/24", // Teacher's Android hotspot subnet
    });

    const ticket = issueSignedTestTicket({
      backendPrivateKey: backendPair.privateKey,
      backendPublicKey,
      sessionUuid: "WEBRTC-SESS-1",
      studentId: 777,
      studentRef: "REG-HOTSPOT-777",
      studentEd25519PublicKey: studentKeys.ed25519PublicKeyBase64,
      studentX25519PublicKey: studentKeys.x25519PublicKeyBase64,
      studentNonce: studentKeys.studentNonce,
    });

    // Reject relay/STUN or foreign subnet peers
    const relayAttempt = await responder.handleDataChannelMessage(
      JSON.stringify({ kind: "CHALLENGE_REQ", ticket }),
      { clientIp: "192.168.43.15", iceCandidateType: "relay" }
    );
    expect(relayAttempt.kind).toBe("ERROR");

    const wrongSubnetAttempt = await responder.handleDataChannelMessage(
      JSON.stringify({ kind: "CHALLENGE_REQ", ticket }),
      { clientIp: "10.99.0.5", iceCandidateType: "host" }
    );
    expect(wrongSubnetAttempt.kind).toBe("ERROR");

    // Valid Hotspot Challenge
    const challengeRes = await responder.handleDataChannelMessage(
      JSON.stringify({ kind: "CHALLENGE_REQ", ticket }),
      { clientIp: "192.168.43.15", iceCandidateType: "host" }
    );
    expect(challengeRes.kind).toBe("CHALLENGE_RES");
    const challengeValid = await verifyEd25519Signature(
      teacherKeys.ed25519PublicKeyBase64,
      buildChallengeTranscript({
        sessionUuid: "WEBRTC-SESS-1",
        ticketId: ticket.ticketId,
        studentNonce: ticket.studentNonce,
        teacherNonce: String(challengeRes.teacherNonce),
        challengeExpiresAt: Number(challengeRes.challengeExpiresAt),
      }),
      String(challengeRes.teacherChallengeSignature)
    );
    expect(challengeValid).toBe(true);

    // Derive X25519 + HKDF-SHA256 shared session key on student side
    const sessionHmacKey = await deriveSessionHmacKey(
      studentKeys.x25519PrivateKey,
      teacherKeys.x25519PublicKeyBase64,
      ticket.ticketId,
      "WEBRTC-SESS-1"
    );
    const ts = Date.now();
    const proofMsg = buildStudentProofMessage({
      sessionUuid: "WEBRTC-SESS-1",
      ticketId: ticket.ticketId,
      studentRef: ticket.studentRef,
      studentNonce: ticket.studentNonce,
      teacherNonce: String(challengeRes.teacherNonce),
      teacherEd25519PublicKey: teacherKeys.ed25519PublicKeyBase64,
      teacherX25519PublicKey: teacherKeys.x25519PublicKeyBase64,
      studentProofTimestamp: ts,
    });
    const studentProofSignature = await signEd25519(studentKeys.ed25519PrivateKey, proofMsg);
    const studentHmacProof = await computeHmacSha256Base64(sessionHmacKey, proofMsg);

    const receiptRes = await responder.handleDataChannelMessage(
      JSON.stringify({
        kind: "COMPLETE_REQ",
        ticketId: ticket.ticketId,
        studentProofTimestamp: ts,
        studentProofSignature,
        studentHmacProof,
      }),
      { clientIp: "192.168.43.15", iceCandidateType: "host" }
    );
    expect(receiptRes.kind).toBe("RECEIPT_RES");
    expect(String(receiptRes.finalAttendanceToken)).toContain(String(receiptRes.companionReceiptId));
    expect(
      await verifyEd25519Signature(
        teacherKeys.ed25519PublicKeyBase64,
        buildCompanionReceiptMessage(receiptRes as any),
        String(receiptRes.teacherReceiptSignature)
      )
    ).toBe(true);

    // Replay complete fails
    const replayComplete = await responder.handleDataChannelMessage(
      JSON.stringify({
        kind: "COMPLETE_REQ",
        ticketId: ticket.ticketId,
        studentProofTimestamp: ts,
        studentProofSignature,
        studentHmacProof,
      }),
      { clientIp: "192.168.43.15", iceCandidateType: "host" }
    );
    expect(replayComplete.kind).toBe("ERROR");

    // mDNS local host & peer-reflexive (prflx) direct hotspot P2P both work with local/hotspot policy
    const mDnsTicket = issueSignedTestTicket({
      backendPrivateKey: backendPair.privateKey,
      backendPublicKey,
      sessionUuid: "WEBRTC-SESS-1",
      studentId: 778,
      studentRef: "REG-HOTSPOT-778",
      studentEd25519PublicKey: studentKeys.ed25519PublicKeyBase64,
      studentX25519PublicKey: studentKeys.x25519PublicKeyBase64,
      studentNonce: crypto.randomBytes(24).toString("base64url"),
    });
    const mDnsCh = await responder.handleDataChannelMessage(
      JSON.stringify({ kind: "CHALLENGE_REQ", ticket: mDnsTicket }),
      { clientIp: WEBRTC_MDNS_LOCAL_TOKEN, iceCandidateType: "prflx" }
    );
    expect(mDnsCh.kind).toBe("CHALLENGE_RES");

    // Stop responder -> wipes keys and rejects everything
    responder.stop();
    const afterStop = await responder.handleDataChannelMessage(
      JSON.stringify({ kind: "CHALLENGE_REQ", ticket: mDnsTicket }),
      { clientIp: "192.168.43.15", iceCandidateType: "host" }
    );
    expect(afterStop.kind).toBe("ERROR");
  });

  it("flushes early out-of-order queued ICE candidates in FIFO order", async () => {
    const applied: string[] = [];
    const mockPc = {
      addIceCandidate: async (c: RTCIceCandidateInit) => {
        if (c.candidate) applied.push(c.candidate);
      },
    } as unknown as RTCPeerConnection;

    const queue: RTCIceCandidateInit[] = [
      { candidate: "candidate:1 1 udp 1 192.168.43.10 5000 typ host" },
      { candidate: "candidate:2 1 udp 1 fe80::1 5001 typ host" },
    ];
    await flushQueuedIceCandidates(mockPc, queue);
    expect(applied).toEqual([
      "candidate:1 1 udp 1 192.168.43.10 5000 typ host",
      "candidate:2 1 udp 1 fe80::1 5001 typ host",
    ]);
    expect(queue.length).toBe(0);
  });
});
