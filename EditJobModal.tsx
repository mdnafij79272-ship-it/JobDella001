
import React, { useState, useEffect, FormEvent } from 'react';
import { Job, Platform, platformNameMap } from '../types';
import { useToasts } from './Toasts';

interface EditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditJob: (job: Job) => void;
  jobToEdit: Job | null;
}

const EditJobModal: React.FC<EditJobModalProps> = ({ isOpen, onClose, onEditJob, jobToEdit }) => {
  const [title, setTitle] = useState('');
  const [task, setTask] = useState('');
  const { addToast } = useToasts();

  useEffect(() => {
    if (jobToEdit) {
      setTitle(jobToEdit.title);
      setTask(jobToEdit.task);
    }
  }, [jobToEdit]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!jobToEdit || !title || !task) {
      addToast('Please fill out all required fields.', 'error');
      return;
    }
    onEditJob({
      ...jobToEdit,
      title,
      task,
    });
  };

  if (!isOpen || !jobToEdit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] transform transition-all scale-95 animate-modal-enter">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-blue-600">Edit Job</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <form id="edit-job-form" onSubmit={handleSubmit} className="p-6 space-y-4 flex-grow overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Platform</label>
            <p className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-slate-500">
              {platformNameMap[jobToEdit.platform] || jobToEdit.platform}
            </p>
          </div>
          <div>
            <label htmlFor="title-edit" className="block text-sm font-medium text-slate-600 mb-1">Job Title</label>
            <input
              id="title-edit"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              maxLength={50}
              required
            />
          </div>
          <div>
            <label htmlFor="task-edit" className="block text-sm font-medium text-slate-600 mb-1">Task Description</label>
            <textarea
              id="task-edit"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
              maxLength={10000}
              required
            />
          </div>
          <p className="text-xs text-slate-400">Reward and quantity cannot be changed after posting.</p>
        </form>
        <div className="flex justify-end gap-4 p-4 border-t bg-gray-50 rounded-b-lg border-gray-200 flex-shrink-0">
            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-slate-800 font-bold py-2 px-4 rounded-full transition-colors">Cancel</button>
            <button 
              type="submit"
              form="edit-job-form"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition-colors"
            >
              Save Changes
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

export default EditJobModal;