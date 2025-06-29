import { useEffect, useRef, useState } from 'react';
import { addFloatingWord, initializeCanvas } from './ThemeCanvas';
import AuthScreen from './AuthScreen';
import ThemeScreen from './ThemeScreen';


export default function MultiplayerTest() {
  const socketRef = useRef<WebSocket | null>(null);
  const roomCodeRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const selectedAnswerRef = useRef('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [userId, setuserId] = useState<string | null>(null);
  const [playersReady, setplayersReady] = useState(0);
  const [numberPlayers, setnumberPlayers] = useState(0);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [themeInput, setThemeInput] = useState('');
  const [userName, setUserName] = useState('');
  const [screen, setScreen] = useState<'auth' | 'lobby' | 'ready' | 'theme' | 'game' | 'scores' | 'local'| 'pass-n-play'>('auth');
  const [remainingTime, setRemainingTime] = useState<number>(30);
  const [remainingTime1, setRemainingTime1] = useState<number>(30);
  const [remainingTime2, setRemainingTime2] = useState<number>(30); 
  const themeIntervalRef = useRef<number | null>(null);
  const gameIntervalRef = useRef<number | null>(null);
  const scoreIntervalRef = useRef<number | null>(null);
  // const [cookieBannerDismissed, setCookieBannerDismissed] = useState(false);


  // const [usedTheme, setUsedTheme] = useState(['']);
  // const [setUsedTheme] = useState(['']);
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [scores, setScores] = useState<{ [userId: string]: { name: string, points: number } }>({});

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);


  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);
  useEffect(() => {
    selectedAnswerRef.current = selectedAnswer;
  }, [selectedAnswer]);

  useEffect(() => {
    const socket = new WebSocket('wss://cs144-25s-emanuelzavalza.uw.r.appspot.com');
    socketRef.current = socket;
    
    const savedUser = localStorage.getItem("user");
    const savedScreen = localStorage.getItem("screen");

    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setuserId(parsed.id);
      setUserName(parsed.name);

      socket.onopen = () => {
        console.log('Connected to WebSocket server');

        socket.send(JSON.stringify({
          type: 'CREATE_USER',
          userId: parsed.id,
          userName: parsed.name,
        }));

        if (savedScreen) {
          setScreen(savedScreen as any);
        } else {
          setScreen('lobby');
        }
      };
    }

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log('Server:', msg);

      switch (msg.type) {
        case 'USER_CONFIRMED':
          setScreen('local');
          localStorage.setItem("screen", "local");
          break;
        case 'ROOM_CREATED':
          setRoomCode(msg.roomCode);
          setScreen('ready');
          localStorage.setItem("screen", "ready");
          break;
        case 'ROOM_JOINED':
          setRoomCode(msg.roomCode);
          setScreen('ready');
          localStorage.setItem("screen", "ready");
          break;
        case 'USER_JOINED':
          break;
        case 'PLAYER_READY_COUNT':
          setnumberPlayers(msg.totalPlayers);
          setplayersReady(msg.playerReady);
          break;
        case 'THEME_READY':
          const endTime1 = msg.startTime + msg.duration;
          if (themeIntervalRef.current !== null) clearInterval(themeIntervalRef.current);
          themeIntervalRef.current = setInterval(() => {
            setScreen('theme');
            localStorage.setItem("screen", "theme");
            const remaining = endTime1 - Date.now();
            if (remaining <= 0) {
              clearInterval(themeIntervalRef.current!);
              setRemainingTime(0);
              setScreen('game');
              localStorage.setItem("screen", "game");
              gameReady();
            } else {
              setRemainingTime(Math.floor(remaining / 1000));
            }
          }, 100);

          break;
        case 'THEMES_SENT':
          if (msg.themes) addFloatingWord(msg.themes);
          break;
        case 'QUESTION_SENT':
          // if(msg.themes) setUsedTheme(msg.themes);
          if(msg.question) setQuestion(msg.question);
          if(msg.answer) setAnswers(msg.answer);
          setScreen('game');
          const endTime2 = msg.startTime + msg.duration;
          
          if (gameIntervalRef.current !== null) clearInterval(gameIntervalRef.current);
          gameIntervalRef.current = setInterval(() => {
            const remaining = endTime2 - Date.now();
            if (remaining <= 0) {
              clearInterval(gameIntervalRef.current!);
              setRemainingTime1(0);
              answerSent();
            } else {
              setRemainingTime1(Math.floor(remaining / 1000));
            }
          }, 100);

          break;
        case 'CORRECT_ANSWER':
          if(msg.correctAnswer) setSelectedAnswer(msg.correctAnswer);
          if(msg.scores) setScores(msg.scores);
          setScreen('scores');
          const endTime3 = msg.startTime + msg.duration;
          if (scoreIntervalRef.current !== null) clearInterval(scoreIntervalRef.current);
          scoreIntervalRef.current = setInterval(() => {
            const remaining = endTime3 - Date.now();
            if (remaining <= 0) {
              clearInterval(scoreIntervalRef.current!);
              setRemainingTime2(0);
              gameReady();
            } else {
              setRemainingTime2(Math.floor(remaining / 1000));
            }
          }, 100);

          break;
        case 'ERROR':
          break;
      }
    };

    return () => {
    socketRef.current?.close();
    if (themeIntervalRef.current !== null) clearInterval(themeIntervalRef.current);
    if (gameIntervalRef.current !== null) clearInterval(gameIntervalRef.current);
    if (scoreIntervalRef.current !== null) clearInterval(scoreIntervalRef.current);
  };
}, []);

  useEffect(() => {
    if (screen === 'theme') {
      initializeCanvas();
    }
  }, [screen]);

  const createRoom = () => {
    socketRef.current?.send(JSON.stringify({
      type: 'CREATE_ROOM',
      userId: userIdRef.current,
    }));
  };

  const joinRoom = () => {
    socketRef.current?.send(JSON.stringify({
      type: 'JOIN_ROOM',
      roomCode: joinCodeInput.toUpperCase(),
      userId: userIdRef.current,
    }));
  };

  const playerReady = () => {
    socketRef.current?.send(JSON.stringify({
      type: 'PLAYER_READY',
      roomCode: roomCodeRef.current,
      userId: userIdRef.current,
    }));
  };

  const submitTheme = () => {
    if (!themeInput.trim()) return;

    socketRef.current?.send(JSON.stringify({
      type: 'SUBMIT_THEME',
      roomCode: roomCodeRef.current,
      theme: themeInput.trim()
    }));

    setThemeInput('');
  };

  const gameReady = () => {
    // console.log("Sending QUESTION_READY with roomCode:", roomCodeRef.current);
    socketRef.current?.send(JSON.stringify({
      type: 'QUESTION_READY',
      roomCode: roomCodeRef.current,
    }));
  };

  const answerSent = () => {
    // console.log("Sending QUESTION_READY with roomCode:", roomCodeRef.current);
    socketRef.current?.send(JSON.stringify({
      type: 'ANSWER_SUBMISSION',
      roomCode: roomCodeRef.current,
      userId: userIdRef.current,
      answer: selectedAnswerRef.current
    }));
  };

  const multiplayer = () => {
      setScreen('lobby');
      localStorage.setItem("screen", "lobby");
  };


  return (
    <div className="text-center space-y-6 p-6 ">
      {/* Top User Info Bar (always visible when user is logged in) */}
      
      {userName && (
        <div className="top-bar">
          <div className="user-info">
            <img 
              src={JSON.parse(localStorage.getItem("user") || "{}").picture} 
              alt="User" 
              className="w-[40px] h-[40px] rounded-full" />
            <span className="text-lg font-semibold">{userName}</span>
          </div>
          <div>
          <button
            onClick={() => {
              localStorage.removeItem("user");
              localStorage.removeItem("screen");
              window.location.reload(); 
            }}
            className="logout-button"
          >
            Logout
          </button>
          <button
            onClick={() => {
              setScreen('local');
            }}
            className="logout-button"
          >
            Home
          </button>
          </div>
        </div>
      )}

      {!isOnline && (
        <div className="offline-banner">
          <p>You're offline. We'll reconnect when you're back online...</p>
        </div>
      )}

      {screen === 'auth' && (
        // <div>
        //   <input
        //     value={userName}
        //     onChange={(e) => setUserName(e.target.value)}
        //     placeholder="Enter your name"
        //     className="border p-2 mr-2"
        //   />
        //   <button
        //     className="bg-indigo-600 text-white px-4 py-2 rounded"
        //     onClick={handleCreateUser}
        //   >
        //     Create User
        //   </button>
        // </div>
        <AuthScreen
          onLogin={(user: any) => {
            const id = user.id;
            setuserId(id);
            setUserName(user.name);

            localStorage.setItem("user", JSON.stringify(user));

            // Notify server
            socketRef.current?.send(JSON.stringify({
              type: 'CREATE_USER',
              userId: id,
              userName: user.name,
            }));

            setScreen('local');
            localStorage.setItem("screen", "local");
          }}
        />
      )}

      {screen === 'local' && (
        <div className="flex flex-col items-center justify-center text-center space-y-4">
        <h1 className='welcome-heading'> Triv<span className='username'>.ai</span> </h1>

          <button
          className="menu-button"
          onClick={() => setScreen('pass-n-play')}
          > Local Play</button>

          <button 
          className="menu-button"
          onClick={multiplayer}
          > Multiplayer </button>
          {/* {!cookieBannerDismissed && (
            <div className="fixed bottom-4 left-4 right-4 bg-gray-800 text-white text-sm p-4 rounded shadow-lg flex justify-between items-center z-50">
              <span>
                We use cookies to store your basic Google login data for gameplay.
              </span>
              <button
                onClick={() => setCookieBannerDismissed(true)}
                className="ml-4 px-3 py-1 bg-white text-gray-800 rounded hover:bg-gray-200"
              >
                Got it
              </button>
            </div>
          )} */}
        </div>
      )}
      
      {screen === 'pass-n-play' && (
        <ThemeScreen onThemeSelected={(themes: string[]) => {
          console.log('Selected themes:', themes);}}
          onExit={() => setScreen('local')}
          userId = {userIdRef.current}
          // You can store or send these themes however you'd like
         />
      )}

      {screen === 'lobby' && (
        <div className="space-y-4">
          <h1 className="welcome-heading">
            Welcome <span className="username">{userName}</span>!
          </h1>
          <div className="flex flex-col items-center gap-4 mt-8">
            <button className="menu-button2" onClick={createRoom} >Create Room</button>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter room code"
                className="input-field"
                onChange={(e) => setJoinCodeInput(e.target.value)}
              />
              <button className="menu-button2" onClick={joinRoom}>Join Room</button>
            </div>
          </div>
        </div>
      )}

      {screen === 'ready' && (
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <h1 className="welcome-heading">You're In! Room Code: <span className='username'>{roomCode}</span></h1>
          <div className='subtext'> Invite your friends using the code above. Once everyone’s in, hit <strong>Ready!</strong> to start the fun! </div>
          <button
            className="menu-button2"
            onClick={playerReady}
          >
            Ready!
          </button>
          <div className='subtext' > {playersReady} / {numberPlayers} players are ready to play!</div>
        </div>
      )}

      {screen === 'theme' && (
        <div className="theme-container">
          <h1 className="welcome-heading">You have <span className='username'>{remainingTime}</span> seconds to submit the themes !</h1>
          <canvas id="gameCanvas" className="canvas-box"></canvas>
          <div className='theme-input-group'>
            <input
                value={themeInput}
                onChange={(e) => setThemeInput(e.target.value)}
                placeholder="e.g. Space, History, Disney"
                className="input-field"
            />
            <button
              className="menu-button2"
              onClick={submitTheme}
            > Submit </button>
          </div>
        </div>
      )}

      {screen === 'game' && (
        <div className="flex flex-col items-center justify-center px-4 py-6 space-y-6">
          <h1 className="welcome-heading"> Game Time! <span className='username'>{remainingTime1} </span> seconds left!</h1>
          <div className='question-text'>{question}</div>
          <div className="answer-grid">
          <button
              onClick={() => setSelectedAnswer(answers[0])}
              className={`answer-button ${selectedAnswerRef.current === answers[0] ? 'selected' : ''}`}
            >
              {answers[0]}
          </button>
          <button
              onClick={() => setSelectedAnswer(answers[1])}
              className={`answer-button ${selectedAnswerRef.current === answers[1] ? 'selected' : ''}`}
            >
              {answers[1]}
          </button>
          <button
              onClick={() => setSelectedAnswer(answers[2])}
              className={`answer-button ${selectedAnswerRef.current === answers[2] ? 'selected' : ''}`}
            >
              {answers[2]}
          </button>
          <button
              onClick={() => setSelectedAnswer(answers[3])}
              className={`answer-button ${selectedAnswerRef.current === answers[3] ? 'selected' : ''}`}
            >
              {answers[3]}
          </button>
          </div>
        </div>
      )}

      {screen === 'scores' && (
        <div className="space-y-4">
          <h1 className="welcome-heading">{remainingTime2} seconds to next round !</h1>
          <h2 className="subtext">Current Scores:</h2>
          <ul className="subtext">
            {Object.entries(scores).map(([userId, data]) => (
              <li key={userId}>
                <strong>{data.name}</strong>: {data.points} points
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
