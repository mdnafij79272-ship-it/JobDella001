import React, { useState, useEffect, FormEvent } from 'react';
import { useToasts } from './Toasts';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string, newPhoto: File | null) => void;
  currentName: string;
  currentPhotoURL: string | null;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onSave, currentName, currentPhotoURL }) => {
  const [name, setName] = useState(currentName);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(currentPhotoURL);
  const { addToast } = useToasts();

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setPhotoFile(null);
      setPhotoPreview(currentPhotoURL);
    }
  }, [isOpen, currentName, currentPhotoURL]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        // Basic validation: 2MB limit
        if (file.size > 2 * 1024 * 1024) { 
            addToast('Image is too large. Maximum size is 2MB.', 'error');
            return;
        }
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Please enter a valid name.', 'error');
      return;
    }
    onSave(name, photoFile);
  };

  if (!isOpen) return null;

  const defaultAvatar = (
    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
        <span className="text-4xl font-bold text-gray-500">{name ? name.charAt(0).toUpperCase() : '?'}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md transform transition-all scale-95 animate-modal-enter">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-purple-600">Edit Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden relative group">
                {photoPreview ? <img src={photoPreview} alt="Profile Preview" className="w-full h-full object-cover" /> : defaultAvatar}
                <label htmlFor="photo-upload" className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    Change
                </label>
            </div>
            <input
                id="photo-upload"
                type="file"
                accept="image/png, image/jpeg"
                className="hidden"
                onChange={handlePhotoChange}
            />
          </div>
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-600 mb-1">Display Name</label>
            <input
              id="displayName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              maxLength={25}
              required
            />
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-slate-800 font-bold py-2 px-4 rounded-full transition-colors">Cancel</button>
            <button 
              type="submit"
              className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-full transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
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

export default EditProfileModal;