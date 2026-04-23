import { useState } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
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
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    School as SchoolIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import Link from 'next/link';
import Head from 'next/head';

const LoginPage = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await signIn('credentials', {
            email: formData.email,
            password: formData.password,
            redirect: false,
        });

        if (result?.error) {
            setError('Email hoặc mật khẩu không đúng');
        } else if (result?.ok) {
            router.push('/dashboard');
        }

        setLoading(false);
    };

    return (
        <>
            <Head>
                <title>Đăng nhập - AI Learning</title>
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
                                Chào mừng trở lại
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Đăng nhập để tiếp tục học tập
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
                                id="email"
                                label="Email"
                                name="email"
                                autoComplete="email"
                                autoFocus
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
                                name="password"
                                label="Mật khẩu"
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                autoComplete="current-password"
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
                                {loading ? <CircularProgress size={24} /> : 'Đăng nhập'}
                            </Button>
                            <Box sx={{ textAlign: 'center' }}>
                                <Link href="/auth/register" passHref>
                                    <MuiLink variant="body2" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                        <ArrowBackIcon sx={{ fontSize: 16 }} />
                                        Chưa có tài khoản? Đăng ký ngay
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

export default LoginPage;