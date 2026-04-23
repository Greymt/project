'use client';

import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { wrapper } from '@/store';
import theme from '@/styles/theme';
import '@/styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { SnackbarProvider } from 'notistack';

function MyApp({ Component, ...rest }: AppProps) {
    const { store, props } = wrapper.useWrappedStore(rest);
    const { pageProps } = props;

    return (
        <SessionProvider>
            <Provider store={store}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                        <Component {...pageProps} />
                    </SnackbarProvider>
                </ThemeProvider>
            </Provider>
        </SessionProvider>
    );
}

export default MyApp;

