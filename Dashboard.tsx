import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { ClassReport, VisitReport, UserProfile, Project } from '../types';
import { 
  ClipboardList, 
  MapPin, 
  Users, 
  Calendar,
  ArrowRight,
  User,
  ShieldCheck,
  FolderKanban,
  QrCode,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import AppDownloadModal from '../components/AppDownloadModal';

const Dashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const [recentReports, setRecentReports] = useState<ClassReport[]>([]);
  const [recentVisits, setRecentVisits] = useState<VisitReport[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [userCounts, setUserCounts] = useState({
    facilitators: 0,
    supervisors: 0,
    b1Tasks: 0,
    admins: 0,
    pending: 0,
    totalActive: 0
  });
  const [stats, setStats] = useState({ reports: 0, visits: 0 });
  const [loading, setLoading] = useState(true);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !profile) return;

      try {
        // Fetch recent reports
        let reportsQuery;
        if (profile.role === 'facilitator') {
          reportsQuery = query(collection(db, 'reports'), where('facilitatorId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
        } else {
          reportsQuery = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(5));
        }
        
        const reportsSnap = await getDocs(reportsQuery);
        setRecentReports(reportsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as ClassReport)));

        // Fetch recent visits
        let visitsQuery = null;
        if (profile.role === 'supervisor') {
          visitsQuery = query(collection(db, 'visits'), where('supervisorId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
        } else if (profile.role === 'admin') {
          visitsQuery = query(collection(db, 'visits'), orderBy('createdAt', 'desc'), limit(5));
        }
        
        let visitsCount = 0;
        if (visitsQuery) {
          const visitsSnap = await getDocs(visitsQuery);
          setRecentVisits(visitsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as VisitReport)));
          visitsCount = visitsSnap.size;
        }

        // Fetch all users to accurately differentiate active supervisors and facilitators
        const usersSnap = await getDocs(collection(db, 'users'));
        const allUsers = usersSnap.docs.map(d => d.data() as UserProfile);

        const facilitatorsCount = allUsers.filter(u => u.role === 'facilitator' && u.approvalStatus !== 'pending').length;
        const supervisorsCount = allUsers.filter(u => u.role === 'supervisor' && u.approvalStatus !== 'pending').length;
        const b1TasksCount = allUsers.filter(u => u.role === 'b1_task' && u.approvalStatus !== 'pending').length;
        const adminsCount = allUsers.filter(u => u.role === 'admin').length;
        const pendingCount = allUsers.filter(u => u.approvalStatus === 'pending').length;

        setUserCounts({
          facilitators: facilitatorsCount,
          supervisors: supervisorsCount,
          b1Tasks: b1TasksCount,
          admins: adminsCount,
          pending: pendingCount,
          totalActive: facilitatorsCount + supervisorsCount + b1TasksCount + adminsCount
        });

        // Fetch active projects
        try {
          const projectsSnap = await getDocs(query(collection(db, 'projects'), limit(4)));
          setActiveProjects(projectsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
        } catch (e) {
          // Projects collection may be empty initially
        }

        setStats({
          reports: reportsSnap.size,
          visits: visitsCount
        });
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, profile]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-28 bg-[#161b22] border border-[#30363d] rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-[#161b22] border border-[#30363d] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with GitHub / Micro1 styling */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#21262d]">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[#f0f6fc]">Welcome back, {profile?.name}</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#238636]/15 border border-[#238636]/30 text-[#2ea043]">
              {profile?.role}
            </span>
          </div>
          <p className="text-xs text-[#8b949e] mt-1">
            Real-time data collection overview and sector performance metrics.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsDownloadOpen(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-semibold text-[#f0f6fc] rounded-xl transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-[#2ea043]" />
            <span>Mobile App Barcode</span>
          </button>

          {profile?.role === 'admin' && (
            <Link
              to="/admin"
              className="px-3.5 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <FolderKanban className="w-4 h-4" />
              <span>Admin Projects Hub</span>
            </Link>
          )}

          {profile?.role === 'facilitator' && (
            <Link
              to="/facilitator"
              className="px-3.5 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Submit Class Report</span>
            </Link>
          )}

          {profile?.role === 'supervisor' && (
            <Link
              to="/supervisor"
              className="px-3.5 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <MapPin className="w-4 h-4" />
              <span>Record Facility Visit</span>
            </Link>
          )}
        </div>
      </header>

      {/* Differentiated User Metrics (Supervisors vs Facilitators) */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
          Active Sector Personnel & Deployment
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Facilitators */}
          <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-2xl space-y-2 hover:border-[#58a6ff] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#8b949e]">Active Facilitators</span>
              <div className="w-8 h-8 rounded-lg bg-[#58a6ff]/10 border border-[#58a6ff]/30 flex items-center justify-center text-[#58a6ff]">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-[#f0f6fc]">
              {userCounts.facilitators}
            </p>
            <div className="text-[11px] text-[#8b949e] flex items-center space-x-1 pt-1 border-t border-[#21262d]">
              <span className="w-2 h-2 rounded-full bg-[#58a6ff]"></span>
              <span>Submitting classroom reports</span>
            </div>
          </div>

          {/* Active Supervisors */}
          <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-2xl space-y-2 hover:border-[#2ea043] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#8b949e]">Active Supervisors</span>
              <div className="w-8 h-8 rounded-lg bg-[#238636]/10 border border-[#238636]/30 flex items-center justify-center text-[#2ea043]">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-[#f0f6fc]">
              {userCounts.supervisors}
            </p>
            <div className="text-[11px] text-[#8b949e] flex items-center space-x-1 pt-1 border-t border-[#21262d]">
              <span className="w-2 h-2 rounded-full bg-[#2ea043]"></span>
              <span>Conducting GPS field visits</span>
            </div>
          </div>

          {/* Total Reports Filed */}
          <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-2xl space-y-2 hover:border-[#bc8cff] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#8b949e]">Class Reports Filed</span>
              <div className="w-8 h-8 rounded-lg bg-[#bc8cff]/10 border border-[#bc8cff]/30 flex items-center justify-center text-[#bc8cff]">
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-[#f0f6fc]">
              {stats.reports}
            </p>
            <div className="text-[11px] text-[#8b949e] flex items-center space-x-1 pt-1 border-t border-[#21262d]">
              <span className="w-2 h-2 rounded-full bg-[#bc8cff]"></span>
              <span>Attendance & curriculum data</span>
            </div>
          </div>

          {/* Pending Registrations */}
          <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-2xl space-y-2 hover:border-amber-500 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#8b949e]">Pending Approvals</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-[#f0f6fc]">
              {userCounts.pending}
            </p>
            <div className="text-[11px] text-[#8b949e] flex items-center space-x-1 pt-1 border-t border-[#21262d]">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Awaiting admin review</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Data Collection Projects / Tasks */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
          <div className="flex items-center space-x-2">
            <FolderKanban className="w-4 h-4 text-[#58a6ff]" />
            <h2 className="text-sm font-bold text-[#f0f6fc]">Assigned Data Collection Projects</h2>
          </div>
          {profile?.role === 'admin' && (
            <Link
              to="/admin"
              className="text-xs font-semibold text-[#58a6ff] hover:underline flex items-center space-x-1"
            >
              <span>Manage Projects & Questions</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          )}
        </div>

        {activeProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeProjects.map(p => (
              <div key={p.id} className="p-3.5 bg-[#0d1117] border border-[#21262d] rounded-xl space-y-2 hover:border-[#30363d] transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#f0f6fc]">{p.name}</span>
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                    p.status === 'active' ? "bg-[#238636]/15 text-[#2ea043] border border-[#238636]/30" : "bg-gray-500/10 text-gray-400"
                  )}>
                    {p.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#8b949e] line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between text-[10px] text-[#8b949e] pt-2 border-t border-[#21262d]">
                  <span>Goal: {p.targetSubmissions || 50} reports</span>
                  <span className="font-mono text-[#58a6ff]">{p.customQuestions?.length || 0} custom questions</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-[#0d1117] rounded-xl border border-dashed border-[#30363d] text-center space-y-2">
            <p className="text-xs text-[#8b949e]">
              Default Education Program is currently active across all LGAs.
            </p>
            {profile?.role === 'admin' && (
              <Link
                to="/admin"
                className="inline-flex items-center text-xs font-semibold text-[#2ea043] hover:underline"
              >
                + Create custom task project in Admin Hub
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Class Reports */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#21262d] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-4 h-4 text-[#58a6ff]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#f0f6fc]">Recent Class Reports</h2>
            </div>
            <Link to="/facilitator" className="text-xs text-[#58a6ff] hover:underline flex items-center">
              View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-[#21262d]">
            {recentReports.length > 0 ? recentReports.map((report) => (
              <div key={report.id} className="p-3.5 hover:bg-[#21262d]/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-xs font-semibold text-[#f0f6fc]">{report.topics}</p>
                    <p className="text-[11px] text-[#8b949e]">
                      {report.learningCenterName || 'Learning Center'} {report.lga ? `• ${report.lga}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {report.photoUrl && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-[#238636]/15 text-[#2ea043] border border-[#238636]/30 rounded">
                        Photo
                      </span>
                    )}
                    <span className="text-xs font-mono font-medium px-2 py-0.5 bg-[#58a6ff]/10 text-[#58a6ff] rounded-md border border-[#58a6ff]/20">
                      {report.attendance} Students
                    </span>
                  </div>
                </div>
                <div className="flex items-center text-[11px] text-[#8b949e] space-x-4 mt-2">
                  <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {format(new Date(report.date), 'MMM d, yyyy')}</span>
                  <span className="flex items-center capitalize"><User className="w-3 h-3 mr-1" /> {report.facilitatorName}</span>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-xs text-[#8b949e]">No class reports filed yet.</div>
            )}
          </div>
        </div>

        {/* Recent Facility Visits */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#21262d] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-[#2ea043]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#f0f6fc]">Recent Facility Visits</h2>
            </div>
            <Link to="/supervisor" className="text-xs text-[#58a6ff] hover:underline flex items-center">
              View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-[#21262d]">
            {recentVisits.length > 0 ? recentVisits.map((visit) => (
              <div key={visit.id} className="p-3.5 hover:bg-[#21262d]/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-xs font-semibold text-[#f0f6fc]">Visit to {visit.facilitatorName}</p>
                    <p className="text-[11px] text-[#8b949e]">
                      {visit.learningCenterName || 'Learning Center'} {visit.lga ? `• ${visit.lga}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {visit.gpsLocation && (
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/20 rounded">
                        GPS
                      </span>
                    )}
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-md",
                      visit.resourcesAvailable 
                        ? "bg-[#238636]/15 text-[#2ea043] border border-[#238636]/30" 
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    )}>
                      {visit.resourcesAvailable ? 'Resources OK' : 'Resources Deficit'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center text-[11px] text-[#8b949e] space-x-4 mt-2">
                  <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {format(new Date(visit.date), 'MMM d, yyyy')}</span>
                  <span className="flex items-center capitalize"><User className="w-3 h-3 mr-1" /> {visit.supervisorName}</span>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-xs text-[#8b949e]">No facility visits filed yet.</div>
            )}
          </div>
        </div>
      </div>

      <AppDownloadModal 
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
