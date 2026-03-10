import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAdmin: false,
      loading: true,
      sessionChecked: false,
      
      setUser: (user) => set({ user }),
      
      setIsAdmin: (isAdmin) => {
        set({ isAdmin });
      },
      
      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAdmin: false, loading: false, sessionChecked: true });
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
            
            const isAdmin = profile?.is_admin || false;
            set({ user, isAdmin, loading: false, sessionChecked: true });
          } else {
            set({ user: null, isAdmin: false, loading: false, sessionChecked: true });
          }
        } catch (error) {
          console.error('Auth check error:', error);
          set({ user: null, isAdmin: false, loading: false, sessionChecked: true });
        }
      },
      
      initializeAuth: async () => {
        try {
          // Check if we have a persisted admin session (from localStorage via persist middleware)
          const currentState = get();
          
          // If we have isAdmin flag persisted and a user object, it's an admin session
          if (currentState.isAdmin && currentState.user?.id === 'admin') {
            console.log('Restoring admin session from localStorage');
            set({ 
              user: currentState.user,
              isAdmin: true,
              loading: false,
              sessionChecked: true 
            });
            return;
          }
          
          // Otherwise, check for regular Supabase session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session error:', error);
            set({ user: null, isAdmin: false, loading: false, sessionChecked: true });
            return;
          }
          
          if (session?.user) {
            // We have a valid session, fetch the profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('is_admin')
              .eq('id', session.user.id)
              .single();
            
            const isAdmin = profile?.is_admin || false;
            
            set({ 
              user: session.user, 
              isAdmin, 
              loading: false,
              sessionChecked: true 
            });
          } else {
            // No session found
            set({ user: null, isAdmin: false, loading: false, sessionChecked: true });
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.id);
            
            if (event === 'SIGNED_IN' && session?.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', session.user.id)
                .single();
              
              const isAdmin = profile?.is_admin || false;
              set({ user: session.user, isAdmin, loading: false, sessionChecked: true });
            } else if (event === 'SIGNED_OUT') {
              set({ user: null, isAdmin: false, loading: false, sessionChecked: true });
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
              console.log('Token refreshed successfully');
              // Update user data on token refresh
              const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', session.user.id)
                .single();
              
              const isAdmin = profile?.is_admin || false;
              set({ user: session.user, isAdmin });
            } else if (event === 'USER_UPDATED' && session?.user) {
              // Update user data when user is updated
              const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', session.user.id)
                .single();
              
              const isAdmin = profile?.is_admin || false;
              set({ user: session.user, isAdmin });
            }
          });
        } catch (error) {
          console.error('Initialize auth error:', error);
          set({ user: null, isAdmin: false, loading: false, sessionChecked: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        isAdmin: state.isAdmin,
        user: state.isAdmin && state.user?.id === 'admin' ? state.user : null, // Only persist admin user
      }),
    }
  )
);
