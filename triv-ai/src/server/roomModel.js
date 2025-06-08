import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  roomCode: String,
  players: [String],
  themes: [String],
  ready: Boolean,
  currentRound: Number,
  scores: { type: Map, of: Number },
  correctAnswer: { type: String, default: null, },
});

const Room = mongoose.model('Room', RoomSchema);
export default Room;
