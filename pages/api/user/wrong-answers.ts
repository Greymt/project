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
                data: { wrongAnswerQuestions: [] }
            });
        }

        const { db } = await getDb();
        const limit = parseInt(req.query.limit as string) || 20;

        // Get all quiz results for this user
        const quizResults = await db.collection('quizResults')
            .find({ userEmail })
            .sort({ completedAt: -1 })
            .limit(100)
            .toArray();

        // For now, get questions from user's quiz history
        // We'll collect all questions from completed quizzes and track which ones were wrong
        // This is a simplified approach - in production you'd want to store wrong answer question IDs

        // Get all AI questions from the questions collection
        const allQuestions = await db.collection('questions')
            .find({ userEmail, aiGenerated: true })
            .limit(100)
            .toArray();

        // Shuffle and return random questions (simulating getting wrong questions)
        // In a real app, you'd track which specific questions were answered wrong
        const shuffled = allQuestions.sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffled.slice(0, Math.min(limit, shuffled.length));

        res.status(200).json({
            success: true,
            data: {
                wrongAnswerQuestions: selectedQuestions,
                totalWrongCount: quizResults.reduce((sum, r) => sum + (r.wrongCount || 0), 0)
            }
        });

    } catch (error: any) {
        console.error('Wrong answer questions error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch wrong answer questions' });
    }
}
