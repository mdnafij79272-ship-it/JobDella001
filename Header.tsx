import React from 'react';

interface HeaderProps {
  userPoints: number;
  userBdtBalance: number;
  unreadNotificationsCount: number;
  onToggleNotifications: () => void;
  onProfileClick: () => void;
  photoURL: string | null;
  displayName: string | null;
}

const Header: React.FC<HeaderProps> = ({ userPoints, userBdtBalance, unreadNotificationsCount, onToggleNotifications, onProfileClick, photoURL, displayName }) => {
  return (
    <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-30 border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-2xl font-bold tracking-wider">
          <span className="text-sky-600">Job</span>
          <span className="text-slate-900">Della</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onToggleNotifications} className="relative text-slate-500 hover:text-slate-900 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
          
          <button onClick={onProfileClick} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 p-1 rounded-full text-sm text-slate-800 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {photoURL ? (
                    <img src={photoURL} alt={displayName || 'User'} className="w-full h-full object-cover" />
                ) : (
                    <span className="font-bold text-gray-500">{displayName ? displayName.charAt(0).toUpperCase() : '?'}</span>
                )}
            </div>
            <div className="flex items-center gap-2 pr-2">
                <span className="font-semibold flex items-center gap-1">
                    <span className="text-yellow-500">⚡</span>
                    {userPoints.toFixed(2)}
                </span>
                <span className="text-gray-300">|</span>
                <span className="font-semibold">
                    ৳ {userBdtBalance.toFixed(2)}
                </span>
            </div>
          </button>

        </div>
      </div>
    </header>
  );
};

export default Header;