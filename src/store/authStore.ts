import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  sessionChecked: boolean;
  setUser: (user: User | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  loading: true,
  sessionChecked: false,
  setUser: (user) => set({ user }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAdmin: false });
    // Clear any cached data
    localStorage.removeItem('supabase.auth.token');
  },
  checkAuth: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        set({ user, isAdmin: profile?.is_admin || false, loading: false });
      } else {
        set({ user: null, isAdmin: false, loading: false });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({ user: null, isAdmin: false, loading: false });
    }
  },
  initializeAuth: async () => {
    // Check for existing session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
      
      set({ 
        user: session.user, 
        isAdmin: profile?.is_admin || false, 
        loading: false,
        sessionChecked: true 
      });
    } else {
      set({ user: null, isAdmin: false, loading: false, sessionChecked: true });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        
        set({ user: session.user, isAdmin: profile?.is_admin || false });
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, isAdmin: false });
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
    });
  },
}));
