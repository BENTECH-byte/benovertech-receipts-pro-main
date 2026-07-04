type EnvLike = Record<string, string | boolean | undefined>;

export function resolveSupabaseConfig(env: EnvLike = import.meta.env) {
  const url =
    (typeof env.VITE_SUPABASE_URL === "string" && env.VITE_SUPABASE_URL) ||
    (typeof env.VITE_SUPABASE_PROJECT_ID === "string" && env.VITE_SUPABASE_PROJECT_ID
      ? `https://${env.VITE_SUPABASE_PROJECT_ID}.supabase.co`
      : "");

  const key =
    (typeof env.VITE_SUPABASE_PUBLISHABLE_KEY === "string" && env.VITE_SUPABASE_PUBLISHABLE_KEY) ||
    (typeof env.VITE_SUPABASE_ANON_KEY === "string" && env.VITE_SUPABASE_ANON_KEY) ||
    "";

  return { url, key };
}
