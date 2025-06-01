import React, { useState } from 'react';
 
export default function ThemeScreen({ onThemeSelected }: { onThemeSelected: (theme: string) => void }) {
    const [theme, setTheme] = useState('');

    return (
        <div className="text-center">
            <h2 className="text-xl mb-2">Pick a trivia theme</h2>
            <input
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="border rounded p-2"
                placeholder="e.g. Space, History, Disney"
            />
            <button
                onClick={() => onThemeSelected(theme)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
                Start Game
            </button>
        </div>
    );
}
