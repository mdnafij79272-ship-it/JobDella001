
import React, { useState, useEffect } from 'react';
import { Submission } from '../types';
import { useToasts } from './Toasts';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (submissionId: string, reason: string) => void;
  submission: Submission | null;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onConfirm, submission }) => {
  const [reason, setReason] = useState('');
  const { addToast } = useToasts();

  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  if (!isOpen || !submission) return null;

  const handleConfirm = () => {
    if (reason.trim() === '') {
        addToast('Please provide a reason for your report.', 'error');
        return;
    }
    onConfirm(submission.id, reason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] transform transition-all scale-95 animate-modal-enter">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-yellow-500">Report Rejection</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <p className="text-slate-600 mb-2"><strong className="text-slate-800">Job:</strong> {submission.jobTitle}</p>
                 <p className="text-slate-600"><strong className="text-slate-800">Rejection Reason:</strong></p>
                <blockquote className="border-l-4 border-red-300 pl-4 italic text-red-700 my-2">
                    {submission.rejectionReason}
                </blockquote>
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="report-reason" className="block text-sm font-medium text-slate-600 mb-2"><strong>Why do you believe this rejection is unfair?</strong></label>
                     <textarea
                        id="report-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., I provided the correct username, the employer is being dishonest..."
                        className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 h-24 resize-none focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                        required
                    />
                </div>
            </div>

        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-4 border-t border-gray-200 flex-shrink-0">
            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-slate-800 font-bold py-2 px-4 rounded-full transition-colors">Cancel</button>
            <button
                onClick={handleConfirm}
                disabled={!reason.trim()}
                className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-bold py-2 px-4 rounded-full transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                Submit Report
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

export default ReportModal;