import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import mongoose from 'mongoose';
import Room from './roomModel.js';
import User from './userModel.js';
import OpenAI from 'openai';



mongoose.connect('mongodb+srv://castropablo38:bG5cLUrJ24oTYENP@triv-ai.1lobcqx.mongodb.net/?retryWrites=true&w=majority&appName=Triv-ai');
mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const openai = new OpenAI({ 
  apiKey: "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",  //add this key to db
  dangerouslyAllowBrowser: true,   //only keep this here while in development wil need to store key in backend soon
});

wss.on('connection', (ws) => {
  console.log('New client connected');
 
  ws.on('message', async (data) => {
    const msg = JSON.parse(data);

    switch (msg.type) {
      case 'CREATE_USER': {
        const { userId, userName } = msg;
        if (!userId || !userName) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Missing userId or userName' }));
          break;
        }
        const existing = await User.findById(userId);
        if (!existing) {
          const newUser = new User({ _id: userId, name: userName, ready: false });
          await newUser.save();
          console.log(`Created user: ${userName} (${userId})`);
        } else {
          existing.ready = false;
          existing.points = 0;
          await existing.save();
        }
        ws.send(JSON.stringify({ type: 'USER_CONFIRMED', userId }));
        break;
      }

      case 'CREATE_ROOM': {
        const { userId } = msg;
        const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
        
        ws.roomCode = roomCode;

        const newRoom = new Room({
          roomCode,
          players: [userId],
          themes: [],
          ready: false,
          currentRound: 0,
          scores: {}
        });
        await newRoom.save();
        ws.send(JSON.stringify({ type: 'ROOM_CREATED', roomCode }));
        await broadcastReadyCount(wss, roomCode);
        break;
        
      }

      case 'JOIN_ROOM': {
        const { roomCode, userId } = msg;
        const room = await Room.findOne({ roomCode });
        ws.roomCode = roomCode;

        if (room) {
          room.players.push(userId);
          const score = room.scores.get(userId) || 0;
          room.scores.set(userId, score);
          await room.save();
          const playersInRoom = await User.find({ _id: { $in: room.players } });
          const playerReady = playersInRoom.filter(p => p.ready).length;
          ws.send(JSON.stringify({ type: 'ROOM_JOINED', roomCode }));
          await broadcastReadyCount(wss, roomCode);
        } else {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found' }));
        }
        break;
      }

      case 'PLAYER_READY': {
        const { roomCode, userId } = msg;
        const room = await Room.findOne({ roomCode });
        ws.roomCode = roomCode; 
        if (!room) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found' }));
          return;
        }
        const user = await User.findOne({ _id: userId });
        if (!user) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'User not found' }));
          return;
        }
        user.ready = true;
        await user.save();
        
        await broadcastReadyCount(wss, roomCode);
        break;
      }

      case 'SUBMIT_THEME': {
        const { roomCode, theme} = msg;
        const room = await Room.findOne({ roomCode });
        ws.roomCode = roomCode; 
        if (!room) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found' }));
          return;
        }
        room.themes.push(theme);
        
        await room.save();
        
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client.roomCode === roomCode) {
              client.send(JSON.stringify({
                type: 'THEMES_SENT',
                roomCode,
                themes: theme
              }));
            }
          });
        break;
      }

      case 'QUESTION_READY': {
        const { roomCode } = msg;
        // console.log("Received QUESTION_READY for:", roomCode);
        const room = await Room.findOne({ roomCode });
        if (!room) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found' }));
          return;
        }
        if(room.ready === false){
          room.ready = true;
          await room.save();
          const theme = room.themes;
          const selectedThemes = getTwoRandomThemes(theme);
          let result = '';
          try{
            const response = await openai.chat.completions.create({
              model: 'gpt-3.5-turbo',
              temperature: 0.7,
              messages: [
                {
                  role: 'user',
                  content: `Return ONLY a valid JSON object in this exact format:
                    {
                      "question": "Your question here?",
                      "choices": ["Correct Answer", "Wrong Answer 1", "Wrong Answer 2", "Wrong Answer 3"]
                    }
                    The question should creatively combine these two themes: "${selectedThemes[0]}" and "${selectedThemes[1]}".
                    The question should be creative but **based on real, factual trivia** — nothing fictional or made-up and should be tailored for 10-30 year olds.
                    The answer should not be the same as any of the themes listed above.
                    The correct answer MUST be the first element in the "choices" array.
                    Do not add any extra explanation or text — just return the raw JSON.`
                }
              ]
            });
            result = JSON.parse(response.choices[0].message.content);
            room.correctAnswer = result.choices[0];
            await room.save();
          } catch (err) {
            console.log('error (chat-gpt)')
            result = 'Sorry, failed to generate a question.';
          }
          const startTime = Date.now() + 5000;
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client.roomCode === roomCode) {
              client.send(JSON.stringify({
                type: 'QUESTION_SENT',
                roomCode,
                themes: selectedThemes,
                question: result.question,
                answer: result.choices,
                startTime, 
                duration: 10000
              }));
            }
          });
        }

        break;
      }

      case 'ANSWER_SUBMISSION': {
        const { roomCode, userId, answer} = msg;
        const room = await Room.findOne({ roomCode });
        const scores = {};
        ws.roomCode = roomCode; 
        if (!room) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found' }));
          return;
        }
        if(answer === room.correctAnswer){
          const currentScore = room.scores.get(userId) || 0;
          const newScore = currentScore + 10;
          room.scores.set(userId, newScore);
          const user = await User.findOne({ _id: userId });
          if (user) {
            user.points = newScore;
            await user.save();
          }
        }
        room.ready = false;
        await room.save();

        const users = await User.find({ _id: { $in: room.players } });
        users.forEach(user => {
          scores[user._id] = {
            name: user.name,
            points: user.points,
          };
        });
        //console.log('About to send CORRECT_ANSWER:', room.correctAnswer);

        const startTime = Date.now() + 2500;
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client.roomCode === roomCode) {
              client.send(JSON.stringify({
                type: 'CORRECT_ANSWER',
                roomCode,
                correctAnswer: room.correctAnswer,
                scores,
                startTime, 
                duration: 2500
              }));
            }
          });
        break;
      }

    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// server.listen(3001, () => {
