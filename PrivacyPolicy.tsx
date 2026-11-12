import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Lock, 
  Mail, 
  CheckCircle2, 
  FileText, 
  Database, 
  MapPin, 
  Globe, 
  Trash2, 
  Server, 
  WifiOff, 
  EyeOff,
  UserCheck
} from 'lucide-react';

export default function PrivacyPolicy() {
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
                to="/terms"
                className="text-xs text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
              >
                Terms of Service
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
                Privacy Policy &amp; Data Protection
              </h1>
              <p className="text-xs sm:text-sm text-[#8b949e] mt-1">
                Official privacy disclosures for the Base Metrics Universal Multi-Sector Field Data Collection &amp; Monitoring Platform
              </p>
            </div>
          </div>
        </div>

        {/* Compliance Badges */}
        <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-[#8b949e]">
            <span className="font-semibold text-[#f0f6fc]">Last Updated:</span>
            <span>November 2026</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-[#238636]/15 border border-[#238636]/30 text-[#2ea043] font-semibold text-[11px] flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Google API Services User Data Policy Compliant</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#58a6ff]/15 border border-[#58a6ff]/30 text-[#58a6ff] font-semibold text-[11px]">
              Limited Use Verified
            </span>
          </div>
        </div>

        {/* Policy Body */}
        <div className="space-y-8 text-xs sm:text-sm leading-relaxed text-[#c9d1d9]">
          
          {/* Section 1: Overview */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[#f0f6fc] flex items-center space-x-2">
              <span className="text-[#2ea043]">1.</span>
              <span>Overview &amp; Application Purpose</span>
            </h2>
            <p>
              Welcome to <strong className="text-[#f0f6fc]">Base Metrics</strong> (&quot;the Platform&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). Base Metrics is a professional, multi-sector web and mobile data collection, verification, and monitoring system built to assist organizations, research teams, non-governmental organizations (NGOs), community supervisors, and field enumerators.
            </p>
            <p>
              The platform serves diverse public welfare sectors including <strong className="text-[#f0f6fc]">Education &amp; Literacy</strong> (monitoring attendance, lesson progression, and facility readiness), <strong className="text-[#f0f6fc]">Healthcare &amp; Clinical Outreach</strong> (triage, immunization records, supply inventory), <strong className="text-[#f0f6fc]">Agriculture &amp; Food Security</strong> (farm plot GPS boundary mapping, crop yield surveys), <strong className="text-[#f0f6fc]">Water, Sanitation &amp; Hygiene (WASH)</strong> (borehole audits, water quality tests), and <strong className="text-[#f0f6fc]">Custom Survey Campaigns</strong>.
            </p>
            <p>
              This Privacy Policy details the exact categories of data we collect, why we collect it, how it is secured, and your explicit rights regarding your personal information.
            </p>
          </section>

          {/* Section 2: Google User Data Policy & Limited Use Disclosure */}
          <section className="space-y-3 p-5 bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-2xl">
            <h2 className="text-base sm:text-lg font-bold text-[#f0f6fc] flex items-center space-x-2">
              <span className="text-[#58a6ff]">2.</span>
              <span>Google API Services User Data Policy &amp; Limited Use Disclosure</span>
            </h2>
            <p className="text-[#f0f6fc] font-medium">
              Base Metrics complies strictly with the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[#58a6ff] underline font-bold">Google API Services User Data Policy</a>, including the Limited Use requirements:
            </p>
            
            <div className="space-y-2.5 text-xs text-[#c9d1d9] pt-2">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#2ea043] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-[#f0f6fc]">Basic Identity Authentication Only:</strong> Base Metrics requests only basic user authentication scopes (<code className="bg-[#0d1117] px-1.5 py-0.5 rounded text-[#58a6ff]">openid</code>, <code className="bg-[#0d1117] px-1.5 py-0.5 rounded text-[#58a6ff]">email</code>, <code className="bg-[#0d1117] px-1.5 py-0.5 rounded text-[#58a6ff]">profile</code>) through Google Sign-In via Firebase Authentication. We use this strictly to verify the identity of authorized field personnel, associate their accounts with administrative roles (Enumerator/Facilitator, Supervisor, or Administrator), and link submitted field records to their authorized profile.
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#2ea043] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-[#f0f6fc]">No Sensitive Google Scopes:</strong> Base Metrics does NOT request, access, read, or store sensitive or restricted Google user data such as Google Drive files, Gmail messages, Google Calendar entries, Google Contacts, or Google Photos.
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#2ea043] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-[#f0f6fc]">Zero Advertising or Commercial Data Resale:</strong> Information received from Google APIs is never used to serve personalized, retargeted, or interest-based advertisements. We never sell, rent, license, or monetize Google user data to data brokers, ad networks, or external commercial parties.
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#2ea043] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-[#f0f6fc]">No AI/ML Model Training:</strong> Google user data and personal authentication tokens are not used to train generalized artificial intelligence (AI) or machine learning (ML) models.
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#2ea043] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-[#f0f6fc]">Strict Human Access Restrictions:</strong> Humans are strictly prohibited from viewing raw Google user data unless you have given affirmative consent for targeted technical support, it is necessary to investigate security breaches, or as required by law.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Information We Collect */}
          <section className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-[#f0f6fc] flex items-center space-x-2">
              <span className="text-[#2ea043]">3.</span>
              <span>Categories of Data Collected</span>
            </h2>
            <p>
              To provide our field monitoring capabilities, Base Metrics collects only the following categories of data:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-4 bg-[#0d1117] border border-[#21262d] rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-[#58a6ff] font-semibold text-xs">
                  <UserCheck className="w-4 h-4" />
                  <span>A. Personnel Account Credentials</span>
                </div>
                <p className="text-xs text-[#8b949e]">
                  Full name, Google primary email address, unique Google UID, system role (Facilitator, Supervisor, Admin), account approval status, and a unique one-time access code issued by the administrator.
                </p>
              </div>

              <div className="p-4 bg-[#0d1117] border border-[#21262d] rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-[#2ea043] font-semibold text-xs">
                  <Database className="w-4 h-4" />
                  <span>B. Observational Field &amp; Survey Data</span>
                </div>
                <p className="text-xs text-[#8b949e]">
                  Daily attendance headcounts (boys/girls disaggregation), radio lesson tracking, teaching comprehension metrics, clinic supplies, borehole functional status, crop harvests, and custom responses defined by project administrators.
                </p>
              </div>

              <div className="p-4 bg-[#0d1117] border border-[#21262d] rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-[#bc8cff] font-semibold text-xs">
                  <MapPin className="w-4 h-4" />
                  <span>C. Geolocation Coordinates (GPS)</span>
                </div>
                <p className="text-xs text-[#8b949e]">
                  Device latitude, longitude, and accuracy radius collected exclusively at the precise moment a supervisor or enumerator submits a report to certify on-site physical presence. We do NOT run continuous background location tracking.
                </p>
              </div>

              <div className="p-4 bg-[#0d1117] border border-[#21262d] rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs">
                  <WifiOff className="w-4 h-4" />
                  <span>D. Offline Cache &amp; Outbox Storage</span>
                </div>
                <p className="text-xs text-[#8b949e]">
                  When field enumerators work in remote rural areas without cellular network coverage, form drafts and pending submissions are temporarily encrypted in browser <code className="bg-[#161b22] px-1 text-white">localStorage</code> and synchronized automatically upon reconnection.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Children's Privacy */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[#f0f6fc] flex items-center space-x-2">
              <span className="text-[#2ea043]">4.</span>
              <span>Children&apos;s Privacy (COPPA Compliance)</span>
            </h2>
            <p>
              Base Metrics is an enterprise tool used by adult enumerators and supervisors. In educational programs, our system collects aggregate numerical data (such as total attendance counts and aggregate literacy performance levels). 
            </p>
            <p className="text-[#8b949e]">
              <strong className="text-[#c9d1d9]">We strictly prohibit and do not collect:</strong> individual student names, home addresses, dates of birth, student identification numbers, or identifiable close-up photographs of children. All classroom verification photographs must focus on room layout, attendance boards, or facility structures.
            </p>
          </section>

          {/* Section 5: Data Storage, Hosting & Security */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[#f0f6fc] flex items-center space-x-2">
              <span className="text-[#2ea043]">5.</span>
              <span>Data Hosting, Encryption &amp; Security Safeguards</span>
            </h2>
            <p>
              All platform information is hosted on Google Cloud Platform (GCP) infrastructure with enterprise-grade protections:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[#8b949e]">
              <li>
                <strong className="text-[#c9d1d9]">Transport Layer Security (TLS 1.3):</strong> All network traffic between client browsers, mobile devices, and server endpoints is enforced via HTTPS and TLS 1.3 cryptographic protocols.
              </li>
              <li>
                <strong className="text-[#c9d1d9]">Storage Encryption (AES-256):</strong> Data stored within Google Cloud Firestore and Cloud Storage is protected at rest with AES-256 encryption.
              </li>
              <li>
                <strong className="text-[#c9d1d9]">Granular Firestore Security Rules:</strong> Server-side security rules validate every read and write request. Unauthenticated visitors cannot access reports, and users are strictly limited to their authorized data scope.
              </li>
              <li>
                <strong className="text-[#c9d1d9]">Master Password &amp; Activation Codes:</strong> The admin command center is safeguarded by master password verification, and all field personnel require one-time unique access codes before their accounts become active.
              </li>
            </ul>
          </section>

          {/* Section 6: Data Retention & User Rights */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[#f0f6fc] flex items-center space-x-2">
              <span className="text-[#2ea043]">6.</span>
              <span>Data Retention, User Rights &amp; Account Deletion</span>
            </h2>
            <p>
              We retain field data only for as long as necessary to fulfill the monitoring, reporting, and analytical purposes of the associated project cycle, or until deletion is formally requested.
            </p>
            <p className="text-[#8b949e]">
              Under applicable data protection frameworks (including GDPR, CCPA, and regional data protection regulations), you have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#8b949e]">
              <li>Request an export copy of all records and submissions linked to your user profile.</li>
              <li>Request correction or rectification of erroneous profile information.</li>
              <li>Request permanent deletion of your account and all associated personal data from our systems.</li>
            </ul>

            <div className="p-4 bg-[#0d1117] border border-[#30363d] rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-red-400">
                <Trash2 className="w-4 h-4" />
                <span>How to Request Permanent Account &amp; Data Deletion</span>
              </div>
              <p className="text-xs text-[#8b949e] leading-relaxed">
                To request permanent deletion of your Base Metrics user account and submitted data, send an email to <a href="mailto:murtalaabdulsamad142@gmail.com" className="text-[#58a6ff] underline font-semibold">murtalaabdulsamad142@gmail.com</a> with the subject line <code className="bg-[#161b22] px-1 text-white">Data Deletion Request - Base Metrics</code> from your registered Google email address. We will permanently delete your authentication record and personal profile within 48 business hours and provide confirmation.
              </p>
            </div>
          </section>

          {/* Section 7: Third-Party Service Providers */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[#f0f6fc] flex items-center space-x-2">
              <span className="text-[#2ea043]">7.</span>
              <span>Third-Party Subprocessors &amp; Service Providers</span>
            </h2>
            <p>
              We do not share your data with third parties except as strictly necessary to host and execute the Base Metrics application:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#8b949e]">
              <li>
                <strong className="text-[#c9d1d9]">Google Cloud &amp; Firebase (Google LLC):</strong> Cloud infrastructure, managed Firestore database, user authentication services, and SSL termination.
              </li>
            </ul>
            <p className="text-[#8b949e]">
              We do not employ any third-party behavioral advertising scripts, analytics cookies, or social media tracking pixels.
            </p>
          </section>

          {/* Section 8: Developer & Contact Information */}
          <section className="space-y-4 pt-4 border-t border-[#30363d]">
            <h2 className="text-base sm:text-lg font-bold text-[#f0f6fc] flex items-center space-x-2">
              <span className="text-[#2ea043]">8.</span>
              <span>Contact Information &amp; Data Controller</span>
            </h2>
            <p className="text-[#8b949e]">
              If you have any questions, compliance inquiries, or concerns regarding this Privacy Policy or our data protection practices, please contact our lead platform administrator directly:
            </p>

            <div className="p-5 bg-[#0d1117] border border-[#30363d] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-[#f0f6fc] font-bold text-sm">Base Metrics Administration &amp; Data Lead</p>
                <p className="text-xs text-[#8b949e] mt-0.5">Murtala Abdulsamad &bull; Project Lead &amp; Operations Coordinator</p>
                <p className="text-[11px] text-[#8b949e]">Universal Multi-Sector Field Monitoring Platform</p>
              </div>

              <a
                href="mailto:murtalaabdulsamad142@gmail.com"
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-semibold text-[#f0f6fc] rounded-xl transition-colors shrink-0 shadow-sm"
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
            <Link to="/terms" className="hover:text-[#f0f6fc]">Terms of Service</Link>
            <Link to="/login" className="hover:text-[#f0f6fc]">Sign In</Link>
            <Link to="/" className="hover:text-[#f0f6fc]">Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
