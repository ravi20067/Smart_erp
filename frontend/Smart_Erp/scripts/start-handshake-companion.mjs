import { createCompanionServer, detectPrimaryLanIpv4 } from "./companion-core.mjs";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--host" && argv[i + 1]) args.host = argv[++i];
    else if (token === "--port" && argv[i + 1]) args.port = Number(argv[++i]);
    else if (token === "--token" && argv[i + 1]) args.token = argv[++i];
  }
  return args;
}

const cli = parseArgs(process.argv.slice(2));
const lanHost = cli.host || process.env.COMPANION_HOST || detectPrimaryLanIpv4();
const port = cli.port || Number(process.env.COMPANION_PORT || 8443);

if (!lanHost) {
  console.error("[SmartERP Companion] ERROR: Could not detect a private RFC 1918 LAN IPv4 address. Pass --host <lan-ip>.");
  process.exit(1);
}

const companion = createCompanionServer({
  bindHost: lanHost,
  port,
  adminControlToken: cli.token || process.env.COMPANION_ADMIN_TOKEN,
});

const info = await companion.start();
console.log("");
console.log("===================================================================");
console.log(" Smart ERP Cryptographic Classroom Handshake Companion (HTTPS/TLS) ");
console.log("===================================================================");
console.log(` Listening URL          : https://${info.bindIp}:${info.port}`);
console.log(` TLS Cert SHA-256       : ${info.certFingerprint256}`);
console.log(` Admin Control Token    : ${info.adminControlToken}`);
console.log(` Teacher Ed25519 PubKey : ${info.teacherEd25519PublicKey}`);
console.log(` Teacher X25519 PubKey  : ${info.teacherX25519PublicKey}`);
console.log("");
console.log(" SECURITY NOTES:");
console.log("  * Bound strictly to private LAN IP. Public IPs & proxy headers are blocked.");
console.log("  * Self-signed SAN TLS cert generated in memory; open the Listening URL once in browser");
console.log("    (or trust its SHA-256 fingerprint) before student/teacher browser calls from HTTPS.");
console.log("  * Private keys remain strictly inside this process and reset on session stop/exit.");
console.log("===================================================================");
console.log("");

const shutdown = async () => {
  console.log("\n[SmartERP Companion] Shutting down and wiping ephemeral session keys...");
  await companion.stop();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
