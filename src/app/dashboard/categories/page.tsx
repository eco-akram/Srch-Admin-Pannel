"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Users,
  Settings,
  Search,
  Grid,
  Download,
  Filter,
  Pencil,
  Eye,
  Plus,
  User,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Pagination } from "@/components/ui/Pagination";
import { DbProduct, UiProduct, dbToUiProduct } from "@/utils/dataTransformers";
import { useSession } from "@/context/SessionContext";
import Sidebar from "@/components/Sidebar";

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, role, isLoading: isAuthChecking, signOut } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<UiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const ITEMS_PER_PAGE = 5;

  // Initialize admin panel - now using SessionContext
  useEffect(() => {
    // Only fetch products when auth check is complete and user is authenticated
    if (!isAuthChecking && user) {
      fetchProducts();
    }
  }, [isAuthChecking, user, currentPage]);

  async function fetchProducts() {
    if (isAuthChecking) {
      return; // Don't fetch while checking auth
    }

    setLoading(true);
    setError(null);

    // Calculate pagination ranges
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      // First get the count for pagination
      const { count, error: countError } = await supabase
        .from("Products")
        .select("*", { count: "exact", head: true });

      if (countError) throw countError;

      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));

      // Now get the actual data with pagination
      const { data, error } = await supabase
        .from("Products")
        .select("*")
        .range(from, to);

      if (error) throw error;

      if (data) {
        const uiProducts = data.map((product) =>
          dbToUiProduct(product as DbProduct)
        );
        setProducts(uiProducts);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const menuItems: MenuItem[] = [
    { id: "products", icon: Package, label: "Products" },
    { id: "categories", icon: Grid, label: "Categories" },
    { id: "users", icon: Users, label: "Users" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const filteredProducts = products.filter((product) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      String(product.id).includes(searchTerm) ||
      product.name.toLowerCase().includes(searchTerm) ||
      (product.categoryName || "").toLowerCase().includes(searchTerm)
    );
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleEdit = (productId: string) => {
    router.push(`/products/edit/${productId}`);
  };

  const handleView = (productId: string) => {
    router.push(`/products/view/${productId}`);
  };

  const handleRegister = () => {
    router.push("/register");
  };

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    try {
      const { error } = await supabase
        .from("Products")
        .delete()
        .eq("id", productToDelete);

      if (error) throw error;

      // Remove from local state
      setProducts(products.filter((p) => p.id !== productToDelete));
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    } catch (err) {
      console.error("Error deleting product:", err);
      setError(err instanceof Error ? err.message : "Failed to delete product");
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };

  // Show authentication loading state
  if (isAuthChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-500">Verifying your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <div className="text-xl font-medium">
                <h1>Products</h1>
              </div>
              <div className="text-sm text-gray-500">
                All products ({products.length})
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" className="flex items-center space-x-2">
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Export</span>
              </Button>
              {/* Add Product Button */}
              <Button
                className="flex items-center space-x-2"
                onClick={() => router.push("/products/add")}
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add Product</span>
              </Button>
              {/* Profile Icon */}
              {user ? (
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-500" aria-hidden="true" />
                  <span className="text-sm text-gray-700">{user.email}</span>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/login")}
                  className="flex items-center space-x-2"
                >
                  <User className="w-4 h-4" aria-hidden="true" />
                  <span>Sign In</span>
                </Button>
              )}
            </div>
          </div>

          <div className="p-4 border-t flex items-center space-x-4">
            <div className="flex items-center bg-white border rounded-lg px-4 py-2 flex-1">
              <Search className="w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search by ID, name, or category..."
                className="ml-2 outline-none w-full"
                aria-label="Search products"
              />
            </div>
            <Button variant="outline" className="flex items-center space-x-2">
              <Filter className="w-4 h-4" aria-hidden="true" />
              <span>Filters</span>
            </Button>
          </div>
        </header>

        <main className="p-6">
          {/* Error message */}
          {error && (
            <div className="mb-4">
              <ErrorAlert
                message={error}
                onRetry={() => {
                  // Reset error state and retry fetching products
                  setError(null);
                  fetchProducts();
                }}
              />
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-lg border p-8">
              <LoadingSpinner size="large" />
            </div>
          ) : (
            <div className="bg-white rounded-lg border">
              <div className="grid grid-cols-5 gap-4 p-4 border-b font-medium text-sm text-gray-500">
                <div>Product ID</div>
                <div className="col-span-2">Name</div>
                <div>Category</div>
                <div className="text-center">Actions</div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No products found matching your search.
                </div>
              ) : (
                <>
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="grid grid-cols-5 gap-4 p-4 border-b hover:bg-gray-50 items-center"
                    >
                      <div className="font-medium">{product.id}</div>
                      <div className="col-span-2">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          Last updated: {product.lastUpdated}
                        </div>
                      </div>
                      <div>{product.categoryName || "N/A"}</div>
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center space-x-1 hover:bg-gray-100"
                          onClick={() => handleView(product.id)}
                        >
                          <Eye
                            className="w-4 h-4 text-gray-500"
                            aria-hidden="true"
                          />
                          <span className="text-xs">View</span>
                        </Button>
                        {role === "admin" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center space-x-1 hover:bg-gray-100"
                            onClick={() => handleEdit(product.id)}
                          >
                            <Pencil
                              className="w-4 h-4 text-gray-500"
                              aria-hidden="true"
                            />
                            <span className="text-xs">Edit</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center space-x-1 hover:bg-red-100 text-red-500"
                          onClick={() => handleDeleteClick(product.id)}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                          <span className="text-xs">Delete</span>
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  <div className="p-4 border-t">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <h3 className="text-lg font-medium mb-4">Confirm Deletion</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this product? This action
                  cannot be undone.
                </p>
                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={handleCancelDelete}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleConfirmDelete}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
