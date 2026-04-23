import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Question, Quiz, UserAnswer, QuizResult } from '@/types';

export interface QuizState {
    currentQuiz: Quiz | null;
    currentQuestionIndex: number;
    userAnswers: UserAnswer[];
    timeRemaining: number;
    isLoading: boolean;
    score: number;
    isCompleted: boolean;
    result: QuizResult | null;
    quizzes: Quiz[]; // My saved quizzes
}

const initialState: QuizState = {
    currentQuiz: null,
    currentQuestionIndex: 0,
    userAnswers: [],
    timeRemaining: 30,
    isLoading: false,
    score: 0,
    isCompleted: false,
    result: null,
    quizzes: [], // Load from localStorage or DB
};

const quizSlice = createSlice({
    name: 'quiz',
    initialState,
    reducers: {
        startQuiz: (state, action: PayloadAction<{ quiz: Quiz; numQuestions?: number }>) => {
            const { quiz, numQuestions = quiz.questions.length } = action.payload;
            const selectedQuestions = numQuestions < quiz.questions.length
                ? quiz.questions.sort(() => 0.5 - Math.random()).slice(0, numQuestions)
                : quiz.questions;

            state.currentQuiz = { ...quiz, questions: selectedQuestions };
            state.currentQuestionIndex = 0;
            state.userAnswers = [];
            state.timeRemaining = 30;
            state.isLoading = false;
            state.score = 0;
            state.isCompleted = false;
            state.result = null;
        },
        answerQuestion: (state, action: PayloadAction<{ answer: 'A' | 'B' | 'C' | 'D' }>) => {
            const currentQ = state.currentQuiz?.questions[state.currentQuestionIndex];
            if (!currentQ) return;

            state.userAnswers[state.currentQuestionIndex] = {
                questionId: currentQ.id,
                selectedAnswer: action.payload.answer,
            };

            if (action.payload.answer === currentQ.correctAnswer) {
                state.score += 10;
            }

            state.timeRemaining = 30;
        },
        nextQuestion: (state) => {
            if (state.currentQuestionIndex < (state.currentQuiz?.questions.length || 0) - 1) {
                state.currentQuestionIndex += 1;
                state.timeRemaining = 30;
            } else {
                state.isCompleted = true;
            }
        },
        tickTimer: (state) => {
            if (state.timeRemaining > 0) {
                state.timeRemaining -= 1;
            } else if (!state.isCompleted) {
                // Auto move to next question when time runs out
                if (state.currentQuestionIndex < (state.currentQuiz?.questions.length || 0) - 1) {
                    state.currentQuestionIndex += 1;
                    state.timeRemaining = 30;
                } else {
                    state.isCompleted = true;
                }
            }
        },
        completeQuiz: (state, action: PayloadAction<QuizResult>) => {
            state.result = action.payload;
            state.isCompleted = true;
        },
        addQuiz: (state, action: PayloadAction<Quiz>) => {
            state.quizzes.push(action.payload);
        },
        loadQuizzes: (state, action: PayloadAction<Quiz[]>) => {
            state.quizzes = action.payload;
        },
        resetQuiz: () => initialState,
    },
});

export const {
    startQuiz,
    answerQuestion,
    nextQuestion,
    tickTimer,
    completeQuiz,
    addQuiz,
    loadQuizzes,
    resetQuiz,
} = quizSlice.actions;

export default quizSlice.reducer;
