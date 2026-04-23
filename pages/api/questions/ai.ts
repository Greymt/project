import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { getDb } from '@/utils/mongodb';
import type { ApiResponse, Question } from '@/types';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<any>>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const session = await getSession({ req });
        const { db } = await getDb();
        const userEmail = session?.user?.email;

        // Get all AI-generated questions from questions collection
        const query = userEmail ? { userEmail, aiGenerated: true } : { aiGenerated: true };

        const allQuestions = await db.collection('questions')
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();

        // Get all AI-generated quizzes for the quiz list
        const quizzes = await db.collection('quizzes')
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json({
            success: true,
            data: {
                questions: allQuestions,
                quizzes: quizzes.map(q => ({
                    id: q.id,
                    title: q.title,
                    topic: q.topic,
                    count: q.questions?.length || 0,
                    createdAt: q.createdAt,
                }))
            }
        });

    } catch (error: any) {
        console.error('AI Questions error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch questions' });
    }
}
