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
  
  // Check if user is admin
  const isAdmin = role === "admin";
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Filter categories and questions based on search query
  const filteredCategories = categories.filter(category => {
    // If search query is empty, show all categories
    if (!searchQuery.trim()) return true;
    
    // Check if category name or description matches the search query
    const categoryMatches = 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Check if any question in the category matches the search query
    const questionMatches = category.questions.some(question => 
      question.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.answers.some(answer => 
        answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    
    return categoryMatches || questionMatches;
  });

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
          questions: category.Questions
            ? category.Questions.map((question) => ({
                id: question.id,
                question: question.questionText,
                answers: question.Answers
                  ? question.Answers.map((answer) => answer.answerText)
                  : [],
              }))
            : [],
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

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      setLoading(true);
      console.log("Starting category deletion for ID:", categoryId);
  
      // First, check if the category exists
      const { data: categoryExists, error: categoryCheckError } = await supabase
        .from("Categories")
        .select("id")
        .eq("id", categoryId)
        .single();
      
      if (categoryCheckError) {
        console.error("Error checking if category exists:", categoryCheckError);
        throw categoryCheckError;
      }
      
      if (!categoryExists) {
        console.error("Category not found:", categoryId);
        alert("Category not found. It may have already been deleted.");
        return;
      }
      
      console.log("Category exists, proceeding with deletion");
  
      // Fetch all questions associated with the category
      const { data: questions, error: questionsError } = await supabase
        .from("Questions")
        .select("id")
        .eq("categoryId", categoryId);
  
      if (questionsError) {
        console.error("Error fetching questions:", questionsError);
        throw questionsError;
      }
  
      console.log("Found questions to delete:", questions?.length || 0);
  
      if (questions && questions.length > 0) {
        const questionIds = questions.map((q) => q.id);
  
        // Fetch all answers associated with the questions
        const { data: answers, error: answersError } = await supabase
          .from("Answers")
          .select("id")
          .in("questionsId", questionIds);
  
        if (answersError) {
          console.error("Error fetching answers:", answersError);
          throw answersError;
        }
  
        console.log("Found answers to delete:", answers?.length || 0);
  
        if (answers && answers.length > 0) {
          const answerIds = answers.map((a) => a.id);
  
          // Delete product associations for the answers
          const { error: productLinkDeleteError } = await supabase
            .from("Product_Answers")
            .delete()
            .in("answerId", answerIds);
  
          if (productLinkDeleteError) {
            console.error("Error deleting product links:", productLinkDeleteError);
            throw productLinkDeleteError;
          }
  
          console.log("Deleted product associations");
  
          // Delete the answers
          const { error: answerDeleteError } = await supabase
            .from("Answers")
            .delete()
            .in("id", answerIds);
  
          if (answerDeleteError) {
            console.error("Error deleting answers:", answerDeleteError);
            throw answerDeleteError;
          }
  
          console.log("Deleted answers");
        }
  
        // Delete the questions
        const { error: questionDeleteError } = await supabase
          .from("Questions")
          .delete()
          .in("id", questionIds);
  
        if (questionDeleteError) {
          console.error("Error deleting questions:", questionDeleteError);
          throw questionDeleteError;
        }
  
        console.log("Deleted questions");
      }
  
      // Finally, delete the category
      const { data: deleteResult, error: categoryDeleteError } = await supabase
        .from("Categories")
        .delete()
        .eq("id", categoryId)
        .select();
  
      if (categoryDeleteError) {
        console.error("Category deletion error:", categoryDeleteError);
        throw categoryDeleteError;
      }
      
      console.log("Delete result:", deleteResult);
      
      if (!deleteResult || deleteResult.length === 0) {
        console.error("Category deletion failed - no rows affected");
        alert("Failed to delete category. No rows were affected.");
        return;
      }
  
      console.log("Category deleted successfully:", categoryId);
  
      // Update the UI state
      setCategories(
        categories.filter((category) => category.id !== categoryId)
      );
      
      // Verify deletion
      const { data: verifyDelete, error: verifyError } = await supabase
        .from("Categories")
        .select("id")
        .eq("id", categoryId)
        .single();
        
      if (verifyError && verifyError.code !== "PGRST116") {
        console.error("Error verifying deletion:", verifyError);
      } else if (verifyDelete) {
        console.error("Category still exists after deletion!");
        alert("Category deletion may have failed. Please refresh the page.");
      } else {
        console.log("Deletion verified - category no longer exists");
      }
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Failed to delete category. Please check the console for details.");
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
              {isAdmin && (
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4" /> Add Category
                </Button>
              )}
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
            {filteredCategories.length === 0 ? (
              <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
                No categories or questions found matching your search.
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div key={category.id} className="bg-white rounded-lg border">
                  <div className="flex items-center justify-between p-4 border-b cursor-pointer hover:bg-gray-50">
                    <div className="flex-row items-center ">
                      <h2 className="font-medium text-lg">{category.name}</h2>
                      <p className="text-sm text-gray-500">
                        {category.description}
                      </p>
                    </div>
                    <div className="flex items-baseline space-x-2">
                      {isAdmin && (
                        <Button
                          className="mx-4 mt-3"
                          onClick={() => {
                            setSelectedCategoryId(category.id);
                            setShowAddQuestionModal(true);
                          }}
                        >
                          <Plus className="w-4 h-4" /> Add Question
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center space-x-1 hover:bg-red-100 text-red-500"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                          <span className="text-xs">Delete</span>
                        </Button>
                      )}
                    </div>
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
                          {isAdmin && (
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
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center space-x-1 hover:bg-red-100 text-red-500"
                              onClick={() => handleDeleteQuestion(question.id)}
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                              <span className="text-xs">Delete</span>
                            </Button>
                          )}
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
      {isAdmin && (
        <AddCategoryModal
          showAddModal={showAddModal}
          setShowAddModal={setShowAddModal}
          categories={categories}
          setCategories={setCategories}
        />
      )}

      {/* Add Question Modal */}
      {isAdmin && (
        <AddQuestionModal
          showAddQuestionModal={showAddQuestionModal}
          setShowAddQuestionModal={setShowAddQuestionModal}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          categories={categories}
          setCategories={setCategories}
          products={products}
        />
      )}

      {/* Edit Question Modal */}
      {isAdmin && (
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
      )}
    </div>
  );
}
