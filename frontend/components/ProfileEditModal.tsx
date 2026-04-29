'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2, Camera, User as UserIcon, AtSign, AlignLeft } from 'lucide-react';
import { User as UserType } from '@/lib/types';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { CldUploadWidget } from 'next-cloudinary';

interface ProfileEditModalProps {
  user: UserType;
  onClose: () => void;
}

export default function ProfileEditModal({ user, onClose }: ProfileEditModalProps) {
  const { updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user.name || '',
    username: user.username || '',
    bio: user.bio || '',
    avatar_url: user.avatar_url || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.patch('/auth/profile', formData);
      updateUser(res.data);
      setSuccess(true);
      setTimeout(() => { onClose(); }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const initials = formData.name
    ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 font-sans">
      {/* Cinematic Blur Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(10,10,10,0.8) 0%, rgba(0,0,0,0.95) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)'
        }}
      />

      {/* Main Glassmorphic Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          background: 'rgba(15, 15, 15, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 32,
          boxShadow: '0 40px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Subtle top inner glow */}
        <div style={{ position: 'absolute', top: 0, left: '20%', width: '60%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(245,173,61,0.4), transparent)' }} />

        {/* Header Actions */}
        <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', scrollbarWidth: 'none' }}>
          <form onSubmit={handleSubmit} style={{ padding: '40px 32px 32px', display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* Identity & Avatar Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, marginTop: 8 }}>
              <div style={{ position: 'relative' }}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  style={{
                    width: 100, height: 100, borderRadius: '50%', overflow: 'hidden',
                    background: 'linear-gradient(135deg, #1f1f1f, #0a0a0a)',
                    border: '2px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, fontWeight: 800, color: '#fff',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  }}
                >
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : initials}
                </motion.div>

                <CldUploadWidget
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                  onSuccess={(result: any) => {
                    if (result.info?.secure_url) {
                      setFormData({ ...formData, avatar_url: result.info.secure_url });
                    }
                  }}
                >
                  {({ open }) => (
                    <button
                      type="button"
                      onClick={() => open?.()}
                      style={{
                        position: 'absolute', bottom: -4, right: -4,
                        width: 34, height: 34, borderRadius: '50%',
                        background: '#f5ad3d', color: '#000',
                        border: '3px solid #111',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'transform 0.2s',
                        boxShadow: '0 4px 12px rgba(245,173,61,0.4)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Camera size={14} strokeWidth={2.5} />
                    </button>
                  )}
                </CldUploadWidget>
              </div>

              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>Identity</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 500 }}>Refine your presence</p>
              </div>
            </div>

            {/* Error State */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                    color: '#ef4444', fontSize: 13, fontWeight: 600, textAlign: 'center',
                    padding: '12px', borderRadius: '12px'
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              <InputField
                icon={UserIcon} label="Display Name" name="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                focused={focusedField === 'name'}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />

              <InputField
                icon={AtSign} label="Username" name="username"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                focused={focusedField === 'username'}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 4, color: focusedField === 'bio' ? '#f5ad3d' : 'rgba(255,255,255,0.4)', transition: 'color 0.2s' }}>
                  <AlignLeft size={14} />
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Bio</label>
                </div>
                <textarea
                  placeholder="Cinematic storyteller..."
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  onFocus={() => setFocusedField('bio')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    width: '100%', height: 90, padding: '16px', borderRadius: 16,
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${focusedField === 'bio' ? 'rgba(245,173,61,0.5)' : 'rgba(255,255,255,0.06)'}`,
                    color: '#fff', fontSize: 14, fontWeight: 500, outline: 'none', transition: 'all 0.3s',
                    resize: 'none',
                    boxShadow: focusedField === 'bio' ? '0 0 0 1px rgba(245,173,61,0.2)' : 'none'
                  }}
                />
              </div>
            </div>

            {/* Action Button */}
            <motion.button
              type="submit"
              disabled={loading || success}
              whileTap={{ scale: (loading || success) ? 1 : 0.98 }}
              style={{
                width: '100%', height: 56, borderRadius: 16,
                background: success ? '#f5ad3d' : '#fff',
                color: '#000',
                fontWeight: 800, fontSize: 15, border: 'none',
                cursor: (loading || success) ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'background 0.4s ease',
                boxShadow: success ? '0 10px 30px rgba(245,173,61,0.3)' : '0 10px 30px rgba(255,255,255,0.1)',
                marginTop: 8
              }}
            >
              {loading ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : success ? (
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={18} strokeWidth={3} /> Saved
                </motion.div>
              ) : (
                'Save Changes'
              )}
            </motion.button>

          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Sub-Component for Clean Inputs ─────────────────────────────────

function InputField({ icon: Icon, label, name, value, onChange, focused, onFocus, onBlur }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 4,
        color: focused ? '#f5ad3d' : 'rgba(255,255,255,0.4)',
        transition: 'color 0.2s'
      }}>
        <Icon size={14} />
        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</label>
      </div>
      <input
        type="text"
        name={name}
        placeholder={`Enter ${label.toLowerCase()}`}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          width: '100%', height: 52, padding: '0 16px', borderRadius: 16,
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${focused ? 'rgba(245,173,61,0.5)' : 'rgba(255,255,255,0.06)'}`,
          color: '#fff', fontSize: 14, fontWeight: 500, outline: 'none', transition: 'all 0.3s',
          boxShadow: focused ? '0 0 0 1px rgba(245,173,61,0.2)' : 'none'
        }}
      />
    </div>
  );
}