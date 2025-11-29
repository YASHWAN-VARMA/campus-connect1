import React, { useState } from 'react';
import { PostType, Session } from '../types';
import { X, Image as ImageIcon } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSubmit: (data: { type: PostType; title: string; desc: string; anon: boolean }) => void;
  session: Session | null;
}

const CreatePostModal: React.FC<Props> = ({ onClose, onSubmit, session }) => {
  const isPrivileged = session?.role === 'teacher' || session?.role === 'president';
  
  const [type, setType] = useState<PostType>(isPrivileged ? 'announcement' : 'discussion');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [anon, setAnon] = useState(false);

  const handleSubmit = () => {
    if ((!title && type !== 'tutor') || !desc) {
      alert('Please fill in required fields');
      return;
    }
    onSubmit({ type, title, desc, anon });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-bg2 border border-white/10 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-white/5 bg-white/[0.02]">
          <h3 className="font-bold text-lg text-white">Create Post</h3>
          <button onClick={onClose} className="text-muted hover:text-white"><X size={20} /></button>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-muted w-16">Type</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as PostType)}
              className="flex-1 bg-panel border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-brand-purple/50"
            >
              {isPrivileged && <option value="announcement">Announcement</option>}
              <option value="discussion">Discussion</option>
              <option value="lostfound">Lost & Found</option>
              <option value="tutor">Private Tutor Question</option>
            </select>
          </div>

          {type !== 'tutor' && (
            <input 
              type="text" 
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-panel border border-white/10 rounded-lg p-3 text-white outline-none focus:border-brand-purple/50 placeholder-muted/50"
            />
          )}

          <textarea 
            placeholder={type === 'tutor' ? "Ask your question..." : "Write details..."}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full h-32 bg-panel border border-white/10 rounded-lg p-3 text-white outline-none focus:border-brand-purple/50 placeholder-muted/50 resize-none"
          />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted hover:text-white">
                <input 
                  type="checkbox" 
                  checked={anon} 
                  onChange={(e) => setAnon(e.target.checked)}
                  className="rounded bg-panel border-white/10" 
                /> 
                Post anonymously
              </label>
              <button className="text-sm text-muted hover:text-brand-orange flex items-center gap-1">
                <ImageIcon size={14} /> Attach
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted hover:text-white">Cancel</button>
          <button onClick={handleSubmit} className="px-6 py-2 bg-gradient-to-r from-brand-orange to-brand-pink text-bg1 font-bold text-sm rounded-lg hover:opacity-90">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;