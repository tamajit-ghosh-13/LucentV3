// This file will initialize the Supabase client using environment variables.
// It will handle Google OAuth logic for Chrome Extension authentication.
// It will provide functions to fetch and update the user's impairment profile.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);