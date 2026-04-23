# AI Learning App

Ứng dụng học online với **AI Quiz Generator** (Next.js 12 Page Router).

## Features
- ✅ Đăng ký/Đăng nhập
- ✅ **AI tạo Quiz**: Nhập topic/text → Tự động MCQ + giải thích
- ✅ **Game Quiz**: Timer, điểm real-time, confetti
- ✅ Quản lý bộ câu hỏi + chọn số lượng
- ✅ Profile + tiến độ học tập (charts)
- ✅ Ngân hàng câu hỏi với lọc theo chủ đề
- ✅ Luyện tập câu sai
- ✅ Bài học (Quizzes)

## Quick Setup
```bash
cd ai-learning-app
cp .env.local.example .env.local  # Điền keys
npm install
npm run dev
```

Open: http://localhost:3000

## Keys cần thiết
1. **MongoDB**: Local hoặc Atlas (free tier)
2. **OpenAI API Key**: https://platform.openai.com/api-keys (GPT-4o-mini ~$0.15/1M tokens)

## Production
```bash
npm run build
npm start
# Deploy Vercel/Netlify tự động
```

## Cấu hình
- `.env.local.example` → `.env.local` (điền `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GEMINI_API_KEY`)
- `npm run lint` - ESLint
- `npm run build` - Production build