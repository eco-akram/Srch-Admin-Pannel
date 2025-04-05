// src/app/products/add/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { ImageUpload } from '@/components/ui/ImageUpload';

export default function AddProduct() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    productImage: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

// Find the handleSubmit function and update it with this code:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSaving(true);
  setError(null);

  try {
    // Add lastUpdated timestamp for new products
    const productData = {
      ...formData,
      productDescription: formData.productDescription || null,
      productImage: formData.productImage || null,
      lastUpdated: new Date().toISOString() // Add this line
    };

    const { error } = await supabase.from('Products').insert([productData]);
    
    if (error) throw error;
    
    router.push('/dashboard/products');
  } catch (err) {
    console.error('Error adding product:', err);
    setError(err instanceof Error ? err.message : 'Failed to add product');
  } finally {
    setSaving(false);
  }
};

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button 
        variant="outline" 
        className="mb-6 flex items-center gap-2"
        onClick={handleBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Button>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">Add New Product</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <ErrorAlert message={error} />
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="productName">
              Product Name
            </label>
            <input
              id="productName"
              name="productName"
              value={formData.productName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="productDescription">
              Description
            </label>
            <textarea
              id="productDescription"
              name="productDescription"
              value={formData.productDescription}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md h-32"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Image
            </label>
            <ImageUpload
              currentImageUrl={formData.productImage}
              onImageUploaded={(url) => {
                setFormData({
                  ...formData,
                  productImage: url
                });
              }}
              onClearImage={() => {
                setFormData({
                  ...formData,
                  productImage: ''
                });
              }}
            />
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? 'Adding...' : 'Add Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}