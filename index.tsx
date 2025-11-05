import React from 'react';
import ReactDOM from 'react-dom/client';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);

// Render a loading state initially. This will be replaced quickly by the app.
root.render(
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-sky-600 mx-auto"></div>
            <p className="text-slate-500 mt-4 text-lg">Initializing...</p>
        </div>
    </div>
);

// The main application startup logic.
const startApp = () => {
    // Dynamically import App and ToastProvider now that Firebase is guaranteed to be ready.
    Promise.all([
        import('./App'),
        import('./components/Toasts'),
    ]).then(([{ default: App }, { ToastProvider }]) => {
        root.render(
            <React.StrictMode>
                <ToastProvider>
                    <App />
                </ToastProvider>
            </React.StrictMode>
        );
    }).catch(err => {
        console.error("Failed to load the app:", err);
        root.render(
            <div style={{ padding: '20px', textAlign: 'center', color: 'red', fontFamily: 'sans-serif' }}>
                <h1>Application Error</h1>
                <p>Failed to load application components. Please check the console for details.</p>
            </div>
        );
    });
};

// Wait for the explicit signal from index.html that Firebase is ready.
// This prevents a race condition where the app tries to use Firebase before it's initialized.
if ((window as any).firebaseReady) {
    startApp();
} else {
    document.addEventListener('firebase-ready', startApp);
}
