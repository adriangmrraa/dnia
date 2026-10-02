import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// El IDL del gate se importa desde ../target/idl (generado por anchor build)
// y los fuentes services/*.ts?raw para la tab Adopción — por eso fs.allow "..".
// /svc/<x|y|z>/* proxea a los servicios locales (evita CORS: el browser nunca
// sale del origin del dashboard).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: { allow: [".."] },
    proxy: {
      "/svc/issuer": {
        target: "http://localhost:3401",
        rewrite: (p) => p.replace(/^\/svc\/issuer/, ""),
      },
      "/svc/x": {
        target: "http://localhost:3402",
        rewrite: (p) => p.replace(/^\/svc\/x/, ""),
      },
      "/svc/y": {
        target: "http://localhost:3403",
        rewrite: (p) => p.replace(/^\/svc\/y/, ""),
      },
      "/svc/z": {
        target: "http://localhost:3405",
        rewrite: (p) => p.replace(/^\/svc\/z/, ""),
      },
      "/svc/runner": {
        target: "http://localhost:3406",
        rewrite: (p) => p.replace(/^\/svc\/runner/, ""),
      },
    },
  },
});
