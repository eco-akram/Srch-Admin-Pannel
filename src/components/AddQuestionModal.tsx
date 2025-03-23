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
}: AddQuestionModalProps) {
  const [questionName, setQuestionName] = React.useState("");
  const [answers, setAnswers] = React.useState([""]);
  // State for step-by-step answer product assignment
  const [currentStep, setCurrentStep] = React.useState(0); // 0: question, 1+: answers
  const [answerProducts, setAnswerProducts] = React.useState<Record<number, string[]>>({});

  const resetQuestionForm = () => {
    setQuestionName("");
    setAnswers([""]);
    setAnswerProducts({});
    setCurrentStep(0);
    setSelectedCategoryId(null);
    setShowAddQuestionModal(false);
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
        const filteredAnswers = answers.filter((a) => a.trim()); // Filter out empty strings
  
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
              const validProductIds = answerProducts[index].filter((id) => id && id !== "");
  
              if (validProductIds.length > 0) {
                // Create records for Product_Answers junction table
                const productAnswerRecords = validProductIds.map((productId) => ({
                  answerId: answerId,
                  productId: productId,
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
        }
  
        // Update the local state for categories
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
                      answers: filteredAnswers,
                    },
                  ],
                }
              : category
          )
        );
      }
    } catch (err) {
      console.error("Error creating question:", err);
    } finally {
      // Reset form state
      resetQuestionForm();
    }
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
            </>
          )}
      
          </div>

          <DialogFooter className="mt-6">
          { answers.length && (
                <Button onClick={handleCreateQuestion}>
                  <Check className="w-4 h-4 mr-2" />
                  Create Question
                </Button>
              )}
            <Button variant="outline" onClick={resetQuestionForm}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  )}