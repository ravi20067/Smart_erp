import { ed25519, x25519 } from "@noble/curves/ed25519.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";

/**
 * Vetted pure-JS cryptography using audited @noble/curves (RFC 8032 Ed25519, RFC 7748 X25519)
 * and @noble/hashes (RFC 5869 HKDF-SHA256, HMAC-SHA256) with X.509 SPKI DER encoding
 * matching Java 21 JCA (`X509EncodedKeySpec`) byte-for-byte.
 *
 * Works across BOTH HTTPS and local HTTP Wi-Fi/Hotspot origins (never depends on window.crypto.subtle),
 * keeps zero private keys in source code or storage, and zeros private key buffers on teardown.
 */

const HKDF_INFO = new TextEncoder().encode("smart-erp-local-handshake-v1");
const ED25519_SPKI_PREFIX = new Uint8Array([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00]);
const X25519_SPKI_PREFIX = new Uint8Array([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x03, 0x21, 0x00]);

export interface EphemeralHandshakeKeys {
  ed25519PrivateKey: Uint8Array;
  ed25519PublicKeyRaw: Uint8Array;
  x25519PrivateKey: Uint8Array;
  x25519PublicKeyRaw: Uint8Array;
  ed25519PublicKeyBase64: string; // X.509 SPKI DER Base64 (for Java JDK 21)
  x25519PublicKeyBase64: string; // X.509 SPKI DER Base64 (for Java JDK 21)
  studentNonce: string;
  wipe: () => void;
}

export type EphemeralStudentHandshakeKeys = EphemeralHandshakeKeys;

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

function encodeSpki(prefix: Uint8Array, raw32: Uint8Array): string {
  const spki = new Uint8Array(prefix.length + raw32.length);
  spki.set(prefix, 0);
  spki.set(raw32, prefix.length);
  return arrayBufferToBase64(spki);
}

function decodeSpki(prefix: Uint8Array, spkiBase64: string, label: string): Uint8Array {
  const der = base64ToUint8Array(spkiBase64);
  if (der.length === 32) {
    return der;
  }
  if (der.length !== prefix.length + 32) {
    throw new Error(`Invalid ${label} SPKI DER length: ${der.length}`);
  }
  for (let i = 0; i < prefix.length; i += 1) {
    if (der[i] !== prefix[i]) {
      throw new Error(`Invalid ${label} SPKI OID header`);
    }
  }
  return der.subarray(prefix.length);
}

export function generateCsprngNonce(byteLength = 24): string {
  const buf = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(buf);
  return arrayBufferToBase64Url(buf);
}

export async function generateEphemeralStudentKeys(): Promise<EphemeralHandshakeKeys> {
  const edPair = ed25519.keygen();
  const xPair = x25519.keygen();

  const ed25519PrivateKey = new Uint8Array(edPair.secretKey);
  const ed25519PublicKeyRaw = new Uint8Array(edPair.publicKey);
  const x25519PrivateKey = new Uint8Array(xPair.secretKey);
  const x25519PublicKeyRaw = new Uint8Array(xPair.publicKey);

  return {
    ed25519PrivateKey,
    ed25519PublicKeyRaw,
    x25519PrivateKey,
    x25519PublicKeyRaw,
    ed25519PublicKeyBase64: encodeSpki(ED25519_SPKI_PREFIX, ed25519PublicKeyRaw),
    x25519PublicKeyBase64: encodeSpki(X25519_SPKI_PREFIX, x25519PublicKeyRaw),
    studentNonce: generateCsprngNonce(24),
    wipe: () => {
      ed25519PrivateKey.fill(0);
      x25519PrivateKey.fill(0);
    },
  };
}

export async function verifyEd25519Signature(
  publicKeySpkiBase64: string,
  canonicalMessage: string,
  signatureBase64: string
): Promise<boolean> {
  try {
    const pubRaw = decodeSpki(ED25519_SPKI_PREFIX, publicKeySpkiBase64, "Ed25519");
    const sigBytes = base64ToUint8Array(signatureBase64);
    const msgBytes = new TextEncoder().encode(canonicalMessage);
    return ed25519.verify(sigBytes, msgBytes, pubRaw);
  } catch {
    return false;
  }
}

export async function signEd25519(
  privateKeyBytes: Uint8Array,
  canonicalMessage: string
): Promise<string> {
  const msgBytes = new TextEncoder().encode(canonicalMessage);
  const sig = ed25519.sign(msgBytes, privateKeyBytes);
  return arrayBufferToBase64(sig);
}

export async function deriveSessionHmacKey(
  ownX25519PrivateKey: Uint8Array,
  peerX25519PublicKeySpkiBase64: string,
  ticketId: string,
  sessionUuid: string
): Promise<Uint8Array> {
  const peerPubRaw = decodeSpki(X25519_SPKI_PREFIX, peerX25519PublicKeySpkiBase64, "X25519");
  const sharedSecret = x25519.getSharedSecret(ownX25519PrivateKey, peerPubRaw);
  const salt = new TextEncoder().encode(`${ticketId}|${sessionUuid}`);
  return hkdf(sha256, sharedSecret, salt, HKDF_INFO, 32);
}

export async function computeHmacSha256Base64(hmacKeyBytes: Uint8Array, message: string): Promise<string> {
  const tag = hmac(sha256, hmacKeyBytes, new TextEncoder().encode(message));
  return arrayBufferToBase64(tag);
}

export function buildStudentTicketMessage(params: {
  ticketId: string;
  sessionUuid: string;
  studentId: number;
  studentRef: string;
  studentEd25519PublicKey: string;
  studentX25519PublicKey: string;
  studentNonce: string;
  issuedAt: number;
  expiresAt: number;
}): string {
  return [
    "STUDENT_TICKET_V1",
    params.ticketId,
    params.sessionUuid,
    String(params.studentId),
    params.studentRef,
    params.studentEd25519PublicKey,
    params.studentX25519PublicKey,
    params.studentNonce,
    String(params.issuedAt),
    String(params.expiresAt),
  ].join("|");
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
