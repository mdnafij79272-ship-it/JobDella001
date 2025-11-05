import React, { useState, useEffect } from 'react';
import { Job, socialSubcategoryNameMap, twitterSubcategoryNameMap } from '../types';
import Icon from './Icon';

interface JobCardProps {
  job: Job;
  onClaim: (job: Job) => void;
  submittedJobIds: number[];
  onHide: (jobId: number) => void;
  isOwnJob: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ job, onClaim, submittedJobIds, onHide, isOwnJob }) => {
  const { platform, title, task, reward, currency, remaining, quantity, boostedUntil, subcategory, twitterSubcategory } = job;
  const isSubmitted = submittedJobIds.includes(job.id);
  const completed = quantity - remaining;
  
  const isBoosted = boostedUntil && typeof boostedUntil.toDate === 'function' && boostedUntil.toDate() > new Date();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!isBoosted) {
        setTimeLeft('');
        return;
    }

    const intervalId = setInterval(() => {
        const now = new Date();
        const boostedUntilDate = boostedUntil.toDate();
        const difference = boostedUntilDate.getTime() - now.getTime();

        if (difference <= 0) {
            setTimeLeft('');
            clearInterval(intervalId);
            return;
        }

        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(intervalId);
}, [isBoosted, boostedUntil]);


  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 relative flex flex-col sm:flex-row items-stretch ${isBoosted ? 'ring-2 ring-yellow-400' : isOwnJob ? 'ring-2 ring-indigo-400' : 'hover:shadow-sky-500/20 hover:ring-2 hover:ring-sky-500'}`}>
       {isBoosted ? (
         <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full z-10 select-none flex items-center gap-1">
           🚀 Boosted {timeLeft && `| ${timeLeft}`}
         </div>
       ) : isOwnJob && (
         <div className="absolute top-2 left-2 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 select-none">
           Your Job
         </div>
       )}
       <button
        onClick={() => onHide(job.id)}
        className="absolute top-2 right-2 text-xs text-slate-400 hover:text-slate-600 z-10 px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        aria-label={`Hide task "${title}"`}
      >
        Hide
      </button>

      {/* Main content, split left and right */}
      <div className="p-5 flex-grow">
        <div className="flex items-start mb-2 pt-5 sm:pt-0">
          <Icon platform={platform} className="w-8 h-8 mr-4 flex-shrink-0" />
          <div>
            <h3 className="text-xl font-bold text-slate-800 leading-tight pr-16">{title}</h3>
            {subcategory && (
                <span className="mt-2 inline-block text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {socialSubcategoryNameMap[subcategory]}
                </span>
            )}
            {twitterSubcategory && (
                <span className="mt-2 inline-block text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {twitterSubcategoryNameMap[twitterSubcategory]}
                </span>
            )}
          </div>
        </div>
        <p className="text-slate-600 text-sm mt-3 break-words whitespace-pre-wrap">{task}</p>
      </div>

      {/* Right side content */}
      <div className="bg-gray-50 p-5 flex flex-col justify-between items-center sm:w-56 flex-shrink-0 border-t sm:border-t-0 sm:border-l border-gray-200">
        <div className="text-center w-full">
            <div className="font-bold text-2xl">
              <span className="text-green-600">+{ (reward || 0).toFixed(2) }</span>
              <span className="text-slate-500 ml-1 text-sm">{currency}</span>
            </div>
            <div className={`mt-2 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap inline-block ${isOwnJob ? 'bg-indigo-100 text-indigo-800' : 'bg-sky-100 text-sky-800'}`}>
              {completed}/{quantity} Done
            </div>
        </div>
        
        <div className="mt-4 w-full">
            {isSubmitted ? (
              <button 
                disabled
                className="w-full bg-gray-200 text-gray-500 font-semibold py-2 px-4 text-sm rounded-full cursor-not-allowed"
              >
                Submitted
              </button>
            ) : isOwnJob ? (
              <button 
                disabled
                className="w-full bg-indigo-200 text-indigo-600 font-semibold py-2 px-4 text-sm rounded-full cursor-not-allowed"
              >
                Your Job
              </button>
            ) : (
              <button 
                onClick={() => onClaim(job)}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 text-sm rounded-full transition-transform duration-200 transform hover:scale-105"
              >
                Open Task
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default JobCard;