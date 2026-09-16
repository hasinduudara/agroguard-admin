import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import Login from './components/Login';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // State to hold the selected PDF file
  const [file, setFile] = useState<File | null>(null);
  
  // State to show loading status during the upload
  const [isUploading, setIsUploading] = useState(false);
  
  // State to show success or error messages
  const [message, setMessage] = useState('');

  useEffect(() => {
    // 1. Fetch initial session on app mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Function to handle the file selection from the input
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setMessage('');
    } else {
      setFile(null);
      setMessage('Please select a valid PDF file.');
    }
  }

  // Function to send the selected file to the FastAPI backend (with Supabase JWT token)
  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    
    if (!file) {
      setMessage('Please select a file first.');
      return;
    }

    if (!session) {
      setMessage('Error: You must be logged in to upload files.');
      return;
    }

    setIsUploading(true);
    setMessage('');

    // Prepare the file data to be sent as FormData
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/admin/upload-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Success: ${data.message} (${data.chunks_created} chunks created)`);
        setFile(null); // Clear the file input after successful upload
      } else {
        setMessage(`Error: ${data.detail || 'Upload failed'}`);
      }
    } catch {
      setMessage('Network error. Make sure the backend server is running.');
    } finally {
      setIsUploading(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 1. Loading screen while checking authentication state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium animate-pulse">Verifying Admin Session...</p>
        </div>
      </div>
    );
  }

  // 2. Strict Protection: Render ONLY Login if not authenticated
  if (!session) {
    return <Login />;
  }

  // 3. Render Protected Admin Dashboard when authenticated
  const userEmail = session.user?.email || 'Admin User';
  const userAvatar = session.user?.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Admin Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              AG
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide">AgroGuard AI</h1>
              <p className="text-xs text-slate-400">Admin Control Panel</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-full">
              {userAvatar ? (
                <img src={userAvatar} alt="User Avatar" className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  {userEmail.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs text-slate-300 font-medium max-w-[180px] truncate">{userEmail}</span>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-800 hover:bg-red-500/10 hover:border-red-500/30 text-slate-300 hover:text-red-400 border border-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-8 backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Knowledge Base Management</h2>
            <p className="text-slate-400 text-sm">
              Upload agricultural PDF guidelines to process embeddings and update the AI vector database.
            </p>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-8 text-center transition-all bg-slate-950/40">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="w-full text-sm text-slate-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 cursor-pointer"
              />
              <p className="mt-3 text-xs text-slate-500">Only PDF files are supported</p>
            </div>

            <button
              type="submit"
              disabled={!file || isUploading}
              className={`w-full py-4 px-6 rounded-2xl text-white font-bold text-base transition-all shadow-lg ${
                !file || isUploading 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50' 
                  : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-900/30 cursor-pointer'
              }`}
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading & Generating Embeddings...
                </span>
              ) : (
                'Upload PDF Document'
              )}
            </button>
          </form>

          {/* Feedback message display */}
          {message && (
            <div className={`mt-6 p-4 rounded-xl text-center text-sm font-medium border ${
              message.includes('Success') 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              {message}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}