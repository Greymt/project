import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { getDb } from '@/utils/mongodb';
import type { ApiResponse, Vocabulary } from '@/types';
import { generateVocabularyDetails } from '@/utils/gemini';

interface GenerateVocabRequest {
    topic: string;
    count: number;
    userEmail?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<any>>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { topic, count = 10, userEmail }: GenerateVocabRequest = req.body;

    if (!topic) {
        return res.status(400).json({ success: false, error: 'Topic is required' });
    }

    try {
        const { db } = await getDb();

        // Generate vocabulary list using AI
        const prompt = `Tạo ${count} từ vựng phổ biến về chủ đề "${topic}". Chỉ trả về JSON array các từ, mỗi từ có trường "word". JSON format perfect, không markdown.`;

        const { GoogleGenAI } = await import('@google/genai');
        const genAI = new GoogleGenAI({});

        const response = await genAI.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });

        const content = response.text || '';

        // Extract and parse JSON
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        let words: string[] = [];

        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                words = parsed.map((item: any) => item.word || item.english || item).filter(Boolean);
            } catch {
                // Fallback: extract words manually
                const matches = content.match(/"([a-zA-Z]+)"/g);
                if (matches) {
                    words = matches.map(m => m.replace(/"/g, ''));
                }
            }
        }

        // Generate details for each word
        const vocabularies: Vocabulary[] = [];

        for (const word of words.slice(0, count)) {
            try {
                const details = await generateVocabularyDetails(word);

                const vocabDoc: Vocabulary = {
                    id: `vocab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    word: details.word,
                    phonetic: details.phonetic,
                    partOfSpeech: details.partOfSpeech,
                    meaning: details.meaning,
                    examples: details.examples,
                    audioUrl: details.audioUrl || '',
                    userEmail: userEmail || 'anonymous',
                    isRemembered: false,
                    reviewCount: 0,
                    createdAt: new Date().toISOString(),
                };

                await db.collection('vocabularies').insertOne(vocabDoc);
                vocabularies.push(vocabDoc);
            } catch (err) {
                console.error(`Error generating details for word ${word}:`, err);
            }
        }

        res.status(200).json({
            success: true,
            data: { vocabularies, count: vocabularies.length }
        });

    } catch (error: any) {
        console.error('Bulk vocabulary generation error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to generate vocabularies' });
    }
}
