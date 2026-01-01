import { useState } from 'react';
import { ContentBlock, QuizMetadata, QuizQuestion, QuizOption } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface QuizBlockProps {
  block: ContentBlock;
  isSelected: boolean;
  readOnly?: boolean;
  onUpdate: (content: string, metadata: QuizMetadata) => void;
  onDelete: () => void;
  onFocus: () => void;
}

export const QuizBlock = ({
  block,
  isSelected,
  readOnly = false,
  onUpdate,
  onDelete,
  onFocus,
}: QuizBlockProps) => {
  const metadata = (block.metadata as QuizMetadata) || { questions: [] };
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const toggleExpanded = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: crypto.randomUUID(),
      question: '',
      type: 'multiple-choice',
      options: [
        { id: crypto.randomUUID(), text: '', isCorrect: false },
        { id: crypto.randomUUID(), text: '', isCorrect: false },
      ],
      explanation: '',
      points: 1,
    };
    const newQuestions = [...metadata.questions, newQuestion];
    onUpdate(block.content, { ...metadata, questions: newQuestions });
    setExpandedQuestions(new Set([...expandedQuestions, newQuestion.id]));
  };

  const updateQuestion = (questionId: string, updates: Partial<QuizQuestion>) => {
    const newQuestions = metadata.questions.map(q =>
      q.id === questionId ? { ...q, ...updates } : q
    );
    onUpdate(block.content, { ...metadata, questions: newQuestions });
  };

  const deleteQuestion = (questionId: string) => {
    const newQuestions = metadata.questions.filter(q => q.id !== questionId);
    onUpdate(block.content, { ...metadata, questions: newQuestions });
  };

  const addOption = (questionId: string) => {
    const question = metadata.questions.find(q => q.id === questionId);
    if (!question) return;
    
    const newOption: QuizOption = {
      id: crypto.randomUUID(),
      text: '',
      isCorrect: false,
    };
    updateQuestion(questionId, {
      options: [...(question.options || []), newOption],
    });
  };

  const updateOption = (questionId: string, optionId: string, updates: Partial<QuizOption>) => {
    const question = metadata.questions.find(q => q.id === questionId);
    if (!question) return;
    
    const newOptions = (question.options || []).map(o =>
      o.id === optionId ? { ...o, ...updates } : o
    );
    updateQuestion(questionId, { options: newOptions });
  };

  const deleteOption = (questionId: string, optionId: string) => {
    const question = metadata.questions.find(q => q.id === questionId);
    if (!question || (question.options?.length || 0) <= 2) return;
    
    const newOptions = (question.options || []).filter(o => o.id !== optionId);
    updateQuestion(questionId, { options: newOptions });
  };

  const setCorrectOption = (questionId: string, optionId: string) => {
    const question = metadata.questions.find(q => q.id === questionId);
    if (!question) return;
    
    const newOptions = (question.options || []).map(o => ({
      ...o,
      isCorrect: o.id === optionId,
    }));
    updateQuestion(questionId, { options: newOptions });
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setUserAnswers({ ...userAnswers, [questionId]: answer });
  };

  const checkAnswers = () => {
    setShowResults(true);
  };

  const resetQuiz = () => {
    setUserAnswers({});
    setShowResults(false);
  };

  const getScore = () => {
    let correct = 0;
    let total = metadata.questions.length;
    
    metadata.questions.forEach(q => {
      const userAnswer = userAnswers[q.id];
      if (q.type === 'multiple-choice') {
        const correctOption = q.options?.find(o => o.isCorrect);
        if (correctOption && userAnswer === correctOption.id) {
          correct++;
        }
      } else if (q.type === 'true-false') {
        if (userAnswer === q.correctAnswer) {
          correct++;
        }
      }
    });
    
    return { correct, total };
  };

  // Read-only quiz view for Learn page
  if (readOnly) {
    if (metadata.questions.length === 0) {
      return (
        <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground">
          No questions in this quiz
        </div>
      );
    }

    const score = getScore();

    return (
      <div className="border border-primary/20 rounded-xl overflow-hidden" onClick={onFocus}>
        <div className="bg-primary/10 px-4 py-3 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <span className="font-semibold">Quiz</span>
          {showResults && (
            <span className="ml-auto text-sm">
              Score: {score.correct}/{score.total} ({Math.round((score.correct / score.total) * 100)}%)
            </span>
          )}
        </div>
        
        <div className="p-4 space-y-6">
          {metadata.questions.map((question, qIndex) => {
            const userAnswer = userAnswers[question.id];
            const correctOption = question.options?.find(o => o.isCorrect);
            const isCorrect = userAnswer === correctOption?.id || userAnswer === question.correctAnswer;
            
            return (
              <div key={question.id} className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="font-medium text-primary">{qIndex + 1}.</span>
                  <span className="font-medium">{question.question}</span>
                </div>
                
                <div className="space-y-2 pl-6">
                  {question.type === 'multiple-choice' && question.options?.map(option => {
                    const isSelected = userAnswer === option.id;
                    const showCorrect = showResults && option.isCorrect;
                    const showWrong = showResults && isSelected && !option.isCorrect;
                    
                    return (
                      <button
                        key={option.id}
                        className={cn(
                          "w-full p-3 rounded-lg text-left transition-colors flex items-center gap-3",
                          !showResults && "hover:bg-secondary",
                          isSelected && !showResults && "bg-primary/20 border border-primary",
                          showCorrect && "bg-success/20 border border-success",
                          showWrong && "bg-destructive/20 border border-destructive",
                          !isSelected && !showCorrect && "bg-secondary/50"
                        )}
                        onClick={() => !showResults && handleAnswer(question.id, option.id)}
                        disabled={showResults}
                      >
                        {showResults && option.isCorrect && <CheckCircle2 className="w-4 h-4 text-success" />}
                        {showResults && isSelected && !option.isCorrect && <XCircle className="w-4 h-4 text-destructive" />}
                        {!showResults && <div className={cn(
                          "w-4 h-4 rounded-full border-2",
                          isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                        )} />}
                        <span>{option.text}</span>
                      </button>
                    );
                  })}
                  
                  {question.type === 'true-false' && (
                    <div className="flex gap-4">
                      {['true', 'false'].map(value => {
                        const isSelected = userAnswer === value;
                        const showCorrect = showResults && question.correctAnswer === value;
                        const showWrong = showResults && isSelected && question.correctAnswer !== value;
                        
                        return (
                          <button
                            key={value}
                            className={cn(
                              "flex-1 p-3 rounded-lg transition-colors capitalize",
                              !showResults && "hover:bg-secondary",
                              isSelected && !showResults && "bg-primary/20 border border-primary",
                              showCorrect && "bg-success/20 border border-success",
                              showWrong && "bg-destructive/20 border border-destructive",
                              !isSelected && !showCorrect && "bg-secondary/50"
                            )}
                            onClick={() => !showResults && handleAnswer(question.id, value)}
                            disabled={showResults}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {showResults && question.explanation && (
                  <div className={cn(
                    "ml-6 p-3 rounded-lg text-sm",
                    isCorrect ? "bg-success/10 text-success" : "bg-muted"
                  )}>
                    <strong>Explanation:</strong> {question.explanation}
                  </div>
                )}
              </div>
            );
          })}
          
          <div className="flex gap-3 pt-4 border-t border-border">
            {!showResults ? (
              <Button onClick={checkAnswers} disabled={Object.keys(userAnswers).length !== metadata.questions.length}>
                Check Answers
              </Button>
            ) : (
              <Button onClick={resetQuiz} variant="outline">
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div
      className={cn(
        "border rounded-xl overflow-hidden",
        isSelected ? "border-primary" : "border-border"
      )}
      onClick={onFocus}
    >
      <div className="bg-primary/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <span className="font-semibold">Quiz Block</span>
          <span className="text-sm text-muted-foreground">
            ({metadata.questions.length} question{metadata.questions.length !== 1 ? 's' : ''})
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="p-4 space-y-4">
        {metadata.questions.map((question, index) => (
          <div key={question.id} className="border border-border rounded-lg overflow-hidden">
            {/* Question Header */}
            <div
              className="flex items-center gap-3 p-3 bg-secondary/30 cursor-pointer"
              onClick={() => toggleExpanded(question.id)}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Q{index + 1}:</span>
              <span className="flex-1 truncate">
                {question.question || 'New Question'}
              </span>
              {expandedQuestions.has(question.id) ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
            
            {/* Question Content */}
            {expandedQuestions.has(question.id) && (
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Question Text</Label>
                  <Input
                    value={question.question}
                    onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                    placeholder="Enter your question..."
                  />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Label>Question Type</Label>
                    <Select
                      value={question.type}
                      onValueChange={(value) => updateQuestion(question.id, { 
                        type: value as QuizQuestion['type'] 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                        <SelectItem value="true-false">True/False</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-24 space-y-2">
                    <Label>Points</Label>
                    <Input
                      type="number"
                      min={1}
                      value={question.points || 1}
                      onChange={(e) => updateQuestion(question.id, { 
                        points: parseInt(e.target.value) || 1 
                      })}
                    />
                  </div>
                </div>
                
                {/* Multiple Choice Options */}
                {question.type === 'multiple-choice' && (
                  <div className="space-y-2">
                    <Label>Options (click to set correct answer)</Label>
                    {question.options?.map((option, oIndex) => (
                      <div key={option.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                            option.isCorrect 
                              ? "border-success bg-success text-success-foreground" 
                              : "border-muted-foreground hover:border-primary"
                          )}
                          onClick={() => setCorrectOption(question.id, option.id)}
                        >
                          {option.isCorrect && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <Input
                          value={option.text}
                          onChange={(e) => updateOption(question.id, option.id, { text: e.target.value })}
                          placeholder={`Option ${oIndex + 1}`}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteOption(question.id, option.id)}
                          disabled={(question.options?.length || 0) <= 2}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(question.id)}
                      disabled={(question.options?.length || 0) >= 8}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Option
                    </Button>
                  </div>
                )}
                
                {/* True/False */}
                {question.type === 'true-false' && (
                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <div className="flex gap-4">
                      <Button
                        variant={question.correctAnswer === 'true' ? 'default' : 'outline'}
                        onClick={() => updateQuestion(question.id, { correctAnswer: 'true' })}
                      >
                        True
                      </Button>
                      <Button
                        variant={question.correctAnswer === 'false' ? 'default' : 'outline'}
                        onClick={() => updateQuestion(question.id, { correctAnswer: 'false' })}
                      >
                        False
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Explanation (shown after answering)</Label>
                  <Input
                    value={question.explanation || ''}
                    onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                    placeholder="Explain the correct answer..."
                  />
                </div>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteQuestion(question.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Question
                </Button>
              </div>
            )}
          </div>
        ))}
        
        <Button onClick={addQuestion} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>
    </div>
  );
};
