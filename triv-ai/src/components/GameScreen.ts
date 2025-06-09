import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // remove this in production
});

function getTwoRandomThemes(themes: string[]): [string, string] | null {
  if (themes.length < 2) return null;
  const i = Math.floor(Math.random() * themes.length);
  let j = Math.floor(Math.random() * themes.length);
  while (j === i) j = Math.floor(Math.random() * themes.length);
  return [themes[i], themes[j]];
}

interface TriviaResult {
  question: string;
  answers: string[];
}

interface OpenAIResponse {
  question: string;
  choices: string[];
}

export async function generateQuestionAndAnswers(themes: string[]): Promise<TriviaResult> {
  const selected = getTwoRandomThemes(themes);
  if (!selected) {
    return {
      question: 'Not enough themes to generate a question.',
      answers: [],
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user',
        content: `Return ONLY a valid JSON object in this exact format:
                    {
                      "question": "Your question here?",
                      "choices": ["Correct Answer", "Wrong Answer 1", "Wrong Answer 2", "Wrong Answer 3"]
                    }
                    The question should creatively combine these two themes: "${selected[0]}" and "${selected[1]}".
                    The question should be creative but **based on real, factual trivia** — nothing fictional or made-up and should be tailored for 10-30 year olds.
                    The answer should not be the same as any of the themes listed above.
                    The correct answer MUST be the first element in the "choices" array.
                    Do not add any extra explanation or text — just return the raw JSON.`, }],
    });

    const result: OpenAIResponse = JSON.parse(response.choices[0].message.content ?? '');
    return {
      question: result.question,
      answers: result.choices,
    };
  } catch (error) {
    console.error('Error generating trivia:', error);
    return {
      question: 'Failed to generate question.',
      answers: [],
    };
  }
}
