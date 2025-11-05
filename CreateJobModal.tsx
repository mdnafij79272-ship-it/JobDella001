import React, { useState, FormEvent, useEffect } from 'react';
import { Job, Platform, platformNameMap, SocialSubcategory, socialSubcategoryNameMap, TwitterSubcategory, twitterSubcategoryNameMap } from '../types';
import { useToasts } from './Toasts';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddJob: (
    job: Omit<Job, 'id' | 'posterId' | 'remaining' | 'createdAt' | 'boostedUntil' | 'approvalStatus' | 'rejectionReason'>
  ) => Promise<void>;
  userPoints: number;
  userBdtBalance: number;
}

const socialPlatforms = [Platform.YOUTUBE, Platform.FACEBOOK, Platform.INSTAGRAM, Platform.TIKTOK, Platform.LIKEE];

const CreateJobModal: React.FC<CreateJobModalProps> = ({ isOpen, onClose, onAddJob, userPoints, userBdtBalance }) => {
  // Job State
  const [platform, setPlatform] = useState<Platform>(Platform.INSTAGRAM);
  const [subcategory, setSubcategory] = useState<SocialSubcategory | ''>('');
  const [twitterSubcategory, setTwitterSubcategory] = useState<TwitterSubcategory | ''>('');
  const [title, setTitle] = useState('');
  const [task, setTask] = useState('');
  const [proofRequirement, setProofRequirement] = useState('');
  const [reward, setReward] = useState<number | ''>(1);
  const [quantity, setQuantity] = useState<number | ''>(10);
  const [currency, setCurrency] = useState<'JD TOKENS' | 'BDT'>('JD TOKENS');
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { addToast } = useToasts();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
        setTitle('');
        setTask('');
        setProofRequirement('');
        setReward(1);
        setQuantity(10);
        setCurrency('JD TOKENS');
        setPlatform(Platform.INSTAGRAM);
        setSubcategory('');
        setTwitterSubcategory('');
        setRewardError(null);
        setIsSubmitting(false);
    }
  }, [isOpen]);

  // Effect to manage subcategory visibility and state
  useEffect(() => {
    if (!socialPlatforms.includes(platform)) {
      setSubcategory('');
    }
    if (platform !== Platform.TWITTER) {
      setTwitterSubcategory('');
    }
  }, [platform]);

  // Effect to validate reward based on subcategory
  useEffect(() => {
    let minReward = 0;
    let errorMessage: string | null = null;

    if (platform === Platform.ADS_CLICK) {
        minReward = 3;
        errorMessage = `Minimum reward for Ads Click is 3 ${currency}.`;
    } else if (platform === Platform.WHATSAPP) {
        minReward = 30;
        errorMessage = `Minimum reward for WhatsApp is 30 BDT, and only BDT is allowed.`;
        if (currency !== 'BDT') {
            setCurrency('BDT');
        }
    } else if (platform === Platform.TWITTER && twitterSubcategory) {
        minReward = twitterSubcategory === TwitterSubcategory.ENGAGEMENT ? 2 : 1;
        errorMessage = `Minimum reward for this Twitter task is ${minReward} ${currency}.`;
    } else if (socialPlatforms.includes(platform) && subcategory) {
      minReward = subcategory === SocialSubcategory.FULL_ENGAGEMENT ? 2 : 1;
      errorMessage = `Minimum reward for this subcategory is ${minReward} ${currency}.`;
    }

    if (platform === Platform.WHATSAPP && currency !== 'BDT') {
        setRewardError(errorMessage);
    } else if (minReward > 0 && Number(reward) < minReward) {
        setRewardError(errorMessage);
    } else {
        setRewardError(null);
    }
  }, [reward, currency, subcategory, platform, twitterSubcategory]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (rewardError) {
      addToast(rewardError, 'error');
      return;
    }
     if (socialPlatforms.includes(platform) && !subcategory) {
      addToast('Please select a subcategory for this platform.', 'error');
      return;
    }
     if (platform === Platform.TWITTER && !twitterSubcategory) {
        addToast('Please select a subcategory for Twitter jobs.', 'error');
        return;
    }
    if (!title || !task || !proofRequirement || reward === '' || reward <= 0 || quantity === '' || quantity <= 0) {
      addToast('Please fill out all required job fields with valid values.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
        await onAddJob({
          platform,
          subcategory: subcategory || undefined,
          twitterSubcategory: twitterSubcategory || undefined,
          title,
          task,
          proofRequirement,
          reward,
          quantity,
          currency,
        });
    } catch (error) {
        console.error("Job creation failed in modal:", error);
        // Error toast is handled by the parent `handleAddJob` function
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  
  const jobBaseCost = (Number(reward) || 0) * (Number(quantity) || 0);
  const jobPlatformFee = jobBaseCost * 0.10;
  const totalJobCost = jobBaseCost + jobPlatformFee;
  
  const userBalance = currency === 'BDT' ? userBdtBalance : userPoints;
  const canAfford = userBalance >= totalJobCost;
  const isSubmitDisabled = !canAfford || totalJobCost <= 0 || !!rewardError || (socialPlatforms.includes(platform) && !subcategory) || (platform === Platform.TWITTER && !twitterSubcategory) || isSubmitting;
  
  const sortedPlatforms = Object.entries(platformNameMap)
    .sort((a, b) => a[1].localeCompare(b[1]));


  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] transform transition-all scale-95 animate-modal-enter">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-sky-600">Create a New Job</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <form id="create-job-form" onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
          <div>
            <label htmlFor="platform" className="block text-sm font-medium text-slate-600 mb-1">Platform</label>
            <select
              id="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              {sortedPlatforms.map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>

          {socialPlatforms.includes(platform) && (
             <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-slate-600 mb-1">Subcategory</label>
                <select
                  id="subcategory"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value as SocialSubcategory)}
                  className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  required
                >
                  <option value="" disabled>-- Select a subcategory --</option>
                  {Object.entries(socialSubcategoryNameMap).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
            </div>
          )}
          
          {platform === Platform.TWITTER && (
             <div>
                <label htmlFor="twitterSubcategory" className="block text-sm font-medium text-slate-600 mb-1">Twitter Subcategory</label>
                <select
                  id="twitterSubcategory"
                  value={twitterSubcategory}
                  onChange={(e) => setTwitterSubcategory(e.target.value as TwitterSubcategory)}
                  className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  required
                >
                  <option value="" disabled>-- Select a subcategory --</option>
                  {Object.entries(twitterSubcategoryNameMap).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-600 mb-1">Job Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Subscribe to my Channel"
              className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              maxLength={50}
              required
            />
          </div>
          <div>
            <label htmlFor="task" className="block text-sm font-medium text-slate-600 mb-1">Task Description</label>
            <textarea
              id="task"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="e.g., Like and comment on my latest video"
              className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 h-24 resize-none focus:ring-2 focus:ring-sky-500 focus:outline-none"
              maxLength={10000}
              required
            />
          </div>
           <div>
            <label htmlFor="proofRequirement" className="block text-sm font-medium text-slate-600 mb-1">Proof Requirement</label>
            <textarea
              id="proofRequirement"
              value={proofRequirement}
              onChange={(e) => setProofRequirement(e.target.value)}
              placeholder="e.g., Submit a screenshot of your subscription."
              className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 h-24 resize-none focus:ring-2 focus:ring-sky-500 focus:outline-none"
              maxLength={10000}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reward" className="block text-sm font-medium text-slate-600 mb-1">Reward/Task</label>
              <input
                id="reward"
                type="number"
                value={reward}
                onChange={(e) => setReward(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                min="0.01"
                step="any"
                required
              />
              {rewardError && <p className="text-xs text-red-600 mt-1">{rewardError}</p>}
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-slate-600 mb-1">Quantity</label>
              <input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                min="1"
                required
              />
            </div>
          </div>
          <div>
              <label htmlFor="currency" className="block text-sm font-medium text-slate-600 mb-1">Currency</label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'JD TOKENS' | 'BDT')}
                className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                disabled={platform === Platform.WHATSAPP}
              >
                  <option value="JD TOKENS" disabled={platform === Platform.WHATSAPP}>JD TOKENS</option>
                  <option value="BDT">BDT</option>
              </select>
          </div>

          <div className={`p-3 rounded-md text-sm ${canAfford || totalJobCost === 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <p>Job Cost: <span className="font-bold">{jobBaseCost.toFixed(2)}</span> {currency}</p>
            <p>Platform Fee (10%): <span className="font-bold">{jobPlatformFee.toFixed(2)}</span> {currency}</p>
            <div className="font-bold text-base mt-2 pt-2 border-t border-gray-200">
                Total: <span className="font-bold ml-2">{totalJobCost.toFixed(2)} {currency}</span>
            </div>
             <p className="mt-2 text-xs">Your balance: {userBalance.toFixed(2)} {currency}</p>
            {!canAfford && totalJobCost > 0 && <p className="font-bold mt-1 text-xs">Insufficient funds to post this job.</p>}
          </div>
        </form>
        <div className="flex justify-end gap-4 p-4 border-t bg-gray-50 rounded-b-lg border-gray-200 flex-shrink-0">
            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-slate-800 font-bold py-2 px-4 rounded-full transition-colors">Cancel</button>
            <button 
              type="submit"
              form="create-job-form"
              disabled={isSubmitDisabled}
              className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-full transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              {isSubmitting ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        {/* FIX: Replaced inline style block with dangerouslySetInnerHTML to prevent TS parsing errors. */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes modal-enter {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-modal-enter { animation: modal-enter 0.2s ease-out forwards; }
          .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        `}} />
      </div>
    </div>
  );
};

export default CreateJobModal;