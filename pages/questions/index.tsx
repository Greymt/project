'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import {
    Container, Typography, Box, Card, CardContent, Button, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, Grid,
    IconButton, Chip, Alert, Snackbar, Checkbox, FormControlLabel,
    Tabs, Tab, Select, MenuItem, FormControl, InputLabel, Paper,
    TablePagination, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TableFooter
} from '@mui/material';
import Link from 'next/link';
import {
    Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon,
    FilterList as FilterListIcon, Clear as ClearIcon,
    PlayArrow as PlayArrowIcon, CheckCircle as CheckCircleIcon,
    MenuBook as MenuBookIcon, LocalOffer as LocalOfferIcon,
    Login as LoginIcon, Folder as FolderIcon, Article as ArticleIcon
} from '@mui/icons-material';
import Header from '@/components/Header';

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
    topic?: string;
    userEmail?: string;
}

interface Quiz {
    id: string;
    title: string;
    topic: string;
    count: number;
    createdAt: string;
}

export default function QuestionBank() {
    const { data: session, status } = useSession();
    const [activeTab, setActiveTab] = useState(0);
    const [aiQuestions, setAiQuestions] = useState<Question[]>([]);
    const [manualQuestions, setManualQuestions] = useState<Question[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
    const [openCreateQuiz, setOpenCreateQuiz] = useState(false);
    const [quizTitle, setQuizTitle] = useState('');
    const [quizTopic, setQuizTopic] = useState('');
    const [quizCount, setQuizCount] = useState(10);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [quizPage, setQuizPage] = useState(0);
    const [quizRowsPerPage, setQuizRowsPerPage] = useState(10);

    // Topic filter state
    const [selectedTopic, setSelectedTopic] = useState('all');
    const [topics, setTopics] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        question: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: 'A',
        explanation: ''
    });

    useEffect(() => {
        if (status === 'unauthenticated') {
            window.location.href = '/';
        } else if (status === 'authenticated') {
            fetchData();
        }
    }, [status]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch all questions from main API
            const [questionsRes, quizzesRes] = await Promise.all([
                fetch('/api/questions'),
                fetch('/api/quizzes')
            ]);

            const questionsData = await questionsRes.json();
            const quizzesData = await quizzesRes.json();

            if (questionsData.success) {
                const allQuestions = questionsData.data.questions;

                // Separate AI questions from manual questions
                const aiQ = allQuestions.filter((q: Question) => q.aiGenerated);
                const manualQ = allQuestions.filter((q: Question) => !q.aiGenerated);

                setAiQuestions(aiQ);
                setManualQuestions(manualQ);

                // Extract unique topics from AI questions
                const uniqueTopics = Array.from(
                    new Set(aiQ.map((q: Question) => q.quizTopic || q.topic).filter(Boolean))
                ).sort() as string[];
                setTopics(uniqueTopics);
            }

            // Get quizzes from API
            if (quizzesData.success) {
                setQuizzes(quizzesData.data.quizzes);
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (question?: Question) => {
        if (question) {
            setEditingQuestion(question);
            setFormData({
                question: question.question,
                optionA: question.optionA,
                optionB: question.optionB,
                optionC: question.optionC,
                optionD: question.optionD,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation || ''
            });
        } else {
            setEditingQuestion(null);
            setFormData({
                question: '',
                optionA: '',
                optionB: '',
                optionC: '',
                optionD: '',
                correctAnswer: 'A',
                explanation: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingQuestion(null);
    };

    const handleSave = async () => {
        try {
            const url = editingQuestion ? '/api/questions' : '/api/questions';
            const method = editingQuestion ? 'PUT' : 'POST';

            const body: any = {
                ...formData,
                userEmail: session?.user?.email
            };

            if (editingQuestion) {
                body.id = editingQuestion.id;
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
                    message: editingQuestion ? 'Cập nhật câu hỏi thành công' : 'Thêm câu hỏi thành công',
                    severity: 'success'
                });
                handleCloseDialog();
                fetchData();
            } else {
                setSnackbar({ open: true, message: data.error || 'Lỗi', severity: 'error' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Lỗi khi lưu', severity: 'error' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;

        try {
            const res = await fetch(`/api/questions?id=${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                setSnackbar({ open: true, message: 'Xóa thành công', severity: 'success' });
                fetchData();
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Lỗi khi xóa', severity: 'error' });
        }
    };

    const handleDeleteQuiz = async (quizId: string) => {
        if (!confirm('Bạn có chắc muốn xóa bài học này? Các câu hỏi trong bài học sẽ được giữ lại.')) return;

        try {
            const res = await fetch(`/api/quizzes?id=${quizId}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                setSnackbar({ open: true, message: 'Xóa bài học thành công, câu hỏi được giữ lại', severity: 'success' });
                fetchData();
            } else {
                setSnackbar({ open: true, message: data.error || 'Lỗi khi xóa', severity: 'error' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Lỗi khi xóa bài học', severity: 'error' });
        }
    };

    // Get filtered questions based on selected topic
    const getFilteredQuestions = () => {
        if (selectedTopic === 'all') return aiQuestions;
        return aiQuestions.filter(q => q.quizTopic === selectedTopic || q.topic === selectedTopic);
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
            const selectedAIQ = aiQuestions.filter(q => selectedQuestions.includes(q.id));
            const selectedManualQ = manualQuestions.filter(q => selectedQuestions.includes(q.id));
            const selectedQ = [...selectedAIQ, ...selectedManualQ];

            if (selectedQ.length === 0) {
                setSnackbar({ open: true, message: 'Không tìm thấy câu hỏi đã chọn', severity: 'error' });
                return;
            }

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

    const currentQuestions = activeTab === 0 ? aiQuestions : manualQuestions;

    if (status === 'loading' || loading) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography>Đang tải...</Typography>
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
                        Bạn cần đăng nhập để quản lý câu hỏi
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
                <title>Ngân hàng câu hỏi - AI Quiz</title>
            </Head>

            <Header />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
                    Ngân hàng câu hỏi
                </Typography>

                <Tabs value={activeTab} onChange={(_, v) => {
                    setActiveTab(v);
                    setPage(0);
                    setQuizPage(0);
                }} sx={{ mb: 3 }}>
                    <Tab label={`Câu hỏi AI (${aiQuestions.length})`} />
                    <Tab label={`Câu hỏi thủ công (${manualQuestions.length})`} />
                    <Tab label={`Bài học (${quizzes.length})`} icon={<FolderIcon />} iconPosition="start" />
                </Tabs>

                {/* Tab 0: AI Questions */}
                {activeTab === 0 && (
                    <>
                        {/* Enhanced Header with Topic Filter */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                mb: 3,
                                borderRadius: 3,
                                border: '1px solid rgba(0,0,0,0.06)',
                                bgcolor: 'white',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box>
                                    <Typography variant="h6" fontWeight={700} sx={{ color: '#111827', mb: 0.5 }}>
                                        Ngân hàng câu hỏi AI
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Chọn câu hỏi từ ngân hàng để tạo đề tự do
                                    </Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    onClick={() => setOpenCreateQuiz(true)}
                                    disabled={selectedQuestions.length === 0}
                                    sx={{
                                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        px: 3,
                                        '&:hover': {
                                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                                        }
                                    }}
                                >
                                    Tạo đề ({selectedQuestions.length})
                                </Button>
                            </Box>

                            {/* Topic Filter */}
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FilterListIcon sx={{ color: '#6366f1' }} />
                                    <Typography fontWeight={600} sx={{ color: '#374151' }}>
                                        Lọc theo chủ đề:
                                    </Typography>
                                </Box>
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <Select
                                        value={selectedTopic}
                                        onChange={(e) => setSelectedTopic(e.target.value)}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                bgcolor: 'rgba(99, 102, 241, 0.02)'
                                            }
                                        }}
                                    >
                                        <MenuItem value="all"><MenuBookIcon sx={{ mr: 1, fontSize: 18 }} /> Tất cả chủ đề</MenuItem>
                                        {topics.map((topic) => (
                                            <MenuItem key={topic} value={topic}>
                                                {topic}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                {selectedTopic !== 'all' && (
                                    <Chip
                                        label={`Đang lọc: ${selectedTopic}`}
                                        onDelete={() => setSelectedTopic('all')}
                                        color="primary"
                                        variant="outlined"
                                        sx={{ fontWeight: 600 }}
                                    />
                                )}
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                                    Hiển thị {getFilteredQuestions().length} / {aiQuestions.length} câu
                                </Typography>
                            </Box>
                        </Paper>

                        {aiQuestions.length === 0 ? (
                            <Alert severity="info">
                                Chưa có câu hỏi AI nào. Hãy tạo bài học từ AI trong dashboard!
                            </Alert>
                        ) : (
                            <>
                                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={getFilteredQuestions().length > 0 && selectedQuestions.length === getFilteredQuestions().length}
                                                    onChange={() => {
                                                        const filtered = getFilteredQuestions();
                                                        if (selectedQuestions.length === filtered.length) {
                                                            // Remove all filtered questions from selection
                                                            const newSelection = selectedQuestions.filter(id =>
                                                                !filtered.some(q => q.id === id)
                                                            );
                                                            setSelectedQuestions(newSelection);
                                                        } else {
                                                            // Add all filtered questions to selection
                                                            const newSelection = new Set([...selectedQuestions, ...filtered.map(q => q.id)]);
                                                            setSelectedQuestions(Array.from(newSelection));
                                                        }
                                                    }}
                                                />
                                            }
                                            label="Chọn tất cả"
                                        />
                                        <Typography variant="body2" color="text.secondary">
                                            ({selectedQuestions.length}/{aiQuestions.length} câu được chọn)
                                        </Typography>
                                    </Box>
                                    {selectedQuestions.length > 0 && (
                                        <Chip
                                            label={`Đã chọn ${selectedQuestions.length} câu`}
                                            onDelete={() => setSelectedQuestions([])}
                                            color="primary"
                                            sx={{ fontWeight: 600 }}
                                        />
                                    )}
                                </Box>

                                <Grid container spacing={2}>
                                    {getFilteredQuestions().slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((q, index) => (
                                        <Grid item xs={12} key={q.id}>
                                            <Card
                                                sx={{
                                                    border: selectedQuestions.includes(q.id) ? '2px solid #1976d2' : '1px solid rgba(0,0,0,0.06)',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                                        borderColor: selectedQuestions.includes(q.id) ? '#1976d2' : 'rgba(99, 102, 241, 0.3)'
                                                    }
                                                }}
                                            >
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <Box sx={{ flex: 1, mr: 2 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                                <Checkbox
                                                                    checked={selectedQuestions.includes(q.id)}
                                                                    onChange={() => {
                                                                        setSelectedQuestions(prev =>
                                                                            prev.includes(q.id)
                                                                                ? prev.filter(id => id !== q.id)
                                                                                : [...prev, q.id]
                                                                        );
                                                                    }}
                                                                    sx={{ p: 0, mr: 1 }}
                                                                />
                                                                <Typography
                                                                    variant="subtitle1"
                                                                    fontWeight={700}
                                                                    sx={{
                                                                        color: '#111827',
                                                                        fontSize: '1rem',
                                                                        lineHeight: 1.4
                                                                    }}
                                                                >
                                                                    Câu {index + 1}: {q.question}
                                                                </Typography>
                                                            </Box>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: '#6366f1',
                                                                    fontWeight: 500,
                                                                    fontSize: '0.85rem',
                                                                    ml: 4
                                                                }}
                                                            >
                                                                {q.quizTopic ? <><LocalOfferIcon sx={{ fontSize: 14, mr: 0.5 }} />{q.quizTopic}</> : <><MenuBookIcon sx={{ fontSize: 14, mr: 0.5 }} />{q.quizTitle || 'AI Quiz'}</>}
                                                            </Typography>
                                                        </Box>
                                                        <Box>
                                                            <IconButton size="small" onClick={() => handleOpenDialog(q)}>
                                                                <EditIcon />
                                                            </IconButton>
                                                            <IconButton size="small" color="error" onClick={() => handleDelete(q.id)}>
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>

                                                    <Grid container spacing={1} sx={{ mt: 1.5 }}>
                                                        {['A', 'B', 'C', 'D'].map((opt) => {
                                                            const optionKey = `option${opt}` as keyof Question;
                                                            const isCorrect = q.correctAnswer === opt;
                                                            return (
                                                                <Grid item xs={6} key={opt}>
                                                                    <Chip
                                                                        label={`${opt}. ${q[optionKey]}`}
                                                                        color={isCorrect ? 'success' : 'default'}
                                                                        variant={isCorrect ? 'filled' : 'outlined'}
                                                                        size="small"
                                                                        sx={{
                                                                            fontWeight: 600,
                                                                            fontSize: '0.8rem',
                                                                            '&.MuiChip-filled': {
                                                                                bgcolor: '#10b981',
                                                                                color: 'white'
                                                                            }
                                                                        }}
                                                                    />
                                                                </Grid>
                                                            );
                                                        })}
                                                    </Grid>

                                                    {q.explanation && (
                                                        <Box
                                                            sx={{
                                                                mt: 1.5,
                                                                p: 1.5,
                                                                borderRadius: 2,
                                                                bgcolor: 'rgba(99, 102, 241, 0.03)',
                                                                borderLeft: '3px solid #6366f1'
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: '#4b5563',
                                                                    fontSize: '0.85rem',
                                                                    fontStyle: 'italic',
                                                                    lineHeight: 1.5
                                                                }}
                                                            >
                                                                {q.explanation}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>

                                <TablePagination
                                    component="div"
                                    count={getFilteredQuestions().length}
                                    page={page}
                                    onPageChange={(_, newPage) => setPage(newPage)}
                                    rowsPerPage={rowsPerPage}
                                    onRowsPerPageChange={(e) => {
                                        setRowsPerPage(parseInt(e.target.value, 10));
                                        setPage(0);
                                    }}
                                    rowsPerPageOptions={[5, 10, 25, 50]}
                                    labelRowsPerPage="Câu hỏi mỗi trang:"
                                />
                            </>
                        )}
                    </>
                )}

                {/* Tab 1: Manual Questions */}
                {activeTab === 1 && (
                    <>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                mb: 3,
                                borderRadius: 3,
                                border: '1px solid rgba(0,0,0,0.06)',
                                bgcolor: 'white',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <Box>
                                <Typography variant="h6" fontWeight={700} sx={{ color: '#111827', mb: 0.5 }}>
                                    Câu hỏi thủ công
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Thêm câu hỏi thủ công để tạo ngân hàng câu hỏi riêng
                                </Typography>
                            </Box>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpenDialog()}
                                sx={{
                                    background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    '&:hover': {
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                    }
                                }}
                            >
                                Thêm câu hỏi
                            </Button>
                        </Paper>

                        {manualQuestions.length === 0 ? (
                            <Box
                                sx={{
                                    textAlign: 'center',
                                    py: 6,
                                    px: 2,
                                    bgcolor: 'rgba(99, 102, 241, 0.02)',
                                    borderRadius: 3,
                                    border: '2px dashed rgba(99, 102, 241, 0.15)'
                                }}
                            >
                                <Typography variant="body1" fontWeight={600} sx={{ color: '#6366f1', mb: 1 }}>
                                    Chưa có câu hỏi thủ công nào
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Bắt đầu xây dựng ngân hàng câu hỏi của bạn!
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => handleOpenDialog()}
                                    sx={{
                                        background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                        textTransform: 'none',
                                        fontWeight: 600
                                    }}
                                >
                                    Thêm câu hỏi đầu tiên
                                </Button>
                            </Box>
                        ) : (
                            <>
                                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={manualQuestions.length > 0 && selectedQuestions.length === manualQuestions.filter(q =>
                                                        manualQuestions.slice(page * rowsPerPage, (page + 1) * rowsPerPage).some(mq => mq.id === q.id)
                                                    ).length}
                                                    onChange={() => {
                                                        const currentPageQuestions = manualQuestions.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
                                                        const allSelected = currentPageQuestions.every(q => selectedQuestions.includes(q.id));
                                                        if (allSelected) {
                                                            const newSelection = selectedQuestions.filter(id =>
                                                                !currentPageQuestions.some(q => q.id === id)
                                                            );
                                                            setSelectedQuestions(newSelection);
                                                        } else {
                                                            const newSelection = new Set([...selectedQuestions, ...currentPageQuestions.map(q => q.id)]);
                                                            setSelectedQuestions(Array.from(newSelection));
                                                        }
                                                    }}
                                                />
                                            }
                                            label="Chọn trang"
                                        />
                                        <Typography variant="body2" color="text.secondary">
                                            ({selectedQuestions.length}/{manualQuestions.length} câu được chọn)
                                        </Typography>
                                    </Box>
                                    {selectedQuestions.length > 0 && (
                                        <Chip
                                            label={`Đã chọn ${selectedQuestions.length} câu`}
                                            onDelete={() => setSelectedQuestions([])}
                                            color="primary"
                                            sx={{ fontWeight: 600 }}
                                        />
                                    )}
                                </Box>

                                <Grid container spacing={2}>
                                    {manualQuestions.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((q, index) => (
                                        <Grid item xs={12} key={q.id}>
                                            <Card
                                                sx={{
                                                    border: selectedQuestions.includes(q.id) ? '2px solid #1976d2' : '1px solid rgba(0,0,0,0.06)',
                                                    borderRadius: 2.5,
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                                    }
                                                }}
                                            >
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <Box sx={{ flex: 1, mr: 2 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                                <Checkbox
                                                                    checked={selectedQuestions.includes(q.id)}
                                                                    onChange={() => {
                                                                        setSelectedQuestions(prev =>
                                                                            prev.includes(q.id)
                                                                                ? prev.filter(id => id !== q.id)
                                                                                : [...prev, q.id]
                                                                        );
                                                                    }}
                                                                    sx={{ p: 0, mr: 1 }}
                                                                />
                                                                <Typography
                                                                    variant="subtitle1"
                                                                    fontWeight={700}
                                                                    sx={{
                                                                        color: '#111827',
                                                                        fontSize: '1rem',
                                                                        lineHeight: 1.4
                                                                    }}
                                                                >
                                                                    Câu {index + 1}: {q.question}
                                                                </Typography>
                                                            </Box>
                                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', ml: 4 }}>
                                                                Thủ công • Tạo lúc: {new Date(q.createdAt).toLocaleDateString('vi-VN')}
                                                            </Typography>
                                                        </Box>
                                                        <Box>
                                                            <IconButton size="small" onClick={() => handleOpenDialog(q)}>
                                                                <EditIcon />
                                                            </IconButton>
                                                            <IconButton size="small" color="error" onClick={() => handleDelete(q.id)}>
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Box>
                                                    </Box>

                                                    <Grid container spacing={1} sx={{ mt: 1.5 }}>
                                                        {['A', 'B', 'C', 'D'].map((opt) => {
                                                            const optionKey = `option${opt}` as keyof Question;
                                                            const isCorrect = q.correctAnswer === opt;
                                                            return (
                                                                <Grid item xs={6} key={opt}>
                                                                    <Chip
                                                                        label={`${opt}. ${q[optionKey]}`}
                                                                        color={isCorrect ? 'success' : 'default'}
                                                                        variant={isCorrect ? 'filled' : 'outlined'}
                                                                        size="small"
                                                                        sx={{
                                                                            fontWeight: 600,
                                                                            fontSize: '0.8rem',
                                                                            '&.MuiChip-filled': {
                                                                                bgcolor: '#10b981',
                                                                                color: 'white'
                                                                            }
                                                                        }}
                                                                    />
                                                                </Grid>
                                                            );
                                                        })}
                                                    </Grid>

                                                    {q.explanation && (
                                                        <Box
                                                            sx={{
                                                                mt: 1.5,
                                                                p: 1.5,
                                                                borderRadius: 2,
                                                                bgcolor: 'rgba(99, 102, 241, 0.03)',
                                                                borderLeft: '3px solid #6366f1'
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: '#4b5563',
                                                                    fontSize: '0.85rem',
                                                                    fontStyle: 'italic',
                                                                    lineHeight: 1.5
                                                                }}
                                                            >
                                                                💡 {q.explanation}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>

                                <TablePagination
                                    component="div"
                                    count={manualQuestions.length}
                                    page={page}
                                    onPageChange={(_, newPage) => setPage(newPage)}
                                    rowsPerPage={rowsPerPage}
                                    onRowsPerPageChange={(e) => {
                                        setRowsPerPage(parseInt(e.target.value, 10));
                                        setPage(0);
                                    }}
                                    rowsPerPageOptions={[5, 10, 25, 50]}
                                    labelRowsPerPage="Câu hỏi mỗi trang:"
                                />
                            </>
                        )}
                    </>
                )}

                {/* Tab 2: Bài học */}
                {activeTab === 2 && (
                    <>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                mb: 3,
                                borderRadius: 3,
                                border: '1px solid rgba(0,0,0,0.06)',
                                bgcolor: 'white',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
                            }}
                        >
                            <Box>
                                <Typography variant="h6" fontWeight={700} sx={{ color: '#111827', mb: 0.5 }}>
                                    Quản lý bài học
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Xóa bài học sẽ giữ lại các câu hỏi trong ngân hàng câu hỏi
                                </Typography>
                            </Box>
                        </Paper>

                        {quizzes.length === 0 ? (
                            <Box
                                sx={{
                                    textAlign: 'center',
                                    py: 6,
                                    px: 2,
                                    bgcolor: 'rgba(99, 102, 241, 0.02)',
                                    borderRadius: 3,
                                    border: '2px dashed rgba(99, 102, 241, 0.15)'
                                }}
                            >
                                <FolderIcon sx={{ fontSize: 48, color: '#6366f1', mb: 2 }} />
                                <Typography variant="body1" fontWeight={600} sx={{ color: '#6366f1', mb: 1 }}>
                                    Chưa có bài học nào
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Tạo bài học từ AI để bắt đầu!
                                </Typography>
                                <Link href="/dashboard" passHref>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        sx={{
                                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                            textTransform: 'none',
                                            fontWeight: 600
                                        }}
                                    >
                                        Tạo bài học với AI
                                    </Button>
                                </Link>
                            </Box>
                        ) : (
                            <>
                                <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }}>
                                    <Table>
                                        <TableHead sx={{ bgcolor: 'rgba(99, 102, 241, 0.05)' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700 }}>STT</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Tên bài học</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Chủ đề</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Số câu hỏi</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Ngày tạo</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }} align="center">Hành động</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {quizzes
                                                .slice(quizPage * quizRowsPerPage, (quizPage + 1) * quizRowsPerPage)
                                                .map((quiz, index) => (
                                                    <TableRow key={quiz.id} hover>
                                                        <TableCell>{quizPage * quizRowsPerPage + index + 1}</TableCell>
                                                        <TableCell>
                                                            <Typography fontWeight={600}>{quiz.title}</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={quiz.topic || 'Không có'}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: 'rgba(99, 102, 241, 0.1)',
                                                                    color: '#6366f1',
                                                                    fontWeight: 600
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={`${quiz.count} câu`}
                                                                size="small"
                                                                color="primary"
                                                                variant="outlined"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            {new Date(quiz.createdAt).toLocaleDateString('vi-VN')}
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <IconButton
                                                                color="error"
                                                                onClick={() => handleDeleteQuiz(quiz.id)}
                                                                title="Xóa bài học (giữ câu hỏi)"
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <TablePagination
                                    component="div"
                                    count={quizzes.length}
                                    page={quizPage}
                                    onPageChange={(_, newPage) => setQuizPage(newPage)}
                                    rowsPerPage={quizRowsPerPage}
                                    onRowsPerPageChange={(e) => {
                                        setQuizRowsPerPage(parseInt(e.target.value, 10));
                                        setQuizPage(0);
                                    }}
                                    rowsPerPageOptions={[5, 10, 25, 50]}
                                    labelRowsPerPage="Bài học mỗi trang:"
                                />
                            </>
                        )}
                    </>
                )}

                {/* Dialog thêm/sửa câu hỏi */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        {editingQuestion ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Câu hỏi"
                                fullWidth
                                multiline
                                rows={2}
                                value={formData.question}
                                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                            />
                            <TextField
                                label="Đáp án A"
                                fullWidth
                                value={formData.optionA}
                                onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                            />
                            <TextField
                                label="Đáp án B"
                                fullWidth
                                value={formData.optionB}
                                onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                            />
                            <TextField
                                label="Đáp án C"
                                fullWidth
                                value={formData.optionC}
                                onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                            />
                            <TextField
                                label="Đáp án D"
                                fullWidth
                                value={formData.optionD}
                                onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                            />
                            <FormControl fullWidth>
                                <InputLabel>Đáp án đúng</InputLabel>
                                <Select
                                    value={formData.correctAnswer}
                                    label="Đáp án đúng"
                                    onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                                >
                                    <MenuItem value="A">A</MenuItem>
                                    <MenuItem value="B">B</MenuItem>
                                    <MenuItem value="C">C</MenuItem>
                                    <MenuItem value="D">D</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                label="Giải thích (tùy chọn)"
                                fullWidth
                                multiline
                                rows={2}
                                value={formData.explanation}
                                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Hủy</Button>
                        <Button variant="contained" onClick={handleSave}>
                            Lưu
                        </Button>
                    </DialogActions>
                </Dialog>

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