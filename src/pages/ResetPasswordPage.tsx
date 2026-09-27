import React, { useState } from 'react';
import { 
  Compass, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  ArrowLeft,
  CalendarCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { isValidEmail } from '../lib/security';

interface ResetPasswordPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onNavigate }) => {
  const { resetPassword, updatePassword } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<'request' | 'verify_and_update' | 'completed'>('request');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPassword(email.trim());
      if (res.success) {
        if (res.resetCode) {
          setDemoCode(res.resetCode);
          setResetCode(res.resetCode);
        }
        setStep('verify_and_update');
        showToast('Password reset instructions dispatched!', 'info');
      } else {
        setErrorMessage(res.error || 'Could not send reset instructions. Please check your email.');
      }
    } catch {
      setErrorMessage('A connection error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updatePassword(newPassword, email.trim());
      if (res.success) {
        setStep('completed');
        showToast('Password successfully updated!', 'success');
      } else {
        setErrorMessage(res.error || 'Failed to update password. Please try again.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] bg-[#FAF8F5] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto space-y-6">
        
        {/* Visitor Help Callout */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-amber-900 shadow-2xs">
          <CalendarCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-semibold text-amber-950">Looking for an existing reservation?</p>
            <p className="text-amber-800 mt-0.5">
              You don't need to log in to view or manage your excursion booking. All visitors can look up their reservation instantly with their booking reference code.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('my-booking')}
              className="mt-2 inline-flex items-center text-xs font-bold text-amber-800 hover:text-amber-950 underline underline-offset-2 cursor-pointer"
            >
              <span>Go to Find My Booking Portal</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E8E3DA] rounded-xl shadow-sm p-6 sm:p-8 space-y-6">
          
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center mx-auto mb-2">
              <img 
                src="/logo.png" 
                alt="Red Sea Voyages Logo" 
                className="h-16 w-auto object-contain drop-shadow-sm"
              />
            </div>
            <h1 className="font-display text-2xl font-bold text-[#0E1B2A]">
              {step === 'completed'
                ? 'Password Updated'
                : step === 'verify_and_update'
                ? 'Set New Password'
                : 'Reset Your Password'}
            </h1>
            <p className="text-xs text-stone-500">
              {step === 'completed'
                ? 'Your password has been changed. You can now sign in with your new credentials.'
                : step === 'verify_and_update'
                ? `Enter your recovery code and choose a new secure password for ${email}.`
                : 'Enter your account email address and we will provide password reset instructions.'}
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1: Request email */}
          {step === 'request' && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-xs font-bold text-stone-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-stone-300 text-xs sm:text-sm bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-[#0A6C74] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-[#0A6C74] hover:bg-[#08565C] disabled:bg-stone-400 text-white font-semibold text-xs sm:text-sm rounded-lg transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending instructions...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Enter code & new password */}
          {step === 'verify_and_update' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {demoCode && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-emerald-950">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Simulated Reset Code Ready</span>
                  </div>
                  <p>
                    Test recovery code: <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">{demoCode}</span>
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="reset-code" className="block text-xs font-bold text-stone-700 mb-1">
                  Verification / Reset Code
                </label>
                <input
                  id="reset-code"
                  type="text"
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="6-digit recovery code"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-xs sm:text-sm font-mono tracking-wider bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-[#0A6C74] focus:bg-white"
                />
              </div>

              <div>
                <label htmlFor="new-password" className="block text-xs font-bold text-stone-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-stone-300 text-xs sm:text-sm bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-[#0A6C74] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-new-password" className="block text-xs font-bold text-stone-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    id="confirm-new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-stone-300 text-xs sm:text-sm bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-[#0A6C74] focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-[#0A6C74] hover:bg-[#08565C] disabled:bg-stone-400 text-white font-semibold text-xs sm:text-sm rounded-lg transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Save New Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 3: Completed */}
          {step === 'completed' && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs text-stone-600">
                You can now log in securely using your updated password.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="w-full py-2.5 px-4 bg-[#0A6C74] hover:bg-[#08565C] text-white font-semibold text-xs sm:text-sm rounded-lg transition-all cursor-pointer"
              >
                Sign In With New Password
              </button>
            </div>
          )}

          {/* Back to login */}
          <div className="text-center pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="text-xs font-semibold text-[#0A6C74] hover:text-[#08565C] inline-flex items-center space-x-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>

        </div>

        {/* Back Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex items-center text-xs text-stone-500 hover:text-stone-800 font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Return to Homepage</span>
          </button>
        </div>

      </div>
    </div>
  );
};
