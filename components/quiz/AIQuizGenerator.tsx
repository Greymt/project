import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
    Box,
    Button,
    TextField,
    Tabs,
    Tab,
    Typography,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Chip,
    Slider,
    RadioGroup,
    FormControlLabel,
    Radio,
    Paper,
    IconButton,
    Collapse,
    Divider
} from '@mui/material';
import {
    AutoAwesome as SparkleIcon,
    Quiz as QuizIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    PlayArrow as PlayArrowIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

interface GeneratedQuestionPreview {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

interface Props {
    onGenerate: (questions: GeneratedQuestionPreview[]) => void;
}

const AIQuizGenerator: React.FC<Props> = ({ onGenerate }) => {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState(0);
    const [topic, setTopic] = useState('');
    const [text, setText] = useState('');
    const [count, setCount] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [previewQuestions, setPreviewQuestions] = useState<GeneratedQuestionPreview[]>([]);
    const [generatedQuizId, setGeneratedQuizId] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (previewQuestions.length > 0 && previewRef.current) {
            previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setShowPreview(true);
        }
    }, [previewQuestions]);

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        setPreviewQuestions([]);
        setGeneratedQuizId(null);

        try {
            const body = activeTab === 0
                ? { topic, count, userEmail: session?.user?.email }
                : { text, count, userEmail: session?.user?.email };

            const res = await fetch('/api/ai/generate-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (data.success) {
                setPreviewQuestions(data.data.questions);
                setGeneratedQuizId(data.data.quizId);
                onGenerate(data.data.questions);
            } else {
                setError(data.error || 'Lỗi tạo quiz');
            }
        } catch (err) {
            setError('Lỗi kết nối');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 900, mx: 'auto', position: 'relative' }}>
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
                        radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
                        radial-gradient(circle at 40% 60%, rgba(16, 185, 129, 0.03) 0%, transparent 40%)
                    `
                }}
            />

            {/* Header */}
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    mb: 3,
                    borderRadius: 3,
                    border: '1px solid rgba(0,0,0,0.06)',
                    bgcolor: 'white',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)'
                        }}
                    >
                        <QuizIcon sx={{ fontSize: 28, color: 'white' }} />
                    </Box>
                    <Box>
                        <Typography
                            variant="h4"
                            fontWeight={800}
                            sx={{
                                background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #6366f1 100%)',
                                backgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: '1.5rem'
                            }}
                        >
                            Tạo bài quiz với AI
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            AI sẽ tạo câu hỏi trắc nghiệm từ nội dung bạn cung cấp
                        </Typography>
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    sx={{
                        mb: 3,
                        '& .MuiTab-root': {
                            fontWeight: 600,
                            textTransform: 'none',
                            fontSize: '0.95rem'
                        }
                    }}
                >
                    <Tab
                        label="Từ chủ đề"
                        iconPosition="start"
                    />
                    <Tab
                        label="Từ văn bản"
                        iconPosition="start"
                    />
                </Tabs>

                {activeTab === 0 ? (
                    <TextField
                        fullWidth
                        label="Chủ đề học tập"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="VD: Lịch sử Việt Nam, Toán lớp 10, Tiếng Anh giao tiếp..."
                        multiline
                        rows={3}
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                            }
                        }}
                    />
                ) : (
                    <TextField
                        fullWidth
                        label="Dán văn bản"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        multiline
                        rows={6}
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                            }
                        }}
                        placeholder="Paste bài học, tài liệu..."
                    />
                )}

                {/* Question count slider */}
                <Box sx={{ mb: 3, p: 2.5, borderRadius: 2, bgcolor: 'rgba(99, 102, 241, 0.02)', border: '1px solid rgba(99, 102, 241, 0.08)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography fontWeight={600} sx={{ color: '#374151', fontSize: '0.95rem' }}>
                            Số câu hỏi cần tạo
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
                            {count} câu
                        </Box>
                    </Box>
                    <Slider
                        value={count}
                        onChange={(_, v) => setCount(v as number)}
                        min={5}
                        max={50}
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
                            { value: 25, label: '25' },
                            { value: 50, label: '50' }
                        ]}
                    />
                </Box>

                {/* AI info box */}
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
                            Tạo {count} câu hỏi trắc nghiệm với đáp án và giải thích chi tiết
                        </Typography>
                    </Box>
                </Box>

                <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleGenerate}
                    disabled={loading || (!topic.trim() && !text.trim())}
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
                            boxShadow: '0 8px 28px rgba(99, 102, 241, 0.4)'
                        }
                    }}
                >
                    {loading ? (
                        <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                        <>
                            <SparkleIcon sx={{ mr: 1, fontSize: 20 }} />
                            Tạo {count} câu hỏi với AI
                        </>
                    )}
                </Button>
            </Paper>

            {/* Preview Section */}
            {previewQuestions.length > 0 && (
                <Paper
                    ref={previewRef}
                    elevation={0}
                    sx={{
                        p: 4,
                        mb: 3,
                        borderRadius: 3,
                        border: '1px solid rgba(0,0,0,0.06)',
                        bgcolor: 'white',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            mb: 2
                        }}
                        onClick={() => setShowPreview(!showPreview)}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <SparkleIcon sx={{ color: '#6366f1', fontSize: 24 }} />
                            <Typography variant="h5" fontWeight={700}>
                                Xem trước câu hỏi
                            </Typography>
                            <Chip
                                label={`${previewQuestions.length} câu`}
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(99, 102, 241, 0.1)',
                                    color: '#6366f1',
                                    fontWeight: 700
                                }}
                            />
                        </Box>
                        <IconButton>
                            {showPreview ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>

                    <Collapse in={showPreview}>
                        <Divider sx={{ mb: 2 }} />
                        {previewQuestions.map((q, i) => (
                            <Card
                                key={i}
                                sx={{
                                    mb: 2,
                                    borderRadius: 2,
                                    border: '1px solid rgba(0,0,0,0.06)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: 'rgba(99, 102, 241, 0.3)',
                                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.1)'
                                    }
                                }}
                            >
                                <CardContent sx={{ p: 2.5 }}>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                                        <Chip
                                            label={i + 1}
                                            size="small"
                                            sx={{
                                                mr: 1.5,
                                                bgcolor: 'rgba(99, 102, 241, 0.1)',
                                                color: '#6366f1',
                                                fontWeight: 700
                                            }}
                                        />
                                        {q.question}
                                    </Typography>
                                    <RadioGroup>
                                        {q?.options?.map((opt, j) => (
                                            <FormControlLabel
                                                key={j}
                                                value={j}
                                                control={<Radio sx={{ color: '#6366f1' }} />}
                                                label={String.fromCharCode(65 + j) + '. ' + opt}
                                                sx={{
                                                    mb: 0.5,
                                                    '&:hover': {
                                                        bgcolor: 'rgba(99, 102, 241, 0.05)',
                                                        borderRadius: 1
                                                    }
                                                }}
                                            />
                                        ))}
                                    </RadioGroup>
                                    <Box
                                        sx={{
                                            mt: 2,
                                            p: 2,
                                            borderRadius: 2,
                                            bgcolor: 'rgba(16, 185, 129, 0.05)',
                                            border: '1px solid rgba(16, 185, 129, 0.15)'
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <CheckCircleIcon sx={{ color: '#10b981', fontSize: 18 }} />
                                            <Typography variant="body2" fontWeight={700} sx={{ color: '#10b981' }}>
                                                Đáp án: {String.fromCharCode(65 + q.correctAnswer)}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {q.explanation}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Collapse>

                    {generatedQuizId && (
                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Link href={`/quizzes/${generatedQuizId}`} passHref>
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<PlayArrowIcon />}
                                    sx={{
                                        background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                        boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
                                        fontWeight: 700,
                                        px: 4,
                                        py: 1.5,
                                        '&:hover': {
                                            boxShadow: '0 8px 28px rgba(16, 185, 129, 0.4)'
                                        }
                                    }}
                                >
                                    Làm bài ngay
                                </Button>
                            </Link>
                        </Box>
                    )}
                </Paper>
            )}
        </Box>
    );
};

export default AIQuizGenerator;