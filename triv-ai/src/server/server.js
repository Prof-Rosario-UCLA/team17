import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import mongoose from 'mongoose';
import Room from './roomModel.js';
import User from './userModel.js';


mongoose.connect('mongodb+srv://castropablo38:bG5cLUrJ24oTYENP@triv-ai.1lobcqx.mongodb.net/?retryWrites=true&w=majority&appName=Triv-ai');
mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

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
                themes: room.themes
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

server.listen(3001, () => {
  console.log('WebSocket server running on http://localhost:3001');
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
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.roomCode === roomCode) {
        client.send(JSON.stringify({
          type: 'THEME_READY',
          roomCode,
        }));
      }
    });
  }
}