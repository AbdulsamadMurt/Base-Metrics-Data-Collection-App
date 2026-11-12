import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, ShieldCheck, Mail, CheckCircle2, Lock } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#238636] selection:text-white">
      <div className="max-w-4xl mx-auto bg-[#161b22] rounded-2xl border border-[#30363d] p-6 sm:p-12 shadow-2xl space-y-10">
        
        {/* Navigation & Header */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/"
              className="inline-flex items-center text-xs font-semibold text-[#58a6ff] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Base Metrics Home
            </Link>
            <div className="flex items-center space-x-3">
              <Link
                to="/privacy"
                className="text-xs text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center text-xs font-semibold text-[#2ea043] hover:underline"
              >
                Go to Sign In
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4 pb-6 border-b border-[#30363d]">
            <img 
              src="/logo.jpeg" 
              alt="Base Metrics Logo" 
              className="w-14 h-14 rounded-2xl object-contain bg-white p-1 border border-[#30363d] shadow-md shrink-0" 
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#f0f6fc] tracking-tight">
                Terms of Service
              </h1>
              <p className="text-xs sm:text-sm text-[#8b949e] mt-1">
                Operational terms, acceptable use policies, and user responsibilities for Base Metrics
              </p>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded-xl flex items-center justify-between text-xs">
          <span className="text-[#8b949e]">Effective Date: November 2026</span>
          <span className="text-[#2ea043] font-semibold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active Enterprise Version</span>
          </span>
        </div>

        {/* Terms Content */}
        <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-[#c9d1d9]">
          
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-[#f0f6fc] flex items-center space-x-2">
              <span className="text-[#58a6ff]">1.</span>
              <span>Acceptance of Terms</span>
            </h2>
            <p>
              By accessing, browsing, registering for, or using the Base Metrics platform (&quot;Base Metrics&quot;, &quot;the Service&quot;, or &quot;the Platform&quot;), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service and our associated <Link to="/privacy" className="text-[#58a6ff] underline font-medium">Privacy Policy</Link>. If you do not agree with any provision of these terms, you must not access or use the Service.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-[#f0f6fc] flex items-center space-x-2">
              <span className="text-[#58a6ff]">2.</span>
              <span>Authorized Use &amp; Account Approval</span>
            </h2>
            <p>
              Base Metrics is a restricted, authenticated enterprise platform. Access is granted exclusively to vetted enumerators, field facilitators, supervisors, and administrative personnel participating in approved programs.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[#8b949e]">
              <li>
                <strong className="text-[#c9d1d9]">Google Authentication:</strong> All users must authenticate via Google Sign-In using their authorized Google account.
              </li>
              <li>
                <strong className="text-[#c9d1d9]">Administrative Approval:</strong> Upon registration, user accounts are placed in a pending state until vetted and approved by the lead system administrator.
              </li>
              <li>
                <strong className="text-[#c9d1d9]">One-Time Access Codes:</strong> Each registered user receives a unique personal activation code. You agree not to disclose, share, or transfer your access code or Google credentials to any third party.
              </li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-[#f0f6fc] flex items-center space-x-2">
              <span className="text-[#58a6ff]">3.</span>
              <span>Role-Specific Operational Guidelines</span>
            </h2>
            <div className="space-y-3">
              <div className="p-3.5 bg-[#0d1117] rounded-xl border border-[#21262d]">
                <strong className="text-[#f0f6fc]">Facilitators &amp; Field Enumerators:</strong>
                <p className="text-[#8b949e] mt-1 text-xs">
                  Authorized to record classroom lessons, verify daily disaggregated attendance (boys/girls), report teaching progress, and submit responses for their assigned project task. Submissions must accurately reflect real-world observations.
                </p>
              </div>

              <div className="p-3.5 bg-[#0d1117] rounded-xl border border-[#21262d]">
                <strong className="text-[#f0f6fc]">Field Supervisors:</strong>
                <p className="text-[#8b949e] mt-1 text-xs">
                  Authorized to conduct quality inspection visits at learning centers or task facilities, log on-site verification audits, capture high-accuracy GPS coordinates, and submit non-identifiable facility photographs as proof of physical presence.
                </p>
              </div>

              <div className="p-3.5 bg-[#0d1117] rounded-xl border border-[#21262d]">
                <strong className="text-[#f0f6fc]">Administrators:</strong>
                <p className="text-[#8b949e] mt-1 text-xs">
                  Authorized to manage multi-sector projects, configure custom survey questions, assign enumerators, approve accounts, audit submissions, and export sanitized CSV analytical datasets.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-[#f0f6fc] flex items-center space-x-2">
              <span className="text-[#58a6ff]">4.</span>
              <span>Data Integrity &amp; Prohibition of Fraudulent Submissions</span>
            </h2>
            <p>
              The integrity of data collected through Base Metrics is paramount. Users agree to submit only truthful, verifiable, and contemporaneous observations. The following actions constitute immediate grounds for account revocation and administrative notification:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#8b949e]">
              <li>Falsification of student attendance figures or comprehension scores.</li>
              <li>Attempting to mock, spoof, or manipulate GPS device coordinates.</li>
              <li>Uploading fraudulent, fabricated, or previously captured photographs.</li>
              <li>Unauthorized attempts to bypass the administrator master password or alter other users&apos; submissions.</li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-[#f0f6fc] flex items-center space-x-2">
              <span className="text-[#58a6ff]">5.</span>
              <span>Offline Data Entry &amp; Automatic Synchronization</span>
            </h2>
            <p>
              Base Metrics incorporates Progressive Web App (PWA) offline outbox caching. When working in areas without mobile coverage, field records are cached locally on your device and synchronized to Google Cloud Firestore when network connectivity is detected. Users are responsible for ensuring their devices connect to the internet periodically to complete synchronization.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-[#f0f6fc] flex items-center space-x-2">
              <span className="text-[#58a6ff]">6.</span>
              <span>Termination of Access</span>
            </h2>
            <p>
              We reserve the right to suspend or terminate user accounts immediately and without prior notice in the event of any material breach of these Terms, unauthorized access attempts, or at the conclusion of the assigned field monitoring project.
            </p>
          </section>

          <section className="space-y-4 pt-4 border-t border-[#30363d]">
            <h2 className="text-base font-bold text-[#f0f6fc] flex items-center space-x-2">
              <span className="text-[#58a6ff]">7.</span>
              <span>Contact &amp; Administrative Inquiries</span>
            </h2>
            <p className="text-[#8b949e]">
              For questions concerning these Terms of Service, project assignments, or account access, please contact:
            </p>

            <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-[#f0f6fc] font-bold">Base Metrics Administration</p>
                <p className="text-xs text-[#8b949e]">Operations &amp; Security Coordinator</p>
              </div>
              <a
                href="mailto:murtalaabdulsamad142@gmail.com"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-semibold text-[#f0f6fc] rounded-xl transition-colors"
              >
                <Mail className="w-4 h-4 text-[#2ea043]" />
                <span>murtalaabdulsamad142@gmail.com</span>
              </a>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-[#30363d] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8b949e]">
          <span>&copy; {new Date().getFullYear()} Base Metrics Platform. All rights reserved.</span>
          <div className="flex space-x-4">
            <Link to="/privacy" className="hover:text-[#f0f6fc]">Privacy Policy</Link>
            <Link to="/login" className="hover:text-[#f0f6fc]">Sign In</Link>
            <Link to="/" className="hover:text-[#f0f6fc]">Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
