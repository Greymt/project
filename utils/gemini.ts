import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({});

export interface GeneratedQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

// Advanced JSON repair
function repairJSON(jsonStr: string): string {
    // Fix trailing commas
    jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
    // Fix unquoted keys
    jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
    // Don't replace single quotes - they may be inside strings like "someone's"
    return jsonStr;
}

function extractJSON(content: string): string {
    // Try to find JSON array
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
        return jsonMatch[0];
    }

    // Try to find JSON object
    const objMatch = content.match(/\{[\s\S]*\}/);
    if (objMatch) {
        return objMatch[0];
    }

    return content.trim();
}

export async function generateQuiz(topic: string, count = 10): Promise<GeneratedQuestion[]> {
    const prompt = `{"instruction":"Tạo ${count} câu hỏi về ${topic}","format":"chỉ JSON array","schema":[
  {"question":"?","options":["A","B","C","D"],"correctAnswer":1,"explanation":".."}
  ],"rules":"0=A 1=B, 1 đúng 3 sai, JSON syntax perfect NO markdown NO extra text"}`;

    let content: string = '';

    try {
        const response = await genAI.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });

        content = response.text || JSON.stringify(response);
        console.log('FULL RAW (500 chars):', content.substring(0, 500));
        console.log('Length:', content.length);

        // Layer 1: Extract JSON using improved function
        let jsonStr = extractJSON(content);

        // Layer 2: Clean common artifacts
        jsonStr = jsonStr.replace(/^```json\n|```$/g, '').trim();

        // Ensure we have proper array brackets
        if (!jsonStr.startsWith('[')) {
            jsonStr = '[' + jsonStr;
        }
        if (!jsonStr.endsWith(']')) {
            jsonStr = jsonStr + ']';
        }

        // Layer 3: Repair & validate
        jsonStr = repairJSON(jsonStr);
        console.log('REPAIRED JSON:', jsonStr.substring(0, 200) + '...');

        const parsed = JSON.parse(jsonStr);

        // Validate and filter questions
        const questions = Array.isArray(parsed)
            ? parsed.filter(q => q && q.question && q.options && q.options.length >= 4).slice(0, count)
            : [];

        // Validation
        if (questions.length === 0) throw new Error('No valid questions parsed');

        console.log(`SUCCESS: ${questions.length} valid questions`);
        return questions as GeneratedQuestion[];

    } catch (error: any) {
        console.error('PARSE ERROR:', error.message);
        console.error('CONTENT snippet:', content.substring(0, 300));

        return [{
            question: `Test question about ${topic}`,
            options: ['A. Test A', 'B. Test B (correct)', 'C. Test C', 'D. Test D'],
            correctAnswer: 1,
            explanation: 'Fallback while Gemini fixes'
        }];
    }
}

export async function generateFromText(text: string, count = 10): Promise<GeneratedQuestion[]> {
    return generateQuiz(`Text analysis: ${text.substring(0, 100)}...`, count);
}

export interface VocabularyDetails {
    word: string;
    phonetic: string;
    partOfSpeech: string;
    meaning: string;
    examples: string[];
    audioUrl?: string;
}

export async function generateVocabularyDetails(word: string): Promise<VocabularyDetails> {
    const prompt = `{"instruction":"Tạo thông tin chi tiết cho từ \"${word}\"","format":"chỉ JSON object","schema":{
  "word":"?",
  "phonetic":"?",
  "partOfSpeech":"danh từ / động từ / tính từ / ...",
  "meaning":"nghĩa tiếng Việt",
  "examples":["ví dụ 1","ví dụ 2"]
},"rules":"JSON syntax perfect, NO markdown, NO extra text"}`;

    let content: string = '';

    try {
        const response = await genAI.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });

        content = response.text || JSON.stringify(response);

        let jsonStr = extractJSON(content);
        jsonStr = jsonStr.replace(/^```json\n|```$/g, '').trim();
        jsonStr = repairJSON(jsonStr);

        const parsed = JSON.parse(jsonStr);
        return {
            word: parsed.word || word,
            phonetic: parsed.phonetic || '',
            partOfSpeech: parsed.partOfSpeech || '',
            meaning: parsed.meaning || '',
            examples: parsed.examples || [],
        };

    } catch (error: any) {
        console.error('Vocabulary generation error:', error.message);
        return {
            word: word,
            phonetic: '',
            partOfSpeech: '',
            meaning: '',
            examples: [],
        };
    }
}
