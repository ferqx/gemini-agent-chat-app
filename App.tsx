
import React, { useState, useEffect } from 'react';
import { ChatPage } from './pages/ChatPage';
import { LoginPage } from './pages/LoginPage';
import { Language } from './translations';

const App: React.FC = () => {
  // Simple Auth State Management
  // Default to true so ChatPage is the starting screen (as requested)
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [language, setLanguage] = useState<Language>('zh'); // Lift language up to pass to Login

  useEffect(() => {
    // Check local storage for language preference
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang) {
      setLanguage(savedLang);
    }

    // Check if user explicitly logged out previously
    // If 'agno_auth' is 'false', we respect the logout. 
    // Otherwise (null or 'true'), we default to authenticated.
    const storedAuth = localStorage.getItem('agno_auth');
    if (storedAuth === 'false') {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem('agno_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Explicitly set to false to persist logout state across refreshes if desired
    localStorage.setItem('agno_auth', 'false');
    setIsAuthenticated(false);
  };

  return (
    <>
      {isAuthenticated ? (
        <ChatPage onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} language={language} />
      )}
    </>
  );
};

export default App;
