import { createClient } from '@supabase/supabase-js';
import { AccessibilityProfile } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Lucent: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.');
}
if (!supabasePublishableKey) {
  console.warn('Lucent: Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY environment variables.');
}
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  disabilityProfile: AccessibilityProfile;
  createdAt?: string;
}

// 1. Sign Up User with Disability Profile
export async function signUpUser(
  email: string,
  pass: string,
  fullName: string,
  disabilityProfile: AccessibilityProfile
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      data: {
        full_name: fullName,
        disability_profile: disabilityProfile,
      },
    },
  });

  if (error) throw error;

  // Save/Upsert into profiles table if authenticated
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      selected_profile: disabilityProfile,
      updated_at: new Date().toISOString(),
    });
  }

  return data;
}

// 2. Sign In User
export async function signInUser(email: string, pass: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });

  if (error) throw error;
  return data;
}

// 2b. Sign In with Google OAuth
export async function signInWithGoogle(disabilityProfile?: AccessibilityProfile) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
        ...(disabilityProfile ? { disability_profile: disabilityProfile } : {})
      }
    }
  });

  if (error) throw error;
  return data;
}

// 3. Sign Out User
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// 4. Fetch User Profile
export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    disabilityProfile: (data.selected_profile as AccessibilityProfile) || 'raw',
    createdAt: data.created_at,
  };
}
