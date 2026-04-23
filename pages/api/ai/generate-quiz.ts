import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '@/utils/mongodb';
import { generateQuiz, generateFromText } from '@/utils/gemini';
import type { GeneratedQuestion } from '@/utils/gemini';
import type { ApiResponse, Question } from '@/types';
import { ObjectId } from 'mongodb';

interface GenerateRequest {
    topic?: string;
    text?: string;
    count?: number;
    userEmail?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<any>>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { topic, text, count = 10, userEmail }: GenerateRequest = req.body;

    if (!topic && !text) {
        return res.status(400).json({ success: false, error: 'Topic or text required' });
    }

    try {
        const { db } = await getDb();

        let questions: GeneratedQuestion[];

        if (text) {
            questions = await generateFromText(text, count);
        } else {
            questions = await generateQuiz(topic!, count);
        }

        // Convert to DB format and save to questions collection
        const quizQuestions: Question[] = [];

        for (let index = 0; index < questions.length; index++) {
            const q = questions[index];
            const questionId = `q_${Date.now()}_${index}`;

            const questionDoc: Question = {
                id: questionId,
                question: q.question,
                optionA: q.options[0],
                optionB: q.options[1],
                optionC: q.options[2],
                optionD: q.options[3],
                correctAnswer: ['A', 'B', 'C', 'D'][q.correctAnswer] as 'A' | 'B' | 'C' | 'D',
                explanation: q.explanation,
                aiGenerated: true,
                userEmail: userEmail,
                topic: topic || 'AI Generated',
                createdAt: new Date().toISOString(),
            };

            // Save each question to questions collection
            await db.collection('questions').insertOne(questionDoc);

            quizQuestions.push(questionDoc);
        }

        // Save quiz to MongoDB - use email from request body or default to anonymous
        const quizId = new ObjectId().toString();
        const quizDoc = {
            id: quizId,
            title: topic || `Quiz từ văn bản (${text?.substring(0, 50)}...)`,
            questions: quizQuestions,
            aiGenerated: true,
            sourceText: text,
            topic,
            count,
            userEmail: userEmail,
            createdAt: new Date().toISOString(),
        };

        await db.collection('quizzes').insertOne(quizDoc);

        res.status(200).json({
            success: true,
            data: {
                quizId,
                title: quizDoc.title,
                questions: quizQuestions,
                count: quizQuestions.length,
            },
        });

    } catch (error: any) {
        console.error('AI Quiz generation error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to generate quiz' });
    }
}
