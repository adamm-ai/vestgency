/**
 * Admin Settings Component
 * ========================
 * Complete settings page for the AdminPortal
 * Features: Profile, Security, Notifications, Display, CRM, Danger Zone
 */

import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Camera, Save, Lock, Shield, Key,
  Smartphone, Bell, MessageSquare, Clock, Globe, Calendar,
  Moon, Sun, Palette, Monitor, Target, Zap, AlertTriangle,
  Download, Trash2, LogOut, X, Check, ChevronDown, Eye, EyeOff,
  Settings as SettingsIcon, Activity, Sliders, AlertCircle
} from 'lucide-react';
import { AdminUser, exportToCSV } from './shared';

// ============================================================================
// TYPES
// ============================================================================

interface SettingsProps {
  user: AdminUser;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  onLogout: () => void;
}

interface ProfileFormData {
  fullName: string;
  email: string;
  phone: string;
  avatar: string | null;
}

interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  digestFrequency: 'instant' | 'daily' | 'weekly';
}

interface DisplaySettings {
  theme: 'dark' | 'light' | 'system';
  language: 'FR' | 'EN' | 'AR';
  timezone: string;
  dateFormat: string;
}

interface CRMSettingsData {
  autoAssignment: boolean;
  budgetWeight: number;
  urgencyWeight: number;
  engagementWeight: number;
  defaultLeadStatus: string;
  defaultUrgency: string;
}

interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActive: Date;
  current: boolean;
}

type SettingsTab = 'profile' | 'security' | 'notifications' | 'display' | 'crm' | 'danger';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Toggle Switch Component
const Toggle: React.FC<{
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}> = memo(({ enabled, onChange, disabled = false }) => (
  <button
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
      enabled ? 'bg-brand-gold' : 'bg-white/20'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
  >
    <motion.div
      initial={false}
      animate={{ x: enabled ? 24 : 4 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
    />
  </button>
));

Toggle.displayName = 'Toggle';

// Card Component
const SettingsCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 ${className}`}
  >
    {children}
  </motion.div>
);

// Section Header
const SectionHeader: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
}> = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-4 mb-6">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
      <Icon size={20} className="text-brand-gold" />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-white/50">{description}</p>
    </div>
  </div>
);

// Input Component
const SettingsInput: React.FC<{
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ElementType;
  disabled?: boolean;
  rightElement?: React.ReactNode;
}> = memo(({ label, type = 'text', value, onChange, placeholder, icon: Icon, disabled, rightElement }) => (
  <div>
    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full ${Icon ? 'pl-12' : 'pl-4'} ${rightElement ? 'pr-12' : 'pr-4'} py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
      />
      {rightElement && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
  </div>
));

SettingsInput.displayName = 'SettingsInput';

// Select Component
const SettingsSelect: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ElementType;
}> = memo(({ label, value, onChange, options, icon: Icon }) => (
  <div>
    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-10 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:border-brand-gold/50 outline-none transition-all appearance-none cursor-pointer`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-gray-900 text-white">
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
    </div>
  </div>
));

SettingsSelect.displayName = 'SettingsSelect';

