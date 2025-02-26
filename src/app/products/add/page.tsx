'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

export default function AddProductPage() {
  const router = useRouter();
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [, setMessage] = useState<{ text: string; type: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const BUCKET_NAME = "product_images";

  // Check authentication status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login"); // Redirect to login page if not authenticated
        return;
      }
      setLoading(false); // Authentication check is done
    };
    checkUser();
  }, [router]);

  // Render nothing or loading screen while checking authentication status
  if (loading) {
    return null;  // Render nothing to prevent the page from showing before authentication check
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const handleUploadAndInsert = async () => {
    setIsLoading(true);
    if (!file) {
      setMessage({ text: "No file selected.", type: "error" });
      return;
    }

    setMessage(null); // Reset previous messages

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      // Upload image to Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const publicUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path).data.publicUrl;

      // Insert into "products" table
      const { error: insertError } = await supabase.from("Products").insert([
        {
          productName: productName,
          productDescription: productDescription,
          productImage: publicUrl,
        },
      ]);

      if (insertError) throw insertError;

      setMessage({ text: "Product added successfully!", type: "success" });
      router.push("/"); // Redirect after successful upload
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage({ text: `Error: ${error.message}`, type: "error" });
      } else {
        setMessage({ text: "An unknown error occurred.", type: "error" });
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Add Product</h1>
      <form className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Product Name
          </label>
          <Input
          id="productName"
          type="text"
          value={productName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProductName(e.target.value)}
          className="w-full"
          />
        </div>
        <div>
          <label htmlFor="productDescription" className="block text-sm font-medium text-gray-700 mb-1">
            Product Description
          </label>
          <textarea
            id="productDescription"
            value={productDescription}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProductDescription(e.target.value)}
            className="w-full min-h-32 border rounded-md p-2"
            rows={5}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
          <Input type="file" onChange={handleFileChange} />
        </div>

        <Button type="button" onClick={handleUploadAndInsert} disabled={isLoading}>
        {isLoading ? 'Adding...' : 'Add Product'}
        </Button>
      </form>
    </div>
  );
}
