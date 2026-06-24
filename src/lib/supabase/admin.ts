import { createClient } from "@supabase/supabase-js";

// Note: SUPABASE_SERVICE_ROLE_KEY must never be exposed to the client
// This should only be used in API routes, Server Actions, or scheduled jobs
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
