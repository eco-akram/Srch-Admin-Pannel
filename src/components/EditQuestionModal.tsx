"use client";

import type React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ArrowRight,
  ArrowLeft,
  Check,
  X
} from "lucide-react";
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

// Define types outside the component
type Category = {
  id: string
  name: string
  description: string
  questions: Question[]
}

type Question = {
  id: string
  question: string
  answers: string[]
}

type Product = {
    id: string
    productName: string
  }

// Props interface for the component
interface EditQuestionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingQuestion: Question | null;
    selectedCategoryId: string | null;
    categories: Category[];
    onCategoriesChange?: (categories: Category[]) => void;
    products: Product[];
    initialAnswerProducts?: Record<number, string[]>;
    initialAnswerIdMap?: Record<number, string>;
  }
  

export default function EditQuestionModal({
    open,
    onOpenChange,
    editingQuestion: initialEditingQuestion,
    selectedCategoryId: initialSelectedCategoryId,
    categories: initialCategories,
    onCategoriesChange,
    products = [],
    initialAnswerProducts = {},
    initialAnswerIdMap = {}
}: EditQuestionModalProps) {
  const [, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(initialEditingQuestion);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialSelectedCategoryId);
  const [questionName, setQuestionName] = useState("");
  const [answers, setAnswers] = useState([""]);
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(open);
  // State for step-by-step answer product assignment
  const [currentStep, setCurrentStep] = useState(0); // 0: question, 1+: answers
  const [, setDeletedAnswers] = useState<string[]>([]);
  const [removedProductLinks, setRemovedProductLinks] = useState<{ answerId: string, productId: string }[]>([]);
  const [answerProducts, setAnswerProducts] = useState<Record<number, string[]>>(initialAnswerProducts);
  const [answerIdMap, setAnswerIdMap] = useState<Record<number, string>>(initialAnswerIdMap);
  
  // Sync state with props
  useEffect(() => {
    setShowEditQuestionModal(open);
  }, [open]);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    setEditingQuestion(initialEditingQuestion);
  }, [initialEditingQuestion]);

  useEffect(() => {
    setSelectedCategoryId(initialSelectedCategoryId);
  }, [initialSelectedCategoryId]);

  // Important: Update answerProducts and answerIdMap when initialAnswerProducts/initialAnswerIdMap change
  useEffect(() => {
    // Only update if there's actual data to avoid overwriting with empty objects
    if (Object.keys(initialAnswerProducts).length > 0) {
      setAnswerProducts(initialAnswerProducts);
      console.log("Updated answerProducts with:", initialAnswerProducts);
    }
  }, [initialAnswerProducts]);

  useEffect(() => {
    if (Object.keys(initialAnswerIdMap).length > 0) {
      setAnswerIdMap(initialAnswerIdMap);
      console.log("Updated answerIdMap with:", initialAnswerIdMap);
    }
  }, [initialAnswerIdMap]);
  
  useEffect(() => {
    console.log("EditQuestionModal: answerProducts state", answerProducts);
  }, [answerProducts]);

  // Initialize form when editing question changes
  useEffect(() => {
    if (editingQuestion) {
      setQuestionName(editingQuestion.question);
      setAnswers(editingQuestion.answers.length > 0 ? editingQuestion.answers : [""]);
      
      // Don't reset other states here, as it will clear the product data
      setCurrentStep(0);
      setDeletedAnswers([]);
      setRemovedProductLinks([]);
      
      // Note: We're no longer resetting answerProducts here
    }
  }, [editingQuestion]);

  const resetQuestionForm = () => {
    setQuestionName("");
    setAnswers([""]);
    setAnswerProducts({});
    setAnswerIdMap({});
    setDeletedAnswers([]); 
    setRemovedProductLinks([]);
    setCurrentStep(0);
    setSelectedCategoryId(null);
    setEditingQuestion(null);
    onOpenChange(false);
  };

  const handleRemoveAnswer = (index: number) => {
    // Store the answer ID if it exists before removing
    if (answerIdMap[index]) {
      setDeletedAnswers(prev => [...prev, answerIdMap[index]]);
    }
    
    setAnswers((prevAnswers) => prevAnswers.filter((_, i) => i !== index));
  
    // Rebuild answer products and ID map after removing
    const newProducts: Record<number, string[]> = {};
    const newIdMap: Record<number, string> = {};
    
    let newIndex = 0;
    for (let i = 0; i < answers.length; i++) {
      if (i !== index) {
        newProducts[newIndex] = answerProducts[i] || [];
        if (answerIdMap[i]) {
          newIdMap[newIndex] = answerIdMap[i];
        }
        newIndex++;
      }
    }
    
    setAnswerProducts(newProducts);
    setAnswerIdMap(newIdMap);
  };

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers((prevAnswers) => {
      const updatedAnswers = [...prevAnswers];
      updatedAnswers[index] = value;
      return updatedAnswers;
    });
  };
  
  const handleAddAnswer = () => {
    setAnswers([...answers, ""]);
    // No need to update product assignments for a new empty answer
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

  const handleUpdateQuestion = async () => {
    if (!questionName.trim() || !selectedCategoryId || !editingQuestion) return;
  
    console.log("Update question function called");
    console.log("Current answerProducts:", answerProducts);
    console.log("Current answerIdMap:", answerIdMap);

    try {
      setLoading(true);
  
      // Step 1: Update the question text
      const { error: questionError } = await supabase
        .from("Questions")
        .update({ questionText: questionName })
        .eq("id", editingQuestion.id);
  
      if (questionError) throw questionError;
  
      // Step 2: Fetch existing answers
      const { data: existingAnswers, error: answersError } = await supabase
        .from("Answers")
        .select("id, answerText")
        .eq("questionsId", editingQuestion.id);
  
      if (answersError) throw answersError;
  
      const existingAnswersArray = existingAnswers ?? [];
      const currentAnswerTexts = answers.filter((a) => a.trim());
  
      const updatedAnswerIds: string[] = [];
  
      // Step 2.5: Fetch existing product-answer relationships
      const { data: existingProductLinks, error: productLinksError } = await supabase
        .from("Product_Answers")
        .select("answerId, productId")
        .in("answerId", existingAnswersArray.map(a => a.id));
    
      if (productLinksError) throw productLinksError;
    
      const existingProductLinksArray = existingProductLinks ?? [];
    
      // Step 3: Update existing answers or insert new ones
      for (let i = 0; i < currentAnswerTexts.length; i++) {
        const answerText = currentAnswerTexts[i];
        const existingAnswer = existingAnswersArray.find(
          (ea) => ea.answerText === answerText
        );
  
        let answerId: string;
  
        if (existingAnswer) {
          // Update existing answer
          const { error: updateError } = await supabase
            .from("Answers")
            .update({ answerText })
            .eq("id", existingAnswer.id);
  
          if (updateError) throw updateError;
          answerId = existingAnswer.id;
        } else {
          // Insert new answer
          const { data: newAnswer, error: newAnswerError } = await supabase
            .from("Answers")
            .insert({ questionsId: editingQuestion.id, answerText })
            .select();
  
          if (newAnswerError) throw newAnswerError;
          answerId = newAnswer[0].id;
        }
  
        updatedAnswerIds.push(answerId);
      }
  
      // Step 4: Delete removed answers and their product associations
      const answerIdsToDelete = existingAnswersArray
        .filter((ea) => !currentAnswerTexts.includes(ea.answerText))
        .map((a) => a.id);
  
      if (answerIdsToDelete.length > 0) {
        // Delete associated products first
        await supabase.from("Product_Answers").delete().in("answerId", answerIdsToDelete);
        await supabase.from("Answers").delete().in("id", answerIdsToDelete);
      }
  
      // Step 5: Handle product link deletions
      if (removedProductLinks.length > 0) {
        console.log("Removing product links:", removedProductLinks);
        
        // Process product deletions one by one instead of using .or()
        for (const { answerId, productId } of removedProductLinks) {
          const { error: deleteProductLinkError } = await supabase
            .from("Product_Answers")
            .delete()
            .eq("answerId", answerId)
            .eq("productId", productId);
          
          if (deleteProductLinkError) {
            console.error("Error deleting Product_Answer:", deleteProductLinkError, { answerId, productId });
          }
        }
      }
  
      // Step 6: Insert new product associations
      const newProductLinks: { answerId: string; productId: string }[] = [];
  
      // Build new product links by mapping answers to their products
      Object.entries(answerProducts).forEach(([indexStr, productIds]) => {
        const index = parseInt(indexStr, 10);
        const answerId = updatedAnswerIds[index]; 
        
        if (answerId) {
          productIds.forEach((productId) => {
            const exists = existingProductLinksArray?.some(
              (link) => link.answerId === answerId && link.productId === productId
            );
            
            if (!exists && productId) {
              newProductLinks.push({ answerId, productId });
            }
          });
        }
      });
  
      if (newProductLinks.length > 0) {
        console.log("Adding new product links:", newProductLinks);
        await supabase.from("Product_Answers").insert(newProductLinks);
      }
  
      // Step 7: Update UI state
      const updatedCategories = categories.map((category) =>
        category.id === selectedCategoryId
          ? {
              ...category,
              questions: category.questions.map((q) =>
                q.id === editingQuestion.id
                  ? { ...q, question: questionName, answers: currentAnswerTexts }
                  : q
              ),
            }
          : category
      );
      
      setCategories(updatedCategories);
      
      // Notify parent component of category changes if callback is provided
      if (onCategoriesChange) {
        onCategoriesChange(updatedCategories);
      }
  
      // Step 8: Reset form state
      resetQuestionForm();
    } catch (err) {
      console.error("Error updating question:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Helper function to find product name by ID
  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.productName : "Unknown Product";
  };

  // Log state for debugging
  useEffect(() => {
    if (currentStep > 0 && currentStep <= answers.length) {
      console.log(`Products for answer ${currentStep-1}:`, answerProducts[currentStep-1] || []);
    }
  }, [currentStep, answerProducts, answers.length]);

  return (
    <Dialog 
      open={showEditQuestionModal} 
      onOpenChange={(open) => {
        if (!open) resetQuestionForm();
        setShowEditQuestionModal(open);
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 0 ? "Edit Question" : 
            currentStep === answers.length ? "Review & Update" :
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
                <div key={`edit-answer-${index}`} className="flex items-center space-x-2">
                  {/* Answer Input */}
                  <Input
                    value={answer}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder={`Answer ${index + 1}`}
                    className="flex-1"
                  />

                  {/* Delete Answer Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-100"
                    onClick={() => handleRemoveAnswer(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={handleAddAnswer} className="w-full">
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
            
            {/* Display current product assignments */}
            {(answerProducts[currentStep - 1] || []).length > 0 ? (
              (answerProducts[currentStep - 1] || []).map((selectedProduct, index) => (
                <div key={`edit-product-${index}`} className="flex space-x-2">
                  <Select 
                    value={selectedProduct} 
                    onValueChange={(value) => handleProductChange(currentStep - 1, index, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a product">
                        {selectedProduct ? getProductName(selectedProduct) : "Select a product"}
                      </SelectValue>
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
                    variant="ghost" 
                    size="icon" 
                    className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-100" 
                    onClick={() => handleRemoveProduct(currentStep - 1, index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  {index === (answerProducts[currentStep - 1] || []).length - 1 && (
                    <Button variant="outline" onClick={handleAddProductToAnswer} className="flex-shrink-0">
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <Button variant="outline" onClick={handleAddProductToAnswer} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </Button>
            )}
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
          
          {/* Show Update only when we've gone through all answers */}
          {currentStep === answers.length && (
            <Button onClick={handleUpdateQuestion}>
              <Check className="w-4 h-4 mr-2" />
              Update Question
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
);
}