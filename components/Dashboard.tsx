
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, Search, Home, MessageSquare, Search as SearchIcon, 
  HelpCircle, Calendar, Plus, Heart, MessageCircle, MoreVertical, 
  AlertTriangle, Flag, CheckCircle, User, LogOut, Trash2, BookOpen, Clock, MapPin,
  Menu, X, Send
} from 'lucide-react';
import { Session, Post, PostType, AttendanceData, Alert, AttendanceRecord, Lecture, Comment } from '../types';
import { 
  getAnnouncements, getDiscussions, getLostFound, getAttendance, getAlerts, getLectures,
  saveAnnouncements, saveDiscussions, saveLostFound, saveAttendance, saveAlerts, saveLectures, setSession,
  deleteAnnouncement
} from '../services/storage';
import CreatePostModal from './CreatePostModal';
import TutorChat from './TutorChat';

interface Props {
  session: Session;
  onLogout: () => void;
}

const Dashboard: React.FC<Props> = ({ session, onLogout }) => {
  // --- State ---
  // Default tab depends on role
  const [activeTab, setActiveTab] = useState(session.role === 'teacher' ? 'announcements' : 'home');
  const [filter, setFilter] = useState<'all' | PostType>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data State
  const [announcements, setAnnouncements] = useState<Post[]>([]);
  const [discussions, setDiscussions] = useState<Record<string, Post[]>>({});
  const [lostFound, setLostFound] = useState<Post[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);

  // Commenting State
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Lecture Form State (for teachers)
  const [newLecture, setNewLecture] = useState({ subject: '', topic: '', time: '', room: '' });

  // Force Refresh
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  // --- Effects ---
  useEffect(() => {
    setAnnouncements(getAnnouncements());
    setDiscussions(getDiscussions());
    setLostFound(getLostFound());
    setAttendance(getAttendance());
    setAlerts(getAlerts());
    setLectures(getLectures());
  }, [tick]);

  // --- Helpers ---
  const isTeacher = session.role === 'teacher';
  const isPrivileged = session.role === 'teacher' || session.role === 'president';

  const handlePostSubmit = (data: { type: PostType; title: string; desc: string; anon: boolean }) => {
    const newPost: Post = {
      id: `${data.type}_${Date.now()}`,
      type: data.type,
      title: data.title,
      desc: data.desc,
      author: session.email,
      time: new Date().toLocaleString(),
      anon: data.anon,
      likes: 0,
      comments: [],
      highAlert: false,
      reported: false
    };

    if (data.type === 'announcement') {
      const updated = [...announcements, newPost];
      saveAnnouncements(updated);
    } else if (data.type === 'discussion') {
      const updated = { ...discussions };
      if (!updated['general']) updated['general'] = [];
      updated['general'].push({ ...newPost, category: 'General' });
      saveDiscussions(updated);
    } else if (data.type === 'lostfound') {
      const updated = [...lostFound, newPost];
      saveLostFound(updated);
    } 
    
    setShowModal(false);
    refresh();
  };

  const handleDeletePost = (post: Post) => {
    if (post.type === 'announcement' && isPrivileged) {
      if (confirm('Are you sure you want to delete this announcement?')) {
        deleteAnnouncement(post.id);
        refresh();
      }
    }
  };

  const toggleHighAlert = (post: Post) => {
    if (!isPrivileged || post.type !== 'lostfound') return;
    
    const updatedPosts = lostFound.map(p => {
      if (p.id === post.id) return { ...p, highAlert: !p.highAlert };
      return p;
    });
    saveLostFound(updatedPosts);
    setLostFound(updatedPosts);

    if (!post.highAlert) {
      const newAlert: Alert = { id: `alert_${Date.now()}`, text: `High Alert: ${post.title}`, time: new Date().toLocaleString() };
      saveAlerts([...alerts, newAlert]);
    } else {
      const newAlerts = alerts.filter(a => !a.text.includes(post.title || ''));
      saveAlerts(newAlerts);
    }
    refresh();
  };

  const handleLike = (post: Post) => {
    // Only implemented for announcements in this demo to meet requirement "students can only react"
    if (post.type === 'announcement') {
      const updated = announcements.map(p => {
        if (p.id === post.id) return { ...p, likes: p.likes + 1 };
        return p;
      });
      saveAnnouncements(updated);
      setAnnouncements(updated);
    }
  };

  const handleAddComment = (post: Post) => {
    if (!commentText.trim()) return;

    const newComment: Comment = {
        id: `c_${Date.now()}`,
        author: session.email,
        text: commentText,
        time: new Date().toLocaleString()
    };

    const updatePostList = (list: Post[]) => list.map(p => {
        if (p.id === post.id) {
            return { ...p, comments: [...p.comments, newComment] };
        }
        return p;
    });

    if (post.type === 'announcement') {
        const updated = updatePostList(announcements);
        saveAnnouncements(updated);
        setAnnouncements(updated);
    } else if (post.type === 'discussion') {
        // Need to find which category contains this post
        let categoryKey = 'general';
        Object.entries(discussions).forEach(([key, posts]) => {
            if (posts.find(p => p.id === post.id)) categoryKey = key;
        });
        
        const updatedDiscussions = { ...discussions };
        updatedDiscussions[categoryKey] = updatePostList(updatedDiscussions[categoryKey] || []);
        saveDiscussions(updatedDiscussions);
        setDiscussions(updatedDiscussions);
    } else if (post.type === 'lostfound') {
        const updated = updatePostList(lostFound);
        saveLostFound(updated);
        setLostFound(updated);
    }

    setCommentText('');
  };

  const handleAddLecture = () => {
    if (!newLecture.subject || !newLecture.time) return;
    const lec: Lecture = {
      id: `lec_${Date.now()}`,
      subject: newLecture.subject,
      topic: newLecture.topic,
      time: newLecture.time,
      room: newLecture.room,
      teacherName: isTeacher ? 'You' : session.email // Simplified name
    };
    const updated = [...lectures, lec];
    saveLectures(updated);
    setLectures(updated);
    setNewLecture({ subject: '', topic: '', time: '', room: '' });
  };

  const handleAttendance = (status: 'present' | 'done') => {
    let data = { ...attendance };
    let topicId = Object.keys(data)[0];
    if (!topicId) {
      topicId = 'topic_' + Date.now();
      data[topicId] = { title: 'Intro: Linear Algebra', date: new Date().toLocaleDateString(), students: {} };
    }
    data[topicId].students[session.email] = status;
    saveAttendance(data);
    refresh();
  };

  // --- Navigation Items ---
  const SIDEBAR_ITEMS = isTeacher 
    ? [
        { id: 'announcements', label: 'Announcements', icon: Bell, desc: 'Manage Posts' },
        { id: 'chat', label: 'Teacher Chat', icon: MessageCircle, desc: 'Solve Doubts' },
        { id: 'lectures', label: 'Lectures', icon: BookOpen, desc: 'Manage Sessions' },
      ]
    : [
        { id: 'home', label: 'Home', icon: Home, desc: 'Unified feed' },
        { id: 'announcements', label: 'Announcements', icon: Bell, desc: 'Campus News' },
        { id: 'discussion', label: 'Discussion', icon: MessageSquare, desc: 'Students only' },
        { id: 'tutor', label: 'Private Tutor', icon: HelpCircle, desc: 'Ask Doubts' },
        { id: 'lostfound', label: 'Lost & Found', icon: SearchIcon, desc: 'Campus items' },
        { id: 'schedule', label: 'Schedule', icon: Calendar, desc: 'Class Sessions' },
      ];

  // --- Computed Data ---
  const attendancePercent = useMemo(() => {
    const topics = Object.values(attendance) as AttendanceRecord[];
    if (!topics.length) return 0;
    
    let total = 0;
    let present = 0;

    topics.forEach(t => {
      if (t.students[session.email]) {
        total++;
        if (t.students[session.email] !== 'absent') present++;
      } else if (Object.keys(t.students).length > 0) {
        total++;
        const p = Object.values(t.students).filter(s => s !== 'absent').length;
        present += (p / Object.values(t.students).length);
      }
    });

    return total === 0 ? 0 : Math.round((present / total) * 100);
  }, [attendance, session.email]);

  const feedItems = useMemo(() => {
    let all: Post[] = [];
    
    // Explicitly handle Announcement view for both roles
    if (activeTab === 'announcements') return announcements.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Student View: Mixed feed
    if (filter === 'all') {
      all = all.concat(announcements).concat(lostFound);
      (Object.values(discussions) as Post[][]).forEach(list => all = all.concat(list));
    } else if (filter === 'discussion') {
       (Object.values(discussions) as Post[][]).forEach(list => all = all.concat(list));
    } else if (filter === 'lostfound') {
      all = lostFound;
    }

    if (search) {
      const lower = search.toLowerCase();
      all = all.filter(p => 
        (p.title?.toLowerCase().includes(lower)) || 
        p.desc.toLowerCase().includes(lower) || 
        p.author.toLowerCase().includes(lower)
      );
    }

    return all.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [announcements, discussions, lostFound, filter, search, activeTab]);

  // --- Render Helpers ---

  const renderSchedule = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Upcoming Lectures</h2>
      
      {/* Teacher Form */}
      {isTeacher && (
        <div className="bg-panel border border-white/5 rounded-xl p-5">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Plus size={16}/> Add New Session</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
             <input placeholder="Subject (e.g. Physics)" className="bg-bg2 border border-white/10 rounded-lg p-2 text-sm text-white" value={newLecture.subject} onChange={e => setNewLecture({...newLecture, subject: e.target.value})} />
             <input placeholder="Topic (e.g. Gravity)" className="bg-bg2 border border-white/10 rounded-lg p-2 text-sm text-white" value={newLecture.topic} onChange={e => setNewLecture({...newLecture, topic: e.target.value})} />
             <input placeholder="Time (e.g. 10:00 AM)" className="bg-bg2 border border-white/10 rounded-lg p-2 text-sm text-white" value={newLecture.time} onChange={e => setNewLecture({...newLecture, time: e.target.value})} />
             <input placeholder="Room (e.g. 302)" className="bg-bg2 border border-white/10 rounded-lg p-2 text-sm text-white" value={newLecture.room} onChange={e => setNewLecture({...newLecture, room: e.target.value})} />
          </div>
          <button onClick={handleAddLecture} className="bg-brand-purple hover:bg-brand-purple/80 text-white px-4 py-2 rounded-lg text-sm font-bold">Add to Schedule</button>
        </div>
      )}

      {/* Schedule List */}
      <div className="grid gap-4">
        {lectures.length === 0 ? <div className="text-muted text-sm">No lectures scheduled.</div> : lectures.map(lec => (
          <div key={lec.id} className="bg-panel border border-white/5 p-4 rounded-xl flex justify-between items-center hover:border-white/20 transition-all">
            <div className="flex gap-4 items-center">
              <div className="bg-brand-orange/10 text-brand-orange p-3 rounded-lg font-bold">
                 {lec.time}
              </div>
              <div>
                <h4 className="font-bold text-white text-lg">{lec.subject}</h4>
                <div className="text-sm text-muted">{lec.topic} • {lec.teacherName}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted bg-white/5 px-3 py-1 rounded-full">
              <MapPin size={14} /> {lec.room}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Reusable Sidebar Component
  // isMobile=true means text is always visible
  // isMobile=false means text reveals on group-hover
  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="space-y-1 py-2">
      <div className={`text-xs font-bold text-muted px-4 py-2 mb-2 transition-opacity duration-300 ${!isMobile ? 'opacity-0 group-hover:opacity-100' : ''}`}>
        MENU
      </div>
      {SIDEBAR_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => { 
            setActiveTab(item.id); 
            setFilter(item.id === 'home' ? 'all' : item.id as any);
            setMobileMenuOpen(false); // Close mobile menu if open
          }}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative overflow-hidden ${
            activeTab === item.id 
              ? 'bg-gradient-to-r from-white/10 to-white/5 text-white shadow-lg' 
              : 'text-muted hover:bg-white/5 hover:text-white'
          }`}
        >
          <div className={`p-2 rounded-lg shrink-0 transition-colors ${activeTab === item.id ? 'bg-white/10' : 'bg-panel group-hover:bg-white/5'}`}>
            <item.icon size={20} />
          </div>
          <div className={`text-left whitespace-nowrap overflow-hidden transition-all duration-300 ${
            isMobile 
              ? 'opacity-100' 
              : 'max-w-0 opacity-0 group-hover:max-w-[200px] group-hover:opacity-100'
          }`}>
            <div className="font-semibold text-sm pl-1">{item.label}</div>
            <div className="text-[10px] opacity-60 font-normal pl-1">{item.desc}</div>
          </div>
        </button>
      ))}
      
      {!isTeacher && (
        <div className={`mt-8 mx-3 p-4 rounded-xl bg-gradient-to-b from-white/5 to-transparent border border-white/5 transition-all duration-300 overflow-hidden ${
          !isMobile ? 'opacity-0 group-hover:opacity-100 h-0 group-hover:h-auto' : ''
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-orange to-brand-purple">
              {attendancePercent}%
            </div>
          </div>
          <div className="text-xs text-muted mb-3 whitespace-nowrap">Average Attendance</div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-orange to-brand-purple" style={{ width: `${attendancePercent}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg1 to-bg2 text-gray-100 font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative w-72 h-full bg-[#0b0b10] border-r border-white/10 p-4 shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pl-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-orange to-brand-purple flex items-center justify-center font-bold text-bg1 text-sm">CC</div>
                <span className="font-bold text-lg">Menu</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-muted hover:text-white bg-white/5 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <SidebarContent isMobile={true} />
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-bg1/80 backdrop-blur-md border-b border-white/5 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Trigger */}
          <button 
            onClick={() => setMobileMenuOpen(true)} 
            className="lg:hidden p-2 -ml-2 text-muted hover:text-white rounded-lg hover:bg-white/5"
          >
            <Menu size={24} />
          </button>

          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-orange to-brand-purple flex items-center justify-center font-bold text-bg1">CC</div>
          <div>
            <h1 className="font-bold text-lg leading-tight">CampusConnect</h1>
            <p className="text-xs text-muted">{isTeacher ? 'Teacher Portal' : 'Student Dashboard'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-panel border border-white/10 rounded-lg px-3 py-2 w-64 focus-within:border-brand-purple/50 transition-colors">
            <SearchIcon size={16} className="text-muted mr-2" />
            <input 
              id="globalSearch"
              type="text" 
              placeholder="Search feed (press /)" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full placeholder-muted/50"
            />
          </div>

          <div className="relative group">
             <button className="p-2 rounded-lg hover:bg-white/5 relative">
               <Bell size={20} className="text-muted" />
               {alerts.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-pink rounded-full border border-bg1"></span>}
             </button>
             {/* Simple Notifications Dropdown */}
             <div className="absolute right-0 top-full mt-2 w-72 bg-[#0f1013] border border-white/10 rounded-xl shadow-2xl p-2 hidden group-hover:block">
               <div className="text-xs font-bold text-muted px-2 py-1 mb-1">NOTIFICATIONS</div>
               {alerts.length === 0 ? (
                 <div className="p-2 text-sm text-muted">No new alerts</div>
               ) : (
                 alerts.map(a => (
                   <div key={a.id} className="p-2 hover:bg-white/5 rounded-lg mb-1">
                     <p className="text-sm font-semibold text-brand-pink">{a.text}</p>
                     <p className="text-[10px] text-muted">{a.time}</p>
                   </div>
                 ))
               )}
             </div>
          </div>

          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-brand-orange to-brand-pink flex items-center justify-center text-xs font-bold text-bg1">
                {session.email[0].toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-bold leading-none">{session.role.toUpperCase()}</div>
                <div className="text-[10px] text-muted leading-none">{session.email.split('@')[0]}</div>
              </div>
              <MoreVertical size={14} className="text-muted" />
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#0f1013] border border-white/10 rounded-xl shadow-2xl p-1 z-50">
                <button onClick={onLogout} className="w-full text-left px-3 py-2 text-sm hover:bg-red-500/10 text-red-400 rounded-lg flex items-center gap-2">
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-[80px_1fr] xl:grid-cols-[80px_1fr_300px] gap-6">
        
        {/* Sidebar - Desktop: Sticky rail that expands on hover */}
        <aside className="hidden lg:block sticky top-24 h-[calc(100vh-100px)] z-30">
          <div className="group absolute top-0 left-0 h-full">
            <div className="w-20 group-hover:w-72 bg-[#0b0b10]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-300 ease-in-out overflow-hidden h-full flex flex-col">
               <SidebarContent isMobile={false} />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0">
          
          {/* Global Alert Banner */}
          {alerts.length > 0 && activeTab !== 'tutor' && activeTab !== 'chat' && (
            <div className="mb-6 bg-gradient-to-r from-red-500/20 to-brand-pink/20 border border-red-500/30 rounded-xl p-4 flex items-start justify-between">
              <div className="flex gap-3">
                <AlertTriangle className="text-red-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-red-100 text-sm">Campus Alert</h3>
                  <p className="text-sm text-red-200/80">{alerts[alerts.length - 1].text}</p>
                </div>
              </div>
              <button onClick={() => setAlerts([])} className="text-xs text-red-300 hover:text-white underline">Dismiss</button>
            </div>
          )}

          {/* --- VIEW: TUTOR CHAT (TEACHER CHAT SYSTEM) --- */}
          {(activeTab === 'tutor' || activeTab === 'chat') ? (
            <TutorChat session={session} />
          ) : (activeTab === 'lectures' || activeTab === 'schedule') ? (
            renderSchedule()
          ) : (
            <>
              {/* --- VIEW: FEED (Home / Announcements / LostFound) --- */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  {activeTab === 'announcements' ? 'Announcements Board' : 
                   activeTab === 'home' ? 'Unified Feed' : 
                   activeTab === 'discussion' ? 'Student Discussions' : 'Lost & Found'}
                </h2>
                
                {/* Create Button Logic: Teachers can create in announcements, Students in discussion/lostfound */}
                {(!isTeacher || activeTab === 'announcements') && (
                  <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-orange to-brand-pink text-bg1 font-bold text-sm rounded-lg hover:opacity-90 shadow-lg shadow-brand-orange/20"
                  >
                    <Plus size={16} /> Create Post
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {feedItems.length === 0 ? (
                  <div className="text-center py-12 text-muted">No posts found in this category.</div>
                ) : (
                  feedItems.map(post => (
                    <div key={post.id} className="p-5 rounded-xl bg-panel border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            post.type === 'announcement' ? 'bg-brand-purple' : 
                            post.type === 'lostfound' ? 'bg-red-500' : 'bg-green-400'
                          }`} />
                          <span className="text-xs font-bold uppercase tracking-wider text-muted">{post.type}</span>
                        </div>
                        <span className="text-xs text-muted/60">{post.time}</span>
                      </div>
                      
                      <h4 className="text-lg font-bold text-white mb-2">{post.title || (post.desc.length > 50 ? post.desc.slice(0,50)+'...' : post.desc)}</h4>
                      <p className="text-gray-400 text-sm leading-relaxed mb-4">{post.desc}</p>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <User size={12} />
                          {post.author}
                        </div>

                        <div className="flex gap-3 items-center">
                          {/* Student Reacts */}
                          {!isTeacher && post.type === 'announcement' && (
                            <button onClick={() => handleLike(post)} className="flex items-center gap-1 text-xs text-muted hover:text-brand-pink transition-colors">
                              <Heart size={14} className={post.likes > 0 ? "fill-brand-pink text-brand-pink" : ""} /> {post.likes}
                            </button>
                          )}
                          
                          {/* Comments Trigger */}
                          <button 
                            onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)} 
                            className={`flex items-center gap-1 text-xs transition-colors ${expandedPostId === post.id ? 'text-brand-orange' : 'text-muted hover:text-white'}`}
                          >
                            <MessageCircle size={14} /> 
                            {post.comments?.length || 0}
                          </button>

                          {/* Admin Controls */}
                          {isPrivileged && post.type === 'lostfound' && (
                             <button onClick={() => toggleHighAlert(post)} className={`text-xs ${post.highAlert ? 'text-red-400' : 'text-muted hover:text-white'}`}>
                               {post.highAlert ? 'High Alert Active' : 'Set Alert'}
                             </button>
                          )}
                          
                          {isPrivileged && post.type === 'announcement' && (
                            <>
                              <div className="text-xs text-muted flex items-center gap-1 mr-2"><Heart size={14}/> {post.likes}</div>
                              <button 
                                onClick={() => handleDeletePost(post)}
                                className="text-xs text-muted hover:text-red-400 flex items-center gap-1 transition-colors"
                              >
                                <Trash2 size={14} /> 
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Comments Section */}
                      {expandedPostId === post.id && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                            {post.comments?.length > 0 && (
                                <div className="space-y-3 mb-4">
                                    {post.comments.map(c => (
                                        <div key={c.id} className="flex gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                {c.author.split('@')[0][0].toUpperCase()}
                                            </div>
                                            <div className="bg-white/5 rounded-lg rounded-tl-none p-2 text-sm flex-1">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <span className="font-bold text-xs text-gray-300">{c.author.split('@')[0]}</span>
                                                    <span className="text-[10px] text-muted">{c.time.split(',')[0]}</span>
                                                </div>
                                                <p className="text-gray-300">{c.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <div className="flex gap-2 items-center">
                                <input 
                                    type="text" 
                                    placeholder="Add a reply..." 
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post)}
                                    className="flex-1 bg-bg2 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:border-brand-purple/50 outline-none placeholder-muted/50"
                                />
                                <button 
                                    onClick={() => handleAddComment(post)}
                                    disabled={!commentText.trim()}
                                    className="p-2 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-full disabled:opacity-50 transition-colors"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </main>

        {/* Right Panel (Widgets) - Only show relevant widgets */}
        <aside className="hidden xl:block space-y-6">
          {isTeacher ? (
             <div className="bg-panel rounded-xl p-5 border border-white/5">
               <h3 className="font-bold text-white mb-3">Quick Actions</h3>
               <button onClick={() => { setActiveTab('announcements'); setShowModal(true); }} className="w-full text-left mb-2 text-sm text-muted hover:text-white flex items-center gap-2">
                 <Plus size={16} /> Post Announcement
               </button>
               <button onClick={() => setActiveTab('lectures')} className="w-full text-left text-sm text-muted hover:text-white flex items-center gap-2">
                 <Calendar size={16} /> Update Schedule
               </button>
             </div>
          ) : (
             <div className="bg-panel rounded-xl p-5 border border-white/5">
                <h3 className="font-bold text-white mb-1">Upcoming Class</h3>
                {lectures.length > 0 ? (
                  <>
                    <p className="text-sm font-bold text-brand-orange mt-2">{lectures[0].subject}</p>
                    <p className="text-xs text-muted">{lectures[0].time} • {lectures[0].room}</p>
                  </>
                ) : (
                  <p className="text-xs text-muted mt-2">No classes scheduled</p>
                )}
             </div>
          )}
        </aside>

      </div>

      {showModal && (
        <CreatePostModal 
          onClose={() => setShowModal(false)} 
          onSubmit={handlePostSubmit} 
          session={session}
        />
      )}
    </div>
  );
};

export default Dashboard;
