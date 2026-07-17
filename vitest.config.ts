import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    globals: false,
    // Setup dummy env untuk module yang import DATABASE_URL.
    // Test yang benar-benar query DB akan di-skip / error.
    env: {
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_ANON_KEY: "test-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Mock `server-only` agar Vitest tidak error (package ini hanya untuk Next.js)
      "server-only": path.resolve(__dirname, "tests/__mocks__/server-only.ts"),
    },
  },
});
