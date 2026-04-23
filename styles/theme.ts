import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#667eea',
        },
        secondary: {
            main: '#764ba2',
        },
        background: {
            default: '#f8fafc',
            paper: 'rgba(255, 255, 255, 0.95)',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700
        },
        h2: {
            fontWeight: 600
        },
        h3: {
            fontWeight: 600
        },
        button: {
            textTransform: 'none'
        }
    },
    shape: {
        borderRadius: 16
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    textTransform: 'none',
                    fontWeight: 600
                },
                containedPrimary: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
                    }
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 20,
                    backdropFilter: 'blur(10px)'
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 20
                }
            }
        }
    }
});

export default theme;

