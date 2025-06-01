import React, { useEffect, useState } from 'react';

import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,   //only keep this here while in development wil need to store key in backend soon
});


export default function GameScreen({ theme }: { theme: string }) {
    const [question, setQuestion] = useState('Loading trivia question');

    useEffect(() => {
	async function fetchQuestion() {
	    try{
		const response = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [{role: 'user', content: `Give me a trivia question about the theme: "${theme}". Only include the question.`,
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
            <p className="mt-2">Theme: {theme}</p>
	    <p className="text-xl">{question}</p>
            More game UI will go here
        </div>
    );
}
