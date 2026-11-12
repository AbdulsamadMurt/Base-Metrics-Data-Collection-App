import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Clock, KeyRound, ShieldAlert, LogOut, CheckCircle2, AlertCircle, Eye, EyeOff, Mail, ShieldCheck } from 'lucide-react';
import { generateUserAccessCode, normalizeCode } from '../lib/accessCode';

export default function PendingApprovalView() {
  const { profile, user } = useAuth();
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // If user profile is missing an individual accessCode, generate one automatically
  useEffect(() => {
    if (user && profile && !profile.accessCode && profile.approvalStatus === 'pending') {
      const code = generateUserAccessCode(profile.role || 'facilitator');
      updateDoc(doc(db, 'users', user.uid), { accessCode: code }).catch(err => {
        console.error('Failed to set initial access code:', err);
      });
    }
  }, [user, profile]);

  const handleApplyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setError(null);
    setLoading(true);

    const entered = normalizeCode(accessCode);
    const assigned = normalizeCode(profile.accessCode);
    const isAdminPassword = profile.role === 'admin' && entered === 'B1MERTICS';

    // The code must match THIS user's personal unique access code assigned to them
    if (entered && (entered === assigned || isAdminPassword)) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          approvalStatus: 'approved',
          accessCodeUsed: accessCode.trim().toUpperCase(),
          approvedAt: new Date().toISOString()
        });
        setSuccess(true);
      } catch (err: any) {
        setError(err.message || 'Failed to activate account. Please contact admin.');
      }
    } else {
      setError(`The code entered is incorrect for your account. Please ask the Base Metrics Administrator for your individual one-time activation code.`);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await auth.signOut();
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#161b22] border border-[#30363d] rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#f0f6fc]">Account Pending Approval</h1>
            <p className="text-xs text-[#8b949e] mt-1">Base Metrics Data Collection Platform</p>
          </div>
        </div>

        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-[#21262d]">
            <span className="text-[#8b949e]">Registered Name:</span>
            <span className="font-semibold text-[#f0f6fc]">{profile?.name}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-[#21262d]">
            <span className="text-[#8b949e]">Registered Email:</span>
            <span className="font-mono text-[#f0f6fc]">{profile?.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#8b949e]">Requested Role:</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-[#58a6ff] border border-blue-500/30">
              {profile?.role}
            </span>
          </div>
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 space-y-1.5">
          <p className="font-semibold flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Account Registered — Awaiting Activation</span>
          </p>
          <p className="text-[11px] text-[#8b949e] leading-relaxed">
            Your registration is logged. Each field staff member has a unique personal one-time activation code generated for them in the Administrator portal.
          </p>
          <p className="text-[11px] text-[#2ea043] leading-relaxed">
            Contact your Admin (<span className="font-mono text-[#f0f6fc]">murtalaabdulsamad142@gmail.com</span>) to get your code. Once entered, your dashboard unlocks permanently — you will never have to re-register or enter a code again.
          </p>
        </div>

        {/* Access Code Instant Unlock */}
        <div className="border-t border-[#30363d] pt-5 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#f0f6fc]">
            <KeyRound className="w-4 h-4 text-[#2ea043]" />
            <span>Enter Your Personal One-Time Activation Code</span>
          </div>
          <p className="text-[11px] text-[#8b949e]">
            Enter the unique code provided to you by the Admin below for instant permanent activation:
          </p>

          <form onSubmit={handleApplyCode} className="space-y-2">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <input
                  type={showCode ? 'text' : 'password'}
                  placeholder="Enter access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl pl-3 pr-9 py-2 text-xs font-mono text-[#f0f6fc] focus:border-[#58a6ff] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#f0f6fc] p-0.5 cursor-pointer transition-colors"
                  title={showCode ? 'Hide code' : 'Show code'}
                  tabIndex={-1}
                >
                  {showCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading || !accessCode.trim()}
                className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                {loading ? 'Checking...' : 'Unlock'}
              </button>
            </div>

            {error && (
              <div className="flex items-center space-x-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-1.5 text-xs text-[#2ea043] bg-[#238636]/15 border border-[#238636]/30 p-2 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Account activated! Refreshing...</span>
              </div>
            )}
          </form>
        </div>

        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-[#8b949e]" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