//   console.log('WebSocket server running on http://localhost:3001');
// });
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});



async function broadcastReadyCount(wss, roomCode) {
  const room = await Room.findOne({ roomCode });
  if (!room) return;

  const playersInRoom = await User.find({ _id: { $in: room.players } });
  const playerReady = playersInRoom.filter(p => p.ready).length;
  if(playerReady < room.players.length){
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.roomCode === roomCode) {
        client.send(JSON.stringify({
          type: 'PLAYER_READY_COUNT',
          roomCode,
          totalPlayers: room.players.length,
          playerReady,
        }));
      }
    });
  } else {
    const startTime = Date.now() + 5000;
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.roomCode === roomCode) {
        client.send(JSON.stringify({
          type: 'THEME_READY',
          roomCode,
          startTime,   
          duration: 30000
        }));
      }
    });
  }
}

function getTwoRandomThemes(themes) {
  if (themes.length < 1) return null;
  if (themes.length < 2) return [themes[0],themes[0]];

  const i = Math.floor(Math.random() * themes.length);
  let j = Math.floor(Math.random() * themes.length);
  while (j === i) {
    j = Math.floor(Math.random() * themes.length);
  } 
  return [themes[i], themes[j]];
}


app.post('/leaderboard/local/:userId', async (req, res) => {
  const { entries } = req.body; 
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');

    const combined = [...user.localLeaderBoard, ...entries]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); 

    user.localLeaderBoard = combined;
    await user.save();
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to update leaderboard');
  }
});


app.get('/leaderboard/top/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');

    const top = user.localLeaderBoard
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    res.json(top);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to fetch leaderboard');
  }
});
