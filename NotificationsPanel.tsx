import React from 'react';
import { Notification, NotificationType, Announcement } from '../types';

interface NotificationsPanelProps {
  notifications: Notification[];
  announcement: Announcement | null;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

const getNotificationIcon = (type: NotificationType) => {
    switch(type) {
        case NotificationType.EARNINGS_COMMISSION: return '💰';
        case NotificationType.REFERRAL_COMMISSION: return '🤝';
        case NotificationType.GIG_AUTO_APPROVED: return '✅';
        case NotificationType.DEPOSIT_PENDING: return '⏳';
        case NotificationType.DEPOSIT_APPROVED: return '🏦';
        case NotificationType.DEPOSIT_REJECTED: return '❌';
        case NotificationType.REFERRAL_GIG_POST_COMMISSION: return '🚀';
        case NotificationType.QUANTITY_APPROVED: return '📦';
        case NotificationType.QUANTITY_REJECTED: return '↩️';
        case NotificationType.TIP_RECEIVED: return '🎁';
        default: return '🔔';
    }
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications, announcement, onMarkAllAsRead, onClose }) => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    const panelTitle = notifications.length > 0 ? "Notifications" : announcement ? "Announcement" : "Notifications";

    return (
        <div className="absolute top-16 right-0 left-0 sm:left-auto sm:right-4 mx-4 sm:mx-0 w-auto sm:w-full sm:max-w-sm bg-white border border-gray-200 rounded-lg shadow-2xl z-50 text-slate-800 animate-fade-in-down">
            <div className="flex justify-between items-center p-3 border-b border-gray-200">
                <h3 className="font-bold text-lg">{panelTitle}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            {notifications.length > 0 || announcement ? (
                <>
                    <ul className="p-2 max-h-96 overflow-y-auto">
                        {announcement && (
                            <li key={`announcement-${announcement.id}`} className="p-3 mb-2 rounded-md bg-indigo-50 border-l-4 border-indigo-400">
                                <div className="flex items-start gap-3">
                                    <span className="text-xl mt-1">📢</span>
                                    <div>
                                        <p className="font-bold text-sm text-indigo-800">{announcement.title}</p>
                                        <p className="text-sm text-slate-700 whitespace-pre-wrap mt-1">{announcement.content}</p>
                                        <p className="text-xs text-slate-400 mt-2">
                                            {announcement.createdAt?.toDate().toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        )}
                        {notifications.map(notif => (
                            <li key={notif.id} className={`p-2 rounded-md ${!notif.isRead ? 'bg-sky-50' : ''} hover:bg-gray-100`}>
                                <div className="flex items-start gap-3">
                                    <span className="text-xl mt-1">{getNotificationIcon(notif.type)}</span>
                                    <div>
                                        <p className="text-sm text-slate-700">{notif.message}</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {notif.createdAt?.toDate().toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {unreadNotifications.length > 0 && (
                        <div className="p-2 border-t border-gray-200">
                            <button onClick={onMarkAllAsRead} className="w-full text-center text-sm font-semibold text-sky-600 hover:bg-gray-100 rounded p-2 transition-colors">
                                Mark all as read
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <p className="p-8 text-center text-slate-500">You have no new notifications.</p>
            )}
            <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down { animation: fade-in-down 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default NotificationsPanel;