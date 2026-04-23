import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/utils/mongodb';
import type { ApiResponse } from '@/types';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<any>>
) {
    const { method } = req;

    try {
        const { db } = await getDb();

        switch (method) {
            case 'GET': {
                const questions = await db.collection('questions')
                    .find({})
                    .sort({ createdAt: -1 })
                    .toArray();

                res.status(200).json({
                    success: true,
                    data: { questions }
                });
                break;
            }

            case 'POST': {
                const { question, optionA, optionB, optionC, optionD, correctAnswer, explanation, userEmail, aiGenerated, quizTitle, quizId, quizTopic } = req.body;

                if (!question || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
                    return res.status(400).json({ success: false, error: 'Thiếu thông tin câu hỏi' });
                }

                const questionDoc = {
                    id: `q_${Date.now()}`,
                    question,
                    optionA,
                    optionB,
                    optionC,
                    optionD,
                    correctAnswer,
                    explanation: explanation || '',
                    userEmail: userEmail || 'anonymous',
                    aiGenerated: aiGenerated || false,
                    quizTitle: quizTitle || null,
                    quizId: quizId || null,
                    quizTopic: quizTopic || null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                await db.collection('questions').insertOne(questionDoc);

                res.status(201).json({
                    success: true,
                    data: { question: questionDoc }
                });
                break;
            }

            case 'PUT': {
                const { id, question, optionA, optionB, optionC, optionD, correctAnswer, explanation, aiGenerated, quizTitle, quizId, quizTopic } = req.body;

                if (!id) {
                    return res.status(400).json({ success: false, error: 'Thiếu ID câu hỏi' });
                }

                const updateDoc: any = {
                    updatedAt: new Date().toISOString(),
                };

                if (question) updateDoc.question = question;
                if (optionA) updateDoc.optionA = optionA;
                if (optionB) updateDoc.optionB = optionB;
                if (optionC) updateDoc.optionC = optionC;
                if (optionD) updateDoc.optionD = optionD;
                if (correctAnswer) updateDoc.correctAnswer = correctAnswer;
                if (explanation !== undefined) updateDoc.explanation = explanation;
                if (aiGenerated !== undefined) updateDoc.aiGenerated = aiGenerated;
                if (quizTitle !== undefined) updateDoc.quizTitle = quizTitle;
                if (quizId !== undefined) updateDoc.quizId = quizId;
                if (quizTopic !== undefined) updateDoc.quizTopic = quizTopic;

                await db.collection('questions').updateOne(
                    { id },
                    { $set: updateDoc }
                );

                res.status(200).json({
                    success: true,
                    data: { message: 'Cập nhật thành công' }
                });
                break;
            }

            case 'DELETE': {
                const { id, topic } = req.query;

                if (!id && !topic) {
                    return res.status(400).json({ success: false, error: 'Thiếu ID câu hỏi hoặc chủ đề' });
                }

                let result;
                if (id) {
                    result = await db.collection('questions').deleteOne({ id: id as string });
                } else if (topic) {
                    result = await db.collection('questions').deleteMany({ quizTopic: topic as string });
                }

                res.status(200).json({
                    success: true,
                    data: {
                        message: id ? 'Xóa thành công' : `Đã xóa ${result?.deletedCount || 0} câu hỏi thuộc chủ đề`,
                        deletedCount: result?.deletedCount || 0
                    }
                });
                break;
            }

            default:
                res.status(405).json({ success: false, error: 'Method not allowed' });
        }
    } catch (error: any) {
        console.error('Questions API error:', error);
        res.status(500).json({ success: false, error: 'Lỗi server' });
    }
}
