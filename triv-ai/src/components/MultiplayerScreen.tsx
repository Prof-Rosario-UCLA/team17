import { useEffect, useRef, useState } from 'react';
import { addFloatingWord, initializeCanvas } from './ThemeCanvas';
import AuthScreen from './AuthScreen';


export default function MultiplayerTest() {
  const socketRef = useRef<WebSocket | null>(null);
  const roomCodeRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [userId, setuserId] = useState<string | null>(null);
  const [playersReady, setplayersReady] = useState(0);
  const [numberPlayers, setnumberPlayers] = useState(0);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [status, setStatus] = useState('');
  const [themeInput, setThemeInput] = useState('');
  const [userName, setUserName] = useState('');
  const [themes, setThemes] = useState(['']);
  const [screen, setScreen] = useState<'auth' | 'lobby' | 'ready' | 'theme' | 'game'>('auth');
  const [remainingTime, setRemainingTime] = useState<number>(30);
  const [usedTheme, setUsedTheme] = useState(['']);
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState(['']);

  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3001');
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
          setScreen('lobby');
          localStorage.setItem("screen", "lobby");
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
          const endTime = msg.startTime + msg.duration;
          const interval = setInterval(() => {
            setScreen('theme');
            localStorage.setItem("screen", "theme");
            const remaining = endTime - Date.now();
            if (remaining <= 0) {
              clearInterval(interval);
              setRemainingTime(0);
              setScreen('game');
              localStorage.setItem("screen", "game");
              gameReady();
            } else {
              setRemainingTime(Math.ceil(remaining / 1000));
            }
          }, 100);

          break;
        case 'THEMES_SENT':
          if (msg.themes) addFloatingWord(msg.themes);
          break;
        case 'QUESTION_SENT':
          if(msg.themes) setUsedTheme(msg.themes);
          if(msg.question) setQuestion(msg.question);
          if(msg.answer) setAnswers(msg.answer);
          break;
        case 'ERROR':
          setStatus(`Error: ${msg.message}`);
          break;
      }
    };

    return () => socketRef.current?.close();
  }, []);

  useEffect(() => {
    if (screen === 'theme') {
      initializeCanvas();
    }
  }, [screen]);

  const handleCreateUser = () => {
    const id = crypto.randomUUID();   
    setuserId(id);   

    socketRef.current?.send(JSON.stringify({
      type: 'CREATE_USER',
      userId: id,
      userName,
    }));
  };

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
        </div>
      )}
      <h1 className="text-2xl font-bold">Triv.ai</h1>

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
            const id = crypto.randomUUID();
            setuserId(id);
            setUserName(user.name);

            localStorage.setItem("screen", "lobby");
            localStorage.setItem("user", JSON.stringify({ id, name: user.name, picture: user.picture }));

            // Notify server
            socketRef.current?.send(JSON.stringify({
              type: 'CREATE_USER',
              userId: id,
              userName: user.name,
            }));

            setScreen('lobby');
            localStorage.setItem("screen", "lobby");
          }}
        />
      )}

      {screen === 'lobby' && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold">Welcome {userName} !</h1>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={createRoom}
          >
            Create Room
          </button>

          <div>
            <input
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              placeholder="Enter room code"
              className="border p-2 mr-2"
            />
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={joinRoom}
            >
              Join Room
            </button>
          </div>
        </div>
      )}

      {screen === 'ready' && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold">Welcome to room: {roomCode}</h1>
          <div> Once all players have joined press the ready button </div>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={playerReady}
          >
            Ready!
          </button>
          <div> {playersReady} out of {numberPlayers} players have readied up</div>
        </div>
      )}

      {screen === 'theme' && (
        <div className="space-y-4">
          <h1 className="font-bold">You have {remainingTime} seconds to submit the themes !</h1>
          <canvas id="gameCanvas" className="mx-auto border w-full max-w-[800px] aspect-[4/3]"></canvas>
          <input
              value={themeInput}
              onChange={(e) => setThemeInput(e.target.value)}
              placeholder="e.g. Space, History, Disney"
              className="border p-2"
          />
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={submitTheme}
          > Submit </button>
        </div>
      )}

      {screen === 'game' && (
        <div className="space-y-4">
          <h1 className="font-bold"> Game Time! Question based off of {usedTheme[0]} and {usedTheme[1]} !</h1>
          <div> Question {question} !</div>
          <button>{answers[0]}</button>
          <button>{answers[1]}</button>
          <button>{answers[2]}</button>
          <button>{answers[3]}</button>
        </div>
      )}

    </div>
  );
}
