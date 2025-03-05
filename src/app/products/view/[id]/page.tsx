// src/app/products/view/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { DbProduct, UiProduct, dbToUiProduct } from '@/utils/dataTransformers';

export default function ViewProduct() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [product, setProduct] = useState<UiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      {error ? (
        <ErrorAlert message={error} onRetry={fetchProduct} />
      ) : loading ? (
        <div className="bg-white rounded-lg border p-8">
          <LoadingSpinner size="large" />
        </div>
      ) : product ? (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b">
            <h1 className="text-2xl font-bold">{product.name}</h1>
          </div>
          
          <div className="p-6 space-y-6">
          {product.imageUrl && (
  <div className="mb-6">
    <div className="flex justify-start">
      <div className="w-64 h-64 rounded-lg overflow-hidden flex items-center justify-center">
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            console.error('Failed to load image');
          }}
        />
      </div>
    </div>
  </div>
)}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product ID
              </label>
              <p className="text-lg">{product.id}</p>
            </div>
            
            {product.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <p className="text-lg">{product.description}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock
              </label>
              <p className="text-lg">{product.stock}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Updated
              </label>
              <p className="text-lg">{product.lastUpdated}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-lg text-gray-500">
          Product not found.
        </p>
      )}
    </div>
  );
}