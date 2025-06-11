import { useState, useEffect } from 'react';
import './ThemeScreen.css';
import { initializeCanvas, addFloatingWord } from './ThemeCanvas';
import { generateQuestionAndAnswers } from './GameScreen';

export default function ThemeScreen({ onThemeSelected, onExit, userId }: { onThemeSelected: (theme: string[]) => void; onExit: () => void; userId: string | null;}) {
    const [screen, setScreen] = useState<'setup' | 'theme' | 'game' | 'scores' | 'correct'| 'end'>('setup');
    const [round, setRound] = useState(1);
    const totalRounds = 3;

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
    const [topScores, setTopScores] = useState<{ name: string; score: number }[]>([]);


    useEffect(() => {
        if (screen === 'end' && userId) {
            sendScoresToDB();
            getLeaderBoard();
        }
    }, [screen, userId]);

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
                if (round < totalRounds) {
                    setRound(prev => prev + 1);
                    setGamePlayerIndex(0);
                    setScreen('scores');
                } else {
                    setScreen('end');
                } 
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
        } else  {
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

    const sendScoresToDB = async () => {
      try {
        const entries = playerNames.map((name, index) => ({
          name,
          score: scores[index]
        }));
          await fetch(`wss://cs144-25s-emanuelzavalza.uw.r.appspot.com/leaderboard/local/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entries })
        });
      } catch (err) {
        console.error("Failed to submit scores", err);
      }
    };

    const getLeaderBoard = () => {
        fetch(`wss://cs144-25s-emanuelzavalza.uw.r.appspot.com/leaderboard/top/${userId}`)
        .then(res => res.json())
        .then(data => setTopScores(data))
            
    }

    return (
        <div className="theme-screen">
            {screen === 'setup' && (
                <div className="setup-screen">
                <h1 className='welcome-heading'>Who's Playing?</h1>
                <div className='subtext'>
                Set how many players are joining in and tell us their names!
                </div>
                <label className="subtext">
                    Number of players : 
                    <input
                    className='input-field'
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
                        className='input-field'
                        placeholder={`Enter name for Player ${i + 1}`}
                        value={playerNames[i] || ''}
                        onChange={(e) => updatePlayerName(i, e.target.value)}
                        />
                    </div>
                    ))}
                </div>
                <button className='menu-button2' onClick={handleSetupSubmit}>Start the Theme Challenge</button>
                </div>
            )}

            {screen === 'theme' && (
            isReadyScreen ? (
                <div className="ready-screen">
                <h1>It's {playerNames[playerIndex]}'s Turn!</h1>
                <h2>Rapid fire: Enter as many fun themes as you can in 30 seconds!</h2>
                <button className="ready-button" onClick={startPlayerTurn}>
                    Start
                </button>
                </div>
            ) : (
                <div>
                <header className="theme-header">
                    <div className="progress-bar"/> 
                </header>
                <div className='theme-container'>
                
                <div className='theme-wrapper'>
                    <h2 className="welcome-heading"><span className='username'>{playerNames[playerIndex]}</span>, pick your themes!</h2>
                    <canvas id="gameCanvas" className="canvas-box"></canvas>
                    <div>
                    <input
                        value={themeInput}
                        onChange={(e) => setThemeInput(e.target.value)}
                        className="input-field"
                        placeholder="e.g. Space, History, Disney"
                    />
                    <button className='menu-button2' onClick={submitTheme}>Submit</button>
                    </div>
                </div>
                </div>
                </div>
            )
            )}

            {screen === 'game' && (
            <div>
                <header className="theme-header2">
                    <div className="progress-bar2"/> 
                </header>
                <div className='theme-wrapper'>
                <h2 className="welcome-heading" ><span className='username'>{playerNames[gamePlayerIndex]}</span>'s turn to answer!</h2>
                <h1 className='question-text'>{question}</h1>
                <div className="answer-grid">
                    <button className='answer-button' onClick={() => setSelectedAnswer(answers[0])} >{answers[0]}</button>
                    <button className='answer-button' onClick={() => setSelectedAnswer(answers[1])} >{answers[1]}</button>
                    <button className='answer-button' onClick={() => setSelectedAnswer(answers[2])} >{answers[2]}</button>
                    <button className='answer-button' onClick={() => setSelectedAnswer(answers[3])} >{answers[3]}</button>
                </div>
                </div>
            </div>
            )}

            {screen === 'correct' && (
            <div className="ready-screen">
                <h1>The correct answer was {correctAnswer}</h1>
            </div>
            )}

            {screen === 'scores' && (
            <div className='theme-wrapper2'>
                <h1 className='welcome-heading'>Round <span className='username'>{round - 1}</span>'s Score Screen</h1>
                {playerNames.map((name, i) => (
                <p className='subtext' key={i}>{name}: {scores[i]} points</p>
                ))}
                <button className='menu-button2' onClick={() => scoresRound()}>Next Round</button>
            </div>
            )}

            {screen === 'end' && (
            <div className='theme-wrapper2'>
                <h1 className='welcome-heading'>That’s a wrap! <span className="username">Here are your scores:</span></h1>
                <div className='theme-wrapper3'>
                    {playerNames.map((name, i) => (
                    <p className='subtext' key={i}> <strong>{name}</strong>: {scores[i]} points</p>
                    ))}
                </div>
                <h1 className='welcome-heading'>All-Time Leaderboard — <span className="username">Top 5 High Scores</span></h1>
                {topScores.map((entry, i) => (
                    <p className='subtext' key={i}>
                    <strong>{i + 1}. {entry.name}</strong> — {entry.score} point{entry.score !== 1 ? 's' : ''}
                    </p>
                ))}
                <button className='menu-button2' onClick={onExit}>Go Home</button>
            </div>
            )}
        </div>
        );

}

