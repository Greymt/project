import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/utils/mongodb';
import type { ApiResponse } from '@/types';

interface QuizResultRequest {
    quizId: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
    userEmail?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<any>>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { quizId, score, correctCount, totalQuestions, userEmail }: QuizResultRequest = req.body;

        if (!quizId || score === undefined) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const { db } = await getDb();

        const wrongCount = totalQuestions - correctCount;

        const resultDoc = {
            id: `result_${Date.now()}`,
            quizId,
            score,
            correctCount,
            wrongCount,
            totalQuestions,
            userEmail: userEmail || 'anonymous',
            completedAt: new Date().toISOString(),
        };

        await db.collection('quizResults').insertOne(resultDoc);

        // Update user progress if user is logged in
        if (userEmail) {
            const user = await db.collection('users').findOne({ email: userEmail }) as any;

            if (user) {
                const currentProgress = user.progress || { totalQuizzes: 0, avgScore: 0, bestScore: 0, wrongCount: 0 };
                const newTotalQuizzes = currentProgress.totalQuizzes + 1;
                const newAvgScore = Math.round(((currentProgress.avgScore * currentProgress.totalQuizzes) + score) / newTotalQuizzes);
                const newBestScore = Math.max(currentProgress.bestScore, score);
                const newWrongCount = (currentProgress.wrongCount || 0) + wrongCount;

                await db.collection('users').updateOne(
                    { email: userEmail },
                    {
                        $push: { quizHistory: { quizId, score, correctCount, wrongCount, completedAt: new Date().toISOString() } } as any,
                        $set: {
                            progress: {
                                totalQuizzes: newTotalQuizzes,
                                avgScore: newAvgScore,
                                bestScore: newBestScore,
                                wrongCount: newWrongCount,
                            }
                        }
                    } as any
                );
            }
        }

        res.status(200).json({
            success: true,
            data: { resultId: resultDoc.id }
        });

    } catch (error: any) {
        console.error('Quiz result save error:', error);
        res.status(500).json({ success: false, error: 'Failed to save quiz result' });
    }
}
