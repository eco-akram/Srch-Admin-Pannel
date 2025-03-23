"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
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

// Import jsPDF in a way that autoTable plugin can properly attach to it
import jsPDF from "jspdf";
// Import autoTable directly - it will attach itself to the jsPDF prototype
import autoTable from 'jspdf-autotable';

export default function AdminPage() {
  const router = useRouter();
  const { user, role, isLoading: isAuthChecking } = useSession();
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
  }, [isAuthChecking, user, currentPage, searchQuery]); // Added searchQuery as dependency

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
      let countQuery = supabase
        .from("Products")
        .select("*", { count: "exact", head: true });
        
      // Apply search filter if search query is not empty
      if (searchQuery.trim()) {
        // Check if the search query is a number (potential ID search)
        const isNumericSearch = !isNaN(Number(searchQuery));
        
        if (isNumericSearch) {
          // Search by ID (exact match for numeric ID)
          countQuery = countQuery.eq('id', searchQuery);
        } else {
          // Search by product name (case-insensitive partial match)
          countQuery = countQuery.ilike('productName', `%${searchQuery}%`);
        }
      }
      
      const { count, error: countError } = await countQuery;

      if (countError) throw countError;

      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));

      // Now get the actual data with pagination
      let dataQuery = supabase
        .from("Products")
        .select("*");
        
      // Apply the same search filter to data query
      if (searchQuery.trim()) {
        const isNumericSearch = !isNaN(Number(searchQuery));
        
        if (isNumericSearch) {
          dataQuery = dataQuery.eq('id', searchQuery);
        } else {
          dataQuery = dataQuery.ilike('productName', `%${searchQuery}%`);
        }
      }
      
      // Apply sorting and pagination
      const { data, error } = await dataQuery
        .order('lastUpdated', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
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

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete || role !== "admin") return;

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

  const formatLastUpdated = (dateString: string | null | undefined): string => {
    // Handle null, undefined, or empty string
    if (!dateString) return "N/A";

    // Handle the specific "Not available" string case
    if (dateString === "Not available") return "Not available";

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Not available";
      }

      // Format valid date as YYYY/MM/DD HH:MM:SS
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${date.toTimeString().slice(0, 8)}`;
    } catch (e) {
      return "Not available";
    }
  };

  // Function to handle PDF export
  const handleExport = async () => {
    // Show loading state while preparing the export
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all products for export (without pagination)
      const { data, error } = await supabase
        .from("Products")
        .select("*")
        .order('lastUpdated', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Convert database products to UI format
        const allProducts = data.map((product) => dbToUiProduct(product as DbProduct));
        
        // Create PDF document using the standard import method
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(18);
        doc.text('Products Report', 14, 20);
        
        // Add generation info
        doc.setFontSize(10);
        const dateStr = new Date().toLocaleString();
        doc.text(`Generated on: ${dateStr}`, 14, 28);
        doc.text(`Total Products: ${allProducts.length}`, 14, 34);
        
        // Prepare table data
        const tableColumn = ["Product ID", "Name", "Category", "Last Updated"];
        const tableRows = allProducts.map(product => [
          product.id,
          product.name,
          product.categoryName || "N/A",
          formatLastUpdated(product.lastUpdated)
        ]);
        
        // Generate the table - autoTable has been added to jsPDF's prototype
        autoTable(doc, {
          startY: 40,
          head: [tableColumn],
          body: tableRows,
          headStyles: { fillColor: [66, 66, 66] },
          alternateRowStyles: { fillColor: [241, 245, 249] },
          margin: { top: 40 }
        });
        
        // Save the PDF
        doc.save("products-report.pdf");
      }
    } catch (err) {
      console.error("Error exporting products:", err);
      setError(err instanceof Error ? err.message : "Failed to export products");
    } finally {
      setLoading(false);
    }
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
              <Button 
                variant="outline" 
                className="flex items-center space-x-2"
                onClick={handleExport}
                disabled={loading}
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>{loading ? 'Exporting...' : 'Export'}</span>
              </Button>
              {/* Add Product Button - Only visible to admin */}
              {role === "admin" && (
                <Button
                  className="flex items-center space-x-2"
                  onClick={() => router.push("/products/add")}
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Add Product</span>
                </Button>
              )}
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
                placeholder="Search by Product ID or Name..."
                className="ml-2 outline-none w-full"
                aria-label="Search products"
              />
            </div>
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

              {products.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No products found matching your search.
                </div>
              ) : (
                <>
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="grid grid-cols-5 gap-4 p-4 border-b hover:bg-gray-50 items-center"
                    >
                      <div className="font-medium">{product.id}</div>
                      <div className="col-span-2">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          Last updated: {formatLastUpdated(product.lastUpdated || (product as any).created_at)}
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
                        {/* Delete button - restricted to admin role */}
                        {role === "admin" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center space-x-1 hover:bg-red-100 text-red-500"
                            onClick={() => handleDeleteClick(product.id)}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                            <span className="text-xs">Delete</span>
                          </Button>
                        )}
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