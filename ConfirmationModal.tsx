
import React, { useState, useEffect } from 'react';
import { Job } from '../types';
import Icon from './Icon';
import { useToasts } from './Toasts';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (jobId: number, proof: string) => void;
  job: Job | null;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, job }) => {
  const [proof, setProof] = useState('');
  const { addToast } = useToasts();

  useEffect(() => {
    if (isOpen) {
      setProof('');
    }
  }, [isOpen]);

  if (!isOpen || !job) return null;

  const handleConfirm = () => {
    if (proof.trim() === '') {
        addToast('Please provide proof of completion.', 'error');
        return;
    }
    onConfirm(job.id, proof);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] transform transition-all scale-95 animate-modal-enter">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-sky-600">Submit Proof of Completion</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
            <div className="flex justify-center items-center mb-4 text-center">
                <Icon platform={job.platform} className="w-10 h-10 mr-3 flex-shrink-0" />
                <h3 className="text-xl font-bold text-slate-800">{job.title}</h3>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <p className="text-slate-600 mb-2 break-words"><strong className="text-slate-800">Task:</strong> {job.task}</p>
                <p className="text-slate-600 mb-2 break-words"><strong className="text-slate-800">Proof Required:</strong> {job.proofRequirement}</p>
                <div className="font-bold text-2xl mt-3 text-center">
                    <span className="text-green-600">+{ (job.reward || 0).toFixed(2) }</span>
                    <span className="text-slate-500 ml-1 text-base">{job.currency}</span>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="proof" className="block text-sm font-medium text-slate-600 mb-2"><strong>Your Proof of Completion:</strong></label>
                     <textarea
                        id="proof"
                        value={proof}
                        onChange={(e) => setProof(e.target.value)}
                        placeholder="e.g., your username, a screenshot link, or the comment you posted."
                        className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 h-24 resize-none focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        maxLength={5000}
                        required
                    />
                </div>
            </div>

        </div>
         <div className="p-4 bg-gray-50 flex justify-end gap-4 border-t border-gray-200 flex-shrink-0">
            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-slate-800 font-bold py-2 px-4 rounded-full transition-colors">Cancel</button>
            <button 
                onClick={handleConfirm}
                disabled={!proof.trim()}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                Submit for Review
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

export default ConfirmationModal;
