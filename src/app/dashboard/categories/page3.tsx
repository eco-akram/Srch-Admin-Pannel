"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Plus, Search, Edit, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AddQuestionModal, { type Category, type Question } from "@/components/AddQuestionModal";
import { useSession } from "@/context/SessionContext";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function CategoriesPage() {
  const { user, role, isLoading: isAuthChecking } = useSession();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("Categories")
          .select(`
            id, categoryName, categoryDescription,
            Questions!inner(id, questionText, 
                Answers!inner(id, answerText)
            )
          `);

        if (error) throw error;

        const formattedData = data.map(category => ({
          id: category.id,
          name: category.categoryName,
          description: category.categoryDescription,
          questions: category.Questions.map(question => ({
            id: question.id,
            question: question.questionText,
            answers: question.Answers.map(answer => answer.answerText)
          }))
        }));

        setCategories(formattedData);
        setExpandedCategories(
          formattedData.reduce((acc, category) => ({ ...acc, [category.id]: true }), {})
        );
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (!isAuthChecking) {
      fetchData();
    }
  }, [isAuthChecking]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b p-4 flex items-center justify-between">
          <h1 className="text-xl font-medium">Categories</h1>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" /> Add Question
          </Button>
        </header>

        <main className="p-6">
          {categories.length === 0 ? (
            <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
              No categories or questions found.
            </div>
          ) : (
            categories.map(category => (
              <div key={category.id} className="bg-white rounded-lg border mb-4">
                <div className="p-4 flex justify-between items-center border-b cursor-pointer hover:bg-gray-50" onClick={() => toggleCategory(category.id)}>
                  <div>
                    <h2 className="font-medium text-lg">{category.name}</h2>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    {expandedCategories[category.id] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </Button>
                </div>

                {expandedCategories[category.id] && category.questions.length > 0 && (
                  <div className="p-4">
                    {category.questions.map(question => (
                      <div key={question.id} className="p-4 border-b flex justify-between items-center last:border-0">
                        <div>
                          <p className="font-medium">{question.question}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {question.answers.map((answer, index) => (
                              <Badge key={index} variant="secondary">{answer}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </main>
      </div>
      {showAddModal && <AddQuestionModal categories={categories} onClose={() => setShowAddModal(false)} onAddQuestion={() => {}} />}
    </div>
  );
}
