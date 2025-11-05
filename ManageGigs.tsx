import React, { useState, useEffect } from 'react';
import { Job, Submission, SubmissionStatus, JobApprovalStatus } from '../types';
import Icon from './Icon';

interface ManageGigsProps {
    postedJobs: Job[];
    submissions: Submission[];
    onEdit: (job: Job) => void;
    onDelete: (jobId: number) => void;
    onApprove: (submissionId: string) => void;
    onReject: (submission: Submission) => void;
    onOpenBoost: (job: Job) => void;
    onOpenAddQuantity: (job: Job) => void;
    onOpenTipModal: (submission: Submission) => void;
}

// Component to handle the boost button logic
const BoostButton: React.FC<{ job: Job; onOpenBoost: (job: Job) => void; }> = ({ job, onOpenBoost }) => {
    const isApproved = job.approvalStatus === JobApprovalStatus.APPROVED;
    const isCurrentlyBoosted = job.boostedUntil && job.boostedUntil.toDate() > new Date();
    
    const isDisabled = !isApproved || isCurrentlyBoosted;
    
    let tooltip = '';
    if (!isApproved) {
        tooltip = 'Job must be approved to be boosted.';
    } else if (isCurrentlyBoosted) {
        tooltip = 'This job is currently boosted.';
    } else {
        tooltip = 'Boost this job to get more visibility.';
    }
    
    const buttonText = isCurrentlyBoosted ? 'Boosted' : '🚀 Boost';

    return (
        <button 
            onClick={() => onOpenBoost(job)} 
            disabled={isDisabled}
            title={tooltip}
            className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold py-1.5 px-4 text-sm rounded-full flex items-center gap-1 disabled:bg-yellow-200 disabled:cursor-not-allowed disabled:text-yellow-500 min-w-[130px] justify-center"
        >
            {buttonText}
        </button>
    );
};


