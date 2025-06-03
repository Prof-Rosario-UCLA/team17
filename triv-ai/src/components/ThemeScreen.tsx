import React, { useState, useEffect } from 'react';
import './ThemeScreen.css';
import { initializeCanvas, addFloatingWord } from './ThemeCanvas';

export default function ThemeScreen({ onThemeSelected }: { onThemeSelected: (theme: string[]) => void }) {
    const [allThemes, setAllThemes] = useState<string[]>([]);
    const [themeInput, setThemeInput] = useState('');
    const [isReadyScreen, setIsReadyScreen] = useState(true);
    const [playerIndex, setPlayerIndex] = useState(0);
    const timePerRound = 30;
    const [countdown, setCountdown] = useState(timePerRound);
    const numberOfPlayers = 4;
   
    useEffect(() => {
    if (!isReadyScreen) {
        
        const id = setTimeout(() => initializeCanvas(), 50);
        return () => clearTimeout(id);
    }
    }, [isReadyScreen]);

    useEffect(() => {
        if (!isReadyScreen && countdown > 0) {
            setTimeout(() => setCountdown(c => c - 1), 1000);
        } else if (countdown === 0 && !isReadyScreen) {
            endPlayerTurn();
        }
    }, [countdown, isReadyScreen]);
    
    const startPlayerTurn = () => {
        setCountdown(timePerRound);
        setIsReadyScreen(false);
    };

    const endPlayerTurn = () => {
        if (playerIndex + 1 < numberOfPlayers) {
            setPlayerIndex(playerIndex + 1);
            setIsReadyScreen(true);
        } else {
            onThemeSelected(allThemes);
        }
    };

    const submitTheme = () => {
        if (themeInput) {
            setAllThemes((prev) => [...prev, themeInput]);
            addFloatingWord(themeInput);
            setThemeInput('');
        }
    };

    return (
        <div className="theme-screen">
            {isReadyScreen ? (
                <div className="ready-screen">
                <h1>Player {playerIndex + 1}'s Turn!</h1>
                <h2>You have 30 seconds to enter themes.</h2>
                <button className="ready-button" onClick={startPlayerTurn}>
                    Start
                </button>
                </div>
            ) : (
                <div>
                    <header className="theme-header">
                        <div className="progress-bar"/> 
                    </header>
                    <div className='theme-wrapper'>
                        <h2 className="text-xl mb-2">Player {playerIndex + 1}, pick your theme</h2>
                        <canvas id="gameCanvas" className="theme-canvas"></canvas>
                        <div>
                            <input
                                value={themeInput}
                                onChange={(e) => setThemeInput(e.target.value)}
                                className="input-box"
                                placeholder="e.g. Space, History, Disney"
                            />
                            <button
                                //onClick={() => onThemeSelected(theme)}
                                onClick={submitTheme}
                                
                            >
                            Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
