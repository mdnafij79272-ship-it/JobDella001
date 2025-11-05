import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Job, Submission, SubmissionStatus, Transaction, TransactionType, Notification, NotificationType, Platform, Message, JobApprovalStatus, Announcement } from './types';
import Header from './components/Header';
import JobCard from './components/JobCard';
import CreateJobModal from './components/CreateJobModal';
import ConfirmationModal from './components/ConfirmationModal';
import Wallet from './components/Wallet';
import ManageGigs from './components/ManageGigs';
import EditJobModal from './components/EditJobModal';
import RejectionModal from './components/RejectionModal';
import ReportModal from './components/ReportModal';
import Profile from './components/Profile';
import Auth from './components/Auth';
import firebase, { auth, db } from './firebase';
import { useToasts } from './components/Toasts';
import AddQuantityModal from './components/AddQuantityModal';
import BoostConfirmationModal from './components/BoostConfirmationModal';
import NotificationsPanel from './components/NotificationsPanel';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import FilterModal from './components/FilterModal';
import AiAssistantModal from './components/AiAssistantModal';
import TipModal from './components/TipModal';
import { Chat } from '@google/genai';
import AdminPanel from './components/AdminPanel';
import AnnouncementModal from './components/AnnouncementModal';
import TokenListing from './components/TokenListing';
import Announcements from './components/Announcements';
import Refer from './components/Refer';
import EditProfileModal from './components/EditProfileModal';


// Define types and constants from the firebase object.
// FIX: Inferred types from imported auth and db objects to avoid global namespace issues with Firebase v8 CDN build.
type User = NonNullable<typeof auth.currentUser>;
// FIX: The complex type inference for QuerySnapshot was failing due to the Firebase SDK being loaded from a CDN. Replaced with a direct reference to the correct type from the global firebase object to resolve type errors.
// FIX: The `firebase` object from the CDN does not provide a TypeScript namespace. Changed to `any` to resolve the type error, which is consistent with other typings in the project.
type QuerySnapshot = any;
const Timestamp = firebase.firestore.Timestamp;
const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
const increment = firebase.firestore.FieldValue.increment;


// MOCK USER IDs (string)
const MOCK_USER_2 = 'mock-user-2-other';
const ADMIN_UIDS = ['u1s2e3r4-a5d6-m7i8-n9i0-d1e2f3a4u5i6']; // TODO: Replace with actual admin User IDs


// For simulation purposes
// UPDATED: Referral codes are now 5 characters long.
const MOCK_REFERRAL_CODES: { [code: string]: string } = {
    'FRIEN': MOCK_USER_2,
    'WELCO': 'mock-user-3',
};

// Helper to prevent floating point inaccuracies in Firestore
const roundCurrency = (num: number): number => {
    return parseFloat(num.toFixed(4));
};

// Helper to find user ref by UID or display name (case-insensitive fallback)
const findUserRef = async (identifier: string): Promise<any | null> => {
    if (!identifier) return null;
    
    // 1. Try as UID first
    const userDoc = await db.collection('users').doc(identifier).get();
    if (userDoc.exists) {
        return userDoc.ref;
    }
    
    // 2. Fallback to display name with case variations
    const name = identifier;
    const namesToQuery = [...new Set([
        name, 
        name.toLowerCase(), 
        name.toUpperCase(),
        name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
    ])];
    
    for (const nameCase of namesToQuery) {
        const usersQuery = await db.collection('users').where('displayName', '==', nameCase).limit(1).get();
        if (!usersQuery.empty) {
            return usersQuery.docs[0].ref;
        }
    }
    
    // 3. If not found, return null
    return null;
};


