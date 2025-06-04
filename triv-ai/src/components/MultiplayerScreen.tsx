import { useEffect, useRef, useState } from 'react';
import { addFloatingWord, initializeCanvas } from './ThemeCanvas';


export default function MultiplayerTest() {
  const socketRef = useRef<WebSocket | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [userId, setuserId] = useState<string | null>(null);
  const [playersReady, setplayersReady] = useState(0);
  const [numberPlayers, setnumberPlayers] = useState(0);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [status, setStatus] = useState('');
  const [themeInput, setThemeInput] = useState('');
  const [userName, setUserName] = useState('');
  const [themes, setThemes] = useState(['']);
  const [screen, setScreen] = useState<'auth' | 'lobby' | 'ready' | 'theme'>('auth');

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3001');
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log('Server:', msg);

      switch (msg.type) {
        case 'USER_CONFIRMED':
          setScreen('lobby');
          break;
        case 'ROOM_CREATED':
          setRoomCode(msg.roomCode);
          setScreen('ready');
          break;
        case 'ROOM_JOINED':
          setRoomCode(msg.roomCode);
          setScreen('ready');
          break;
        case 'USER_JOINED':
          break;
        case 'PLAYER_READY_COUNT':
          setnumberPlayers(msg.totalPlayers);
          setplayersReady(msg.playerReady);
          break;
        case 'THEME_READY':
          setScreen('theme');
          break;
        case 'THEMES_SENT':
          if (msg.themes) addFloatingWord(msg.themes);
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
      userId,
    }));
  };

  const joinRoom = () => {
    socketRef.current?.send(JSON.stringify({
      type: 'JOIN_ROOM',
      roomCode: joinCodeInput.toUpperCase(),
      userId
    }));
  };

  const playerReady = () => {
    socketRef.current?.send(JSON.stringify({
      type: 'PLAYER_READY',
      roomCode: roomCode,
      userId,
    }));
  };

  const submitTheme = () => {
    if (!themeInput.trim()) return;

    socketRef.current?.send(JSON.stringify({
      type: 'SUBMIT_THEME',
      roomCode,
      theme: themeInput.trim()
    }));

    setThemeInput('');
  };

  return (
    <div className="text-center space-y-6 p-6">
      <h1 className="text-2xl font-bold">Triv.ai</h1>

      {screen === 'auth' && (
        <div>
          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name"
            className="border p-2 mr-2"
          />
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded"
            onClick={handleCreateUser}
          >
            Create User
          </button>
        </div>
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
          <h1 className="text-xl font-bold">Welcome to room: {roomCode} !</h1>
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
          <h1 className="text-xl font-bold">Submit the themes !</h1>
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
          <div> current themes are {themes} </div>
        </div>
      )}
    </div>
  );
}
