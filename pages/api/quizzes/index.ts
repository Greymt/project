import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { getDb } from '@/utils/mongodb';
import type { ApiResponse } from '@/types';
import type { Quiz } from '@/types';
import { ObjectId } from 'mongodb';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<any>>
) {
    if (req.method === 'GET') {
        try {
            const session = await getSession({ req });
            const { db } = await getDb();
            const userEmail = session?.user?.email;

            const query = userEmail ? { userEmail } : {};

            const rawQuizzes = await db.collection('quizzes')
                .find(query)
                .sort({ createdAt: -1 })
                .limit(20)
                .toArray();

            const quizzes: Quiz[] = rawQuizzes.map(doc => ({
                id: doc.id || doc._id.toString(),
                title: doc.title,
                questions: doc.questions,
                aiGenerated: doc.aiGenerated || false,
                topic: doc.topic,
                count: doc.count || doc.questions?.length,
                createdAt: doc.createdAt,
            }));

            res.status(200).json({
                success: true,
                data: { quizzes }
            });

        } catch (error: any) {
            console.error('Quizzes list error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch quizzes' });
        }
    } else if (req.method === 'POST') {
        try {
            const session = await getSession({ req });
            const { db } = await getDb();
            const { title, questions, userEmail, isCustom, topic } = req.body;

            if (!title || !questions || questions.length === 0) {
                return res.status(400).json({ success: false, error: 'Title and questions are required' });
            }

            const quizId = new ObjectId().toString();
            const quizDoc = {
                id: quizId,
                title,
                questions,
                aiGenerated: false,
                isCustom: isCustom || false,
                topic: topic || '',
                count: questions.length,
                userEmail: userEmail || session?.user?.email,
                createdAt: new Date().toISOString(),
            };

            await db.collection('quizzes').insertOne(quizDoc);

            res.status(200).json({
                success: true,
                data: { quiz: quizDoc }
            });

        } catch (error: any) {
            console.error('Quiz creation error:', error);
            res.status(500).json({ success: false, error: 'Failed to create quiz' });
        }
    } else if (req.method === 'DELETE') {
        try {
            const session = await getSession({ req });
            const { db } = await getDb();
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ success: false, error: 'Quiz ID required' });
            }

            const quizId = id as string;
            const quiz = await db.collection('quizzes').findOne({ id: quizId });

            if (!quiz) {
                return res.status(404).json({ success: false, error: 'Quiz not found' });
            }

            if (quiz.userEmail !== session?.user?.email) {
                return res.status(403).json({ success: false, error: 'Not authorized' });
            }

            await db.collection('quizzes').deleteOne({ id: quizId });

            await db.collection('questions').updateMany(
                { quizId: quizId },
                { 
                    $set: { 
                        quizId: null,
                        quizTitle: null 
                    } 
                }
            );

            res.status(200).json({
                success: true,
                data: { message: 'Xóa quiz thành công, câu hỏi được giữ lại' }
            });

        } catch (error: any) {
            console.error('Quiz deletion error:', error);
            res.status(500).json({ success: false, error: 'Failed to delete quiz' });
        }
    } else {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
}
