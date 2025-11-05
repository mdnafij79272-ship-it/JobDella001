import React, { useState, FormEvent, useEffect } from 'react';
import { useToasts } from './Toasts';

interface CreateAdvertisementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAd: (adData: { imageUrl: string; targetUrl: string; duration: number }) => void;
  userBdtBalance: number;
}

const CreateAdvertisementModal: React.FC<CreateAdvertisementModalProps> = ({ isOpen, onClose, onCreateAd, userBdtBalance }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [duration, setDuration] = useState<number | ''>(6);
  const { addToast } = useToasts();
  
  // New state for image validation
  const [imageUrlStatus, setImageUrlStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [debouncedImageUrl, setDebouncedImageUrl] = useState(imageUrl);

  useEffect(() => {
    if (isOpen) {
      setImageUrl('');
      setTargetUrl('');
      setDuration(6);
      setImageUrlStatus('idle'); // Reset on open
    }
  }, [isOpen]);
  
  // Debounce the image URL input to avoid validating on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedImageUrl(imageUrl);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [imageUrl]);

  // Effect to validate the debounced image URL
  useEffect(() => {
    if (!debouncedImageUrl) {
      setImageUrlStatus('idle');
      return;
    }

    // Basic URL format check
    try {
      new URL(debouncedImageUrl);
    } catch (_) {
      setImageUrlStatus('invalid');
      return;
    }

    setImageUrlStatus('validating');
    const img = new Image();
    img.onload = () => {
      // Additional check for very small images (e.g., tracking pixels)
      if (img.width < 10 || img.height < 10) {
        setImageUrlStatus('invalid');
      } else {
        setImageUrlStatus('valid');
      }
    };
    img.onerror = () => {
      setImageUrlStatus('invalid');
    };
    img.src = debouncedImageUrl;

  }, [debouncedImageUrl]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (imageUrlStatus !== 'valid') {
        addToast('Please provide a valid and accessible image URL.', 'error');
        return;
    }
    if (!targetUrl.trim() || !duration || duration < 6) {
      addToast('Please fill all fields. Duration must be at least 6 hours.', 'error');
      return;
    }
    onCreateAd({ imageUrl, targetUrl, duration });
  };

  if (!isOpen) return null;

  const adCost = duration && duration >= 6 ? duration * 10 : 0;
  const canAfford = userBdtBalance >= adCost;
  
  const renderImageStatusIcon = () => {
    switch(imageUrlStatus) {
        case 'validating':
            return <div className="absolute inset-y-0 right-0 flex items-center pr-3"><div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div></div>;
        case 'valid':
            return <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-green-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></div>;
        case 'invalid':
            return <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l-1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></div>;
        default:
            return null;
    }
  }

  const isSubmitDisabled = !canAfford || adCost <= 0 || imageUrlStatus !== 'valid';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] transform transition-all scale-95 animate-modal-enter">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-yellow-600">Create Advertisement</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <form id="create-ad-form" onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
          <div>
            <label htmlFor="adImageUrl" className="block text-sm font-medium text-slate-600 mb-1">Ad Image Link</label>
            <div className="relative">
                <input
                  id="adImageUrl"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/banner.png"
                  className={`w-full bg-gray-100 border rounded-md p-2 focus:ring-2 focus:outline-none ${
                    imageUrlStatus === 'valid' ? 'border-green-400 focus:ring-green-500' :
                    imageUrlStatus === 'invalid' ? 'border-red-400 focus:ring-red-500' :
                    'border-gray-300 focus:ring-yellow-500'
                  }`}
                  required
                />
                {renderImageStatusIcon()}
            </div>
            <p className="text-xs text-slate-500 mt-1">Recommended size: 800x200 pixels (4:1 aspect ratio).</p>
            <p className="text-xs text-slate-500 mt-1">Use a direct image link (e.g., ending in .png, .jpg). Links from social media may not work.</p>
            {imageUrlStatus === 'invalid' && imageUrl && <p className="text-xs text-red-600 mt-1">This image URL is not valid or accessible.</p>}
          </div>
          <div>
            <label htmlFor="adTargetUrl" className="block text-sm font-medium text-slate-600 mb-1">Offer Link</label>
            <input
              id="adTargetUrl"
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://your-product-link.com"
              className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label htmlFor="adDuration" className="block text-sm font-medium text-slate-600 mb-1">Ad Duration (Hours)</label>
            <input
              id="adDuration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              min="6"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Minimum 6 hours. Cost: 10 BDT per hour.</p>
          </div>

          <div className={`p-3 rounded-md text-sm ${canAfford || adCost === 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <div className="font-bold text-base">
              Total Cost: <span className="font-bold ml-2">{adCost.toFixed(2)} BDT</span>
            </div>
            <p className="mt-2 text-xs">Your balance: {userBdtBalance.toFixed(2)} BDT</p>
            {!canAfford && adCost > 0 && <p className="font-bold mt-1 text-xs">Insufficient funds to purchase this ad.</p>}
          </div>
        </form>
        <div className="flex justify-end gap-4 p-4 border-t bg-gray-50 rounded-b-lg border-gray-200 flex-shrink-0">
          <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-slate-800 font-bold py-2 px-4 rounded-full transition-colors">Cancel</button>
          <button 
            type="submit"
            form="create-ad-form"
            disabled={isSubmitDisabled}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-full transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            Purchase Ad
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

export default CreateAdvertisementModal;