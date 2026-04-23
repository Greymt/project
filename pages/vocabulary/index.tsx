'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import {
    Container, Typography, Box, Paper, Button, TextField, Grid,
    Card, CardContent, IconButton, Chip, Dialog, DialogTitle,
    DialogContent, DialogActions, FormControl, InputLabel, Select,
    MenuItem, Slider, Switch, FormControlLabel, CircularProgress,
    Alert, Snackbar, Tabs, Tab, Tooltip, alpha
} from '@mui/material';
import {
    Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon,
    VolumeUp as VolumeUpIcon, Check as CheckIcon, Close as CloseIcon,
    Shuffle as ShuffleIcon, VisibilityOff as VisibilityOffIcon,
    PlayArrow as PlayArrowIcon, Square as SquareIcon,
    AutoAwesome as SparkleIcon, MenuBook as MenuBookIcon,
    ArrowForward as ArrowForwardIcon,
    CheckCircle as CheckCircleIcon, Settings as SettingsIcon,
    Warning as WarningIcon, Quiz as QuizIcon, EditNote as EditNoteIcon,
    TextFields as TextFieldsIcon, FilterList as FilterListIcon,
    Login as LoginIcon
} from '@mui/icons-material';
import Link from 'next/link';
import Header from '@/components/Header';
import type { Vocabulary } from '@/types';

interface VocabularyFormData {
    word: string;
    phonetic: string;
    partOfSpeech: string;
    meaning: string;
    examples: string;
}

