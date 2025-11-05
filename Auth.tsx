import React, { useState, FormEvent } from 'react';
import { auth } from '../firebase';
// FIX: The methods are now on the auth object, so modular imports are not needed and were causing errors.
// import { 
//   createUserWithEmailAndPassword, 
//   signInWithEmailAndPassword,
//   sendPasswordResetEmail
// } from "firebase/auth";

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!email.toLowerCase().endsWith('@gmail.com')) {
            setError('Please use a valid Gmail address (e.g., yourname@gmail.com).');
            return;
        }

        if (isLogin) {
            try {
                // FIX: Use v8 namespaced API.
                await auth.signInWithEmailAndPassword(email, password);
            } catch (err: any) {
                // Handle both standard Firebase SDK errors and potential REST API error formats.
                const errorString = JSON.stringify(err);
                if (
                    err.code === 'auth/invalid-credential' ||
                    err.code === 'auth/wrong-password' ||
                    err.code === 'auth/user-not-found' ||
                    errorString.includes('INVALID_LOGIN_CREDENTIALS')
                ) {
                    setError('Your email and password do not match. Please try again.');
                } else {
                    setError('An error occurred during login. Please try again.');
                    console.error("Login Error:", err);
                }
            }
        } else {
            if (referralCode.trim()) {
                sessionStorage.setItem('referralCode', referralCode.trim().toUpperCase());
            }
            try {
                // FIX: Use v8 namespaced API.
                await auth.createUserWithEmailAndPassword(email, password);
            } catch (err: any) {
                sessionStorage.removeItem('referralCode'); // Clear storage on failure
                // Provide specific feedback for common registration errors.
                if (err.code === 'auth/email-already-in-use') {
                    setError('An account with this email already exists. Please login instead.');
                } else if (err.code === 'auth/weak-password') {
                    setError('Your password is too weak. It should be at least 6 characters long.');
                } else {
                    setError('An error occurred during sign up. Please try again.');
                    console.error("Signup Error:", err);
                }
            }
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
            setError('Please enter your email to reset password.');
            return;
        }
        if (!email.toLowerCase().endsWith('@gmail.com')) {
            setError('Please use a valid Gmail address to reset your password.');
            return;
        }
        try {
            // FIX: Use v8 namespaced API.
            await auth.sendPasswordResetEmail(email);
            setMessage('Password reset email sent! Please check your inbox.');
            setError('');
        } catch (err: any) {
            // To prevent attackers from checking which emails are registered,
            // we show a generic success message even if the user is not found.
            if (err.code === 'auth/user-not-found') {
                 setMessage('Password reset email sent! Please check your inbox.');
            } else {
                setError('Failed to send password reset email. Please try again.');
                console.error("Password Reset Error:", err);
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-2xl p-8 border border-gray-200">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-wider">
                        <span className="text-sky-600">Job</span>
                        <span className="text-slate-900">Della</span>
                    </h1>
                    <p className="text-slate-500 mt-2">{isLogin ? 'Welcome back! Please login.' : 'Create an account to get started.'}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-2">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-gray-100 border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password"className="block text-sm font-medium text-slate-600 mb-2">Password</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={isPasswordVisible ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-100 border border-gray-300 rounded-md p-3 pr-10 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
                                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                            >
                                {isPasswordVisible ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m0 0l-3.59-3.59m0 0l-3.59 3.59" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {!isLogin && (
                        <div>
                            <label htmlFor="referralCode" className="block text-sm font-medium text-slate-600 mb-2">Referral Code (Optional)</label>
                            <input
                                id="referralCode"
                                type="text"
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                placeholder="e.g., ABCDE"
                                className="w-full bg-gray-100 border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                maxLength={5}
                            />
                            <div className="text-xs text-slate-500 mt-2 space-y-1">
                                <p>Use a code to get <strong>5 JD TOKENS</strong>. The code owner gets <strong>4 JD TOKENS</strong>.</p>
                                <p>The referrer will also receive a <strong>5% BDT bonus</strong> on your deposits.</p>
                            </div>
                        </div>
                    )}


                    {error && <p className="text-red-700 text-sm text-center bg-red-100 p-3 rounded-md">{error}</p>}
                    {message && <p className="text-green-700 text-sm text-center bg-green-100 p-3 rounded-md">{message}</p>}

                    <div>
                        <button
                            type="submit"
                            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-full transition-colors"
                        >
                            {isLogin ? 'Login' : 'Create Account'}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-6">
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }} className="text-sm text-sky-600 hover:underline">
                        {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
                    </button>
                </div>
                 <div className="text-center mt-4">
                    <button onClick={handlePasswordReset} className="text-sm text-slate-500 hover:underline">
                        Forgot Password?
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;