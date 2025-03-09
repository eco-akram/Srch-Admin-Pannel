'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type SessionContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  role: string | null;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextType>({
  session: null,
  user: null,
  isLoading: true,
  role: null,
  signOut: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error fetching session:', error);
        } else {
          setSession(data.session);
          setUser(data.session?.user || null);
          setRole(data.session?.user?.user_metadata?.role || null);
        }
      } catch (err) {
        console.error('Session fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setRole(session?.user?.user_metadata?.role || null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Auth state change will be caught by the listener
    } catch (err) {
      console.error('Sign out error:', err);
      throw err;
    }
  };

  return (
    <SessionContext.Provider value={{ session, user, isLoading, role, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);