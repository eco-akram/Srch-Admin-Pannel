'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedOption, setSelectedOption] = useState<string>("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const role = selectedOption === "admin" ? "admin" : "consultant";

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role }, // Set role in user_metadata
          emailRedirectTo: `${window.location.origin}/dashboard/products`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        console.log("User registered:", data);

        // If email confirmation is required
        if (data?.user && !data.user.confirmed_at) {
          setSuccess("Registration successful! Please check your email to confirm your account.");
        } else {
          // If no email confirmation needed or already confirmed
          router.push("/dashboard/products");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again later.");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">JUNG</h2>
          <p className="mt-2 text-sm text-gray-600">Register a new account</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
              <div className="flex space-x-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex items-center">
                  <input
                    id="consultant"
                    type="radio"
                    value="consultant"
                    name="role"
                    checked={selectedOption === "consultant"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    required
                  />
                  <label htmlFor="consultant" className="ml-2 block text-sm font-medium text-gray-700">
                    Consultant
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="admin"
                    type="radio"
                    value="admin"
                    name="role"
                    checked={selectedOption === "admin"}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="admin" className="ml-2 block text-sm font-medium text-gray-700">
                    Admin
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}