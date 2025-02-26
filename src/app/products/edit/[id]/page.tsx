'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function EditProduct() {
  const router = useRouter();
  const { id } = useParams(); // Get product ID from URL

  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  // Fetch product details when component mounts
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('Products')
        .select('productName, productDescription, productImage')
        .eq('id', Number(id))
        .single();

      if (error) {
        console.error('Error fetching product:', error);
      } else {
        setProductName(data.productName);
        setProductDescription(data.productDescription);
        setImageUrl(data.productImage || '');
      }
    };

    fetchProduct();
  }, [id]);

  const handleBack = () => {
    router.back();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  const handleSave = async () => {
    if (!id) {
      return;
    }

    let uploadedImageUrl = imageUrl;

    // If an image is selected, upload it
    if (image) {
      const fileExt = image.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error } = await supabase.storage
        .from('product_images')
        .upload(filePath, image, { upsert: true });

      if (error) {
        console.error('Error uploading image:', error);
        return;
      }

      // Get public URL for uploaded image
      const { data: publicUrlData } = supabase.storage
        .from('product_images')
        .getPublicUrl(filePath);

      uploadedImageUrl = publicUrlData.publicUrl;
    }

    // Update product details in the database
    const { error } = await supabase
      .from('Products')
      .update({
        productName,
        productDescription,
        productImage: uploadedImageUrl,
      
      })
      .eq('id', Number(id));

    if (error) {
      console.error('Error updating product:', error);
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" className="mb-4" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <p className="text-gray-500">ID: {id}</p>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-lg shadow p-6 max-w-6xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter product name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Description
            </label>
            <textarea
              className="w-full px-3 py-2 border rounded-md min-h-[100px] resize-vertical"
              placeholder="Enter product description"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Image
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full px-3 py-2 border rounded-md"
              onChange={handleImageChange}
            />

            {imageUrl && !image && (
              <img src={imageUrl} alt="Product" className="mt-4 w-32 h-32 object-cover rounded-md" />
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" onClick={handleBack}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex items-center">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
