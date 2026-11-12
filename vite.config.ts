// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Override with DJANGO_API_ORIGIN when running a local Django backend.
const djangoOrigin = (process.env.DJANGO_API_ORIGIN || "https://api-next.salamafarm.com").replace(
  /\/$/,
  "",
);

// Shared by every deployed target: browser → /api/** → Django (no CORS).
const apiProxyRule = {
  "/api/**": { proxy: `${djangoOrigin}/api/**` },
};

function nitroConfig() {
  // Vercel sets VERCEL=1 during `npm run build`; needs the vercel preset so SSR
  // runs as a Function instead of a Cloudflare worker served as static files.
  if (process.env.VERCEL) {
    return { preset: "vercel" as const, routeRules: apiProxyRule };
  }
  // Docker / self-hosted: build a standalone Node server (.output/server/index.mjs).
  if (process.env.NITRO_TARGET === "node") {
    return { preset: "node-server" as const, routeRules: apiProxyRule };
  }
  // Lovable/local builds keep Nitro's Cloudflare default.
  return {};
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Do not set ssr.optimizeDeps.include for @tanstack/* — pre-bundling can resolve a second
  // copy of react and break SSR with "Invalid hook call" / useContext on null.
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
    resolve: {
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
  },
  nitro: nitroConfig(),
});