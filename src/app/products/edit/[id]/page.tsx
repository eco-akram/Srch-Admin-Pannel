// src/app/products/edit/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { DbProduct, UiProduct, dbToUiProduct } from '@/utils/dataTransformers';
import { ImageUpload } from '@/components/ui/ImageUpload';

export default function EditProduct() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [product, setProduct] = useState<UiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('Products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProduct(dbToUiProduct(data as DbProduct));
      } else {
        throw new Error('Product not found');
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;
    
    setSaving(true);
    setFormError(null);
    
    try {
      // Convert UI product back to DB format
      const dbProduct = {
        productName: product.name,
        productDescription: product.description,
        productImage: product.imageUrl,
      };
      
      const { error } = await supabase
        .from('Products')
        .update(dbProduct)
        .eq('id', id);
        
      if (error) throw error;
      
      // Navigate back or show success
      router.push('/dashboard/products');
    } catch (err) {
      console.error('Error updating product:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setProduct(prev => {
      if (!prev) return prev;
      
      // Reset image error if editing image URL
      if (name === 'imageUrl') {
        setImageError(null);
      }
      
      return {
        ...prev,
        [name]: value
      };
    });
  };

  const handleBack = () => {
    router.back();
  };
  
  const checkImageUrl = (url: string) => {
    if (!url) return;
    
    const img = new Image();
    img.onload = () => setImageError(null);
    img.onerror = () => setImageError('Image URL is not valid or image cannot be loaded');
    img.src = url;
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

      {error ? (
        <ErrorAlert message={error} onRetry={fetchProduct} />
      ) : loading ? (
        <div className="bg-white rounded-lg border p-8">
          <LoadingSpinner size="large" />
        </div>
      ) : product ? (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold">Edit Product</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {formError && (
              <ErrorAlert message={formError} />
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                Product Name
              </label>
              <input
                id="name"
                name="name"
                value={product.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={product.description || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md h-32"
              />
            </div>
            
            <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Product Image
  </label>
  <ImageUpload
    currentImageUrl={product.imageUrl}
    onImageUploaded={(url) => {
      setProduct(prev => ({
        ...prev!,
        imageUrl: url
      }));
    }}
    onClearImage={() => {
      setProduct(prev => ({
        ...prev!,
        imageUrl: ''
      }));
    }}
  />
</div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="stock">
                Stock
              </label>
              <input
                id="stock"
                name="stock"
                type="number"
                value={product.stock}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
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
                disabled={saving || !!imageError}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <p className="text-center text-lg text-gray-500">
          Product not found.
        </p>
      )}
    </div>
  );
}