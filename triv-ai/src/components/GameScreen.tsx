import React, { useEffect, useState } from 'react';

import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,   //only keep this here while in development wil need to store key in backend soon
});

function getTwoRandomThemes(themes: string[]): [string, string] | null {
  if (themes.length < 1) return null;
  if (themes.length < 2) return [themes[0],themes[0]];

  const i = Math.floor(Math.random() * themes.length);
  let j = Math.floor(Math.random() * themes.length);
  while (j === i); {
    j = Math.floor(Math.random() * themes.length);
  } 
  return [themes[i], themes[j]];
}

export default function GameScreen({ theme }: { theme: string[] }) {
    const [question, setQuestion] = useState('Loading trivia question');
	const [selectedThemes, setSelectedThemes] = useState<[string, string] | null>(null);

    useEffect(() => {
	async function fetchQuestion() {
		const selected = getTwoRandomThemes(theme);
		if (!selected) {
			setQuestion('Not enough themes to generate a question.');
			return;
		}
		setSelectedThemes(selected);
		
	    try{
		const response = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [{role: 'user', content: `Give me a creative trivia question that combines these two themes: "${selected[0]}" and "${selected[1]}". Only include the question.`,
			},],
		});
	    const result = response.choices[0].message.content;
	    setQuestion(result ?? 'No Question Generated');
	    } catch (err) {
	    setQuestion('Error getting question');
	    }
	}
	fetchQuestion();
    },[theme]);

    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold">Trivia Time!</h2>
            <p className="mt-2">Themes: {selectedThemes ? `${selectedThemes[0]} and ${selectedThemes[1]}` : 'Loading...'}</p>
	    <p className="text-xl">{question}</p>
            More game UI will go here
        </div>
    );
}
