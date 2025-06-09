import React, { useState, useEffect } from 'react';
import './ThemeScreen.css';
import { initializeCanvas, addFloatingWord } from './ThemeCanvas';
import { generateQuestionAndAnswers } from './GameScreen';

export default function ThemeScreen({ onThemeSelected }: { onThemeSelected: (theme: string[]) => void }) {
    const [screen, setScreen] = useState<'setup' | 'theme' | 'game' | 'scores' | 'correct'>('setup');

    const [allThemes, setAllThemes] = useState<string[]>([]);
    const [themeInput, setThemeInput] = useState('');
    const [isReadyScreen, setIsReadyScreen] = useState(true);
    const [playerIndex, setPlayerIndex] = useState(0);
    const timePerRound = 30;
    const [countdown, setCountdown] = useState(timePerRound);
    const [numberOfPlayers, setNumberOfPlayers] = useState(2);
    const [playerNames, setPlayerNames] = useState<string[]>([]);
    const [scores, setScores] = useState<number[]>([]);
    const [question, setQuestion] = useState('');
    const [answers, setAnswers] = useState<string[]>([]);
    const [gamePlayerIndex, setGamePlayerIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [isQuestionLoading, setIsQuestionLoading] = useState(false);


   useEffect(() => {
        setPlayerNames(Array(numberOfPlayers).fill(''));
        setScores(Array(numberOfPlayers).fill(0));
    }, [numberOfPlayers]);


    useEffect(() => {
    if (!isReadyScreen) {
        
        const id = setTimeout(() => initializeCanvas(), 50);
        return () => clearTimeout(id);
    }
    }, [isReadyScreen]);

    useEffect(() => {
        if (screen === 'game' && !isQuestionLoading) {
            const timer = setTimeout(() => {
            setScreen('correct');
            }, 15000);
            return () => clearTimeout(timer);
        }
    }, [screen, isQuestionLoading]);

    useEffect(() => {
        if (!isReadyScreen && countdown > 0) {
            setTimeout(() => setCountdown(c => c - 1), 1000);
        } else if (countdown === 0 && !isReadyScreen) {
            endPlayerTurn();
        }
    }, [countdown, isReadyScreen]);

    useEffect(() => {
        if (screen === 'game') {
            handleAllThemesSubmitted();
        }
    }, [screen, gamePlayerIndex]);

    useEffect(() => {
        if (screen === 'correct') {
            if(selectedAnswer == correctAnswer){
                setScores(prev => {
                    const updated = [...prev];
                    updated[gamePlayerIndex] += 10;
                    return updated;
                });
            }
            const timer = setTimeout(() => {
            if (gamePlayerIndex + 1 < numberOfPlayers) {
                setGamePlayerIndex(gamePlayerIndex + 1);
                setScreen('game'); 
            } else {
                setScreen('scores'); 
            }
            }, 5000); 
            return () => clearTimeout(timer);
        }
    }, [screen]);
            
    const handleSetupSubmit = () => {
        if (playerNames.length === numberOfPlayers && playerNames.every(name => name.trim() !== '')) {
        setScreen('theme');
        }
    };

    const updatePlayerName = (index: number, name: string) => {
        const updated = [...playerNames];
        updated[index] = name;
        setPlayerNames(updated);
    };

    const startPlayerTurn = () => {
        setCountdown(timePerRound);
        setIsReadyScreen(false);
    };

    const endPlayerTurn = async () => {
        if (playerIndex + 1 < numberOfPlayers) {
            setPlayerIndex(playerIndex + 1);
            setIsReadyScreen(true);
        } else {
            onThemeSelected(allThemes);
            await handleAllThemesSubmitted(); 
            setGamePlayerIndex(0); 
            setScreen('game');
        }
    };

    const submitTheme = () => {
        if (themeInput) {
            setAllThemes((prev) => [...prev, themeInput]);
            addFloatingWord(themeInput);
            setThemeInput('');
        }
    };

    const scoresRound = () => {
        setGamePlayerIndex(0);
        setScreen('game')
    };

    const handleAllThemesSubmitted = async () => {
        setIsQuestionLoading(true);
        const { question, answers } = await generateQuestionAndAnswers(allThemes);
        setQuestion(question);
        setAnswers(answers);
        setCorrectAnswer(answers[0]);
        setIsQuestionLoading(false);
    };


    return (
        <div className="theme-screen">

            {screen === 'setup' && (
                <div className="setup-screen">
                <h1>Pass & Play Setup</h1>
                <label>
                    Number of players:
                    <input
                    type="number"
                    min={1}
                    max={10}
                    value={numberOfPlayers}
                    onChange={(e) => {
                        const val = Number(e.target.value);
                        setNumberOfPlayers(val);
                    }}
                    />
                </label>
                <div className="player-name-inputs">
                    {Array.from({ length: numberOfPlayers }, (_, i) => (
                    <div key={i}>
                        <input
                        placeholder={`Player ${i + 1} name`}
                        value={playerNames[i] || ''}
                        onChange={(e) => updatePlayerName(i, e.target.value)}
                        />
                    </div>
                    ))}
                </div>
                <button onClick={handleSetupSubmit}>Start Theme Entry</button>
                </div>
            )}

            {screen === 'theme' && (
            isReadyScreen ? (
                <div className="ready-screen">
                <h1>Player {playerNames[playerIndex]}'s Turn!</h1>
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
                    <h2 className="text-xl mb-2">Player {playerNames[playerIndex]}, pick your theme</h2>
                    <canvas id="gameCanvas" className="theme-canvas"></canvas>
                    <div>
                    <input
                        value={themeInput}
                        onChange={(e) => setThemeInput(e.target.value)}
                        className="input-box"
                        placeholder="e.g. Space, History, Disney"
                    />
                    <button onClick={submitTheme}>Submit</button>
                    </div>
                </div>
                </div>
            )
            )}

            {screen === 'game' && (
            <div>
                <header className="theme-header">
                    <div className="progress-bar2"/> 
                </header>
                <h2>{playerNames[gamePlayerIndex]}'s turn to answer!</h2>
                <h1>{question}</h1>
                <button onClick={() => setSelectedAnswer(answers[0])} >{answers[0]}</button>
                <button onClick={() => setSelectedAnswer(answers[1])} >{answers[1]}</button>
                <button onClick={() => setSelectedAnswer(answers[2])} >{answers[2]}</button>
                <button onClick={() => setSelectedAnswer(answers[3])} >{answers[3]}</button>
            </div>
            )}

            {screen === 'correct' && (
            <div>
                <h1>The correct answer was {correctAnswer}</h1>
            </div>
            )}

            {screen === 'scores' && (
            <div>
                <h1>Score Screen</h1>
                {playerNames.map((name, i) => (
                <p key={i}>{name}: {scores[i]} point{scores[i] !== 1 ? 's' : ''}</p>
                ))}
                <button onClick={() => scoresRound()}>Next Round</button>
            </div>
            )}
        </div>
        );

}
