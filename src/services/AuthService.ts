import { createClient } from "@/lib/supabase/server";

export class AuthService {
  /**
   * Check if a valid session exists.
   */
  static async getSession() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  }

  /**
   * Log out the current user.
   */
  static async logout() {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    return { error };
  }
}
