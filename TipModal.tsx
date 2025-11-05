import React, { useState, FormEvent, useEffect } from 'react';
import { Submission, Job } from '../types';
import { useToasts } from './Toasts';

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (submission: Submission, amount: number, currency: 'JD TOKENS' | 'BDT') => void;
  submission: Submission | null;
  job: Job | null; // Pass the job for currency info
  userPoints: number;
  userBdtBalance: number;
}

const TipModal: React.FC<TipModalProps> = ({ isOpen, onClose, onConfirm, submission, job, userPoints, userBdtBalance }) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState<'JD TOKENS' | 'BDT'>('JD TOKENS');
  const { addToast } = useToasts();

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      // Default to the job's currency if available
      setCurrency(job?.currency || 'JD TOKENS');
    }
  }, [isOpen, job]);

  if (!isOpen || !submission || !job) return null;

  const handleConfirm = () => {
    if (amount === '' || amount <= 0) {
        addToast('Please enter a valid tip amount.', 'error');
        return;
    }
    onConfirm(submission, amount, currency);
  };

  const userBalance = currency === 'BDT' ? userBdtBalance : userPoints;
  const canAfford = userBalance >= (Number(amount) || 0);
  const quickTipAmounts = currency === 'BDT' ? [1, 5, 10] : [5, 10, 20];


  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] transform transition-all scale-95 animate-modal-enter">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-green-600">Send a Tip</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
            <div className="bg-gray-100 p-4 rounded-lg mb-6 text-sm">
                <p className="text-slate-600 mb-2"><strong className="text-slate-800">Job:</strong> {submission.jobTitle}</p>
                <p className="text-slate-600"><strong className="text-slate-800">Proof Submitted:</strong></p>
                <blockquote className="border-l-4 border-gray-400 pl-4 italic text-slate-800 my-2 break-all">
                    "{submission.proof}"
                </blockquote>
                <p className="text-xs text-slate-500 mt-2">You are tipping the user who submitted this proof for their excellent work.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Currency</label>
                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as 'JD TOKENS' | 'BDT')}
                        className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                    >
                        <option value="JD TOKENS">JD TOKENS</option>
                        <option value="BDT">BDT</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="tip-amount" className="block text-sm font-medium text-slate-600 mb-2">Tip Amount</label>
                    <div className="flex items-center gap-2 mb-3">
                        {quickTipAmounts.map(val => (
                            <button key={val} type="button" onClick={() => setAmount(val)} className="text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-slate-700 px-3 py-1 rounded-full">{val} {currency === 'BDT' ? 'BDT' : 'JD'}</button>
                        ))}
                    </div>
                     <input
                        id="tip-amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="Enter custom amount"
                        className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                        min="0.01"
                        step="any"
                        required
                    />
                </div>
                <div className={`p-3 rounded-md text-sm ${canAfford || Number(amount) === 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    <p className="mt-1">Your balance: {userBalance.toFixed(2)} {currency}</p>
                    {!canAfford && Number(amount) > 0 && <p className="font-bold mt-1">Insufficient funds.</p>}
                </div>
            </div>
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-4 border-t border-gray-200 flex-shrink-0">
            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-slate-800 font-bold py-2 px-4 rounded-full transition-colors">Cancel</button>
            <button 
                onClick={handleConfirm}
                disabled={!canAfford || amount === '' || amount <= 0}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                Send Tip
            </button>
        </div>
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

export default TipModal;
