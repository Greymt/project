'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
    Container, Typography, Box, Paper, Button, CircularProgress,
    Alert, LinearProgress, Card, CardContent, Chip, Grid,
    Radio
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Lightbulb as LightbulbIcon,
    Login as LoginIcon,
    ArrowBack as ArrowBackIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import Link from 'next/link';
import type { Question, Quiz } from '@/types';

interface QuizQuestion extends Question {
    selectedAnswer?: 'A' | 'B' | 'C' | 'D' | null;
}

export default function QuizPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id } = router.query;

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [correctCountResult, setCorrectCountResult] = useState(0);

    const OptionItem = ({ letter, text, isSelected, onSelect }: { letter: string; text: string; isSelected: boolean; onSelect: () => void }) => (
        <Box
            onClick={onSelect}
            sx={{
                display: 'flex',
                alignItems: 'center',
                p: 2,
                mb: 1,
                borderRadius: 2,
                border: '2px solid',
                borderColor: isSelected ? 'primary.main' : 'grey.200',
                bgcolor: isSelected ? 'primary.light' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                    bgcolor: isSelected ? 'primary.light' : 'grey.50',
                    borderColor: 'primary.main'
                }
            }}
        >
            <Radio
                checked={isSelected}
                sx={{ mr: 2 }}
            />
            <Box
                sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: isSelected ? 'primary.main' : 'grey.300',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    mr: 2,
                    flexShrink: 0
                }}
            >
                {letter}
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {text}
            </Typography>
        </Box>
    );

    useEffect(() => {
        if (status === 'authenticated' && id) {
            fetchQuiz();
        }
    }, [status, id]);

    const fetchQuiz = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await fetch(`/api/quizzes/${id}`);
            const data = await res.json();

            console.log('Quiz data:', data);

            if (data.success && data.data?.quiz) {
                const quizData = data.data.quiz;
                if (!quizData.questions || quizData.questions.length === 0) {
                    setError('Quiz không có câu hỏi nào');
                    setLoading(false);
                    return;
                }
                setQuiz(quizData);
                setQuestions(quizData.questions.map((q: Question) => ({ ...q, selectedAnswer: null })));
            } else {
                setError(data.error || 'Không tìm thấy quiz');
            }
        } catch (err) {
            console.error('Fetch quiz error:', err);
            setError('Lỗi tải quiz');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (answer: 'A' | 'B' | 'C' | 'D') => {
        const newQuestions = [...questions];
        newQuestions[currentIndex].selectedAnswer = answer;
        setQuestions(newQuestions);
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleSubmit = async () => {
        let correctCount = 0;
        questions.forEach(q => {
            if (q.selectedAnswer === q.correctAnswer) correctCount++;
        });

        const finalScore = Math.round((correctCount / questions.length) * 100);
        setScore(finalScore);
        setCorrectCountResult(correctCount);
        setIsSubmitted(true);

        try {
            await fetch('/api/quizzes/result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quizId: id,
                    score: finalScore,
                    correctCount,
                    totalQuestions: questions.length,
                    userEmail: session?.user?.email,
                }),
            });
        } catch (err) {
            console.error('Failed to save result:', err);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!session) {
        return (
            <Container maxWidth="sm">
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                    <LoginIcon sx={{ fontSize: 64, color: '#6366f1', mb: 2 }} />
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Cần đăng nhập
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Bạn cần đăng nhập để làm bài kiểm tra
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Link href="/auth/login" passHref>
                            <Button variant="contained" startIcon={<LoginIcon />}>
                                Đăng nhập
                            </Button>
                        </Link>
                        <Link href="/auth/register" passHref>
                            <Button variant="outlined">
                                Đăng ký
                            </Button>
                        </Link>
                    </Box>
                </Paper>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ textAlign: 'center', py: 8 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Link href="/quizzes" passHref>
                    <Button variant="contained">Quay lại</Button>
                </Link>
            </Container>
        );
    }

    if (!quiz || questions.length === 0) {
        return (
            <Container maxWidth="md" sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h5">Quiz không tồn tại</Typography>
                <Link href="/quizzes" passHref>
                    <Button variant="contained" sx={{ mt: 2 }}>Quay lại</Button>
                </Link>
            </Container>
        );
    }

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            {!isSubmitted ? (
                <>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h5" gutterBottom>
                            {quiz.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2">
                                Câu {currentIndex + 1} / {questions.length}
                            </Typography>
                            <LinearProgress variant="determinate" value={progress} sx={{ flex: 1 }} />
                        </Box>
                    </Box>

                    <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            {currentQuestion.question}
                        </Typography>
                        <Box>
                            <OptionItem letter="A" text={currentQuestion.optionA} isSelected={currentQuestion.selectedAnswer === 'A'} onSelect={() => handleAnswer('A')} />
                            <OptionItem letter="B" text={currentQuestion.optionB} isSelected={currentQuestion.selectedAnswer === 'B'} onSelect={() => handleAnswer('B')} />
                            <OptionItem letter="C" text={currentQuestion.optionC} isSelected={currentQuestion.selectedAnswer === 'C'} onSelect={() => handleAnswer('C')} />
                            <OptionItem letter="D" text={currentQuestion.optionD} isSelected={currentQuestion.selectedAnswer === 'D'} onSelect={() => handleAnswer('D')} />
                        </Box>
                    </Paper>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                            variant="outlined"
                            onClick={handlePrevious}
                            disabled={currentIndex === 0}
                        >
                            Câu trước
                        </Button>

                        {currentIndex === questions.length - 1 ? (
                            <Button
                                variant="contained"
                                color="success"
                                onClick={handleSubmit}
                                disabled={questions.some(q => !q.selectedAnswer)}
                            >
                                Nộp bài
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                disabled={!currentQuestion.selectedAnswer}
                            >
                                Câu tiếp
                            </Button>
                        )}
                    </Box>
                </>
            ) : (
                <Box>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            mb: 3,
                            borderRadius: 2,
                            border: '1px solid rgba(0,0,0,0.06)',
                            bgcolor: 'white',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                            textAlign: 'center'
                        }}
                    >
                        <Typography variant="h3" fontSize={36} fontWeight={800} sx={{ mb: 2, color: '#111827' }}>
                            Kết quả bài kiểm tra
                        </Typography>

                        <Box
                            sx={{
                                width: 140,
                                height: 140,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                mx: 'auto',
                                mb: 3,
                                background: score >= 70
                                    ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                                    : score >= 50
                                        ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)'
                                        : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                                color: 'white',
                            }}
                        >
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>ĐIỂM</Typography>
                            <Typography variant="h3" fontWeight={800} lineHeight={1}>{score}%</Typography>
                        </Box>

                        <Typography variant="h5" fontWeight={700} sx={{ color: '#111827', mb: 1 }}>
                            {correctCountResult} / {questions.length} câu đúng
                        </Typography>

                        <Chip
                            icon={score >= 70 ? <CheckCircleIcon /> : <CancelIcon />}
                            label={score >= 70 ? 'Xuất sắc!' : score >= 50 ? 'Khá tốt!' : 'Cần luyện tập thêm'}
                            sx={{
                                fontWeight: 600,
                                bgcolor: score >= 70 ? 'rgba(16, 185, 129, 0.1)' : score >= 50 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: score >= 70 ? '#059669' : score >= 50 ? '#d97706' : '#dc2626'
                            }}
                        />

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 3, pt: 3, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                            <Box>
                                <Typography variant="h4" fontWeight={800} sx={{ color: '#10b981' }}>{correctCountResult}</Typography>
                                <Typography variant="body2" color="text.secondary">Câu đúng</Typography>
                            </Box>
                            <Box>
                                <Typography variant="h4" fontWeight={800} sx={{ color: '#ef4444' }}>{questions.length - correctCountResult}</Typography>
                                <Typography variant="body2" color="text.secondary">Câu sai</Typography>
                            </Box>
                            <Box>
                                <Typography variant="h4" fontWeight={800} sx={{ color: '#6366f1' }}>{Math.round((correctCountResult / questions.length) * 100)}%</Typography>
                                <Typography variant="body2" color="text.secondary">Tỷ lệ</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setIsSubmitted(false);
                                    setCurrentIndex(0);
                                    setQuestions(questions.map(q => ({ ...q, selectedAnswer: null })));
                                }}
                                sx={{
                                    borderColor: '#6366f1',
                                    color: '#6366f1',
                                    fontWeight: 600,
                                    px: 3,
                                    '&:hover': {
                                        bgcolor: 'rgba(99, 102, 241, 0.08)'
                                    }
                                }}
                            >
                                ↻ Làm lại
                            </Button>
                            <Link href="/quizzes" passHref>
                                <Button
                                    variant="contained"
                                    sx={{
                                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                        fontWeight: 600,
                                        px: 3,
                                        '&:hover': {
                                            boxShadow: '0 6px 20px rgba(99, 102, 241, 0.35)'
                                        }
                                    }}
                                >
                                    ← Quay về danh sách bài
                                </Button>
                            </Link>
                        </Box>
                    </Paper>

                    <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)', bgcolor: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                        <Box sx={{ bgcolor: 'rgba(99, 102, 241, 0.03)', borderBottom: '1px solid rgba(0,0,0,0.06)', p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <LightbulbIcon sx={{ color: '#6366f1', fontSize: 28 }} />
                                <Typography variant="h5" fontWeight={700}>Chi tiết đáp án</Typography>
                            </Box>
                            <Chip label={`${questions.filter(q => q.selectedAnswer === q.correctAnswer).length}/${questions.length} câu đúng`} sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', fontWeight: 700 }} />
                        </Box>

                        <Box sx={{ p: 3 }}>
                            {questions.map((q, i) => {
                                const isCorrect = q.selectedAnswer === q.correctAnswer;
                                return (
                                    <Card
                                        key={i}
                                        sx={{
                                            mb: 2,
                                            borderRadius: 3,
                                            border: isCorrect ? '2px solid rgba(16, 185, 129, 0.2)' : '2px solid rgba(239, 68, 68, 0.2)',
                                            bgcolor: isCorrect ? 'rgba(16, 185, 129, 0.02)' : 'rgba(239, 68, 68, 0.02)'
                                        }}
                                    >
                                        <CardContent sx={{ p: 0, overflow: 'hidden' }}>
                                            <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.04)', bgcolor: isCorrect ? 'rgba(16, 185, 129, 0.03)' : 'rgba(239, 68, 68, 0.03)' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                                                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#111827', fontSize: '1.05rem', lineHeight: 1.5, flex: 1 }}>
                                                        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', bgcolor: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isCorrect ? '#059669' : '#dc2626', fontSize: '0.9rem', fontWeight: 800, mr: 1.5 }}>
                                                            {i + 1}
                                                        </Box>
                                                        {q.question}
                                                    </Typography>
                                                    <Chip icon={isCorrect ? <CheckCircleIcon /> : <CancelIcon />} label={isCorrect ? 'Đúng' : 'Sai'} size="small" sx={{ background: isCorrect ? 'linear-gradient(135deg, #10b981, #34d399)' : 'linear-gradient(135deg, #ef4444, #f97316)', color: 'white', fontWeight: 700 }} />
                                                </Box>
                                            </Box>

                                            <Box sx={{ p: 2.5 }}>
                                                {['A', 'B', 'C', 'D'].map((opt) => {
                                                    const optionKey = `option${opt}` as keyof Question;
                                                    const optionText = q[optionKey] as string;
                                                    const isSelected = q.selectedAnswer === opt;
                                                    const isCorrectOption = q.correctAnswer === opt;

                                                    return (
                                                        <Box
                                                            key={opt}
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'flex-start',
                                                                gap: 2,
                                                                mb: 1.5,
                                                                p: 2,
                                                                borderRadius: 2,
                                                                border: '2px solid',
                                                                borderColor: isSelected && isCorrectOption ? '#10b981' : isSelected ? '#ef4444' : isCorrectOption ? '#10b981' : 'grey.200',
                                                                bgcolor: isSelected && isCorrectOption ? 'rgba(16, 185, 129, 0.05)' : isSelected ? 'rgba(239, 68, 68, 0.05)' : isCorrectOption ? 'rgba(16, 185, 129, 0.02)' : 'transparent'
                                                            }}
                                                        >
                                                            <Box sx={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, bgcolor: isSelected ? isCorrectOption ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' : isCorrectOption ? 'rgba(16, 185, 129, 0.08)' : 'grey.200', color: isSelected ? isCorrectOption ? '#059669' : '#dc2626' : isCorrectOption ? '#059669' : 'white' }}>
                                                                {opt}
                                                            </Box>
                                                            <Typography variant="body1" sx={{ flex: 1, color: '#374151', fontWeight: 500 }}>
                                                                {optionText}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                                                                {isSelected && (isCorrectOption ? <CheckCircleIcon sx={{ color: '#059669' }} /> : <CancelIcon sx={{ color: '#dc2626' }} />)}
                                                                {isCorrectOption && !isSelected && <CheckCircleIcon sx={{ color: '#059669' }} />}
                                                            </Box>
                                                        </Box>
                                                    );
                                                })}
                                            </Box>

                                            {q.explanation && (
                                                <Box sx={{ mt: 2, p: 2.5, bgcolor: 'rgba(99, 102, 241, 0.03)', borderTop: '1px solid rgba(99, 102, 241, 0.1)' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                                        <LightbulbIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                                                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#6366f1' }}>Giải thích</Typography>
                                                    </Box>
                                                    <Typography variant="body2" sx={{ color: '#4b5563', pl: 1, borderLeft: '3px solid #6366f1' }}>
                                                        {q.explanation}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </Box>
                    </Paper>
                </Box>
            )}
        </Container>
    );
}