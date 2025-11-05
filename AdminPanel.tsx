import React, { useState, useEffect } from 'react';
import { Job, JobApprovalStatus, Announcement, Deposit, TransactionType, NotificationType } from '../types';
import Icon from './Icon';
import firebase, { db, serverTimestamp } from '../firebase';
import { useToasts } from './Toasts';

interface AdminPanelProps {
    jobs: Job[];
}

// Helper functions copied from App.tsx
const roundCurrency = (num: number): number => {
    return parseFloat(num.toFixed(4));
};

const findUserRef = async (identifier: string): Promise<any | null> => {
    if (!identifier) return null;
    
    // 1. Try as UID first
    const userDoc = await db.collection('users').doc(identifier).get();
    if (userDoc.exists) {
        return userDoc.ref;
    }
    
    // 2. Fallback to display name with case variations
    const name = identifier;
    const namesToQuery = [...new Set([
        name, 
        name.toLowerCase(), 
        name.toUpperCase(),
        name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
    ])];
    
    for (const nameCase of namesToQuery) {
        const usersQuery = await db.collection('users').where('displayName', '==', nameCase).limit(1).get();
        if (!usersQuery.empty) {
            return usersQuery.docs[0].ref;
        }
    }
    
    // 3. If not found, return null
    return null;
};
const increment = firebase.firestore.FieldValue.increment;


