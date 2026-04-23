import { useState } from 'react';
import { useRouter } from 'next/router';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    Link as MuiLink,
    InputAdornment,
    IconButton,
    Grid
} from '@mui/material';
import {
    Email as EmailIcon,
    Lock as LockIcon,
    Person as PersonIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    School as SchoolIcon,
    ArrowBack as ArrowBackIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import Head from 'next/head';

const RegisterPage = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                const loginRes = await signIn('credentials', {
                    redirect: false,
                    email: formData.email,
                    password: formData.password,
                });

                if (loginRes?.ok) {
                    router.push('/dashboard');
                } else {
                    setError('Đăng ký thành công nhưng đăng nhập thất bại');
                }
            } else {
                setError(data.error || 'Lỗi đăng ký');
            }
        } catch (err) {
            setError('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Đăng ký - AI Learning</title>
            </Head>
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    py: 4
                }}
            >
                <Container maxWidth="sm">
                    <Paper
                        elevation={6}
                        sx={{
                            p: 4,
                            width: '100%',
                            borderRadius: 3,
                            boxShadow: '0 8px 40px rgba(0,0,0,0.12)'
                        }}
                    >
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <Box
                                sx={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 2,
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)'
                                }}
                            >
                                <SchoolIcon sx={{ fontSize: 32, color: 'white' }} />
                            </Box>
                            <Typography component="h1" variant="h4" fontWeight={700} sx={{ color: '#1e1b4b' }}>
                                Tạo tài khoản mới
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Tham gia ngay để bắt đầu học tập
                            </Typography>
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="Họ tên"
                                name="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonIcon sx={{ color: '#6366f1' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EmailIcon sx={{ color: '#6366f1' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="Mật khẩu"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockIcon sx={{ color: '#6366f1' }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{
                                    mt: 3,
                                    mb: 2,
                                    py: 1.5,
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                                    '&:hover': {
                                        boxShadow: '0 6px 20px rgba(99, 102, 241, 0.5)'
                                    }
                                }}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Đăng ký ngay'}
                            </Button>
                            <Box sx={{ textAlign: 'center' }}>
                                <Link href="/auth/login" passHref>
                                    <MuiLink variant="body2" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                        <ArrowBackIcon sx={{ fontSize: 16 }} />
                                        Đã có tài khoản? Đăng nhập
                                    </MuiLink>
                                </Link>
                            </Box>
                        </Box>
                    </Paper>
                </Container>
            </Box>
        </>
    );
};

export default RegisterPage;