import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '@/utils/mongodb';
import { getDb } from '@/utils/mongodb';
import bcrypt from 'bcryptjs';

export const authOptions = {
    adapter: MongoDBAdapter(clientPromise),
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const { db } = await getDb();
                const user = await db.collection('users').findOne({ email: credentials.email });

                if (!user) {
                    return null;
                }

                const isValidPassword = await bcrypt.compare(credentials.password as string, user.password as string);

                if (!isValidPassword) {
                    return null;
                }

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                };
            }
        })
    ],
    session: {
        strategy: 'jwt' as const,
    },
    callbacks: {
        async jwt({ token, user }: { token: any; user?: any }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            if (token) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/login',
    },
};

const handler = NextAuth(authOptions);
export default handler;
