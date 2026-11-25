import https from "node:https";
import crypto from "node:crypto";
import net from "node:net";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const FORBIDDEN_PROXY_HEADERS = [
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-port",
  "forwarded",
  "via",
  "x-real-ip",
  "cf-connecting-ip",
  "true-client-ip",
  "proxy-client-ip",
  "wl-proxy-client-ip",
];

const HKDF_INFO = Buffer.from("smart-erp-local-handshake-v1", "utf8");

export function normalizeIp(rawIp) {
  if (!rawIp || typeof rawIp !== "string") return "";
  let ip = rawIp.trim();
  const zoneIdx = ip.indexOf("%");
  if (zoneIdx > 0) ip = ip.slice(0, zoneIdx);
  if (ip.startsWith("[") && ip.endsWith("]")) ip = ip.slice(1, -1);
  if (ip.startsWith("::ffff:") && net.isIPv4(ip.slice(7))) {
    ip = ip.slice(7);
  }
  return ip;
}

export function isPrivateLanIp(rawIp) {
  const ip = normalizeIp(rawIp);
  if (!ip) return false;
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [b0, b1] = parts;
    if (b0 === 0 || b0 === 127) return false;
    if (b0 === 169 && b1 === 254) return false;
    if (b0 === 10) return true;
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
    if (b0 === 192 && b1 === 168) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const expanded = expandIpv6Bytes(ip);
    if (!expanded) return false;
    // Reject loopback ::1 and unspecified ::
    if (expanded.every((b) => b === 0)) return false;
    if (expanded.slice(0, 15).every((b) => b === 0) && expanded[15] === 1) return false;
    // Reject link-local fe80::/10 and multicast ff00::/8
    if (expanded[0] === 0xfe && (expanded[1] & 0xc0) === 0x80) return false;
    if (expanded[0] === 0xff) return false;
    // Accept IPv6 Unique Local Address (fc00::/7)
    return (expanded[0] & 0xfe) === 0xfc;
  }
  return false;
}

function ipToBytes(rawIp) {
  const ip = normalizeIp(rawIp);
  if (net.isIPv4(ip)) {
    return Buffer.from(ip.split(".").map(Number));
  }
  if (net.isIPv6(ip)) {
    return expandIpv6Bytes(ip);
  }
  return null;
}

function expandIpv6Bytes(ip) {
  const halves = ip.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":").filter(Boolean) : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":").filter(Boolean) : [];
  const missing = 8 - (left.length + right.length);
  if (halves.length === 1 && left.length !== 8) return null;
  if (missing < 0) return null;
  const groups = [...left, ...Array(missing).fill("0"), ...right];
  if (groups.length !== 8) return null;
  const buf = Buffer.alloc(16);
  for (let i = 0; i < 8; i++) {
    const val = parseInt(groups[i], 16);
    if (Number.isNaN(val) || val < 0 || val > 0xffff) return null;
    buf.writeUInt16BE(val, i * 2);
  }
  return buf;
}

export function isIpInCidr(rawIp, cidr) {
  if (!cidr || !cidr.includes("/")) return false;
  const [netRaw, prefixRaw] = cidr.trim().split("/", 2);
  const ipBytes = ipToBytes(rawIp);
  const netBytes = ipToBytes(netRaw);
  const prefix = Number(prefixRaw);
  if (!ipBytes || !netBytes || ipBytes.length !== netBytes.length) return false;
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > ipBytes.length * 8) return false;

  const fullBytes = Math.floor(prefix / 8);
  const remBits = prefix % 8;
  for (let i = 0; i < fullBytes; i++) {
    if (ipBytes[i] !== netBytes[i]) return false;
  }
  if (remBits > 0) {
    const mask = (~0 << (8 - remBits)) & 0xff;
    if ((ipBytes[fullBytes] & mask) !== (netBytes[fullBytes] & mask)) return false;
  }
  return true;
}

