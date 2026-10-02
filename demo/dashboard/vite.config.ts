import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// El IDL del gate se importa desde ../target/idl (generado por anchor build).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, fs: { allow: [".."] } },
});
