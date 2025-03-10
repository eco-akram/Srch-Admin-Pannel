"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AddQuestionModal, {
  type Category,
  type Question,
} from "@/components/AddQuestionModal";
import { useSession } from "@/context/SessionContext";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

//TODO CREATE A FUNTION TO CHECK IF USER IS AUTHENTICATED

export default function CategoriesPage() {
  const { user, role, isLoading: isAuthChecking } = useSession();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showAddModal, setShowAddModal] = useState(false);

  const totalQuestions = categories.reduce(
    (acc, category) => acc + category.questions.length,
    0
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleAddQuestion = (
    categoryId: string,
    newQuestion: Omit<Question, "id">
  ) => {
    // Generate a unique ID for the new question
    const questionId = `q${Date.now()}`;

    // Add the question to the selected category
    setCategories((prevCategories) =>
      prevCategories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              questions: [
                ...category.questions,
                {
                  id: questionId,
                  ...newQuestion,
                },
              ],
            }
          : category
      )
    );

    // Make sure the category is expanded to show the new question
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: true,
    }));
  };

  const handleDeleteQuestion = (categoryId: string, questionId: string) => {
    setCategories((prevCategories) =>
      prevCategories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              questions: category.questions.filter((q) => q.id !== questionId),
            }
          : category
      )
    );
  };

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

        // Transform data into UI structure
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

useEffect(() => {
    if (!isAuthChecking) {
        fetchData();
    }
}, [isAuthChecking]);


   if (loading == true) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  } 

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <div className="text-xl font-medium">
                <h1>Categories</h1>
              </div>
              <div className="text-sm text-gray-500">
                All questions ({totalQuestions})
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" className="flex items-center space-x-2">
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Export</span>
              </Button>
              <Button
                className="flex items-center space-x-2"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add Question</span>
              </Button>
            </div>
          </div>

          <div className="p-4 border-t flex items-center space-x-4">
            <div className="flex items-center bg-white border rounded-lg px-4 py-2 flex-1">
              <Search className="w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search questions..."
                className="ml-2 outline-none w-full"
                aria-label="Search questions"
              />
            </div>
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add Question</span>
            </Button>
          </div>
        </header>

        <main className="p-6">
          <div className="space-y-6">
            {categories.length === 0 ? (
              <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
                No categories or questions found matching your search.
              </div>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="bg-white rounded-lg border">
                  <div
                    className="flex items-center justify-between p-4 border-b cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div>
                      <h2 className="font-medium text-lg">{category.name}</h2>
                      <p className="text-sm text-gray-500">
                        {category.description}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-2">
                      {expandedCategories[category.id] ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </Button>
                  </div>

                  {expandedCategories[category.id] &&
                    category.questions.length > 0 && (
                      <>
                        <div className="grid grid-cols-5 gap-4 p-4 border-b font-medium text-sm text-gray-500">
                          <div className="col-span-2">Question</div>
                          <div className="col-span-2">All Answers</div>
                          <div className="text-center">Actions</div>
                        </div>

                        {category.questions.map((question) => (
                          <div
                            key={question.id}
                            className="grid grid-cols-5 gap-4 p-4 border-b last:border-0 hover:bg-gray-50 items-center"
                          >
                            <div className="col-span-2">
                              <div className="font-medium">
                                {question.question}
                              </div>
                            </div>
                            <div className="col-span-2">
                              <div className="flex flex-wrap gap-2">
                                {question.answers.map((answer, index) => (
                                  <Badge key={index} variant="secondary">
                                    {answer}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center space-x-1 hover:bg-gray-100"
                              >
                                <Edit
                                  className="w-4 h-4 text-gray-500"
                                  aria-hidden="true"
                                />
                                <span className="text-xs">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center space-x-1 hover:bg-red-100 text-red-500"
                                onClick={() =>
                                  handleDeleteQuestion(category.id, question.id)
                                }
                              >
                                <Trash2
                                  className="w-4 h-4"
                                  aria-hidden="true"
                                />
                                <span className="text-xs">Delete</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                  {expandedCategories[category.id] &&
                    category.questions.length === 0 && (
                      <div className="p-6 text-center text-gray-500">
                        No questions in this category.
                      </div>
                    )}
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <AddQuestionModal
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onAddQuestion={handleAddQuestion}
        />
      )}
    </div>
  );
}
