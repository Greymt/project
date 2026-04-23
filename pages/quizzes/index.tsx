'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
    Container, Typography, Box, Paper, Card, CardContent, Button,
    CircularProgress, Grid, Chip, Divider, Tooltip, Alert, LinearProgress
} from '@mui/material';
import Link from 'next/link';
import {
    PlayArrow as PlayArrowIcon,
    CheckCircle as CheckCircleIcon,
    TrendingUp as TrendingUpIcon,
    EmojiEvents as TrophyIcon,
    Refresh as RefreshIcon,
    MenuBook as MenuBookIcon,
    LocalOffer as LocalOfferIcon,
    Login as LoginIcon
} from '@mui/icons-material';
import type { Quiz, QuizResult } from '@/types';
import Header from '@/components/Header';

interface QuizWithResult extends Quiz {
    completed?: boolean;
    bestScore?: number;
    lastAttempt?: string;
    attemptsCount?: number;
    result?: QuizResult;
}

interface QuizWithResult extends Quiz {
    completed?: boolean;
    bestScore?: number;
    lastAttempt?: string;
    attemptsCount?: number;
}

export default function QuizzesPage() {
    const { data: session, status } = useSession();
    const [quizzes, setQuizzes] = useState<QuizWithResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (status === 'authenticated') {
            fetchQuizzes();
        }
    }, [status]);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            // Fetch both quizzes and results in parallel
            const [quizzesRes, progressRes] = await Promise.all([
                fetch('/api/quizzes'),
                fetch('/api/user/progress')
            ]);

            const quizzesData = await quizzesRes.json();
            const progressData = await progressRes.json();

            if (quizzesData.success) {
                let quizzesList = quizzesData.data?.quizzes || [];

                // Enrich quizzes with result info if available
                if (progressData.success && progressData.data?.recentResults) {
                    const recentResults = progressData.data.recentResults;

                    quizzesList = quizzesList.map((quiz: Quiz) => {
                        const result = recentResults.find((r: any) => r.quizId === quiz.id);
                        if (result) {
                            return {
                                ...quiz,
                                completed: true,
                                bestScore: result.score,
                                lastAttempt: result.completedAt,
                                result
                            };
                        }
                        return quiz;
                    }) as QuizWithResult[];
                }

                setQuizzes(quizzesList);
            } else {
                setError(quizzesData.error || 'Failed to fetch quizzes');
            }
        } catch (err) {
            console.error('Error fetching quizzes:', err);
            setError('Failed to load quizzes');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Container>
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
                        Bạn cần đăng nhập để xem danh sách bài quiz
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
                             radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.04) 0%, transparent 50%)
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
                        Bài học
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                        Danh sách tất cả bài kiểm tra • {quizzes.length} đề tài
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                        {error}
                    </Alert>
                )}

                {quizzes.length === 0 ? (
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 4, sm: 6 },
                            textAlign: 'center',
                            borderRadius: 4,
                            border: '1px solid rgba(0,0,0,0.06)',
                            bgcolor: 'white',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
                        }}
                    >
                        <Typography variant="h5" fontWeight={700} sx={{ color: '#6366f1', mb: 2 }}>
                            Chưa có bài học nào
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
                            Hãy tạo quiz AI đầu tiên để bắt đầu hành trình học tập!
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            href="/dashboard"
                            sx={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 4,
                                '&:hover': {
                                    boxShadow: '0 6px 20px rgba(99, 102, 241, 0.35)'
                                }
                            }}
                        >
                            Tạo Quiz AI
                        </Button>
                    </Paper>
                ) : (
                    <Grid container spacing={3}>
                        {quizzes.map((quiz) => {
                            const isCompleted = !!quiz.completed;
                            const score = quiz.bestScore || 0;
                            const scoreColor = score >= 70 ? '#059669' : score >= 50 ? '#d97706' : '#dc2626';

                            return (
                                <Grid item xs={12} sm={6} md={4} key={quiz.id}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            borderRadius: 3,
                                            border: isCompleted ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(0,0,0,0.06)',
                                            transition: 'all 0.3s ease',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            '&:hover': {
                                                transform: 'translateY(-6px)',
                                                boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
                                                borderColor: isCompleted ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.3)'
                                            },
                                        }}
                                    >
                                        <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                            {/* Header with icon and status */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                <Box
                                                    sx={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        bgcolor: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                                        fontSize: '1.5rem'
                                                    }}
                                                >
                                                    {isCompleted ? <CheckCircleIcon sx={{ color: '#10b981' }} /> : <MenuBookIcon sx={{ color: '#6366f1' }} />}
                                                </Box>
                                                {isCompleted && (
                                                    <Chip
                                                        label={`${score}%`}
                                                        size="small"
                                                        sx={{
                                                            background: `linear-gradient(135deg, ${scoreColor}, ${scoreColor}dd)`,
                                                            color: 'white',
                                                            fontWeight: 800,
                                                            fontSize: '0.85rem',
                                                            height: 28,
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            {/* Title and topic */}
                                            <Typography
                                                variant="h6"
                                                fontWeight={800}
                                                sx={{
                                                    color: '#111827',
                                                    fontSize: '1.1rem',
                                                    lineHeight: 1.3,
                                                    mb: 1,
                                                    flex: 1
                                                }}
                                            >
                                                {quiz.title}
                                            </Typography>

                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                                <Chip
                                                    label={`📝 ${quiz.count || quiz.questions?.length || 0} câu`}
                                                    size="small"
                                                    sx={{
                                                        height: 22,
                                                        fontSize: '0.7rem',
                                                        bgcolor: 'rgba(99, 102, 241, 0.08)',
                                                        color: '#6366f1',
                                                        fontWeight: 600
                                                    }}
                                                />
                                                {quiz.topic && (
                                                    <Chip
                                                        icon={<LocalOfferIcon sx={{ fontSize: 14 }} />}
                                                        label={quiz.topic}
                                                        size="small"
                                                        sx={{
                                                            height: 22,
                                                            fontSize: '0.7rem',
                                                            bgcolor: 'rgba(245, 158, 11, 0.1)',
                                                            color: '#f59e0b',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            {/* Result info if completed */}
                                            {isCompleted && quiz.lastAttempt && (
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        gap: '4px',
                                                        mb: 2,
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        bgcolor: 'rgba(16, 185, 129, 0.04)',
                                                        border: '1px solid rgba(16, 185, 129, 0.1)'
                                                    }}
                                                >
                                                    <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>
                                                        ✓ Đã làm:
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(quiz.lastAttempt).toLocaleDateString('vi-VN')}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {/* Action buttons */}
                                            <Box sx={{ mt: 'auto' }}>
                                                <Link href={`/quizzes/${quiz.id}`} passHref style={{ textDecoration: 'none' }}>
                                                    <Button
                                                        variant="contained"
                                                        fullWidth
                                                        startIcon={isCompleted ? <RefreshIcon /> : <PlayArrowIcon />}
                                                        sx={{
                                                            borderRadius: 2,
                                                            textTransform: 'none',
                                                            fontWeight: 600,
                                                            background: isCompleted
                                                                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                                                : 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                                            '&:hover': {
                                                                boxShadow: isCompleted
                                                                    ? '0 4px 12px rgba(99, 102, 241, 0.3)'
                                                                    : '0 4px 12px rgba(16, 185, 129, 0.3)'
                                                            }
                                                        }}
                                                    >
                                                        {isCompleted ? 'Làm lại' : 'Làm bài'}
                                                    </Button>
                                                </Link>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </Container>
        </>
    );
}
