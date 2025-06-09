import { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import ThemeScreen from './components/ThemeScreen';
import { generateQuestionAndAnswers } from './components/GameScreen';

import MultiplayerScreen from './components/MultiplayerScreen';
import "./App.css";

function App() {
  // states for the different modes of the SPA
  // const [currentScreen, setCurrentScreen] = useState<'auth' | 'theme' | 'game' | 'multiplayer'>('multiplayer'); // 👈 Starts on "auth"
  
  // themes of the trivia questions
  // const [selectedTheme, setSelectedTheme] = useState('');

  // variables for user information
  // const [user, setUser] = useState<any>(null);


  // Load user from localStorage on app load
  // useEffect(() => {
  //   const storedUser = localStorage.getItem('user');
  //   if (storedUser) {
  //     setUser(JSON.parse(storedUser));
  //     setCurrentScreen('lobby'); // Skip auth screen
  //   }
  // }, []);

  // Logout logic
  // const handleLogout = () => {
  //   setUser(null);
  //   localStorage.removeItem('user');
  //   setCurrentScreen('auth');
  // };

  // Login logic from AuthScreen
  // const handleLogin = (userInfo: any) => {
  //   setUser(userInfo);
  //   localStorage.setItem('user', JSON.stringify(userInfo));
  //   setCurrentScreen('theme');
  // };

  return (
    <div className="h-screen flex flex-col items-center">
      {/* Top User Info Bar (always visible when user is logged in) */}
      {/* {user && (
        <div className="top-bar">
          <div className="user-info">
            <img src={user.picture} alt="User" className="w-[40px] h-[40px] rounded-full" />
            <span className="text-lg font-semibold">{user.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="logout-button"
          >
            Logout
          </button>
        </div>
      )} */}

      <div className="w-full max-w-3xl flex-grow flex items-center justify-center">
        <MultiplayerScreen/>
      </div>
    </div>
  );
}

export default App;
