import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
  nitro: {
    // Target Vercel's serverless platform with edge-ready static prerendering
    preset: "vercel",
    prerender: {
      routes: ["/", "/about", "/rooms", "/experiences", "/gallery", "/events", "/contact"],
      crawlLinks: true,
    },
  } as unknown as Record<string, unknown>,
});
