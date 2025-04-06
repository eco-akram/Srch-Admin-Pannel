"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Answer = {
  id: string;
  answerText: string;
  questionsId: string;
};

type Product = {
  id: string;
  productName: string;
};

type AddProductModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded?: (product: Product) => void;
};

export default function AddProductModal({
  open,
  onOpenChange,
  onProductAdded,
}: AddProductModalProps) {
  const [productName, setProductName] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Fetch answers when the modal opens
  useEffect(() => {
    if (open) {
      fetchAnswers();
    }
  }, [open]);

  const fetchAnswers = async () => {
    try {
      setLoading(true);
      const { data: answersData, error } = await supabase
        .from("Answers")
        .select("id, answerText, questionsId");

      if (error) throw error;
      
      setAnswers(answersData || []);
    } catch (err) {
      console.error("Error fetching answers:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProductName("");
    setSelectedAnswers([]);
    setSelectedAnswerId("");
  };

  const handleAddAnswer = () => {
    if (selectedAnswerId && !selectedAnswers.includes(selectedAnswerId)) {
      const answerToAdd = answers.find((a) => a.id === selectedAnswerId);
      if (answerToAdd) {
        setSelectedAnswers([...selectedAnswers, selectedAnswerId]);
      }
      setSelectedAnswerId("");
    }
  };

  const handleRemoveAnswer = (answerId: string) => {
    setSelectedAnswers(selectedAnswers.filter((id) => id !== answerId));
  };

  const handleCreateProduct = async () => {
    if (!productName.trim()) return;

    try {
      setLoading(true);
      
      // Step 1: Create the product
      const { data: productData, error: productError } = await supabase
        .from("Products")
        .insert([{ productName: productName.trim() }])
        .select();

      if (productError) throw productError;
      
      if (productData && productData[0]) {
        const newProductId = productData[0].id;
        
        // Step 2: Create product-answer associations if there are any selected answers
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
        
        // Notify parent component about the new product
        if (onProductAdded) {
          onProductAdded(productData[0]);
        }
        
        // Close modal and reset form
        onOpenChange(false);
        resetForm();
      }
    } catch (err) {
      console.error("Error creating product:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Create a new product and link it with answers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="productName" className="text-sm font-medium">
              Product Name
            </label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Enter product name"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Link Answers
            </label>
            <div className="flex gap-2">
              <Select value={selectedAnswerId} onValueChange={setSelectedAnswerId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select an answer" />
                </SelectTrigger>
                <SelectContent>
                  {answers.map((answer) => (
                    <SelectItem key={answer.id} value={answer.id}>
                      {answer.answerText}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={handleAddAnswer} disabled={!selectedAnswerId}>
                Add
              </Button>
            </div>
          </div>

          {selectedAnswers.length > 0 && (
            <div className="border rounded-md p-3 space-y-2">
              <label className="text-sm font-medium">Selected Answers</label>
              <div className="flex flex-wrap gap-2">
                {selectedAnswers.map((answerId) => {
                  const answer = answers.find((a) => a.id === answerId);
                  return (
                    <Badge key={answerId} variant="secondary" className="pr-1">
                      {answer?.answerText || "Unknown Answer"}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAnswer(answerId)}
                        className="h-5 w-5 p-0 ml-1 hover:bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateProduct} 
            disabled={!productName.trim() || loading}
          >
            <Check className="w-4 h-4 mr-2" />
            Create Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
