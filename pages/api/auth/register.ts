import type { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../../utils/mongodb';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    try {
        const { db } = await getDb();

        // Check if user exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const result = await db.collection('users').insertOne({
            name,
            email,
            password: hashedPassword,
            createdAt: new Date(),
            quizzes: [],
            progress: { totalQuizzes: 0, avgScore: 0 }
        });

        res.status(201).json({
            success: true,
            data: { id: result.insertedId, name, email }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
}
