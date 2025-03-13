import React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

export type Category = {
  id: string;
  name: string;
  description: string;
  questions: Question[];
};

export type Question = {
  id: string;
  question: string;
  answers: string[];
};

interface AddCategoryModalProps {
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  setExpandedCategories: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export default function AddCategoryModal({
  showAddModal,
  setShowAddModal,
  categories,
  setCategories,
  setExpandedCategories,
}: AddCategoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      // Add validation feedback
      alert("Category name cannot be empty");
      return;
    }
    setLoading(true); // Show loading state
    try {
      const { data, error } = await supabase
        .from("Categories")
        .insert([
          {
            categoryName: newCategoryName,
            categoryDescription: newCategoryDescription || "", // Handle empty description gracefully
          },
        ])
        .select();
      if (error) {
        console.error("Supabase error:", error);
        alert(`Failed to create category: ${error.message}`);
        throw error;
      }
      if (data && data.length > 0) {
        // Update the categories state with the new category
        setCategories([
          ...categories,
          {
            id: data[0].id,
            name: data[0].categoryName,
            description: data[0].categoryDescription || "",
            questions: [],
          },
        ]);
        // Expand the new category by default
        setExpandedCategories((prev) => ({
          ...prev,
          [data[0].id]: true,
        }));
        // Close the modal automatically on success
        setShowAddModal(false);
        // Removed the success alert
      } else {
        alert("Failed to create category. No data returned from server.");
      }
    } catch (err) {
      console.error("Error creating category:", err);
    } finally {
      setLoading(false);
      // Reset form fields
      setNewCategoryName("");
      setNewCategoryDescription("");
    }
  };

  return (
    <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
        </DialogHeader>
        <Input
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Category name"
        />
        <Input
          value={newCategoryDescription}
          onChange={(e) => setNewCategoryDescription(e.target.value)}
          placeholder="Category description"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreateCategory} disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}