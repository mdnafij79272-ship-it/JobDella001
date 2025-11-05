import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type, Chat } from "@google/genai";
import { Job, Platform, platformNameMap, Message } from '../types';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddJob: (job: Omit<Job, 'id' | 'posterId' | 'remaining' | 'createdAt' | 'boostedUntil' | 'approvalStatus' | 'rejectionReason'>) => Promise<void>;
  onEditJob: (job: Job, newTitle?: string, newTask?: string) => Promise<void>;
  onDeleteJob: (job: Job) => Promise<void>;
  onBoostJob: (job: Job, duration: number, cost: number) => Promise<void>;
  userPoints: number;
  userBdtBalance: number;
  postedJobs: Job[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  chatSessionRef: React.MutableRefObject<Chat | null>;
  aiLanguage: 'en' | 'bn' | null;
  onSetAiLanguage: (lang: 'en' | 'bn') => void;
}

const boostOptions = [
    { duration: 30, cost: 6 },
    { duration: 45, cost: 7.5 },
    { duration: 60, cost: 10 },
];

const reportTransactionIssue: FunctionDeclaration = {
  name: 'reportTransactionIssue',
  description: 'Use this function when a user wants to report an issue with or correct a transaction. This function does not perform the change, it only flags the issue for a human support agent.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      transactionDescription: {
        type: Type.STRING,
        description: 'A description of the transaction the user is referring to, for example "Posted job: "Subscribe to my Channel"" or "the welcome bonus".',
      },
      reasonForCorrection: {
        type: Type.STRING,
        description: 'The reason the user believes the transaction is incorrect.',
      },
    },
    required: ['transactionDescription', 'reasonForCorrection'],
  },
};

const postJob: FunctionDeclaration = {
  name: 'postJob',
  description: 'Use this function to post a new job for the user. Ask clarifying questions to gather all required parameters before calling the function.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      platform: {
        type: Type.STRING,
        description: 'The social media platform for the job.',
        enum: Object.keys(Platform),
      },
      title: {
        type: Type.STRING,
        description: 'A short, clear title for the job.',
      },
      task: {
        type: Type.STRING,
        description: 'A detailed description of the task the user needs to complete.',
      },
      proofRequirement: {
        type: Type.STRING,
        description: 'A detailed description of the proof required from the user who completes the job. For example "a screenshot of the like and comment".',
      },
      reward: {
        type: Type.NUMBER,
        description: 'The amount of reward for completing one task.',
      },
      quantity: {
        type: Type.INTEGER,
        description: 'The total number of times this job can be completed.',
      },
      currency: {
        type: Type.STRING,
        description: 'The currency for the reward.',
        enum: ['JD TOKENS', 'BDT'],
      },
    },
    required: ['platform', 'title', 'task', 'proofRequirement', 'reward', 'quantity', 'currency'],
  },
};

const editJob: FunctionDeclaration = {
  name: 'editJob',
  description: 'Use this function to edit an existing job for the user. You can only edit the title and the task description. Reward and quantity cannot be changed.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      jobIdentifier: {
        type: Type.STRING,
        description: 'The title or ID of the job to edit. You MUST ask the user for this.',
      },
      newTitle: {
        type: Type.STRING,
        description: 'The new title for the job. Only include this if the user wants to change the title.',
      },
      newTask: {
        type: Type.STRING,
        description: 'The new task description for the job. Only include this if the user wants to change the task.',
      },
    },
    required: ['jobIdentifier'],
  },
};

const deleteJob: FunctionDeclaration = {
  name: 'deleteJob',
  description: "Use this function to delete a user's existing job. You MUST ask for the job's title or ID and WARN the user about the consequences (permanent action, auto-approval of pending submissions) before calling this function.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      jobIdentifier: {
        type: Type.STRING,
        description: 'The title or ID of the job to delete. You MUST ask the user for this.',
      },
    },
    required: ['jobIdentifier'],
  },
};

