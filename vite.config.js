import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// Permite abrir el sitio desde un enlace de Cloudflare Tunnel (cloudflared tunnel --url ...)
const tunnelHosts = [".trycloudflare.com"];

export default defineConfig({
  plugins: [tailwindcss()],
  server: { allowedHosts: tunnelHosts },
  preview: { allowedHosts: tunnelHosts },
  // Dos páginas: la landing (index.html) y el sistema de búsqueda (buscar.html)
  build: {
    rolldownOptions: {
      input: { landing: "index.html", sistema: "buscar.html" },
    },
  },
});