// Slider Component
const SettingsSlider: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}> = memo(({ label, value, onChange, min = 0, max = 100, suffix = '%' }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <label className="text-sm text-white/80">{label}</label>
      <span className="text-sm font-medium text-brand-gold">{value}{suffix}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-brand-gold"
      style={{
        background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${value}%, rgba(255,255,255,0.1) ${value}%, rgba(255,255,255,0.1) 100%)`
      }}
    />
  </div>
));

SettingsSlider.displayName = 'SettingsSlider';

// Delete Confirmation Modal
const DeleteConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-gradient-to-br from-red-950/90 to-gray-950/90 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 shadow-2xl"
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Supprimer votre compte ?</h3>
            <p className="text-white/60 text-sm mb-6">
              Cette action est irreversible. Toutes vos donnees seront definitivement supprimees.
            </p>
            <div className="flex items-center gap-3 justify-center">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={onConfirm}
                className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all"
              >
                Supprimer definitivement
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================================================
// MAIN SETTINGS COMPONENT
// ============================================================================

const Settings: React.FC<SettingsProps> = memo(({ user, darkMode, setDarkMode, onLogout }) => {
  // Active tab state
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile state
  const [profileData, setProfileData] = useState<ProfileFormData>({
    fullName: user.name,
    email: user.email,
    phone: '',
    avatar: null,
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Security state
  const [securityData, setSecurityData] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [activeSessions] = useState<ActiveSession[]>([
    { id: '1', device: 'Chrome - MacOS', location: 'Casablanca, MA', lastActive: new Date(), current: true },
    { id: '2', device: 'Safari - iPhone', location: 'Rabat, MA', lastActive: new Date(Date.now() - 3600000), current: false },
    { id: '3', device: 'Firefox - Windows', location: 'Marrakech, MA', lastActive: new Date(Date.now() - 86400000), current: false },
  ]);

  // Notification state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    digestFrequency: 'daily',
  });

  // Display state
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    theme: darkMode ? 'dark' : 'light',
    language: 'FR',
    timezone: 'Africa/Casablanca',
    dateFormat: 'DD/MM/YYYY',
  });

  // CRM state
  const [crmSettings, setCrmSettings] = useState<CRMSettingsData>({
    autoAssignment: true,
    budgetWeight: 30,
    urgencyWeight: 40,
    engagementWeight: 30,
    defaultLeadStatus: 'new',
    defaultUrgency: 'medium',
  });

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Handlers
  const handleSaveProfile = useCallback(async () => {
    setProfileSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setProfileSaving(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  }, []);

  const handleChangePassword = useCallback(async () => {
    setPasswordError('');

    if (!securityData.currentPassword) {
      setPasswordError('Veuillez entrer votre mot de passe actuel');
      return;
    }
    if (securityData.newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caracteres');
      return;
    }
    if (securityData.newPassword !== securityData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSecurityData({ ...securityData, currentPassword: '', newPassword: '', confirmPassword: '' });
    alert('Mot de passe modifie avec succes');
  }, [securityData]);

  const handleLogoutAllSessions = useCallback(() => {
    if (confirm('Voulez-vous vraiment deconnecter toutes les sessions ?')) {
      // Simulate API call
      alert('Toutes les sessions ont ete deconnectees');
    }
  }, []);

  const handleExportData = useCallback(() => {
    const userData = {
      profile: profileData,
      notifications: notificationSettings,
      display: displaySettings,
      crm: crmSettings,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `athome_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [profileData, notificationSettings, displaySettings, crmSettings]);

  const handleDeleteAccount = useCallback(() => {
    setShowDeleteModal(false);
    // In production, this would call the API to delete the account
    alert('Compte supprime (simulation)');
    onLogout();
  }, [onLogout]);

  const handleThemeChange = useCallback((theme: 'dark' | 'light' | 'system') => {
    setDisplaySettings({ ...displaySettings, theme });
    if (theme === 'dark') {
      setDarkMode(true);
    } else if (theme === 'light') {
      setDarkMode(false);
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, [displaySettings, setDarkMode]);

  // Tabs configuration
  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Securite', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'display', label: 'Affichage', icon: Palette },
    { id: 'crm', label: 'CRM', icon: Target },
    { id: 'danger', label: 'Zone Danger', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Parametres</h2>
        <p className="text-white/50 text-sm">Gerez vos preferences et votre compte</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-xl p-2 space-y-1 lg:sticky lg:top-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? tab.id === 'danger'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-brand-gold/20 text-brand-gold'
                    : tab.id === 'danger'
                      ? 'text-red-400/60 hover:text-red-400 hover:bg-red-500/10'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <tab.icon size={18} />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <SettingsCard key="profile">
                <SectionHeader
                  icon={User}
                  title="Profil Utilisateur"
                  description="Gerez vos informations personnelles"
                />

                {/* Avatar Section */}
                <div className="flex items-center gap-6 p-4 bg-white/[0.02] rounded-xl border border-white/[0.06] mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-gold to-cyan-400 flex items-center justify-center text-black font-bold text-2xl overflow-hidden">
                      {profileData.avatar ? (
                        <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        profileData.fullName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-gold text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <Camera size={16} />
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white text-lg">{profileData.fullName}</p>
                    <p className="text-sm text-white/50">{user.role === 'admin' ? 'Administrateur' : 'Agent'}</p>
                    {user.lastLogin && (
                      <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                        <Clock size={12} />
                        Derniere connexion: {new Date(user.lastLogin).toLocaleString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4 mb-6">
                  <SettingsInput
                    label="Nom complet"
                    value={profileData.fullName}
                    onChange={(value) => setProfileData({ ...profileData, fullName: value })}
                    placeholder="Votre nom complet"
                    icon={User}
                  />
                  <SettingsInput
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={(value) => setProfileData({ ...profileData, email: value })}
                    placeholder="votre@email.com"
                    icon={Mail}
                  />
                  <SettingsInput
                    label="Telephone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(value) => setProfileData({ ...profileData, phone: value })}
                    placeholder="+212 6XX XXX XXX"
                    icon={Phone}
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold rounded-xl shadow-lg shadow-brand-gold/25 hover:shadow-brand-gold/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
                >
                  {profileSaving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Activity size={18} />
                    </motion.div>
                  ) : profileSaved ? (
                    <Check size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  {profileSaving ? 'Enregistrement...' : profileSaved ? 'Enregistre !' : 'Sauvegarder'}
                </button>
              </SettingsCard>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div key="security" className="space-y-6">
                {/* Change Password */}
                <SettingsCard>
                  <SectionHeader
                    icon={Key}
                    title="Changer le mot de passe"
                    description="Mettez a jour votre mot de passe regulierement"
                  />

                  <div className="space-y-4 mb-6">
                    <SettingsInput
                      label="Mot de passe actuel"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={securityData.currentPassword}
                      onChange={(value) => setSecurityData({ ...securityData, currentPassword: value })}
                      placeholder="Entrez votre mot de passe actuel"
                      icon={Lock}
                      rightElement={
                        <button
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="text-white/40 hover:text-white/70 transition-colors"
                        >
                          {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                    />
                    <SettingsInput
                      label="Nouveau mot de passe"
                      type={showNewPassword ? 'text' : 'password'}
                      value={securityData.newPassword}
                      onChange={(value) => setSecurityData({ ...securityData, newPassword: value })}
                      placeholder="Minimum 8 caracteres"
                      icon={Lock}
                      rightElement={
                        <button
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="text-white/40 hover:text-white/70 transition-colors"
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                    />
                    <SettingsInput
                      label="Confirmer le mot de passe"
                      type="password"
                      value={securityData.confirmPassword}
                      onChange={(value) => setSecurityData({ ...securityData, confirmPassword: value })}
                      placeholder="Confirmez votre nouveau mot de passe"
                      icon={Lock}
                    />
                  </div>

                  <AnimatePresence>
                    {passwordError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                      >
                        <AlertCircle size={16} />
                        {passwordError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={handleChangePassword}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold rounded-xl shadow-lg shadow-brand-gold/25 hover:shadow-brand-gold/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Key size={18} />
                    Changer le mot de passe
                  </button>
                </SettingsCard>

                {/* Two-Factor Authentication */}
                <SettingsCard>
                  <SectionHeader
                    icon={Smartphone}
                    title="Authentification a deux facteurs"
                    description="Ajoutez une couche de securite supplementaire"
                  />

                  <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        securityData.twoFactorEnabled
                          ? 'bg-gradient-to-br from-green-500 to-emerald-400'
                          : 'bg-white/10'
                      }`}>
                        <Shield size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">2FA par SMS</p>
                        <p className="text-xs text-white/50">
                          {securityData.twoFactorEnabled ? 'Active' : 'Desactive'}
                        </p>
                      </div>
                    </div>
                    <Toggle
                      enabled={securityData.twoFactorEnabled}
                      onChange={(value) => setSecurityData({ ...securityData, twoFactorEnabled: value })}
                    />
                  </div>
                </SettingsCard>

                {/* Active Sessions */}
                <SettingsCard>
                  <SectionHeader
                    icon={Monitor}
                    title="Sessions actives"
                    description="Gerez vos appareils connectes"
                  />

                  <div className="space-y-3 mb-6">
                    {activeSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`flex items-center justify-between p-4 rounded-xl border ${
                          session.current
                            ? 'bg-brand-gold/10 border-brand-gold/30'
                            : 'bg-white/[0.02] border-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <Monitor size={20} className={session.current ? 'text-brand-gold' : 'text-white/60'} />
                          <div>
                            <p className="font-medium text-white flex items-center gap-2">
                              {session.device}
                              {session.current && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold uppercase font-bold">
                                  Session actuelle
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-white/50">
                              {session.location} - {session.current ? 'Active maintenant' : `Actif ${Math.round((Date.now() - session.lastActive.getTime()) / 3600000)}h ago`}
                            </p>
                          </div>
                        </div>
                        {!session.current && (
                          <button className="p-2 text-white/40 hover:text-red-400 transition-colors">
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleLogoutAllSessions}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500/20 border border-red-500/30 text-red-400 font-medium rounded-xl hover:bg-red-500/30 transition-all"
                  >
                    <LogOut size={18} />
                    Deconnecter toutes les sessions
                  </button>
                </SettingsCard>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <SettingsCard key="notifications">
                <SectionHeader
                  icon={Bell}
                  title="Preferences de Notification"
                  description="Configurez comment vous recevez les alertes"
                />

                <div className="space-y-4 mb-6">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                        <Mail size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Notifications par email</p>
                        <p className="text-xs text-white/50">Recevez des alertes par email</p>
                      </div>
                    </div>
                    <Toggle
                      enabled={notificationSettings.emailNotifications}
                      onChange={(value) => setNotificationSettings({ ...notificationSettings, emailNotifications: value })}
                    />
                  </div>

                  {/* Push Notifications */}
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Bell size={20} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Notifications push</p>
                        <p className="text-xs text-white/50">Notifications dans le navigateur</p>
                      </div>
                    </div>
                    <Toggle
                      enabled={notificationSettings.pushNotifications}
                      onChange={(value) => setNotificationSettings({ ...notificationSettings, pushNotifications: value })}
                    />
                  </div>

                  {/* SMS Notifications */}
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                        <MessageSquare size={20} className="text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Notifications SMS</p>
                        <p className="text-xs text-white/50">Alertes urgentes par SMS</p>
                      </div>
                    </div>
                    <Toggle
                      enabled={notificationSettings.smsNotifications}
                      onChange={(value) => setNotificationSettings({ ...notificationSettings, smsNotifications: value })}
                    />
                  </div>

                  {/* Digest Frequency */}
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <SettingsSelect
                      label="Frequence du digest"
                      value={notificationSettings.digestFrequency}
                      onChange={(value) => setNotificationSettings({ ...notificationSettings, digestFrequency: value as any })}
                      options={[
                        { value: 'instant', label: 'Instantane' },
                        { value: 'daily', label: 'Resume quotidien' },
                        { value: 'weekly', label: 'Resume hebdomadaire' },
                      ]}
                      icon={Clock}
                    />
                  </div>
                </div>
              </SettingsCard>
            )}

            {/* Display Settings */}
            {activeTab === 'display' && (
              <SettingsCard key="display">
                <SectionHeader
                  icon={Palette}
                  title="Affichage"
                  description="Personnalisez l'apparence de l'interface"
                />

                <div className="space-y-6">
                  {/* Theme Toggle */}
                  <div>
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
                      Theme
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', label: 'Clair', icon: Sun },
                        { value: 'dark', label: 'Sombre', icon: Moon },
                        { value: 'system', label: 'Systeme', icon: Monitor },
                      ].map((theme) => (
                        <button
                          key={theme.value}
                          onClick={() => handleThemeChange(theme.value as any)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                            displaySettings.theme === theme.value
                              ? 'bg-brand-gold/20 border-brand-gold text-brand-gold'
                              : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:border-white/20'
                          }`}
                        >
                          <theme.icon size={24} />
                          <span className="text-sm font-medium">{theme.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <SettingsSelect
                    label="Langue"
                    value={displaySettings.language}
                    onChange={(value) => setDisplaySettings({ ...displaySettings, language: value as any })}
                    options={[
                      { value: 'FR', label: 'Francais' },
                      { value: 'EN', label: 'English' },
                      { value: 'AR', label: 'Arabe' },
                    ]}
                    icon={Globe}
                  />

                  {/* Timezone */}
                  <SettingsSelect
                    label="Fuseau horaire"
                    value={displaySettings.timezone}
                    onChange={(value) => setDisplaySettings({ ...displaySettings, timezone: value })}
                    options={[
                      { value: 'Africa/Casablanca', label: 'Casablanca (UTC+1)' },
                      { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
                      { value: 'Europe/London', label: 'Londres (UTC)' },
                      { value: 'America/New_York', label: 'New York (UTC-5)' },
                      { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
                    ]}
                    icon={Clock}
                  />

                  {/* Date Format */}
                  <SettingsSelect
                    label="Format de date"
                    value={displaySettings.dateFormat}
                    onChange={(value) => setDisplaySettings({ ...displaySettings, dateFormat: value })}
                    options={[
                      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
                      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
                      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
                    ]}
                    icon={Calendar}
                  />
                </div>
              </SettingsCard>
            )}

            {/* CRM Settings */}
            {activeTab === 'crm' && (
              <div key="crm" className="space-y-6">
                <SettingsCard>
                  <SectionHeader
                    icon={Target}
                    title="Configuration CRM"
                    description="Parametres d'automatisation et de scoring"
                  />

                  <div className="space-y-6">
                    {/* Auto Assignment Toggle */}
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold/20 to-amber-500/20 flex items-center justify-center">
                          <Zap size={20} className="text-brand-gold" />
                        </div>
                        <div>
                          <p className="font-medium text-white">Attribution automatique</p>
                          <p className="text-xs text-white/50">Assigner automatiquement les leads aux agents</p>
                        </div>
                      </div>
                      <Toggle
                        enabled={crmSettings.autoAssignment}
                        onChange={(value) => setCrmSettings({ ...crmSettings, autoAssignment: value })}
                      />
                    </div>

                    {/* Lead Scoring Weights */}
                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                      <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Sliders size={16} className="text-brand-gold" />
                        Poids du scoring des leads
                      </h4>
                      <div className="space-y-4">
                        <SettingsSlider
                          label="Budget"
                          value={crmSettings.budgetWeight}
                          onChange={(value) => setCrmSettings({ ...crmSettings, budgetWeight: value })}
                        />
                        <SettingsSlider
                          label="Urgence"
                          value={crmSettings.urgencyWeight}
                          onChange={(value) => setCrmSettings({ ...crmSettings, urgencyWeight: value })}
                        />
                        <SettingsSlider
                          label="Engagement"
                          value={crmSettings.engagementWeight}
                          onChange={(value) => setCrmSettings({ ...crmSettings, engagementWeight: value })}
                        />
                      </div>
                      <p className="text-xs text-white/40 mt-4 text-center">
                        Total: {crmSettings.budgetWeight + crmSettings.urgencyWeight + crmSettings.engagementWeight}%
                        {crmSettings.budgetWeight + crmSettings.urgencyWeight + crmSettings.engagementWeight !== 100 && (
                          <span className="text-amber-400 ml-2">(Recommande: 100%)</span>
                        )}
                      </p>
                    </div>

                    {/* Default Lead Status */}
                    <SettingsSelect
                      label="Statut par defaut des leads"
                      value={crmSettings.defaultLeadStatus}
                      onChange={(value) => setCrmSettings({ ...crmSettings, defaultLeadStatus: value })}
                      options={[
                        { value: 'new', label: 'Nouveau' },
                        { value: 'contacted', label: 'Contacte' },
                        { value: 'qualified', label: 'Qualifie' },
                      ]}
                    />

                    {/* Default Urgency */}
                    <SettingsSelect
                      label="Niveau d'urgence par defaut"
                      value={crmSettings.defaultUrgency}
                      onChange={(value) => setCrmSettings({ ...crmSettings, defaultUrgency: value })}
                      options={[
                        { value: 'low', label: 'Basse' },
                        { value: 'medium', label: 'Moyenne' },
                        { value: 'high', label: 'Haute' },
                        { value: 'critical', label: 'Critique' },
                      ]}
                    />
                  </div>
                </SettingsCard>
              </div>
            )}

            {/* Danger Zone */}
            {activeTab === 'danger' && (
              <div key="danger" className="space-y-6">
                <SettingsCard className="border-red-500/30">
                  <SectionHeader
                    icon={Download}
                    title="Exporter vos donnees"
                    description="Telechargez une copie de toutes vos donnees"
                  />

                  <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.06] mb-4">
                    <div>
                      <p className="font-medium text-white">Export complet (JSON)</p>
                      <p className="text-xs text-white/50">Inclut profil, parametres et preferences</p>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white font-medium rounded-lg hover:bg-white/20 transition-all"
                    >
                      <Download size={16} />
                      Telecharger
                    </button>
                  </div>
                </SettingsCard>

                <SettingsCard className="border-red-500/30 bg-red-950/20">
                  <SectionHeader
                    icon={Trash2}
                    title="Supprimer le compte"
                    description="Action irreversible - toutes les donnees seront perdues"
                  />

                  <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-red-300 font-medium">Attention</p>
                        <p className="text-xs text-red-400/80 mt-1">
                          La suppression de votre compte est definitive. Vous perdrez l'acces a tous vos leads,
                          statistiques et donnees CRM. Cette action ne peut pas etre annulee.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all"
                  >
                    <Trash2 size={18} />
                    Supprimer mon compte
                  </button>
                </SettingsCard>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
});

Settings.displayName = 'Settings';

export { Settings };
export default Settings;
