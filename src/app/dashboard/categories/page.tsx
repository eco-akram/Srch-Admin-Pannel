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
import { useSession } from "@/context/SessionContext";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Question, Category } from "@/components/AddQuestionModal";
import AddQuestionModal from "@/components/AddQuestionModal";
import EditQuestionModal from "@/components/EditQuestionModal"; // Adjust the path as needed
import AddCategoryModal from "@/components/AddCategoryModal";
import { Product } from "@/components/AddQuestionModal";
//TODO CREATE A FUNTION TO CHECK IF USER IS AUTHENTICATED

export default function CategoriesPage() {
  const { user, role, isLoading: isAuthChecking } = useSession();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [answers, setAnswers] = useState([""]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  // State for step-by-step answer product assignment
  const [, setCurrentStep] = useState(0); // 0: question, 1+: answers
  const [answerProducts, setAnswerProducts] = useState<
    Record<number, string[]>
  >({});
  const [answerIdMap, setAnswerIdMap] = useState<Record<number, string>>({});
  const totalQuestions = categories.reduce(
    (acc, category) => acc + category.questions.length,
    0
  );
  const [, setQuestionName] = useState("");
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleEditClick = async (question: Question) => {
    try {
      setLoading(true);
      const { data: questionData, error: questionError } = await supabase
        .from("Questions")
        .select(
          `
          id, questionText, categoryId,
          Answers(id, answerText, 
            Product_Answers(id, productId))
        `
        )
        .eq("id", question.id)
        .single();

      if (questionError) throw questionError;

      if (!questionData || !questionData.Answers) {
        console.error("No answers found for this question!");
        return;
      }

      // First, set up the question and basic data
      setEditingQuestion(question);
      setSelectedCategoryId(questionData.categoryId);
      setQuestionName(questionData.questionText);

      // Set up answers
      const fetchedAnswers = questionData.Answers.map(
        (answer) => answer.answerText
      );
      setAnswers(fetchedAnswers.length > 0 ? fetchedAnswers : [""]);

      // Log each answer and its products for debugging
      questionData.Answers.forEach((answer, index) => {
        console.log(`Answer ${index}: ${answer.answerText}`);
        console.log(
          `Products for answer ${index}:`,
          answer.Product_Answers?.map((pa) => pa.productId) || []
        );
      });

      // Set up product relationships
      const productRelationships: Record<number, string[]> = {};
      const answerIdMapping: Record<number, string> = {};

      questionData.Answers.forEach((answer, index) => {
        answerIdMapping[index] = answer.id;

        // Make sure to map the product IDs properly
        productRelationships[index] = answer.Product_Answers
          ? answer.Product_Answers.map((pa) => pa.productId)
          : [];
      });

      // Log the product relationships and answer ID mapping for debugging
      console.log("Product relationships:", productRelationships);
      console.log("Answer ID mapping:", answerIdMapping);

      // Open the modal with the prepared data
      setShowEditQuestionModal(true);
      setCurrentStep(0);

      // Important: Set these AFTER all other state has been set
      // This ensures the data is passed correctly to the modal
      setAnswerProducts(productRelationships);
      setAnswerIdMap(answerIdMapping);
    } catch (err) {
      console.error("Error fetching question details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch categories and questions
        const { data: categoriesData, error: categoriesError } =
        await supabase.from("Categories").select(`
          id, categoryName, categoryDescription,
          Questions(id, questionText, 
              Answers(id, answerText)
          )
        `);
      

        if (categoriesError) throw categoriesError;

        const formattedData = categoriesData.map((category) => ({
          id: category.id,
          name: category.categoryName,
          description: category.categoryDescription,
          questions: category.Questions ? category.Questions.map((question) => ({
            id: question.id,
            question: question.questionText,
            answers: question.Answers ? question.Answers.map((answer) => answer.answerText) : [],
          })) : []
        }));
        

        setCategories(formattedData);

        // Fetch products
        await getProducts();
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (!isAuthChecking) {
      fetchData();
    }
  }, [isAuthChecking]);

  // Fetch products from database
  const getProducts = async () => {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from("Products")
        .select("id, productName");

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  // Initialize answerProducts when answers change
  useEffect(() => {
    const newAnswerProducts = { ...answerProducts };
    answers.forEach((_, index) => {
      if (!newAnswerProducts[index]) {
        newAnswerProducts[index] = [];
      }
    });
    setAnswerProducts(newAnswerProducts);
  }, [answers]);

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      setLoading(true);

      // Get answer IDs first
      const { data: answers, error: answersError } = await supabase
        .from("Answers")
        .select("id")
        .eq("questionsId", questionId);

      if (answersError) throw answersError;

      if (answers && answers.length > 0) {
        const answerIds = answers.map((a) => a.id);

        // Delete product associations first
        const { error: productLinkDeleteError } = await supabase
          .from("Product_Answers")
          .delete()
          .in("answerId", answerIds);

        if (productLinkDeleteError) throw productLinkDeleteError;

        // Then delete the answers
        const { error: answerDeleteError } = await supabase
          .from("Answers")
          .delete()
          .eq("questionsId", questionId);

        if (answerDeleteError) throw answerDeleteError;
      }

      // Finally delete the question
      const { error: questionDeleteError } = await supabase
        .from("Questions")
        .delete()
        .eq("id", questionId);

      if (questionDeleteError) throw questionDeleteError;

      // Update UI state
      setCategories(
        categories.map((category) => ({
          ...category,
          questions: category.questions.filter((q) => q.id !== questionId),
        }))
      );
    } catch (err) {
      console.error("Error deleting question:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4" /> Add Category
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
                  <div className="flex items-center justify-between p-4 border-b cursor-pointer hover:bg-gray-50">
                    <div className="flex-row items-center ">
                      <h2 className="font-medium text-lg">{category.name}</h2>
                      <p className="text-sm text-gray-500">
                        {category.description}
                      </p>
                    </div>
                    <Button
                      className="mx-4 mt-3"
                      onClick={() => {
                        setSelectedCategoryId(category.id);
                        setShowAddQuestionModal(true);
                      }}
                    >
                      <Plus className="w-4 h-4" /> Add Question
                    </Button>
                  </div>

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
                        </div>
                        <div className="col-span-2">
                          <div className="flex flex-wrap gap-2">
                            {question.answers.map((answer, index) => (
                              <Badge key={index} variant="outline">
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
                            onClick={() => handleEditClick(question)}
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
                            onClick={() => handleDeleteQuestion(question.id)}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                            <span className="text-xs">Delete</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </>

                  {category.questions.length === 0 && (
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

      {/* Add Category Modal */}
      <AddCategoryModal
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        categories={categories}
        setCategories={setCategories}
      />

      {/* Add Question Modal */}
      <AddQuestionModal
        showAddQuestionModal={showAddQuestionModal}
        setShowAddQuestionModal={setShowAddQuestionModal}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        categories={categories}
        setCategories={setCategories}
        products={products}
      />

      {/* Edit Question Modal */}

      <EditQuestionModal
        open={showEditQuestionModal}
        onOpenChange={setShowEditQuestionModal}
        editingQuestion={editingQuestion}
        selectedCategoryId={selectedCategoryId}
        categories={categories}
        onCategoriesChange={setCategories}
        products={products}
        initialAnswerProducts={answerProducts}
        initialAnswerIdMap={answerIdMap}
      />
    </div>
  );
}
