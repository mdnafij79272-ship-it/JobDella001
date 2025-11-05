import React, { useState, useEffect } from 'react';
import { Platform, platformNameMap } from '../types';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selectedCategories: Platform[]) => void;
  currentSelection: Platform[];
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onApply, currentSelection }) => {
  const [localSelection, setLocalSelection] = useState<Platform[]>(currentSelection);

  useEffect(() => {
    if (isOpen) {
      setLocalSelection(currentSelection);
    }
  }, [isOpen, currentSelection]);

  if (!isOpen) return null;

  const handleCheckboxChange = (platform: Platform) => {
    setLocalSelection(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const handleApply = () => {
    onApply(localSelection);
    onClose();
  };

  const handleClear = () => {
    onApply([]);
    onClose();
  };
  
  const sortedPlatforms = Object.entries(platformNameMap)
    .sort((a, b) => a[1].localeCompare(b[1]));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg transform transition-all scale-95 animate-modal-enter">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-sky-600">Filter Jobs by Category</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {sortedPlatforms.map(([key, name]) => (
                    <div key={key} className="flex items-center">
                        <input
                            id={`filter-${key}`}
                            type="checkbox"
                            checked={localSelection.includes(key as Platform)}
                            onChange={() => handleCheckboxChange(key as Platform)}
                            className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                        />
                        <label htmlFor={`filter-${key}`} className="ml-3 text-sm text-slate-700 select-none cursor-pointer">
                            {name}
                        </label>
                    </div>
                ))}
            </div>
        </div>
        <div className="flex justify-between items-center p-4 bg-gray-50 border-t border-gray-200">
            <button
                type="button"
                onClick={handleClear}
                className="bg-gray-200 hover:bg-gray-300 text-slate-800 font-bold py-2 px-4 rounded-full transition-colors"
            >
                Clear Filters
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-6 rounded-full transition-colors"
            >
              Apply ({localSelection.length})
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

export default FilterModal;