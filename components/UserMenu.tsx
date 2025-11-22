
import React from 'react';
import { UserProfile } from '../types';
import { Icon } from './Icon';
import { translations, Language } from '../translations';

interface UserMenuProps {
  userProfile: UserProfile;
  onClick: () => void;
  onLogout: () => void;
  onAdmin?: () => void;
  language: Language;
}

export const UserMenu: React.FC<UserMenuProps> = ({ userProfile, onClick, onLogout, onAdmin, language }) => {
  const t = translations[language];
  
  return (
    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col gap-2">
       <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
        {t.userProfile}
      </div>
      
      {/* Profile Button */}
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all text-left group"
      >
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-transparent group-hover:ring-primary-400/50 transition-all">
          {userProfile.avatar ? (
            <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover" />
          ) : (
            <Icon name="User" size={20} className="text-slate-500 dark:text-slate-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
            {userProfile.name || t.guest}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="truncate">{t.userSettings}</span>
          </div>
        </div>
        
        <Icon name="Settings" size={16} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
      </button>

      {/* Admin Panel Button */}
      <button
        onClick={onAdmin}
        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all text-left group text-slate-600 dark:text-slate-300"
      >
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
           <Icon name="Shield" size={18} className="text-slate-500 dark:text-slate-400 group-hover:text-primary-500 transition-colors" />
        </div>
        <div className="text-sm font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {t.adminPanel}
        </div>
      </button>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all text-left group"
      >
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
           <Icon name="LogOut" size={18} className="group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-sm font-medium">
          {t.signOut}
        </div>
      </button>
    </div>
  );
};
