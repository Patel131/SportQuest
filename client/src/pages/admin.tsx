import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "../lib/authUtils";
import { Plus, Edit, Trash2, Users, HelpCircle, Trophy, Shield, ShieldOff } from "lucide-react";

interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
  imageUrl?: string;
  explanation?: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  totalPoints: number;
  isAdmin: boolean;
  createdAt: string;
}

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState({
    category: "Football",
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    points: 10,
    explanation: ""
  });

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.isAdmin)) {
      toast({
        title: "Access Denied",
        description: "Admin access required. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 2000);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ["/api/admin/questions"],
    retry: false,
    enabled: !!user?.isAdmin,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    retry: false,
    enabled: !!user?.isAdmin,
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (questionData: any) => {
      return await apiRequest("POST", "/api/admin/questions", questionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      setShowQuestionDialog(false);
      setQuestionForm({
        category: "Football",
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        points: 10,
        explanation: ""
      });
      toast({
        title: "Success",
        description: "Question created successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Session expired. Redirecting to login...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create question",
        variant: "destructive",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, ...questionData }: any) => {
      return await apiRequest("PUT", `/api/admin/questions/${id}`, questionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      setShowQuestionDialog(false);
      setEditingQuestion(null);
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Session expired. Redirecting to login...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      return await apiRequest("DELETE", `/api/admin/questions/${questionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Session expired. Redirecting to login...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}/admin`, { isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User admin status updated",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Session expired. Redirecting to login...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update user admin status",
        variant: "destructive",
      });
    },
  });

  const handleCreateQuestion = () => {
    if (!questionForm.question || questionForm.options.some(opt => !opt.trim())) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createQuestionMutation.mutate(questionForm);
  };

  const handleUpdateQuestion = () => {
    if (!editingQuestion) return;
    
    updateQuestionMutation.mutate({
      id: editingQuestion.id,
      ...questionForm
    });
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({
      category: question.category,
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      points: question.points,
      explanation: question.explanation || ""
    });
    setShowQuestionDialog(true);
  };

  if (isLoading || questionsLoading || usersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sports-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You need admin privileges to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const questionsByCategory = (questions as Question[]).reduce((acc: any, question: Question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage questions, users, and quiz content</p>
      </div>

      <Tabs defaultValue="questions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
        </TabsList>

        {/* Questions Tab */}
        <TabsContent value="questions" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Question Management</h2>
              <p className="text-gray-600">Add, edit, and delete quiz questions</p>
            </div>
            <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" data-testid="button-add-question">
                  <Plus className="w-4 h-4" />
                  Add Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingQuestion ? "Edit Question" : "Create New Question"}
                  </DialogTitle>
                  <DialogDescription>
                    Fill in the details for the quiz question
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={questionForm.category} onValueChange={(value) => setQuestionForm({...questionForm, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Football">Football</SelectItem>
                        <SelectItem value="Basketball">Basketball</SelectItem>
                        <SelectItem value="Soccer">Soccer</SelectItem>
                        <SelectItem value="Baseball">Baseball</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="question">Question</Label>
                    <Textarea
                      id="question"
                      value={questionForm.question}
                      onChange={(e) => setQuestionForm({...questionForm, question: e.target.value})}
                      placeholder="Enter the question"
                    />
                  </div>

                  <div>
                    <Label>Answer Options</Label>
                    {questionForm.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2 mt-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...questionForm.options];
                            newOptions[index] = e.target.value;
                            setQuestionForm({...questionForm, options: newOptions});
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant={questionForm.correctAnswer === index ? "default" : "outline"}
                          size="sm"
                          onClick={() => setQuestionForm({...questionForm, correctAnswer: index})}
                        >
                          {questionForm.correctAnswer === index ? "Correct" : "Mark Correct"}
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="points">Points</Label>
                      <Input
                        id="points"
                        type="number"
                        value={questionForm.points}
                        onChange={(e) => setQuestionForm({...questionForm, points: parseInt(e.target.value) || 10})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="explanation">Explanation (Optional)</Label>
                    <Textarea
                      id="explanation"
                      value={questionForm.explanation}
                      onChange={(e) => setQuestionForm({...questionForm, explanation: e.target.value})}
                      placeholder="Explain why this is the correct answer"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setShowQuestionDialog(false);
                    setEditingQuestion(null);
                    setQuestionForm({
                      category: "Football",
                      question: "",
                      options: ["", "", "", ""],
                      correctAnswer: 0,
                      points: 10,
                      explanation: ""
                    });
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
                    disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                  >
                    {editingQuestion ? "Update" : "Create"} Question
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {Object.entries(questionsByCategory).map(([category, categoryQuestions]: [string, any]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {category} Questions
                    <Badge variant="secondary">{categoryQuestions.length} questions</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryQuestions.map((question: Question) => (
                      <div key={question.id} className="border rounded-lg p-4 bg-gray-50" data-testid={`question-${question.id}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 mb-2">{question.question}</h4>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              {question.options.map((option, index) => (
                                <div 
                                  key={index} 
                                  className={`text-sm p-2 rounded ${
                                    index === question.correctAnswer 
                                      ? "bg-green-100 text-green-800 font-medium" 
                                      : "bg-white text-gray-600"
                                  }`}
                                >
                                  {option}
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{question.points} points</span>
                              {question.explanation && <span>Has explanation</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditQuestion(question)}
                              data-testid={`button-edit-${question.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" data-testid={`button-delete-${question.id}`}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Question</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this question? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteQuestionMutation.mutate(question.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">User Management</h2>
            <p className="text-gray-600">View users and manage admin privileges</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                All Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(users as User[]).map((userData: User) => (
                  <div key={userData.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50" data-testid={`user-${userData.id}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
                        {userData.firstName?.[0] || userData.email?.[0] || "U"}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {userData.firstName && userData.lastName 
                            ? `${userData.firstName} ${userData.lastName}` 
                            : userData.email}
                        </h4>
                        <p className="text-sm text-gray-600">{userData.email}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-500">
                            <Trophy className="w-4 h-4 inline mr-1" />
                            {userData.totalPoints} points
                          </span>
                          <span className="text-sm text-gray-500">
                            Joined {new Date(userData.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={userData.isAdmin ? "default" : "secondary"}>
                        {userData.isAdmin ? "Admin" : "User"}
                      </Badge>
                      {userData.id !== user.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAdminMutation.mutate({
                            userId: userData.id,
                            isAdmin: !userData.isAdmin
                          })}
                          disabled={toggleAdminMutation.isPending}
                          data-testid={`button-toggle-admin-${userData.id}`}
                        >
                          {userData.isAdmin ? (
                            <ShieldOff className="w-4 h-4" />
                          ) : (
                            <Shield className="w-4 h-4" />
                          )}
                          {userData.isAdmin ? "Remove Admin" : "Make Admin"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}