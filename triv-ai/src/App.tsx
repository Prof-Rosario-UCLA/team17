import { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import ThemeScreen from './components/ThemeScreen';
import GameScreen from './components/GameScreen';

function App() {
  // states for the different modes of the SPA
  const [currentScreen, setCurrentScreen] = useState<'auth' | 'theme' | 'game'>('auth'); // 👈 Starts on "auth"
  
  // themes of the trivia questions
  const [selectedTheme, setSelectedTheme] = useState('');

  // variables for user information
  const [user, setUser] = useState<any>(null);


  // Load user from localStorage on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setCurrentScreen('theme'); // Skip auth screen
    }
  }, []);

  // Logout logic
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setCurrentScreen('auth');
  };

  // Login logic from AuthScreen
  const handleLogin = (userInfo: any) => {
    setUser(userInfo);
    localStorage.setItem('user', JSON.stringify(userInfo));
    setCurrentScreen('theme');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center px-4 py-6">
      {/* ✅ Top User Info Bar (always visible when user is logged in) */}
      {user && (
        <div className="flex items-center justify-between w-full max-w-3xl mb-6 bg-blue-100 px-4 py-2 rounded shadow">
          <div className="flex items-center gap-3">
            <img src={user.picture} alt="User" className="w-10 h-10 rounded-full" />
            <span className="text-lg font-semibold">{user.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      )}

      {/* ✅ Dynamic Screen Content */}
      <div className="w-full max-w-3xl flex-grow flex items-center justify-center">
        {currentScreen === 'auth' && (
          <AuthScreen
            onLogin={(userInfo) => {
              setUser(userInfo);
              setCurrentScreen('theme');
            }}
          />
        )}
        {currentScreen === 'theme' && (
          <ThemeScreen
            onThemeSelected={(theme) => {
              setSelectedTheme(theme);
              setCurrentScreen('game');
            }}
          />
        )}
        {currentScreen === 'game' && (
          <GameScreen theme={selectedTheme} user={user} />
        )}
      </div>
    </div>
  );
}
export default App;
