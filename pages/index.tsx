import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to dashboard or login
        router.push('/dashboard');
    }, [router]);

    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Chào mừng đến AI Learning App</h1>
            <p>Đang chuyển hướng đến Dashboard...</p>
        </div>
    );
}
