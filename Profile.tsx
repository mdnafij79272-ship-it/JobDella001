import React, { useState, FormEvent } from 'react';
import { Job, Transaction, TransactionType, Submission, SubmissionStatus } from '../types';
import { useToasts } from './Toasts';

interface ProfileProps {
    userId: string;
    userPoints: number; // JD TOKENS
    userBdtBalance: number;
    transactions: Transaction[];
    jobs: Job[];
    submissions: Submission[];
    onReport: (submission: Submission) => void;
    onLogout: () => void;
    displayName: string;
    email: string;
    createdAt: string;
    photoURL: string | null;
    totalEarnings: number; // JD TOKENS
    totalBdtEarnings: number;
    gigsCompleted: number;
    gigsCreated: number;
    onNavigate: (view: 'jobs' | 'announcements' | 'wallet' | 'manage' | 'refer' | 'profile' | 'admin' | 'token') => void;
    onOpenEditProfile: () => void;
}

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string | number, color: string }> = ({ icon, label, value, color }) => (
    <div className="bg-white p-4 rounded-lg flex items-center">
        <div className={`mr-4 p-2 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-xl font-bold text-slate-900">{value}</p>
        </div>
    </div>
);


const TransactionRow: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
    const { type, amount, description, date, currency } = transaction;
    const isCredit = amount > 0;

    const typeInfo: Partial<Record<TransactionType, { icon: string, color: string }>> = {
        [TransactionType.GIG_COMPLETED]: { icon: '✅', color: 'text-green-600' },
        [TransactionType.SIGNUP_BONUS]: { icon: '🎉', color: 'text-yellow-600' },
        [TransactionType.REFERRAL_SIGNUP_BONUS]: { icon: '🎁', color: 'text-yellow-600' },
        [TransactionType.GIG_REFUND]: { icon: '↩️', color: 'text-sky-600' },
        [TransactionType.GIG_POST]: { icon: '🚀', color: 'text-red-600' },
        [TransactionType.GIG_BOOST]: { icon: '⚡️', color: 'text-red-600' },
        [TransactionType.GIG_ADD_QUANTITY]: { icon: '➕', color: 'text-red-600' },
        [TransactionType.REFERRAL_COMMISSION]: { icon: '🤝', color: 'text-green-600' },
        [TransactionType.EARNINGS_COMMISSION]: { icon: '💰', color: 'text-green-600' },
        [TransactionType.REPORT_COMPENSATION]: { icon: '⚖️', color: 'text-green-600' },
        [TransactionType.REPORT_PENALTY]: { icon: '⚖️', color: 'text-red-600' },
        [TransactionType.REFERRAL_EARNINGS_CLAIM]: { icon: '💸', color: 'text-green-600' },
        [TransactionType.DEPOSIT_APPROVED]: { icon: '🏦', color: 'text-green-600' },
        [TransactionType.WITHDRAW_REQUEST]: { icon: '📤', color: 'text-red-600' },
        [TransactionType.TIP_GIVEN]: { icon: '🎁', color: 'text-red-600' },
        [TransactionType.TIP_RECEIVED]: { icon: '🎁', color: 'text-green-600' },
    };

    const transactionInfo = typeInfo[type] || { icon: '❓', color: 'text-slate-600' };
    const formattedAmount = amount.toFixed(2);

    return (
        <li className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
                <span className="text-xl mr-4">{transactionInfo.icon}</span>
                <div>
                    <p className="font-semibold text-slate-800">{description || 'No description'}</p>
                    <p className="text-xs text-slate-400">{date.toLocaleString()}</p>
                </div>
            </div>
             <p className={`font-bold text-lg ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                {isCredit ? '+' : ''}{formattedAmount} <span className="text-sm text-slate-500">{currency === 'BDT' ? 'BDT' : 'JD TOKENS'}</span>
            </p>
        </li>
    );
}

