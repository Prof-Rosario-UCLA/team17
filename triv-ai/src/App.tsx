import { useState } from 'react';
import AuthScreen from './components/AuthScreen';
import ThemeScreen from './components/ThemeScreen';
import GameScreen from './components/GameScreen';

function App() {
  const [currentScreen, setCurrentScreen] = useState<'auth' | 'theme' | 'game'>('auth'); // 👈 Starts on "auth"
  const [selectedTheme, setSelectedTheme] = useState('');

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      {currentScreen === 'auth' && (
        <AuthScreen onSuccess={() => setCurrentScreen('theme')} />
      )}
      {currentScreen === 'theme' && (
        <ThemeScreen onThemeSelected={(theme) => {
          setSelectedTheme(theme);
          setCurrentScreen('game');
        }} />
      )}
      {currentScreen === 'game' && (
        <GameScreen theme={selectedTheme} />
      )}
    </div>
  );
}

export default App;
// export default function App() {
//   return <h1 className="text-3xl font-bold">Hello, Triv.AI!</h1>;
// }
