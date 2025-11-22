import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
import { translations, Language } from '../translations';
import { UserProfile } from '../types';

interface UserSettingsModalProps {
  isOpen: boolean;
  userProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClose: () => void;
  language: Language;
}

/**
 * Modal component for editing user profile information.
 * Includes client-side image resizing logic for avatar uploads.
 * 
 * @param {UserSettingsModalProps} props - Component props.
 * @returns {JSX.Element | null} Rendered component or null if not open.
 */
export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ 
  isOpen, 
  userProfile, 
  onSave, 
  onClose, 
  language 
}) => {
  const [name, setName] = useState(userProfile.name);
  const [avatar, setAvatar] = useState<string | undefined>(userProfile.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  useEffect(() => {
    if (isOpen) {
      setName(userProfile.name);
      setAvatar(userProfile.avatar);
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  /**
   * Handles file selection, reads the image, and resizes it to max 256x256.
   * @param {React.ChangeEvent<HTMLInputElement>} e - File change event.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 256x256 to save storage space
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxSize = 256;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setAvatar(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSave({ name: name.trim(), avatar });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 transform transition-all">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.userSettings}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <Icon name="X" size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-slate-50 dark:ring-slate-800 shadow-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="User" size={40} className="text-slate-400" />
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors"
                  title={t.uploadAvatar}
                >
                  <Icon name="Camera" size={16} />
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
              {avatar && (
                <button 
                  onClick={() => setAvatar(undefined)}
                  className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  <Icon name="Trash2" size={12} />
                  {t.removeAvatar}
                </button>
              )}
            </div>

            {/* Name Section */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t.name}
              </label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="User" size={16} className="text-slate-400" />
                  </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.guest}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-slate-800 dark:text-slate-200 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-lg shadow-primary-600/20"
            >
              {t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};