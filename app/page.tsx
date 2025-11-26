'use client';

import React, { useState, useEffect } from 'react';
import { ChatPage } from '@/components/ChatPage';
import { LoginPage } from '@/pages/LoginPage';
import { Language } from '@/translations';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [language, setLanguage] = useState<Language>('zh');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang) setLanguage(savedLang);

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
    localStorage.setItem('agno_auth', 'false');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} language={language} />;
  }

  return <ChatPage onLogout={handleLogout} />;
}