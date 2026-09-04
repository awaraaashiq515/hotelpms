'use client';

import React, { useState, useRef } from 'react';
import { Camera, Loader2, Trash2, Check, User } from 'lucide-react';
import { toast } from 'sonner';

interface ProfilePhotoUploaderProps {
  currentPhotoUrl?: string | null;
  name: string;
  userType: 'guest' | 'staff' | 'housekeeper';
  userId?: string;
  token?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onPhotoUploaded?: (newUrl: string | null) => void;
  className?: string;
}

export default function ProfilePhotoUploader({
  currentPhotoUrl,
  name,
  userType,
  userId,
  token,
  size = 'lg',
  onPhotoUploaded,
  className = '',
}: ProfilePhotoUploaderProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state if prop changes
  React.useEffect(() => {
    setPhotoUrl(currentPhotoUrl || null);
  }, [currentPhotoUrl]);

  const sizeStyles = {
    sm: { container: 'w-12 h-12', text: 'text-sm', badge: 'w-5 h-5 -bottom-0.5 -right-0.5', icon: 10 },
    md: { container: 'w-16 h-16', text: 'text-lg', badge: 'w-6 h-6 -bottom-1 -right-1', icon: 12 },
    lg: { container: 'w-24 h-24', text: 'text-2xl', badge: 'w-8 h-8 bottom-0 right-0', icon: 14 },
    xl: { container: 'w-32 h-32', text: 'text-4xl', badge: 'w-9 h-9 bottom-1 right-1', icon: 16 },
  }[size];

  const initials = name
    ?.trim()
    .split(/\s+/)
    .map(n => n[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2) || '?';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image size must be under 8MB');
      return;
    }

    // Instant local preview
    const previewUrl = URL.createObjectURL(file);
    setPhotoUrl(previewUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userType', userType);
      if (userId) formData.append('id', userId);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/profile/photo', {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.avatarUrl) {
        setPhotoUrl(data.avatarUrl);
        toast.success('Profile photo updated successfully!');
        if (onPhotoUploaded) onPhotoUploaded(data.avatarUrl);
      } else {
        toast.error(data.message || 'Failed to upload photo');
        setPhotoUrl(currentPhotoUrl || null);
      }
    } catch {
      toast.error('Network error during photo upload');
      setPhotoUrl(currentPhotoUrl || null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Remove profile photo?')) return;

    setUploading(true);
    try {
      const params = new URLSearchParams();
      params.set('userType', userType);
      if (userId) params.set('id', userId);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/profile/photo?${params.toString()}`, {
        method: 'DELETE',
        headers,
      });

      const data = await res.json();
      if (data.success) {
        setPhotoUrl(null);
        toast.success('Profile photo removed');
        if (onPhotoUploaded) onPhotoUploaded(null);
      }
    } catch {
      toast.error('Could not remove photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Avatar Container */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative ${sizeStyles.container} rounded-2xl overflow-hidden cursor-pointer group shadow-xl border-2 border-white/20 transition-all hover:scale-105 active:scale-95`}
        title="Click to upload profile photo"
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-violet-600 to-emerald-500 flex items-center justify-center text-white font-black">
            <span className={sizeStyles.text}>{initials}</span>
          </div>
        )}

        {/* Hover / Uploading Overlay */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {uploading ? (
            <Loader2 size={sizeStyles.icon * 1.5} className="text-white animate-spin" />
          ) : (
            <Camera size={sizeStyles.icon * 1.3} className="text-white drop-shadow" />
          )}
        </div>
      </div>

      {/* Camera Trigger Badge */}
      <button
        type="button"
        onClick={() => !uploading && fileInputRef.current?.click()}
        disabled={uploading}
        className={`absolute ${sizeStyles.badge} rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg border-2 border-[#090d16] transition-all hover:scale-110 active:scale-95`}
        title="Change photo"
      >
        <Camera size={sizeStyles.icon} />
      </button>

      {/* Remove Button (if photo exists) */}
      {photoUrl && !uploading && (
        <button
          type="button"
          onClick={handleRemovePhoto}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow border border-white/30 text-[10px] transition-all hover:scale-110"
          title="Delete photo"
        >
          <Trash2 size={10} />
        </button>
      )}
    </div>
  );
}
