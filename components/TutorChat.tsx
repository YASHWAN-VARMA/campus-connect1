import React, { useState, useEffect, useRef } from 'react';
import { Session, TutorSession, ChatMessage, Attachment } from '../types';
import { getTutorSessions, saveTutorSessions } from '../services/storage';
import { Send, Paperclip, FileVideo, FileImage, Plus, User, ArrowLeft, MessageSquare } from 'lucide-react';

interface Props {
  session: Session;
}

const TEACHERS = [
  'Mr. Subhesh kumar',
  'Mr. Rupesh',
  'Mr. Anuj',
  'Mr. Pankaj',
  'Mr. Prassana'
];

const TutorChat: React.FC<Props> = ({ session }) => {
  const [sessions, setSessions] = useState<TutorSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // New Session Form State
  const [selectedTeacher, setSelectedTeacher] = useState(TEACHERS[0]);
  const [newSubject, setNewSubject] = useState('');

  // Teacher Filter (for the generic admin/teacher account)
  const [filterTeacher, setFilterTeacher] = useState<string>('All');

  // Chat State
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
  }, [session, filterTeacher]); // Reload when filter changes

  useEffect(() => {
    if (activeSessionId) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sessions, activeSessionId]);

  const loadSessions = () => {
    const all = getTutorSessions();
    if (session.role === 'student') {
      setSessions(all.filter(s => s.studentEmail === session.email).sort((a,b) => b.lastUpdated - a.lastUpdated));
    } else {
      // Teacher Logic: Filter by selected name if not 'All'
      const filtered = all.filter(s => filterTeacher === 'All' || s.teacherName === filterTeacher);
      setSessions(filtered.sort((a,b) => b.lastUpdated - a.lastUpdated));
    }
  };

  const handleCreateSession = () => {
    if (!newSubject.trim()) return;

    const newSession: TutorSession = {
      id: `sess_${Date.now()}`,
      studentEmail: session.email,
      teacherName: selectedTeacher,
      subject: newSubject,
      messages: [],
      lastUpdated: Date.now()
    };

    const updated = [newSession, ...getTutorSessions()];
    saveTutorSessions(updated);
    // Reload sessions preserving current filters
    const all = updated;
    if (session.role === 'student') {
        setSessions(all.filter(s => s.studentEmail === session.email).sort((a,b) => b.lastUpdated - a.lastUpdated));
    }
    setActiveSessionId(newSession.id);
    setIsCreating(false);
    setNewSubject('');
  };

  const handleSendMessage = async (attachment?: Attachment) => {
    if ((!inputText.trim() && !attachment) || !activeSessionId) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderEmail: session.email,
      text: inputText,
      timestamp: Date.now(),
      attachments: attachment ? [attachment] : undefined
    };

    const all = getTutorSessions();
    const updated = all.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: [...s.messages, newMsg],
          lastUpdated: Date.now()
        };
      }
      return s;
    });

    saveTutorSessions(updated);
    // Refresh local state without full reload to keep active UI snappy
    setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
            return { ...s, messages: [...s.messages, newMsg], lastUpdated: Date.now() };
        }
        return s;
    }).sort((a,b) => b.lastUpdated - a.lastUpdated));

    setInputText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      
      const att: Attachment = {
        id: `att_${Date.now()}`,
        type,
        name: file.name,
        data: base64
      };
      
      handleSendMessage(att);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // -- Render Logic --

  // 1. Creation View
  if (isCreating) {
    return (
      <div className="bg-panel rounded-xl border border-white/5 p-6 max-w-lg mx-auto mt-8">
        <button onClick={() => setIsCreating(false)} className="mb-4 text-muted hover:text-white flex items-center gap-2 text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <h2 className="text-xl font-bold text-white mb-6">Start New Conversation</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Select Teacher</label>
            <div className="grid gap-2">
              {TEACHERS.map(t => (
                <label key={t} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedTeacher === t ? 'border-brand-purple bg-brand-purple/10 text-white' : 'border-white/10 bg-white/5 text-muted'}`}>
                  <input 
                    type="radio" 
                    name="teacher" 
                    className="hidden" 
                    checked={selectedTeacher === t} 
                    onChange={() => setSelectedTeacher(t)} 
                  />
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs font-bold">
                    {t.split(' ')[1][0]}
                  </div>
                  <span className="font-medium">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-1">Subject / Doubt</label>
            <input 
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="e.g. Help with Assignment 3"
              className="w-full bg-bg2 border border-white/10 rounded-lg p-3 text-white focus:border-brand-purple/50 outline-none"
            />
          </div>

          <button 
            onClick={handleCreateSession}
            disabled={!newSubject.trim()}
            className="w-full py-3 bg-gradient-to-r from-brand-orange to-brand-pink text-bg1 font-bold rounded-lg mt-4 disabled:opacity-50"
          >
            Start Chat
          </button>
        </div>
      </div>
    );
  }

  // 2. Main Chat Layout
  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4">
      
      {/* Sidebar List */}
      <div className={`flex-1 md:flex-none md:w-80 bg-panel border border-white/5 rounded-xl flex flex-col ${activeSessionId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-white/5">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-white">
                  {session.role === 'student' ? 'Your Chats' : 'Student Doubts'}
                </h3>
                {session.role === 'student' && (
                    <button onClick={() => setIsCreating(true)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 text-brand-orange">
                    <Plus size={18} />
                    </button>
                )}
            </div>
            
            {/* Teacher Filter Dropdown */}
            {session.role === 'teacher' && (
                <select 
                    value={filterTeacher}
                    onChange={(e) => setFilterTeacher(e.target.value)}
                    className="w-full bg-bg2 border border-white/10 rounded-lg p-2 text-xs text-muted outline-none focus:border-brand-purple/50"
                >
                    <option value="All">All Chats</option>
                    {TEACHERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center text-muted text-sm py-8">
                {session.role === 'student' ? 'No active conversations.' : 'No active doubts found.'}
            </div>
          ) : (
            sessions.map(s => (
              <button 
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${activeSessionId === s.id ? 'bg-white/5 border-brand-purple/50' : 'bg-transparent border-transparent hover:bg-white/5'}`}
              >
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-sm text-white truncate pr-2">{s.subject}</span>
                  <span className="text-[10px] text-muted whitespace-nowrap">{new Date(s.lastUpdated).toLocaleDateString()}</span>
                </div>
                <div className="text-xs text-muted flex items-center gap-1">
                  <User size={10} />
                  {session.role === 'student' ? s.teacherName : 'Anonymous Student'}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`flex-[2] bg-panel border border-white/5 rounded-xl flex flex-col ${!activeSessionId ? 'hidden md:flex' : 'flex'}`}>
        {activeSession ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center gap-3">
              <button onClick={() => setActiveSessionId(null)} className="md:hidden text-muted">
                <ArrowLeft size={20} />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-orange to-brand-purple flex items-center justify-center text-bg1 font-bold">
                {session.role === 'student' ? activeSession.teacherName.split(' ')[1][0] : '?'}
              </div>
              <div>
                <h3 className="font-bold text-white">{activeSession.subject}</h3>
                <div className="text-xs text-muted">
                  with {session.role === 'student' ? activeSession.teacherName : 'Anonymous Student'}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg2/50">
              {activeSession.messages.length === 0 && (
                <div className="text-center text-muted text-sm mt-10">Start the conversation...</div>
              )}
              {activeSession.messages.map(msg => {
                const isMe = msg.senderEmail === session.email;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl p-3 ${isMe ? 'bg-brand-purple text-white rounded-tr-none' : 'bg-white/10 text-gray-200 rounded-tl-none'}`}>
                      {msg.attachments?.map(att => (
                        <div key={att.id} className="mb-2">
                          {att.type === 'image' ? (
                            <img src={att.data} alt="attachment" className="rounded-lg max-h-48 object-cover border border-white/10" />
                          ) : (
                            <div className="flex items-center gap-2 p-3 bg-black/20 rounded-lg">
                              <FileVideo size={24} className="text-brand-orange" />
                              <span className="text-xs truncate max-w-[150px]">{att.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <div className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-muted'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/5 bg-panel">
              {isUploading && <div className="text-xs text-brand-orange mb-2">Uploading...</div>}
              <div className="flex gap-2">
                <div className="flex-1 bg-bg2 rounded-lg border border-white/10 flex items-center px-2 focus-within:border-brand-purple/50">
                  <input 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent border-none outline-none text-white text-sm py-3 px-2"
                  />
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept="image/*,video/*"
                  />
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 text-muted hover:text-brand-orange">
                    <Paperclip size={18} />
                  </button>
                </div>
                <button 
                  onClick={() => handleSendMessage()} 
                  disabled={!inputText.trim() && !isUploading}
                  className="bg-brand-purple hover:bg-brand-purple/80 text-white p-3 rounded-lg disabled:opacity-50 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>

          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorChat;