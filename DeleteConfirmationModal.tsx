import React from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  jobTitle: string;
  pendingCount: number;
  refundAmount: number;
  currency: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  jobTitle,
  pendingCount,
  refundAmount,
  currency,
}) => {
  if (!isOpen) return null;
  const formattedRefund = refundAmount.toFixed(2);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md transform transition-all scale-95 animate-modal-enter">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-red-600">Confirm Deletion</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <div className="p-6">
          <p className="text-slate-600 text-center">
            Are you sure you want to delete the job: <strong className="text-slate-900">"{jobTitle}"</strong>?
          </p>
          
          <div className="mt-4 space-y-2 bg-gray-100 p-4 rounded-lg">
            {pendingCount > 0 && (
              <p className="text-yellow-800 text-sm">
                There are <strong className="font-bold">{pendingCount} pending submission(s)</strong>. They will be automatically approved and paid.
              </p>
            )}
            {refundAmount > 0 ? (
              <p className="text-green-800 text-sm">
                You will be refunded <strong className="font-bold">{formattedRefund} {currency}</strong> for any remaining, uncompleted work.
              </p>
            ) : (
                <p className="text-slate-500 text-sm">There will be no refund as there are no remaining slots.</p>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">This action cannot be undone.</p>

        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-slate-800 font-bold py-2 px-4 rounded-full transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full transition-colors"
          >
            Confirm Delete
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

export default DeleteConfirmationModal;