const Profile: React.FC<ProfileProps> = (props) => {
    const {
        userId, userPoints, userBdtBalance, transactions, jobs, submissions, onReport, onLogout, displayName, email, createdAt, photoURL, totalEarnings, totalBdtEarnings,
        gigsCompleted, gigsCreated, onNavigate, onOpenEditProfile
    } = props;
    const { addToast } = useToasts();
    const [currentView, setCurrentView] = useState<'menu' | 'details'>('menu');
    
    const userSubmissions = submissions.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
    });

    const getStatusChip = (status: SubmissionStatus) => {
        switch(status) {
            case SubmissionStatus.APPROVED:
                return <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">Approved</span>
            case SubmissionStatus.REJECTED:
                return <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">Rejected</span>
            default:
                 return <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">Pending</span>
        }
    }

    const maskEmail = (email: string) => {
        if (!email) return '';
        const [name, domain] = email.split('@');
        if (!domain) return email;
        const maskedName = name.length > 5 ? `${name.substring(0, 3)}...` : `${name.substring(0, 1)}...`;
        return `${maskedName}@${domain}`;
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
            .then(() => addToast(`${label} copied to clipboard!`, 'success'))
            .catch(err => console.error('Failed to copy: ', err));
    };

    const MenuOption: React.FC<{ icon: string; title: string; subtitle: string; onClick?: () => void; isUpcoming?: boolean; }> = ({ icon, title, subtitle, onClick, isUpcoming }) => (
        <button
            onClick={onClick}
            disabled={!onClick}
            className="w-full text-left bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-4 transition-all duration-200 hover:shadow-md hover:border-purple-300 disabled:cursor-not-allowed"
        >
            <div className="text-3xl">{icon}</div>
            <div className="flex-grow">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    {title}
                    {isUpcoming && <span className="text-xs bg-yellow-400 text-yellow-900 font-bold px-1.5 py-0.5 rounded-full">Upcoming</span>}
                </h4>
                <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
            {onClick && <div className="text-slate-400">&rarr;</div>}
        </button>
    );
    
    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-purple-600 mb-2">Your Profile</h2>
                <div className="flex justify-center gap-4">
                    <button onClick={() => addToast('Support contact: support@jobdella.com', 'info')} className="bg-gray-200 hover:bg-gray-300 text-slate-700 font-semibold py-2 px-5 text-sm rounded-full transition-colors">
                        Support
                    </button>
                </div>
            </div>

             {/* Main Info Card */}
             <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                <div className="w-24 h-24 rounded-full bg-gray-300 mx-auto mb-4 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                    {photoURL ? (
                        <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-4xl font-bold text-gray-500">{displayName ? displayName.charAt(0).toUpperCase() : '?'}</span>
                    )}
                </div>
                <div className="flex items-center justify-center gap-2">
                    <h3 className="text-3xl font-bold text-slate-900">{displayName}</h3>
                    <button onClick={onOpenEditProfile} title="Edit Profile" className="p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                    </button>
                </div>
                <p className="text-slate-500 mt-1">{maskEmail(email)}</p>
                <p className="text-xs text-slate-400 mt-2">Member since {createdAt}</p>
            </div>

            {currentView === 'menu' && (
                 <div className="space-y-4">
                    <MenuOption 
                        icon="👤"
                        title="Profile Details"
                        subtitle="View stats, history, and user ID"
                        onClick={() => setCurrentView('details')}
                    />
                    <MenuOption 
                        icon="📢"
                        title="Announcements"
                        subtitle="View platform updates and news"
                        onClick={() => onNavigate('announcements')}
                    />
                    <MenuOption 
                        icon="👋"
                        title="Logout"
                        subtitle="Sign out of your account"
                        onClick={onLogout}
                    />
                </div>
            )}
            
            {currentView === 'details' && (
                <div className="space-y-8">
                    <button onClick={() => setCurrentView('menu')} className="text-sm font-semibold text-purple-600 hover:underline flex items-center gap-1">
                        &larr; Back to Profile Menu
                    </button>
                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <StatCard 
                            icon={<>⚡</>} 
                            label="JD TOKENS Balance" 
                            value={`${userPoints.toFixed(2)}`}
                            color="bg-yellow-100 text-yellow-700"
                        />
                        <StatCard 
                            icon={<>৳</>} 
                            label="BDT Balance" 
                            value={`${userBdtBalance.toFixed(2)}`}
                            color="bg-green-100 text-green-700"
                        />
                        <StatCard
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            label="Jobs Done" 
                            value={gigsCompleted}
                            color="bg-sky-100 text-sky-700"
                        />
                        <StatCard 
                            icon={<>⚡</>}
                            label="Total JD Earnings" 
                            value={`${totalEarnings.toFixed(2)}`}
                            color="bg-yellow-100 text-yellow-700"
                        />
                        <StatCard 
                            icon={<>৳</>}
                            label="Total BDT Earnings" 
                            value={`${totalBdtEarnings.toFixed(2)}`}
                            color="bg-green-100 text-green-700"
                        />
                        <StatCard 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                            label="Jobs Created" 
                            value={gigsCreated}
                            color="bg-indigo-100 text-indigo-700"
                        />
                    </div>
                    
                    {/* User ID Section */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="text-center md:text-left">
                            <div>
                                <p className="text-slate-600 text-sm">Your User ID</p>
                                <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                                    <p className="font-mono text-lg text-slate-900 break-all">{userId}</p>
                                    <button onClick={() => handleCopy(userId, 'User ID')} title="Copy User ID" className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Share this to receive funds from others.</p>
                            </div>
                        </div>
                    </div>

                    {/* Submission History */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Submission History</h3>
                        {userSubmissions.length > 0 ? (
                            <ul className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {userSubmissions.map(sub => {
                                    const jobForSubmission = jobs.find(j => j.id === sub.jobId);
                                    return (
                                        <li key={sub.id} className="bg-gray-50 p-4 rounded-lg">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <p className="font-bold text-slate-800">{sub.jobTitle}</p>
                                                    <p className="text-sm text-slate-500 mt-1 italic break-all">&ldquo;{sub.proof}&rdquo;</p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    {getStatusChip(sub.status)}
                                                    {sub.status === SubmissionStatus.APPROVED && jobForSubmission && (
                                                        <p className="text-green-600 font-bold text-lg mt-1">+{ jobForSubmission.reward.toFixed(2)} {jobForSubmission.currency === 'BDT' ? 'BDT' : 'JD TOKENS'}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {sub.status === SubmissionStatus.REJECTED && (
                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                    <p className="text-xs text-red-600 mb-2 pl-2 border-l-2 border-red-300 ml-1">
                                                        <strong>Reason:</strong> {sub.rejectionReason}
                                                    </p>
                                                    <button
                                                        onClick={() => onReport(sub)}
                                                        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold py-1 px-3 text-xs rounded-full transition-colors"
                                                    >
                                                        Report unfair rejection
                                                    </button>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="text-center py-10 bg-gray-50 rounded-lg">
                                <p className="text-slate-500">You haven't submitted any jobs yet.</p>
                            </div>
                        )}
                    </div>

                    {/* Transaction History */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Transaction History</h3>
                        {transactions.length > 0 ? (
                            <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                {transactions.map(tx => <TransactionRow key={tx.id} transaction={tx} />)}
                            </ul>
                        ) : (
                            <div className="text-center py-10 rounded-lg">
                                <p className="text-slate-500">No transactions yet.</p>
                            </div>
                        )}
                    </div>
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

export default Profile;