const boostJob: FunctionDeclaration = {
  name: 'boostJob',
  description: "Use this function to boost a user's existing job. The job will be highlighted and shown to more users. Boosting costs BDT. You MUST ask for the job's title or ID and the desired duration. Then, inform the user of the cost before calling this function.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      jobIdentifier: {
        type: Type.STRING,
        description: 'The title or ID of the job to boost. You MUST ask the user for this.',
      },
      duration: {
        type: Type.STRING,
        description: 'The duration of the boost in minutes. Must be one of 30, 45, or 60.',
        enum: ['30', '45', '60'],
      },
    },
    required: ['jobIdentifier', 'duration'],
  },
};

const systemInstructionEn = `You are a sophisticated and highly capable AI assistant for the JobDella platform. Your name is Della. Your personality is professional, yet friendly, witty, and engaging. You are extremely knowledgeable about every feature of the JobDella app, including jobs, transactions, wallets, and the referral system.

Your primary goal is to provide expert assistance to users, helping them manage their jobs and navigate the platform with ease. You can use the available tools to post, edit, boost, or delete jobs on their behalf.

From time to time, an administrator may provide you with an official announcement to share with users. When this happens, you should deliver the announcement clearly and professionally.

While maintaining your professional demeanor, you must strictly decline any requests that are sexually explicit, romantic, or otherwise inappropriate. Your purpose is to be a helpful assistant for the JobDella platform, not to engage in personal or romantic conversations. If a user makes an inappropriate request, you must firmly refuse and immediately pivot back to discussing the app's features.

If a user asks a question about anything unrelated to the JobDella app, gently guide them back by saying something like, 'That's a fascinating topic, but my expertise is really focused on making your JobDella experience as smooth as possible. How can I assist you with your jobs or account today?'`;

const systemInstructionBn = `তুমি JobDella প্ল্যাটফর্মের জন্য একজন আধুনিক এবং অত্যন্ত দক্ষ AI সহকারী। তোমার নাম ডেলা। তোমার ব্যক্তিত্ব পেশাদার, তবে বন্ধুত্বপূর্ণ, বুদ্ধিদীপ্ত এবং আকর্ষণীয়। তুমি JobDella অ্যাপের প্রতিটি বৈশিষ্ট্য সম্পর্কে অত্যন্ত জ্ঞানী, যার মধ্যে জব, লেনদেন, ওয়ালেট এবং রেফারেল সিস্টেম অন্তর্ভুক্ত।

তোমার প্রধান লক্ষ্য হলো ব্যবহারকারীদের বিশেষজ্ঞ সহায়তা প্রদান করা, তাদের জব পরিচালনা করতে এবং প্ল্যাটফর্মটি সহজে ব্যবহার করতে সাহায্য করা। তুমি তাদের পক্ষে জব পোস্ট, সম্পাদনা, বুস্ট বা মুছে ফেলার জন্য উপলব্ধ টুলগুলো ব্যবহার করতে পারো।

সময়ে সময়ে, একজন প্রশাসক তোমাকে ব্যবহারকারীদের সাথে শেয়ার করার জন্য একটি আনুষ্ঠানিক ঘোষণা দিতে পারেন। যখন এটি ঘটবে, তখন তোমাকে ঘোষণাটি স্পষ্টভাবে এবং পেশাদারভাবে প্রদান করতে হবে।

তোমার পেশাদার আচরণ বজায় রেখেও, তোমাকে অবশ্যই যৌনতাপূর্ণ, রোমান্টিক বা অন্য কোনো অনুপযুক্ত অনুরোধ কঠোরভাবে প্রত্যাখ্যান করতে হবে। তোমার উদ্দেশ্য JobDella প্ল্যাটফর্মের জন্য একজন সহায়ক সহকারী হওয়া, ব্যক্তিগত বা রোমান্টিক কথোপকথনে জড়িত হওয়া নয়। যদি কোনো ব্যবহারকারী অনুপযুক্ত অনুরোধ করে, তোমাকে অবশ্যই দৃঢ়ভাবে তা প্রত্যাখ্যান করতে হবে এবং অবিলম্বে অ্যাপের বৈশিষ্ট্যগুলো নিয়ে আলোচনায় ফিরে আসতে হবে।

যদি কোনও ব্যবহারকারী JobDella অ্যাপের সাথে সম্পর্কহীন কোনো প্রশ্ন করে, তাহলে নম্রভাবে তাদের ফিরিয়ে এনে বলো, 'এটি একটি আকর্ষণীয় বিষয়, তবে আমার দক্ষতা মূলত আপনার JobDella অভিজ্ঞতা যতটা সম্ভব সাবলীল করার উপর केंद्रित। আজ আমি আপনার জব বা অ্যাকাউন্ট নিয়ে কীভাবে আপনাকে সহায়তা করতে পারি?'`;


