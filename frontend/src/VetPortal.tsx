import React, { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from './services/api';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Stethoscope,
  Send,
  Calendar,
  Info,
  Check,
} from 'lucide-react';
import { MastiCareLogoIcon } from './components/MastiCareLogo';

interface AlertItem {
  id: number;
  cow_id: number;
  risk_category: string;
  timestamp: string;
  status: string; // New, Acknowledged, Resolved
  message: string;
}

interface Cow {
  id: number;
  name: string;
  rfid: string;
  breed: string;
  age: number;
}

interface VetNote {
  id: number;
  cow_id: number;
  timestamp: string;
  note: string;
}

const VetPortal: React.FC = () => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [cows, setCows] = useState<Record<number, Cow>>({});
  const [notes, setNotes] = useState<Record<number, VetNote[]>>({});
  const [newNote, setNewNote] = useState('');
  const [selectedCow, setSelectedCow] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE');

  useEffect(() => {
    fetchAlerts();
    fetchCows();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/alerts`);
      setAlerts(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCows = async () => {
    try {
      const res = await axios.get(`${API_BASE}/cows`);
      const cowMap: Record<number, Cow> = {};
      (res.data || []).forEach((c: Cow) => {
        cowMap[c.id] = c;
      });
      setCows(cowMap);
      if (res.data?.length > 0 && selectedCow === null) {
        setSelectedCow(res.data[0].id);
        fetchNotes(res.data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotes = async (cowId: number) => {
    try {
      const res = await axios.get(`${API_BASE}/vet/notes/${cowId}`);
      setNotes((prev) => ({ ...prev, [cowId]: res.data || [] }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (alertId: number, status: string) => {
    try {
      await axios.patch(`${API_BASE}/alerts/${alertId}?status=${status}`);
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCow || !newNote.trim()) return;

    try {
      await axios.post(`${API_BASE}/vet/notes`, {
        cow_id: selectedCow,
        note: newNote.trim(),
      });
      setNewNote('');
      fetchNotes(selectedCow);
    } catch (e) {
      console.error(e);
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter((a) => {
    if (filterStatus === 'ACTIVE') return a.status !== 'Resolved';
    if (filterStatus === 'HIGH') return a.risk_category === 'High Risk' && a.status !== 'Resolved';
    if (filterStatus === 'RESOLVED') return a.status === 'Resolved';
    return true; // ALL
  });

  const activeCount = alerts.filter((a) => a.status !== 'Resolved').length;
  const highRiskCount = alerts.filter((a) => a.risk_category === 'High Risk' && a.status !== 'Resolved').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. HEADER BANNER */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#244D38]/15 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-start gap-4">
          <MastiCareLogoIcon size={42} theme="light" framed={true} className="mt-0.5 shrink-0" />
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#244D38] mb-1">
              <Stethoscope className="w-4 h-4 text-[#244D38]" />
              <span>{t('vet.headerBadge')}</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#183629]">
              {t('vet.title')}
            </h1>
            <p className="text-stone-500 text-xs sm:text-sm mt-1">
              {t('vet.subtitle')}
            </p>
          </div>
        </div>

        {/* Quick Triage Counters */}
        <div className="flex items-center gap-3">
          <div className="bg-[#F7F6EF] px-4 py-2.5 rounded-2xl border border-stone-200 text-center">
            <span className="block font-serif text-xl font-bold text-[#183629]">{activeCount}</span>
            <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">{t('vet.unresolved')}</span>
          </div>
          <div className="bg-red-50 px-4 py-2.5 rounded-2xl border border-red-200 text-center">
            <span className="block font-serif text-xl font-bold text-red-700">{highRiskCount}</span>
            <span className="text-[10px] uppercase tracking-wider text-red-600 font-bold">{t('vet.highRisk')}</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN TWO-COLUMN WORKFLOW */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Alerts Queue (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-[#244D38]/10 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#183629]">
                  {t('vet.triageQueue', { count: filteredAlerts.length })}
                </h2>
                <span className="text-xs text-stone-400">{t('vet.incomingTriggers')}</span>
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 bg-[#F7F6EF] p-1 rounded-xl border border-stone-200 text-xs font-semibold">
                <button
                  onClick={() => setFilterStatus('ACTIVE')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterStatus === 'ACTIVE'
                      ? 'bg-[#244D38] text-white shadow-2xs'
                      : 'text-stone-600 hover:text-[#183629]'
                  }`}
                >
                  {t('vet.tabActive')} ({activeCount})
                </button>
                <button
                  onClick={() => setFilterStatus('HIGH')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterStatus === 'HIGH'
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'text-stone-600 hover:text-red-700'
                  }`}
                >
                  {t('vet.tabHigh')}
                </button>
                <button
                  onClick={() => setFilterStatus('RESOLVED')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterStatus === 'RESOLVED'
                      ? 'bg-[#183629] text-white shadow-2xs'
                      : 'text-stone-600 hover:text-[#183629]'
                  }`}
                >
                  {t('vet.tabResolved')}
                </button>
                <button
                  onClick={() => setFilterStatus('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterStatus === 'ALL'
                      ? 'bg-stone-300 text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-[#183629]'
                  }`}
                >
                  {t('vet.tabAll')}
                </button>
              </div>
            </div>

            {filteredAlerts.length === 0 && (
              <div className="py-12 text-center text-stone-400 text-xs bg-[#FAF9F5] rounded-2xl border border-dashed border-stone-200">
                {t('vet.noAlerts')}
              </div>
            )}

            <div className="space-y-3">
              {filteredAlerts.map((a) => {
                const isHigh = a.risk_category === 'High Risk';
                const isResolved = a.status === 'Resolved';
                const cowObj = cows[a.cow_id];

                return (
                  <div
                    key={a.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isResolved
                        ? 'bg-[#FAF9F5] border-stone-200 text-stone-600'
                        : isHigh
                        ? 'bg-red-50/70 border-red-200 text-red-950 shadow-2xs'
                        : 'bg-amber-50/70 border-amber-200 text-amber-950 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {isResolved ? (
                          <CheckCircle2 className="w-5 h-5 text-stone-400" />
                        ) : (
                          <AlertTriangle
                            className={`w-5 h-5 ${isHigh ? 'text-red-600' : 'text-amber-600'}`}
                          />
                        )}
                        <span className="font-serif font-bold text-base text-[#183629]">
                          Cow #{a.cow_id} {cowObj ? `— ${cowObj.name}` : ''}
                        </span>
                        {cowObj && (
                          <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-stone-200 text-stone-600">
                            {cowObj.rfid}
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-stone-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-stone-700 leading-relaxed mb-4">
                      {a.message}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/5 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                            isHigh
                              ? 'bg-red-200 text-red-900'
                              : 'bg-amber-200 text-amber-900'
                          }`}
                        >
                          {isHigh
                            ? t('common.highRisk')
                            : a.risk_category === 'Moderate Risk'
                            ? t('common.moderateRisk')
                            : t('common.noRisk')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white border border-stone-200 text-stone-600 font-semibold text-[10px]">
                          {t('vet.statusLabel', {
                            status:
                              a.status === 'Resolved'
                                ? t('common.resolved')
                                : a.status === 'Acknowledged'
                                ? t('common.acknowledged')
                                : t('common.new'),
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/cows/${a.cow_id}`}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#244D38] hover:underline"
                        >
                          {t('vet.inspect')}
                        </Link>

                        {!isResolved && (
                          <>
                            {a.status !== 'Acknowledged' && (
                              <button
                                onClick={() => handleUpdateStatus(a.id, 'Acknowledged')}
                                className="px-3 py-1 rounded-lg bg-white hover:bg-stone-100 text-stone-800 font-semibold text-xs border border-stone-200 transition"
                              >
                                {t('vet.btnAck')}
                              </button>
                            )}
                            <button
                              onClick={() => handleUpdateStatus(a.id, 'Resolved')}
                              className="px-3 py-1 rounded-lg bg-[#244D38] hover:bg-[#183629] text-white font-semibold text-xs transition flex items-center gap-1 shadow-2xs"
                            >
                              <Check className="w-3 h-3" />
                              <span>{t('vet.btnResolve')}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Veterinarian Clinical Notes (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-[#244D38]/10 shadow-xs space-y-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#183629]">
                {t('vet.observationsLog')}
              </h2>
              <span className="text-xs text-stone-400">{t('vet.observationsLogSub')}</span>
            </div>

            {/* Select Target Cow */}
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1.5">
                {t('vet.selectPatientCow')}
              </label>
              <select
                className="w-full p-2.5 rounded-xl bg-[#F7F6EF] border border-[#244D38]/15 text-xs text-[#183629] font-medium focus:outline-none focus:ring-2 focus:ring-[#244D38]"
                value={selectedCow || ''}
                onChange={(e) => {
                  const cowId = parseInt(e.target.value);
                  setSelectedCow(cowId);
                  fetchNotes(cowId);
                }}
              >
                {Object.values(cows).map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} — {c.name} ({c.rfid}) &bull; {c.breed}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Clinical Note Form */}
            {selectedCow && (
              <form onSubmit={handleAddNote} className="space-y-3 pt-2">
                <textarea
                  rows={3}
                  className="w-full p-3.5 rounded-2xl bg-[#F7F6EF] border border-[#244D38]/15 text-xs text-[#183629] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#244D38]"
                  placeholder={t('vet.placeholderNote')}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  required
                />
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-stone-400 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    {t('vet.appendedToCow', { id: selectedCow })}
                  </span>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#244D38] hover:bg-[#183629] text-white font-semibold text-xs transition shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t('vet.postNote')}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Historical Notes */}
            {selectedCow && (
              <div className="pt-4 border-t border-stone-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {t('vet.historyTitle', { id: selectedCow, count: (notes[selectedCow] || []).length })}
                </h4>

                {(notes[selectedCow] || []).length === 0 && (
                  <p className="text-xs text-stone-400 text-center py-6 bg-[#FAF9F5] rounded-xl border border-dashed border-stone-200">
                    {t('vet.noHistory')}
                  </p>
                )}

                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {(notes[selectedCow] || []).map((n) => (
                    <div
                      key={n.id}
                      className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-stone-200/80 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span className="font-semibold text-[#183629]">{t('vet.attendingVet')}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#A9BCA3]" />
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(n.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-stone-800 leading-relaxed font-normal">{n.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Platform Status Footnote */}
      <div className="pt-2 text-center text-xs text-stone-400">
        {t('vet.researchFootnote')}
      </div>
    </div>
  );
};

export default VetPortal;