export function parseAndValidateSubnets(rawSubnets, lanIp) {
  const normalizedLan = normalizeIp(lanIp);
  if (!rawSubnets || !rawSubnets.trim()) {
    if (net.isIPv4(normalizedLan)) {
      const parts = normalizedLan.split(".");
      return [`${parts[0]}.${parts[1]}.${parts[2]}.0/24`];
    }
    const bytes = ipToBytes(normalizedLan);
    if (!bytes) throw new Error("Cannot derive default subnet from LAN IP");
    return [
      `${bytes.subarray(0, 2).toString("hex")}:${bytes.subarray(2, 4).toString("hex")}:${bytes.subarray(4, 6).toString("hex")}:${bytes.subarray(6, 8).toString("hex")}::/64`,
    ];
  }
  const cidrs = rawSubnets
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const cidr of cidrs) {
    const [netIp, prefixStr] = cidr.split("/", 2);
    const prefix = Number(prefixStr);
    const cleanNet = normalizeIp(netIp);
    if (net.isIPv4(cleanNet)) {
      const [b0, b1] = cleanNet.split(".").map(Number);
      const validPrivate =
        (b0 === 10 && prefix >= 8 && prefix <= 32) ||
        (b0 === 172 && b1 >= 16 && b1 <= 31 && prefix >= 12 && prefix <= 32) ||
        (b0 === 192 && b1 === 168 && prefix >= 16 && prefix <= 32);
      if (!validPrivate) {
        throw new Error(`Rejected non-private or overly broad IPv4 subnet: ${cidr}`);
      }
    } else if (!isPrivateLanIp(cleanNet) || !Number.isInteger(prefix) || prefix < 16 || prefix > 128) {
      throw new Error(`Rejected invalid or non-ULA IPv6 subnet: ${cidr}`);
    }
  }
  return cidrs;
}

