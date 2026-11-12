import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { 
  ShieldCheck, 
  Users, 
  ClipboardList, 
  MapPin, 
  FolderKanban, 
  QrCode, 
  ArrowRight, 
  Lock, 
  CheckCircle2, 
  Smartphone,
  Globe,
  Database,
  ExternalLink,
  GraduationCap,
  HeartPulse,
  Sprout,
  Droplets,
  Layers,
  Sparkles,
  Camera,
  Compass,
  FileSpreadsheet
} from 'lucide-react';
import AppDownloadModal from '../components/AppDownloadModal';

export default function Home() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [activeSector, setActiveSector] = useState<'education' | 'health' | 'agriculture' | 'wash' | 'humanitarian' | 'custom'>('education');

  const handlePortalClick = () => {
    if (user) {
      if (profile?.role === 'admin' || user.email === 'murtalaabdulsamad142@gmail.com') {
        navigate('/admin');
      } else if (profile?.role === 'supervisor') {
        navigate('/supervisor');
      } else {
        navigate('/facilitator');
      }
    } else {
      navigate('/login');
    }
  };

  const sectors = [
    {
      id: 'education',
      title: 'Education & Schools',
      icon: GraduationCap,
      color: '#58a6ff',
      badge: 'Education Sector',
      description: 'Track student attendance (disaggregated boys & girls), lesson delivery, radio education broadcasts, teacher attendance, and classroom comprehension tests.',
      metrics: ['Attendance Disaggregation', 'Literacy Comprehension', 'Facility Audits']
    },
    {
      id: 'health',
      title: 'Health & Clinical Care',
      icon: HeartPulse,
      color: '#f85149',
      badge: 'Healthcare Sector',
      description: 'Deploy field health workers to record patient triage, immunization campaigns, maternal health checkups, medicine supply stocks, and clinic readiness.',
      metrics: ['Vaccine Distribution', 'Clinic Inventory', 'Patient Surveys']
    },
    {
      id: 'agriculture',
      title: 'Agriculture & Food',
      icon: Sprout,
      color: '#2ea043',
      badge: 'Agriculture Sector',
      description: 'Collect farm plot GPS coordinates, fertilizer distribution, crop health conditions, seasonal yield estimations, and farmer cooperative rosters.',
      metrics: ['Farm GPS Boundaries', 'Crop Yield Reports', 'Cooperative Rosters']
    },
    {
      id: 'wash',
      title: 'WASH & Water Points',
      icon: Droplets,
      color: '#79c0ff',
      badge: 'WASH Sector',
      description: 'Audit community boreholes, water quality tests, sanitation facilities, broken pump repairs, and hygiene training session attendance.',
      metrics: ['Water Point Status', 'Water Quality Metrics', 'Repair Inspection']
    },
    {
      id: 'humanitarian',
      title: 'Humanitarian & Relief',
      icon: Layers,
      color: '#d29922',
      badge: 'Humanitarian Relief',
      description: 'Register displaced families, track emergency food & cash transfers, verify aid voucher redemptions, and monitor camp shelter conditions.',
      metrics: ['Beneficiary Biometrics', 'Relief Distribution', 'Camp Needs Audits']
    },
    {
      id: 'custom',
      title: 'Any Custom Field Task',
      icon: Sparkles,
      color: '#bc8cff',
      badge: 'Custom Task Engine',
      description: 'Design any questionnaire in minutes. Add text, multiple choice, numerical, photographic, and GPS fields. Export clean CSV datasets with 1 click.',
      metrics: ['Flexible Form Builder', 'Live Enumerator Sync', 'Instant CSV Exports']
    }
  ];

  const currentSectorData = sectors.find(s => s.id === activeSector) || sectors[0];

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col font-sans selection:bg-[#238636] selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#161b22]/90 backdrop-blur-md border-b border-[#30363d] px-4 sm:px-8 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <img 
            src="/logo.jpeg" 
            alt="Base Metrics Logo" 
            className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-[#30363d] shadow-sm group-hover:scale-105 transition-transform shrink-0" 
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-[#f0f6fc] tracking-tight leading-none">Base Metrics</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                Consulting
              </span>
            </div>
            <p className="text-[10px] text-[#8b949e] font-medium leading-none mt-1">Universal Field Engine</p>
          </div>
        </Link>

        <nav className="flex items-center space-x-3">
          <Link
            to="/privacy"
            className="text-xs font-semibold text-[#f0f6fc] hover:text-[#58a6ff] transition-colors px-2 py-1 rounded-lg hover:bg-[#21262d]"
          >
            Privacy Policy
          </Link>

          <Link
            to="/terms"
            className="text-xs text-[#8b949e] hover:text-[#f0f6fc] transition-colors hidden sm:inline-block px-2 py-1"
          >
            Terms of Service
          </Link>

          <button
            onClick={() => setIsDownloadOpen(true)}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium text-[#f0f6fc] transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-[#2ea043]" />
            <span>Mobile App</span>
          </button>

          <button
            onClick={handlePortalClick}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <span>{user ? 'Open Portal' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="px-4 sm:px-8 pt-16 pb-16 max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#238636]/10 border border-[#238636]/30 text-[#2ea043] text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Multi-Sector Field Data Collection & Monitoring Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#f0f6fc] tracking-tight leading-tight">
            Collect Any Field Data.<br className="hidden sm:inline" /> In Any Sector.
          </h1>

          <p className="text-base sm:text-lg text-[#8b949e] max-w-3xl mx-auto leading-relaxed">
            Base Metrics is a universal, offline-first data collection and verification platform. Whether you are managing <strong className="text-[#f0f6fc]">Education programs</strong>, <strong className="text-[#f0f6fc]">Health outreach</strong>, <strong className="text-[#f0f6fc]">Agriculture surveys</strong>, <strong className="text-[#f0f6fc]">WASH facilities</strong>, or <strong className="text-[#f0f6fc]">Humanitarian relief</strong>, Base Metrics gives your organization GPS-verified field reports, customizable surveys, and instant CSV exports.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handlePortalClick}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>{user ? 'Go to Your Workspace' : 'Sign In to Base Metrics'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsDownloadOpen(true)}
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#f0f6fc] font-semibold text-sm flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-[#2ea043]" />
              <span>Scan Barcode for Mobile App</span>
            </button>
          </div>
        </section>

        {/* Interactive Multi-Sector Explorer */}
        <section className="px-4 sm:px-8 py-12 max-w-5xl mx-auto space-y-6">
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl font-bold text-[#f0f6fc]">Engineered for Any Sector & Project</h2>
            <p className="text-xs sm:text-sm text-[#8b949e]">
              Click any sector below to see how Base Metrics streamlines data collection for your team:
            </p>
          </div>

          {/* Sector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {sectors.map((s) => {
              const Icon = s.icon;
              const isActive = activeSector === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSector(s.id as any)}
                  className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    isActive 
                      ? 'border-[#2ea043] bg-[#238636]/15 text-[#f0f6fc] shadow-sm' 
                      : 'border-[#30363d] bg-[#161b22] text-[#8b949e] hover:border-[#8b949e] hover:text-[#c9d1d9]'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1.5" style={{ color: isActive ? '#2ea043' : s.color }} />
                  <span className="text-xs font-semibold">{s.title}</span>
                </button>
              );
            })}
          </div>

          {/* Sector Detailed Showcase Panel */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 space-y-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#30363d]">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${currentSectorData.color}20`, border: `1px solid ${currentSectorData.color}40`, color: currentSectorData.color }}
                >
                  <currentSectorData.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-bold text-[#f0f6fc]">{currentSectorData.title}</h3>
                    <span 
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold uppercase"
                      style={{ backgroundColor: `${currentSectorData.color}15`, color: currentSectorData.color, border: `1px solid ${currentSectorData.color}30` }}
                    >
                      {currentSectorData.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#8b949e] mt-0.5">Customizable questionnaires & automated verification</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-[#8b949e]">Built-in Workflow:</span>
                <span className="text-xs font-semibold text-[#f0f6fc] px-2.5 py-1 rounded-lg bg-[#21262d] border border-[#30363d]">
                  Enumerator &rarr; Supervisor &rarr; Admin
                </span>
              </div>
            </div>

            <p className="text-sm text-[#c9d1d9] leading-relaxed">
              {currentSectorData.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {currentSectorData.metrics.map((m, idx) => (
                <div key={idx} className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ea043] shrink-0" />
                  <span className="text-xs font-medium text-[#f0f6fc]">{m}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4 Core Pillars of Universal Data Collection */}
        <section className="px-4 sm:px-8 py-16 bg-[#161b22]/40 border-y border-[#30363d]">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#f0f6fc]">
                Everything Needed to Collect Any Data
              </h2>
              <p className="text-xs sm:text-sm text-[#8b949e] max-w-2xl mx-auto">
                No matter what data your project collects, Base Metrics enforces accuracy, tamper resistance, and structured reporting.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pillar 1: Custom Question Builder */}
              <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#bc8cff]/10 border border-[#bc8cff]/30 flex items-center justify-center text-[#bc8cff]">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#f0f6fc]">Custom Project Tasks</h3>
                <p className="text-xs text-[#8b949e] leading-relaxed">
                  Admins can spin up multiple projects, each with their own custom questions, required fields, and survey logic.
                </p>
              </div>

              {/* Pillar 2: GPS Verification */}
              <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#2ea043]/10 border border-[#2ea043]/30 flex items-center justify-center text-[#2ea043]">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#f0f6fc]">GPS Geotagging</h3>
                <p className="text-xs text-[#8b949e] leading-relaxed">
                  Lock high-accuracy GPS coordinates at submission time to ensure enumerators are physically on-site.
                </p>
              </div>

              {/* Pillar 3: Photo & Visual Proof */}
              <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#58a6ff]/10 border border-[#58a6ff]/30 flex items-center justify-center text-[#58a6ff]">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#f0f6fc]">Photographic Audit</h3>
                <p className="text-xs text-[#8b949e] leading-relaxed">
                  Capture live device camera snapshots of facilities, classrooms, water points, or medical inventories.
                </p>
              </div>

              {/* Pillar 4: Instant CSV Export */}
              <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#f0f6fc]">1-Click Data Export</h3>
                <p className="text-xs text-[#8b949e] leading-relaxed">
                  Download sanitized CSV spreadsheets per project or globally for direct import into Excel, PowerBI, SPSS, or Stata.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security, Privacy & Google Compliance */}
        <section className="px-4 sm:px-8 py-16 max-w-4xl mx-auto space-y-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#238636]/15 border border-[#238636]/30 flex items-center justify-center mx-auto text-[#2ea043]">
            <Lock className="w-6 h-6" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-[#f0f6fc]">Protected, Compliant &amp; Confidential</h2>
            <p className="text-xs sm:text-sm text-[#8b949e] max-w-2xl mx-auto leading-relaxed">
              Base Metrics enforces strict role isolation with unique personal access codes. All project data is encrypted via TLS 1.3 and AES-256 on Google Cloud Firestore, in full compliance with the Google API Services User Data Policy.
            </p>
          </div>

          {/* Google OAuth Identity Purpose Box */}
          <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-2xl text-left space-y-2 max-w-2xl mx-auto">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#58a6ff]">
              <ShieldCheck className="w-4 h-4" />
              <span>How Base Metrics Uses Your Google Account</span>
            </div>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              Base Metrics uses Google Sign-In solely for authenticating approved personnel (Facilitators, Field Supervisors, and Project Administrators). We only request your basic email and display name to identify you within our system. We never access, read, or store any sensitive Google account data (such as Gmail, Google Drive, or Calendar). Your data is never sold, never shared with third parties, and never used for advertising.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#8b949e]">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2ea043]" />
              <span>TLS 1.3 Transport Security</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2ea043]" />
              <span>AES-256 Storage Encryption</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2ea043]" />
              <span>Zero Advertising or Data Resale</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2ea043]" />
              <span>One-Time User Activation Codes</span>
            </span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-semibold">
            <div className="flex items-center space-x-4">
              <Link to="/privacy" className="text-[#58a6ff] hover:underline flex items-center space-x-1">
                <span>Read Full Privacy Policy</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <span className="text-[#30363d]">|</span>
              <Link to="/terms" className="text-[#58a6ff] hover:underline flex items-center space-x-1">
                <span>Terms of Service</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <span className="hidden sm:inline text-[#30363d]">&bull;</span>
            <a 
              href="mailto:murtalaabdulsamad142@gmail.com" 
              className="text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
            >
              Support: murtalaabdulsamad142@gmail.com
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#30363d] bg-[#161b22] px-4 sm:px-8 py-8 text-xs text-[#8b949e]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.jpeg" 
              alt="Base Metrics Logo" 
              className="w-7 h-7 rounded-md object-contain bg-white p-0.5 border border-[#30363d] shrink-0" 
            />
            <span className="font-semibold text-[#f0f6fc]">Base Metrics Consulting</span>
            <span>&copy; {new Date().getFullYear()} Base Metrics Platform. Multi-Sector Data Collection.</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link to="/privacy" className="hover:text-[#f0f6fc] transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#f0f6fc] transition-colors">Terms of Service</Link>
            <button
              onClick={() => setIsDownloadOpen(true)}
              className="hover:text-[#f0f6fc] transition-colors cursor-pointer"
            >
              Mobile App
            </button>
            <Link to="/login" className="text-[#58a6ff] hover:underline font-semibold">Portal Sign In</Link>
          </div>
        </div>
      </footer>

      <AppDownloadModal 
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />
    </div>
  );
}
