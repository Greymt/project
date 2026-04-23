import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { getDb } from '@/utils/mongodb';
import type { ApiResponse, Vocabulary } from '@/types';
import { ObjectId } from 'mongodb';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<any>>
) {
    const session = await getSession({ req });
    const userEmail = session?.user?.email;

    if (req.method === 'GET') {
        try {
            const { db } = await getDb();
            const filter = req.query.filter as string;
            const query: any = userEmail ? { userEmail } : {};

            if (filter === 'remembered') {
                query.isRemembered = true;
            } else if (filter === 'unremembered') {
                query.isRemembered = false;
            }

            const vocabularies = await db.collection('vocabularies')
                .find(query)
                .sort({ createdAt: -1 })
                .toArray();

            res.status(200).json({
                success: true,
                data: { vocabularies }
            });

        } catch (error: any) {
            console.error('Vocabulary fetch error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch vocabularies' });
        }
    } else if (req.method === 'POST') {
        try {
            const { db } = await getDb();
            const { word, phonetic, partOfSpeech, meaning, examples, audioUrl, generateWithAI } = req.body;

            if (!word || !meaning) {
                return res.status(400).json({ success: false, error: 'Word and meaning are required' });
            }

            if (generateWithAI) {
                // Generate vocabulary details with AI
                const { generateVocabularyDetails } = await import('@/utils/gemini');
                const aiDetails = await generateVocabularyDetails(word);

                const vocabDoc: Vocabulary = {
                    id: new ObjectId().toString(),
                    word: aiDetails.word || word,
                    phonetic: aiDetails.phonetic || phonetic || '',
                    partOfSpeech: aiDetails.partOfSpeech || partOfSpeech || '',
                    meaning: aiDetails.meaning || meaning,
                    examples: aiDetails.examples || examples || [],
                    audioUrl: aiDetails.audioUrl || audioUrl || '',
                    userEmail: userEmail || 'anonymous',
                    isRemembered: false,
                    reviewCount: 0,
                    createdAt: new Date().toISOString(),
                };

                await db.collection('vocabularies').insertOne(vocabDoc);

                res.status(200).json({
                    success: true,
                    data: { vocabulary: vocabDoc }
                });
            } else {
                // Manual vocabulary entry
                const vocabDoc: Vocabulary = {
                    id: new ObjectId().toString(),
                    word,
                    phonetic: phonetic || '',
                    partOfSpeech: partOfSpeech || '',
                    meaning,
                    examples: examples || [],
                    audioUrl: audioUrl || '',
                    userEmail: userEmail || 'anonymous',
                    isRemembered: false,
                    reviewCount: 0,
                    createdAt: new Date().toISOString(),
                };

                await db.collection('vocabularies').insertOne(vocabDoc);

                res.status(200).json({
                    success: true,
                    data: { vocabulary: vocabDoc }
                });
            }

        } catch (error: any) {
            console.error('Vocabulary creation error:', error);
            res.status(500).json({ success: false, error: 'Failed to create vocabulary' });
        }
    } else if (req.method === 'PUT') {
        try {
            const { db } = await getDb();
            const { id, isRemembered, reviewCount } = req.body;

            const updateData: any = {};
            if (isRemembered !== undefined) updateData.isRemembered = isRemembered;
            if (reviewCount !== undefined) updateData.reviewCount = reviewCount;
            updateData.lastReviewed = new Date().toISOString();

            await db.collection('vocabularies').updateOne(
                { id },
                { $set: updateData }
            );

            res.status(200).json({ success: true });

        } catch (error: any) {
            console.error('Vocabulary update error:', error);
            res.status(500).json({ success: false, error: 'Failed to update vocabulary' });
        }
    } else if (req.method === 'DELETE') {
        try {
            const { db } = await getDb();
            const { id } = req.query;

            await db.collection('vocabularies').deleteOne({ id });

            res.status(200).json({ success: true });

        } catch (error: any) {
            console.error('Vocabulary delete error:', error);
            res.status(500).json({ success: false, error: 'Failed to delete vocabulary' });
        }
    } else {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
}