export function detectPrimaryLanIpv4() {
  const ifaces = os.networkInterfaces();
  const preferredOrder = ["en0", "en1", "wlan0", "eth0"];
  const candidates = [];
  for (const [name, list] of Object.entries(ifaces)) {
    for (const addr of list || []) {
      if (addr.family === "IPv4" && !addr.internal && isPrivateLanIp(addr.address)) {
        candidates.push({ name, address: addr.address });
      }
    }
  }
  candidates.sort((a, b) => {
    const ai = preferredOrder.indexOf(a.name);
    const bi = preferredOrder.indexOf(b.name);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  return candidates.length > 0 ? candidates[0].address : null;
}

export function generateEphemeralTlsCredentials(sanIp) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "smart-erp-tls-"));
  const keyPath = path.join(tmpDir, "key.pem");
  const certPath = path.join(tmpDir, "cert.pem");
  const sanEntries = [`IP:${normalizeIp(sanIp)}`];
  if (normalizeIp(sanIp) !== "127.0.0.1") {
    sanEntries.push("IP:127.0.0.1");
  }
  try {
    execFileSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-sha256",
        "-days",
        "1",
        "-keyout",
        keyPath,
        "-out",
        certPath,
        "-subj",
        "/CN=SmartERP-Teacher-Companion/O=SmartERP",
        "-addext",
        `subjectAltName=${sanEntries.join(",")}`,
      ],
      { stdio: "ignore" }
    );
    const key = fs.readFileSync(keyPath, "utf8");
    const cert = fs.readFileSync(certPath, "utf8");
    const x509 = new crypto.X509Certificate(cert);
    return {
      key,
      cert,
      fingerprint256: x509.fingerprint256,
    };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function decodeBase64Flexible(val) {
  const clean = String(val || "").trim();
  if (clean.includes("-") || clean.includes("_")) {
    return Buffer.from(clean.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  }
  return Buffer.from(clean, "base64");
}

function spkiBase64FromPublicKey(publicKey) {
  return publicKey.export({ type: "spki", format: "der" }).toString("base64");
}

function canonicalStudentTicketMessage({
  ticketId,
  sessionUuid,
  studentId,
  studentRef,
  studentEd25519PublicKey,
  studentX25519PublicKey,
  studentNonce,
  issuedAt,
  expiresAt,
}) {
  return [
    "STUDENT_TICKET_V1",
    ticketId || "",
    sessionUuid || "",
    String(studentId),
    studentRef || "",
    studentEd25519PublicKey || "",
    studentX25519PublicKey || "",
    studentNonce || "",
    String(issuedAt),
    String(expiresAt),
  ].join("|");
}

function canonicalStudentProofMessage({
  sessionUuid,
  ticketId,
  studentRef,
  studentNonce,
  teacherNonce,
  teacherEd25519PublicKey,
  teacherX25519PublicKey,
  studentProofTimestamp,
}) {
  return [
    "STUDENT_PROOF_V1",
    sessionUuid || "",
    ticketId || "",
    studentRef || "",
    studentNonce || "",
    teacherNonce || "",
    teacherEd25519PublicKey || "",
    teacherX25519PublicKey || "",
    String(studentProofTimestamp),
  ].join("|");
}

function canonicalCompanionReceiptMessage({
  companionReceiptId,
  sessionUuid,
  teacherId,
  studentRef,
  ticketId,
  teacherNonce,
  studentNonce,
  clientIp,
  teacherEd25519PublicKey,
  teacherX25519PublicKey,
  studentEd25519PublicKey,
  studentX25519PublicKey,
  receiptIssuedAt,
  receiptExpiresAt,
}) {
  return [
    "COMPANION_RECEIPT_V1",
    companionReceiptId || "",
    sessionUuid || "",
    String(teacherId),
    studentRef || "",
    ticketId || "",
    teacherNonce || "",
    studentNonce || "",
    clientIp || "",
    teacherEd25519PublicKey || "",
    teacherX25519PublicKey || "",
    studentEd25519PublicKey || "",
    studentX25519PublicKey || "",
    String(receiptIssuedAt),
    String(receiptExpiresAt),
  ].join("|");
}

/**
 * Creates the hardened HTTPS Teacher Companion server bound to a private LAN interface
 * (or explicit test host when `allowNonLanBindForTests` is set).
 */
export function createCompanionServer(options = {}) {
  const bindIp = normalizeIp(options.bindHost || detectPrimaryLanIpv4() || "");
  if (!bindIp) {
    throw new Error("No private RFC1918 LAN IPv4 interface detected. Connect to classroom Wi-Fi/LAN or pass --host.");
  }
  if (!options.allowNonLanBindForTests && !isPrivateLanIp(bindIp)) {
    throw new Error(`Refusing to bind companion to non-LAN/public IP: ${bindIp}`);
  }

  const port = Number(options.port ?? 8443);
  const adminControlToken =
    options.adminControlToken || crypto.randomBytes(24).toString("base64url");

  let ed25519Pair = crypto.generateKeyPairSync("ed25519");
  let x25519Pair = crypto.generateKeyPairSync("x25519");

  let activeSession = null;
  const pendingChallenges = new Map();
  const consumedReplayIds = new Set();

  const tlsCreds = options.tlsCreds || generateEphemeralTlsCredentials(bindIp);

  const rotateEphemeralKeys = () => {
    ed25519Pair = crypto.generateKeyPairSync("ed25519");
    x25519Pair = crypto.generateKeyPairSync("x25519");
  };

  const getPublicKeys = () => ({
    teacherEd25519PublicKey: spkiBase64FromPublicKey(ed25519Pair.publicKey),
    teacherX25519PublicKey: spkiBase64FromPublicKey(x25519Pair.publicKey),
  });

  const validateDirectLanPeer = (req) => {
    for (const h of FORBIDDEN_PROXY_HEADERS) {
      if (req.headers[h]) {
        const err = new Error(`Forwarded/proxy header rejected: ${h}`);
        err.statusCode = 403;
        throw err;
      }
    }

    const rawPeerIp = options.resolvePeerIp ? options.resolvePeerIp(req) : req.socket.remoteAddress;
    const peerIp = normalizeIp(rawPeerIp);

    if (!options.allowLoopbackPeerForTests && !isPrivateLanIp(peerIp)) {
      const err = new Error(`Rejected non-LAN or public peer IP: ${peerIp || "unknown"}`);
      err.statusCode = 403;
      throw err;
    }

    if (!activeSession || Date.now() > activeSession.expiresAt) {
      const err = new Error("No active companion attendance session (or session expired)");
      err.statusCode = 410;
      throw err;
    }

    const inAllowedSubnet = activeSession.allowedSubnets.some((cidr) => isIpInCidr(peerIp, cidr));
    if (!inAllowedSubnet) {
      const err = new Error(
        `Peer IP ${peerIp} is outside teacher allowlisted subnets [${activeSession.allowedSubnets.join(", ")}]`
      );
      err.statusCode = 403;
      throw err;
    }

    return peerIp;
  };

  const requireAdminAuth = (req) => {
    const header = String(req.headers.authorization || "");
    const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    const tokenBuf = Buffer.from(bearer, "utf8");
    const expectedBuf = Buffer.from(adminControlToken, "utf8");
    if (tokenBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
      const err = new Error("Unauthorized companion control request: invalid admin control token");
      err.statusCode = 401;
      throw err;
    }
  };

  const readJsonBody = (req) =>
    new Promise((resolve, reject) => {
      let raw = "";
      req.on("data", (chunk) => {
        raw += chunk;
        if (raw.length > 64 * 1024) {
          req.destroy();
          reject(new Error("Payload too large"));
        }
      });
      req.on("end", () => {
        try {
          resolve(raw ? JSON.parse(raw) : {});
        } catch {
          const err = new Error("Invalid JSON body");
          err.statusCode = 400;
          reject(err);
        }
      });
      req.on("error", reject);
    });

  const server = https.createServer(
    {
      key: tlsCreds.key,
      cert: tlsCreds.cert,
      minVersion: "TLSv1.2",
    },
    async (req, res) => {
      const origin = req.headers.origin;
      const sendJson = (status, data) => {
        res.writeHead(status, {
          "Content-Type": "application/json",
          ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Cache-Control": "no-store",
        });
        res.end(JSON.stringify(data));
      };

      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        });
        return res.end();
      }

      try {
        const url = new URL(req.url || "/", `https://${req.headers.host || bindIp}`);

        if (req.method === "GET" && url.pathname === "/health") {
          const keys = getPublicKeys();
          return sendJson(200, {
            ok: true,
            protocol: "https",
            bindIp,
            port: server.address()?.port || port,
            certFingerprint256: tlsCreds.fingerprint256,
            sessionActive: Boolean(activeSession && Date.now() <= activeSession.expiresAt),
            activeSessionUuid: activeSession?.sessionUuid || null,
            allowedSubnets: activeSession?.allowedSubnets || [],
            ...keys,
          });
        }

        if (req.method === "GET" && url.pathname === "/companion/keys") {
          requireAdminAuth(req);
          return sendJson(200, {
            ok: true,
            bindIp,
            port: server.address()?.port || port,
            certFingerprint256: tlsCreds.fingerprint256,
            ...getPublicKeys(),
          });
        }

        if (req.method === "POST" && url.pathname === "/companion/session/start") {
          requireAdminAuth(req);
          const body = await readJsonBody(req);
          if (!body.sessionUuid || !body.teacherId || !body.backendPublicKey) {
            return sendJson(400, { ok: false, error: "sessionUuid, teacherId, and backendPublicKey are required" });
          }
          const allowedSubnets = parseAndValidateSubnets(body.allowedSubnets, bindIp);
          // Validate backend public key format immediately
          crypto.createPublicKey({
            key: decodeBase64Flexible(body.backendPublicKey),
            format: "der",
            type: "spki",
          });

          pendingChallenges.clear();
          consumedReplayIds.clear();
          const durationMs = Math.min(Number(body.ttlMs) || 90 * 60 * 1000, 120 * 60 * 1000);
          activeSession = {
            sessionUuid: String(body.sessionUuid),
            teacherId: Number(body.teacherId),
            backendPublicKey: String(body.backendPublicKey).trim(),
            allowedSubnets,
            startedAt: Date.now(),
            expiresAt: Date.now() + durationMs,
          };

          return sendJson(200, {
            ok: true,
            sessionUuid: activeSession.sessionUuid,
            allowedSubnets,
            expiresAt: activeSession.expiresAt,
            ...getPublicKeys(),
          });
        }

        if (req.method === "POST" && url.pathname === "/companion/session/stop") {
          requireAdminAuth(req);
          activeSession = null;
          pendingChallenges.clear();
          consumedReplayIds.clear();
          rotateEphemeralKeys();
          return sendJson(200, { ok: true, stopped: true, keysRotated: true });
        }

        if (req.method === "POST" && url.pathname === "/handshake/challenge") {
          const peerIp = validateDirectLanPeer(req);
          const body = await readJsonBody(req);
          const {
            ticketId,
            sessionUuid,
            studentId,
            studentRef,
            studentEd25519PublicKey,
            studentX25519PublicKey,
            studentNonce,
            issuedAt,
            expiresAt,
            backendTicketSignature,
          } = body;

          if (!ticketId || !sessionUuid || !studentNonce || !backendTicketSignature) {
            return sendJson(400, { ok: false, error: "Missing required handshake ticket fields" });
          }
          if (sessionUuid !== activeSession.sessionUuid) {
            return sendJson(403, { ok: false, error: "Session UUID mismatch with active classroom session" });
          }
          if (Date.now() > Number(expiresAt) || Number(issuedAt) > Number(expiresAt)) {
            return sendJson(401, { ok: false, error: "Student handshake ticket has expired" });
          }
          if (consumedReplayIds.has(`ticket:${ticketId}`) || pendingChallenges.has(ticketId)) {
            return sendJson(409, { ok: false, error: "Replay detected: ticketId already in use or consumed" });
          }

          const backendKeyObj = crypto.createPublicKey({
            key: decodeBase64Flexible(activeSession.backendPublicKey),
            format: "der",
            type: "spki",
          });
          const canonicalTicket = canonicalStudentTicketMessage({
            ticketId,
            sessionUuid,
            studentId,
            studentRef,
            studentEd25519PublicKey,
            studentX25519PublicKey,
            studentNonce,
            issuedAt,
            expiresAt,
          });
          const ticketValid = crypto.verify(
            null,
            Buffer.from(canonicalTicket, "utf8"),
            backendKeyObj,
            decodeBase64Flexible(backendTicketSignature)
          );
          if (!ticketValid) {
            return sendJson(401, { ok: false, error: "Invalid Spring Boot Ed25519 signature on student ticket" });
          }

          // Parse & validate student X25519/Ed25519 keys, perform X25519 ECDH + HKDF-SHA256
          const studentEdKeyObj = crypto.createPublicKey({
            key: decodeBase64Flexible(studentEd25519PublicKey),
            format: "der",
            type: "spki",
          });
          const studentX25519KeyObj = crypto.createPublicKey({
            key: decodeBase64Flexible(studentX25519PublicKey),
            format: "der",
            type: "spki",
          });

          const sharedSecret = crypto.diffieHellman({
            privateKey: x25519Pair.privateKey,
            publicKey: studentX25519KeyObj,
          });
          const sessionHmacKey = Buffer.from(
            crypto.hkdfSync(
              "sha256",
              sharedSecret,
              Buffer.from(`${ticketId}|${sessionUuid}`, "utf8"),
              HKDF_INFO,
              32
            )
          );

          const teacherNonce = crypto.randomBytes(24).toString("base64url");
          const challengeExpiresAt = Date.now() + 30_000;
          const keys = getPublicKeys();
          const challengeMessage = [
            "HANDSHAKE_CHALLENGE_V1",
            sessionUuid,
            ticketId,
            studentNonce,
            teacherNonce,
            String(challengeExpiresAt),
          ].join("|");
          const teacherChallengeSignature = crypto
            .sign(null, Buffer.from(challengeMessage, "utf8"), ed25519Pair.privateKey)
            .toString("base64");

          pendingChallenges.set(ticketId, {
            ticketId,
            sessionUuid,
            studentId,
            studentRef,
            studentNonce,
            teacherNonce,
            peerIp,
            studentEdKeyObj,
            studentEd25519PublicKey: String(studentEd25519PublicKey).trim(),
            studentX25519PublicKey: String(studentX25519PublicKey).trim(),
            sessionHmacKey,
            challengeExpiresAt,
          });

          return sendJson(200, {
            ok: true,
            ticketId,
            sessionUuid,
            teacherId: activeSession.teacherId,
            teacherNonce,
            challengeExpiresAt,
            teacherChallengeSignature,
            ...keys,
          });
        }

        if (req.method === "POST" && url.pathname === "/handshake/complete") {
          const peerIp = validateDirectLanPeer(req);
          const body = await readJsonBody(req);
          const { ticketId, studentProofTimestamp, studentProofSignature, studentHmacProof } = body;

          if (!ticketId || !studentProofTimestamp || !studentProofSignature || !studentHmacProof) {
            return sendJson(400, { ok: false, error: "Missing completion proof fields" });
          }

          const pending = pendingChallenges.get(ticketId);
          if (!pending) {
            return sendJson(404, { ok: false, error: "Challenge not found or already consumed" });
          }
          // Single-use deletion immediately
          pendingChallenges.delete(ticketId);

          if (Date.now() > pending.challengeExpiresAt) {
            return sendJson(401, { ok: false, error: "Handshake challenge expired" });
          }
          if (pending.peerIp !== peerIp) {
            return sendJson(403, { ok: false, error: "Peer IP changed between challenge and completion" });
          }

          const keys = getPublicKeys();
          const canonicalProof = canonicalStudentProofMessage({
            sessionUuid: pending.sessionUuid,
            ticketId: pending.ticketId,
            studentRef: pending.studentRef,
            studentNonce: pending.studentNonce,
            teacherNonce: pending.teacherNonce,
            teacherEd25519PublicKey: keys.teacherEd25519PublicKey,
            teacherX25519PublicKey: keys.teacherX25519PublicKey,
            studentProofTimestamp: Number(studentProofTimestamp),
          });

          const sigOk = crypto.verify(
            null,
            Buffer.from(canonicalProof, "utf8"),
            pending.studentEdKeyObj,
            decodeBase64Flexible(studentProofSignature)
          );
          if (!sigOk) {
            return sendJson(401, { ok: false, error: "Invalid student Ed25519 proof signature" });
          }

          const expectedHmac = crypto
            .createHmac("sha256", pending.sessionHmacKey)
            .update(canonicalProof, "utf8")
            .digest("base64");
          const providedBuf = Buffer.from(String(studentHmacProof).trim(), "utf8");
          const expectedBuf = Buffer.from(expectedHmac, "utf8");
          if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
            return sendJson(401, { ok: false, error: "Invalid X25519/HKDF derived HMAC proof" });
          }

          if (
            consumedReplayIds.has(`ticket:${pending.ticketId}`) ||
            consumedReplayIds.has(`snonce:${pending.studentNonce}`)
          ) {
            return sendJson(409, { ok: false, error: "Replay rejected: ticket or student nonce already used" });
          }
          consumedReplayIds.add(`ticket:${pending.ticketId}`);
          consumedReplayIds.add(`snonce:${pending.studentNonce}`);
          consumedReplayIds.add(`tnonce:${pending.teacherNonce}`);

          const companionReceiptId = `HSR-${crypto.randomUUID()}`;
          const receiptIssuedAt = Date.now();
          const receiptExpiresAt = receiptIssuedAt + 60_000;

          const canonicalReceipt = canonicalCompanionReceiptMessage({
            companionReceiptId,
            sessionUuid: pending.sessionUuid,
            teacherId: activeSession.teacherId,
            studentRef: pending.studentRef,
            ticketId: pending.ticketId,
            teacherNonce: pending.teacherNonce,
            studentNonce: pending.studentNonce,
            clientIp: peerIp,
            teacherEd25519PublicKey: keys.teacherEd25519PublicKey,
            teacherX25519PublicKey: keys.teacherX25519PublicKey,
            studentEd25519PublicKey: pending.studentEd25519PublicKey,
            studentX25519PublicKey: pending.studentX25519PublicKey,
            receiptIssuedAt,
            receiptExpiresAt,
          });

          const teacherReceiptSignature = crypto
            .sign(null, Buffer.from(canonicalReceipt, "utf8"), ed25519Pair.privateKey)
            .toString("base64");
          const receiptHmac = crypto
            .createHmac("sha256", pending.sessionHmacKey)
            .update(canonicalReceipt, "utf8")
            .digest("base64");

          return sendJson(200, {
            ok: true,
            companionReceiptId,
            sessionUuid: pending.sessionUuid,
            teacherId: activeSession.teacherId,
            studentRef: pending.studentRef,
            ticketId: pending.ticketId,
            teacherNonce: pending.teacherNonce,
            studentNonce: pending.studentNonce,
            clientIp: peerIp,
            teacherEd25519PublicKey: keys.teacherEd25519PublicKey,
            teacherX25519PublicKey: keys.teacherX25519PublicKey,
            studentEd25519PublicKey: pending.studentEd25519PublicKey,
            studentX25519PublicKey: pending.studentX25519PublicKey,
            receiptIssuedAt,
            receiptExpiresAt,
            teacherReceiptSignature,
            receiptHmac,
          });
        }

        return sendJson(404, { ok: false, error: "Companion endpoint not found" });
      } catch (err) {
        const status = err?.statusCode || 500;
        return sendJson(status, { ok: false, error: err?.message || "Companion internal error" });
      }
    }
  );

  return {
    server,
    bindIp,
    adminControlToken,
    tlsCertPem: tlsCreds.cert,
    certFingerprint256: tlsCreds.fingerprint256,
    getPublicKeys,
    start() {
      return new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, bindIp, () => {
          server.removeListener("error", reject);
          const addr = server.address();
          resolve({
            bindIp,
            port: typeof addr === "object" && addr ? addr.port : port,
            adminControlToken,
            certFingerprint256: tlsCreds.fingerprint256,
            tlsCertPem: tlsCreds.cert,
            ...getPublicKeys(),
          });
        });
      });
    },
    stop() {
      activeSession = null;
      pendingChallenges.clear();
      consumedReplayIds.clear();
      rotateEphemeralKeys();
      return new Promise((resolve) => {
        server.close(() => resolve());
      });
    },
  };
}
