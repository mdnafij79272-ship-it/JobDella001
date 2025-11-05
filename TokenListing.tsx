import React from 'react';

const TokenListing: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-sky-500">
                Token Center
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Upcoming Event Card */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg p-8 transform hover:scale-105 transition-transform duration-300">
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-sm font-semibold bg-white/20 text-white px-3 py-1 rounded-full">UPCOMING EVENT</span>
                            <h3 className="text-3xl font-bold mt-2">JDT Airdrop Campaign!</h3>
                            <p className="mt-2 text-purple-200">
                                Complete tasks, earn points, and get ready for our exclusive JDT airdrop.
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-semibold">Starts In</p>
                            <p className="text-4xl font-bold tracking-wider">60 Days</p>
                            <p className="text-sm text-purple-200">Stay Tuned!</p>
                        </div>
                    </div>
                </div>
                
                {/* About JDT Card */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-full flex flex-col">
                    <div className="p-8 flex-grow">
                        <h4 className="text-2xl font-bold text-slate-800 mb-4">About JDT</h4>
                        <p className="text-slate-600 text-sm">
                            The JobDella Token (JDT) is the native utility token of the JobDella ecosystem. It is designed to facilitate transactions, reward users for their contributions, and grant access to premium features within the platform. JDT aims to create a decentralized and self-sustaining micro-job economy. In the future, users will be able to convert their JDT earnings directly to BDT (Bangladeshi Taka) within the app and trade it on various exchanges.
                        </p>
                    </div>
                    <div className="p-6 bg-gray-50 border-t border-gray-200">
                        <p className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded-md text-center">
                            <strong>Disclaimer:</strong> This is a demonstration listing. The JDT token is not yet live or tradable.
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-in-out; }
            `}</style>
        </div>
    );
};

export default TokenListing;