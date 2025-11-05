
import React, { useState, FormEvent, useEffect } from 'react';
import { Job } from '../types';
import { useToasts } from './Toasts';

interface AddQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (job: Job, additionalQuantity: number) => void;
  job: Job | null;
  userPoints: number;
  userBdtBalance: number;
}

const AddQuantityModal: React.FC<AddQuantityModalProps> = ({ isOpen, onClose, onConfirm, job, userPoints, userBdtBalance }) => {
  const [additionalQuantity, setAdditionalQuantity] = useState<number | ''>('');
  const { addToast } = useToasts();

  useEffect(() => {
    if (isOpen) {
      setAdditionalQuantity('');
    }
  }, [isOpen]);
  
  if (!isOpen || !job) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (additionalQuantity === '' || additionalQuantity <= 0) {
      addToast('Please enter a valid quantity.', 'error');
      return;
    }
    onConfirm(job, additionalQuantity);
  };
  
  const currency = job.currency;
  const baseCost = job.reward * (Number(additionalQuantity) || 0);
  const platformFee = baseCost * 0.10;
  const totalCost = baseCost + platformFee;
  const userBalance = currency === 'BDT' ? userBdtBalance : userPoints;
  const canAfford = userBalance >= totalCost;
  const formatValue = (val: number) => val.toFixed(2);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] transform transition-all scale-95 animate-modal-enter">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-green-600">Add Quantity</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <form id="add-quantity-form" onSubmit={handleSubmit} className="p-6 space-y-4 flex-grow overflow-y-auto">
          <div>
            <p className="text-slate-500 text-sm">Job Title:</p>
            <p className="font-bold text-lg text-slate-800">{job.title}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center bg-gray-100 p-3 rounded-lg">
            <div>
                <p className="text-slate-500 text-sm">Current Quantity</p>
                <p className="font-bold text-lg text-slate-800">{job.quantity}</p>
            </div>
            <div>
                <p className="text-slate-500 text-sm">Reward/Task</p>
                <p className="font-bold text-lg text-slate-800">{job.reward} {currency}</p>
            </div>
          </div>
           <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-slate-600 mb-1">Additional Quantity</label>
              <input
                id="quantity"
                type="number"
                value={additionalQuantity}
                onChange={(e) => setAdditionalQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                min="1"
                placeholder="How many more completions?"
                required
              />
            </div>
          <div className={`p-3 rounded-md text-sm ${canAfford || totalCost === 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <p>Additional Cost: <span className="font-bold">{formatValue(baseCost)}</span> {currency}</p>
            <p>Platform Fee (10%): <span className="font-bold">{formatValue(platformFee)}</span> {currency}</p>
            <p className="font-bold text-base mt-2 pt-2 border-t border-gray-200">Total: <span className="font-bold">{formatValue(totalCost)}</span> {currency}</p>
            <p className="mt-2">Your balance: {formatValue(userBalance)} {currency}.</p>
            {!canAfford && totalCost > 0 && <p className="font-bold mt-1">Insufficient funds.</p>}
          </div>
        </form>
        <div className="flex justify-end gap-4 p-4 border-t bg-gray-50 rounded-b-lg border-gray-200 flex-shrink-0">
            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-slate-800 font-bold py-2 px-4 rounded-full transition-colors">Cancel</button>
            <button 
              type="submit"
              form="add-quantity-form"
              disabled={!canAfford || totalCost <= 0}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              Confirm Purchase
            </button>
          </div>
        {/* FIX: Replaced inline style block with dangerouslySetInnerHTML to prevent TS parsing errors. */}
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

export default AddQuantityModal;