const BoostDisplay: React.FC<{ job: Job }> = ({ job }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const isBoosted = job.boostedUntil && job.boostedUntil.toDate() > new Date();

    useEffect(() => {
        if (!isBoosted) {
            setTimeLeft('');
            return;
        }

        const intervalId = setInterval(() => {
            const now = new Date();
            const boostedUntilDate = job.boostedUntil.toDate();
            const difference = boostedUntilDate.getTime() - now.getTime();

            if (difference <= 0) {
                setTimeLeft('');
                clearInterval(intervalId);
                return;
            }

            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [isBoosted, job.boostedUntil]);

    if (!isBoosted || !timeLeft) return null;
    
    return (
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
            🚀 Active Boost ({timeLeft})
        </span>
    );
};


const ManageGigs: React.FC<ManageGigsProps> = ({ postedJobs, submissions, onEdit, onDelete, onApprove, onReject, onOpenBoost, onOpenAddQuantity, onOpenTipModal }) => {
    useEffect(() => {
        const now = new Date();
        const hundredHours = 100 * 60 * 60 * 1000;
        
        const submissionsToAutoApprove = submissions.filter(sub => {
            if (sub.status !== SubmissionStatus.PENDING) return false;
            if (!sub.createdAt || typeof sub.createdAt.toDate !== 'function') return false; 
    
            const submissionTime = sub.createdAt.toDate().getTime();
            return now.getTime() - submissionTime > hundredHours;
        });
    
        if (submissionsToAutoApprove.length > 0) {
            submissionsToAutoApprove.forEach(sub => {
                console.log(`Auto-approving submission ${sub.id}`);
                onApprove(sub.id);
            });
        }
    }, [submissions, onApprove]);

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
    
    const SubmissionInfo: React.FC<{sub: Submission}> = ({ sub }) => (
        <div className="text-xs text-slate-500 mb-2 font-mono flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 gap-y-1">
            <span><strong>User:</strong> {sub.userDisplayName || 'N/A'}</span>
            <span className="flex items-center gap-2"><strong>ID:</strong> <code className="text-xs bg-gray-200 p-1 rounded break-all">{sub.userId}</code></span>
            <span><strong>IP:</strong> {sub.userIp || 'N/A'}</span>
        </div>
    );

    return (
        <div>
            <h2 className="text-3xl font-bold text-indigo-600 mb-2">Manage Your Jobs</h2>
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg relative mb-6" role="alert">
                <strong className="font-bold block mb-2">Important Rules:</strong>
                <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Submissions not reviewed within <strong>100 hours</strong> will be automatically approved.</li>
                    <li>If you delete a job, any pending submissions will be <strong>auto-approved</strong> and the cost deducted from your refund.</li>
                </ul>
            </div>
            {postedJobs.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-lg">
                    <p className="text-slate-500 text-lg">You haven't posted any jobs yet.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {postedJobs.map(job => {
                        const jobSubmissions = submissions.filter(s => s.jobId === job.id);
                        const pendingSubmissions = jobSubmissions.filter(s => s.status === SubmissionStatus.PENDING);
                        const totalTaken = job.quantity - job.remaining;
                        const approvedCount = totalTaken - (job.pendingCount || 0);
                        
                        const isRejected = job.approvalStatus === JobApprovalStatus.REJECTED;
                        const isApproved = job.approvalStatus === JobApprovalStatus.APPROVED;
                        const isActionable = isApproved;
                        const isCurrentlyBoosted = job.boostedUntil && job.boostedUntil.toDate() > new Date();

                        return (
                            <div key={job.id} className={`bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 transition-all ${isCurrentlyBoosted ? 'ring-2 ring-yellow-400' : ''} ${isRejected ? 'opacity-70' : ''}`}>
                                <div className="p-5 bg-gray-50">
                                    <div className="flex justify-between items-start flex-wrap gap-y-3">
                                        <div className="flex items-start">
                                            <Icon platform={job.platform} className="w-8 h-8 mr-4 flex-shrink-0" />
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-800">{job.title}</h3>
                                                <p className="text-sm text-slate-600">{totalTaken}/{job.quantity} completions ({approvedCount} approved)</p>
                                                <div className="text-xs text-slate-400 mt-2 font-mono flex flex-col sm:flex-row sm:gap-4">
                                                    <span>Job ID: {job.id}</span>
                                                    <span className="truncate">User ID: {job.posterId}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 justify-end items-center">
                                            {isRejected && (
                                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                                                    ❌ Rejected
                                                </span>
                                            )}
                                            {isApproved && (
                                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                                                    ✅ Approved
                                                </span>
                                            )}
                                            <BoostDisplay job={job} />
                                            <BoostButton job={job} onOpenBoost={onOpenBoost} />
                                            <button onClick={() => onOpenAddQuantity(job)} disabled={!isActionable} title={!isActionable ? "Job must be approved to add quantity" : ""} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1.5 px-4 text-sm rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed">
                                                + Add Quantity
                                            </button>
                                            <button onClick={() => onEdit(job)} disabled={!isActionable} title={!isActionable ? "Job must be approved to edit" : ""} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-4 text-sm rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed">
                                                Edit
                                            </button>
                                            <button onClick={() => onDelete(job.id)} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1.5 px-4 text-sm rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                {isRejected && job.rejectionReason && (
                                    <div className="p-4 bg-red-50 border-t border-b border-red-200">
                                        <h4 className="font-bold text-red-800 mb-2">Rejection Reason:</h4>
                                        <p className="text-sm text-red-700 whitespace-pre-wrap">{job.rejectionReason}</p>
                                    </div>
                                )}

                                <div className="px-5 py-4">
                                     <div className="mb-3 p-3 bg-gray-100 rounded-md border border-gray-200">
                                        <p className="text-sm text-slate-500 font-semibold">Proof Requirement:</p>
                                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{job.proofRequirement}</p>
                                    </div>
                                    <h4 className="font-bold text-slate-700 mb-3">Submissions ({jobSubmissions.length})</h4>
                                    {pendingSubmissions.length > 0 ? (
                                        <div className="space-y-3">
                                            {pendingSubmissions.map(sub => (
                                                <div key={sub.id} className="bg-gray-100 p-3 rounded-md">
                                                    <SubmissionInfo sub={sub} />
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-slate-700 text-sm break-all pr-4">&ldquo;{sub.proof}&rdquo;</p>
                                                        <div className="flex gap-2 flex-shrink-0">
                                                            <button onClick={() => onApprove(sub.id)} disabled={!isApproved} title={!isApproved ? "Job must be approved to manage submissions" : ""} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 text-xs rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed">Approve</button>
                                                            <button onClick={() => onReject(sub)} disabled={!isApproved} title={!isApproved ? "Job must be approved to manage submissions" : ""} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 text-xs rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed">Reject</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">No pending submissions to review.</p>
                                    )}

                                    {jobSubmissions.filter(s => s.status !== SubmissionStatus.PENDING).length > 0 && (
                                      <details className="mt-4">
                                        <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-800">View Submission History</summary>
                                        <div className="mt-2 space-y-2">
                                          {jobSubmissions.filter(s => s.status !== SubmissionStatus.PENDING).map(sub => (
                                            <div key={sub.id} className="bg-gray-100 p-2 rounded-md text-sm">
                                                <SubmissionInfo sub={sub} />
                                                <div className="flex justify-between items-center gap-2 flex-wrap">
                                                    <p className="text-slate-500 italic break-words flex-grow pr-4">&ldquo;{sub.proof}&rdquo;</p>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                         {(sub.status === SubmissionStatus.APPROVED || sub.status === SubmissionStatus.REJECTED) && (
                                                            <button
                                                                onClick={() => onOpenTipModal(sub)}
                                                                className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                                                                    sub.status === SubmissionStatus.APPROVED 
                                                                    ? 'bg-green-200 text-green-800 hover:bg-green-300' 
                                                                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                                                }`}
                                                                title="Send a tip"
                                                            >
                                                                🎁 Tip
                                                            </button>
                                                        )}
                                                        {getStatusChip(sub.status)}
                                                    </div>
                                                </div>
                                                {sub.status === SubmissionStatus.REJECTED && sub.rejectionReason && (
                                                    <p className="text-xs text-red-600 mt-1.5 pl-2 border-l-2 border-red-300 ml-1">
                                                        <strong>Reason:</strong> {sub.rejectionReason}
                                                    </p>
                                                )}
                                            </div>
                                          ))}
                                        </div>
                                      </details>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default ManageGigs;