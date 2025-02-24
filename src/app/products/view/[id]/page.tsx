'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ViewProduct() {
  const params = useParams();
  const { id } = params;
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching product:', error.message);
      } else {
        setProduct(data);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Product not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" className="mb-4" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
        <h1 className="text-2xl font-bold">View Product</h1>
        <p className="text-gray-500">ID: {product.id}</p>
      </div>

      {/* Product Details */}
      <div className="bg-white rounded-lg shadow p-6 max-w-6xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <p className="text-lg">{product.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <p className="text-lg">{product.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Question Column */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question
              </label>
              <p className="text-lg">{product.question}</p>
            </div>

            {/* Answer Column */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Answer
              </label>
              <p className="text-lg">{product.answer}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}