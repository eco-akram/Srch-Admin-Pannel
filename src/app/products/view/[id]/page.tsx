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
import { Badge } from '@/components/ui/badge';

// Extended UiProduct type to include answers
interface ExtendedUiProduct extends UiProduct {
  answers?: { 
    id: string; 
    answerText: string;
    questionText?: string; // Pridėtas klausimas
  }[];
}

// Type definitions for the Supabase response
interface AnswerData {
  id: string;
  answerText: string;
  Questions?: {
    id: string;
    questionText: string;
  };
}

interface ProductAnswerRelation {
  answerId: string;
  Answers: AnswerData;
}

interface ProductWithAnswers extends DbProduct {
  Product_Answers: ProductAnswerRelation[];
}

export default function ViewProduct() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [product, setProduct] = useState<ExtendedUiProduct | null>(null);
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
      // Fetch product with its linked answers and questions
      const { data, error } = await supabase
        .from('Products')
        .select(`
          *,
          Product_Answers (
            answerId,
            Answers:answerId (
              id,
              answerText,
              Questions:questionsId (
                id,
                questionText
              )
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        // Transform the data to include answers in a more accessible format
        const baseProduct = dbToUiProduct(data as DbProduct);
        
        // Extract answers from nested response with proper typing
        const productWithAnswers = data as ProductWithAnswers;
        const answers = productWithAnswers.Product_Answers
          ?.map((pa: ProductAnswerRelation) => pa.Answers)
          .filter((a: AnswerData | null) => a !== null)
          .map((a: AnswerData) => ({
            id: a.id,
            answerText: a.answerText,
            questionText: a.Questions?.questionText
          })) || [];

        // Set product with answers
        setProduct({
          ...baseProduct,
          answers
        });
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
            
            {/* Display Linked Answers with Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Linked Answers
              </label>
              <div className="space-y-3">
                {product.answers && product.answers.length > 0 ? (
                  product.answers.map((answer) => (
                    <div key={answer.id} className="border rounded-md p-3">
                      <div className="mb-1">
                        <span className="text-sm font-medium text-gray-700">Question: </span>
                        <span>{answer.questionText || "Unknown question"}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Answer: </span>
                        <Badge variant="secondary" className="text-sm py-1">
                          {answer.answerText}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No linked answers</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Updated
              </label>
              <p className="text-lg">
                {(() => {
                  const date = new Date(product.lastUpdated);
                  if (isNaN(date.getTime())) return "Not available";
                  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${date.toTimeString().slice(0, 8)}`;
                })()}
              </p>
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