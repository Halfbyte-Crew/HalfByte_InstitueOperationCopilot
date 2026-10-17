import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  ArrowLeft,
  ShieldAlert,
  GraduationCap,
  Scale,
  CreditCard,
  UserCheck,
  AlertOctagon,
  Clock,
} from 'lucide-react';

export function TermsConditionsPage() {
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
            <Scale className="w-3.5 h-3.5" />
            Institutional Governance &amp; Operating Agreement
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Terms &amp; Conditions of Service
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Effective Date: October 17, 2026 &bull; Version 2.4 &bull; Mandatory Institutional Operating Standards
          </p>
          <p className="text-sm text-slate-300 leading-relaxed pt-2">
            These Terms and Conditions constitute a legally binding agreement between you (as an authorized Administrator, Faculty Member, Counselor, Finance Officer, or Enrolled Student) and the Institution regarding your access to and utilization of the EduPilot platform.
          </p>
        </div>

        {/* Content Body */}
        <div className="bg-white text-slate-800 rounded-2xl p-8 sm:p-10 shadow-2xl border border-slate-100 space-y-8">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-indigo-700 font-bold text-lg">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              <h3>1. Authorized Access &amp; Account Responsibility</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Access to EduPilot is granted exclusively to registered institutional personnel and enrolled students. You agree to:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5 pl-2">
              <li>Maintain the confidentiality of your credentials. Sharing login passwords or account access with unauthorized parties is strictly prohibited.</li>
              <li>Notify the Institute Operations Administrator immediately upon discovering any unauthorized session activity or security compromise.</li>
              <li>Authenticate exclusively through authorized institutional endpoints using your designated credentials.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2.5 text-indigo-700 font-bold text-lg">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              <h3>2. Role-Based Boundaries &amp; Data Integrity</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Users must respect system role boundaries. Attempting to bypass endpoint restrictions, inspect unauthorized student tuition accounts, or tamper with attendance records constitutes a material violation:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-800 block">Attendance &amp; Academic Logs:</span>
                <p className="text-slate-600">Trainers must record authentic attendance for assigned cohorts. Falsification of attendance or completion records triggers disciplinary review.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-800 block">Dual-Control Enforcement:</span>
                <p className="text-slate-600">Fee adjustments, installment waivers, and batch migrations are non-binding until approved by an Administrator in the approvals queue.</p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2.5 text-indigo-700 font-bold text-lg">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <h3>3. Tuition Fee Regulations &amp; Installments</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Tuition fee schedules, installment due dates, and payment reconciliation are subject to institutional academic policies:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5 pl-2">
              <li>Tuition installments must be remitted on or before the designated installment due dates.</li>
              <li>Official digital receipts are issued upon verified payment reconciliation by the Finance Department.</li>
              <li>Refund, deferral, and batch transfer policies are governed by statutory institutional regulations.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2.5 text-indigo-700 font-bold text-lg">
              <FileCheck2 className="w-5 h-5 text-indigo-600" />
              <h3>4. Academic Conduct &amp; Student Portal Activation</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Student portal accounts are provisioned by instructional faculty via single-use verification links. Enrolled students are expected to maintain at least <strong>75% attendance</strong> across scheduled batch modules to remain in good academic standing.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2.5 text-indigo-700 font-bold text-lg">
              <AlertOctagon className="w-5 h-5 text-indigo-600" />
              <h3>5. Prohibited Conduct &amp; System Abuse</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              The following activities are strictly prohibited and may result in immediate revocation of access and legal recourse:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5 pl-2">
              <li>Reverse-engineering, decompiling, or executing automated scraping against private API routes.</li>
              <li>Injecting malicious scripts, SQL payloads, or disrupting system concurrency.</li>
              <li>Exfiltrating non-public student rosters, contact lists, or financial ledgers.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2.5 text-indigo-700 font-bold text-lg">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h3>6. Platform Availability &amp; Amendments</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              The institute strives for continuous 24/7 platform availability. Scheduled maintenance windows will be communicated via administrative announcements. The institute reserves the right to modify these terms with reasonable prior notice to authorized users.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4 pt-4 border-t border-slate-800">
          <p>&copy; 2026 EduPilot Operations Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-indigo-300 hover:text-white transition-colors">
              Privacy Policy
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
