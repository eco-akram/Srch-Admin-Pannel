// src/app/products/edit/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X, Plus } from 'lucide-react';
import { DbProduct, UiProduct, dbToUiProduct } from '@/utils/dataTransformers';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Answer = {
  id: string;
  answerText: string;
  questionsId: string;
};

type Question = {
  id: string;
  questionText: string;
}

interface ExtendedUiProduct extends UiProduct {
  answers?: { 
    id: string; 
    answerText: string;
    questionText?: string; // Pridėtas klausimas
    questionId?: string; // Pridėtas klausimo ID
  }[];
}

// Type definitions for the Supabase response
interface AnswerData {
  id: string;
  answerText: string;
  questionsId?: string;
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

export default function EditProduct() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [product, setProduct] = useState<ExtendedUiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // Answers state
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);

  // New answer creation state
  const [showCreateAnswerModal, setShowCreateAnswerModal] = useState(false);
  const [newAnswerText, setNewAnswerText] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [creatingAnswer, setCreatingAnswer] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchAnswers();
      fetchQuestions();
    }
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('Products')
        .select(`
          *,
          Product_Answers (
            answerId,
            Answers:answerId (
              id,
              answerText,
              questionsId,
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
        const baseProduct = dbToUiProduct(data as DbProduct);
        
        // Extract answers from nested response with proper typing
        const productWithAnswers = data as ProductWithAnswers;
        const productAnswers = productWithAnswers.Product_Answers
          ?.map((pa: ProductAnswerRelation) => pa.Answers)
          .filter((a: AnswerData | null) => a !== null)
          .map((a: AnswerData) => ({
            id: a.id,
            answerText: a.answerText,
            questionText: a.Questions?.questionText,
            questionId: a.questionsId
          })) || [];

        // Initialize selected answers from product's linked answers
        setSelectedAnswers(productAnswers.map((a: {id: string}) => a.id));
        
        setProduct({
          ...baseProduct,
          answers: productAnswers
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

  const fetchAnswers = async () => {
    try {
      setLoadingAnswers(true);
      const { data: answersData, error } = await supabase
        .from("Answers")
        .select("id, answerText, questionsId");

      if (error) throw error;
      
      setAnswers(answersData || []);
    } catch (err) {
      console.error("Error fetching answers:", err);
    } finally {
      setLoadingAnswers(false);
    }
  };
  
  const fetchQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const { data: questionsData, error } = await supabase
        .from("Questions")
        .select("id, questionText");

      if (error) throw error;
      
      setQuestions(questionsData || []);
    } catch (err) {
      console.error("Error fetching questions:", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAnswerSelect = (answerId: string) => {
    if (answerId && !selectedAnswers.includes(answerId)) {
      setSelectedAnswers([...selectedAnswers, answerId]);
    }
  };

  const handleRemoveAnswer = (answerId: string) => {
    setSelectedAnswers(selectedAnswers.filter((id) => id !== answerId));
  };
  
  const handleCreateNewAnswer = async () => {
    if (!newAnswerText.trim() || !selectedQuestionId) {
      setFormError("Answer text and question are required");
      return;
    }
    
    try {
      setCreatingAnswer(true);
      setFormError(null);
      
      // Create new answer in Supabase
      const { data: newAnswer, error: createError } = await supabase
        .from("Answers")
        .insert([{ 
          answerText: newAnswerText.trim(),
          questionsId: selectedQuestionId
        }])
        .select();
      
      if (createError) throw createError;
      
      if (newAnswer && newAnswer.length > 0) {
        // Add the new answer to our answers list
        setAnswers([...answers, newAnswer[0]]);
        
        // Select the newly created answer
        setSelectedAnswers([...selectedAnswers, newAnswer[0].id]);
        
        // Reset the form
        setNewAnswerText('');
        setSelectedQuestionId('');
        setShowCreateAnswerModal(false);
      }
    } catch (err) {
      console.error('Error creating answer:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to create answer');
    } finally {
      setCreatingAnswer(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;
    
    setSaving(true);
    setFormError(null);
    
    try {
      // Convert UI product back to DB format with current timestamp
      const dbProduct = {
        productName: product.name,
        productDescription: product.description,
        productImage: product.imageUrl || null,
        lastUpdated: new Date().toISOString() // Add timestamp when updating
      };
      
      // Step 1: Update the basic product info
      const { error: updateError } = await supabase
        .from('Products')
        .update(dbProduct)
        .eq('id', id);
        
      if (updateError) throw updateError;
      
      // Step 2: Delete existing answer associations
      const { error: deleteError } = await supabase
        .from('Product_Answers')
        .delete()
        .eq('productId', id);
      
      if (deleteError) throw deleteError;
      
      // Step 3: Insert new answer associations
      if (selectedAnswers.length > 0) {
        const productAnswerRecords = selectedAnswers.map(answerId => ({
          productId: id,
          answerId: answerId
        }));
        
        const { error: linkError } = await supabase
          .from('Product_Answers')
          .insert(productAnswerRecords);
          
        if (linkError) throw linkError;
      }
      
      // Navigate back to products list
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
            
            {/* Answer Selection Section with Create New Answer button */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Linked Answers
                </label>
                <Button 
                  type="button" 
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateAnswerModal(true)}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Create New Answer
                </Button>
              </div>
              
              <Select 
                onValueChange={handleAnswerSelect} 
                disabled={loadingAnswers}
                value=""
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingAnswers ? "Loading answers..." : "Select an answer"} />
                </SelectTrigger>
                <SelectContent>
                  {answers.map((answer) => (
                    <SelectItem key={answer.id} value={answer.id}>
                      {answer.answerText}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAnswers.length > 0 && (
              <div className="border rounded-md p-3 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Selected Answers</label>
                <div className="space-y-3">
                  {selectedAnswers.map((answerId) => {
                    const answer = answers.find((a) => a.id === answerId);
                    const associatedQuestion = answer ? questions.find(q => q.id === answer.questionsId) : null;
                    
                    return (
                      <div key={answerId} className="border rounded-md p-2 bg-gray-50 relative pr-8">
                        {associatedQuestion && (
                          <div className="mb-1 text-sm">
                            <span className="font-medium">Question: </span>
                            <span>{associatedQuestion.questionText}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <span className="font-medium text-sm mr-2">Answer: </span>
                          <Badge variant="secondary" className="text-sm py-1">
                            {answer?.answerText || "Unknown Answer"}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAnswer(answerId)}
                          className="h-6 w-6 p-0 absolute right-2 top-2 hover:bg-gray-200 rounded-full"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Image
              </label>
              <ImageUpload
                currentImageUrl={product.imageUrl || undefined}
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
      
      {/* Create New Answer Modal */}
      <Dialog open={showCreateAnswerModal} onOpenChange={setShowCreateAnswerModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Answer</DialogTitle>
            <DialogDescription>
              Add a new answer to link to this product
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Answer Text</label>
              <input
                type="text"
                value={newAnswerText}
                onChange={(e) => setNewAnswerText(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter your answer text"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Question</label>
              <Select 
                value={selectedQuestionId} 
                onValueChange={setSelectedQuestionId}
                disabled={loadingQuestions}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingQuestions ? "Loading questions..." : "Select a question"} />
                </SelectTrigger>
                <SelectContent>
                  {questions.map((question) => (
                    <SelectItem key={question.id} value={question.id}>
                      {question.questionText}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateAnswerModal(false)}
              disabled={creatingAnswer}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateNewAnswer}
              disabled={creatingAnswer || !newAnswerText.trim() || !selectedQuestionId}
            >
              {creatingAnswer ? 'Creating...' : 'Create Answer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}