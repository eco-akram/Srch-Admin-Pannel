'use client';

import React, { useState } from 'react';
import { Package, Users, Settings, Search, BarChart3, Grid, Menu, X, Download, Upload, Filter, Pencil, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface MenuItem {
  id: string;
  icon: React.ElementType;  // Changed from ComponentType to ElementType
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

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    router.push('/login');
  };

  const menuItems: MenuItem[] = [
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'categories', icon: Grid, label: 'Categories' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const products: Product[] = [
    {
      id: 'LS990',
      name: 'Switch Series LS990',
      category: 'Switches',
      stock: 234,
      lastUpdated: '2024-02-17'
    },
    {
      id: 'A500',
      name: 'A500 Aluminium',
      category: 'Switches',
      stock: 156,
      lastUpdated: '2024-02-16'
    },
    {
      id: 'CD500',
      name: 'CD500 Series',
      category: 'Controls',
      stock: 45,
      lastUpdated: '2024-02-15'
    }
  ];

  const handleEdit = (productId: string) => {
    router.push(`/products/edit/${productId}`);
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
          
          {/* Logout Button in Sidebar */}
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
        {/* Header */}
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
            </div>
          </div>
          
          {/* Filters */}
          <div className="p-4 border-t flex items-center space-x-4">
            <div className="flex items-center bg-white border rounded-lg px-4 py-2 flex-1">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
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

        {/* Product List */}
        <main className="p-6">
          <div className="bg-white rounded-lg border">
            <div className="grid grid-cols-5 gap-4 p-4 border-b font-medium text-sm text-gray-500">
              <div>Product ID</div>
              <div className="col-span-2">Name</div>
              <div>Category</div>
              <div>Actions</div>
            </div>
            
            {products.map((product) => (
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
                <div>
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
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}