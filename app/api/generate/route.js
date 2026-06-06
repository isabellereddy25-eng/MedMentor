import { NextResponse } from 'next/server'

export async function POST(req) {
  const { content, isFromTopic, grade, goal, flashcardCount } = await req.json()

  const cardInstruction = flashcardCount
    ? `Generate exactly ${flashcardCount} flashcards.`
    : isFromTopic
      ? `Generate exactly 10 flashcards.`
      : `Generate as many flashcards as needed to cover the notes thoroughly (between 8 and 20).`

  const systemPrompt = `You are MedMentor, an AI study tool for pre-med high schoolers.
The student is in ${grade} with the goal: ${goal}.

CRITICAL RULES:
1. Only state medically accurate facts you are certain about
2. If anything is uncertain add "(verify this)" at the end of that item
3. Every quiz explanation MUST include a real-life everyday example a teenager can relate to
4. Write in plain conversational English — no textbook language
5. Return ONLY valid JSON — no markdown, no backticks, no extra text whatsoever

${cardInstruction}
Generate exactly 5 quiz questions.

The JSON must follow this EXACT structure:
{
  "flashcards": [
    {
      "front": "short term or question under 10 words",
      "back": "clear answer with a real-life example"
    }
  ],
  "questions": [
    {
      "question": "a clear multiple choice question",
      "options": ["A. first option", "B. second option", "C. third option", "D. fourth option"],
      "correct": "A",
      "explanation": "Why correct, explained simply. Real-life example: e.g. think of it like..."
    }
  ]
}

IMPORTANT: The correct field must be ONLY a single letter A, B, C, or D — nothing else.
Make wrong answer options plausible — not obviously wrong.`

  const userPrompt = isFromTopic
    ? `Generate a complete study set about: "${content}"`
    : `Generate a complete study set from these student notes: "${content}"`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 3000,
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    })

    const data = await res.json()
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 500 })

    const text = data.choices?.[0]?.message?.content || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (parsed.questions) {
      parsed.questions = parsed.questions.map(q => ({
        ...q,
        correct: q.correct?.toString().trim().replace(/[^A-Da-d]/g, '').toUpperCase() || 'A'
      }))
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Generation error:', err)
    return NextResponse.json({ error: 'Generation failed — please try again' }, { status: 500 })
  }
}
