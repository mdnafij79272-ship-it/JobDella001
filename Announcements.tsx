import React, { useState } from 'react';
import { Announcement } from '../types';

interface AnnouncementsProps {
    announcements: Announcement[];
}

const Announcements: React.FC<AnnouncementsProps> = ({ announcements }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleToggle = (id: string) => {
        setExpandedId(currentId => (currentId === id ? null : id));
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-indigo-600">
                📢 Platform Announcements
            </h2>

            {announcements.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-lg shadow">
                    <p className="text-slate-500 text-lg">There are no announcements at the moment.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {announcements.map(ann => {
                        const isExpanded = expandedId === ann.id;
                        return (
                            <div key={ann.id} className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 transition-all duration-300 ${ann.isActive ? 'border-indigo-500' : 'border-gray-300'} ${isExpanded ? 'shadow-lg' : 'hover:shadow-lg'}`}>
                                <button
                                    onClick={() => handleToggle(ann.id)}
                                    className="w-full text-left p-5 focus:outline-none focus:bg-gray-50"
                                    aria-expanded={isExpanded}
                                    aria-controls={`announcement-content-${ann.id}`}
                                >
                                    <div className="flex justify-between items-start flex-wrap gap-y-2">
                                        <div className="flex-grow pr-4">
                                            <h3 className="text-xl font-bold text-slate-800">{ann.title}</h3>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Posted on: {ann.createdAt?.toDate ? ann.createdAt.toDate().toLocaleString() : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {ann.isActive && (
                                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
                                                    Active
                                                </span>
                                            )}
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-slate-500 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </button>
                                <div
                                    id={`announcement-content-${ann.id}`}
                                    className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-screen' : 'max-h-0'}`}
                                >
                                    <div className="px-5 pb-5 pt-2 border-t border-gray-100">
                                        <p className="text-slate-600 whitespace-pre-wrap">{ann.content}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-in-out; }
            `}</style>
        </div>
    );
};

export default Announcements;