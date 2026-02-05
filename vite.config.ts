import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// 1. Cambiamos 'defineConfig' para que sea una función que recibe el modo (development/production)
export default defineConfig(({ mode }) => {
  // 2. Cargamos las variables de entorno (como VITE_API_URL) desde el archivo .env
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "robots.txt"],
        manifest: {
          name: "Identificador de Aves",
          short_name: "Aves",
          description: "Identificación de aves por audio e imagen",
          theme_color: "#198754",
          background_color: "#ffffff",
          display: "standalone",
          start_url: "/",
          icons: [
            {
              src: "icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      }),
    ],

    server: {
      proxy: {
        "/api": {
          // 3. AQUI ESTÁ LA MAGIA: Usamos la variable cargada del .env
          target: env.VITE_API_URL, 
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});