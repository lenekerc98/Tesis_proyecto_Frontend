import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      basicSsl(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
        },
        // 1. AGREGAMOS "ave.png" AQUÍ para que se guarde en caché offline
        includeAssets: ["ave.png"],

        manifest: {
          name: "BirdIA - Identificador de Aves",
          short_name: "BirdIA",
          description: "Identificación de aves mediante Inteligencia Artificial y audio",
          theme_color: "#2cba93",
          background_color: "#ffffff",
          display: "standalone",
          start_url: "/",

          // 2. CONFIGURACIÓN DE ICONOS APUNTANDO A "ave.png"
          icons: [
            {
              src: "/ave.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "/ave.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any"
            }
          ],
        },
      }),
    ],

    server: {
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "https://tesis-proyecto-backend.onrender.com/",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});