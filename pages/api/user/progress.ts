import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { getDb } from '@/utils/mongodb';
import type { ApiResponse } from '@/types';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<any>>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const session = await getSession({ req });
        const userEmail = session?.user?.email;

        if (!userEmail) {
            return res.status(200).json({
                success: true,
                data: {
                    progress: null,
                    recentResults: []
                }
            });
        }

        const { db } = await getDb();

        // Get user progress
        const user = await db.collection('users').findOne({ email: userEmail });

        // Get recent quiz results
        const recentResults = await db.collection('quizResults')
            .find({ userEmail })
            .sort({ completedAt: -1 })
            .limit(10)
            .toArray();

        // Calculate total wrong count from all quiz results
        const totalWrongCount = recentResults.reduce((sum, result) => {
            return sum + (result.wrongCount || 0);
        }, 0);

        // Get quiz details for each result
        const resultsWithQuizInfo = await Promise.all(
            recentResults.map(async (result) => {
                const quiz = await db.collection('quizzes').findOne({ id: result.quizId });
                return {
                    ...result,
                    wrongCount: result.wrongCount || 0,
                    quizTitle: quiz?.title || 'Quiz đã xóa',
                };
            })
        );

        res.status(200).json({
            success: true,
            data: {
                progress: user?.progress ? {
                    ...user.progress,
                    wrongCount: totalWrongCount
                } : null,
                recentResults: resultsWithQuizInfo
            }
        });

    } catch (error: any) {
        console.error('User progress error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch progress' });
    }
}
