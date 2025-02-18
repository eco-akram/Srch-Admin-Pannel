'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EditProductProps {
  id: string;
}

export default function EditProduct({ id }: EditProductProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleSave = () => {
    console.log('Saving product:', id);
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={handleBack}
        >
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
              defaultValue="Switch Series LS990"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border rounded-md min-h-[100px] resize-vertical"
              placeholder="Write a detailed description of the product and its features..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Question Column */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-md min-h-[100px] resize-vertical"
                placeholder="Your Question"
              />
            </div>

            {/* Answer Column */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Answer
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-md min-h-[100px] resize-vertical"
                placeholder="Provide your answer here..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}