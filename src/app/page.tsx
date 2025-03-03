'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminPanel from '@/components/AdminPanel';
import Consultantpanel from '@/components/ConsultantPanel';
import { supabase } from '@/lib/supabase';

export default function Page() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setIsAuthenticated(true);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Session check error:', error);
        router.push('/login');
      }
      setIsLoading(false);
    };

    const fetchUserRole = async () => {
      const { data, error } = await supabase.auth.getUser();
    
      if (error) {
        console.error("Error fetching user:", error);
        return null;
      }
      setRole(data?.user?.user_metadata?.role)
    };
    fetchUserRole();

    checkSession();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }
  if(role=="admin"){
return <AdminPanel />;
  }
  else{
    return <Consultantpanel />
  }
  
}