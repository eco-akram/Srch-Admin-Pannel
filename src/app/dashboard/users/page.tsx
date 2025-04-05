"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react"; // Added Trash2 icon

type User = {
  id: string;
  email?: string;
  role?: string;
  created_at?: string;
  last_sign_in_at?: string;
  app_metadata?: any;
  user_metadata?: any;
};

type NotificationType = "success" | "error" | null;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("authenticated");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Add state for deletion functionality
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Simple notification state instead of toast
  const [notification, setNotification] = useState<{type: NotificationType; message: string}>({
    type: null,
    message: ""
  });

  const showNotification = (type: NotificationType, message: string) => {
    setNotification({ type, message });
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotification({ type: null, message: "" });
    }, 3000);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the server API route to get auth users securely
      const response = await fetch('/api/auth/users');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        let errorMessage = 'Failed to fetch users';
        
        try {
          // Try to parse as JSON if possible
          const errorData = JSON.parse(errorText);
          if (errorData.error) errorMessage = errorData.error;
        } catch (e) {
          // If parsing fails, use status text
          errorMessage = `Failed to fetch users: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (data.users && Array.isArray(data.users)) {
        // Process and set the users
        const formattedUsers = data.users.map((user: any) => ({
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || user.app_metadata?.role || "authenticated",
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          app_metadata: user.app_metadata,
          user_metadata: user.user_metadata
        }));
        
        setUsers(formattedUsers);
      } else {
        throw new Error('Invalid user data format received');
      }
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to load users. Please try again later.");
      
      // Fallback to current user only if API fails
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData?.session?.user;
        
        if (currentUser) {
          setUsers([{
            id: currentUser.id,
            email: currentUser.email,
            role: currentUser.user_metadata?.role || currentUser.app_metadata?.role || "authenticated",
            created_at: currentUser.created_at,
            last_sign_in_at: currentUser.last_sign_in_at,
            app_metadata: currentUser.app_metadata,
            user_metadata: currentUser.user_metadata
          }]);
        }
      } catch (fallbackErr) {
        console.error("Even fallback failed:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handler for setting a user's role
  const handleSetRole = async (userId: string) => {
    try {
      setIsUpdating(true);
      
      const response = await fetch('/api/auth/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role: selectedRole
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }
      
      // Update local state to reflect the change
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: selectedRole } 
          : user
      ));
      
      showNotification("success", "User role updated successfully");
      setEditingUserId(null);
    } catch (err: any) {
      console.error("Error updating role:", err);
      showNotification("error", err.message || "Failed to update user role");
    } finally {
      setIsUpdating(false);
    }
  };

  // Add handler for delete button click
  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteConfirm(true);
  };

  // Add handler for confirming deletion
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      setIsUpdating(true);
      
      const response = await fetch('/api/auth/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userToDelete
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      // Update local state by removing the deleted user
      setUsers(users.filter(user => user.id !== userToDelete));
      showNotification("success", "User deleted successfully");
      
    } catch (err: any) {
      console.error("Error deleting user:", err);
      showNotification("error", err.message || "Failed to delete user");
    } finally {
      setIsUpdating(false);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  // Add handler for canceling deletion
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  // Filter users based on search query and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (user.id?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    
    if (roleFilter === "all") return matchesSearch;
    return matchesSearch && user.role === roleFilter;
  });

  function formatDate(dateString?: string) {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">User Management</h1>
          <p className="text-gray-600">
            View and manage your application users
          </p>
        </div>

        {/* Simple notification instead of toast */}
        {notification.type && (
          <div className={`mb-4 p-3 rounded transition-opacity duration-500 ${
            notification.type === "success" 
              ? "bg-green-100 border border-green-200 text-green-700" 
              : "bg-red-100 border border-red-200 text-red-700"
          }`}>
            {notification.message}
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="authenticated">Authenticated</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="consultant">Consultant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Users Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Sign In</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email || "N/A"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === "admin" 
                              ? "bg-purple-100 text-purple-800" 
                              : user.role === "consultant"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}>
                            {user.role || "authenticated"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.created_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.last_sign_in_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            {/* Delete button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center space-x-1 hover:bg-red-100 text-red-500"
                              onClick={() => handleDeleteClick(user.id)}
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                              <span className="text-xs">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No users found with the current filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Confirm User Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={handleCancelDelete} disabled={isUpdating}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={isUpdating}>
                {isUpdating ? <LoadingSpinner size="small" /> : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
