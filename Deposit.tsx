import React, { useState, FormEvent } from 'react';
import { useToasts } from './Toasts';

interface DepositProps {
    onDepositSubmit: (senderNumber: string, amount: number, transactionId: string) => Promise<void>;
}

const Deposit: React.FC<DepositProps> = ({ onDepositSubmit }) => {
  const [senderNumber, setSenderNumber] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isDepositSubmitting, setIsDepositSubmitting] = useState(false);
  const { addToast } = useToasts();

  const handleDepositSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!senderNumber.trim() || !depositAmount.trim() || !transactionId.trim()) {
      addToast('Please fill in all deposit fields.', 'error');
      return;
    }

    setIsDepositSubmitting(true);
    try {
      await onDepositSubmit(senderNumber, Number(depositAmount), transactionId);
      // Reset form on success
      setSenderNumber('');
      setDepositAmount('');
      setTransactionId('');
    } catch (error) {
      // Error is alerted by the parent component. We just need to catch it to stop the loading state.
      console.error("Deposit submission failed:", error);
    } finally {
      setIsDepositSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg border border-gray-200">
      <h3 className="text-2xl font-bold text-green-600 mb-4 text-center">Deposit BDT via bKash</h3>
      <div className="text-center mb-6">
        <p className="text-slate-600">Use bKash <span className="font-bold text-pink-600">Send Money</span> to the number below:</p>
        <div className="bg-gray-200 my-3 py-3 px-4 rounded-lg select-all">
          <p className="text-2xl font-bold tracking-widest text-slate-900">01979272952</p>
        </div>
        <p className="text-xs text-slate-400">(This is a personal bKash number. Only use 'Send Money'.)</p>
      </div>
      <p className="text-center text-slate-500 mb-6 border-t border-gray-200 pt-6">After sending money, fill out this form to confirm.</p>
      
      <form onSubmit={handleDepositSubmit} className="space-y-4 max-w-sm mx-auto">
        <div>
          <label htmlFor="senderNumber" className="block text-sm font-medium text-slate-600 mb-1">Your Sender bKash Number</label>
          <input
            id="senderNumber"
            type="tel"
            value={senderNumber}
            onChange={(e) => setSenderNumber(e.target.value)}
            placeholder="The number you sent money from"
            className="w-full bg-gray-100 border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-green-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label htmlFor="depositAmount" className="block text-sm font-medium text-slate-600 mb-1">Amount (BDT)</label>
          <input
            id="depositAmount"
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="e.g., 500"
            className="w-full bg-gray-100 border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-green-500 focus:outline-none"
            min="1"
            required
          />
        </div>
        <div>
          <label htmlFor="transactionId" className="block text-sm font-medium text-slate-600 mb-1">Transaction ID (TrxID)</label>
          <input
            id="transactionId"
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Find this in your bKash confirmation SMS"
            className="w-full bg-gray-100 border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-green-500 focus:outline-none"
            required
          />
        </div>
        <div className="pt-4">
          <button 
            type="submit"
            disabled={isDepositSubmitting}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-full transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 transform hover:scale-105 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500"
          >
            {isDepositSubmitting ? 'Submitting...' : 'Submit Deposit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Deposit;
