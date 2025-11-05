import React, { useState } from 'react';
import { Job } from '../types';

interface BoostConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (duration: number, cost: number) => void;
  job: Job | null;
  userBdtBalance: number;
}

const boostOptions = [
    { duration: 30, cost: 6 },
    { duration: 45, cost: 7.5 },
    { duration: 60, cost: 10 },
];

const BoostConfirmationModal: React.FC<BoostConfirmationModalProps> = ({ isOpen, onClose, onConfirm, job, userBdtBalance }) => {
  const [selectedDuration, setSelectedDuration] = useState(30);

  if (!isOpen || !job) return null;

  const selectedOption = boostOptions.find(o => o.duration === selectedDuration)!;
  const canAfford = userBdtBalance >= selectedOption.cost;

  const handleConfirm = () => {
    if (canAfford) {
        onConfirm(selectedOption.duration, selectedOption.cost);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md transform transition-all scale-95 animate-modal-enter">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-yellow-500 flex items-center gap-2">🚀 Boost Job</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <div className="p-6">
          <div className="text-center">
            <p className="text-slate-600">Choose a duration to boost your job:</p>
            <p className="font-bold text-xl text-slate-900 mt-1 mb-4">{job.title}</p>
          </div>

          <div className="space-y-3 mb-6">
            {boostOptions.map(option => (
                <label key={option.duration} className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedDuration === option.duration ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <div className="flex items-center">
                        <input
                            type="radio"
                            name="boost-option"
                            value={option.duration}
                            checked={selectedDuration === option.duration}
                            onChange={() => setSelectedDuration(option.duration)}
                            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300"
                        />
                        <span className={`ml-3 font-semibold ${selectedDuration === option.duration ? 'text-yellow-900' : 'text-slate-700'}`}>
                            {option.duration} Minutes
                        </span>
                    </div>
                    <span className={`font-bold text-lg ${selectedDuration === option.duration ? 'text-yellow-900' : 'text-slate-800'}`}>
                        {option.cost.toFixed(2)} BDT
                    </span>
                </label>
            ))}
          </div>


          <div className={`p-3 rounded-md text-sm ${canAfford ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <p className="font-bold text-base mt-1">Cost: <span className="font-bold">{selectedOption.cost.toFixed(2)}</span> BDT</p>
            <p className="mt-2">Your balance: {userBdtBalance.toFixed(2)} BDT.</p>
            {!canAfford && <p className="font-bold mt-1">Insufficient funds to boost this job.</p>}
          </div>

        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-slate-800 font-bold py-2 px-4 rounded-full transition-colors">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={!canAfford}
            className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-2 px-4 rounded-full transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            Confirm Boost
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

export default BoostConfirmationModal;