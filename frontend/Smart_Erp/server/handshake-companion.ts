import type { RequestHandler } from "express";

/**
 * Legacy Express HTTP handshake handlers are intentionally disabled.
 * Proximity attendance handshakes must run through the HTTPS Teacher Companion
 * (`npm run handshake:companion`) with ephemeral Ed25519 + X25519 + HKDF-SHA256 keys,
 * ephemeral TLS SAN certs, and strict private LAN allowlists.
 */
export const handleLocalHandshake: RequestHandler = (_req, res) => {
  res.status(410).json({
    ok: false,
    error:
      "Unauthenticated HTTP handshake endpoint is disabled. Start the HTTPS Teacher Companion (`npm run handshake:companion`) on your classroom LAN IP.",
  });
};

export const handleCompanionStatus: RequestHandler = (_req, res) => {
  res.status(410).json({
    ok: false,
    error:
      "Express companion proxy is disabled. Query your HTTPS Teacher Companion directly over classroom LAN HTTPS.",
  });
};
