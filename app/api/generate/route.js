import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  const { topic } = await req.json();

  const prompt = `You are a medical study assistant. Based on this topic or notes: "${topic}"
  
Generate exactly 10 flashcards and 5 quiz questions.

Return ONLY valid JSON in this exact format:
{
  "flashcards": [
    {"question": "...", "answer": "..."}
  ],
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "answer": "A"
    }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const data = JSON.parse(completion.choices[0].message.content);
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}