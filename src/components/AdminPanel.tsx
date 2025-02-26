'use client';

import React, { useState, useEffect } from 'react';
import { Package, Users, Settings, Search, BarChart3, Grid, Menu, X, Download, Upload, Filter, Pencil, LogOut, Eye, Plus, UserPlus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  lastUpdated: string;
}

export default function AdminPanel() {
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase.from('Products').select('*');
      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data.map((product: { id: string; productName: string; last_updated?: string }) => ({
          id: product.id,
          name: product.productName,
          category: "N/A",
          stock: 0,
          lastUpdated: "Add later",
        })));
        
      }
    }
    fetchProducts();
  
    async function fetchUser() {
      const { data } = await supabase.auth.getSession();
      if (data.session && data.session.user && data.session.user.email) {
        setUserEmail(data.session.user.email);
      }
    }
    fetchUser();
  }, []);
  

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error);
    } else {
      router.push("/login");
    }
  };

  const menuItems: MenuItem[] = [
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'categories', icon: Grid, label: 'Categories' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const filteredProducts = products.filter(product => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      String(product.id).includes(searchTerm)||
      product.name.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (productId: string) => {
    router.push(`/products/edit/${productId}`);
  };

  const handleView = (productId: string) => {
    router.push(`/products/view/${productId}`);
  };

  const handleRegister = () => {
    router.push('/register');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r transition-all duration-300`}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className={`font-bold text-xl ${!isSidebarOpen && 'hidden'}`}>
            JUNG
          </div>
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center p-3 mb-2 rounded-lg transition-colors
                  ${activeTab === item.id ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Icon className="w-5 h-5" />
                {isSidebarOpen && <span className="ml-3">{item.label}</span>}
              </button>
            );
          })}

          <button
            onClick={handleRegister}
            className="w-full flex items-center p-3 mb-2 rounded-lg transition-colors text-blue-600 hover:bg-blue-50"
          >
            <UserPlus className="w-5 h-5" />
            {isSidebarOpen && <span className="ml-3">Register User</span>}
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center p-3 mb-2 rounded-lg transition-colors text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="ml-3">Logout</span>}
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <div className="text-xl font-medium">Products</div>
              <div className="text-sm text-gray-500">All products ({products.length})</div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
              <Button
                className="flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Import</span>
              </Button>
              {/* Add Product Button */}
              <Button
                className="flex items-center space-x-2"
                onClick={() => router.push('/products/add')}
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </Button>
              {/* Profile Icon */}
              {userEmail && (
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-700">{userEmail}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t flex items-center space-x-4">
            <div className="flex items-center bg-white border rounded-lg px-4 py-2 flex-1">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search by ID, name, or category..."
                className="ml-2 outline-none w-full"
              />
            </div>
            <Button
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </Button>
          </div>
        </header>

        <main className="p-6">
          <div className="bg-white rounded-lg border">
            <div className="grid grid-cols-5 gap-4 p-4 border-b font-medium text-sm text-gray-500">
              <div>Product ID</div>
              <div className="col-span-2">Name</div>
              <div>Category</div>
              <div className="text-center">Actions</div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No products found matching your search.
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="grid grid-cols-5 gap-4 p-4 border-b hover:bg-gray-50 items-center"
                >
                  <div className="font-medium">{product.id}</div>
                  <div className="col-span-2">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">Last updated: {product.lastUpdated}</div>
                  </div>
                  <div>{product.category}</div>
                  <div className="flex justify-center space-x-4">
                    <Button
                      variant="ghost"
                      className="flex items-center space-x-2 hover:bg-gray-100"
                      onClick={() => handleView(product.id)}
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                      <span>View</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex items-center space-x-2 hover:bg-gray-100"
                      onClick={() => handleEdit(product.id)}
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                      <span>Edit</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}