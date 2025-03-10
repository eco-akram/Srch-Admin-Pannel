"use client"

import { useState } from "react"
import { X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

type AddQuestionModalProps = {
  categories: Category[]
  onClose: () => void
  onAddQuestion: (categoryId: string, question: Omit<Question, "id">) => void
}

export default function AddQuestionModal({ categories, onClose, onAddQuestion }: AddQuestionModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || "")
  const [questionTitle, setQuestionTitle] = useState("")
  const [questionDescription, setQuestionDescription] = useState("")
  const [answers, setAnswers] = useState<string[]>([])
  const [newAnswer, setNewAnswer] = useState("")
  const [errors, setErrors] = useState<{
    category?: string
    question?: string
    answers?: string
  }>({})

  const handleAddAnswer = () => {
    if (newAnswer.trim()) {
      setAnswers([...answers, newAnswer.trim()])
      setNewAnswer("")
    }
  }

  const handleRemoveAnswer = (index: number) => {
    setAnswers(answers.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    // Validate form
    const newErrors: {
      category?: string
      question?: string
      answers?: string
    } = {}

    if (!selectedCategoryId) {
      newErrors.category = "Please select a category"
    }

    if (!questionTitle.trim()) {
      newErrors.question = "Question is required"
    }

    if (answers.length === 0) {
      newErrors.answers = "At least one answer is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Submit the new question
    onAddQuestion(selectedCategoryId, {
      question: questionTitle.trim(),
      description: questionDescription.trim(),
      answers,
    })

    // Close the modal
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">Add New Question</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Question</label>
            <Input
              value={questionTitle}
              onChange={(e) => setQuestionTitle(e.target.value)}
              placeholder="Enter the question"
              className={errors.question ? "border-red-500" : ""}
            />
            {errors.question && <p className="text-sm text-red-500">{errors.question}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={questionDescription}
              onChange={(e) => setQuestionDescription(e.target.value)}
              placeholder="Enter a description for this question"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Answers</label>
            <div className="flex">
              <Input
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="Add an answer option"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddAnswer()
                  }
                }}
              />
              <Button type="button" onClick={handleAddAnswer} className="ml-2">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {errors.answers && <p className="text-sm text-red-500">{errors.answers}</p>}

            {answers.length > 0 && (
              <div className="mt-3 p-3 border rounded-md">
                <div className="flex flex-wrap gap-2">
                  {answers.map((answer, index) => (
                    <div key={index} className="flex items-center">
                      <Badge variant="secondary" className="pr-1">
                        {answer}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAnswer(index)}
                          className="h-5 w-5 p-0 ml-1 hover:bg-transparent"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end p-4 border-t gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Question</Button>
        </div>
      </div>
    </div>
  )
}

