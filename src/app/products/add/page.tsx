// src/app/products/add/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X, Plus } from 'lucide-react';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
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

export default function AddProduct() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    productImage: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New state for answers functionality
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  
  // New state for creating answers
  const [showCreateAnswerModal, setShowCreateAnswerModal] = useState(false);
  const [newAnswerText, setNewAnswerText] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [creatingAnswer, setCreatingAnswer] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Fetch answers when the component mounts
  useEffect(() => {
    fetchAnswers();
    fetchQuestions();
  }, []);

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
      setError(err instanceof Error ? err.message : 'Failed to fetch answers');
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Modified to directly add the selected answer
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
      setError("Answer text and question are required");
      return;
    }
    
    try {
      setCreatingAnswer(true);
      setError(null);
      
      // Create new answer in Supabase
      const { data: newAnswer, error: createError } = await supabase
        .from("Answers")
        .insert([
          { 
            answerText: newAnswerText.trim(),
            questionsId: selectedQuestionId
          }
        ])
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
      setError(err instanceof Error ? err.message : 'Failed to create answer');
    } finally {
      setCreatingAnswer(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Add lastUpdated timestamp for new products
      const newProduct = {
        ...formData,
        productDescription: formData.productDescription || null,
        productImage: formData.productImage || null,
        lastUpdated: new Date().toISOString() 
      };

      const { data, error: insertError } = await supabase
        .from('Products')
        .insert([newProduct])
        .select();
      
      if (insertError) throw insertError;
      
      if (data && data.length > 0) {
        const newProductId = data[0].id;
        
        // Create product-answer associations if there are any selected answers
        if (selectedAnswers.length > 0) {
          const productAnswerRecords = selectedAnswers.map((answerId) => ({
            productId: newProductId,
            answerId: answerId,
          }));
          
          const { error: linkError } = await supabase
            .from("Product_Answers")
            .insert(productAnswerRecords);
            
          if (linkError) throw linkError;
        }
      }
      
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
          
          {/* Answer Selection Section with Create New Answer button */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">
                Link Answers
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