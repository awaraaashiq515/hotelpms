import React, { useState, useRef } from 'react';
import { Upload, FileImage, Sparkles, Loader2 } from 'lucide-react';

export default function UploadZone({ onScanComplete }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPG, PNG, or WEBP)');
      return;
    }
    setError('');
    setSelectedFile(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleScanMenu = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/api/scan-menu', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Scanning failed. Make sure your server is online.');
      }

      const data = await response.json();
      onScanComplete(data);
    } catch (err) {
      setError(err.message || 'Something went wrong during extraction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`glass-panel cursor-pointer rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center transition-all duration-300 ${
          dragActive ? 'border-indigo-500 bg-indigo-500/10 scale-102' : 'border-gray-700 hover:border-gray-500'
        }`}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept="image/*"
          onChange={handleFileChange}
        />
        
        <div className="p-4 bg-indigo-600/10 rounded-full text-indigo-400 mb-4">
          <Upload className="h-8 w-8" />
        </div>
        
        <p className="text-lg font-medium text-white mb-2">
          Drag & drop your menu image here, or <span className="text-indigo-400 font-semibold underline">browse</span>
        </p>
        <p className="text-sm text-gray-400">Supports JPG, PNG, WEBP files up to 10MB</p>
        
        {selectedFile && (
          <div className="mt-6 flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10" onClick={(e) => e.stopPropagation()}>
            <FileImage className="h-5 w-5 text-indigo-400" />
            <div className="text-left">
              <p className="text-sm font-medium text-white truncate max-w-xs">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-center text-sm">
          {error}
        </div>
      )}

      {selectedFile && (
        <button
          onClick={handleScanMenu}
          disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-rose-500 text-white font-semibold py-4 rounded-xl shadow-lg hover:from-indigo-600 hover:to-rose-600 transition-all duration-300 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Scanning Menu with Vision AI...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Extract Menu items
            </>
          )}
        </button>
      )}
    </div>
  );
}
