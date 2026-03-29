import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getAvatarUrl } from '../utils/helpers';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const MAX_BIO = 250;

const ProfileEditor = ({ isOpen, onClose }) => {
  const { user, profile, updateProfile } = useAuth();

  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }
  const [hasChanges, setHasChanges] = useState(false);

  const fileInputRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      setBio(profile.bio || '');
      setAvatarPreview(null);
      setAvatarFile(null);
      setHasChanges(false);
      setToast(null);
    }
  }, [isOpen, profile]);

  // Track changes
  useEffect(() => {
    const bioChanged = bio !== (profile.bio || '');
    const avatarChanged = avatarFile !== null;
    setHasChanges(bioChanged || avatarChanged);
  }, [bio, avatarFile, profile]);

  // Auto-dismiss toasts
  useEffect(() => {
    if (toast) {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);
    }
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [toast]);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast('error', 'Invalid file type. Use JPG, PNG, GIF, or WebP.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Image must be under 5 MB.');
      return;
    }

    setAvatarFile(file);

    // Create local preview
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleBioChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_BIO) {
      setBio(value);
    }
  };

  const handleSave = async () => {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);
    try {
      const formData = new FormData();

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      // Always send bio so user can clear it
      formData.append('bio', bio);

      await updateProfile(formData);
      showToast('success', 'Profile updated successfully!');
      setAvatarFile(null);
      setAvatarPreview(null);
      setHasChanges(false);
      onClose();

    } catch (error) {
      showToast('error', error.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isSaving) {
      onClose();
    }
  };

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  // Determine the avatar display
  const currentAvatarUrl = avatarPreview
    ? avatarPreview
    : getAvatarUrl(profile.avatar_url, BACKEND_URL);

  const charPercent = (bio.length / MAX_BIO) * 100;
  const charWarning = bio.length >= MAX_BIO * 0.9;
  const charDanger = bio.length >= MAX_BIO;

  return (
    <>
      {/* Modal Overlay */}
      <div className="profile-modal-overlay" onClick={handleOverlayClick}>
        <div className="profile-modal glass-panel fade-in">
          {/* Close Button */}
          <button
            className="profile-close-btn"
            onClick={onClose}
            disabled={isSaving}
            title="Close"
            id="profile-close-btn"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Header */}
          <div className="profile-modal-header">
            <h2>Edit Profile</h2>
            <p>Update your photo and bio</p>
          </div>

          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div
              className="profile-avatar-wrapper"
              onClick={handleAvatarClick}
              title="Click to change photo"
              id="profile-avatar-upload"
            >
              {currentAvatarUrl ? (
                <img
                  src={currentAvatarUrl}
                  alt="Profile"
                  className="profile-avatar-img"
                />
              ) : (
                <div className="profile-avatar-fallback">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="profile-avatar-overlay">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <span>Change Photo</span>
              </div>
              {/* Progress ring for visual flair */}
              <svg className="profile-avatar-ring" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="56"
                  fill="none"
                  stroke="url(#avatarGradient)"
                  strokeWidth="3"
                  strokeDasharray="352"
                  strokeDashoffset="0"
                />
                <defs>
                  <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="profile-file-input"
            />
            <span className="profile-avatar-hint">
              JPG, PNG, GIF or WebP · Max 5 MB
            </span>
          </div>

          {/* Bio Section */}
          <div className="profile-bio-section">
            <label htmlFor="profile-bio-input" className="profile-bio-label">
              Bio
            </label>
            <div className="profile-bio-wrapper">
              <textarea
                id="profile-bio-input"
                className="profile-bio-input"
                value={bio}
                onChange={handleBioChange}
                placeholder="Tell everyone a bit about yourself..."
                rows={4}
                maxLength={MAX_BIO}
              />
              <div className={`profile-char-counter ${charWarning ? 'warning' : ''} ${charDanger ? 'danger' : ''}`}>
                <div className="profile-char-bar">
                  <div
                    className="profile-char-fill"
                    style={{ width: `${charPercent}%` }}
                  />
                </div>
                <span>{bio.length} / {MAX_BIO}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="profile-actions">
            <button
              className="profile-cancel-btn"
              onClick={onClose}
              disabled={isSaving}
              id="profile-cancel-btn"
            >
              Cancel
            </button>
            <button
              className="profile-save-btn primary-btn"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              id="profile-save-btn"
            >
              {isSaving ? (
                <>
                  <div className="btn-spinner"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type} fade-in`} id="profile-toast">
          <div className="toast-icon">
            {toast.type === 'success' ? (
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            )}
          </div>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}
    </>
  );
};

export default ProfileEditor;
