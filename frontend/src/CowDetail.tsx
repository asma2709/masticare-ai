import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft,
  Activity,
  Droplets,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  Send,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';
import { MastiCareLogoIcon } from './components/MastiCareLogo';

interface Cow {
  id: number;
  name: string;
  rfid: string;
  breed: string;
  age: number;
}

interface Reading {
  id: number;
  cow_id: number;
  timestamp: string;
  temperature: number;
  activity: number;
  milk_ph: number;
  milk_ec: number;
  risk_category: string;
}

interface VetNote {
  id: number;
  cow_id: number;
  timestamp: string;
  note: string;
}

const API_BASE = 'http://localhost:8000/api/v1';

const CowDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [cow, setCow] = useState<Cow | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [vetNotes, setVetNotes] = useState<VetNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCowData();
    }
  }, [id]);

  const fetchCowData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cowRes, readRes, notesRes] = await Promise.all([
        axios.get(`${API_BASE}/cows/${id}`),
        axios.get(`${API_BASE}/telemetry/cow/${id}`),
        axios.get(`${API_BASE}/vet/notes/${id}`).catch(() => ({ data: [] })),
      ]);

      setCow(cowRes.data);
      // Reverse to chronological order for charts
      const chronoReadings: Reading[] = readRes.data ? [...readRes.data].reverse() : [];
      setReadings(chronoReadings);
      setVetNotes(notesRes.data || []);
    } catch (e: any) {
      console.error(e);
      setError('Could not load cow profile data. Please verify the backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newNote.trim()) return;

    setSubmittingNote(true);
    try {
      await axios.post(`${API_BASE}/vet/notes`, {
        cow_id: parseInt(id),
        note: newNote.trim(),
      });
      setNewNote('');
      const res = await axios.get(`${API_BASE}/vet/notes/${id}`);
      setVetNotes(res.data || []);
    } catch (e) {
      console.error('Failed to submit note', e);
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse space-y-4 max-w-md mx-auto">
          <div className="h-8 bg-stone-200 rounded-xl w-3/4 mx-auto"></div>
          <div className="h-4 bg-stone-200 rounded-xl w-1/2 mx-auto"></div>
          <p className="text-stone-400 text-sm">{t('cows.loadingRecords')}</p>
        </div>
      </div>
    );
  }

  if (error || !cow) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-[#183629]">{t('detail.notFoundTitle')}</h2>
        <p className="text-stone-600 text-sm">{error || t('detail.notFoundDesc')}</p>
        <Link
          to="/cows"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#244D38] text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('detail.backRegistry')}</span>
        </Link>
      </div>
    );
  }

  const latestReading: Reading | null = readings.length > 0 ? readings[readings.length - 1] : null;
  const currentRisk = latestReading?.risk_category || 'No Risk';

  // Dynamic explanation of current risk
  const getRiskExplanation = () => {
    if (currentRisk === 'High Risk') {
      return {
        title: t('detail.riskHighTitle'),
        description: t('detail.riskHighDesc'),
        action: t('detail.riskHighAction'),
        badgeBg: 'bg-red-100 text-red-800 border-red-200',
        cardBg: 'bg-red-50/60 border-red-200',
      };
    }
    if (currentRisk === 'Moderate Risk') {
      return {
        title: t('detail.riskModTitle'),
        description: t('detail.riskModDesc'),
        action: t('detail.riskModAction'),
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
        cardBg: 'bg-amber-50/60 border-amber-200',
      };
    }
    return {
      title: t('detail.riskStableTitle'),
      description: t('detail.riskStableDesc'),
      action: t('detail.riskStableAction'),
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cardBg: 'bg-emerald-50/60 border-emerald-200',
    };
  };

  const riskInfo = getRiskExplanation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. BREADCRUMBS & TOP NAV */}
      <div className="flex items-center justify-between">
        <Link
          to="/cows"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#244D38] hover:text-[#183629] transition bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-2xs hover:bg-stone-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('detail.backRegistry')}</span>
        </Link>
        <span className="text-xs text-stone-500 font-mono">
          {t('detail.recordNumber', { id: cow.id, rfid: cow.rfid })}
        </span>
      </div>

      {/* 2. COW HERO CARD */}
      <div className="bg-white rounded-3xl border border-[#244D38]/15 shadow-sm overflow-hidden grid lg:grid-cols-12 gap-0">
        {/* Cow Portrait Visual */}
        <div className="lg:col-span-4 relative min-h-[260px] bg-stone-900">
          <img
            src="/cow_portrait.jpg"
            alt={cow.name}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent lg:hidden" />
          <div className="absolute bottom-4 left-4 lg:hidden text-white flex items-center gap-2.5">
            <MastiCareLogoIcon size={32} theme="dark" framed={true} />
            <div>
              <h2 className="font-serif text-2xl font-bold">{cow.name}</h2>
              <span className="font-mono text-xs text-stone-300">{cow.rfid}</span>
            </div>
          </div>
        </div>

        {/* Cow Profile Identity Details */}
        <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="hidden lg:flex items-center gap-3">
                <MastiCareLogoIcon size={38} theme="light" framed={true} />
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-[#244D38]">
                    {t('detail.dossier')}
                  </span>
                  <h1 className="font-serif text-3xl font-bold text-[#183629] mt-0.5">
                    {cow.name}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 font-medium">{t('detail.riskStatus')}</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${riskInfo.badgeBg}`}
                >
                  {currentRisk === 'High Risk'
                    ? t('common.highRisk')
                    : currentRisk === 'Moderate Risk'
                    ? t('common.moderateRisk')
                    : t('common.noRisk')}
                </span>
              </div>
            </div>

            {/* Biological Registry Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-stone-100 text-xs">
              <div>
                <span className="text-stone-400 block text-[11px]">{t('detail.rfid')}</span>
                <strong className="font-mono text-[#183629] text-sm">{cow.rfid}</strong>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">{t('detail.breed')}</span>
                <strong className="text-[#183629] text-sm">{cow.breed}</strong>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">{t('detail.age')}</span>
                <strong className="text-[#183629] text-sm">{t('detail.yearsOld', { age: cow.age })}</strong>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">{t('detail.telemetryStatus')}</span>
                <strong className="text-emerald-700 text-sm flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {t('detail.activeStream')}
                </strong>
              </div>
            </div>
          </div>

          {/* AI Risk Analysis Box */}
          <div className={`p-5 rounded-2xl border ${riskInfo.cardBg} text-xs space-y-2`}>
            <div className="flex items-center gap-2 font-bold text-[#183629]">
              <Sparkles className="w-4 h-4 text-[#244D38]" />
              <span>{riskInfo.title}</span>
            </div>
            <p className="text-stone-700 leading-relaxed">{riskInfo.description}</p>
            <p className="font-semibold text-[#183629] pt-1">{riskInfo.action}</p>
          </div>
        </div>
      </div>

      {/* 3. LATEST SENSOR INDICATOR TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Temp */}
        <div className="bg-white p-5 rounded-3xl border border-[#244D38]/10 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold mb-2">
            <span>{t('detail.cardTemp')}</span>
            <Thermometer className="w-4 h-4 text-orange-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#183629]">
            {latestReading ? `${latestReading.temperature.toFixed(2)} °C` : '--'}
          </div>
          <div className="text-[11px] text-stone-500 mt-2 flex justify-between border-t border-stone-100 pt-2">
            <span>{t('detail.baseline')}</span>
            <span className="font-mono text-stone-700">38.0 – 39.0 °C</span>
          </div>
        </div>

        {/* Metric 2: Rumination & Activity */}
        <div className="bg-white p-5 rounded-3xl border border-[#244D38]/10 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold mb-2">
            <span>{t('detail.cardActivity')}</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#183629]">
            {latestReading ? `${latestReading.activity.toFixed(0)}` : '--'}
          </div>
          <div className="text-[11px] text-stone-500 mt-2 flex justify-between border-t border-stone-100 pt-2">
            <span>{t('detail.baseline')}</span>
            <span className="font-mono text-stone-700">60 – 90 index</span>
          </div>
        </div>

        {/* Metric 3: Milk EC */}
        <div className="bg-white p-5 rounded-3xl border border-[#244D38]/10 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold mb-2">
            <span>{t('detail.cardEc')}</span>
            <Droplets className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#183629]">
            {latestReading ? `${latestReading.milk_ec.toFixed(2)}` : '--'}
          </div>
          <div className="text-[11px] text-stone-500 mt-2 flex justify-between border-t border-stone-100 pt-2">
            <span>{t('detail.baseline')}</span>
            <span className="font-mono text-stone-700">&lt; 5.0 mS/cm</span>
          </div>
        </div>

        {/* Metric 4: Milk pH */}
        <div className="bg-white p-5 rounded-3xl border border-[#244D38]/10 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold mb-2">
            <span>{t('detail.cardPh')}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#183629]">
            {latestReading ? `${latestReading.milk_ph.toFixed(2)}` : '--'}
          </div>
          <div className="text-[11px] text-stone-500 mt-2 flex justify-between border-t border-stone-100 pt-2">
            <span>{t('detail.baseline')}</span>
            <span className="font-mono text-stone-700">6.5 – 6.8 pH</span>
          </div>
        </div>
      </div>

      {/* 4. HISTORICAL TREND CHARTS */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Chart 1: Temp & Activity */}
        <div className="bg-white p-6 rounded-3xl border border-[#244D38]/10 shadow-xs flex flex-col justify-between h-[390px]">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#183629]">
              {t('detail.collarHistory')}
            </h3>
            <p className="text-stone-400 text-xs">
              {t('detail.collarHistorySub')}
            </p>
          </div>

          <div className="flex-1 w-full min-h-[260px] mt-2">
            {readings.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={readings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#8D9B91"
                    fontSize={11}
                    tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#d97706"
                    fontSize={11}
                    domain={['dataMin - 0.5', 'dataMax + 0.5']}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#6366f1"
                    fontSize={11}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E7ECE5',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                      fontSize: '12px',
                    }}
                    labelFormatter={(l: any) => (l ? new Date(l).toLocaleString() : '')}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="temperature"
                    stroke="#d97706"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#d97706' }}
                    name={t('dashboard.tempLegend')}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="activity"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    name={t('dashboard.activityLegend')}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-stone-400 py-20 text-xs">{t('dashboard.noTelemetryYet')}</p>
            )}
          </div>
        </div>

        {/* Chart 2: Milk EC & pH */}
        <div className="bg-white p-6 rounded-3xl border border-[#244D38]/10 shadow-xs flex flex-col justify-between h-[390px]">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#183629]">
              {t('detail.milkHistory')}
            </h3>
            <p className="text-stone-400 text-xs">
              {t('detail.milkHistorySub')}
            </p>
          </div>

          <div className="flex-1 w-full min-h-[260px] mt-2">
            {readings.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={readings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" />
                  <XAxis
                    dataKey="timestamp"
                    stroke="#8D9B91"
                    fontSize={11}
                    tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#2563eb"
                    fontSize={11}
                    domain={['dataMin - 0.5', 'dataMax + 0.5']}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#16a34a"
                    fontSize={11}
                    domain={[6.0, 8.0]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E7ECE5',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                      fontSize: '12px',
                    }}
                    labelFormatter={(l: any) => (l ? new Date(l).toLocaleString() : '')}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="milk_ec"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#2563eb' }}
                    name={t('dashboard.ecLegend')}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="milk_ph"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={false}
                    name={t('dashboard.phLegend')}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-stone-400 py-20 text-xs">{t('dashboard.noTelemetryYet')}</p>
            )}
          </div>
        </div>
      </div>

      {/* 5. VETERINARIAN NOTES & CLINICAL TIMELINE */}
      <div className="bg-white rounded-3xl border border-[#244D38]/10 shadow-xs p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#183629]">
            {t('detail.clinicalNotes')}
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm">
            {t('detail.clinicalNotesSub', { id: cow.id })}
          </p>
        </div>

        {/* Note Entry Form */}
        <form onSubmit={handleAddNote} className="space-y-3">
          <textarea
            rows={2}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder={t('detail.addNotePlaceholder')}
            className="w-full p-4 rounded-2xl bg-[#F7F6EF] border border-[#244D38]/15 text-xs text-[#183629] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#244D38]"
            required
          />
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-stone-400 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              {t('detail.dbNotice')}
            </span>
            <button
              type="submit"
              disabled={submittingNote || !newNote.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#244D38] hover:bg-[#183629] text-white font-semibold text-xs transition disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingNote ? t('detail.submitting') : t('detail.submitNote')}</span>
            </button>
          </div>
        </form>

        {/* Historical Notes Timeline */}
        <div className="space-y-3 pt-4 border-t border-stone-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            {t('detail.obsHistory', { count: vetNotes.length })}
          </h4>

          {vetNotes.length === 0 && (
            <div className="text-stone-400 text-xs py-4 text-center bg-[#F7F6EF] rounded-2xl border border-dashed border-stone-200">
              {t('detail.noNotes')}
            </div>
          )}

          <div className="space-y-2.5">
            {vetNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-2xl bg-[#FAF9F5] border border-stone-200/80 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-stone-500 text-[11px]">
                  <span className="font-semibold text-[#183629]">{t('detail.attendingVet')}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#A9BCA3]" />
                    {new Date(note.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-stone-800 leading-relaxed font-normal">{note.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. RECENT READINGS AUDIT TABLE */}
      <div className="bg-white rounded-3xl border border-[#244D38]/10 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h3 className="font-serif text-xl font-bold text-[#183629]">
            {t('detail.recentLog')}
          </h3>
          <p className="text-stone-500 text-xs">
            {t('detail.recentLogSub', { id: cow.id })}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF9F5] border-b border-stone-200/60 text-stone-600 uppercase tracking-wider font-semibold">
                <th className="py-3 px-6">{t('detail.thTime')}</th>
                <th className="py-3 px-6">{t('detail.thTemp')}</th>
                <th className="py-3 px-6">{t('detail.thActivity')}</th>
                <th className="py-3 px-6">{t('detail.thEc')}</th>
                <th className="py-3 px-6">{t('detail.thPh')}</th>
                <th className="py-3 px-6 text-right">{t('detail.thRisk')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {readings.slice(-10).reverse().map((r) => (
                <tr key={r.id} className="hover:bg-[#FAF9F5] transition">
                  <td className="py-3 px-6 font-mono text-stone-600">
                    {new Date(r.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-6 font-semibold text-stone-800">
                    {r.temperature.toFixed(2)} °C
                  </td>
                  <td className="py-3 px-6 text-stone-700">
                    {r.activity.toFixed(0)}
                  </td>
                  <td className="py-3 px-6 font-semibold text-blue-700">
                    {r.milk_ec.toFixed(2)} mS/cm
                  </td>
                  <td className="py-3 px-6 text-stone-700">
                    {r.milk_ph.toFixed(2)}
                  </td>
                  <td className="py-3 px-6 text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        r.risk_category === 'High Risk'
                          ? 'bg-red-100 text-red-800'
                          : r.risk_category === 'Moderate Risk'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {r.risk_category === 'High Risk'
                        ? t('common.highRisk')
                        : r.risk_category === 'Moderate Risk'
                        ? t('common.moderateRisk')
                        : t('common.noRisk')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Research Prototype Footnote */}
      <div className="pt-2 text-center text-xs text-stone-400">
        {t('common.researchDisclaimer')}
      </div>
    </div>
  );
};

export default CowDetail;
