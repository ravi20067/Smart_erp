import https from "node:https";
import crypto from "node:crypto";
import { describe, it, expect, afterEach } from "vitest";
import { createCompanionServer, detectPrimaryLanIpv4 } from "./companion-core.mjs";
import {
  generateEphemeralStudentKeys,
  verifyEd25519Signature,
  deriveSessionHmacKey,
  signEd25519,
  computeHmacSha256Base64,
  buildChallengeTranscript,
  buildStudentProofMessage,
  buildCompanionReceiptMessage,
} from "../client/services/handshakeCrypto";

function httpsRequestJson({
  port,
  host,
  path,
  method = "GET",
  headers = {},
  body,
  ca,
  rejectUnauthorized = true,
}: {
  port: number;
  host: string;
  path: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  ca?: string;
  rejectUnauthorized?: boolean;
}): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const payload = body !== undefined ? JSON.stringify(body) : undefined;
    const req = https.request(
      {
        host,
        port,
        path,
        method,
        ca,
        rejectUnauthorized,
        headers: {
          ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}),
          ...headers,
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          resolve({ status: res.statusCode || 0, data: raw ? JSON.parse(raw) : {} });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

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

describe("Teacher HTTPS Companion Real-Socket Cryptographic & LAN Security", () => {
  const activeServers: Array<{ stop: () => Promise<void> }> = [];
  let peerIpOverride = "192.168.1.45";

  afterEach(async () => {
    while (activeServers.length > 0) {
      const s = activeServers.pop();
      if (s) await s.stop();
    }
    peerIpOverride = "192.168.1.45";
  });

  async function bootTestCompanion(allowedSubnets = "192.168.1.0/24") {
    const backendPair = crypto.generateKeyPairSync("ed25519");
    const backendPublicKey = backendPair.publicKey
      .export({ type: "spki", format: "der" })
      .toString("base64");

    const companion = createCompanionServer({
      bindHost: "127.0.0.1",
      port: 0,
      allowNonLanBindForTests: true,
      allowLoopbackPeerForTests: false,
      resolvePeerIp: () => peerIpOverride,
    });
    activeServers.push(companion);
    const info = await companion.start();

    const startRes = await httpsRequestJson({
      host: "127.0.0.1",
      port: info.port,
      ca: info.tlsCertPem,
      path: "/companion/session/start",
      method: "POST",
      headers: { Authorization: `Bearer ${info.adminControlToken}` },
      body: {
        sessionUuid: "SESS-REAL-NET-1",
        teacherId: 42,
        backendPublicKey,
        allowedSubnets,
      },
    });
    expect(startRes.status).toBe(200);
    return { companion, info, backendPair, backendPublicKey };
  }

  it("executes real TLS + WebCrypto Ed25519 + X25519/HKDF-SHA256 handshake over real sockets", async () => {
    const { info, backendPair, backendPublicKey } = await bootTestCompanion();

    const studentKeys = await generateEphemeralStudentKeys();
    const ticket = issueSignedTestTicket({
      backendPrivateKey: backendPair.privateKey,
      backendPublicKey,
      sessionUuid: "SESS-REAL-NET-1",
      studentId: 1001,
      studentRef: "REG-2026-1001",
      studentEd25519PublicKey: studentKeys.ed25519PublicKeyBase64,
      studentX25519PublicKey: studentKeys.x25519PublicKeyBase64,
      studentNonce: studentKeys.studentNonce,
    });

    const challengeRes = await httpsRequestJson({
      host: "127.0.0.1",
      port: info.port,
      ca: info.tlsCertPem,
      path: "/handshake/challenge",
      method: "POST",
      body: ticket,
    });
    expect(challengeRes.status).toBe(200);
    expect(challengeRes.data.teacherEd25519PublicKey).toBe(info.teacherEd25519PublicKey);

    const challengeValid = await verifyEd25519Signature(
      info.teacherEd25519PublicKey,
      buildChallengeTranscript({
        sessionUuid: "SESS-REAL-NET-1",
        ticketId: ticket.ticketId,
        studentNonce: ticket.studentNonce,
        teacherNonce: challengeRes.data.teacherNonce,
        challengeExpiresAt: challengeRes.data.challengeExpiresAt,
      }),
      challengeRes.data.teacherChallengeSignature
    );
    expect(challengeValid).toBe(true);

    const sessionHmacKey = await deriveSessionHmacKey(
      studentKeys.x25519Pair.privateKey,
      info.teacherX25519PublicKey,
      ticket.ticketId,
      "SESS-REAL-NET-1"
    );

    const studentProofTimestamp = Date.now();
    const proofMsg = buildStudentProofMessage({
      sessionUuid: "SESS-REAL-NET-1",
      ticketId: ticket.ticketId,
      studentRef: ticket.studentRef,
      studentNonce: ticket.studentNonce,
      teacherNonce: challengeRes.data.teacherNonce,
      teacherEd25519PublicKey: info.teacherEd25519PublicKey,
      teacherX25519PublicKey: info.teacherX25519PublicKey,
      studentProofTimestamp,
    });
    const studentProofSignature = await signEd25519(studentKeys.ed25519Pair.privateKey, proofMsg);
    const studentHmacProof = await computeHmacSha256Base64(sessionHmacKey, proofMsg);

    const completeRes = await httpsRequestJson({
      host: "127.0.0.1",
      port: info.port,
      ca: info.tlsCertPem,
      path: "/handshake/complete",
      method: "POST",
      body: {
        ticketId: ticket.ticketId,
        studentProofTimestamp,
        studentProofSignature,
        studentHmacProof,
      },
    });
    expect(completeRes.status).toBe(200);
    expect(completeRes.data.clientIp).toBe("192.168.1.45");

    const receiptValid = await verifyEd25519Signature(
      info.teacherEd25519PublicKey,
      buildCompanionReceiptMessage(completeRes.data),
      completeRes.data.teacherReceiptSignature
    );
    expect(receiptValid).toBe(true);
  });

  it("rejects untrusted TLS certificate when CA is not pinned (TLS cert validation failure)", async () => {
    const { info } = await bootTestCompanion();
    await expect(
      httpsRequestJson({
        host: "127.0.0.1",
        port: info.port,
        path: "/health",
        rejectUnauthorized: true,
      })
    ).rejects.toThrow(/self-signed|unable to verify|certificate/i);
  });

  it("rejects public IP addresses and non-allowlisted subnets over real HTTPS", async () => {
    const { info, backendPair, backendPublicKey } = await bootTestCompanion("192.168.1.0/24");
    const studentKeys = await generateEphemeralStudentKeys();
    const ticket = issueSignedTestTicket({
      backendPrivateKey: backendPair.privateKey,
      backendPublicKey,
      sessionUuid: "SESS-REAL-NET-1",
      studentId: 1002,
      studentRef: "REG-2026-1002",
      studentEd25519PublicKey: studentKeys.ed25519PublicKeyBase64,
      studentX25519PublicKey: studentKeys.x25519PublicKeyBase64,
      studentNonce: studentKeys.studentNonce,
    });

    peerIpOverride = "8.8.8.8";
    const pubRes = await httpsRequestJson({
      host: "127.0.0.1",
      port: info.port,
      ca: info.tlsCertPem,
      path: "/handshake/challenge",
      method: "POST",
      body: ticket,
    });
    expect(pubRes.status).toBe(403);
    expect(pubRes.data.error).toMatch(/public peer IP/i);

    peerIpOverride = "192.168.55.20";
    const subnetRes = await httpsRequestJson({
      host: "127.0.0.1",
      port: info.port,
      ca: info.tlsCertPem,
      path: "/handshake/challenge",
      method: "POST",
      body: ticket,
    });
    expect(subnetRes.status).toBe(403);
    expect(subnetRes.data.error).toMatch(/outside teacher allowlisted subnets/i);
  });

  it("rejects forwarded and proxy headers (X-Forwarded-For, Forwarded, Via, X-Real-IP)", async () => {
    const { info, backendPair, backendPublicKey } = await bootTestCompanion();
    const studentKeys = await generateEphemeralStudentKeys();
    const ticket = issueSignedTestTicket({
      backendPrivateKey: backendPair.privateKey,
      backendPublicKey,
      sessionUuid: "SESS-REAL-NET-1",
      studentId: 1003,
      studentRef: "REG-2026-1003",
      studentEd25519PublicKey: studentKeys.ed25519PublicKeyBase64,
      studentX25519PublicKey: studentKeys.x25519PublicKeyBase64,
      studentNonce: studentKeys.studentNonce,
    });

    for (const h of ["X-Forwarded-For", "Forwarded", "Via", "X-Real-IP"]) {
      const res = await httpsRequestJson({
        host: "127.0.0.1",
        port: info.port,
        ca: info.tlsCertPem,
        path: "/handshake/challenge",
        method: "POST",
        headers: { [h]: "198.51.100.77" },
        body: ticket,
      });
      expect(res.status).toBe(403);
      expect(res.data.error).toMatch(/proxy header rejected/i);
    }
  });

  it("rejects expired tickets, replayed nonces/tickets, tampered HMAC, and concurrent duplicate completes", async () => {
    const { info, backendPair, backendPublicKey } = await bootTestCompanion();
    const studentKeys = await generateEphemeralStudentKeys();

    // Expired ticket -> 401
    const expiredTicket = issueSignedTestTicket({
      backendPrivateKey: backendPair.privateKey,
      backendPublicKey,
      sessionUuid: "SESS-REAL-NET-1",
      studentId: 1004,
      studentRef: "REG-2026-1004",
      studentEd25519PublicKey: studentKeys.ed25519PublicKeyBase64,
      studentX25519PublicKey: studentKeys.x25519PublicKeyBase64,
      studentNonce: studentKeys.studentNonce,
      expiresAt: Date.now() - 5000,
    });
    const expiredRes = await httpsRequestJson({
      host: "127.0.0.1",
      port: info.port,
      ca: info.tlsCertPem,
      path: "/handshake/challenge",
      method: "POST",
      body: expiredTicket,
    });
    expect(expiredRes.status).toBe(401);

    // Valid challenge -> concurrent double /handshake/complete burst
    const validTicket = issueSignedTestTicket({
      backendPrivateKey: backendPair.privateKey,
      backendPublicKey,
      sessionUuid: "SESS-REAL-NET-1",
      studentId: 1004,
      studentRef: "REG-2026-1004",
      studentEd25519PublicKey: studentKeys.ed25519PublicKeyBase64,
      studentX25519PublicKey: studentKeys.x25519PublicKeyBase64,
      studentNonce: studentKeys.studentNonce,
    });
    const ch = await httpsRequestJson({
      host: "127.0.0.1",
      port: info.port,
      ca: info.tlsCertPem,
      path: "/handshake/challenge",
      method: "POST",
      body: validTicket,
    });
    expect(ch.status).toBe(200);

    const sessionHmacKey = await deriveSessionHmacKey(
      studentKeys.x25519Pair.privateKey,
      info.teacherX25519PublicKey,
      validTicket.ticketId,
      "SESS-REAL-NET-1"
    );
    const ts = Date.now();
    const msg = buildStudentProofMessage({
      sessionUuid: "SESS-REAL-NET-1",
      ticketId: validTicket.ticketId,
      studentRef: validTicket.studentRef,
      studentNonce: validTicket.studentNonce,
      teacherNonce: ch.data.teacherNonce,
      teacherEd25519PublicKey: info.teacherEd25519PublicKey,
      teacherX25519PublicKey: info.teacherX25519PublicKey,
      studentProofTimestamp: ts,
    });
    const sig = await signEd25519(studentKeys.ed25519Pair.privateKey, msg);
    const hmac = await computeHmacSha256Base64(sessionHmacKey, msg);

    const [c1, c2] = await Promise.all([
      httpsRequestJson({
        host: "127.0.0.1",
        port: info.port,
        ca: info.tlsCertPem,
        path: "/handshake/complete",
        method: "POST",
        body: { ticketId: validTicket.ticketId, studentProofTimestamp: ts, studentProofSignature: sig, studentHmacProof: hmac },
      }),
      httpsRequestJson({
        host: "127.0.0.1",
        port: info.port,
        ca: info.tlsCertPem,
        path: "/handshake/complete",
        method: "POST",
        body: { ticketId: validTicket.ticketId, studentProofTimestamp: ts, studentProofSignature: sig, studentHmacProof: hmac },
      }),
    ]);
    const statuses = [c1.status, c2.status].sort();
    expect(statuses).toEqual([200, 404]);

    // Replay same ticket on /handshake/challenge -> 409
    const replayRes = await httpsRequestJson({
      host: "127.0.0.1",
      port: info.port,
      ca: info.tlsCertPem,
      path: "/handshake/challenge",
      method: "POST",
      body: validTicket,
    });
    expect(replayRes.status).toBe(409);

    // Tampered HMAC / modified proof rejected with 401
    const ticket2 = issueSignedTestTicket({
      backendPrivateKey: backendPair.privateKey,
      backendPublicKey,
      sessionUuid: "SESS-REAL-NET-1",
      studentId: 1004,
      studentRef: "REG-2026-1004",
      studentEd25519PublicKey: studentKeys.ed25519PublicKeyBase64,
      studentX25519PublicKey: studentKeys.x25519PublicKeyBase64,
      studentNonce: studentKeys.studentNonce,
    });
    const ch2 = await httpsRequestJson({
      host: "127.0.0.1",
      port: info.port,
      ca: info.tlsCertPem,
      path: "/handshake/challenge",
      method: "POST",
      body: ticket2,
    });
    const ts2 = Date.now();
    const msg2 = buildStudentProofMessage({
      sessionUuid: "SESS-REAL-NET-1",
      ticketId: ticket2.ticketId,
      studentRef: ticket2.studentRef,
      studentNonce: ticket2.studentNonce,
      teacherNonce: ch2.data.teacherNonce,
      teacherEd25519PublicKey: info.teacherEd25519PublicKey,
      teacherX25519PublicKey: info.teacherX25519PublicKey,
      studentProofTimestamp: ts2,
    });
    const sig2 = await signEd25519(studentKeys.ed25519Pair.privateKey, msg2);
    const badHmacRes = await httpsRequestJson({
      host: "127.0.0.1",
      port: info.port,
      ca: info.tlsCertPem,
      path: "/handshake/complete",
      method: "POST",
      body: {
        ticketId: ticket2.ticketId,
        studentProofTimestamp: ts2,
        studentProofSignature: sig2,
        studentHmacProof: Buffer.from("forged-hmac-value").toString("base64"),
      },
    });
    expect(badHmacRes.status).toBe(401);
  });

  it("tears down active session and rotates keys when stopped", async () => {
    const { info, backendPair, backendPublicKey } = await bootTestCompanion();
    const stopRes = await httpsRequestJson({
      host: "127.0.0.1",
      port: info.port,
      ca: info.tlsCertPem,
      path: "/companion/session/stop",
      method: "POST",
      headers: { Authorization: `Bearer ${info.adminControlToken}` },
    });
    expect(stopRes.status).toBe(200);
    expect(stopRes.data.keysRotated).toBe(true);

    const health = await httpsRequestJson({
      host: "127.0.0.1",
      port: info.port,
      ca: info.tlsCertPem,
      path: "/health",
    });
    expect(health.data.sessionActive).toBe(false);
    expect(health.data.teacherEd25519PublicKey).not.toBe(info.teacherEd25519PublicKey);

    const studentKeys = await generateEphemeralStudentKeys();
    const ticket = issueSignedTestTicket({
      backendPrivateKey: backendPair.privateKey,
      backendPublicKey,
      sessionUuid: "SESS-REAL-NET-1",
      studentId: 1005,
      studentRef: "REG-2026-1005",
      studentEd25519PublicKey: studentKeys.ed25519PublicKeyBase64,
      studentX25519PublicKey: studentKeys.x25519PublicKeyBase64,
      studentNonce: studentKeys.studentNonce,
    });
    const afterStopChallenge = await httpsRequestJson({
      host: "127.0.0.1",
      port: info.port,
      ca: info.tlsCertPem,
      path: "/handshake/challenge",
      method: "POST",
      body: ticket,
    });
    expect(afterStopChallenge.status).toBe(410);
  });

  it("binds and completes full HTTPS cryptographic handshake over the real OS private LAN interface", async () => {
    const lanIp = detectPrimaryLanIpv4();
    if (!lanIp) {
      throw new Error("Expected active RFC 1918 LAN IPv4 interface on host for real-network test");
    }

    const backendPair = crypto.generateKeyPairSync("ed25519");
    const backendPublicKey = backendPair.publicKey
      .export({ type: "spki", format: "der" })
      .toString("base64");

    // Zero test overrides: binds strictly to real LAN IP and validates real kernel remoteAddress
    const companion = createCompanionServer({
      bindHost: lanIp,
      port: 0,
    });
    activeServers.push(companion);
    const info = await companion.start();
    expect(info.bindIp).toBe(lanIp);

    const startRes = await httpsRequestJson({
      host: lanIp,
      port: info.port,
      ca: info.tlsCertPem,
      path: "/companion/session/start",
      method: "POST",
      headers: { Authorization: `Bearer ${info.adminControlToken}` },
      body: {
        sessionUuid: "SESS-REAL-LAN-SOCKET",
        teacherId: 77,
        backendPublicKey,
      },
    });
    expect(startRes.status).toBe(200);

    const studentKeys = await generateEphemeralStudentKeys();
    const ticket = issueSignedTestTicket({
      backendPrivateKey: backendPair.privateKey,
      backendPublicKey,
      sessionUuid: "SESS-REAL-LAN-SOCKET",
      studentId: 88,
      studentRef: "REG-LAN-088",
      studentEd25519PublicKey: studentKeys.ed25519PublicKeyBase64,
      studentX25519PublicKey: studentKeys.x25519PublicKeyBase64,
      studentNonce: studentKeys.studentNonce,
    });

    const ch = await httpsRequestJson({
      host: lanIp,
      port: info.port,
      ca: info.tlsCertPem,
      path: "/handshake/challenge",
      method: "POST",
      body: ticket,
    });
    expect(ch.status).toBe(200);

    const sessionHmacKey = await deriveSessionHmacKey(
      studentKeys.x25519Pair.privateKey,
      info.teacherX25519PublicKey,
      ticket.ticketId,
      "SESS-REAL-LAN-SOCKET"
    );
    const ts = Date.now();
    const msg = buildStudentProofMessage({
      sessionUuid: "SESS-REAL-LAN-SOCKET",
      ticketId: ticket.ticketId,
      studentRef: ticket.studentRef,
      studentNonce: ticket.studentNonce,
      teacherNonce: ch.data.teacherNonce,
      teacherEd25519PublicKey: info.teacherEd25519PublicKey,
      teacherX25519PublicKey: info.teacherX25519PublicKey,
      studentProofTimestamp: ts,
    });
    const sig = await signEd25519(studentKeys.ed25519Pair.privateKey, msg);
    const hmac = await computeHmacSha256Base64(sessionHmacKey, msg);

    const completeRes = await httpsRequestJson({
      host: lanIp,
      port: info.port,
      ca: info.tlsCertPem,
      path: "/handshake/complete",
      method: "POST",
      body: {
        ticketId: ticket.ticketId,
        studentProofTimestamp: ts,
        studentProofSignature: sig,
        studentHmacProof: hmac,
      },
    });
    expect(completeRes.status).toBe(200);
    expect(completeRes.data.clientIp).toBe(lanIp);
    const valid = await verifyEd25519Signature(
      info.teacherEd25519PublicKey,
      buildCompanionReceiptMessage(completeRes.data),
      completeRes.data.teacherReceiptSignature
    );
    expect(valid).toBe(true);
  });
});
