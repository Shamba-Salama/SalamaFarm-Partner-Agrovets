// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Live API. Previous EC2 origin kept for reference:
// const djangoOrigin = (process.env.DJANGO_API_ORIGIN || "http://34.255.196.223:8000").replace(/\/$/, "");
const djangoOrigin = (
  process.env.DJANGO_API_ORIGIN ||
  (process.env.NODE_ENV === "production" ? "https://api.salamafarm.com" : "http://127.0.0.1:8000")
).replace(/\/$/, "");

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Do not set ssr.optimizeDeps.include for @tanstack/* — pre-bundling can resolve a second
  // copy of react and break SSR with "Invalid hook call" / useContext on null.
  // Local browser → /api/** → API server (no CORS). Vercel build uses Nitro proxy the same way.
  vite: {
    server: {
      // Lovable defaults to host `::`; on Windows, HMR WebSockets often fail when the tab uses localhost.
      host: "127.0.0.1",
      strictPort: true,
      hmr: {
        host: "127.0.0.1",
        port: 8080,
        clientPort: 8080,
      },
      proxy: {
        "/api": {
          target: djangoOrigin,
          changeOrigin: true,
          secure: true,
        },
      },
    },
    ssr: {
      resolve: {
        dedupe: [
          "react",
          "react-dom",
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
        ],
      },
    },
  },
  // Lovable/local builds keep Nitro's Cloudflare default. Vercel sets VERCEL=1
  // during `npm run build` and needs the vercel preset so SSR runs as a Function
  // instead of a Cloudflare worker served as static files (which 500s on GET /).
  nitro: process.env.VERCEL
    ? {
        preset: "vercel",
        routeRules: {
          "/api/**": { proxy: `${djangoOrigin}/api/**` },
        },
      }
    : {},
});
