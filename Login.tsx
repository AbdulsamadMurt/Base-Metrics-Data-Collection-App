import React, { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LogIn, 
  GraduationCap, 
  ShieldCheck, 
  Users, 
  KeyRound, 
  QrCode, 
  Eye, 
  EyeOff, 
  Lock, 
  ArrowLeft,
  ShieldAlert,
  Globe,
  Layers
} from 'lucide-react';
import { cn } from '../lib/utils';
import AppDownloadModal from '../components/AppDownloadModal';
import { generateUserAccessCode, normalizeCode } from '../lib/accessCode';
import { useAuth } from '../components/AuthContext';
import { UserProfile } from '../types';

const Login: React.FC = () => {
  const { user: currentAuthUser, profile: currentAuthProfile, isAuthReady } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Role selector: FAC, SUPER, or B1 Task (Other Sectors)
  const [selectedRole, setSelectedRole] = useState<'facilitator' | 'supervisor' | 'b1_task'>('facilitator');
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  
  // Optional discreet admin authentication gate
  const [showAdminGate, setShowAdminGate] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);

  const navigate = useNavigate();

  // If already signed in and approved, navigate directly to role-specific portal
  useEffect(() => {
    if (isAuthReady && currentAuthUser) {
      const isAdminEmail = currentAuthUser.email === 'murtalaabdulsamad142@gmail.com';
      if (currentAuthProfile?.approvalStatus === 'approved' || currentAuthProfile?.role === 'admin' || isAdminEmail) {
        if (currentAuthProfile?.role === 'b1_task') {
          navigate('/b1-task', { replace: true });
        } else if (currentAuthProfile?.role === 'supervisor') {
          navigate('/supervisor', { replace: true });
        } else if (currentAuthProfile?.role === 'admin' || isAdminEmail) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/facilitator', { replace: true });
        }
      }
    }
  }, [currentAuthUser, currentAuthProfile, isAuthReady, navigate]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const isAdminEmail = user.email === 'murtalaabdulsamad142@gmail.com';
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      // Check if admin password was provided in admin gate
      const isAdminPassValid = showAdminGate && adminPassword.trim() === 'B1MERTICS';

      if (userDoc.exists()) {
        // User is ALREADY registered with their email!
        const existingData = userDoc.data() as UserProfile;
        
        // Ensure Admin email or validated admin pass is always granted admin role
        if (isAdminEmail || isAdminPassValid) {
          if (existingData.role !== 'admin' || existingData.approvalStatus !== 'approved') {
            await updateDoc(userRef, {
              role: 'admin',
              approvalStatus: 'approved'
            });
          }
          navigate('/admin');
          return;
        }

        // Ensure they have a unique access code on record if they registered previously
        let code = existingData.accessCode;
        if (!code) {
          code = generateUserAccessCode(existingData.role || selectedRole);
          await updateDoc(userRef, { accessCode: code });
        }

        // If they entered an access code on the login form while still pending
        if (accessCode.trim() && existingData.approvalStatus === 'pending') {
          const entered = normalizeCode(accessCode);
          const target = normalizeCode(code);

          if (entered === target) {
            await updateDoc(userRef, {
              approvalStatus: 'approved',
              accessCodeUsed: accessCode.trim().toUpperCase(),
              approvedAt: new Date().toISOString()
            });
          }
        }

        // Route directly to their role-specific portal
        if (existingData.role === 'b1_task') {
          navigate('/b1-task');
        } else if (existingData.role === 'supervisor') {
          navigate('/supervisor');
        } else {
          navigate('/facilitator');
        }
        return;
      }

      // First-time Registration:
      // If logging in as primary admin or validated admin pass
      if (isAdminEmail || isAdminPassValid) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'Administrator',
          role: 'admin',
          approvalStatus: 'approved',
          createdAt: new Date().toISOString()
        });
        navigate('/admin');
        return;
      }

      // Field personnel (FAC, SUPER, or B1 Task):
      // Generate unique personal access code (e.g. FAC-XXXX, SUP-XXXX, B1-XXXX)
      const uniqueCode = generateUserAccessCode(selectedRole);
      const enteredCode = normalizeCode(accessCode);
      const isPreApproved = enteredCode.length > 0 && enteredCode === normalizeCode(uniqueCode);

      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'Anonymous User',
        role: selectedRole,
        approvalStatus: isPreApproved ? 'approved' : 'pending',
        accessCode: uniqueCode, // This person's individual unique activation code
        createdAt: new Date().toISOString()
      });

      if (selectedRole === 'b1_task') {
        navigate('/b1-task');
      } else if (selectedRole === 'supervisor') {
        navigate('/supervisor');
      } else {
        navigate('/facilitator');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/popup-blocked') {
        setError("The login popup was blocked by your browser. Please allow popups for this site and try again.");
      } else {
        setError(err.message || "Failed to login. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col items-center justify-center p-4 font-sans">
      {/* Top Bar with Home link & Mobile App Barcode */}
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <Link
          to="/"
          className="inline-flex items-center text-xs font-semibold text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Base Metrics Home</span>
        </Link>

        <button
          onClick={() => setIsDownloadOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-xs font-medium text-[#f0f6fc] transition-colors cursor-pointer shadow-xs"
        >
          <QrCode className="w-3.5 h-3.5 text-[#2ea043]" />
          <span>Mobile App Barcode</span>
        </button>
      </div>

      <div className="max-w-md w-full bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <img 
            src="/logo.jpeg" 
            alt="Base Metrics Logo" 
            className="w-16 h-16 rounded-2xl object-contain bg-white p-1.5 mx-auto mb-3 shadow-lg border border-[#30363d]" 
          />
          <h1 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">Base Metrics</h1>
          <p className="text-xs text-[#8b949e] mt-1 font-medium">Consulting &bull; Universal Field Data Collection</p>
        </div>

        {/* Public Role Selector: FAC, SUPER, and B1 Task (Other Sectors) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#f0f6fc] block">Select your role (new registration):</label>
            <span className="text-[10px] text-[#8b949e]">Step 1 of 2</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {/* 1. FAC (Facilitator) */}
            <button
              type="button"
              onClick={() => setSelectedRole('facilitator')}
              className={cn(
                "flex flex-col items-center p-3 rounded-xl border text-center transition-all cursor-pointer",
                selectedRole === 'facilitator' 
                  ? "border-[#58a6ff] bg-[#58a6ff]/10 text-[#58a6ff]" 
                  : "border-[#30363d] bg-[#0d1117] text-[#8b949e] hover:border-[#8b949e]"
              )}
            >
              <Users className="w-4 h-4 mb-1" />
              <span className="text-xs font-bold">FAC</span>
              <span className="text-[9px] text-[#8b949e] mt-0.5 truncate w-full">Facilitator</span>
            </button>

            {/* 2. SUPER (Supervisor) */}
            <button
              type="button"
              onClick={() => setSelectedRole('supervisor')}
              className={cn(
                "flex flex-col items-center p-3 rounded-xl border text-center transition-all cursor-pointer",
                selectedRole === 'supervisor' 
                  ? "border-[#2ea043] bg-[#238636]/10 text-[#2ea043]" 
                  : "border-[#30363d] bg-[#0d1117] text-[#8b949e] hover:border-[#8b949e]"
              )}
            >
              <ShieldCheck className="w-4 h-4 mb-1" />
              <span className="text-xs font-bold">SUPER</span>
              <span className="text-[9px] text-[#8b949e] mt-0.5 truncate w-full">Supervisor</span>
            </button>

            {/* 3. B1 Task (Other Sectors) */}
            <button
              type="button"
              onClick={() => setSelectedRole('b1_task')}
              className={cn(
                "flex flex-col items-center p-3 rounded-xl border text-center transition-all cursor-pointer",
                selectedRole === 'b1_task' 
                  ? "border-[#bc8cff] bg-[#bc8cff]/10 text-[#bc8cff]" 
                  : "border-[#30363d] bg-[#0d1117] text-[#8b949e] hover:border-[#8b949e]"
              )}
            >
              <Layers className="w-4 h-4 mb-1" />
              <span className="text-xs font-bold">B1 Task</span>
              <span className="text-[9px] text-[#8b949e] mt-0.5 truncate w-full">Other Sector</span>
            </button>
          </div>
          <p className="text-[10px] text-[#8b949e] text-center pt-0.5">
            {selectedRole === 'b1_task' 
              ? 'B1 Task: Dedicated workspace for Health, Agriculture, WASH, or custom sector tasks.'
              : selectedRole === 'supervisor'
              ? 'SUPER: Conduct on-site inspections, GPS audits, and quality scoring.'
              : 'FAC: Daily attendance, classroom logs, and direct enumerator reporting.'}
          </p>
        </div>

        {/* Role One-Time Access Code Input (For field staff) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#f0f6fc] flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <KeyRound className="w-3.5 h-3.5 text-[#2ea043]" />
              <span>One-Time Activation Code:</span>
            </span>
            <span className="text-[10px] text-[#8b949e] font-normal">Optional</span>
          </label>
          <div className="relative">
            <input
              type={showCode ? 'text' : 'password'}
              placeholder={
                selectedRole === 'b1_task' 
                  ? 'e.g. B1-XXXX (if provided by Admin)'
                  : selectedRole === 'supervisor'
                  ? 'e.g. SUP-XXXX (if provided by Admin)'
                  : 'e.g. FAC-XXXX (if provided by Admin)'
              }
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-mono text-[#f0f6fc] focus:border-[#58a6ff] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#f0f6fc] p-1 cursor-pointer transition-colors"
              title={showCode ? 'Hide code' : 'Show code'}
              tabIndex={-1}
            >
              {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-[#8b949e]">
            If you already received your code from the Admin, enter it to activate immediately. Otherwise, leave empty to register for approval.
          </p>
        </div>

        {/* Returning member persistent note */}
        <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl text-center">
          <p className="text-[11px] text-[#8b949e]">
            <strong className="text-[#f0f6fc]">Returning team member?</strong> Simply sign in below — you do not need to register again. Your assigned portal loads automatically.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs text-center">
            {error}
          </div>
        )}

        {/* Main Sign in Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-[#238636] hover:bg-[#2ea043] text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer shadow-sm text-sm"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        {/* Discreet Admin Portal Access for authorized administrators */}
        <div className="pt-2 border-t border-[#21262d]">
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setShowAdminGate(!showAdminGate)}
              className="text-[11px] text-[#8b949e] hover:text-[#58a6ff] transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>{showAdminGate ? 'Hide Administrator Gate' : 'Administrator Gateway'}</span>
            </button>
          </div>

          {showAdminGate && (
            <div className="mt-3 p-3.5 bg-[#0d1117] border border-[#30363d] rounded-xl space-y-2.5 animate-fadeIn">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#bc8cff]">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin Master Security Key</span>
              </div>
              <div className="relative">
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  placeholder="Enter admin security password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-3 pr-9 py-2 text-xs font-mono text-[#f0f6fc] focus:border-[#bc8cff] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#f0f6fc]"
                >
                  {showAdminPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-[#8b949e]">
                Primary admin email (<span className="text-[#c9d1d9]">murtalaabdulsamad142@gmail.com</span>) is recognized automatically upon Google sign-in without a password.
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-[#8b949e] text-center">
          By signing in, you agree to our{' '}
          <Link to="/terms" className="underline hover:text-[#f0f6fc]">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="underline hover:text-[#f0f6fc]">
            Privacy Policy
          </Link>.
        </p>
      </div>

      <AppDownloadModal 
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />
    </div>
  );
};

export default Login;