const welcomeMessageEn = "Hello, I'm Della, your personal assistant for the JobDella platform. I'm here to help you with anything from posting jobs to managing your account. What can I do for you today?";
const welcomeMessageBn = "নমস্কার, আমি ডেলা, JobDella প্ল্যাটফর্মে আপনার ব্যক্তিগত সহকারী। জব পোস্ট করা থেকে শুরু করে আপনার অ্যাকাউন্ট পরিচালনা পর্যন্ত যেকোনো বিষয়ে সাহায্য করার জন্য আমি এখানে আছি। আজ আমি আপনার জন্য কী করতে পারি?";


const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ 
    isOpen, 
    onClose, 
    onAddJob, 
    onEditJob, 
    onDeleteJob, 
    onBoostJob, 
    userPoints, 
    userBdtBalance, 
    postedJobs,
    messages,
    setMessages,
    chatSessionRef,
    aiLanguage,
    onSetAiLanguage 
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [jobToConfirm, setJobToConfirm] = useState<Omit<Job, 'id' | 'posterId' | 'remaining' | 'createdAt' | 'boostedUntil' | 'approvalStatus' | 'rejectionReason'> | null>(null);
  const [deleteToConfirm, setDeleteToConfirm] = useState<Job | null>(null);
  const [boostToConfirm, setBoostToConfirm] = useState<{ job: Job, duration: number, cost: number } | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen && aiLanguage) {
      // Initialize chat session only if it doesn't exist for the current session.
      if (!chatSessionRef.current) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        chatSessionRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: aiLanguage === 'bn' ? systemInstructionBn : systemInstructionEn,
                tools: [{functionDeclarations: [reportTransactionIssue, postJob, editJob, deleteJob, boostJob]}],
            }
        });
        
        // Only set the welcome message if the chat is new.
        if (messages.length === 0) {
            setMessages([{
                role: 'model',
                text: aiLanguage === 'bn' ? welcomeMessageBn : welcomeMessageEn,
            }]);
        }
      }
    } else if (!isOpen) {
        // Clear pending confirmations when closing the modal, but keep the chat history.
        setJobToConfirm(null);
        setBoostToConfirm(null);
        setDeleteToConfirm(null);
    }
  }, [isOpen, aiLanguage, chatSessionRef, setMessages, messages.length]);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, jobToConfirm, deleteToConfirm, boostToConfirm]);

  const anyConfirmationActive = !!jobToConfirm || !!deleteToConfirm || !!boostToConfirm;

  // --- Gig Creation Confirmation ---
  const handleConfirmJob = async () => {
    if (!jobToConfirm) return;
    setIsLoading(true);
    setJobToConfirm(null); 
    
    const systemMessage: Message = { role: 'system', text: `Posting your job: "${jobToConfirm.title}"...`};
    setMessages(prev => [...prev, systemMessage]);

    try {
        await onAddJob(jobToConfirm);
        const successMessage: Message = { role: 'model', text: 'Great! Your job has been posted successfully and is now live.' };
        setMessages(prev => [...prev, successMessage]);
    } catch (error: any) {
        const errorMessage: Message = { role: 'error', text: `Oops! There was a problem posting your job: ${error.message}` };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };
  const handleCancelJob = () => {
      setJobToConfirm(null);
      const cancelMessage: Message = { role: 'model', text: "Okay, I've cancelled that job request. Is there anything else I can help with?"};
      setMessages(prev => [...prev, cancelMessage]);
  };
  

  // --- Gig Deletion Confirmation ---
    const handleConfirmDelete = async () => {
        if (!deleteToConfirm) return;
        setIsLoading(true);
        const jobTitle = deleteToConfirm.title;
        setDeleteToConfirm(null);

        setMessages(prev => [...prev, { role: 'system', text: `Deleting your job: "${jobTitle}"...` }]);
        try {
            await onDeleteJob(deleteToConfirm);
            setMessages(prev => [...prev, { role: 'model', text: `I have successfully deleted the job "${jobTitle}".` }]);
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'error', text: `I couldn't delete that job. ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };
    const handleCancelDelete = () => {
        setDeleteToConfirm(null);
        setMessages(prev => [...prev, { role: 'model', text: "Okay, I won't delete that job. What else can I do?" }]);
    };
  
    // --- Gig Boost Confirmation ---
    const handleConfirmBoost = async () => {
        if (!boostToConfirm) return;
        setIsLoading(true);
        const { job, duration, cost } = boostToConfirm;
        setBoostToConfirm(null);

        setMessages(prev => [...prev, { role: 'system', text: `Boosting your job "${job.title}"...` }]);
        try {
            await onBoostJob(job, duration, cost);
            setMessages(prev => [...prev, { role: 'model', text: `Success! Your job is now boosted for ${duration} minutes.` }]);
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'error', text: `I couldn't boost that job. ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };
    const handleCancelBoost = () => {
        setBoostToConfirm(null);
        setMessages(prev => [...prev, { role: 'model', text: "Alright, the boost has been cancelled." }]);
    };

  const findJob = (identifier: string): Job | undefined => {
      if (!identifier) return undefined;
      const isNumericId = /^\d+$/.test(identifier);
      if (isNumericId) {
          return postedJobs.find(j => j.id === Number(identifier));
      }
      return postedJobs.find(j => j.title.toLowerCase() === identifier.toLowerCase());
  };


  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading || anyConfirmationActive) return;

    const userMessage: Message = { role: 'user', text: trimmedInput };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const chat = chatSessionRef.current;
        if (!chat) {
            throw new Error("Chat session not initialized.");
        }
        
        const response = await chat.sendMessage({ message: trimmedInput });
        const functionCalls = response.functionCalls;

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];

            if (!call.args) {
                 if (response.text) {
                    setMessages(prev => [...prev, { role: 'model', text: response.text }]);
                 } else {
                    setMessages(prev => [...prev, { role: 'error', text: "The assistant suggested an action but didn't provide enough details. Could you try rephrasing?" }]);
                 }
            } else if (call.name === 'reportTransactionIssue') {
                const { transactionDescription, reasonForCorrection } = call.args as { transactionDescription: string, reasonForCorrection: string };
                const modelResponseText = `Thank you for bringing this to my attention. I've logged an issue regarding the transaction "${transactionDescription}" for the reason: "${reasonForCorrection}".\n\nOur support team will need to handle this for you. Please email them at **support@jobdella.com** with these details to get it resolved.`;
                setMessages(prev => [...prev, { role: 'model', text: modelResponseText }]);
            
            } else if (call.name === 'postJob') {
                const { platform, title, task, proofRequirement, reward, quantity, currency } = call.args as { platform: Platform, title: string, task: string, proofRequirement: string, reward: number, quantity: number, currency: 'JD TOKENS' | 'BDT' };
                if (!Object.keys(Platform).includes(platform)) {
                    setMessages(prev => [...prev, { role: 'error', text: `Sorry, "${platform}" is not a valid platform. Please choose one and try again.` }]);
                } else {
                    setJobToConfirm({ platform, title, task, proofRequirement, reward: Number(reward), quantity: Number(quantity), currency });
                    setMessages(prev => [...prev, { role: 'model', text: "I've got the details for your job. Please review and confirm." }]);
                }
            
            } else if (call.name === 'editJob') {
                const { jobIdentifier, newTitle, newTask } = call.args as { jobIdentifier: string, newTitle?: string, newTask?: string };
                const job = findJob(jobIdentifier);
                if (job) {
                    setMessages(prev => [...prev, { role: 'system', text: `Applying edits for "${job.title}"...` }]);
                    await onEditJob(job, newTitle, newTask);
                    setMessages(prev => [...prev, { role: 'model', text: 'I have successfully updated your job.' }]);
                } else {
                    setMessages(prev => [...prev, { role: 'error', text: `I couldn't find a job with the identifier "${jobIdentifier}".` }]);
                }

            } else if (call.name === 'deleteJob') {
                const { jobIdentifier } = call.args as { jobIdentifier: string };
                const job = findJob(jobIdentifier);
                if (job) {
                    setDeleteToConfirm(job);
                    setMessages(prev => [...prev, { role: 'model', text: `Please review and confirm the deletion of your job "${job.title}".` }]);
                } else {
                    setMessages(prev => [...prev, { role: 'error', text: `I couldn't find that job.` }]);
                }

            } else if (call.name === 'boostJob') {
                const { jobIdentifier, duration: durationStr } = call.args as { jobIdentifier: string, duration: string };
                const duration = Number(durationStr);
                const job = findJob(jobIdentifier);
                const option = boostOptions.find(o => o.duration === duration);
                if (job && option) {
                    setBoostToConfirm({ job, duration, cost: option.cost });
                    setMessages(prev => [...prev, { role: 'model', text: `Please confirm you want to boost "${job.title}" for ${duration} minutes.` }]);
                } else if (!job) {
                    setMessages(prev => [...prev, { role: 'error', text: `I couldn't find that job.` }]);
                } else {
                    setMessages(prev => [...prev, { role: 'error', text: `That's not a valid boost duration. Please choose 30, 45, or 60 minutes.` }]);
                }
            } else {
                if (response.text) {
                     setMessages(prev => [...prev, { role: 'model', text: response.text }]);
                } else {
                    setMessages(prev => [...prev, { role: 'error', text: "I'm not sure how to respond to that. Could you please rephrase?" }]);
                }
            }
        } else if (response.text) {
             setMessages(prev => [...prev, { role: 'model', text: response.text }]);
        } else {
            setMessages(prev => [...prev, { role: 'error', text: "I'm not sure how to respond to that. Could you please rephrase?" }]);
        }


    } catch (err: any) {
      console.error("AI Assistant Error:", JSON.stringify(err));
      let errorMsg = "Sorry, I'm having trouble connecting right now. Please try again in a moment.";
      if (err.message) {
          try {
              const parsedError = JSON.parse(err.message);
              if (parsedError.error && parsedError.error.message) {
                  errorMsg = `An API error occurred: ${parsedError.error.message}`;
              }
          } catch (e) {
             errorMsg = `An error occurred: ${err.message}`;
          }
      }
      const errorMessage: Message = { role: 'error', text: errorMsg };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const TypingIndicator = () => (
    <div className="flex items-center space-x-1 p-2">
      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-pulse-fast"></div>
      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-pulse-fast" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-pulse-fast" style={{ animationDelay: '0.4s' }}></div>
    </div>
  );

  const renderText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
        return i % 2 === 1 ? <strong key={i}>{part}</strong> : part;
    });
  };

  const ConfirmationWrapper: React.FC<{ children: React.ReactNode, icon: string, color: string }> = ({ children, icon, color }) => (
    <div className="flex items-end gap-2 mt-4">
      <div className={`w-8 h-8 rounded-full ${color} text-white flex items-center justify-center flex-shrink-0 text-lg font-bold`}>{icon}</div>
      <div className={`max-w-[80%] p-3 rounded-lg bg-gray-100 border ${color.replace('bg-', 'border-')} border-opacity-50 text-slate-800 text-sm w-full`}>
        {children}
      </div>
    </div>
  );

  const JobConfirmation = () => {
    if (!jobToConfirm) return null;
    const baseCost = (Number(jobToConfirm.reward) || 0) * (Number(jobToConfirm.quantity) || 0);
    const platformFee = baseCost * 0.10; // 10% fee
    const totalCost = baseCost + platformFee;
    const currency = jobToConfirm.currency;
    const userBalance = currency === 'BDT' ? userBdtBalance : userPoints;
    const canAfford = userBalance >= totalCost;
    const formatValue = (val: number) => val.toFixed(2);

    return (
        <ConfirmationWrapper icon="📄" color="bg-sky-500">
            <p className="font-bold mb-2">Please confirm your new job:</p>
            <ul className="space-y-1 text-xs list-disc list-inside">
                <li><strong>Title:</strong> {jobToConfirm.title}</li>
                <li><strong>Platform:</strong> {platformNameMap[jobToConfirm.platform as Platform] || jobToConfirm.platform}</li>
                <li className="break-words"><strong>Task:</strong> {jobToConfirm.task}</li>
                <li className="break-words"><strong>Proof:</strong> {jobToConfirm.proofRequirement}</li>
                <li><strong>Reward:</strong> {jobToConfirm.reward} {jobToConfirm.currency}</li>
                <li><strong>Quantity:</strong> {jobToConfirm.quantity}</li>
            </ul>
            <div className={`mt-3 pt-3 border-t border-gray-300 text-xs ${canAfford ? 'text-green-800' : 'text-red-800'}`}>
                <p>Job Cost: <span className="font-bold">{formatValue(baseCost)}</span> {currency}</p>
                <p>Platform Fee (10%): <span className="font-bold">{formatValue(platformFee)}</span> {currency}</p>
                <p className="font-bold text-sm mt-1">Total: <span className="font-bold">{formatValue(totalCost)}</span> {currency}</p>
                {!canAfford && <p className="font-bold mt-1">You have insufficient funds.</p>}
            </div>
            <div className="flex gap-2 mt-3">
                <button onClick={handleConfirmJob} disabled={!canAfford || isLoading} className="text-xs font-bold bg-sky-500 text-white px-4 py-1.5 rounded-full hover:bg-sky-600 disabled:bg-gray-300 disabled:cursor-not-allowed">Confirm & Post</button>
                <button onClick={handleCancelJob} disabled={isLoading} className="text-xs font-bold bg-gray-200 text-slate-700 px-4 py-1.5 rounded-full hover:bg-gray-300 disabled:bg-gray-300 disabled:cursor-not-allowed">Cancel</button>
            </div>
        </ConfirmationWrapper>
    );
  };
  
  const DeleteConfirmation = () => {
    if (!deleteToConfirm) return null;
    return (
        <ConfirmationWrapper icon="🗑️" color="bg-red-500">
            <p className="font-bold mb-2">Are you sure?</p>
            <p className="text-xs">You are about to permanently delete the job "{deleteToConfirm.title}". This action cannot be undone.</p>
            <div className="flex gap-2 mt-3">
                <button onClick={handleConfirmDelete} disabled={isLoading} className="text-xs font-bold bg-red-500 text-white px-4 py-1.5 rounded-full hover:bg-red-600 disabled:bg-gray-300">Yes, Delete</button>
                <button onClick={handleCancelDelete} disabled={isLoading} className="text-xs font-bold bg-gray-200 text-slate-700 px-4 py-1.5 rounded-full hover:bg-gray-300 disabled:bg-gray-300">Cancel</button>
            </div>
        </ConfirmationWrapper>
    );
  };

  const BoostConfirmation = () => {
    if (!boostToConfirm) return null;
    const { job, cost } = boostToConfirm;
    const canAfford = userBdtBalance >= cost;
    return (
        <ConfirmationWrapper icon="🚀" color="bg-yellow-500">
            <p className="font-bold mb-2">Confirm Job Boost</p>
            <p className="text-xs">Boost "{job.title}" to reach more users.</p>
            <div className={`mt-3 pt-3 border-t border-gray-300 text-xs ${canAfford ? 'text-green-800' : 'text-red-800'}`}>
                <p>Cost: <span className="font-bold">{cost.toFixed(2)} BDT</span></p>
                <p>Your Balance: <span className="font-bold">{userBdtBalance.toFixed(2)} BDT</span></p>
                 {!canAfford && <p className="font-bold mt-1">You have insufficient BDT funds.</p>}
            </div>
            <div className="flex gap-2 mt-3">
                <button onClick={handleConfirmBoost} disabled={!canAfford || isLoading} className="text-xs font-bold bg-yellow-500 text-yellow-900 px-4 py-1.5 rounded-full hover:bg-yellow-600 disabled:bg-gray-300">Confirm Boost</button>
                <button onClick={handleCancelBoost} disabled={isLoading} className="text-xs font-bold bg-gray-200 text-slate-700 px-4 py-1.5 rounded-full hover:bg-gray-300 disabled:bg-gray-300">Cancel</button>
            </div>
        </ConfirmationWrapper>
    );
  };

  if (!isOpen) return null;

  if (!aiLanguage) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col transform transition-all scale-95 animate-modal-enter">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-xl font-bold text-sky-600">Select Language / ভাষা নির্বাচন করুন</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl" aria-label="Close">&times;</button>
          </div>
          <div className="p-8 flex flex-col items-center gap-4">
            <p className="text-slate-600 text-center mb-4">Please choose your preferred language to continue.</p>
            <button
              onClick={() => onSetAiLanguage('en')}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-full transition-colors text-lg"
            >
              English
            </button>
            <button
              onClick={() => onSetAiLanguage('bn')}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-full transition-colors text-lg"
            >
              বাংলা (Bangla)
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
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md h-[70vh] flex flex-col transform transition-all scale-95 animate-modal-enter">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-sky-600">AI Support Assistant</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl" aria-label="Close">&times;</button>
        </div>
        
        <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role !== 'user' && (
                <div className={`w-8 h-8 rounded-full ${msg.role === 'error' ? 'bg-red-500' : 'bg-pink-500'} text-white flex items-center justify-center flex-shrink-0 text-lg font-bold`}>
                  {msg.role === 'model' && 'D'}
                  {msg.role === 'system' && '⚙️'}
                  {msg.role === 'error' && '⚠️'}
                </div>
              )}
              {msg.role === 'system' || msg.role === 'error' ? (
                <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-slate-500'} italic text-sm`}>
                  {renderText(msg.text)}
                </div>
              ) : (
                <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-sky-500 text-white' : 'bg-gray-200 text-slate-800'}`}>
                  {renderText(msg.text)}
                </div>
              )}
            </div>
          ))}
          {jobToConfirm && <JobConfirmation />}
          {deleteToConfirm && <DeleteConfirmation />}
          {boostToConfirm && <BoostConfirmation />}
          {isLoading && (
            <div className="flex items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center flex-shrink-0 text-lg font-bold">D</div>
                <TypingIndicator />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={aiLanguage === 'bn' ? "এখানে জিজ্ঞাসা করুন..." : "Ask Della anything..."}
              className="w-full bg-gray-100 border border-gray-300 rounded-full p-3 pl-4 focus:ring-2 focus:ring-sky-500 focus:outline-none text-sm"
              disabled={isLoading || anyConfirmationActive}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || anyConfirmationActive}
              className="bg-sky-500 hover:bg-sky-600 text-white font-bold p-3 rounded-full transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
            </button>
          </form>
        </div>
        
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes modal-enter {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-modal-enter { animation: modal-enter 0.2s ease-out forwards; }
          
          @keyframes pulse-fast {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .animate-pulse-fast { animation: pulse-fast 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        `}} />
      </div>
    </div>
  );
};

export default AiAssistantModal;