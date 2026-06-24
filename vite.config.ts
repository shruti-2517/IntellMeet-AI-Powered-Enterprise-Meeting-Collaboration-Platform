import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function intellMeetLogoPlugin() {
  return {
    name: "vite-plugin-intellmeet-logo",
    configureServer(server: any) {
      server.httpServer?.once("listening", () => {
        const logo = `
\x1b[36m██╗███╗   ██╗████████╗███████╗██╗     ██╗     ███╗   ███╗███████╗███████╗████████╗
██║████╗  ██║╚══██╔══╝██╔════╝██║     ██║     ████╗ ████║██╔════╝██╔════╝╚══██╔══╝
██║██╔██╗ ██║   ██║   █████╗  ██║     ██║     ██╔████╔██║█████╗  █████╗     ██║   
██║██║╚██╗██║   ██║   ██╔══╝  ██║     ██║     ██║╚██╔╝██║██╔══╝  ██╔══╝     ██║   
██║██║ ╚████║   ██║   ███████╗███████╗███████╗██║ ╚═╝ ██║███████╗███████╗   ██║   
╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚══════╝╚══════╝╚═╝     ╚═╝╚══════╝╚══════╝   ╚═╝\x1b[0m

\x1b[35m🚀 IntellMeet Frontend Server is up and running! 🚀\x1b[0m
\x1b[34m============================================================\x1b[0m
        `;
        console.log(logo);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), intellMeetLogoPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
