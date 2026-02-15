/**
 * Admin Login Component
 * =====================
 * Authentication form for admin portal
 */

import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, X, Check, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { authAPI } from '../../../services/api';
import { AdminUser, LoginAttempts } from '../shared/types';
import { MAX_LOGIN_ATTEMPTS, RATE_LIMIT_COOLDOWN_MS } from '../shared/constants';
import { getLoginAttempts, saveLoginAttempts, clearLoginAttempts } from '../shared/utils';

interface AdminLoginProps {
  onLogin: (user: AdminUser, rememberMe: boolean) => void;
  onClose: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = memo(({ onLogin, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Check rate limiting on mount
  useEffect(() => {
    const attempts = getLoginAttempts();
    if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
      const remaining = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
      setCooldownSeconds(remaining);
    }
  }, []);

  // Countdown timer for cooldown
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(cooldownSeconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if currently rate limited
    const attempts = getLoginAttempts();
    if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
      const remaining = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
      setCooldownSeconds(remaining);
      setError(`Trop de tentatives. Reessayez dans ${remaining}s`);
      return;
    }

    setIsLoading(true);

    try {
      // Authenticate via backend API
      const { user } = await authAPI.login(email, password);
      clearLoginAttempts();
      onLogin({
        email: user.email,
        name: user.fullName,
        role: user.role.toLowerCase() as 'admin' | 'agent',
        lastLogin: Date.now()
      }, rememberMe);
    } catch (error: any) {
      // Increment failed attempts
      const newAttempts: LoginAttempts = {
        count: attempts.count + 1,
        lastAttempt: Date.now(),
        lockedUntil: null
      };

      if (newAttempts.count >= MAX_LOGIN_ATTEMPTS) {
        newAttempts.lockedUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
        setCooldownSeconds(Math.ceil(RATE_LIMIT_COOLDOWN_MS / 1000));
        setError(`Trop de tentatives. Reessayez dans ${Math.ceil(RATE_LIMIT_COOLDOWN_MS / 1000)}s`);
      } else {
        const remaining = MAX_LOGIN_ATTEMPTS - newAttempts.count;
        setError(error.message || `Email ou mot de passe incorrect (${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''})`);
      }

      saveLoginAttempts(newAttempts);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md"
      >
        {/* Glassmorphism card */}
        <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl shadow-black/50">
          {/* Gradient glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-brand-gold/20 to-cyan-500/20 rounded-3xl blur-xl opacity-50" />

          <div className="relative">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>

            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-gold to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-gold/30 mb-4">
                <Lock size={28} className="text-black" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white">Admin Portal</h2>
              <p className="text-white/50 text-sm mt-1">Connectez-vous pour accéder au backoffice</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" aria-hidden="true" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@vestate.ai"
                    className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all"
                    required
                    aria-label="Adresse email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" aria-hidden="true" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    className="w-full pl-12 pr-12 py-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all"
                    required
                    aria-label="Mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 border border-white/20 rounded-md bg-white/[0.03] peer-checked:bg-brand-gold peer-checked:border-brand-gold transition-all flex items-center justify-center">
                    {rememberMe && <Check size={14} className="text-black" />}
                  </div>
                </div>
                <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                  Se souvenir de moi
                </span>
              </label>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                    role="alert"
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || cooldownSeconds > 0}
                className="w-full py-4 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold rounded-xl shadow-lg shadow-brand-gold/25 hover:shadow-brand-gold/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {cooldownSeconds > 0 ? (
                  <>
                    <Clock size={18} />
                    Patientez {cooldownSeconds}s
                  </>
                ) : isLoading ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <>
                    <Lock size={18} />
                    Se connecter
                  </>
                )}
              </button>
            </form>

            {/* Hint */}
            <div className="mt-6 p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
              <p className="text-[11px] text-white/40 text-center">
                Contactez l'administrateur pour obtenir vos identifiants
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

AdminLogin.displayName = 'AdminLogin';

export default AdminLogin;
