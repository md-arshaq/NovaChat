import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { getAvatarUrl } from '../utils/helpers';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const ProfileModal = ({ username, isOpen, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && username) {
      const fetchProfile = async () => {
        setLoading(true);
        setError('');
        try {
          const res = await api.get(`/api/users/profile/${username}`);
          if (res.success) {
            setProfile(res.profile);
          } else {
            setError(res.message || 'Failed to load profile.');
          }
        } catch (err) {
          setError(err.message || 'Error loading profile.');
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    }
  }, [isOpen, username]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="profile-modal-overlay fade-in" onClick={handleOverlayClick}>
      <div className="profile-modal glass-panel">
        <button className="profile-close-btn" onClick={onClose} title="Close">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {loading ? (
          <div className="loading-state" style={{ padding: '40px 0' }}>
            <div className="spinner"></div>
            <p>Loading profile...</p>
          </div>
        ) : error ? (
          <div className="error-state" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--error-color)' }}>
            <p>{error}</p>
          </div>
        ) : profile ? (
          <div className="profile-modal-content">
            <div className="profile-modal-header view-mode">
              <div className="profile-avatar-wrapper view-mode">
                {profile.avatar_url ? (
                  <img src={getAvatarUrl(profile.avatar_url, BACKEND_URL)} alt={profile.username} className="profile-avatar-img" />
                ) : (
                  <div className="profile-avatar-fallback">
                    {profile.username?.[0]?.toUpperCase()}
                  </div>
                )}
                {profile.online && <span className="status-dot online modal-status"></span>}
              </div>
              <h2 className="profile-modal-username">{profile.username}</h2>
              <p className="profile-modal-joined">Joined {formatDate(profile.created_at)}</p>
            </div>

            <div className="profile-bio-section view-mode">
              <h3 className="profile-bio-label">About</h3>
              <div className="profile-bio-text">
                {profile.bio && profile.bio.trim() !== '' ? (
                  <p>{profile.bio}</p>
                ) : (
                  <p className="empty-bio">No bio provided yet.</p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProfileModal;
