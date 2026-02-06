import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        // 1. AGREGAMOS "ave.png" AQUÍ para que se guarde en caché offline
        includeAssets: ["ave.png"],
        
        manifest: {
          name: "BirdIA - Identificador de Aves",
          short_name: "BirdIA",
          description: "Identificación de aves mediante Inteligencia Artificial y audio",
          theme_color: "#ffffff",
          background_color: "#ffffff",
          display: "standalone",
          start_url: "/",
          
          // 2. CONFIGURACIÓN DE ICONOS APUNTANDO A "ave.png"
          icons: [
            {
              src: "/ave.png",   // Ponemos la barra / al inicio por seguridad
              sizes: "192x192",  // El navegador tratará de redimensionar tu imagen a 192px
              type: "image/png",
            },
            {
              src: "/ave.png",   // Usamos la misma imagen
              sizes: "512x512",  // El navegador tratará de redimensionar tu imagen a 512px
              type: "image/png",
            },
            {
              src: "/ave.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable" // Esto permite que Android recorte la imagen en forma de círculo si es necesario
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