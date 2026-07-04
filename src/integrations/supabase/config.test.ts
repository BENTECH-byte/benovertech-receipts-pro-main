import { describe, expect, it } from "vitest";
import { resolveSupabaseConfig } from "./config";

describe("resolveSupabaseConfig", () => {
  it("falls back to the shared project URL when the URL is missing", () => {
    const config = resolveSupabaseConfig({
      VITE_SUPABASE_PROJECT_ID: "demo-project",
      VITE_SUPABASE_PUBLISHABLE_KEY: "demo-key",
    });

    expect(config.url).toBe("https://demo-project.supabase.co");
    expect(config.key).toBe("demo-key");
  });

  it("supports the legacy anon key env name", () => {
    const config = resolveSupabaseConfig({
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_ANON_KEY: "legacy-key",
    });

    expect(config.url).toBe("https://example.supabase.co");
    expect(config.key).toBe("legacy-key");
  });
});
