import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useHttps = env.VITE_HTTPS === "true";

  return {
    server: {
      host: true,
      port: 8080,
      https: useHttps
        ? {
          key: fs.readFileSync("./certs/localhost+3-key.pem"),
          cert: fs.readFileSync("./certs/localhost+3.pem"),
        }
        : undefined,
      allowedHosts: env.VITE_ALLOWED_HOST ? [env.VITE_ALLOWED_HOST] : true,
      fs: {
        allow: ["./client", "./shared", "index.html"],
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
      },
    },
    build: {
      outDir: "dist",
    },


    // ,
    // https: {
    //   key: fs.readFileSync("./certs/localhost+3-key.pem"),
    //   cert: fs.readFileSync("./certs/localhost+3.pem"),
    // },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
  };
});

