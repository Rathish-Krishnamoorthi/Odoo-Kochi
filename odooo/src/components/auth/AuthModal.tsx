import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { Shield, Lock, Mail, User, Building, Phone, AlertCircle, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'FORGOT' | 'RESET'>('LOGIN');

  // Login state
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Register state
  const [fullName, setFullName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [gstin, setGstin] = useState<string>('');

  // Forgot / Reset state
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Password rules evaluation
  const passLength = regPassword.length > 8;
  const passUpper = /[A-Z]/.test(regPassword);
  const passLower = /[a-z]/.test(regPassword);
  const passSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(regPassword);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (regPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!passLength || !passUpper || !passLower || !passSpecial) {
      setErrorMsg('Password does not satisfy all complexity requirements.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        fullName,
        email: regEmail,
        password: regPassword,
        confirmPassword,
        phone,
        companyName,
        gstin
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      const res = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail })
      });
      setSuccessMsg(res.message);
      if (res.devToken) {
        setResetToken(res.devToken);
        setTab('RESET');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const res = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword,
          confirmPassword: confirmNewPassword
        })
      });
      setSuccessMsg(res.message);
      setTab('LOGIN');
      setEmail(forgotEmail);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              B
            </div>
            <h3 className="text-sm font-bold text-slate-900">Brightloop Authentication</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center justify-center gap-1 bg-slate-100 p-1 rounded-lg text-xs my-4">
          <button
            onClick={() => { setTab('LOGIN'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-colors ${
              tab === 'LOGIN' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('REGISTER'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 rounded-md font-semibold transition-colors ${
              tab === 'REGISTER' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register Client
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mb-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {tab === 'LOGIN' && (
          <form onSubmit={handleLogin} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="admin@brightloop.io"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-medium">Password</label>
                <button
                  type="button"
                  onClick={() => { setTab('FORGOT'); setErrorMsg(''); }}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs mt-2"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {tab === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Ramesh Kumar"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="client@company.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Company</label>
                <input
                  type="text"
                  placeholder="Acme Corp"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">GSTIN</label>
                <input
                  type="text"
                  placeholder="29AABCB1234F1Z5"
                  value={gstin}
                  onChange={e => setGstin(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Password *</label>
              <input
                type="password"
                required
                placeholder="Brightloop@2026!"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Confirm Password *</label>
              <input
                type="password"
                required
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Password Complexity Checklist as required by prompt */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] space-y-1">
              <span className="font-semibold text-slate-700 block">Password Requirements:</span>
              <div className={`flex items-center gap-1.5 ${passLength ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                <span>{passLength ? '✓' : '○'}</span> More than 8 characters ({regPassword.length}/9)
              </div>
              <div className={`flex items-center gap-1.5 ${passUpper ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                <span>{passUpper ? '✓' : '○'}</span> At least one uppercase letter (A-Z)
              </div>
              <div className={`flex items-center gap-1.5 ${passLower ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                <span>{passLower ? '✓' : '○'}</span> At least one lowercase letter (a-z)
              </div>
              <div className={`flex items-center gap-1.5 ${passSpecial ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                <span>{passSpecial ? '✓' : '○'}</span> At least one special character (!@#$%^&*)
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs mt-2"
            >
              {isSubmitting ? 'Creating Account...' : 'Register Customer Account'}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {tab === 'FORGOT' && (
          <form onSubmit={handleForgot} className="space-y-3 text-xs">
            <p className="text-slate-600">
              Enter your registered email address and we'll dispatch a time-limited password reset token.
            </p>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Registered Email</label>
              <input
                type="email"
                required
                placeholder="customer@acme.com"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
            >
              {isSubmitting ? 'Dispatching Token...' : 'Send Password Reset Token'}
            </button>

            <button
              type="button"
              onClick={() => setTab('LOGIN')}
              className="w-full text-center text-[11px] text-slate-500 hover:text-slate-800"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {/* RESET PASSWORD FORM */}
        {tab === 'RESET' && (
          <form onSubmit={handleReset} className="space-y-3 text-xs">
            <p className="text-slate-600">
              Enter your secure reset token and set a new compliant password.
            </p>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Reset Token *</label>
              <input
                type="text"
                required
                value={resetToken}
                onChange={e => setResetToken(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">New Password *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
            >
              {isSubmitting ? 'Updating...' : 'Set New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
