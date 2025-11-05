import React from 'react';
import { useToasts } from './Toasts';

interface ReferProps {
    referralCode: string;
    referredBy: string | null;
    referralsCount: number;
    unclaimedReferralEarnings: number; // JD TOKENS
    unclaimedBdtReferralEarnings: number;
    onClaimReferralEarnings: () => void;
    onClaimBdtReferralEarnings: () => void;
}

const Refer: React.FC<ReferProps> = ({
    referralCode,
    referredBy,
    referralsCount,
    unclaimedReferralEarnings,
    unclaimedBdtReferralEarnings,
    onClaimReferralEarnings,
    onClaimBdtReferralEarnings,
}) => {
    const { addToast } = useToasts();

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
            .then(() => addToast(`${label} copied to clipboard!`, 'success'))
            .catch(err => console.error('Failed to copy: ', err));
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-sky-500">
                Refer & Earn
            </h2>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                 <div className="text-center md:text-left">
                     <div>
                        <p className="text-slate-600 text-sm">Your Referral Code</p>
                        <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                            <p className="p-1 px-3 border border-dashed border-gray-300 rounded-lg text-lg font-bold text-slate-900 tracking-widest bg-gray-100">{referralCode}</p>
                            <button onClick={() => handleCopy(referralCode, 'Referral Code')} title="Copy Code" className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </button>
                        </div>
                         <p className="text-xs text-slate-400 mt-1">{referralsCount} {referralsCount === 1 ? 'friend has' : 'friends have'} joined.</p>
                         {referredBy && (
                            <p className="text-xs text-slate-400 mt-1">
                                Joined using code: <span className="font-semibold text-slate-500">{referredBy}</span>
                            </p>
                         )}
                     </div>
                 </div>
                 <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="bg-sky-50 text-sky-800 p-3 rounded-lg text-sm text-center space-y-1">
                        <p>New users signing up with a referral code now receive <strong>5 JD TOKENS</strong>, and the referrer receives <strong>4 JD TOKENS</strong>.</p>
                        <p>Additionally, the referrer receives a <strong>5% BDT bonus</strong> on deposits made by their referrals.</p>
                    </div>
                 </div>
                 <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                     <div>
                        <p className="text-slate-600 text-sm text-center sm:text-left">Unclaimed JD TOKENS Earnings</p>
                        <p className="text-2xl font-bold text-yellow-600 text-center sm:text-left">{unclaimedReferralEarnings.toFixed(2)}</p>
                     </div>
                     <button
                        onClick={onClaimReferralEarnings}
                        disabled={unclaimedReferralEarnings <= 0}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-full transition-colors w-full sm:w-auto disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400"
                     >
                        Claim JD
                     </button>
                 </div>
                 <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                     <div>
                        <p className="text-slate-600 text-sm text-center sm:text-left">Unclaimed BDT Earnings</p>
                        <p className="text-2xl font-bold text-green-600 text-center sm:text-left">{unclaimedBdtReferralEarnings.toFixed(2)}</p>
                     </div>
                     <button
                        onClick={onClaimBdtReferralEarnings}
                        disabled={unclaimedBdtReferralEarnings <= 0}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full transition-colors w-full sm:w-auto disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400"
                     >
                        Claim BDT
                     </button>
                 </div>
            </div>
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

export default Refer;
