import React, { useState, useEffect } from 'react';
import { login, signup, changePassword } from '../services/auth';
import { Role } from '../types';
import { Eye, EyeOff, ShieldCheck, User as UserIcon, GraduationCap } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<Role>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  
  // Password Change Modal State
  const [showModal, setShowModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    // Clear inputs on tab switch
    setEmail('');
    setPassword('');
    setMsg(null);
  }, [activeTab]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMsg({ text: 'Enter both email and passkey', type: 'error' });
      return;
    }

    const res = login(email, password, activeTab);
    if (!res.success) {
      setMsg({ text: res.msg, type: 'error' });
    } else {
      if (res.mustChange) {
        setPendingEmail(email);
        setShowModal(true);
        setMsg(null);
      } else {
        onLoginSuccess();
      }
    }
  };

  const handleSignup = () => {
    const raw = prompt(`Enter ${activeTab} college email:`);
    if (!raw) return;
    const res = signup(raw, activeTab);
    setMsg({ text: res.msg, type: res.success ? 'success' : 'error' });
  };

  const handleChangePassword = () => {
    if (!newPass || !confirmPass) {
      setModalError('Please fill all fields');
      return;
    }
    if (newPass !== confirmPass) {
      setModalError('Passkeys do not match');
      return;
    }
    if (newPass.length < 6) {
      setModalError('Passkey must be at least 6 characters');
      return;
    }
    if (pendingEmail) {
      changePassword(pendingEmail, newPass);
      setShowModal(false);
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-bg1 to-bg2 p-4 font-sans text-gray-100">
      <div className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-[1fr_420px] gap-8 items-center">
        
        {/* Hero Section */}
        <div className="hidden md:flex flex-col justify-between min-h-[380px] p-8 rounded-2xl bg-white/[0.01] border border-white/[0.02] shadow-2xl">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-orange to-brand-purple flex items-center justify-center text-bg1 font-bold text-2xl shadow-lg shadow-brand-orange/20">
                {'<%>'}
              </div>
              <div>
                <h3 className="font-bold text-xl leading-none">Vedam school of technology</h3>
                <span className="text-muted text-sm">Student platform</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Welcome back</h1>
            <p className="text-muted leading-relaxed text-lg">
              Log in to access your schedule, courses, announcements and campus services. 
              Connect with seniors and participate in campus discussions.
            </p>
          </div>
          <div className="text-sm text-muted/60">
            Need help? Visit the student helpdesk or contact the admin team.
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full bg-white/[0.012] backdrop-blur-sm border border-white/[0.03] rounded-2xl p-6 shadow-2xl relative">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1">Sign in</h2>
            <p className="text-muted text-sm">Enter your credentials to continue.</p>
          </div>

          <div className="flex bg-panel rounded-xl p-1 mb-6 border border-white/[0.04]">
            <button
              onClick={() => setActiveTab('student')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'student' 
                  ? 'bg-gradient-to-r from-brand-orange via-brand-pink to-brand-purple text-bg1 shadow-lg' 
                  : 'text-muted hover:text-white'
              }`}
            >
              <GraduationCap size={16} /> Student
            </button>
            <button
              onClick={() => setActiveTab('teacher')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'teacher' 
                  ? 'bg-gradient-to-r from-brand-orange via-brand-pink to-brand-purple text-bg1 shadow-lg' 
                  : 'text-muted hover:text-white'
              }`}
            >
              <UserIcon size={16} /> Teacher
            </button>
          </div>

          {msg && (
            <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
              msg.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
            }`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Email</label>
              <div className="bg-panel border border-white/[0.04] rounded-xl flex items-center px-3 py-3 focus-within:border-brand-purple/50 transition-colors">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent border-none outline-none text-gray-100 placeholder-gray-600 flex-1 text-sm"
                  placeholder={`${activeTab}@college.edu`} 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Passkey</label>
              <div className="bg-panel border border-white/[0.04] rounded-xl flex items-center px-3 py-3 focus-within:border-brand-purple/50 transition-colors">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-none outline-none text-gray-100 placeholder-gray-600 flex-1 text-sm"
                  placeholder="Passkey" 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted pt-1">
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input type="checkbox" className="rounded bg-panel border-white/10" /> Remember me
              </label>
              <button type="button" onClick={() => alert('Use the common passkey for first login')} className="hover:text-white hover:underline">Forgot?</button>
            </div>

            <button type="submit" className="w-full py-3.5 rounded-full bg-gradient-to-r from-brand-orange via-brand-pink to-brand-purple text-bg1 font-bold text-sm shadow-lg shadow-brand-orange/20 hover:opacity-90 transition-opacity mt-4">
              Login to dashboard
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="h-[1px] bg-white/[0.04] flex-1"></div>
            <span className="text-xs text-muted font-medium">or</span>
            <div className="h-[1px] bg-white/[0.04] flex-1"></div>
          </div>

          <button className="w-full py-3 rounded-xl border border-white/[0.05] bg-transparent text-muted text-sm font-medium hover:bg-white/[0.02] hover:text-white transition-all flex items-center justify-center gap-2">
            Continue with Google
          </button>

          <div className="text-center mt-6 text-sm text-muted">
            Don't have an account? <button onClick={handleSignup} className="text-white font-semibold hover:underline">Create one</button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1013] border border-white/10 w-full max-w-md p-6 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-brand-orange">
              <ShieldCheck size={28} />
              <h3 className="text-xl font-bold text-white">Change Passkey</h3>
            </div>
            <p className="text-muted text-sm mb-6">
              Your account is using the temporary campus passkey. Please set a personal passkey now to continue.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">New Passkey</label>
                <input 
                  type="password" 
                  className="w-full bg-panel border border-white/10 rounded-lg p-3 text-white focus:border-brand-orange/50 outline-none transition-colors"
                  placeholder="Minimum 6 chars"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Confirm Passkey</label>
                <input 
                  type="password" 
                  className="w-full bg-panel border border-white/10 rounded-lg p-3 text-white focus:border-brand-orange/50 outline-none transition-colors"
                  placeholder="Re-enter passkey"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                />
              </div>
            </div>

            {modalError && <div className="text-red-400 text-xs mt-3">{modalError}</div>}

            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => { setShowModal(false); setPendingEmail(null); }}
                className="px-4 py-2 rounded-lg text-muted hover:text-white text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleChangePassword}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-brand-orange to-brand-pink text-bg1 font-bold text-sm"
              >
                Save & Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;