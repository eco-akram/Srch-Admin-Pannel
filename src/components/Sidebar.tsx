"use client";

import React, { useState } from "react";
import {
  Package,
  Users,
  Settings,
  Grid,
  Menu,
  X,
  LogOut,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";

interface MenuItem {
  nav: string;
  icon: React.ElementType;
  label: string;
}

export default function Sidebar() {
  const router = useRouter();
  const { user, role, isLoading: isAuthChecking, signOut } = useSession();

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("products");

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleRegister = () => {
    router.push("/register");
  };

  const menuItems: MenuItem[] = [
    { nav: "dashboard/products", icon: Package, label: "Products" },
    { nav: "dashboard/categories", icon: Grid, label: "Categories" },
    { nav: "dashboard/users", icon: Users, label: "Users" },
    { nav: "dashboard/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div
      className={`${
        isSidebarOpen ? "w-64" : "w-20"
      } bg-white border-r transition-all duration-300`}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className={`font-bold text-xl ${!isSidebarOpen && "hidden"}`}>
          JUNG
        </div>
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isSidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.nav} // Use the nav property as the unique key
              onClick={() => {
                setActiveTab(item.nav);
                router.push(`/${item.nav}`);
              }}
              aria-pressed={activeTab === item.nav}
              aria-label={item.label}
              className={`w-full flex items-center p-3 mb-2 rounded-lg transition-colors
                ${
                  activeTab === item.nav
                    ? "bg-gray-100 text-black"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              {isSidebarOpen && <span className="ml-3">{item.label}</span>}
            </button>
          );
        })}

        {role === "admin" && (
          <button
            onClick={handleRegister}
            aria-label="Register User"
            className="w-full flex items-center p-3 mb-2 rounded-lg transition-colors text-blue-600 hover:bg-blue-50"
          >
            <UserPlus className="w-5 h-5" aria-hidden="true" />
            {isSidebarOpen && <span className="ml-3">Register User</span>}
          </button>
        )}

        <button
          onClick={handleLogout}
          aria-label="Logout"
          className="w-full flex items-center p-3 mb-2 rounded-lg transition-colors text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" aria-hidden="true" />
          {isSidebarOpen && <span className="ml-3">Logout</span>}
        </button>
      </nav>
    </div>
  );
}
