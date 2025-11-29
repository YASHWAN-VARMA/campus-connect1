import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { getSession, seedInitialData } from './services/storage';
import { logout } from './services/auth';
import { Session } from './types';

const App: React.FC = () => {
  const [session, setSessionState] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize seed data if empty
    seedInitialData();
    
    // Check session
    const s = getSession();
    if (s) setSessionState(s);
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    const s = getSession();
    setSessionState(s);
  };

  const handleLogout = () => {
    logout();
    setSessionState(null);
  };

  if (loading) return <div className="min-h-screen bg-[#07060a]"></div>;

  return (
    <>
      {session ? (
        <Dashboard session={session} onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
};

export default App;