export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [submissionsMap, setSubmissionsMap] = useState<Record<string, Submission>>({});
  const [hiddenJobIds, setHiddenJobIds] = useState<number[]>(() => {
    try {
        const saved = localStorage.getItem('hiddenJobIds');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Failed to parse hiddenJobIds from localStorage", error);
        return [];
    }
  });
  
  useEffect(() => {
    try {
        localStorage.setItem('hiddenJobIds', JSON.stringify(hiddenJobIds));
    } catch (error) {
        console.error("Failed to save hiddenJobIds to localStorage", error);
    }
  }, [hiddenJobIds]);

  // --- Currency State ---
  const [userPoints, setUserPoints] = useState(0); // This is JD TOKENS
  const [userBdtBalance, setUserBdtBalance] = useState(0);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [view, setView] = useState<'jobs' | 'announcements' | 'wallet' | 'manage' | 'refer' | 'profile' | 'admin' | 'token'>('jobs');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = useState(false);

  // --- Profile State ---
  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<string>('');
  const [gigsCompleted, setGigsCompleted] = useState(0);
  const [gigsCreated, setGigsCreated] = useState(0);
  // --- Currency Earnings State ---
  const [totalEarnings, setTotalEarnings] = useState(0); // JD TOKENS earnings
  const [totalBdtEarnings, setTotalBdtEarnings] = useState(0);

  // --- Referral System State ---
  const [userReferralCode, setUserReferralCode] = useState<string>('');
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [referralsCount, setReferralsCount] = useState<number>(0);
  // --- Currency Unclaimed Referral Earnings State ---
  const [unclaimedReferralEarnings, setUnclaimedReferralEarnings] = useState(0); // JD TOKENS
  const [unclaimedBdtReferralEarnings, setUnclaimedBdtReferralEarnings] = useState(0); // BDT

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddQuantityModalOpen, setIsAddQuantityModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAiAssistantModalOpen, setIsAiAssistantModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [jobToConfirm, setJobToConfirm] = useState<Job | null>(null);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);
  const [jobToBoost, setJobToBoost] = useState<Job | null>(null);
  const [jobToAddQuantity, setJobToAddQuantity] = useState<Job | null>(null);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [submissionToReject, setSubmissionToReject] = useState<Submission | null>(null);
  const [submissionToReport, setSubmissionToReport] = useState<Submission | null>(null);
  const [submissionToTip, setSubmissionToTip] = useState<Submission | null>(null);
  
  // AI Assistant State
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const aiChatSessionRef = useRef<Chat | null>(null);
  const [aiLanguage, setAiLanguage] = useState<'en' | 'bn' | null>(null);

  // Filtering State
  const [selectedCategories, setSelectedCategories] = useState<Platform[]>([]);

  // Announcement State
  const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null);
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([]);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  const { addToast } = useToasts();
  const isAdmin = useMemo(() => user && ADMIN_UIDS.includes(user.uid), [user]);

  // --- Announcement Loading ---
  useEffect(() => {
    if (!user) return;
    // FIX: Modified query to avoid needing a composite index which was causing crashes.
    // This now fetches the 5 most recent announcements and finds the first active one on the client side.
    const unsubscribe = db.collection('announcements')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .onSnapshot(snapshot => {
        const latestActiveAnnouncement = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Announcement))
            .find(ann => ann.isActive === true);

        if (latestActiveAnnouncement) {
            setLatestAnnouncement(latestActiveAnnouncement);
            const hasSeen = localStorage.getItem(`seenAnnouncement_${latestActiveAnnouncement.id}`);
            if (!hasSeen) {
                setIsAnnouncementModalOpen(true);
            }
        } else {
            setLatestAnnouncement(null);
        }
      }, err => {
        console.error("Error fetching announcements:", err);
        addToast("Could not load announcements.", "error");
      });

    return () => unsubscribe();
}, [user, addToast]);

  // --- All Announcements Loading ---
  useEffect(() => {
    if (!user) return;
    const unsubscribe = db.collection('announcements')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const announcementsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
        setAllAnnouncements(announcementsData);
      }, err => {
        console.error("Error fetching all announcements:", err);
        addToast("Could not load announcements list.", "error");
      });

    return () => unsubscribe();
  }, [user, addToast]);

  // --- Auth & Initial Data Loading ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        setPermissionError(false); // Reset permission error on user change
        setErrorMessages([]);
        
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            // --- One-time setup for NEW users ---
            console.log("New user detected, setting up account...");

            // Generate a 5-character referral code
            const referralCode = Math.random().toString(36).substring(2, 7).toUpperCase();
            
            // Set a default display name
            const displayName = `user${user.uid.substring(0, 5)}`;
            await user.updateProfile({ displayName });

            const referralCodeUsed = sessionStorage.getItem('referralCode');
            sessionStorage.removeItem('referralCode');
            let referredByUID: string | null = null;
            if (referralCodeUsed && MOCK_REFERRAL_CODES[referralCodeUsed]) {
                referredByUID = MOCK_REFERRAL_CODES[referralCodeUsed];
            } else if (referralCodeUsed) {
                 // Check in Firestore for real codes
                const codesQuery = await db.collection('users').where('referralCode', '==', referralCodeUsed).limit(1).get();
                if (!codesQuery.empty) {
                    referredByUID = codesQuery.docs[0].id;
                }
            }


            // Create user document
            await userRef.set({
                displayName: displayName,
                email: user.email,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                referralCode: referralCode,
                referredBy: referredByUID,
                gigsCompleted: 0,
                gigsCreated: 0,
                totalEarnings: 0,
                totalBdtEarnings: 0,
                unclaimedReferralEarnings: 0,
                unclaimedBdtReferralEarnings: 0,
            });
            
             // Create wallet document with bonuses
            const walletRef = db.collection('wallets').doc(user.uid);
            await walletRef.set({
                // Give 100 JD tokens signup bonus
                points: 100,
                // Give 10 BDT signup bonus
                bdtBalance: 10
            });

            // Create transaction logs for bonuses
            const transactionsRef = userRef.collection('transactions');
            await transactionsRef.add({
                type: TransactionType.SIGNUP_BONUS,
                amount: 100,
                currency: 'JD TOKENS',
                description: 'Welcome Bonus!',
                date: serverTimestamp(),
            });
            await transactionsRef.add({
                type: TransactionType.SIGNUP_BONUS,
                amount: 10,
                currency: 'BDT',
                description: 'Welcome Bonus!',
                date: serverTimestamp(),
            });

            addToast('Welcome! You received 100 JD TOKENS and 10 BDT as a bonus.', 'success');
            
            // If referred, give bonus to referrer and user
            if (referredByUID) {
                const referrerUserRef = db.collection('users').doc(referredByUID);
                // Referrer gets 4 JD TOKENS
                await referrerUserRef.update({
                    referralsCount: increment(1),
                    unclaimedReferralEarnings: increment(4),
                });
                
                // New user gets 5 JD TOKENS for using a code
                 await walletRef.update({ points: increment(5) });
                 await transactionsRef.add({
                    type: TransactionType.REFERRAL_SIGNUP_BONUS,
                    amount: 5,
                    currency: 'JD TOKENS',
                    description: `Bonus for using referral code ${referralCodeUsed}`,
                    date: serverTimestamp(),
                });
                addToast('You got an extra 5 JD TOKENS for using a referral code!', 'success');
            }

        } else {
            // --- One-time data migration for EXISTING users ---
            const walletRef = db.collection('wallets').doc(user.uid);
            const walletDoc = await walletRef.get();

            if (!walletDoc.exists) {
                console.log("Wallet document not found for existing user. Migrating balances...");
                const userData = userDoc.data();
                
                // Read balances from the old location (user doc)
                const bdtBalance = userData?.bdtBalance ?? 0;
                const jdTokens = userData?.points ?? userData?.balance ?? 0;

                const batch = db.batch();

                // 1. Create the new wallet document with the old balances.
                batch.set(walletRef, {
                    points: jdTokens,
                    bdtBalance: bdtBalance
                });

                // 2. Prepare to remove the old balance fields from the user document.
                const userUpdate: { [key: string]: any } = {};
                if (userData?.hasOwnProperty('bdtBalance')) userUpdate.bdtBalance = firebase.firestore.FieldValue.delete();
                if (userData?.hasOwnProperty('points')) userUpdate.points = firebase.firestore.FieldValue.delete();
                if (userData?.hasOwnProperty('balance')) userUpdate.balance = firebase.firestore.FieldValue.delete();
                
                // Only update user doc if there are fields to delete
                if (Object.keys(userUpdate).length > 0) {
                    batch.update(userRef, userUpdate);
                }

                try {
                    await batch.commit();
                    addToast('Your account has been updated to the new wallet system.', 'info');
                } catch (migrationError) {
                    console.error("Failed to migrate user wallet:", migrationError);
                    addToast('Could not update your account. Please contact support.', 'error');
                }
            }
        }
        
        // --- Set up real-time listeners for logged-in user ---
        const listeners = [
          // Listen ONLY to wallet changes for balances. This is now the single source of truth.
          db.collection('wallets').doc(user.uid).onSnapshot(doc => {
            if (doc.exists) {
              const data = doc.data();
              setUserPoints(data?.points || 0);
              setUserBdtBalance(data?.bdtBalance || 0);
            } else {
              setUserPoints(0);
              setUserBdtBalance(0);
            }
          }, err => {
              const errorMessage = "Could not load wallet data due to a permissions issue.";
              console.error("Error fetching wallet:", err);
              if (err.message?.includes('permission')) {
                setPermissionError(true);
                setErrorMessages(prev => [...new Set([...prev, errorMessage])]);
              } else {
                addToast("Could not load your wallet data.", "error");
              }
              setUserPoints(0);
              setUserBdtBalance(0);
          }),
          // Listen to user profile changes (NO balance logic)
          // This is the primary listener that controls the main loading state.
          userRef.onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                setDisplayName(data?.displayName || '');
                setEmail(data?.email || '');
                setCreatedAt(data?.createdAt?.toDate().toLocaleDateString() || '');
                setGigsCompleted(data?.gigsCompleted || 0);
                setGigsCreated(data?.gigsCreated || 0);
                setTotalEarnings(data?.totalEarnings || 0);
                setTotalBdtEarnings(data?.totalBdtEarnings || 0);
                setUserReferralCode(data?.referralCode || '');
                setReferredBy(data?.referredBy || null);
                setReferralsCount(data?.referralsCount || 0);
                setUnclaimedReferralEarnings(data?.unclaimedReferralEarnings || 0);
                setUnclaimedBdtReferralEarnings(data?.unclaimedBdtReferralEarnings || 0);
            }
            setLoading(false); // Data loaded successfully, stop loading.
          }, err => {
              const errorMessage = "Could not load your profile due to a permissions issue.";
              console.error("Error fetching user profile:", err);
              if (err.message?.includes('permission')) {
                setPermissionError(true);
                 setErrorMessages(prev => [...new Set([...prev, errorMessage])]);
              } else {
                addToast("Could not load your profile information.", "error");
              }
              // Reset profile state on error
              setDisplayName('');
              setEmail('');
              setCreatedAt('');
              setGigsCompleted(0);
              setGigsCreated(0);
              // Defensively reset other states to prevent crashes from stale data
              setJobs([]);
              setSubmissionsMap({});
              setLoading(false); // Stop loading, even on error, to show the error screen.
          }),
          // Listen to transactions
          userRef.collection('transactions').orderBy('date', 'desc').onSnapshot(snapshot => {
            const txs = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              date: doc.data().date?.toDate() || new Date(),
            } as Transaction));
            setTransactions(txs);
          }, err => {
              const errorMessage = "Could not load transaction history due to a permissions issue.";
              console.error("Error fetching transactions:", err);
              if (err.message?.includes('permission')) {
                setPermissionError(true);
                 setErrorMessages(prev => [...new Set([...prev, errorMessage])]);
              } else {
                addToast("Could not load your transaction history.", "error");
              }
              setTransactions([]);
          }),
          // Listen to notifications
          userRef.collection('notifications').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
             const notifs = snapshot.docs.map(doc => ({
                 id: doc.id,
                 ...doc.data()
             } as Notification));
             setNotifications(notifs);
          }, err => {
              const errorMessage = "Could not load notifications due to a permissions issue.";
              console.error("Error fetching notifications:", err);
               if (err.message?.includes('permission')) {
                setPermissionError(true);
                setErrorMessages(prev => [...new Set([...prev, errorMessage])]);
              } else {
                addToast("Could not load your notifications.", "error");
              }
              setNotifications([]);
          }),
        ];
        
        // Return a cleanup function to unsubscribe from all listeners
        return () => listeners.forEach(unsubscribe => unsubscribe());

      } else {
        setUser(null);
        setLoading(false);
        setAiLanguage(null); // Reset AI language on logout
        setAiMessages([]);
        aiChatSessionRef.current = null;
      }
    });

    return () => unsubscribe();
  }, []);
  
   // --- Global Data Loading ---
  useEffect(() => {
    if (!user) {
      setJobs([]); // Clear jobs on logout to prevent seeing old data on re-login
      return;
    }
    // Listen to all jobs only when a user is logged in
    const unsubscribeJobs = db.collection('jobs').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
      const jobsData = snapshot.docs.map(doc => ({
        id: parseInt(doc.id, 10),
        ...doc.data(),
      } as Job));
      setJobs(jobsData);
    }, err => {
        const errorMessage = "Could not load jobs due to a permissions issue.";
        console.error("Error fetching jobs:", err);
        if (err.message?.includes('permission')) {
            setPermissionError(true);
            setErrorMessages(prev => [...new Set([...prev, errorMessage])]);
        }
        addToast(errorMessage, "error");
        setJobs([]);
    });

    return () => {
      unsubscribeJobs();
    };
  }, [user, addToast]);
  

  const postedJobIds = useMemo(() => {
    if (!user) return [];
    return jobs.filter(job => job.posterId === user.uid).map(job => job.id);
  }, [jobs, user]);

  // --- User-Specific Submissions Loading ---
  useEffect(() => {
      if (!user) {
          setSubmissionsMap({}); // Clear all submissions on logout
          return;
      }

      // Listener for submissions MADE BY the current user
      const unsubscribeUserSubmissions = db.collection('submissions')
          .where('userId', '==', user.uid)
          .onSnapshot(snapshot => {
              const userSubs: Record<string, Submission> = {};
              snapshot.forEach(doc => {
                  userSubs[doc.id] = { id: doc.id, ...doc.data() } as Submission;
              });
              // Update state, merging with any submissions from the poster listener
              setSubmissionsMap(prev => ({...prev, ...userSubs}));
          }, err => {
              const errorMessage = "Could not load your submissions due to a permissions issue.";
              console.error("Error listening to user submissions:", err);
               if (err.message?.includes('permission')) {
                setPermissionError(true);
                setErrorMessages(prev => [...new Set([...prev, errorMessage])]);
              }
              addToast('Error loading your submissions.', 'error');
          });

      return () => {
          unsubscribeUserSubmissions();
      };
  }, [user, addToast]);


  // --- Poster-Specific Submissions Loading ---
  useEffect(() => {
      if (!user) return;

      if (postedJobIds.length === 0) {
          // If the user has no jobs, clear any lingering poster submissions from a previous state
          setSubmissionsMap(prev => {
// FIX: The type of `sub` was being inferred as `unknown` here, causing a build error. Added a type assertion to `Submission` to fix it.
              const userSubs = Object.fromEntries(Object.entries(prev).filter(([_, sub]) => (sub as Submission).userId === user.uid));
              return userSubs;
          });
          return;
      }

      const unsubscribers: (() => void)[] = [];

      // Listener for submissions TO jobs posted by the user
      // Batched in chunks of 30 for Firestore 'in' query limit
      for (let i = 0; i < postedJobIds.length; i += 30) {
          const chunk = postedJobIds.slice(i, i + 30);
          const posterSubmissionsListener = db.collection('submissions')
              .where('jobId', 'in', chunk)
              .onSnapshot(snapshot => {
                  const posterSubs: Record<string, Submission> = {};
                  snapshot.forEach(doc => {
                      posterSubs[doc.id] = { id: doc.id, ...doc.data() } as Submission;
                  });
                  setSubmissionsMap(prev => ({...prev, ...posterSubs}));
              }, err => {
                  const errorMessage = "Could not load gig submissions due to a permissions issue.";
                  console.error("Error listening to poster submissions:", err);
                   if (err.message?.includes('permission')) {
                    setPermissionError(true);
                    setErrorMessages(prev => [...new Set([...prev, errorMessage])]);
                  }
                  addToast('Error loading gig submissions.', 'error');
              });
          unsubscribers.push(posterSubmissionsListener);
      }
      
      return () => {
          unsubscribers.forEach(unsub => unsub());
      };
  }, [user, postedJobIds, addToast]);

  const allSubmissions = useMemo(() => Object.values(submissionsMap), [submissionsMap]);
  const userSubmissions = useMemo(() => allSubmissions.filter(s => s.userId === user?.uid), [allSubmissions, user]);
  const postedJobs = useMemo(() => jobs.filter(job => job.posterId === user?.uid), [jobs, user]);

  const handleNavClick = (newView: 'jobs' | 'announcements' | 'wallet' | 'manage' | 'refer' | 'profile' | 'admin' | 'token') => {
    setView(newView);
  };
  
  // --- Job & Submission Actions ---
  const handleAddJob = async (jobData: Omit<Job, 'id' | 'posterId' | 'remaining' | 'createdAt' | 'boostedUntil' | 'approvalStatus' | 'rejectionReason'>) => {
    if (!user) {
        addToast('You must be logged in to post a job.', 'error');
        throw new Error('User not logged in');
    }
    const { reward, quantity, currency } = jobData;
    const baseCost = reward * quantity;
    const platformFee = baseCost * 0.10;
    const totalCost = roundCurrency(baseCost + platformFee);

    const userBalance = currency === 'BDT' ? userBdtBalance : userPoints;

    if (userBalance < totalCost) {
      addToast('Insufficient funds to post this job.', 'error');
      throw new Error('Insufficient funds');
    }
    
    // Use a Firestore transaction to ensure atomicity
    const batch = db.batch();
    const userRef = db.collection('users').doc(user.uid);
    const walletRef = db.collection('wallets').doc(user.uid);
    
    // 1. Create a placeholder for the new job to get an ID
    // UPDATED: Using a counter for sequential job IDs.
    const counterRef = db.collection('counters').doc('jobs');
    let newJobId: number;

    try {
        await db.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            if (!counterDoc.exists) {
                transaction.set(counterRef, { count: 1 });
                newJobId = 1;
            } else {
                newJobId = counterDoc.data()!.count + 1;
                transaction.update(counterRef, { count: newJobId });
            }
        });
    } catch (error) {
        console.error("Error getting new job ID:", error);
        addToast("Could not generate a job ID. Please try again.", "error");
        throw new Error("Could not generate job ID");
    }

    // 2. Prepare the new job document with the obtained ID
    const newJobRef = db.collection('jobs').doc(newJobId!.toString());
    
    // FIX: Create a mutable copy and remove the subcategory field if it's falsy to prevent Firestore errors with `undefined`.
    const newJobData = { ...jobData };
    if (!newJobData.subcategory) {
        delete (newJobData as Partial<typeof newJobData>).subcategory;
    }
    if (!newJobData.twitterSubcategory) {
        delete (newJobData as Partial<typeof newJobData>).twitterSubcategory;
    }
    
    const newJob: Job = {
      id: newJobId!,
      posterId: user.uid,
      ...newJobData,
      remaining: quantity,
      pendingCount: 0,
      createdAt: serverTimestamp(),
      approvalStatus: JobApprovalStatus.APPROVED, // Default to APPROVED
    };
    batch.set(newJobRef, newJob);

    // 3. Update user's balance in their wallet
    const balanceField = currency === 'BDT' ? 'bdtBalance' : 'points';
    batch.update(walletRef, { [balanceField]: increment(-totalCost) });

    // 4. Record the transaction
    const transactionRef = userRef.collection('transactions').doc();
    batch.set(transactionRef, {
      type: TransactionType.GIG_POST,
      amount: -totalCost,
      currency,
      description: `Posted job: "${jobData.title}" (ID: ${newJobId})`,
      date: serverTimestamp(),
    });

    // 5. Update user stats
    batch.update(userRef, { gigsCreated: increment(1) });
    
    // Referrer Commission Logic
    if (referredBy) {
        const referredByUserRef = await findUserRef(referredBy);
        if (referredByUserRef) {
            // Referrer gets a 1% commission on the BDT value of the job cost
            // (1 BDT = 10 JD TOKENS for commission purposes)
            const commissionableAmountBdt = currency === 'BDT' ? totalCost : totalCost / 10;
            const commissionBdt = roundCurrency(commissionableAmountBdt * 0.01);
            if (commissionBdt > 0) {
                batch.update(referredByUserRef, {
                    unclaimedBdtReferralEarnings: increment(commissionBdt)
                });
                
                // Add a notification for the referrer
                const notificationRef = referredByUserRef.collection('notifications').doc();
                batch.set(notificationRef, {
                    userId: referredByUserRef.id,
                    type: NotificationType.REFERRAL_GIG_POST_COMMISSION,
                    message: `You earned ${commissionBdt.toFixed(2)} BDT commission because your referral posted a job!`,
                    isRead: false,
                    createdAt: serverTimestamp(),
                });
            }
        }
    }


    try {
        await batch.commit();
        addToast('Job posted successfully!', 'success');
        setIsCreateModalOpen(false);
    } catch (error) {
        console.error("Error posting job:", error);
        addToast('Failed to post job. Please try again.', 'error');
        throw error;
    }
  };

  const handleClaimJob = (job: Job) => {
    setJobToConfirm(job);
    setIsConfirmationModalOpen(true);
  };
  
  const handleHideJob = (jobId: number) => {
    setHiddenJobIds(prev => [...prev, jobId]);
    addToast('Job hidden. It will not be shown again.', 'info');
  };

  const handleConfirmSubmission = async (jobId: number, proof: string) => {
    if (!user) {
        addToast('You must be logged in.', 'error');
        return;
    }
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
        addToast('Job not found.', 'error');
        return;
    }
    
    // Fetch user's real IP address (IPv4 or IPv6)
    let userIpAddress = 'N/A';
    try {
        const response = await fetch('https://api64.ipify.org?format=json');
        if (response.ok) {
            const data = await response.json();
            userIpAddress = data.ip;
        } else {
            console.warn('Could not fetch user IP from ipify.');
        }
    } catch (error) {
        console.error('Error fetching user IP:', error);
    }

    const submission: Omit<Submission, 'id'> = {
      userId: user.uid,
      userDisplayName: user.displayName || `user-${user.uid.substring(0,5)}`,
      userIp: userIpAddress,
      jobId,
      jobTitle: job.title,
      proof,
      status: SubmissionStatus.PENDING,
      createdAt: serverTimestamp(),
    };
    
    const batch = db.batch();
    const submissionRef = db.collection('submissions').doc();
    const jobRef = db.collection('jobs').doc(jobId.toString());
    
    batch.set(submissionRef, submission);
    batch.update(jobRef, { 
        remaining: increment(-1),
        pendingCount: increment(1)
    });

    try {
        await batch.commit();
        addToast('Submission received! It will be reviewed by the job poster.', 'success');
        setIsConfirmationModalOpen(false);
    } catch (error) {
        console.error("Error submitting proof:", error);
        addToast('Failed to submit. Please try again.', 'error');
    }
  };
  
  const handleEditJob = async (job: Job) => {
      const jobRef = db.collection('jobs').doc(job.id.toString());
      try {
          await jobRef.update({
              title: job.title,
              task: job.task,
          });
          addToast('Job updated successfully!', 'success');
          setIsEditModalOpen(false);
      } catch (error) {
          console.error("Error updating job:", error);
          addToast('Failed to update job.', 'error');
      }
  };

  const handleApproveSubmission = useCallback(async (submissionId: string) => {
    if (!user) return;
    const submission = submissionsMap[submissionId];
    if (!submission || submission.status !== SubmissionStatus.PENDING) {
        console.warn(`Submission ${submissionId} already processed or not found.`);
        return;
    }

    const job = jobs.find(j => j.id === submission.jobId);
    if (!job) {
        console.error(`Job ${submission.jobId} not found for submission ${submissionId}`);
        return;
    }

    const batch = db.batch();
    const submissionRef = db.collection('submissions').doc(submissionId);
    const jobRef = db.collection('jobs').doc(submission.jobId.toString());
    const workerRef = db.collection('users').doc(submission.userId);
    const workerWalletRef = db.collection('wallets').doc(submission.userId);

    // 1. Update submission status
    batch.update(submissionRef, { status: SubmissionStatus.APPROVED });
    // 2. Decrement pending count on job
    batch.update(jobRef, { pendingCount: increment(-1) });
    // 3. Pay the worker
    const workerBalanceField = job.currency === 'BDT' ? 'bdtBalance' : 'points';
    batch.update(workerWalletRef, { [workerBalanceField]: increment(job.reward) });
    
    // 4. Log transaction for worker
    const workerTransactionRef = workerRef.collection('transactions').doc();
    batch.set(workerTransactionRef, {
        type: TransactionType.GIG_COMPLETED,
        amount: job.reward,
        currency: job.currency,
        description: `Completed: "${job.title}"`,
        date: serverTimestamp(),
    });

    // 5. Update worker's stats
    const totalEarningsField = job.currency === 'BDT' ? 'totalBdtEarnings' : 'totalEarnings';
    batch.update(workerRef, { 
        gigsCompleted: increment(1),
        [totalEarningsField]: increment(job.reward)
    });
    
    // 6. Referrer Commission Logic (5% of worker's earnings)
    const workerDoc = await workerRef.get();
    const workerData = workerDoc.data();
    if (workerData?.referredBy) {
        const referrerUserRef = await findUserRef(workerData.referredBy);
        if (referrerUserRef) {
            // Referrer gets 5% commission in JD TOKENS, regardless of the job currency
            // 1 BDT = 10 JD TOKENS for commission purposes
            const earningsInJd = job.currency === 'JD TOKENS' ? job.reward : job.reward * 10;
            const commission = roundCurrency(earningsInJd * 0.05);

            if (commission > 0) {
                 batch.update(referrerUserRef, {
                    unclaimedReferralEarnings: increment(commission)
                });
                // Add a notification for the referrer
                const notificationRef = referrerUserRef.collection('notifications').doc();
                batch.set(notificationRef, {
                    userId: referrerUserRef.id,
                    type: NotificationType.EARNINGS_COMMISSION,
                    message: `You earned ${commission.toFixed(2)} JD TOKENS commission from your referral's earnings!`,
                    isRead: false,
                    createdAt: serverTimestamp(),
                });
            }
        }
    }

    try {
        await batch.commit();
        addToast('Submission approved and worker paid.', 'success');
    } catch (error) {
        console.error("Error approving submission:", error);
        addToast('Failed to approve submission.', 'error');
    }
  }, [user, jobs, submissionsMap, addToast, referredBy]);

  const handleRejectSubmission = async (submissionId: string, reason: string) => {
    const batch = db.batch();
    const submissionRef = db.collection('submissions').doc(submissionId);
    const submission = submissionsMap[submissionId];
    if (!submission) return;

    const jobRef = db.collection('jobs').doc(submission.jobId.toString());

    batch.update(submissionRef, { 
        status: SubmissionStatus.REJECTED,
        rejectionReason: reason 
    });
    batch.update(jobRef, {
        remaining: increment(1),
        pendingCount: increment(-1)
    });

    try {
        await batch.commit();
        addToast('Submission rejected.', 'info');
        setIsRejectionModalOpen(false);
    } catch (error) {
        console.error("Error rejecting submission:", error);
        addToast('Failed to reject submission.', 'error');
    }
  };
  
    const handleConfirmDelete = async (jobId: number) => {
        if (!user) return;
        const job = jobs.find(j => j.id === jobId);
        if (!job) {
            addToast('Job not found.', 'error');
            return;
        }

        const jobSubmissions = allSubmissions.filter(s => s.jobId === job.id);
        const pendingSubmissions = jobSubmissions.filter(s => s.status === SubmissionStatus.PENDING);

        const batch = db.batch();
        const userRef = db.collection('users').doc(user.uid);
        const walletRef = db.collection('wallets').doc(user.uid);
        const jobRef = db.collection('jobs').doc(job.id.toString());
        
        let pendingCost = 0;
        
        // 1. Auto-approve all pending submissions
        for (const sub of pendingSubmissions) {
            const submissionRef = db.collection('submissions').doc(sub.id);
            const workerRef = db.collection('users').doc(sub.userId);
            const workerWalletRef = db.collection('wallets').doc(sub.userId);
            
            batch.update(submissionRef, { status: SubmissionStatus.APPROVED });

            // Pay worker
            const workerBalanceField = job.currency === 'BDT' ? 'bdtBalance' : 'points';
            batch.update(workerWalletRef, { [workerBalanceField]: increment(job.reward) });
            pendingCost += job.reward;
            
            // Log transaction for worker
            const workerTransactionRef = workerRef.collection('transactions').doc();
            batch.set(workerTransactionRef, {
                type: TransactionType.GIG_COMPLETED,
                amount: job.reward,
                currency: job.currency,
                description: `Completed: "${job.title}" (Job Deleted)`,
                date: serverTimestamp(),
            });

            // Update worker stats
            const totalEarningsField = job.currency === 'BDT' ? 'totalBdtEarnings' : 'totalEarnings';
            batch.update(workerRef, { 
                gigsCompleted: increment(1),
                [totalEarningsField]: increment(job.reward)
            });
        }
        
        // 2. Calculate and apply refund
        const baseCostPerTask = job.reward * 1.10; // Reward + 10% fee
        const refundAmount = roundCurrency((job.remaining) * baseCostPerTask);
        
        if (refundAmount > 0) {
            const balanceField = job.currency === 'BDT' ? 'bdtBalance' : 'points';
            batch.update(walletRef, { [balanceField]: increment(refundAmount) });

            // Log refund transaction
            const refundTransactionRef = userRef.collection('transactions').doc();
            batch.set(refundTransactionRef, {
                type: TransactionType.GIG_REFUND,
                amount: refundAmount,
                currency: job.currency,
                description: `Refund for deleted job: "${job.title}"`,
                date: serverTimestamp(),
            });
        }
        
        // 3. Delete the job document
        batch.delete(jobRef);
        
        try {
            await batch.commit();
            addToast(`Job "${job.title}" deleted successfully.`, 'success');
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error("Error deleting job:", error);
            addToast('Failed to delete job. Please try again.', 'error');
        }
    };
    
    const handleConfirmBoost = async (duration: number, cost: number) => {
        if (!user || !jobToBoost) return;
        
        const jobRef = db.collection('jobs').doc(jobToBoost.id.toString());
        const walletRef = db.collection('wallets').doc(user.uid);
        const userRef = db.collection('users').doc(user.uid);
        
        const batch = db.batch();
        
        const boostEndTime = new Date(Date.now() + duration * 60 * 1000);
        
        batch.update(jobRef, { boostedUntil: Timestamp.fromDate(boostEndTime) });
        batch.update(walletRef, { bdtBalance: increment(-cost) });
        
        const transactionRef = userRef.collection('transactions').doc();
        batch.set(transactionRef, {
            type: TransactionType.GIG_BOOST,
            amount: -cost,
            currency: 'BDT',
            description: `Boosted job: "${jobToBoost.title}" for ${duration} mins`,
            date: serverTimestamp(),
        });
        
        try {
            await batch.commit();
            addToast('Job boosted successfully!', 'success');
            setIsBoostModalOpen(false);
        } catch (error) {
            console.error("Error boosting job:", error);
            addToast('Failed to boost job. Please try again.', 'error');
            throw error;
        }
    };

    const handleConfirmAddQuantity = async (job: Job, additionalQuantity: number) => {
        if (!user) {
            addToast('You must be logged in.', 'error');
            return;
        }

        const baseCost = job.reward * additionalQuantity;
        const platformFee = baseCost * 0.10;
        const totalCost = roundCurrency(baseCost + platformFee);

        const userBalance = job.currency === 'BDT' ? userBdtBalance : userPoints;
        if (userBalance < totalCost) {
            addToast('Insufficient funds.', 'error');
            return;
        }

        const batch = db.batch();
        const jobRef = db.collection('jobs').doc(job.id.toString());
        const walletRef = db.collection('wallets').doc(user.uid);
        const userRef = db.collection('users').doc(user.uid);

        // 1. Update job quantities
        batch.update(jobRef, {
            quantity: increment(additionalQuantity),
            remaining: increment(additionalQuantity)
        });

        // 2. Deduct cost from wallet
        const balanceField = job.currency === 'BDT' ? 'bdtBalance' : 'points';
        batch.update(walletRef, { [balanceField]: increment(-totalCost) });

        // 3. Log transaction
        const transactionRef = userRef.collection('transactions').doc();
        batch.set(transactionRef, {
            type: TransactionType.GIG_ADD_QUANTITY,
            amount: -totalCost,
            currency: job.currency,
            description: `Added ${additionalQuantity} quantity to "${job.title}"`,
            date: serverTimestamp(),
        });

        try {
            await batch.commit();
            addToast(`Successfully added ${additionalQuantity} to your job!`, 'success');
            setIsAddQuantityModalOpen(false);
        } catch (error) {
            console.error("Error adding quantity:", error);
            addToast('Failed to add quantity. Please try again.', 'error');
        }
    };
    
    const handleReport = async (submissionId: string, reason: string) => {
        try {
            await db.collection('reports').add({
                submissionId,
                reporterId: user?.uid,
                reason,
                status: 'PENDING',
                createdAt: serverTimestamp(),
            });
            addToast('Report submitted. An admin will review it.', 'success');
            setIsReportModalOpen(false);
        } catch (error) {
            console.error("Error submitting report:", error);
            addToast('Failed to submit report. Please try again.', 'error');
        }
    };
    
    // --- Wallet Actions ---
    const handleDepositSubmit = async (senderNumber: string, amount: number, transactionId: string) => {
        if (!user) {
            addToast('You must be logged in.', 'error');
            throw new Error('User not logged in');
        }
        try {
            await db.collection('deposits').add({
                userId: user.uid,
                senderNumber,
                amount,
                transactionId,
                status: 'PENDING',
                createdAt: serverTimestamp(),
            });
            addToast('Deposit request submitted! It will be reviewed shortly.', 'success');
        } catch (error) {
            console.error("Error submitting deposit:", error);
            addToast('Failed to submit deposit request. Please try again.', 'error');
            throw error;
        }
    };
    
    const handleWithdrawalSubmit = async (bKashNumber: string, amount: number) => {
        if (!user) {
            addToast('You must be logged in.', 'error');
            throw new Error('User not logged in');
        }
        if (amount > userBdtBalance) {
            addToast('Withdrawal amount exceeds your BDT balance.', 'error');
            throw new Error('Insufficient funds');
        }

        const batch = db.batch();
        const userRef = db.collection('users').doc(user.uid);
        const walletRef = db.collection('wallets').doc(user.uid);
        
        // 1. Create withdrawal request document
        const withdrawalRef = db.collection('withdrawals').doc();
        batch.set(withdrawalRef, {
            userId: user.uid,
            bKashNumber,
            amount,
            status: 'PENDING',
            createdAt: serverTimestamp(),
        });
        
        // 2. Deduct amount from wallet immediately
        batch.update(walletRef, { bdtBalance: increment(-amount) });
        
        // 3. Log the transaction
        const transactionRef = userRef.collection('transactions').doc();
        batch.set(transactionRef, {
            type: TransactionType.WITHDRAW_REQUEST,
            amount: -amount,
            currency: 'BDT',
            description: `Withdrawal request for ${amount} BDT`,
            date: serverTimestamp(),
        });
        
        try {
            await batch.commit();
            addToast('Withdrawal request submitted!', 'success');
        } catch (error) {
            console.error("Error submitting withdrawal:", error);
            addToast('Failed to submit withdrawal request.', 'error');
            // Re-throw to be caught in the component for loading state management
            throw error;
        }
    };
    
    // --- Profile/Referral Actions ---
    const handleSaveProfile = async (newName: string, newPhoto: File | null) => {
        if (!user) return;
        
        try {
            const userRef = db.collection('users').doc(user.uid);
            
            await user.updateProfile({ displayName: newName });
            await userRef.update({ displayName: newName });
            
            if (newPhoto) {
                addToast('Profile photo updates are not yet supported.', 'info');
                // TODO: Implement Firebase Storage upload here
            }
            
            addToast('Profile updated successfully!', 'success');
            setIsEditProfileModalOpen(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            addToast('Failed to update profile.', 'error');
        }
    };

    const handleClaimReferralEarnings = async (currency: 'JD TOKENS' | 'BDT') => {
        if (!user) return;
        
        const isBdt = currency === 'BDT';
        const unclaimedAmount = isBdt ? unclaimedBdtReferralEarnings : unclaimedReferralEarnings;
        
        if (unclaimedAmount <= 0) {
            addToast(`You have no unclaimed ${currency} to collect.`, 'info');
            return;
        }
        
        const batch = db.batch();
        const userRef = db.collection('users').doc(user.uid);
        const walletRef = db.collection('wallets').doc(user.uid);
        
        const unclaimedField = isBdt ? 'unclaimedBdtReferralEarnings' : 'unclaimedReferralEarnings';
        const balanceField = isBdt ? 'bdtBalance' : 'points';
        
        // 1. Add earnings to wallet
        batch.update(walletRef, { [balanceField]: increment(unclaimedAmount) });
        
        // 2. Reset unclaimed earnings to 0
        batch.update(userRef, { [unclaimedField]: 0 });
        
        // 3. Log the transaction
        const transactionRef = userRef.collection('transactions').doc();
        batch.set(transactionRef, {
            type: TransactionType.REFERRAL_EARNINGS_CLAIM,
            amount: unclaimedAmount,
            currency,
            description: `Claimed referral earnings`,
            date: serverTimestamp(),
        });
        
        try {
            await batch.commit();
            addToast(`Successfully claimed ${unclaimedAmount.toFixed(2)} ${currency}!`, 'success');
        } catch (error) {
            console.error("Error claiming earnings:", error);
            addToast('Failed to claim earnings. Please try again.', 'error');
        }
    };

    const handleLogout = () => {
        auth.signOut();
    };
    
    // --- Notifications ---
    const handleMarkAllAsRead = async () => {
        if (!user) return;
        const unreadNotifs = notifications.filter(n => !n.isRead);
        if (unreadNotifs.length === 0) return;
        
        const batch = db.batch();
        unreadNotifs.forEach(notif => {
            const notifRef = db.collection('users').doc(user.uid).collection('notifications').doc(notif.id);
            batch.update(notifRef, { isRead: true });
        });
        
        try {
            await batch.commit();
        } catch (error) {
            console.error("Error marking notifications as read:", error);
            addToast('Could not update notifications.', 'error');
        }
    };
    
    // --- Tip Action ---
    const handleSendTip = async (submission: Submission, amount: number, currency: 'JD TOKENS' | 'BDT') => {
        if (!user) {
            addToast('You must be logged in to send a tip.', 'error');
            throw new Error('User not logged in');
        }

        const userBalance = currency === 'BDT' ? userBdtBalance : userPoints;
        if (userBalance < amount) {
            addToast('Insufficient funds to send this tip.', 'error');
            throw new Error('Insufficient funds');
        }

        const batch = db.batch();
        const tipperRef = db.collection('users').doc(user.uid);
        const tipperWalletRef = db.collection('wallets').doc(user.uid);
        const recipientRef = db.collection('users').doc(submission.userId);
        const recipientWalletRef = db.collection('wallets').doc(submission.userId);

        const balanceField = currency === 'BDT' ? 'bdtBalance' : 'points';

        // 1. Deduct from tipper's wallet
        batch.update(tipperWalletRef, { [balanceField]: increment(-amount) });

        // 2. Add to recipient's wallet
        batch.update(recipientWalletRef, { [balanceField]: increment(amount) });

        // 3. Log transaction for tipper
        const tipperTxRef = tipperRef.collection('transactions').doc();
        batch.set(tipperTxRef, {
            type: TransactionType.TIP_GIVEN,
            amount: -amount,
            currency: currency,
            description: `Tip for job: "${submission.jobTitle}"`,
            date: serverTimestamp(),
        });

        // 4. Log transaction for recipient
        const recipientTxRef = recipientRef.collection('transactions').doc();
        batch.set(recipientTxRef, {
            type: TransactionType.TIP_RECEIVED,
            amount: amount,
            currency: currency,
            description: `Tip from job poster for: "${submission.jobTitle}"`,
            date: serverTimestamp(),
        });
        
        // 5. Send notification to recipient
        const notificationRef = recipientRef.collection('notifications').doc();
        batch.set(notificationRef, {
            userId: submission.userId,
            type: NotificationType.TIP_RECEIVED,
            message: `${user.displayName} tipped you ${amount.toFixed(2)} ${currency} for your work on "${submission.jobTitle}"!`,
            isRead: false,
            createdAt: serverTimestamp(),
        });
        
        try {
            await batch.commit();
            addToast('Tip sent successfully!', 'success');
            setIsTipModalOpen(false);
        } catch (error) {
            console.error("Error sending tip:", error);
            addToast('Failed to send tip. Please try again.', 'error');
            throw error;
        }
    };
    
    const handleCloseAnnouncementModal = () => {
      if (latestAnnouncement) {
        localStorage.setItem(`seenAnnouncement_${latestAnnouncement.id}`, 'true');
      }
      setIsAnnouncementModalOpen(false);
    };

    // --- Render Logic ---
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-sky-600 mx-auto"></div>
                    <p className="text-slate-500 mt-4 text-lg">Loading Your Dashboard...</p>
                </div>
            </div>
        );
    }

    if (permissionError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
                <div className="text-center max-w-lg bg-white p-8 rounded-lg shadow-lg border-2 border-red-200">
                    <h1 className="text-2xl font-bold text-red-700">Permission Denied</h1>
                    <p className="text-red-600 mt-2 mb-4">
                        We couldn't access some of your data due to a security rules misconfiguration. This is a problem on our end.
                    </p>
                    <div className="text-left text-sm text-red-500 bg-red-100 p-3 rounded-md">
                        <strong>The following errors occurred:</strong>
                        <ul className="list-disc list-inside mt-2">
                            {errorMessages.map((msg, idx) => <li key={idx}>{msg}</li>)}
                        </ul>
                    </div>
                     <p className="text-slate-500 mt-6 text-sm">Please contact support or try again later. We apologize for the inconvenience.</p>
                     <button onClick={() => auth.signOut()} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-5 text-sm rounded-full transition-colors">
                        Logout
                    </button>
                </div>
            </div>
        );
    }
    
    if (!user) {
        return <Auth />;
    }
    
    const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

    const filteredJobs = jobs
        .filter(job => 
            !hiddenJobIds.includes(job.id) &&
            job.remaining > 0 && 
            job.approvalStatus === JobApprovalStatus.APPROVED &&
            (selectedCategories.length === 0 || selectedCategories.includes(job.platform))
        )
        .sort((a, b) => {
            const now = new Date();
            const aIsBoosted = a.boostedUntil && typeof a.boostedUntil.toDate === 'function' && a.boostedUntil.toDate() > now;
            const bIsBoosted = b.boostedUntil && typeof b.boostedUntil.toDate === 'function' && b.boostedUntil.toDate() > now;

            if (aIsBoosted && !bIsBoosted) return -1; // Boosted 'a' comes first
            if (!aIsBoosted && bIsBoosted) return 1; // Boosted 'b' comes first

            // If both have the same boost status, sort by creation date (newest first)
            const timeA = a.createdAt && typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate().getTime() : 0;
            const timeB = b.createdAt && typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate().getTime() : 0;
            return timeB - timeA;
        });
    
    const userSubmittedJobIds = userSubmissions.map(s => s.jobId);
    
    const jobForTipModal = submissionToTip ? jobs.find(j => j.id === submissionToTip.jobId) : null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        userPoints={userPoints}
        userBdtBalance={userBdtBalance}
        unreadNotificationsCount={unreadNotificationsCount}
        onToggleNotifications={() => setIsNotificationsPanelOpen(prev => !prev)}
        onProfileClick={() => handleNavClick('profile')}
        photoURL={user.photoURL}
        displayName={user.displayName}
      />
      {isNotificationsPanelOpen && (
        <NotificationsPanel 
            notifications={notifications}
            announcement={latestAnnouncement}
            onMarkAllAsRead={handleMarkAllAsRead}
            onClose={() => setIsNotificationsPanelOpen(false)}
        />
      )}
      <nav className="bg-white/80 backdrop-blur-sm sticky top-[68px] z-20 border-b border-gray-200">
        <div className="container mx-auto px-4 flex justify-around">
          {['jobs', 'token', 'wallet', 'manage', 'refer', ...(isAdmin ? ['admin'] : [])].map((v) => (
             <button
                key={v}
                onClick={() => handleNavClick(v as any)}
                className={`py-3 px-2 font-semibold text-sm capitalize border-b-4 transition-all ${view === v ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-gray-300'}`}
              >
                {v}
              </button>
          ))}
        </div>
      </nav>
      <main className="container mx-auto p-4">
        {view === 'jobs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-slate-800">Available Jobs</h2>
                 <div className="flex items-center gap-2">
                    <button onClick={() => setIsFilterModalOpen(true)} className="bg-white border border-gray-300 text-slate-700 font-semibold py-2 px-4 text-sm rounded-full flex items-center gap-2 hover:bg-gray-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                        Filter {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                    </button>
                    <button onClick={() => setIsCreateModalOpen(true)} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 text-sm rounded-full transition-colors">
                      + Post Job
                    </button>
                </div>
            </div>
            {filteredJobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                onClaim={handleClaimJob}
                submittedJobIds={userSubmittedJobIds}
                onHide={handleHideJob}
                isOwnJob={job.posterId === user.uid}
              />
            ))}
          </div>
        )}
        {view === 'announcements' && <Announcements announcements={allAnnouncements} />}
        {view === 'token' && <TokenListing />}
        {view === 'wallet' && <Wallet userPoints={userPoints} userBdtBalance={userBdtBalance} onDepositSubmit={handleDepositSubmit} onWithdrawalSubmit={handleWithdrawalSubmit} />}
        {view === 'manage' && (
            <ManageGigs 
                postedJobs={postedJobs} 
                submissions={allSubmissions} 
                onEdit={(job) => { setJobToEdit(job); setIsEditModalOpen(true); }}
                onDelete={(jobId) => { 
                    const jobToDelete = jobs.find(j => j.id === jobId);
                    if (jobToDelete) {
                        setJobToDelete(jobToDelete);
                        setIsDeleteModalOpen(true);
                    }
                }}
                onApprove={handleApproveSubmission}
                onReject={(sub) => { setSubmissionToReject(sub); setIsRejectionModalOpen(true); }}
                onOpenBoost={(job) => { setJobToBoost(job); setIsBoostModalOpen(true); }}
                onOpenAddQuantity={(job) => { setJobToAddQuantity(job); setIsAddQuantityModalOpen(true); }}
                onOpenTipModal={(sub) => { setSubmissionToTip(sub); setIsTipModalOpen(true); }}
            />
        )}
        {view === 'refer' && (
            <Refer
                referralCode={userReferralCode}
                referredBy={referredBy}
                referralsCount={referralsCount}
                unclaimedReferralEarnings={unclaimedReferralEarnings}
                unclaimedBdtReferralEarnings={unclaimedBdtReferralEarnings}
                onClaimReferralEarnings={() => handleClaimReferralEarnings('JD TOKENS')}
                onClaimBdtReferralEarnings={() => handleClaimReferralEarnings('BDT')}
            />
        )}
        {view === 'profile' && (
            <Profile 
                userId={user.uid}
                userPoints={userPoints}
                userBdtBalance={userBdtBalance}
                transactions={transactions}
                jobs={jobs}
                submissions={userSubmissions}
                onReport={(sub) => { setSubmissionToReport(sub); setIsReportModalOpen(true); }}
                onLogout={handleLogout}
                displayName={displayName}
                email={email}
                createdAt={createdAt}
                photoURL={user.photoURL}
                totalEarnings={totalEarnings}
                totalBdtEarnings={totalBdtEarnings}
                gigsCompleted={gigsCompleted}
                gigsCreated={gigsCreated}
                onNavigate={handleNavClick}
                onOpenEditProfile={() => setIsEditProfileModalOpen(true)}
            />
        )}
        {view === 'admin' && isAdmin && (
            <AdminPanel jobs={jobs} />
        )}
      </main>
      
        {/* Floating AI Assistant Button */}
        <button
            onClick={() => setIsAiAssistantModalOpen(true)}
            className="fixed bottom-6 right-6 bg-gradient-to-br from-sky-500 to-indigo-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform duration-200 z-40"
            aria-label="Open AI Assistant"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.938l-1.998 2.198a1 1 0 01-1.543-.035l-1.205-1.325A8.966 8.966 0 012 9a9 9 0 1118 0c0 .779-.098 1.536-.282 2.261l-2.078-2.078a3 3 0 00-4.242 4.242l2.078 2.078A8.963 8.963 0 0111 18.938zM18 9a7 7 0 10-14 0c0 .195.012.388.035.578A3 3 0 018 7a3 3 0 014.242 0A3 3 0 0113 9.422c.023-.19.035-.383.035-.578z" clipRule="evenodd" />
            </svg>
        </button>

      {/* --- Modals --- */}
      <CreateJobModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAddJob={handleAddJob}
        userPoints={userPoints}
        userBdtBalance={userBdtBalance}
      />
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={handleConfirmSubmission}
        job={jobToConfirm}
      />
      <EditJobModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onEditJob={handleEditJob}
        jobToEdit={jobToEdit}
      />
      <RejectionModal 
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        onConfirm={handleRejectSubmission}
        submission={submissionToReject}
      />
       <ReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onConfirm={handleReport}
        submission={submissionToReport}
      />
       <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={() => jobToDelete && handleConfirmDelete(jobToDelete.id)}
            jobTitle={jobToDelete?.title || ''}
            pendingCount={jobToDelete?.pendingCount || 0}
            refundAmount={jobToDelete ? (jobToDelete.reward * 1.10) * jobToDelete.remaining : 0}
            currency={jobToDelete?.currency || ''}
        />
        <BoostConfirmationModal 
            isOpen={isBoostModalOpen}
            onClose={() => setIsBoostModalOpen(false)}
            onConfirm={handleConfirmBoost}
            job={jobToBoost}
            userBdtBalance={userBdtBalance}
        />
        <AddQuantityModal
            isOpen={isAddQuantityModalOpen}
            onClose={() => setIsAddQuantityModalOpen(false)}
            onConfirm={handleConfirmAddQuantity}
            job={jobToAddQuantity}
            userPoints={userPoints}
            userBdtBalance={userBdtBalance}
        />
        <FilterModal
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            onApply={setSelectedCategories}
            currentSelection={selectedCategories}
        />
         <TipModal
            isOpen={isTipModalOpen}
            onClose={() => setIsTipModalOpen(false)}
            onConfirm={handleSendTip}
            submission={submissionToTip}
            job={jobForTipModal}
            userPoints={userPoints}
            userBdtBalance={userBdtBalance}
        />
        <AiAssistantModal
            isOpen={isAiAssistantModalOpen}
            onClose={() => setIsAiAssistantModalOpen(false)}
            onAddJob={handleAddJob as any}
            onEditJob={handleEditJob as any}
            onDeleteJob={handleConfirmDelete as any}
            onBoostJob={handleConfirmBoost as any}
            userPoints={userPoints}
            userBdtBalance={userBdtBalance}
            postedJobs={postedJobs}
            messages={aiMessages}
            setMessages={setAiMessages}
            chatSessionRef={aiChatSessionRef}
            aiLanguage={aiLanguage}
            onSetAiLanguage={setAiLanguage}
        />
        <AnnouncementModal
            isOpen={isAnnouncementModalOpen}
            onClose={handleCloseAnnouncementModal}
            announcement={latestAnnouncement}
        />
        <EditProfileModal
            isOpen={isEditProfileModalOpen}
            onClose={() => setIsEditProfileModalOpen(false)}
            onSave={handleSaveProfile}
            currentName={displayName}
            currentPhotoURL={user.photoURL}
        />
    </div>
  );
}