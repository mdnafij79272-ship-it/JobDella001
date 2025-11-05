import React, { useState, useEffect } from 'react';
import { Advertisement } from '../types';

interface AdvertisementCardProps {
  ad: Advertisement;
  onError: (adId: string) => void;
}

const AdvertisementCard: React.FC<AdvertisementCardProps> = ({ ad, onError }) => {
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  // Reset status when the ad's image URL changes.
  useEffect(() => {
    if (ad && ad.imageUrl) {
        setImageStatus('loading');
    } else {
        setImageStatus('error');
        if (ad?.id) {
            onError(ad.id);
        }
    }
  }, [ad, onError]);

  const handleLoad = () => {
    setImageStatus('loaded');
  };

  const handleError = () => {
    // Silently handle the error by updating state and notifying the parent,
    // without logging an explicit error to the console. The browser may still
    // log a network error, but we avoid redundant application-level logging.
    setImageStatus('error');
    if (ad?.id) {
        onError(ad.id);
    }
  };

  const FallbackUI = ({ message }: { message: string }) => (
    <div className="aspect-[4/1] bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center">
      <div className="text-center text-gray-500 p-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="mt-2 font-semibold">Advertisement</p>
        <p className="text-xs">{message}</p>
      </div>
    </div>
  );
  
  const SkeletonLoader = () => (
    <div className="aspect-[4/1] bg-gray-200 rounded-lg animate-pulse"></div>
  );
  
  // If the component is told to render an invalid ad, it will call onError and then render a fallback
  // until the parent component removes it from the DOM on the next render cycle.
  if (imageStatus === 'error' || !ad || !ad.imageUrl) {
    return <FallbackUI message={!ad || !ad.imageUrl ? "Image not available." : "Image failed to load."} />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 relative group hover:shadow-lg">
      <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer" className="block aspect-[4/1] bg-gray-200" aria-label={`Advertisement: ${ad.targetUrl}`}>
        {imageStatus === 'loading' && <SkeletonLoader />}
        <img 
          src={ad.imageUrl} 
          alt="Advertisement" 
          className={`w-full h-full object-cover ${imageStatus === 'loading' ? 'hidden' : 'block'}`} 
          onLoad={handleLoad}
          onError={handleError}
        />
      </a>
      
      {imageStatus === 'loaded' && (
        <span className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs font-semibold px-2 py-1 rounded select-none pointer-events-none">
          Advertisement
        </span>
      )}
    </div>
  );
};

export default AdvertisementCard;