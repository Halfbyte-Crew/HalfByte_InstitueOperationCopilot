import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  ArrowLeft,
  Lock,
  Eye,
  FileText,
  UserCheck,
  Server,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';

export function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting — elegant indigo and sky blues, no purple */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-8">
        {/* Navigation & Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">EduPilot</h1>
              <p className="text-xs text-indigo-300">Institute Operations &amp; Copilot</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700/80 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        </div>

        {/* Hero Card */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-2xl p-8 sm:p-10 shadow-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <Shield className="w-3.5 h-3.5" />
            Institutional Data Governance
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Privacy &amp; Data Protection Policy
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Effective Date: October 17, 2026 &bull; Version 2.4 &bull; Applicable to All Administrators, Faculty, Counselors, and Students
          </p>
          <p className="text-sm text-slate-300 leading-relaxed pt-2">
            EduPilot is committed to upholding rigorous standards of privacy, security, and institutional confidentiality. This Privacy Policy governs the collection, processing, storage, and retention of academic, financial, and operational records within our unified management information platform.
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white text-slate-800 rounded-2xl p-8 sm:p-10 shadow-2xl border border-slate-100 space-y-8">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-indigo-700 font-bold text-lg">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              <h3>1. Information We Collect</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              We process records necessary for educational administration and statutory institutional operations:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5 pl-2">
              <li><strong>Student Profiles:</strong> Full name, registration number, email address, telephone number, academic background, course enrollments, and batch assignments.</li>
              <li><strong>Academic &amp; Attendance Records:</strong> Daily session check-ins, attendance statuses (Present, Absent, Late, Excused), faculty observations, and course progress milestones.</li>
              <li><strong>Financial Data (Restricted Access):</strong> Structured tuition installments, payment dates, bank reference receipts, and reconciliation ledger audit records.</li>
              <li><strong>Faculty &amp; Staff Information:</strong> Identity details, professional specialization, class schedules, and institutional role assignments.</li>
              <li><strong>Technical Metadata:</strong> Authenticated session tokens (JWT), audit trail event timestamps, and IP access logs for security auditing.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2.5 text-indigo-700 font-bold text-lg">
              <Lock className="w-5 h-5 text-indigo-600" />
              <h3>2. Strict Role-Based Access Control (RBAC) &amp; Financial Isolation</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              EduPilot strictly isolates operational domains at the API and database schema levels:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-800 block">Faculty / Trainer Isolation:</span>
                <p className="text-slate-600">Trainers and instructors are strictly prevented from viewing student tuition fees, balances, discount waivers, or payment history.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-800 block">Dual-Control Approvals:</span>
                <p className="text-slate-600">Sensitive operational modifications (fee waivers, batch transfers, course cancellations) require Administrator dual-authorization.</p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2.5 text-indigo-700 font-bold text-lg">
              <Server className="w-5 h-5 text-indigo-600" />
              <h3>3. Data Security &amp; Storage Architecture</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              All credentials are cryptographically protected using salted <strong>Bcrypt</strong> password hashes (minimum work factor 12). Raw plaintext passwords are never stored, logged, or serialized across API payloads.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Data is stored in relational PostgreSQL databases equipped with asynchronous connection pools, SSL transport encryption, and immutable audit logging.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2.5 text-indigo-700 font-bold text-lg">
              <Eye className="w-5 h-5 text-indigo-600" />
              <h3>4. Artificial Intelligence &amp; RAG Copilot Governance</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              EduPilot incorporates an institutional Retrieval-Augmented Generation (RAG) assistant. The assistant indexes institutional policies, syllabus documents, and regulations. It operates under strict constraints:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5 pl-2">
              <li>The AI Copilot does not ingest personal student contact details or private financial balances into public vector indices.</li>
              <li>Queries synthesize grounded answers strictly with verified source citations (document title and physical page number).</li>
              <li>When verified institutional documentation is absent, the system refuses to fabricate answers.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2.5 text-indigo-700 font-bold text-lg">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3>5. Data Retention &amp; Student Rights</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Academic transcripts, attendance logs, and financial invoices are retained in accordance with educational accreditation guidelines. Students may inspect their personal academic progress records and request corrections by contacting the Institute Operations Office.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2.5 text-indigo-700 font-bold text-lg">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <h3>6. Data Protection Officer &amp; Inquiries</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              For security disclosures, data privacy inquiries, or regulatory compliance verification, please contact:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-700">
              <p><strong>EduPilot Institutional Privacy &amp; Compliance Office</strong></p>
              <p>Email: <a href="mailto:privacy@edupilot.io" className="text-indigo-600 underline font-semibold">privacy@edupilot.io</a></p>
              <p>Physical Address: Operations Directorate, EduPilot Academy Campus, Knowledge City</p>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4 pt-4 border-t border-slate-800">
          <p>&copy; 2026 EduPilot Operations Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="text-indigo-300 hover:text-white transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link to="/login" className="text-indigo-300 hover:text-white transition-colors">
              Sign In to Hub
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