export default function VocabularyPage() {
    const { data: session, status } = useSession();
    const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    // Dialog states
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openQuizDialog, setOpenQuizDialog] = useState(false);
    const [editingVocabulary, setEditingVocabulary] = useState<Vocabulary | null>(null);

    // Form data
    const [formData, setFormData] = useState<VocabularyFormData>({
        word: '', phonetic: '', partOfSpeech: '', meaning: '', examples: ''
    });
    const [generateWithAI, setGenerateWithAI] = useState(true);
    const [topic, setTopic] = useState('');
    const [aiCount, setAiCount] = useState(10);

    // Quiz settings
    const [quizFilter, setQuizFilter] = useState('all'); // all, remembered, unremembered
    const [quizType, setQuizType] = useState('both'); // meaning, word, both
    const [quizCount, setQuizCount] = useState(10);
    const [skipRemembered, setSkipRemembered] = useState(true);
    const [showPhonetic, setShowPhonetic] = useState(true);
    const [shuffleCards, setShuffleCards] = useState(true);

    // Quiz state
    const [quizQuestions, setQuizQuestions] = useState<Vocabulary[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [showAnswer, setShowAnswer] = useState(false);
    const [quizScore, setQuizScore] = useState(0);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [quizStarted, setQuizStarted] = useState(false);
    const [wrongAnswers, setWrongAnswers] = useState<Vocabulary[]>([]);
    const [practiceMode, setPracticeMode] = useState(false);

    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });

    useEffect(() => {
        if (status === 'authenticated') {
            fetchVocabularies();
        }
    }, [status]);

    const fetchVocabularies = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/vocabulary');
            const data = await res.json();
            if (data.success) {
                setVocabularies(data.data.vocabularies);
            }
        } catch (error) {
            console.error('Error fetching vocabularies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddDialog = (vocab?: Vocabulary) => {
        if (vocab) {
            setEditingVocabulary(vocab);
            setFormData({
                word: vocab.word,
                phonetic: vocab.phonetic,
                partOfSpeech: vocab.partOfSpeech,
                meaning: vocab.meaning,
                examples: vocab.examples.join('\n')
            });
            setGenerateWithAI(false);
        } else {
            setEditingVocabulary(null);
            setFormData({ word: '', phonetic: '', partOfSpeech: '', meaning: '', examples: '' });
            setGenerateWithAI(true);
        }
        setOpenAddDialog(true);
    };

    const handleCloseAddDialog = () => {
        setOpenAddDialog(false);
        setEditingVocabulary(null);
    };

    const handleSave = async () => {
        if (!formData.word || !formData.meaning) {
            setSnackbar({ open: true, message: 'Vui lòng nhập từ và nghĩa', severity: 'error' });
            return;
        }

        try {
            const body: any = {
                word: formData.word,
                phonetic: formData.phonetic,
                partOfSpeech: formData.partOfSpeech,
                meaning: formData.meaning,
                examples: formData.examples.split('\n').filter(e => e.trim()),
                generateWithAI
            };

            let url = '/api/vocabulary';
            let method = 'POST';

            if (editingVocabulary) {
                url = '/api/vocabulary';
                method = 'PUT';
                body.id = editingVocabulary.id;
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (data.success) {
                setSnackbar({
                    open: true,
                    message: editingVocabulary ? 'Cập nhật từ thành công' : 'Thêm từ thành công',
                    severity: 'success'
                });
                handleCloseAddDialog();
                fetchVocabularies();
            } else {
                setSnackbar({ open: true, message: data.error || 'Lỗi', severity: 'error' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Lỗi khi lưu', severity: 'error' });
        }
    };

    const handleGenerateWithAI = async () => {
        if (!topic.trim()) {
            setSnackbar({ open: true, message: 'Vui lòng nhập chủ đề', severity: 'error' });
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/vocabulary/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic,
                    count: aiCount,
                    userEmail: session?.user?.email
                })
            });

            const data = await res.json();

            if (data.success) {
                setSnackbar({
                    open: true,
                    message: `Đã tạo ${data.data.count} từ vựng`,
                    severity: 'success'
                });
                fetchVocabularies();
            } else {
                setSnackbar({ open: true, message: data.error || 'Lỗi', severity: 'error' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Lỗi khi tạo từ vựng', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa từ này?')) return;

        try {
            const res = await fetch(`/api/vocabulary?id=${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                setSnackbar({ open: true, message: 'Xóa thành công', severity: 'success' });
                fetchVocabularies();
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Lỗi khi xóa', severity: 'error' });
        }
    };

    const handleToggleRemembered = async (vocab: Vocabulary) => {
        try {
            await fetch('/api/vocabulary', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: vocab.id,
                    isRemembered: !vocab.isRemembered,
                    reviewCount: vocab.reviewCount + 1
                })
            });
            fetchVocabularies();
        } catch (error) {
            console.error('Error updating vocabulary:', error);
        }
    };

    const speakWord = (word: string) => {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
    };

    // Quiz functions
    const startQuiz = () => {
        let filtered = [...vocabularies];

        // Filter by remembered status
        if (quizFilter === 'remembered') {
            filtered = filtered.filter(v => v.isRemembered);
        } else if (quizFilter === 'unremembered') {
            filtered = filtered.filter(v => !v.isRemembered);
        }

        // Skip remembered if option enabled
        if (skipRemembered) {
            filtered = filtered.filter(v => !v.isRemembered);
        }

        // Shuffle if option enabled
        if (shuffleCards) {
            filtered = filtered.sort(() => Math.random() - 0.5);
        }

        // Limit count
        const limited = filtered.slice(0, quizCount);

        if (limited.length === 0) {
            setSnackbar({ open: true, message: 'Không có từ nào phù hợp', severity: 'info' });
            return;
        }

        // Reset wrong answers for new quiz
        setWrongAnswers([]);
        setPracticeMode(false);

        setQuizQuestions(limited);
        setCurrentQuestionIndex(0);
        setQuizScore(0);
        setQuizCompleted(false);
        setShowAnswer(false);
        setUserAnswer('');
        setQuizStarted(true);
        setOpenQuizDialog(true);
    };

    const checkAnswer = () => {
        const currentQuestion = quizQuestions[currentQuestionIndex];
        let isCorrect = false;

        if (quizType === 'meaning') {
            isCorrect = userAnswer.toLowerCase().trim() === currentQuestion.meaning.toLowerCase().trim();
        } else if (quizType === 'word') {
            isCorrect = userAnswer.toLowerCase().trim() === currentQuestion.word.toLowerCase().trim();
        } else {
            isCorrect = userAnswer.toLowerCase().trim() === currentQuestion.word.toLowerCase().trim() ||
                userAnswer.toLowerCase().trim() === currentQuestion.meaning.toLowerCase().trim();
        }

        if (isCorrect) {
            setQuizScore(prev => prev + 1);
            setSnackbar({ open: true, message: '✓ Đúng!', severity: 'success' });
        } else {
            // Add to wrong answers if not already there
            setWrongAnswers(prev => {
                const exists = prev.some(v => v.id === currentQuestion.id);
                if (!exists) {
                    return [...prev, currentQuestion];
                }
                return prev;
            });
            setSnackbar({
                open: true,
                message: `✗ Sai! Đáp án: ${quizType === 'meaning' ? currentQuestion.word : currentQuestion.meaning}`,
                severity: 'error'
            });
        }

        setShowAnswer(true);
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setShowAnswer(false);
            setUserAnswer('');
        } else {
            setQuizCompleted(true);
        }
    };

    const startPracticeWrongAnswers = () => {
        if (wrongAnswers.length === 0) return;

        // Shuffle wrong answers
        const shuffled = [...wrongAnswers].sort(() => Math.random() - 0.5);
        setQuizQuestions(shuffled);
        setCurrentQuestionIndex(0);
        setQuizScore(0);
        setQuizCompleted(false);
        setShowAnswer(false);
        setUserAnswer('');
        setQuizStarted(true);
        setPracticeMode(true);
        setOpenQuizDialog(true);
    };

    const resetQuiz = () => {
        setOpenQuizDialog(false);
        setQuizStarted(false);
        setQuizCompleted(false);
        setWrongAnswers([]);
        setPracticeMode(false);
        setCurrentQuestionIndex(0);
        setQuizScore(0);
        setShowAnswer(false);
        setUserAnswer('');
        setQuizQuestions([]);
    };

    const getCurrentQuestion = () => {
        return quizQuestions[currentQuestionIndex];
    };

    const getUnrememberedCount = () => {
        return vocabularies.filter(v => !v.isRemembered).length;
    };

    // Helper components
    const StatCard = ({ value, label, color, gradient, icon }: {
        value: number;
        label: string;
        color: string;
        gradient: string;
        icon: React.ReactNode;
    }) => (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid rgba(0,0,0,0.06)',
                bgcolor: 'white',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: gradient
                },
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
                    color,
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
                    color,
                    lineHeight: 1,
                    background: gradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
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
                    letterSpacing: '0.02em'
                }}
            >
                {label}
            </Typography>
        </Paper>
    );

    const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
        <Box
            sx={{
                textAlign: 'center',
                py: { xs: 6, sm: 8 },
                px: 4
            }}
        >
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, color: '#6366f1' }}>
                📝 Chưa có từ nào
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
                Bắt đầu xây dựng kho từ vựng của mình bằng cách thêm từ thủ công hoặc để AI tạo giúp bạn.
            </Typography>
            <Button
                variant="contained"
                size="large"
                onClick={onAdd}
                sx={{
                    borderRadius: 2.5,
                    px: 4,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(99, 102, 241, 0.35)'
                    }
                }}
            >
                Thêm từ đầu tiên
            </Button>
        </Box>
    );

    if (status === 'loading' || loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    gap: 3
                }}
            >
                <Box className="spinner" sx={{ width: 60, height: 60 }} />
                <Typography
                    variant="body1"
                    sx={{
                        color: '#6366f1',
                        fontWeight: 600,
                        fontSize: '1rem'
                    }}
                >
                    Đang tải...
                </Typography>
            </Box>
        );
    }

    if (!session) {
        return (
            <Container maxWidth="sm">
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 3, mx: 'auto', mt: 8 }}>
                    <LoginIcon sx={{ fontSize: 64, color: '#6366f1', mb: 2 }} />
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Cần đăng nhập
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Bạn cần đăng nhập để học từ vựng
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

    return (
        <>
            <Head>
                <title>Từ vựng - AI Quiz</title>
            </Head>

            <Header />

            <Container maxWidth="lg" sx={{
                py: { xs: 2, sm: 3, md: 4 },
                position: 'relative',
                minHeight: '100vh'
            }}>
                {/* Decorative animated gradient background */}
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
                            radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
                            radial-gradient(circle at 40% 60%, rgba(16, 185, 129, 0.03) 0%, transparent 40%)
                        `,
                        animation: 'gradientShift 15s ease infinite alternate'
                    }}
                />
                <style jsx global>{`
                    @keyframes gradientShift {
                        0% {
                            background-position: 0% 0%;
                        }
                        100% {
                            background-position: 100% 100%;
                        }
                    }
                `}</style>

                {/* Header Section */}
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
                        Từ vựng
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                        Xây dựng và luyện tập từ vựng với sự hỗ trợ của AI
                    </Typography>
                </Box>

                {/* Stats Cards */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                        gap: 2.5,
                        mb: { xs: 3, sm: 4 }
                    }}
                >
                    <StatCard
                        value={vocabularies.length}
                        label="Tổng số từ"
                        color="#6366f1"
                        gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                        icon={<MenuBookIcon sx={{ fontSize: 32 }} />}
                    />
                    <StatCard
                        value={vocabularies.filter(v => v.isRemembered).length}
                        label="Đã nhớ"
                        color="#10b981"
                        gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
                        icon={<CheckCircleIcon sx={{ fontSize: 32 }} />}
                    />
                    <StatCard
                        value={getUnrememberedCount()}
                        label="Chưa nhớ"
                        color="#f59e0b"
                        gradient="linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
                        icon="📌"
                    />
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.5,
                            borderRadius: 3,
                            border: '2px solid #ef4444',
                            bgcolor: 'white',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 3,
                                background: 'linear-gradient(90deg, #ef4444, #f97316)'
                            },
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.15)',
                                borderColor: '#dc2626'
                            }
                        }}
                        onClick={startQuiz}
                    >
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 1,
                                bgcolor: 'rgba(239, 68, 68, 0.08)'
                            }}
                        >
                            <PlayArrowIcon sx={{ fontSize: 28, color: '#ef4444' }} />
                        </Box>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 700,
                                color: '#ef4444',
                                fontSize: '1.1rem'
                            }}
                        >
                            Luyện tập
                        </Typography>
                    </Paper>
                </Box>

                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    sx={{
                        mb: { xs: 3, sm: 4 },
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '1rem',
                            px: { xs: 2, sm: 3 }
                        }
                    }}
                >
                    <Tab label="Danh sách từ" />
                    <Tab label="Tạo từ AI" />
                </Tabs>

                {/* Tab 0: Word List */}
                {activeTab === 0 && (
                    <>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 3,
                            flexWrap: 'wrap',
                            gap: 2,
                            p: 2,
                            bgcolor: 'rgba(255,255,255,0.7)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: 3,
                            border: '1px solid rgba(0,0,0,0.04)'
                        }}>
                            <Box>
                                <Typography variant="body1" sx={{
                                    fontWeight: 600,
                                    color: '#374151',
                                    fontSize: '1rem'
                                }}>
                                    Thư viện từ vựng
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                    {vocabularies.length} từ đã lưu
                                </Typography>
                            </Box>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpenAddDialog()}
                                sx={{
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    px: 3,
                                    '&:hover': {
                                        boxShadow: '0 6px 20px rgba(99, 102, 241, 0.35)',
                                        transform: 'translateY(-1px)'
                                    },
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                + Thêm từ mới
                            </Button>
                        </Box>

                        {vocabularies.length === 0 ? (
                            <EmptyState onAdd={() => handleOpenAddDialog()} />
                        ) : (
                            <Grid container spacing={2}>
                                {vocabularies.map((vocab, idx) => (
                                    <Grid item xs={12} sm={6} md={4} key={vocab.id}>
                                        <Card
                                            sx={{
                                                height: '100%',
                                                borderRadius: 3,
                                                border: vocab.isRemembered
                                                    ? '2px solid #10b981'
                                                    : '1px solid rgba(0, 0, 0, 0.06)',
                                                bgcolor: vocab.isRemembered
                                                    ? 'rgba(16, 185, 129, 0.02)'
                                                    : 'white',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                                transition: 'all 0.3s ease',
                                                opacity: vocab.isRemembered ? 0.85 : 1,
                                                position: 'relative',
                                                overflow: 'hidden',
                                                animation: `fadeInUp 0.5s ease-out ${idx * 0.05}s both`,
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
                                                    borderColor: vocab.isRemembered ? '#10b981' : 'rgba(99, 102, 241, 0.3)'
                                                },
                                                '&::before': vocab.isRemembered ? {
                                                    content: '""',
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    height: 3,
                                                    background: 'linear-gradient(90deg, #10b981, #34d399)'
                                                } : {}
                                            }}
                                        >
                                            <CardContent sx={{ p: 2.5 }}>
                                                <Box sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    gap: 1.5
                                                }}>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Box sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            flexWrap: 'wrap',
                                                            mb: 0.5
                                                        }}>
                                                            <Typography
                                                                variant="h6"
                                                                sx={{
                                                                    fontWeight: 800,
                                                                    fontSize: '1.15rem',
                                                                    color: vocab.isRemembered ? '#10b981' : '#111827',
                                                                    letterSpacing: '-0.01em',
                                                                    wordBreak: 'break-word'
                                                                }}
                                                            >
                                                                {vocab.word}
                                                            </Typography>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => speakWord(vocab.word)}
                                                                sx={{
                                                                    color: '#6366f1',
                                                                    bgcolor: 'rgba(99, 102, 241, 0.08)',
                                                                    width: 32,
                                                                    height: 32,
                                                                    '&:hover': {
                                                                        bgcolor: 'rgba(99, 102, 241, 0.18)',
                                                                        transform: 'scale(1.05)'
                                                                    }
                                                                }}
                                                            >
                                                                <VolumeUpIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                        {vocab.phonetic && (
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: '#6b7280',
                                                                    fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Fira Mono", monospace',
                                                                    fontSize: '0.8rem',
                                                                    mb: 0.5
                                                                }}
                                                            >
                                                                {vocab.phonetic}
                                                            </Typography>
                                                        )}
                                                        {vocab.partOfSpeech && (
                                                            <Chip
                                                                label={vocab.partOfSpeech}
                                                                size="small"
                                                                sx={{
                                                                    height: 24,
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: 600,
                                                                    bgcolor: 'rgba(99, 102, 241, 0.08)',
                                                                    color: '#6366f1',
                                                                    border: '1px solid rgba(99, 102, 241, 0.15)',
                                                                    '&:hover': {
                                                                        bgcolor: 'rgba(99, 102, 241, 0.15)'
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                    </Box>
                                                    <Box sx={{
                                                        display: 'flex',
                                                        gap: 0.5,
                                                        flexShrink: 0
                                                    }}>
                                                        <Tooltip title={vocab.isRemembered ? 'Đã nhớ' : 'Đánh dấu đã nhớ'}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleToggleRemembered(vocab)}
                                                                sx={{
                                                                    color: vocab.isRemembered ? '#10b981' : '#9ca3af',
                                                                    bgcolor: vocab.isRemembered ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                                                    transition: 'all 0.2s ease',
                                                                    '&:hover': {
                                                                        bgcolor: vocab.isRemembered ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0,0,0,0.05)',
                                                                        transform: 'scale(1.1)'
                                                                    }
                                                                }}
                                                            >
                                                                {vocab.isRemembered ? <CheckIcon fontSize="small" /> : <SquareIcon fontSize="small" />}
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Sửa từ">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleOpenAddDialog(vocab)}
                                                                sx={{
                                                                    color: '#6366f1',
                                                                    bgcolor: 'rgba(99, 102, 241, 0.08)',
                                                                    transition: 'all 0.2s ease',
                                                                    '&:hover': {
                                                                        bgcolor: 'rgba(99, 102, 241, 0.18)',
                                                                        transform: 'scale(1.05)'
                                                                    }
                                                                }}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Xóa từ">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDelete(vocab.id)}
                                                                sx={{
                                                                    transition: 'all 0.2s ease',
                                                                    '&:hover': {
                                                                        bgcolor: 'rgba(239, 68, 68, 0.08)',
                                                                        transform: 'scale(1.05)'
                                                                    }
                                                                }}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        mt: 1.5,
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        bgcolor: 'rgba(99, 102, 241, 0.03)',
                                                        borderLeft: '3px solid #6366f1',
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': {
                                                            bgcolor: 'rgba(99, 102, 241, 0.05)',
                                                            borderLeftWidth: 4
                                                        }
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body1"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: '#111827',
                                                            fontSize: '0.95rem',
                                                            lineHeight: 1.6,
                                                            wordBreak: 'break-word'
                                                        }}
                                                    >
                                                        {vocab.meaning}
                                                    </Typography>
                                                </Box>
                                                {vocab.examples.length > 0 && (
                                                    <Box sx={{ mt: 1.5 }}>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: '#6b7280',
                                                                fontStyle: 'italic',
                                                                fontSize: '0.82rem',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                                lineHeight: 1.5,
                                                                position: 'relative',
                                                                '&::before': {
                                                                    content: '""',
                                                                    position: 'absolute',
                                                                    left: -12,
                                                                    top: 0,
                                                                    bottom: 0,
                                                                    width: 2,
                                                                    borderRadius: 1,
                                                                    bgcolor: '#d1d5db'
                                                                },
                                                                pl: 2
                                                            }}
                                                        >
                                                            {vocab.examples[0]}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </>
                )}

                {/* Tab 1: AI Generation */}
                {activeTab === 1 && (
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 3, sm: 4, md: 5 },
                            maxWidth: 700,
                            mx: 'auto',
                            borderRadius: 4,
                            bgcolor: 'white',
                            border: '1px solid rgba(0,0,0,0.06)',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 4,
                                background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)'
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                            <SparkleIcon sx={{ color: '#6366f1', fontSize: 32, filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.2))' }} />
                            <Box>
                                <Typography variant="h4" fontWeight={800} sx={{ fontSize: '1.75rem', color: '#1f2937', letterSpacing: '-0.02em' }}>
                                    Tạo từ vựng với AI
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.9rem' }}>
                                    Hệ thống sẽ tự động tạo từ vựng với phiên âm, loại từ, nghĩa và ví dụ
                                </Typography>
                            </Box>
                        </Box>

                        <TextField
                            fullWidth
                            label="Chủ đề"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="VD: Giao tiếp hàng ngày, Du lịch, Công nghệ, Kinh doanh, Sức khỏe..."
                            sx={{
                                mb: 3,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2.5,
                                    bgcolor: 'rgba(99, 102, 241, 0.02)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        bgcolor: 'rgba(99, 102, 241, 0.04)',
                                        borderColor: 'rgba(99, 102, 241, 0.3)'
                                    },
                                    '&.Mui-focused': {
                                        bgcolor: 'white',
                                        boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
                                    }
                                },
                                '& .MuiInputLabel-root': {
                                    fontWeight: 500,
                                    color: '#6b7280'
                                }
                            }}
                        />

                        <Box sx={{ mb: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Typography fontWeight={600} sx={{ color: '#374151', fontSize: '0.95rem' }}>
                                    Số lượng từ cần tạo
                                </Typography>
                                <Box sx={{
                                    px: 2.5,
                                    py: 0.75,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(99, 102, 241, 0.1)',
                                    color: '#6366f1',
                                    fontWeight: 800,
                                    fontSize: '1rem',
                                    letterSpacing: '-0.01em'
                                }}>
                                    {aiCount} từ
                                </Box>
                            </Box>
                            <Slider
                                value={aiCount}
                                onChange={(_, v) => setAiCount(v as number)}
                                min={5}
                                max={30}
                                step={5}
                                sx={{
                                    color: '#6366f1',
                                    '& .MuiSlider-thumb': {
                                        width: 24,
                                        height: 24,
                                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                                        '&:hover': {
                                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
                                        }
                                    },
                                    '& .MuiSlider-track': {
                                        height: 8,
                                        borderRadius: 4
                                    },
                                    '& .MuiSlider-rail': {
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: 'rgba(99, 102, 241, 0.1)'
                                    }
                                }}
                                marks={[
                                    { value: 5, label: '5' },
                                    { value: 15, label: '15' },
                                    { value: 30, label: '30' }
                                ]}
                            />
                        </Box>

                        <Box
                            sx={{
                                p: 3,
                                mb: 3,
                                borderRadius: 3,
                                bgcolor: 'rgba(99, 102, 241, 0.03)',
                                border: '1px dashed rgba(99, 102, 241, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2
                            }}
                        >
                            <Box sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'rgba(99, 102, 241, 0.1)'
                            }}>
                                <SparkleIcon sx={{ color: '#6366f1' }} />
                            </Box>
                            <Box>
                                <Typography variant="body2" fontWeight={600} sx={{ color: '#374151' }}>
                                    AI sẽ giúp bạn
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                    Tạo {aiCount} từ vựng chất lượng với phiên âm, ví dụ và loại từ
                                </Typography>
                            </Box>
                        </Box>

                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            onClick={handleGenerateWithAI}
                            disabled={loading || !topic.trim()}
                            sx={{
                                height: 60,
                                borderRadius: 2.5,
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                boxShadow: loading ? 'none' : '0 6px 20px rgba(99, 102, 241, 0.3)',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '1.05rem',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: '0 8px 28px rgba(99, 102, 241, 0.4)',
                                    transform: 'translateY(-2px)'
                                },
                                '&:active': {
                                    transform: 'translateY(0)'
                                },
                                '&:disabled': {
                                    background: 'linear-gradient(135deg, #9ca3af 0%, #d1d5db 100%)',
                                    boxShadow: 'none'
                                }
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={28} sx={{ color: 'white' }} />
                            ) : (
                                <>
                                    <SparkleIcon sx={{ mr: 1, fontSize: 20 }} />
                                    Tạo {aiCount} từ vựng với AI
                                </>
                            )}
                        </Button>
                    </Paper>
                )}

                {/* Add/Edit Dialog */}
                <Dialog
                    open={openAddDialog}
                    onClose={handleCloseAddDialog}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: 4,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                            overflow: 'hidden'
                        }
                    }}
                >
                    <Box sx={{
                        bgcolor: 'rgba(99, 102, 241, 0.05)',
                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                        py: 2,
                        px: 3
                    }}>
                        <DialogTitle sx={{
                            m: 0,
                            fontWeight: 700,
                            fontSize: '1.25rem',
                            color: '#1f2937',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            {editingVocabulary ? <><EditIcon sx={{ mr: 1 }} /> Sửa từ</> : <><SparkleIcon sx={{ mr: 1 }} /> Thêm từ mới</>}
                        </DialogTitle>
                    </Box>
                    <DialogContent sx={{ pt: 3, px: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                            {!editingVocabulary && (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={generateWithAI}
                                            onChange={(e) => setGenerateWithAI(e.target.checked)}
                                            sx={{
                                                '& .MuiSwitch-switchBase.Mui-checked': {
                                                    color: '#6366f1'
                                                },
                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                    backgroundColor: 'rgba(99, 102, 241, 0.5)'
                                                }
                                            }}
                                        />
                                    }
                                    label={
                                        <Typography fontWeight={500} sx={{ color: generateWithAI ? '#6366f1' : '#6b7280' }}>
                                            <SparkleIcon sx={{ mr: 1, fontSize: 18 }} /> Tạo với AI
                                        </Typography>
                                    }
                                />
                            )}
                            <TextField
                                label="Từ tiếng Anh"
                                fullWidth
                                value={formData.word}
                                onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: 'rgba(99, 102, 241, 0.02)'
                                    }
                                }}
                            />
                            <TextField
                                label="Phiên âm"
                                fullWidth
                                value={formData.phonetic}
                                onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
                                placeholder="VD: /prəˈnʌnsiˈeɪʃn/"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: 'rgba(99, 102, 241, 0.02)',
                                        '& input': { fontFamily: 'monospace' }
                                    }
                                }}
                            />
                            <FormControl fullWidth>
                                <InputLabel sx={{ fontWeight: 500 }}>Loại từ</InputLabel>
                                <Select
                                    value={formData.partOfSpeech}
                                    label="Loại từ"
                                    onChange={(e) => setFormData({ ...formData, partOfSpeech: e.target.value })}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            bgcolor: 'rgba(99, 102, 241, 0.02)'
                                        }
                                    }}
                                >
                                    <MenuItem value="Noun (Danh từ)">Noun (Danh từ)</MenuItem>
                                    <MenuItem value="Verb (Động từ)">Verb (Động từ)</MenuItem>
                                    <MenuItem value="Adjective (Tính từ)">Adjective (Tính từ)</MenuItem>
                                    <MenuItem value="Adverb (Trạng từ)">Adverb (Trạng từ)</MenuItem>
                                    <MenuItem value="Preposition (Giới từ)">Preposition (Giới từ)</MenuItem>
                                    <MenuItem value="Conjunction (Liên từ)">Conjunction (Liên từ)</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                label="Nghĩa tiếng Việt"
                                fullWidth
                                multiline
                                rows={2}
                                value={formData.meaning}
                                onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: 'rgba(99, 102, 241, 0.02)'
                                    }
                                }}
                            />
                            <TextField
                                label="Ví dụ (mỗi dòng một ví dụ)"
                                fullWidth
                                multiline
                                rows={3}
                                value={formData.examples}
                                onChange={(e) => setFormData({ ...formData, examples: e.target.value })}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        bgcolor: 'rgba(99, 102, 241, 0.02)'
                                    }
                                }}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 1 }}>
                        <Button
                            onClick={handleCloseAddDialog}
                            sx={{
                                borderRadius: 2,
                                px: 3,
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                            }}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            sx={{
                                borderRadius: 2,
                                px: 4,
                                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': {
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                }
                            }}
                        >
                            💾 Lưu
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Quiz Dialog */}
                <Dialog
                    open={openQuizDialog}
                    onClose={() => setOpenQuizDialog(false)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: 4,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                            overflow: 'hidden'
                        }
                    }}
                >
                    <Box sx={{
                        bgcolor: practiceMode
                            ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
                            : quizCompleted
                                ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                                : quizStarted
                                    ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)'
                                    : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        p: 3,
                        color: 'white'
                    }}>
                        <DialogTitle sx={{
                            m: 0,
                            fontWeight: 700,
                            fontSize: '1.25rem',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap'
                        }}>
                            {practiceMode ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <span>🔄</span>
                                    <span>Luyện tập câu sai</span>
                                </Box>
                            ) : quizCompleted ? (
                                '🎉 Hoàn thành!'
                            ) : quizStarted ? (
                                `Câu ${currentQuestionIndex + 1}/${quizQuestions.length}`
                            ) : (
                                <><QuizIcon sx={{ mr: 1, fontSize: 18 }} /> Cài đặt bài kiểm tra</>
                            )}
                            {practiceMode && (
                                <Chip
                                    label={`${wrongAnswers.length} câu cần luyện`}
                                    size="small"
                                    sx={{
                                        ml: 1,
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        fontWeight: 600,
                                        backdropFilter: 'blur(10px)'
                                    }}
                                />
                            )}
                        </DialogTitle>
                    </Box>
                    <DialogContent sx={{ pt: 3, px: 3 }}>
                        {quizCompleted ? (
                            <Box sx={{
                                textAlign: 'center',
                                py: 2,
                                '& .score-circle': {
                                    width: 120,
                                    height: 120,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    mx: 'auto',
                                    mb: 2,
                                    background: Math.round((quizScore / quizQuestions.length) * 100) >= 70
                                        ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                                        : Math.round((quizScore / quizQuestions.length) * 100) >= 50
                                            ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
                                            : 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                                    color: 'white',
                                    boxShadow: `0 8px 24px rgba(${Math.round((quizScore / quizQuestions.length) * 100) >= 70 ? '16, 185, 129' : Math.round((quizScore / quizQuestions.length) * 100) >= 50 ? '245, 158, 11' : '239, 68, 68'}, 0.3)`
                                }
                            }}>
                                <Box className="score-circle">
                                    <Typography variant="h3" fontWeight={800}>
                                        {Math.round((quizScore / quizQuestions.length) * 100)}%
                                    </Typography>
                                </Box>
                                <Typography variant="h5" fontWeight={700} sx={{ color: '#1f2937', mt: 2 }}>
                                    {quizScore}/{quizQuestions.length} câu đúng
                                </Typography>

                                {/* Wrong Answers Section */}
                                {wrongAnswers.length > 0 && (
                                    <Box sx={{ mt: 3, mb: 2 }}>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                color: '#ef4444',
                                                fontWeight: 700,
                                                mb: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 0.5
                                            }}
                                        >
                                            <WarningIcon sx={{ mr: 1, fontSize: 18, color: '#ef4444' }} />
                                            {wrongAnswers.length} câu sai cần luyện tập
                                        </Typography>
                                        <Box
                                            sx={{
                                                maxHeight: 180,
                                                overflowY: 'auto',
                                                mx: 'auto',
                                                maxWidth: 400,
                                                borderRadius: 2,
                                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                                bgcolor: 'rgba(239, 68, 68, 0.04)',
                                                p: 1
                                            }}
                                        >
                                            {wrongAnswers.map((vocab, idx) => (
                                                <Box
                                                    key={`wrong-${vocab.id}-${idx}`}
                                                    sx={{
                                                        p: 1.5,
                                                        mb: 1,
                                                        borderRadius: 2,
                                                        bgcolor: 'white',
                                                        border: '1px solid rgba(0,0,0,0.06)',
                                                        textAlign: 'left',
                                                        '&:last-child': { mb: 0 }
                                                    }}
                                                >
                                                    <Typography variant="body2" fontWeight={700} sx={{ color: '#111827', fontSize: '0.9rem' }}>
                                                        {vocab.word}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.8rem' }}>
                                                        {vocab.meaning}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>

                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={startPracticeWrongAnswers}
                                            sx={{
                                                mt: 2,
                                                background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                px: 3,
                                                '&:hover': {
                                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                                                }
                                            }}
                                        >
                                            🔄 Luyện tập lại {wrongAnswers.length} câu sai
                                        </Button>
                                    </Box>
                                )}

                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                    Còn {getUnrememberedCount()} từ chưa nhớ trong tổng số từ vựng
                                </Typography>
                            </Box>
                        ) : quizStarted && getCurrentQuestion() ? (
                            <Box sx={{ py: 2 }}>
                                {/* Question */}
                                <Box sx={{
                                    mb: 3,
                                    p: 3,
                                    borderRadius: 3,
                                    bgcolor: 'rgba(239, 68, 68, 0.04)',
                                    border: '1px solid rgba(239, 68, 68, 0.12)'
                                }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            color: '#ef4444',
                                            mb: 1,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            fontSize: '0.75rem'
                                        }}
                                    >
                                        {quizType === 'meaning' ? 'Điền nghĩa của từ:' :
                                         quizType === 'word' ? 'Điền từ tiếng Anh:' :
                                         'Điền từ hoặc nghĩa:'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                        <Typography
                                            variant="h4"
                                            sx={{
                                                fontWeight: 800,
                                                color: '#1f2937',
                                                fontSize: { xs: '1.5rem', sm: '1.75rem' },
                                                letterSpacing: '-0.02em'
                                            }}
                                        >
                                            {quizType === 'meaning' ? getCurrentQuestion().word : getCurrentQuestion().meaning}
                                        </Typography>
                                        {quizType !== 'meaning' && (
                                            <IconButton
                                                onClick={() => speakWord(getCurrentQuestion().word)}
                                                sx={{
                                                    color: '#6366f1',
                                                    bgcolor: 'rgba(99, 102, 241, 0.1)',
                                                    '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.2)' }
                                                }}
                                            >
                                                <VolumeUpIcon />
                                            </IconButton>
                                        )}
                                    </Box>
                                    {showPhonetic && getCurrentQuestion().phonetic && (
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: '#6b7280',
                                                fontFamily: 'monospace',
                                                fontSize: '1rem',
                                                mt: 1
                                            }}
                                        >
                                            {getCurrentQuestion().phonetic}
                                        </Typography>
                                    )}
                                </Box>

                                {/* Answer Input */}
                                <TextField
                                    fullWidth
                                    label="Nhập đáp án của bạn"
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    disabled={showAnswer}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !showAnswer) {
                                            checkAnswer();
                                        }
                                    }}
                                    sx={{
                                        mb: 2,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2.5,
                                            fontSize: '1.1rem',
                                            '&.Mui-focused': {
                                                boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
                                            }
                                        }
                                    }}
                                />

                                {showAnswer && (
                                    <Alert
                                        severity={userAnswer.toLowerCase().trim() ===
                                            (quizType === 'meaning'
                                                ? getCurrentQuestion().meaning.toLowerCase().trim()
                                                : getCurrentQuestion().word.toLowerCase().trim())
                                            ? 'success'
                                            : 'error'}
                                        sx={{
                                            mb: 2,
                                            borderRadius: 2,
                                            '& .MuiAlert-message': { fontWeight: 500 }
                                        }}
                                    >
                                        {userAnswer.toLowerCase().trim() ===
                                            (quizType === 'meaning'
                                                ? getCurrentQuestion().meaning.toLowerCase().trim()
                                                : getCurrentQuestion().word.toLowerCase().trim())
                                            ? '✓ Đúng rồi!'
                                            : `✗ Sai! Đáp án: ${quizType === 'meaning' ? getCurrentQuestion().word : getCurrentQuestion().meaning}`}
                                        <Box component="span" sx={{ display: 'block', mt: 1, opacity: 0.8, fontWeight: 400 }}>
                                            {getCurrentQuestion().partOfSpeech && <><strong>Loại từ:</strong> {getCurrentQuestion().partOfSpeech}</>}
                                        </Box>
                                    </Alert>
                                )}

                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                    {!showAnswer ? (
                                        <Button
                                            variant="contained"
                                            onClick={checkAnswer}
                                            disabled={!userAnswer.trim()}
                                            sx={{
                                                px: 4,
                                                py: 1.5,
                                                borderRadius: 2,
                                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                '&:disabled': {
                                                    background: 'linear-gradient(135deg, #d1d5db 0%, #e5e7eb 100%)'
                                                }
                                            }}
                                        >
                                            Kiểm tra
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="contained"
                                            onClick={nextQuestion}
                                            sx={{
                                                px: 4,
                                                py: 1.5,
                                                borderRadius: 2,
                                                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                                textTransform: 'none',
                                                fontWeight: 600
                                            }}
                                        >
                                            {currentQuestionIndex < quizQuestions.length - 1 ? <><ArrowForwardIcon sx={{ ml: 1 }} /> Câu tiếp theo</> : 'Hoàn thành'}
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        ) : (
                            // Quiz settings before starting
                            <Box sx={{ py: 2 }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        mb: 2.5,
                                        fontWeight: 700,
                                        color: '#1f2937',
                                        fontSize: '1.1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}
                                >
                                    <SettingsIcon sx={{ mr: 1 }} /> Cài đặt bài kiểm tra
                                </Typography>

                                <FormControl fullWidth sx={{ mb: 2.5 }}>
                                    <InputLabel sx={{ fontWeight: 500 }}>Lọc từ</InputLabel>
                                    <Select
                                        value={quizFilter}
                                        label="Lọc từ"
                                        onChange={(e) => setQuizFilter(e.target.value)}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2
                                            }
                                        }}
                                    >
                                        <MenuItem value="all"><MenuBookIcon sx={{ mr: 1, fontSize: 18 }} /> Tất cả từ</MenuItem>
                                        <MenuItem value="remembered"><CheckCircleIcon sx={{ mr: 1, fontSize: 18 }} /> Đã nhớ</MenuItem>
                                        <MenuItem value="unremembered"><AddIcon sx={{ mr: 1, fontSize: 18 }} /> Chưa nhớ</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth sx={{ mb: 2.5 }}>
                                    <InputLabel sx={{ fontWeight: 500 }}>Loại kiểm tra</InputLabel>
                                    <Select
                                        value={quizType}
                                        label="Loại kiểm tra"
                                        onChange={(e) => setQuizType(e.target.value)}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2
                                            }
                                        }}
                                    >
                                        <MenuItem value="meaning"><TextFieldsIcon sx={{ mr: 1, fontSize: 18 }} /> Nghĩa → Từ</MenuItem>
                                        <MenuItem value="word"><MenuBookIcon sx={{ mr: 1, fontSize: 18 }} /> Từ → Nghĩa</MenuItem>
                                        <MenuItem value="both"><ShuffleIcon sx={{ mr: 1, fontSize: 18 }} /> Cả hai</MenuItem>
                                    </Select>
                                </FormControl>

                                <Box sx={{ mb: 2.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography fontWeight={600} sx={{ color: '#374151', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <QuizIcon sx={{ mr: 1, fontSize: 18 }} /> Số câu hỏi
                                        </Typography>
                                        <Box sx={{
                                            px: 2,
                                            py: 0.5,
                                            borderRadius: 2,
                                            bgcolor: 'rgba(99, 102, 241, 0.1)',
                                            color: '#6366f1',
                                            fontWeight: 700,
                                            fontSize: '0.9rem'
                                        }}>
                                            {quizCount} câu
                                        </Box>
                                    </Box>
                                    <Slider
                                        value={quizCount}
                                        onChange={(_, v) => setQuizCount(v as number)}
                                        min={5}
                                        max={Math.min(50, vocabularies.length)}
                                        step={5}
                                        sx={{
                                            color: '#6366f1',
                                            '& .MuiSlider-thumb': {
                                                width: 22,
                                                height: 22
                                            }
                                        }}
                                    />
                                </Box>

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={skipRemembered}
                                            onChange={(e) => setSkipRemembered(e.target.checked)}
                                            sx={{
                                                '& .MuiSwitch-switchBase.Mui-checked': {
                                                    color: '#6366f1'
                                                },
                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                    backgroundColor: 'rgba(99, 102, 241, 0.5)'
                                                }
                                            }}
                                        />
                                    }
                                    label={
                                        <Typography fontWeight={500} sx={{ color: '#374151' }}>
                                            ✅ Bỏ qua từ đã nhớ
                                        </Typography>
                                    }
                                    sx={{ mb: 1.5 }}
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={showPhonetic}
                                            onChange={(e) => setShowPhonetic(e.target.checked)}
                                            sx={{
                                                '& .MuiSwitch-switchBase.Mui-checked': {
                                                    color: '#6366f1'
                                                },
                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                    backgroundColor: 'rgba(99, 102, 241, 0.5)'
                                                }
                                            }}
                                        />
                                    }
                                    label={
                                        <Typography fontWeight={500} sx={{ color: '#374151' }}>
                                            <TextFieldsIcon sx={{ mr: 1, fontSize: 18 }} /> Hiện phiên âm
                                        </Typography>
                                    }
                                    sx={{ mb: 1.5 }}
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={shuffleCards}
                                            onChange={(e) => setShuffleCards(e.target.checked)}
                                            sx={{
                                                '& .MuiSwitch-switchBase.Mui-checked': {
                                                    color: '#6366f1'
                                                },
                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                    backgroundColor: 'rgba(99, 102, 241, 0.5)'
                                                }
                                            }}
                                        />
                                    }
                                    label={
                                        <Typography fontWeight={500} sx={{ color: '#374151' }}>
                                            🔀 Xáo trộn thứ tự
                                        </Typography>
                                    }
                                />
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 1 }}>
                        {quizCompleted ? (
                            <>
                                {wrongAnswers.length > 0 && !practiceMode && (
                                    <Button
                                        onClick={startPracticeWrongAnswers}
                                        sx={{
                                            borderRadius: 2,
                                            px: 3,
                                            color: '#ef4444',
                                            fontWeight: 600,
                                            '&:hover': {
                                                bgcolor: 'rgba(239, 68, 68, 0.08)'
                                            }
                                        }}
                                    >
                                        🔄 Luyện tập câu sai ({wrongAnswers.length})
                                    </Button>
                                )}
                                <Button
                                    onClick={resetQuiz}
                                    sx={{
                                        borderRadius: 2,
                                        px: 4,
                                        py: 1,
                                        textTransform: 'none',
                                        fontWeight: 600
                                    }}
                                >
                                    {practiceMode ? 'Đóng' : 'Tiếp tục'}
                                </Button>
                            </>
                        ) : !quizStarted ? (
                            <>
                                <Button
                                    onClick={() => setOpenQuizDialog(false)}
                                    sx={{
                                        borderRadius: 2,
                                        px: 3,
                                        '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                                    }}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={startQuiz}
                                    sx={{
                                        borderRadius: 2,
                                        px: 4,
                                        background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        '&:hover': {
                                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                                        }
                                    }}
                                >
                                    🚀 Bắt đầu
                                </Button>
                            </>
                        ) : practiceMode && quizCompleted ? (
                            <Button
                                onClick={resetQuiz}
                                sx={{
                                    borderRadius: 2,
                                    px: 4,
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    textTransform: 'none',
                                    fontWeight: 600
                                }}
                            >
                                Hoàn thành
                            </Button>
                        ) : null}
                    </DialogActions>
                </Dialog>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={3000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        onClose={() => setSnackbar({ ...snackbar, open: false })}
                        severity={snackbar.severity}
                        variant="filled"
                        sx={{
                            width: '100%',
                            borderRadius: 3,
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            '&.MuiAlert-filledSuccess': {
                                bgcolor: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                color: 'white'
                            },
                            '&.MuiAlert-filledError': {
                                bgcolor: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                                color: 'white'
                            },
                            '&.MuiAlert-filledInfo': {
                                bgcolor: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                color: 'white'
                            },
                            '& .MuiAlert-icon': {
                                color: 'white'
                            }
                        }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </>
    );
}
