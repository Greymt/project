export interface Question {
    id: string;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation: string;
    aiGenerated?: boolean;
    createdAt: string;
    quizTitle?: string;
    quizId?: string;
    quizTopic?: string;
    userEmail?: string;
    topic?: string;
}

export interface Quiz {
    id: string;
    title: string;
    questions: Question[];
    aiGenerated: boolean;
    topic?: string;
    sourceText?: string;
    count: number;
    createdAt: string;
}

export interface UserAnswer {
    questionId: string;
    selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
}

export interface QuizResult {
    quizId: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeSpent: number;
    completedAt: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface UserProgress {
    totalQuizzes: number;
    avgScore: number;
    bestScore: number;
    totalTime: number;
    badges: string[];
}

export interface Vocabulary {
    id: string;
    word: string;
    phonetic: string;
    partOfSpeech: string;
    meaning: string;
    examples: string[];
    audioUrl?: string;
    userEmail?: string;
    isRemembered: boolean;
    reviewCount: number;
    lastReviewed?: string;
    createdAt: string;
}
