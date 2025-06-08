import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  _id: String,
  name: String,
  ready: Boolean,
  points: { type: Number, default: 0 }
});

const User = mongoose.model('User', UserSchema);
export default User;
