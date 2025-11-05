import React, { useState, FormEvent } from 'react';
import { useToasts } from './Toasts';
import Deposit from './Deposit';

interface WalletProps {
    userPoints: number;
    userBdtBalance: number;
    onDepositSubmit: (senderNumber: string, amount: number, transactionId: string) => Promise<void>;
    onWithdrawalSubmit: (bKashNumber: string, amount: number) => Promise<void>;
}

const Wallet: React.FC<WalletProps> = ({ userPoints, userBdtBalance, onDepositSubmit, onWithdrawalSubmit }) => {
  // State for Withdrawal
  const [bKashNumber, setBKashNumber] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawSubmitting, setIsWithdrawSubmitting] = useState(false);
  const { addToast } = useToasts();

  const handleWithdrawalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!bKashNumber.trim() || !withdrawAmount.trim() || amount <= 0) {
      addToast('Please fill in all withdrawal fields correctly.', 'error');
      return;
    }
    if (amount < 30) {
      addToast('Minimum withdrawal is 30 BDT.', 'error');
      return;
    }
    if (amount > userBdtBalance) {
      addToast('Insufficient BDT balance.', 'error');
      return;
    }

    setIsWithdrawSubmitting(true);
    try {
      await onWithdrawalSubmit(bKashNumber, amount);
      // Reset form
      setBKashNumber('');
      setWithdrawAmount('');
    } catch (error) {
      console.error("Withdrawal submission failed in component:", error);
    } finally {
      setIsWithdrawSubmitting(false);
    }
  };
  
  const withdrawalAmountNum = Number(withdrawAmount) || 0;
  const withdrawalFee = withdrawalAmountNum * 0.10;
  const receivableAmount = withdrawalAmountNum - withdrawalFee;


  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-green-600 mb-6 text-center">Your Wallet</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                <p className="text-slate-600 text-lg">JD TOKENS Balance</p>
                <p className="text-4xl font-bold text-slate-900 tracking-wider flex items-center justify-center gap-2">
                    <span className="text-yellow-500 text-3xl">⚡</span>
                    {userPoints.toFixed(2)}
                </p>
            </div>
             <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                <p className="text-slate-600 text-lg">BDT Balance</p>
                <p className="text-4xl font-bold text-slate-900 tracking-wider flex items-center justify-center gap-2">
                    <span className="text-green-500 text-3xl">৳</span>
                     {userBdtBalance.toFixed(2)}
                </p>
            </div>
        </div>
      </div>

      {/* Withdrawal Section */}
      <div className="bg-white p-6 md:p-8 rounded-lg border border-gray-200">
        <h3 className="text-2xl font-bold text-red-600 mb-4 text-center">Withdraw BDT</h3>
        <p className="text-center text-slate-500 mb-6">Request a withdrawal to your bKash personal number. Minimum withdrawal is 30 BDT.</p>
        
        <form onSubmit={handleWithdrawalSubmit} className="space-y-4 max-w-sm mx-auto">
          <div>
            <label htmlFor="bKashNumber" className="block text-sm font-medium text-slate-600 mb-1">Your bKash Personal Number</label>
            <input
              id="bKashNumber"
              type="tel"
              value={bKashNumber}
              onChange={(e) => setBKashNumber(e.target.value)}
              placeholder="e.g., 01xxxxxxxxx"
              className="w-full bg-gray-100 border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-red-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label htmlFor="withdrawAmount" className="block text-sm font-medium text-slate-600 mb-1">Amount to Withdraw (BDT)</label>
            <input
              id="withdrawAmount"
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="e.g., 100"
              className="w-full bg-gray-100 border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-red-500 focus:outline-none"
              min="30"
              step="any"
              required
            />
          </div>
          
          {withdrawalAmountNum > 0 && (
            <div className="p-3 rounded-md text-sm bg-gray-100 text-slate-800 space-y-1">
                <div className="flex justify-between">
                    <span>Withdrawal Fee (10%):</span>
                    <span className="font-bold">- {withdrawalFee.toFixed(2)} BDT</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-300">
                    <span>You Will Receive:</span>
                    <span>{receivableAmount.toFixed(2)} BDT</span>
                </div>
            </div>
          )}

          <div className="pt-4">
            <button 
              type="submit"
              disabled={isWithdrawSubmitting}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-full transition-all duration-300 ease-in-out shadow-lg shadow-red-500/20 transform hover:scale-105 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500"
            >
              {isWithdrawSubmitting ? 'Submitting Request...' : 'Request Withdrawal'}
            </button>
          </div>
        </form>
      </div>

      {/* Deposit Section */}
      <Deposit onDepositSubmit={onDepositSubmit} />
    </div>
  );
};

export default Wallet;