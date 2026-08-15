'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Check, KeyRound, Loader2, Mail, ShieldCheck, UserRound, X } from 'lucide-react';
import { authService } from '../services/supabase';

interface AccountSettingsProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onUserUpdated: (user: User) => void;
}

type Notice = { type: 'success' | 'error' | 'info'; message: string } | null;

export default function AccountSettings({ isOpen, user, onClose, onUserUpdated }: AccountSettingsProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busySection, setBusySection] = useState<'profile' | 'email' | 'password' | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setEmail(user.email || '');
    setDisplayName(user.user_metadata?.display_name || user.email?.split('@')[0] || '');
    setPassword('');
    setConfirmPassword('');
    setNotice(null);
    requestAnimationFrame(() => nameRef.current?.focus());
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && !busySection && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, busySection, onClose]);

  if (!isOpen) return null;

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setBusySection('profile'); setNotice(null);
    try {
      const updatedUser = await authService.updateDisplayName(user.id, displayName);
      onUserUpdated(updatedUser);
      setNotice({ type: 'success', message: 'Your display name has been updated.' });
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Unable to update your profile.' });
    } finally { setBusySection(null); }
  };

  const saveEmail = async (event: FormEvent) => {
    event.preventDefault();
    if (email.trim().toLowerCase() === user.email?.toLowerCase()) return;
    setBusySection('email'); setNotice(null);
    try {
      const updatedUser = await authService.updateEmail(email);
      onUserUpdated(updatedUser);
      setNotice({ type: 'info', message: 'Check your inbox to confirm the new email address. Your current address remains active until confirmation.' });
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Unable to update your email.' });
    } finally { setBusySection(null); }
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) { setNotice({ type: 'error', message: 'The passwords do not match.' }); return; }
    setBusySection('password'); setNotice(null);
    try {
      const updatedUser = await authService.updatePassword(password);
      onUserUpdated(updatedUser);
      setPassword(''); setConfirmPassword('');
      setNotice({ type: 'success', message: 'Your password has been updated.' });
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Unable to update your password.' });
    } finally { setBusySection(null); }
  };

  const fieldClass = 'search-input w-full px-4 py-3';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-950/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="account-settings-title">
      <div className="account-dialog animate-scale-in">
        <header className="account-dialog-header">
          <div><p className="section-kicker">Personal settings</p><h2 id="account-settings-title">Your account</h2><p>Update how you appear and keep your sign-in secure.</p></div>
          <button onClick={onClose} disabled={!!busySection} className="editor-icon-button" aria-label="Close account settings"><X className="w-5 h-5" /></button>
        </header>

        {notice && <div className={`account-notice ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.type === 'success' ? <Check /> : <ShieldCheck />}{notice.message}</div>}

        <div className="account-sections">
          <form onSubmit={saveProfile} className="account-section">
            <div className="account-section-title"><UserRound /><div><h3>Profile</h3><p>Shown to members of your family groups.</p></div></div>
            <label htmlFor="account-name">Display name</label>
            <input ref={nameRef} id="account-name" value={displayName} onChange={event => setDisplayName(event.target.value)} required maxLength={80} autoComplete="name" className={fieldClass} />
            <button disabled={!!busySection || displayName.trim() === (user.user_metadata?.display_name || user.email?.split('@')[0])} className="primary-button account-save">{busySection === 'profile' ? <Loader2 className="animate-spin" /> : 'Save profile'}</button>
          </form>

          <form onSubmit={saveEmail} className="account-section">
            <div className="account-section-title"><Mail /><div><h3>Email address</h3><p>Used to sign in and receive account messages.</p></div></div>
            <label htmlFor="account-email">Email</label>
            <input id="account-email" type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" className={fieldClass} />
            <button disabled={!!busySection || email.trim().toLowerCase() === user.email?.toLowerCase()} className="primary-button account-save">{busySection === 'email' ? <Loader2 className="animate-spin" /> : 'Update email'}</button>
          </form>

          <form onSubmit={savePassword} className="account-section">
            <div className="account-section-title"><KeyRound /><div><h3>Password</h3><p>Use at least 8 characters.</p></div></div>
            <label htmlFor="account-password">New password</label>
            <input id="account-password" type="password" value={password} onChange={event => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" className={fieldClass} />
            <label htmlFor="account-password-confirm">Confirm new password</label>
            <input id="account-password-confirm" type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required minLength={8} autoComplete="new-password" className={fieldClass} />
            <button disabled={!!busySection || password.length < 8 || confirmPassword.length < 8} className="primary-button account-save">{busySection === 'password' ? <Loader2 className="animate-spin" /> : 'Update password'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
