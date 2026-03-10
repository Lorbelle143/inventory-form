import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          student_id: string;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          student_id: string;
          is_admin?: boolean;
        };
      };
      inventory_submissions: {
        Row: {
          id: string;
          user_id: string;
          student_id: string;
          full_name: string;
          course: string;
          year_level: string;
          contact_number: string;
          photo_url: string;
          google_form_response_id: string;
          created_at: string;
        };
      };
    };
  };
};
