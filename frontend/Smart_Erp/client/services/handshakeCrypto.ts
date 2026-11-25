/**
 * WebCrypto (window.crypto.subtle / globalThis.crypto.subtle) primitives for Student Browser:
 * - Zero private keys stored in repo or localStorage (ephemeral per-attempt keys in memory only)
 * - Ed25519 identity proof signing & Teacher Companion signature verification
 * - X25519 ECDH shared secret + HKDF-SHA256 key derivation + HMAC-SHA256 verification
 */

const HKDF_INFO = new TextEncoder().encode("smart-erp-local-handshake-v1");

export interface EphemeralStudentHandshakeKeys {
  ed25519Pair: CryptoKeyPair;
  x25519Pair: CryptoKeyPair;
  ed25519PublicKeyBase64: string;
  x25519PublicKeyBase64: string;
  studentNonce: string;
}

export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function arrayBufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  return arrayBufferToBase64(buffer).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64ToUint8Array(b64: string): Uint8Array {
  const normalized = b64.trim().replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function generateCsprngNonce(byteLength = 24): string {
  const buf = new Uint8Array(byteLength);
  crypto.getRandomValues(buf);
  return arrayBufferToBase64Url(buf);
}

export async function generateEphemeralStudentKeys(): Promise<EphemeralStudentHandshakeKeys> {
  const subtle = crypto.subtle;
  const ed25519Pair = (await subtle.generateKey(
    { name: "Ed25519" },
    false,
    ["sign", "verify"]
  )) as CryptoKeyPair;

  const x25519Pair = (await subtle.generateKey(
    { name: "X25519" },
    false,
    ["deriveBits"]
  )) as CryptoKeyPair;

  const edSpki = await subtle.exportKey("spki", ed25519Pair.publicKey);
  const xSpki = await subtle.exportKey("spki", x25519Pair.publicKey);

  return {
    ed25519Pair,
    x25519Pair,
    ed25519PublicKeyBase64: arrayBufferToBase64(edSpki),
    x25519PublicKeyBase64: arrayBufferToBase64(xSpki),
    studentNonce: generateCsprngNonce(24),
  };
}

export async function verifyEd25519Signature(
  publicKeySpkiBase64: string,
  canonicalMessage: string,
  signatureBase64: string
): Promise<boolean> {
  try {
    const keyBytes = base64ToUint8Array(publicKeySpkiBase64);
    const sigBytes = base64ToUint8Array(signatureBase64);
    const key = await crypto.subtle.importKey(
      "spki",
      keyBytes.buffer as ArrayBuffer,
      { name: "Ed25519" },
      false,
      ["verify"]
    );
    return await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      sigBytes.buffer as ArrayBuffer,
      new TextEncoder().encode(canonicalMessage)
    );
  } catch {
    return false;
  }
}

export async function signEd25519(
  privateKey: CryptoKey,
  canonicalMessage: string
): Promise<string> {
  const sig = await crypto.subtle.sign(
    { name: "Ed25519" },
    privateKey,
    new TextEncoder().encode(canonicalMessage)
  );
  return arrayBufferToBase64(sig);
}

export async function deriveSessionHmacKey(
  studentX25519PrivateKey: CryptoKey,
  teacherX25519PublicKeyBase64: string,
  ticketId: string,
  sessionUuid: string
): Promise<CryptoKey> {
  const teacherPubBytes = base64ToUint8Array(teacherX25519PublicKeyBase64);
  const teacherX25519Pub = await crypto.subtle.importKey(
    "spki",
    teacherPubBytes.buffer as ArrayBuffer,
    { name: "X25519" },
    false,
    []
  );

  const sharedBits = await crypto.subtle.deriveBits(
    { name: "X25519", public: teacherX25519Pub },
    studentX25519PrivateKey,
    256
  );

  const hkdfBaseKey = await crypto.subtle.importKey(
    "raw",
    sharedBits,
    "HKDF",
    false,
    ["deriveKey"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode(`${ticketId}|${sessionUuid}`),
      info: HKDF_INFO,
    },
    hkdfBaseKey,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign", "verify"]
  );
}

export async function computeHmacSha256Base64(hmacKey: CryptoKey, message: string): Promise<string> {
  const sig = await crypto.subtle.sign(
    "HMAC",
    hmacKey,
    new TextEncoder().encode(message)
  );
  return arrayBufferToBase64(sig);
}

export function buildChallengeTranscript(params: {
  sessionUuid: string;
  ticketId: string;
  studentNonce: string;
  teacherNonce: string;
  challengeExpiresAt: number;
}): string {
  return [
    "HANDSHAKE_CHALLENGE_V1",
    params.sessionUuid,
    params.ticketId,
    params.studentNonce,
    params.teacherNonce,
    String(params.challengeExpiresAt),
  ].join("|");
}

export function buildStudentProofMessage(params: {
  sessionUuid: string;
  ticketId: string;
  studentRef: string;
  studentNonce: string;
  teacherNonce: string;
  teacherEd25519PublicKey: string;
  teacherX25519PublicKey: string;
  studentProofTimestamp: number;
}): string {
  return [
    "STUDENT_PROOF_V1",
    params.sessionUuid,
    params.ticketId,
    params.studentRef,
    params.studentNonce,
    params.teacherNonce,
    params.teacherEd25519PublicKey,
    params.teacherX25519PublicKey,
    String(params.studentProofTimestamp),
  ].join("|");
}

export function buildCompanionReceiptMessage(params: {
  companionReceiptId: string;
  sessionUuid: string;
  teacherId: number;
  studentRef: string;
  ticketId: string;
  teacherNonce: string;
  studentNonce: string;
  clientIp: string;
  teacherEd25519PublicKey: string;
  teacherX25519PublicKey: string;
  studentEd25519PublicKey: string;
  studentX25519PublicKey: string;
  receiptIssuedAt: number;
  receiptExpiresAt: number;
}): string {
  return [
    "COMPANION_RECEIPT_V1",
    params.companionReceiptId,
    params.sessionUuid,
    String(params.teacherId),
    params.studentRef,
    params.ticketId,
    params.teacherNonce,
    params.studentNonce,
    params.clientIp,
    params.teacherEd25519PublicKey,
    params.teacherX25519PublicKey,
    params.studentEd25519PublicKey,
    params.studentX25519PublicKey,
    String(params.receiptIssuedAt),
    String(params.receiptExpiresAt),
  ].join("|");
}
