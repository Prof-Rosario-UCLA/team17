import React from 'react';

export default function GameScreen({ theme }: { theme: string }) {
    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold">Trivia Time!</h2>
            <p className="mt-2">Theme: {theme}</p>
            More game UI will go here
        </div>
    );
}
