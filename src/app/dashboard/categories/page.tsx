"use client"

import type React from "react"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Plus, Search, Filter, Edit, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import Sidebar from "@/components/Sidebar"
import AddQuestionModal, { type Category, type Question } from "@/components/AddQuestionModal"

// Sample data structure
const initialCategories: Category[] = [
  {
    id: "cat1",
    name: "Product Type",
    description: "Questions about the type of product",
    questions: [
      {
        id: "q1",
        question: "What type of product are you looking for?",
        description: "Select the category that best matches your needs",
        answers: ["Smartphone", "Laptop", "Tablet", "Desktop", "Accessories"],
      },
      {
        id: "q2",
        question: "What will be the primary use?",
        description: "How do you plan to use this product most often?",
        answers: ["Business", "Personal", "Gaming", "Creative work", "Education"],
      },
    ],
  },
  {
    id: "cat2",
    name: "Budget & Preferences",
    description: "Questions about budget and brand preferences",
    questions: [
      {
        id: "q3",
        question: "What is your budget range?",
        description: "Select your preferred price range",
        answers: ["Under $500", "$500-$1000", "$1000-$2000", "Over $2000"],
      },
      {
        id: "q4",
        question: "Do you have brand preferences?",
        description: "Select brands you prefer or are interested in",
        answers: ["Apple", "Samsung", "Microsoft", "Google", "Dell", "HP", "No preference"],
      },
    ],
  },
  {
    id: "cat3",
    name: "Features & Specifications",
    description: "Questions about specific features and requirements",
    questions: [
      {
        id: "q5",
        question: "What screen size do you prefer?",
        description: "Select your ideal display size",
        answers: ['Small (under 6")', 'Medium (6-10")', 'Large (10-15")', 'Extra Large (15"+)'],
      },
      {
        id: "q6",
        question: "What storage capacity do you need?",
        description: "Select the minimum storage requirement",
        answers: ["64GB", "128GB", "256GB", "512GB", "1TB+"],
      },
      {
        id: "q7",
        question: "Which features are most important?",
        description: "Select the features that matter most to you",
        answers: ["Battery life", "Performance", "Camera quality", "Display quality", "Portability", "Storage"],
      },
    ],
  },
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    initialCategories.reduce((acc, category) => ({ ...acc, [category.id]: true }), {}),
  )
  const [showAddModal, setShowAddModal] = useState(false)

  const totalQuestions = categories.reduce((acc, category) => acc + category.questions.length, 0)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  const handleAddQuestion = (categoryId: string, newQuestion: Omit<Question, "id">) => {
    // Generate a unique ID for the new question
    const questionId = `q${Date.now()}`

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
          : category,
      ),
    )

    // Make sure the category is expanded to show the new question
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: true,
    }))
  }

  const handleDeleteQuestion = (categoryId: string, questionId: string) => {
    setCategories((prevCategories) =>
      prevCategories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              questions: category.questions.filter((q) => q.id !== questionId),
            }
          : category,
      ),
    )
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
              <div className="text-sm text-gray-500">All questions ({totalQuestions})</div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" className="flex items-center space-x-2">
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Export</span>
              </Button>
              <Button className="flex items-center space-x-2" onClick={() => setShowAddModal(true)}>
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
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-2">
                      {expandedCategories[category.id] ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </Button>
                  </div>

                  {expandedCategories[category.id] && category.questions.length > 0 && (
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
                            <div className="font-medium">{question.question}</div>
                            <div className="text-sm text-gray-500">{question.description}</div>
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
                            <Button variant="ghost" size="sm" className="flex items-center space-x-1 hover:bg-gray-100">
                              <Edit className="w-4 h-4 text-gray-500" aria-hidden="true" />
                              <span className="text-xs">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center space-x-1 hover:bg-red-100 text-red-500"
                              onClick={() => handleDeleteQuestion(category.id, question.id)}
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                              <span className="text-xs">Delete</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {expandedCategories[category.id] && category.questions.length === 0 && (
                    <div className="p-6 text-center text-gray-500">No questions in this category.</div>
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
  )
}

