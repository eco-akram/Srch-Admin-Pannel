// src/components/ui/ImageUpload.tsx
'use client';

import React, { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X } from 'lucide-react';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  onClearImage?: () => void;
}

export function ImageUpload({ currentImageUrl, onImageUploaded, onClearImage }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    // Trigger file input click when button is clicked
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Create a unique file name based on timestamp
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Upload image to Supabase Storage using your product_images bucket
      const { error: uploadError } = await supabase.storage
        .from('product_images') // Your existing bucket name
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('product_images')
        .getPublicUrl(filePath);
        
      if (data.publicUrl) {
        onImageUploaded(data.publicUrl);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      // Clear the file input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={isUploading}
      />
      
      {/* Image preview (if available) */}
      {currentImageUrl && (
        <div className="relative mt-2 inline-block">
          <img 
            src={currentImageUrl} 
            alt="Product image" 
            className="max-h-48 rounded-md border"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              setError('Failed to load image preview');
            }}
          />
          {onClearImage && (
            <button
              type="button"
              className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full transform translate-x-1/2 -translate-y-1/2"
              onClick={onClearImage}
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
      
      {/* Upload button */}
      <Button
        type="button"
        variant={currentImageUrl ? "outline" : "default"}
        onClick={handleButtonClick}
        disabled={isUploading}
        className="flex items-center gap-2"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            <span>{currentImageUrl ? 'Change Image' : 'Upload Image'}</span>
          </>
        )}
      </Button>
      
      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}