import React, { useState } from 'react';
import { X, Award, AlertCircle, CheckCircle } from 'lucide-react';
import { addAcademicObservation } from '../../dashboardApi';

const OBSERVATION_TYPES = [
  { value: 'Feedback', label: 'Pedagogical Feedback' },
  { value: 'Milestone', label: 'Curriculum Milestone' },
  { value: 'Academic Concern', label: 'Academic Concern / Follow-up' },
  { value: 'Commendation', label: 'Faculty Commendation' },
];

export function AcademicObservationModal({
  isOpen,
  onClose,
  student,
  batchId,
  onObservationAdded,
}) {
  const [observationType, setObservationType] = useState('Feedback');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) {
      setError('Please provide observation details.');
      return;
    }
    if (!batchId) {
      setError('A valid batch assignment is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addAcademicObservation(student.id, {
        batch_id: batchId,
        observation_type: observationType,
        note: note.trim(),
      });
      setNote('');
      if (onObservationAdded) onObservationAdded();
      onClose();
    } catch (err) {
      console.error('Failed to save academic observation:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to save observation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Academic Observation</h3>
                <p className="text-xs text-slate-500">{student?.name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Observation Classification
              </label>
              <select
                value={observationType}
                onChange={(e) => setObservationType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              >
                {OBSERVATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Observation & Guidance Notes
              </label>
              <textarea
                rows={4}
                required
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Document student's conceptual comprehension, code review remarks, or recommended focus areas..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 resize-none"
              />
              <p className="text-2xs text-slate-400 mt-1">
                Will be preserved with your faculty signature and timestamp.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !note.trim()}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Observation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
