import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/utils/mongodb';
import type { ApiResponse } from '@/types';
import { ObjectId } from 'mongodb';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<{ quiz: any }>>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { id } = req.query;
        const { db } = await getDb();

        const quiz = await db.collection('quizzes').findOne({
            $or: [{ id: id }, { _id: new ObjectId(id as string) }]
        });

        if (!quiz) {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }

        res.status(200).json({
            success: true,
            data: {
                quiz: {
                    id: quiz.id || quiz._id.toString(),
                    title: quiz.title,
                    questions: quiz.questions,
                    aiGenerated: quiz.aiGenerated || false,
                    topic: quiz.topic,
                    count: quiz.count || quiz.questions?.length,
                    createdAt: quiz.createdAt,
                }
            }
        });

    } catch (error: any) {
        console.error('Quiz fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch quiz' });
    }
}
