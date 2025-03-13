"use client";

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, ArrowLeft, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export type Category = {
  id: string
  name: string
  description: string
  questions: Question[]
}

export type Question = {
  id: string
  question: string
  answers: string[]
}
export type Product = {
  id: string
  productName: string
}

type AddQuestionModalProps = {
  showAddQuestionModal: boolean;
  setShowAddQuestionModal: (show: boolean) => void;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  products: Product[];
}

export default function AddQuestionModal({
  showAddQuestionModal,
  setShowAddQuestionModal,
  selectedCategoryId,
  setSelectedCategoryId,
  categories,
  setCategories,
  products
}: AddQuestionModalProps) {
  const [questionName, setQuestionName] = React.useState("");
  const [answers, setAnswers] = React.useState([""]);
  // State for step-by-step answer product assignment
  const [currentStep, setCurrentStep] = React.useState(0); // 0: question, 1+: answers
  const [answerProducts, setAnswerProducts] = React.useState<Record<number, string[]>>({});
  const [, setDeletedAnswers] = React.useState<string[]>([]);
  const [answerIdMap, setAnswerIdMap] = React.useState<Record<number, string>>({});
  const [, setRemovedProductLinks] = React.useState<{ answerId: string, productId: string }[]>([]);

  const resetQuestionForm = () => {
    setQuestionName("");
    setAnswers([""]);
    setAnswerProducts({});
    setDeletedAnswers([]);
    setRemovedProductLinks([]);
    setCurrentStep(0);
    setSelectedCategoryId(null);
    setShowAddQuestionModal(false);
    setAnswerIdMap({});
  };

  const handleAddAnswer = () => {
    setAnswers([...answers, ""]);
    setAnswerProducts((prev) => ({
      ...prev,
      [answers.length]: [],
    }));
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateQuestion = async () => {
    if (!questionName.trim() || !selectedCategoryId) return;
    
    try {
      // First, create the question
      const { data: questionData, error: questionError } = await supabase
        .from("Questions")
        .insert([
          { questionText: questionName, categoryId: selectedCategoryId },
        ])
        .select();
  
      if (questionError) throw questionError;
  
      if (questionData) {
        const questionsId = questionData[0].id;
        
        // Insert answers if provided
        const filteredAnswers = answers.filter(a => a.trim()); // Filter out empty strings
        
        if (filteredAnswers.length > 0) {
          const answerPromises = filteredAnswers.map(async (answerText, index) => {
            // Insert the answer first
            const { data: answerData, error: answerError } = await supabase
              .from("Answers")
              .insert({ questionsId: questionsId, answerText: answerText })
              .select();
            
            if (answerError) throw answerError;
            
            // If there are products for this answer and we have answer data, insert the associations
            if (answerData && answerData[0] && answerProducts[index] && answerProducts[index].length > 0) {
              const answerId = answerData[0].id;
              
              // Filter out any invalid product IDs
              const validProductIds = answerProducts[index].filter(id => id && id !== "");
              
              if (validProductIds.length > 0) {
                // Create records for Product_Answers junction table
                const productAnswerRecords = validProductIds.map(productId => ({
                  answerId: answerId,
                  productId: productId
                }));
                
                // Insert the product-answer associations
                const { error: productLinkError } = await supabase
                  .from("Product_Answers")
                  .insert(productAnswerRecords);
                
                if (productLinkError) throw productLinkError;
              }
            }
            
            return answerText;
          });
          
          await Promise.all(answerPromises);
          
          // Update UI state
          setCategories(
            categories.map((category) =>
              category.id === selectedCategoryId
                ? {
                    ...category,
                    questions: [
                      ...category.questions,
                      { 
                        id: questionsId, 
                        question: questionName, 
                        answers: filteredAnswers
                      },
                    ],
                  }
                : category
            )
          );
        }
      }
    } catch (err) {
      console.error("Error creating question:", err);
    } finally {
      // Reset form state
      resetQuestionForm();
    }
  };

  const handleAddProductToAnswer = () => {
    const answerIndex = currentStep - 1;
    setAnswerProducts(prev => {
      const currentProducts = prev[answerIndex] || [];
      return {
        ...prev,
        [answerIndex]: [...currentProducts, ""]
      };
    });
  };

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers((prevAnswers) => {
      const updatedAnswers = [...prevAnswers];
      updatedAnswers[index] = value;
      return updatedAnswers;
    });
  };

  const handleRemoveAnswer = (index: number) => {
    setAnswers((prevAnswers) => prevAnswers.filter((_, i) => i !== index));

    setAnswerProducts((prev) => {
      const newProducts = { ...prev };
      delete newProducts[index];
      return newProducts;
    });
  };

  const handleNextStep = () => {
    // If on the question/answers step
    if (currentStep === 0) {
      // Only proceed if there's at least one answer
      if (answers.filter(a => a.trim()).length > 0) {
        setCurrentStep(1);
      }
    } 
    // If on answer product assignment steps
    else if (currentStep < answers.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleProductChange = (answerIndex: number, productIndex: number, value: string) => {
    setAnswerProducts((prev) => {
      const currentProducts = [...(prev[answerIndex] || [])];

      // Check if we're replacing an existing product
      if (currentProducts[productIndex] && currentProducts[productIndex] !== value && answerIdMap[answerIndex]) {
        setRemovedProductLinks((prevLinks) => [
          ...prevLinks,
          { answerId: answerIdMap[answerIndex], productId: currentProducts[productIndex] },
        ]);
      }

      currentProducts[productIndex] = value;
      return { ...prev, [answerIndex]: currentProducts };
    });
  };

  const handleRemoveProduct = (answerIndex: number, productIndex: number) => {
    console.log(`Removing product from answer ${answerIndex}, product index ${productIndex}`);
  
    setAnswerProducts((prev) => {
      const currentProducts = [...(prev[answerIndex] || [])];
      
      // Track product for deletion if we have both answerId and productId
      if (currentProducts[productIndex] && answerIdMap[answerIndex]) {
        const productToRemove = currentProducts[productIndex];
        const answerId = answerIdMap[answerIndex];
        
        console.log(`Tracking for deletion: answerId=${answerId}, productId=${productToRemove}`);
        
        setRemovedProductLinks((prevLinks) => [
          ...prevLinks, 
          { answerId, productId: productToRemove }
        ]);
      }
  
      // Remove from UI display
      currentProducts.splice(productIndex, 1);
      return { ...prev, [answerIndex]: currentProducts };
    });
  };

  return (
    <Dialog open={showAddQuestionModal} onOpenChange={(open) => {
      if (!open) resetQuestionForm();
      setShowAddQuestionModal(open);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 0 ? "Add New Question" : 
             currentStep === answers.length ? "Review & Create" :
             `Assign Products to Answer ${currentStep}`}
          </DialogTitle>
          <DialogDescription>
            {currentStep > 0 && currentStep <= answers.length && 
              `Step ${currentStep} of ${answers.length}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Question and Answers */}
          {currentStep === 0 && (
            <>
              <Input
                value={questionName}
                onChange={(e) => setQuestionName(e.target.value)}
                placeholder="Question name"
                className="mb-4"
              />
              
              <h3 className="text-sm font-medium">Answers</h3>
              {answers.map((answer, index) => (
                <div key={`add-answer-${index}`} className="flex items-center space-x-2">
                  {/* Answer Input */}
                  <Input
                    value={answer}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder={`Answer ${index + 1}`}
                    className="flex-1"
                  />

                  {/* Delete Answer Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-100"
                    onClick={() => handleRemoveAnswer(index)}
                    disabled={answers.length === 1} // Prevent deleting the last answer
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddAnswer} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add Another Answer
              </Button>
            </>
          )}

          {/* Step 2+: Product Assignment for each answer */}
          {currentStep > 0 && currentStep <= answers.length && answers[currentStep - 1] && (
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-md font-medium">
                  Assign Products to Answer {currentStep}:
                </h3>
                <p className="text-gray-500 mt-1">{answers[currentStep - 1]}</p>
              </div>
              
              {(answerProducts[currentStep - 1] || []).map((selectedProduct, index) => (
                <div key={`product-${index}`} className="flex space-x-2">
                  <Select 
                    value={selectedProduct} 
                    onValueChange={(value) => handleProductChange(currentStep - 1, index, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.productName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-100" 
                    onClick={() => handleRemoveProduct(currentStep - 1, index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  {index === (answerProducts[currentStep - 1] || []).length - 1 && (
                    <Button type="button" variant="outline" onClick={handleAddProductToAnswer} className="flex-shrink-0">
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              {(!answerProducts[currentStep - 1] || answerProducts[currentStep - 1].length === 0) && (
                <Button type="button" variant="outline" onClick={handleAddProductToAnswer} className="w-full">
                  <Plus className="w-4 h-4 mr-2" /> Add Product
                </Button>
              )}
            </div>
          )}
          
          {/* Final review step (optional) */}
          {currentStep > answers.length && (
            <div className="space-y-4">
              <h3 className="text-md font-medium">Review Question</h3>
              <div className="p-3 border rounded-md bg-gray-50">
                <p className="font-medium">{questionName}</p>
              </div>
              
              <h3 className="text-md font-medium">Answers & Associated Products</h3>
              {answers.map((answer, index) => (
                <div key={`review-${index}`} className="p-3 border rounded-md">
                  <p className="font-medium">{answer}</p>
                  <div className="mt-2">
                    {answerProducts[index] && answerProducts[index].length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {answerProducts[index].map((productId, pidx) => {
                          const product = products.find(p => p.id === productId);
                          return (
                            <Badge key={pidx} variant="secondary">
                              {product ? product.productName : 'Unknown Product'}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No products assigned</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-4">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePreviousStep}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
              )}
              
              <div className="flex-1"></div>
              
              {/* Show Next for all steps except the very last one */}
              {currentStep < answers.length && (
                <Button 
                  onClick={handleNextStep}
                  disabled={currentStep === 0 && answers.filter(a => a.trim()).length === 0}
                >
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              
              {/* Show Create only when we've gone through all answers */}
              {currentStep === answers.length && (
                <Button onClick={handleCreateQuestion}>
                  <Check className="w-4 h-4 mr-2" />
                  Create Question
                </Button>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={resetQuestionForm}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  )}