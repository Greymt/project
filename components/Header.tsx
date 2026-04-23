'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';

export default function Header() {
    const { data: session } = useSession();
    const router = useRouter();

    if (!session) return null;

    const isActive = (path: string) => router.pathname === path;

    return (
        <AppBar position="static" color="default" elevation={0} sx={{
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            position: 'sticky',
            top: 0,
            zIndex: 1100
        }}>
            <Container maxWidth="lg">
                <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 3 } }}>
                        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    backgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontWeight: 800,
                                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                                    letterSpacing: '-0.02em',
                                    cursor: 'pointer'
                                }}
                            >
                                AI Quiz
                            </Typography>
                        </Link>

                        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
                            <NavLink href="/dashboard" active={isActive('/dashboard')}>Trang chủ</NavLink>
                            <NavLink href="/quizzes" active={isActive('/quizzes')}>Bài học</NavLink>
                            <NavLink href="/questions" active={isActive('/questions')}>Ngân hàng câu hỏi</NavLink>
                            {/* <NavLink href="/vocabulary" active={isActive('/vocabulary')}>Từ vựng</NavLink> */}
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                            px: 2,
                            py: 0.5,
                            borderRadius: 2,
                            bgcolor: 'rgba(99, 102, 241, 0.08)',
                            border: '1px solid rgba(99, 102, 241, 0.15)'
                        }}>
                            <Typography variant="body2" sx={{
                                fontWeight: 500,
                                color: 'text.secondary',
                                fontSize: '0.875rem'
                            }}>
                                {session.user?.name || session.user?.email}
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => signOut({ callbackUrl: '/' })}
                            sx={{
                                borderColor: 'rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                fontWeight: 500,
                                '&:hover': {
                                    borderColor: '#ef4444',
                                    bgcolor: 'rgba(239, 68, 68, 0.04)'
                                }
                            }}
                        >
                            Đăng xuất
                        </Button>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}

function NavLink({ href, children, active = false }: { href: string; children: React.ReactNode; active?: boolean }) {
    return (
        <Link href={href} style={{ textDecoration: 'none' }}>
            <Button
                sx={{
                    textTransform: 'none',
                    fontWeight: active ? 600 : 400,
                    color: active ? 'primary.main' : 'text.secondary',
                    bgcolor: active ? 'rgba(99, 102, 241, 0.06)' : 'transparent',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1.5,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        bgcolor: 'rgba(99, 102, 241, 0.08)',
                        color: 'primary.main'
                    }
                }}
            >
                {children}
            </Button>
        </Link>
    );
}