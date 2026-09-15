import React, { useState } from 'react';

export default function App() {
  // State to hold the selected PDF file
  const [file, setFile] = useState<File | null>(null);
  
  // State to show loading status during the upload
  const [isUploading, setIsUploading] = useState(false);
  
  // State to show success or error messages
  const [message, setMessage] = useState('');

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

  // Function to send the selected file to the FastAPI backend
  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    
    if (!file) {
      setMessage('Please select a file first.');
      return;
    }

    setIsUploading(true);
    setMessage('');

    // Prepare the file data to be sent as FormData
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Replace localhost with your backend IP if running on a different device
      const response = await fetch('http://localhost:8000/api/admin/upload-pdf', {
        method: 'POST',
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700 mb-2">AgroGuard Admin</h1>
          <p className="text-gray-500">Upload agricultural PDF documents to update the AI Knowledge Base.</p>
        </div>

        <form onSubmit={handleUpload} className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-500 transition-colors">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={!file || isUploading}
            className={`w-full py-3 px-4 rounded-xl text-white font-bold text-lg transition-colors ${
              !file || isUploading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 shadow-md'
            }`}
          >
            {isUploading ? 'Uploading & Processing...' : 'Upload PDF Document'}
          </button>
        </form>

        {/* Display feedback messages to the user */}
        {message && (
          <div className={`mt-6 p-4 rounded-lg text-center font-medium ${
            message.includes('Success') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

      </div>
    </div>
  );
}