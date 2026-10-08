import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// Permite abrir el sitio desde un enlace de Cloudflare Tunnel (cloudflared tunnel --url ...)
const tunnelHosts = [".trycloudflare.com"];

export default defineConfig({
  plugins: [tailwindcss()],
  server: { allowedHosts: tunnelHosts },
  preview: { allowedHosts: tunnelHosts },
});
