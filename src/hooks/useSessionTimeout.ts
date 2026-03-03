import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Auto logout after 30 minutes of inactivity
const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export function useSessionTimeout() {
  const navigate = useNavigate();
  const { signOut, user } = useAuthStore();
  const timeoutRef = useRef<number | null>(null);

  const resetTimeout = () => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = window.setTimeout(async () => {
      if (user) {
        alert('⏱️ Your session has expired due to inactivity. Please login again.');
        await signOut();
        navigate('/login');
      }
    }, TIMEOUT_DURATION);
  };

  useEffect(() => {
    if (!user) return;

    // Events that indicate user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    // Reset timeout on any user activity
    events.forEach(event => {
      document.addEventListener(event, resetTimeout);
    });

    // Initialize timeout
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user]);
}
