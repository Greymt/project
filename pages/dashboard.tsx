'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import {
    Container, Typography, Box, Paper, Button, CircularProgress,
    Grid, Card, CardContent, Chip, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Snackbar, Alert,
    LinearProgress, Divider, IconButton, Checkbox, FormControlLabel,
    FormControl, Select, MenuItem
} from '@mui/material';
import Link from 'next/link';
import {
    Refresh as RefreshIcon,
    PlayArrow as PlayArrowIcon,
    TrendingUp as TrendingUpIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    ArrowForward as ArrowForwardIcon,
    MenuBook as MenuBookIcon,
    School as SchoolIcon,
    Warning as WarningIcon,
    Quiz as QuizIcon,
    History as HistoryIcon
} from '@mui/icons-material';
import Header from '@/components/Header';
import AIQuizGenerator from '@/components/quiz/AIQuizGenerator';
import type { Quiz } from '@/types';

interface GeneratedQuestionPreview {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

interface UserProgress {
    totalQuizzes: number;
    avgScore: number;
    bestScore: number;
    wrongCount: number;
}

interface QuizResult {
    id: string;
    quizId: string;
    score: number;
    completedAt: string;
    quizTitle: string;
}

interface Question {
    id: string;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    explanation?: string;
    aiGenerated?: boolean;
    createdAt: string;
    quizTitle?: string;
    quizId?: string;
    quizTopic?: string;
    userEmail?: string;
}

export default function Dashboard() {
    const { data: session, status } = useSession();
    const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestionPreview[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loadingQuizzes, setLoadingQuizzes] = useState(true);
    const [showQuizGenerator, setShowQuizGenerator] = useState(false);
    const [progress, setProgress] = useState<UserProgress | null>(null);
    const [recentResults, setRecentResults] = useState<QuizResult[]>([]);
    const [loadingProgress, setLoadingProgress] = useState(true);
    const [wrongAnswerList, setWrongAnswerList] = useState<any[]>([]);
    const [loadingWrongAnswers, setLoadingWrongAnswers] = useState(false);
    const [selectedWrongCount, setSelectedWrongCount] = useState(5);
    const quizGeneratorRef = useRef<HTMLDivElement>(null);
    const [aiQuestions, setAiQuestions] = useState<Question[]>([]);
    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
    const [openCreateQuiz, setOpenCreateQuiz] = useState(false);
    const [quizTitle, setQuizTitle] = useState('');
    const [quizTopic, setQuizTopic] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });

    const handleGenerate = (questions: GeneratedQuestionPreview[]) => {
        setGeneratedQuestions(questions);
    };

    useEffect(() => {
        if (status === 'authenticated') {
            fetchQuizzes();
            fetchProgress();
            fetchAiQuestions();
            fetchWrongAnswers();
        }
    }, [status]);

    const fetchQuizzes = async () => {
        try {
            setLoadingQuizzes(true);
            const res = await fetch('/api/quizzes');
            const data = await res.json();

            if (data.success) {
                setQuizzes(data.data?.quizzes || []);
            }
        } catch (err) {
            console.error('Failed to fetch quizzes:', err);
        } finally {
            setLoadingQuizzes(false);
        }
    };

    const fetchProgress = async () => {
        try {
            setLoadingProgress(true);
            const res = await fetch('/api/user/progress');
            const data = await res.json();

            if (data.success) {
                setProgress(data.data?.progress);
                setRecentResults(data.data?.recentResults || []);
            }
        } catch (err) {
            console.error('Failed to fetch progress:', err);
        } finally {
            setLoadingProgress(false);
        }
    };

    const fetchWrongAnswers = async () => {
        try {
            setLoadingWrongAnswers(true);
            const res = await fetch('/api/user/wrong-answers?limit=6');
            const data = await res.json();

            if (data.success) {
                setWrongAnswerList(data.data?.wrongAnswerQuestions || []);
            }
        } catch (err) {
            console.error('Failed to fetch wrong answers:', err);
        } finally {
            setLoadingWrongAnswers(false);
        }
    };

    const fetchAiQuestions = async () => {
        try {
            const res = await fetch('/api/questions');
            const data = await res.json();
            if (data.success) {
                const allQuestions = data.data.questions;
                const aiQ = allQuestions.filter((q: Question) => q.aiGenerated);
                setAiQuestions(aiQ);
            }
        } catch (err) {
            console.error('Failed to fetch AI questions:', err);
        }
    };

    const handleToggleSelect = (id: string) => {
        setSelectedQuestions(prev =>
            prev.includes(id)
                ? prev.filter(q => q !== id)
                : [...prev, id]
        );
    };

    const handleCreateQuiz = async () => {
        if (!quizTitle.trim()) {
            setSnackbar({ open: true, message: 'Vui lòng nhập tiêu đề đề', severity: 'error' });
            return;
        }

        if (selectedQuestions.length === 0) {
            setSnackbar({ open: true, message: 'Vui lòng chọn ít nhất 1 câu hỏi', severity: 'error' });
            return;
        }

        try {
            const selectedQ = aiQuestions.filter(q => selectedQuestions.includes(q.id));

            const res = await fetch('/api/quizzes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: quizTitle,
                    questions: selectedQ,
                    userEmail: session?.user?.email,
                    isCustom: true,
                    topic: quizTopic
                })
            });

            const data = await res.json();

            if (data.success) {
                setSnackbar({ open: true, message: 'Tạo đề thành công!', severity: 'success' });
                setOpenCreateQuiz(false);
                setQuizTitle('');
                setQuizTopic('');
                setSelectedQuestions([]);
                window.location.href = `/quizzes/${data.data.quiz.id}`;
            } else {
                setSnackbar({ open: true, message: data.error || 'Lỗi', severity: 'error' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Lỗi khi tạo đề', severity: 'error' });
        }
    };

    const handleCreateQuizFromWrongAnswers = async (count: number) => {
        try {
            const res = await fetch(`/api/user/wrong-answers?limit=${count}`);
            const data = await res.json();

            if (data.success && data.data.wrongAnswerQuestions.length > 0) {
                const res = await fetch('/api/quizzes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: `Luyện tập ${count} câu sai`,
                        questions: data.data.wrongAnswerQuestions,
                        userEmail: session?.user?.email,
                        isCustom: true,
                        topic: 'Luyện tập câu sai'
                    })
                });

                const quizData = await res.json();

                if (quizData.success) {
                    window.location.href = `/quizzes/${quizData.data.quiz.id}`;
                } else {
                    setSnackbar({ open: true, message: quizData.error || 'Lỗi', severity: 'error' });
                }
            } else {
                setSnackbar({ open: true, message: 'Chưa có câu hỏi nào', severity: 'info' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Lỗi khi tạo đề', severity: 'error' });
        }
    };

    // Helper component for stat cards
    const StatCard = ({ value, label, color, gradient, icon, highlight = false }: {
        value: string | number;
        label: string;
        color: string;
        gradient: string;
        icon: React.ReactNode;
        highlight?: boolean;
    }) => (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.06)',
                bgcolor: 'white',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    '& .stat-icon': {
                        transform: 'scale(1.1) rotate(5deg)'
                    }
                }
            }}
        >
            <Box
                className="stat-icon"
                sx={{
                    fontSize: '2rem',
                    mb: 0.5,
                    transition: 'transform 0.3s ease',
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {icon}
            </Box>
            <Typography
                variant="h3"
                fontWeight={800}
                sx={{
                    fontSize: '2rem',
                    background: gradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    lineHeight: 1
                }}
            >
                {value}
            </Typography>
            <Typography
                variant="body2"
                sx={{
                    mt: 0.5,
                    fontWeight: 500,
                    color: '#6b7280',
                    fontSize: '0.8rem',
                    letterSpacing: '0.02em',
                    textAlign: 'center'
                }}
            >
                {label}
            </Typography>
        </Paper>
    );

    // Adjust selected count when wrong answers change
    useEffect(() => {
        if (wrongAnswerList.length > 0 && selectedWrongCount > wrongAnswerList.length) {
            setSelectedWrongCount(Math.min(5, wrongAnswerList.length));
        }
    }, [wrongAnswerList.length]);

    if (status === 'loading') {
        return (
            <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!session) {
        return (
            <Container maxWidth="lg" sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h4" gutterBottom>
                    Vui lòng đăng nhập
                </Typography>
                <Link href="/auth/login" passHref>
                    <Button variant="contained">
                        Đăng nhập
                    </Button>
                </Link>
            </Container>
        );
    }

    return (
        <>
            <Header />
            <Container maxWidth="lg" sx={{
                py: { xs: 2, sm: 3, md: 4 },
                position: 'relative',
                minHeight: '100vh'
            }}>
                {/* Decorative background */}
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        pointerEvents: 'none',
                        zIndex: -1,
                        background: `
                             radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.04) 0%, transparent 50%),
                             radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.04) 0%, transparent 50%),
                             radial-gradient(circle at 40% 60%, rgba(16, 185, 129, 0.03) 0%, transparent 40%)
                         `
                    }}
                />

                {/* Header */}
                <Box sx={{ mb: { xs: 3, sm: 4 } }}>
                    <Typography
                        variant="h3"
                        fontWeight={800}
                        sx={{
                            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
                            letterSpacing: '-0.03em',
                            background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #6366f1 100%)',
                            backgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1
                        }}
                    >
                        Dashboard
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                        Xin chào {session.user?.name || session.user?.email} - Hãy tiếp tục học tập!
                    </Typography>
                </Box>

                {/* Progress Section */}
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2.5, sm: 3, md: 4 },
                        mb: { xs: 3, sm: 4 },
                        borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.06)',
                        bgcolor: 'white',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                        <TrendingUpIcon sx={{ color: '#6366f1', fontSize: 28 }} />
                        <Typography variant="h5" fontWeight={700} sx={{ fontSize: '1.5rem' }}>
                            Tiến độ học tập
                        </Typography>
                    </Box>

                    {loadingProgress ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress sx={{ color: '#6366f1' }} />
                        </Box>
                    ) : progress ? (
                        <Grid container spacing={3}>
                            {/* Stat Cards */}
                            <Grid item xs={6} sm={4}>
                                <StatCard
                                    value={progress.totalQuizzes}
                                    label="Bài đã làm"
                                    color="#6366f1"
                                    gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                                    icon={<MenuBookIcon />}
                                />
                            </Grid>
                            <Grid item xs={6} sm={4}>
                                <StatCard
                                    value={`${progress.avgScore}%`}
                                    label="Điểm trung bình"
                                    color="#10b981"
                                    gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                                    icon={<SchoolIcon />}
                                />
                            </Grid>
                            <Grid item xs={6} sm={4}>
                                <StatCard
                                    value={progress.wrongCount || 0}
                                    label="Câu sai cần luyện"
                                    color="#ef4444"
                                    gradient="linear-gradient(135deg, #ef4444 0%, #f97316 100%)"
                                    icon={<WarningIcon />}
                                    highlight={true}
                                />
                            </Grid>
                        </Grid>
                    ) : (
                        <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                            Chưa có dữ liệu tiến độ. Hãy làm bài quiz để theo dõi!
                        </Typography>
                    )}
                </Paper>

                {/* Recent Wrong Answers Section */}
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2.5, sm: 3, md: 4 },
                        mb: { xs: 3, sm: 4 },
                        borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.06)',
                        bgcolor: 'white',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <CancelIcon sx={{ color: '#ef4444', fontSize: 28 }} />
                            <Box>
                                <Typography variant="h5" fontWeight={700} sx={{ fontSize: '1.5rem' }}>
                                    Câu hỏi sai gần đây
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                                    Luyện tập lại các câu bạn đã trả lời sai
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {loadingWrongAnswers ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress size={32} sx={{ color: '#6366f1' }} />
                        </Box>
                    ) : wrongAnswerList.length > 0 ? (
                        <Box>
                            <Grid container spacing={2}>
                                {wrongAnswerList.map((item, idx) => (
                                    <Grid item xs={12} sm={6} key={idx}>
                                        <Card
                                            sx={{
                                                borderRadius: 2.5,
                                                border: '1px solid rgba(0,0,0,0.06)',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                                transition: 'all 0.2s ease',
                                                height: '100%',
                                                '&:hover': {
                                                    transform: 'translateY(-3px)',
                                                    boxShadow: '0 8px 20px rgba(239, 68, 68, 0.1)',
                                                    borderColor: 'rgba(239, 68, 68, 0.2)'
                                                }
                                            }}
                                        >
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                                    <Box
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: '50%',
                                                            bgcolor: 'rgba(239, 68, 68, 0.08)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        <WarningIcon sx={{ fontSize: 18, color: '#ef4444' }} />
                                                    </Box>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography
                                                            variant="body1"
                                                            sx={{
                                                                fontWeight: 700,
                                                                color: '#111827',
                                                                fontSize: '0.95rem',
                                                                lineHeight: 1.4,
                                                                mb: 1
                                                            }}
                                                        >
                                                            {item.question}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                                            <Chip
                                                                label={item.quizTitle || 'AI Quiz'}
                                                                size="small"
                                                                sx={{
                                                                    height: 22,
                                                                    fontSize: '0.7rem',
                                                                    bgcolor: 'rgba(99, 102, 241, 0.08)',
                                                                    color: '#6366f1',
                                                                    fontWeight: 600
                                                                }}
                                                            />
                                                        </Box>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: '#6b7280',
                                                                fontSize: '0.82rem',
                                                                fontStyle: 'italic'
                                                            }}
                                                        >
                                                            Đáp án đúng: <strong style={{ color: '#10b981', fontWeight: 600 }}>{item.correctAnswer}</strong>
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>

                            {wrongAnswerList.length >= 5 && (
                                <Box sx={{ mt: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                        <Typography variant="body2" fontWeight={600} sx={{ color: '#374151' }}>
                                            Luyện tập số câu:
                                        </Typography>
                                        <FormControl size="small" sx={{ minWidth: 120 }}>
                                            <Select
                                                value={selectedWrongCount}
                                                onChange={(e) => setSelectedWrongCount(Number(e.target.value))}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                        bgcolor: 'rgba(99, 102, 241, 0.02)'
                                                    }
                                                }}
                                            >
                                                <MenuItem value={5}>5 câu</MenuItem>
                                                <MenuItem value={10}>10 câu</MenuItem>
                                                <MenuItem value={15}>15 câu</MenuItem>
                                                <MenuItem value={20}>20 câu</MenuItem>
                                                <MenuItem value={-1}>Tất cả</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <Button
                                            variant="contained"
                                            onClick={() => handleCreateQuizFromWrongAnswers(
                                                selectedWrongCount === -1 ? wrongAnswerList.length : selectedWrongCount
                                            )}
                                            disabled={selectedWrongCount !== -1 && selectedWrongCount > wrongAnswerList.length}
                                            sx={{
                                                background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                px: 4,
                                                py: 1.5,
                                                '&:hover': {
                                                    boxShadow: '0 6px 20px rgba(239, 68, 68, 0.35)'
                                                }
                                            }}
                                        >
                                            <RefreshIcon sx={{ mr: 1 }} />
                                            Luyện tập
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                textAlign: 'center',
                                py: 4,
                                px: 2,
                                bgcolor: 'rgba(16, 185, 129, 0.02)',
                                borderRadius: 3,
                                border: '2px dashed rgba(16, 185, 129, 0.2)'
                            }}
                        >
                            <CheckCircleIcon sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
                            <Typography variant="body1" fontWeight={600} sx={{ color: '#10b981', mb: 1 }}>
                                Tuyệt vời! Không có câu sai nào
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Bạn đã trả lời đúng tất cả các câu hỏi. Hãy tiếp tục luyện tập!
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={() => window.location.href = '/vocabulary'}
                                sx={{
                                    borderColor: '#10b981',
                                    color: '#10b981',
                                    '&:hover': {
                                        bgcolor: 'rgba(16, 185, 129, 0.08)'
                                    }
                                }}
                            >
                                Đi đến từ vựng
                            </Button>
                        </Box>
                    )}
                </Paper>

                {/* Recent Results */}
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2.5, sm: 3, md: 4 },
                        mb: { xs: 3, sm: 4 },
                        borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.06)',
                        bgcolor: 'white',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <TrendingUpIcon sx={{ color: '#10b981', fontSize: 28 }} />
                            <Box>
                                <Typography variant="h5" fontWeight={700} sx={{ fontSize: '1.5rem' }}>
                                    Lịch sử làm bài gần đây
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Xem lại kết quả các bài kiểm tra gần nhất
                                </Typography>
                            </Box>
                        </Box>
                        <Link href="/quizzes" passHref>
                            <Button
                                endIcon={<ArrowForwardIcon />}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    '&:hover': {
                                        bgcolor: 'rgba(16, 185, 129, 0.08)'
                                    }
                                }}
                            >
                                Xem tất cả
                            </Button>
                        </Link>
                    </Box>

                    {recentResults.length > 0 ? (
                        <Grid container spacing={2}>
                            {recentResults.map((result) => (
                                <Grid item xs={12} sm={6} md={4} key={result.id}>
                                    <Card
                                        sx={{
                                            borderRadius: 2.5,
                                            border: '1px solid rgba(0,0,0,0.06)',
                                            transition: 'all 0.2s ease',
                                            height: '100%',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                                borderColor: result.score >= 50 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                                            }
                                        }}
                                    >
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: '#111827',
                                                        fontSize: '1rem',
                                                        lineHeight: 1.3,
                                                        flex: 1,
                                                        mr: 1
                                                    }}
                                                    noWrap
                                                >
                                                    {result.quizTitle}
                                                </Typography>
                                                <Chip
                                                    label={`${result.score}%`}
                                                    size="small"
                                                    sx={{
                                                        background: result.score >= 70
                                                            ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                                                            : result.score >= 50
                                                                ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)'
                                                                : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                                                        color: 'white',
                                                        fontWeight: 800,
                                                        fontSize: '0.85rem',
                                                        height: 26,
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                />
                                            </Box>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: '#6b7280',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                {result.completedAt ? new Date(result.completedAt).toLocaleDateString('vi-VN') : ''}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Box
                            sx={{
                                textAlign: 'center',
                                py: 4,
                                px: 2,
                                bgcolor: 'rgba(99, 102, 241, 0.02)',
                                borderRadius: 3,
                                border: '2px dashed rgba(99, 102, 241, 0.15)'
                            }}
                        >
                            <Typography variant="body1" fontWeight={600} sx={{ color: '#6366f1', mb: 1 }}>
                                Chưa có bài làm nào
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Hãy tạo quiz mới để bắt đầu học tập!
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => setShowQuizGenerator(!showQuizGenerator)}
                                sx={{
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    textTransform: 'none',
                                    fontWeight: 600
                                }}
                            >
                                Tạo quiz mới
                            </Button>
                        </Box>
                    )}
                </Paper>

                {/* Quiz List Section */}
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2.5, sm: 3, md: 4 },
                        mb: { xs: 3, sm: 4 },
                        borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.06)',
                        bgcolor: 'white',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <CheckCircleIcon sx={{ color: '#10b981', fontSize: 28 }} />
                            <Box>
                                <Typography variant="h5" fontWeight={700} sx={{ fontSize: '1.5rem' }}>
                                    Bài học của bạn
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {quizzes.length} đề đã được tạo
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            variant="contained"
                            onClick={() => {
                                setShowQuizGenerator(!showQuizGenerator);
                                if (!showQuizGenerator) {
                                    setTimeout(() => {
                                        quizGeneratorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }, 100);
                                }
                            }}
                            sx={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 3,
                                '&:hover': {
                                    boxShadow: '0 6px 20px rgba(99, 102, 241, 0.35)'
                                }
                            }}
                        >
                            {showQuizGenerator ? 'Đóng' : '+'} Tạo bài mới
                        </Button>
                    </Box>

                    {loadingQuizzes ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress sx={{ color: '#6366f1' }} />
                        </Box>
                    ) : quizzes.length === 0 ? (
                        <Box
                            sx={{
                                textAlign: 'center',
                                py: 4,
                                px: 2,
                                bgcolor: 'rgba(99, 102, 241, 0.02)',
                                borderRadius: 3,
                                border: '2px dashed rgba(99, 102, 241, 0.15)'
                            }}
                        >
                            <Typography variant="body1" fontWeight={600} sx={{ color: '#6366f1', mb: 1 }}>
                                Chưa có bài học nào
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Tạo bài học AI đầu tiên của bạn!
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => setShowQuizGenerator(true)}
                                sx={{
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    textTransform: 'none',
                                    fontWeight: 600
                                }}
                            >
                                Tạo quiz với AI
                            </Button>
                        </Box>
                    ) : (
                        <Grid container spacing={2}>
                            {quizzes.slice(0, 6).map((quiz) => (
                                <Grid item xs={12} sm={6} md={4} key={quiz.id}>
                                    <Card
                                        sx={{
                                            borderRadius: 2.5,
                                            border: '1px solid rgba(0,0,0,0.06)',
                                            transition: 'all 0.2s ease',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                                borderColor: 'rgba(99, 102, 241, 0.3)'
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: '#111827',
                                                        fontSize: '1rem',
                                                        lineHeight: 1.3,
                                                        flex: 1,
                                                        mr: 1
                                                    }}
                                                    noWrap
                                                >
                                                    {quiz.title}
                                                </Typography>
                                            </Box>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: '#6b7280',
                                                    fontSize: '0.9rem',
                                                    mb: 1.5
                                                }}
                                            >
                                                {quiz.count || quiz.questions?.length || 0} câu hỏi
                                            </Typography>
                                            {quiz.topic && (
                                                <Chip
                                                    label={quiz.topic}
                                                    size="small"
                                                    sx={{
                                                        mb: 2,
                                                        height: 24,
                                                        fontSize: '0.75rem',
                                                        bgcolor: 'rgba(16, 185, 129, 0.08)',
                                                        color: '#10b981',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            )}
                                            <Box sx={{ mt: 'auto' }}>
                                                <Link href={`/quizzes/${quiz.id}`} passHref>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        fullWidth
                                                        sx={{
                                                            borderRadius: 2,
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                                            '&:hover': {
                                                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                                            }
                                                        }}
                                                    >
                                                        Làm bài
                                                    </Button>
                                                </Link>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {quizzes.length > 6 && (
                        <Box sx={{ textAlign: 'center', mt: 3 }}>
                            <Link href="/quizzes" passHref>
                                <Button
                                    variant="outlined"
                                    endIcon={<ArrowForwardIcon />}
                                    sx={{
                                        px: 4,
                                        textTransform: 'none',
                                        fontWeight: 600
                                    }}
                                >
                                    Xem tất cả {quizzes.length} bài học
                                </Button>
                            </Link>
                        </Box>
                    )}
                </Paper>

                {/* AI Quiz Generator - Hidden by default */}
                {showQuizGenerator && (
                    <Box ref={quizGeneratorRef} sx={{ mb: 4 }}>
                        <AIQuizGenerator onGenerate={handleGenerate} />
                    </Box>
                )}

                {/* Dialog tạo đề từ câu hỏi đã chọn */}
                <Dialog open={openCreateQuiz} onClose={() => setOpenCreateQuiz(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Tạo đề từ câu hỏi đã chọn</DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Tiêu đề đề"
                                fullWidth
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                                placeholder="Ví dụ: Kiểm tra chương 1"
                            />
                            <TextField
                                label="Chủ đề (tùy chọn)"
                                fullWidth
                                value={quizTopic}
                                onChange={(e) => setQuizTopic(e.target.value)}
                                placeholder="Ví dụ: Toán, Lịch sử..."
                            />
                            <Typography variant="body2" color="text.secondary">
                                Số câu hỏi: {selectedQuestions.length}
                            </Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenCreateQuiz(false)}>Hủy</Button>
                        <Button variant="contained" onClick={handleCreateQuiz}>
                            Tạo đề
                        </Button>
                    </DialogActions>
                </Dialog>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={3000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    <Alert severity={snackbar.severity}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </>
    );
}