const AdminPanel: React.FC<AdminPanelProps> = ({ jobs }) => {
    const [activeTab, setActiveTab] = useState('deposits');
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [pendingDeposits, setPendingDeposits] = useState<Deposit[]>([]);
    const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
    const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [depositToReject, setDepositToReject] = useState<Deposit | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const { addToast } = useToasts();

    const approvedJobs = jobs.filter(j => j.approvalStatus === JobApprovalStatus.APPROVED);

    useEffect(() => {
        const unsubAnnouncements = db.collection('announcements').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            const announcementsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as Announcement));
            setAnnouncements(announcementsData);
        }, err => {
            console.error("Failed to fetch announcements:", err);
            addToast("Could not load announcements.", "error");
        });

        const unsubDeposits = db.collection('deposits').where('status', '==', 'PENDING').orderBy('createdAt', 'asc').onSnapshot(snapshot => {
            const depositsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as Deposit));
            setPendingDeposits(depositsData);
        }, err => {
            console.error("Failed to fetch deposits:", err);
            addToast("Could not load pending deposits.", "error");
        });

        return () => {
            unsubAnnouncements();
            unsubDeposits();
        };
    }, [addToast]);

    const handleCreateAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAnnouncementTitle.trim() || !newAnnouncementContent.trim()) {
            addToast('Title and content cannot be empty.', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            await db.collection('announcements').add({
                title: newAnnouncementTitle,
                content: newAnnouncementContent,
                isActive: true,
                createdAt: serverTimestamp(),
            });
            addToast("Announcement posted successfully!", 'success');
            setNewAnnouncementTitle('');
            setNewAnnouncementContent('');
        } catch (error) {
            console.error("Error posting announcement:", error);
            addToast("Failed to post announcement.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApproveDeposit = async (deposit: Deposit) => {
        const batch = db.batch();
        const depositRef = db.collection('deposits').doc(deposit.id);
        const userWalletRef = db.collection('wallets').doc(deposit.userId);
        const userRef = db.collection('users').doc(deposit.userId);

        // 1. Update deposit status
        batch.update(depositRef, { status: 'APPROVED' });

        // 2. Add funds to user wallet
        batch.update(userWalletRef, { bdtBalance: increment(deposit.amount) });

        // 3. Create transaction log
        const txRef = userRef.collection('transactions').doc();
        batch.set(txRef, {
            type: TransactionType.DEPOSIT_APPROVED,
            amount: deposit.amount,
            currency: 'BDT',
            description: `Deposit of ${deposit.amount} BDT approved. TrxID: ${deposit.transactionId}`,
            date: serverTimestamp(),
        });

        // 4. Create notification for the user
        const notificationRef = userRef.collection('notifications').doc();
        batch.set(notificationRef, {
            userId: deposit.userId,
            type: NotificationType.DEPOSIT_APPROVED,
            message: `Your deposit of ${deposit.amount} BDT has been approved!`,
            isRead: false,
            createdAt: serverTimestamp(),
        });
        
        // 5. Handle referral bonus (5% on deposits)
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (userData?.referredBy) {
            const referrerUserRef = await findUserRef(userData.referredBy);
            if (referrerUserRef) {
                const commissionBdt = roundCurrency(deposit.amount * 0.05);
                if (commissionBdt > 0) {
                    batch.update(referrerUserRef, {
                        unclaimedBdtReferralEarnings: increment(commissionBdt)
                    });
                     // Notify referrer about commission
                    const referrerNotificationRef = referrerUserRef.collection('notifications').doc();
                    batch.set(referrerNotificationRef, {
                        userId: referrerUserRef.id,
                        type: NotificationType.REFERRAL_COMMISSION,
                        message: `You earned ${commissionBdt.toFixed(2)} BDT commission because your referral made a deposit!`,
                        isRead: false,
                        createdAt: serverTimestamp(),
                    });
                }
            }
        }

        try {
            await batch.commit();
            addToast('Deposit approved successfully!', 'success');
        } catch (error) {
            console.error("Error approving deposit:", error);
            addToast('Failed to approve deposit.', 'error');
        }
    };

    const handleRejectDeposit = async (depositId: string, reason: string) => {
        if (!reason.trim()) {
            addToast('Rejection reason is required.', 'error');
            return;
        }
        const depositRef = db.collection('deposits').doc(depositId);
        try {
            const depositDoc = await depositRef.get();
            const depositData = depositDoc.data();
            if(!depositData) {
                addToast('Deposit not found.', 'error');
                return;
            }

            const batch = db.batch();

            batch.update(depositRef, { status: 'REJECTED', rejectionReason: reason });
            
            const userRef = db.collection('users').doc(depositData.userId);
            const notificationRef = userRef.collection('notifications').doc();
            batch.set(notificationRef, {
                userId: depositData.userId,
                type: NotificationType.DEPOSIT_REJECTED,
                message: `Your deposit of ${depositData.amount} BDT was rejected. Reason: ${reason}`,
                isRead: false,
                createdAt: serverTimestamp(),
            });

            await batch.commit();
            addToast('Deposit rejected.', 'info');
        } catch (error) {
            console.error("Error rejecting deposit:", error);
            addToast('Failed to reject deposit.', 'error');
        }
        setDepositToReject(null);
        setRejectionReason('');
    };


    const renderTabs = () => (
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                 <button
                    onClick={() => setActiveTab('deposits')}
                    className={`${activeTab === 'deposits' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                    Pending Deposits <span className="bg-yellow-100 text-yellow-800 ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium">{pendingDeposits.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('approvedJobs')}
                    className={`${activeTab === 'approvedJobs' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                    Approved Jobs <span className="bg-green-100 text-green-600 ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium">{approvedJobs.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('announcements')}
                    className={`${activeTab === 'announcements' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                    Announcements <span className="bg-blue-100 text-blue-600 ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium">{announcements.length}</span>
                </button>
            </nav>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'deposits':
                return (
                    <div className="space-y-4">
                        {pendingDeposits.length === 0 ? <p className="text-gray-500 p-8 text-center bg-white rounded-lg">No pending deposits to review.</p> :
                         pendingDeposits.map(deposit => (
                            <div key={deposit.id} className="bg-white p-4 rounded-lg border space-y-3">
                                <div className="flex justify-between items-start flex-wrap gap-2">
                                    <div>
                                        <p className="text-xl font-bold text-green-600">{deposit.amount} BDT</p>
                                        <p className="text-xs text-gray-400">Requested on: {deposit.createdAt?.toDate().toLocaleString()}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleApproveDeposit(deposit)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 text-xs rounded-full">Approve</button>
                                        <button onClick={() => setDepositToReject(deposit)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 text-xs rounded-full">Reject</button>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border font-mono grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                    <p><strong>User ID:</strong> <span className="break-all">{deposit.userId}</span></p>
                                    <p><strong>Sender No:</strong> {deposit.senderNumber}</p>
                                    <p className="md:col-span-2"><strong>TrxID:</strong> <span className="break-all">{deposit.transactionId}</span></p>
                                </div>

                                {depositToReject?.id === deposit.id && (
                                    <div className="p-3 bg-red-50 border-l-4 border-red-400 space-y-2">
                                        <label htmlFor={`reject-${deposit.id}`} className="text-sm font-semibold text-red-800">Rejection Reason:</label>
                                        <textarea
                                            id={`reject-${deposit.id}`}
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            className="w-full bg-white border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
                                            rows={2}
                                            placeholder="e.g., Transaction ID does not match."
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={() => handleRejectDeposit(deposit.id, rejectionReason)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 text-xs rounded-full">Confirm Reject</button>
                                            <button onClick={() => setDepositToReject(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-3 text-xs rounded-full">Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                         ))}
                    </div>
                );
            case 'approvedJobs':
                return (
                    <div className="space-y-4">
                        {approvedJobs.length === 0 ? <p className="text-gray-500 p-8 text-center bg-white rounded-lg">No jobs have been approved yet.</p> :
                         approvedJobs.map(job => (
                            <div key={job.id} className="bg-white p-4 rounded-lg border space-y-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start">
                                        <Icon platform={job.platform} className="w-6 h-6 mr-3 mt-1 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-bold text-lg">{job.title}</h3>
                                            <p className="text-xs text-gray-400">Poster ID: {job.posterId}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">Approved</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-500">Task:</p>
                                    <p className="text-sm text-gray-700 p-2 bg-gray-50 rounded border whitespace-pre-wrap max-h-24 overflow-y-auto">{job.task}</p>
                                </div>
                            </div>
                         ))}
                    </div>
                );
            case 'announcements':
                return (
                    <div>
                        <form onSubmit={handleCreateAnnouncement} className="bg-white p-4 rounded-lg border mb-6 space-y-3">
                            <h3 className="text-lg font-bold text-gray-800">Create New Announcement</h3>
                             <div>
                                <label htmlFor="announcement-title" className="block text-sm font-medium text-slate-600 mb-1">Title</label>
                                <input
                                id="announcement-title"
                                type="text"
                                value={newAnnouncementTitle}
                                onChange={(e) => setNewAnnouncementTitle(e.target.value)}
                                placeholder="e.g., Important Platform Update"
                                className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                required
                                />
                            </div>
                            <div>
                                <label htmlFor="announcement-content" className="block text-sm font-medium text-slate-600 mb-1">Content</label>
                                <textarea
                                id="announcement-content"
                                value={newAnnouncementContent}
                                onChange={(e) => setNewAnnouncementContent(e.target.value)}
                                placeholder="Enter the announcement message here."
                                className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 h-24 resize-y focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                required
                                />
                            </div>
                            <div className="text-right">
                                <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-full transition-colors disabled:bg-indigo-300">
                                    {isSubmitting ? 'Posting...' : 'Post Announcement'}
                                </button>
                            </div>
                        </form>
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-800">Existing Announcements</h3>
                            {announcements.length === 0 ? <p className="text-gray-500 p-8 text-center bg-white rounded-lg">No announcements have been posted yet.</p> :
                            announcements.map(ann => (
                                <div key={ann.id} className="bg-white p-4 rounded-lg border">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold">{ann.title}</h4>
                                            <p className="text-xs text-gray-400">Posted on: {ann.createdAt?.toDate().toLocaleString()}</p>
                                        </div>
                                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ann.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {ann.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded border whitespace-pre-wrap">{ann.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-indigo-600 mb-4">Admin Panel</h2>
            {renderTabs()}
            <div className="mt-6">
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminPanel;