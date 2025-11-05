import React from 'react';
import { Announcement } from '../types';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ isOpen, onClose, announcement }) => {
  if (!isOpen || !announcement) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] transform transition-all scale-95 animate-modal-enter">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
            <span className="text-2xl">📢</span> Announcement
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-4">{announcement.title}</h3>
            <p className="text-slate-600 whitespace-pre-wrap">{announcement.content}</p>
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-4 border-t border-gray-200 flex-shrink-0">
            <button 
                onClick={onClose}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-6 rounded-full transition-colors"
                >
                Got It
            </button>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes modal-enter {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-modal-enter { animation: modal-enter 0.2s ease-out forwards; }
        `}} />
      </div>
    </div>
  );
};

export default AnnouncementModal;
