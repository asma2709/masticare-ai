import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from './services/api';
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
  Activity,
  Droplets,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronRight,
  ShieldAlert,
  Thermometer,
  Layers,
} from 'lucide-react';
import { MastiCareLogoIcon } from './components/MastiCareLogo';

export interface Cow {
  id: number;
  name: string;
  rfid: string;
  breed: string;
  age: number;
}

export interface Reading {
  id: number;
  cow_id: number;
  timestamp: string;
  temperature: number;
  activity: number;
  milk_ph: number;
  milk_ec: number;
  risk_category: string;
}

export interface AlertItem {
  id: number;
  cow_id: number;
  risk_category: string;
  timestamp: string;
  status: string;
  message: string;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [cows, setCows] = useState<Cow[]>([]);
  const [selectedCowId, setSelectedCowId] = useState<number | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setError(null);
      const [cowsRes, alertsRes] = await Promise.all([
        axios.get(`${API_BASE}/cows`),
        axios.get(`${API_BASE}/alerts`),
      ]);

      const cowList: Cow[] = cowsRes.data || [];
      setCows(cowList);
      setAlerts(alertsRes.data || []);

      if (cowList.length > 0) {
        const defaultCowId = cowList[0].id;
        setSelectedCowId(defaultCowId);
        fetchReadings(defaultCowId);
      }
    } catch (e: any) {
      console.error(e);
      setError('Could not connect to the MastiCare API. Please ensure the backend server is running and accessible.');
    }
  };

  const fetchReadings = async (cowId: number) => {
    try {
      const res = await axios.get(`${API_BASE}/telemetry/cow/${cowId}`);
      // Chronological order for Recharts
      const data: Reading[] = res.data ? [...res.data].reverse() : [];
      setReadings(data);
    } catch (e) {
      console.error('Failed to load telemetry readings', e);
    }
  };

  const handleSelectCow = (cowId: number) => {
    setSelectedCowId(cowId);
    fetchReadings(cowId);
  };

  const handleSimulateStep = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/simulation/generate`);
      // Refresh data
      const alertsRes = await axios.get(`${API_BASE}/alerts`);
      setAlerts(alertsRes.data || []);
      if (selectedCowId) {
        await fetchReadings(selectedCowId);
      }
    } catch (e) {
      console.error(e);
      setError('Simulation trigger encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  // Metric Computations
  const activeAlerts = alerts.filter((a) => a.status !== 'Resolved');
  const highRiskAlerts = activeAlerts.filter((a) => a.risk_category === 'High Risk');
  const moderateRiskAlerts = activeAlerts.filter((a) => a.risk_category === 'Moderate Risk');

  // Set of cow IDs needing attention
  const highRiskCowIds = new Set(highRiskAlerts.map((a) => a.cow_id));
  const moderateRiskCowIds = new Set(moderateRiskAlerts.map((a) => a.cow_id));
  const cowsNeedingAttention = new Set([...highRiskCowIds, ...moderateRiskCowIds]).size;

  // Selected cow details
  const selectedCow = cows.find((c) => c.id === selectedCowId) || cows[0];
  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;

  // Filtered cows for table
  const filteredCows = cows.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
      c.rfid.toLowerCase().includes(tableSearch.toLowerCase()) ||
      c.breed.toLowerCase().includes(tableSearch.toLowerCase());

    const isHigh = highRiskCowIds.has(c.id);
    const isMod = moderateRiskCowIds.has(c.id);

    if (filterRisk === 'HIGH') return matchesSearch && isHigh;
    if (filterRisk === 'MODERATE') return matchesSearch && isMod;
    if (filterRisk === 'HEALTHY') return matchesSearch && !isHigh && !isMod;
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* API Connection Error Notice */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchInitialData}
            className="px-3 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 font-semibold text-xs transition cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 1. HERO / WELCOME SECTION WITH AUTHENTIC DAIRY VISUAL */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-[#244D38]/15 bg-[#183629] text-white">
        {/* Background photo with subtle atmospheric grading */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero_pasture.jpg"
            alt="Pasture herd background"
            className="w-full h-full object-cover object-center filter brightness-[0.45] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#183629] via-[#183629]/80 to-transparent" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <MastiCareLogoIcon size={36} theme="dark" framed={true} />
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#A9BCA3] text-xs font-semibold tracking-wide border border-white/15">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{t('dashboard.headerBadge')}</span>
              </div>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F7F6EF]">
              {t('dashboard.title')}
            </h1>
            <p className="text-stone-300 text-sm sm:text-base font-light leading-relaxed">
              {t('dashboard.subtitle')}
            </p>
          </div>

          {/* Action Trigger */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={handleSimulateStep}
              disabled={loading || cows.length === 0}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#A9BCA3] hover:bg-[#9cb096] text-[#183629] font-bold text-sm shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? t('dashboard.refreshing') : t('dashboard.runStep')}</span>
            </button>
            <Link
              to="/simulation"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-sm border border-white/20 transition"
            >
              <span>{t('dashboard.telemetryControls')}</span>
              <ChevronRight className="w-4 h-4 text-[#A9BCA3]" />
            </Link>
          </div>
        </div>

        {/* Quick status bar */}
        <div className="relative z-10 border-t border-white/10 px-6 sm:px-10 py-3 bg-black/20 backdrop-blur-sm flex flex-wrap items-center justify-between text-xs text-stone-300 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#A9BCA3] font-semibold">{t('dashboard.feedStatus')}</span>
            <span>{t('dashboard.continuousFeed')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#A9BCA3] font-semibold">{t('dashboard.herdRegistry')}</span>
            <span>{t('dashboard.verifiedCows', { count: cows.length })}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#A9BCA3] font-semibold">{t('dashboard.activeAlerts')}</span>
            <span className={activeAlerts.length > 0 ? 'text-amber-300 font-bold' : 'text-emerald-300'}>
              {t('dashboard.unresolvedCount', { count: activeAlerts.length })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. OVERVIEW METRIC TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Total Herd */}
        <div className="bg-white p-6 rounded-3xl border border-[#244D38]/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              {t('dashboard.cardHerd')}
            </span>
            <div className="p-2.5 rounded-xl bg-[#244D38]/8 text-[#244D38]">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="font-serif text-3xl sm:text-4xl font-bold text-[#183629]">
              {cows.length}
            </div>
            <div className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {t('dashboard.telemetryActive')}
            </div>
          </div>
        </div>

        {/* Metric 2: Requiring Attention */}
        <div className="bg-white p-6 rounded-3xl border border-[#244D38]/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              {t('dashboard.cardAttention')}
            </span>
            <div className={`p-2.5 rounded-xl ${cowsNeedingAttention > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="font-serif text-3xl sm:text-4xl font-bold text-[#183629]">
              {cowsNeedingAttention}
            </div>
            <div className="text-xs text-stone-500 mt-1">
              {t('dashboard.breakdown', { high: highRiskCowIds.size, mod: moderateRiskCowIds.size })}
            </div>
          </div>
        </div>

        {/* Metric 3: Latest Temp */}
        <div className="bg-white p-6 rounded-3xl border border-[#244D38]/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              {t('dashboard.cardTemp')}
            </span>
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-700">
              <Thermometer className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="font-serif text-3xl sm:text-4xl font-bold text-[#183629]">
              {latestReading ? `${latestReading.temperature.toFixed(1)}°C` : '--'}
            </div>
            <div className="text-xs text-stone-500 mt-1">
              #{selectedCowId || 1} ({selectedCow?.name || 'Herd'})
            </div>
          </div>
        </div>

        {/* Metric 4: Latest Milk EC */}
        <div className="bg-white p-6 rounded-3xl border border-[#244D38]/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              {t('dashboard.cardEc')}
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <Droplets className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="font-serif text-3xl sm:text-4xl font-bold text-[#183629]">
              {latestReading ? `${latestReading.milk_ec.toFixed(2)}` : '--'}
            </div>
            <div className="text-xs text-stone-500 mt-1">
              {t('dashboard.baselineEc')}
            </div>
          </div>
        </div>
      </div>

      {/* 3. ALERT TRIAGE QUEUE */}
      {activeAlerts.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#244D38]/15 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <h2 className="font-serif text-xl font-bold text-[#183629]">
                {t('dashboard.alertsTitle')}
              </h2>
            </div>
            <Link
              to="/vet"
              className="text-xs font-semibold text-[#244D38] hover:text-[#183629] flex items-center gap-1 hover:underline"
            >
              <span>{t('dashboard.vetPortalTriage')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeAlerts.slice(0, 3).map((alert) => {
              const isHigh = alert.risk_category === 'High Risk';
              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isHigh
                      ? 'bg-red-50/70 border-red-200 text-red-900'
                      : 'bg-amber-50/70 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className={`w-3.5 h-3.5 ${isHigh ? 'text-red-600' : 'text-amber-600'}`} />
                      Cow #{alert.cow_id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${
                        isHigh ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {isHigh ? t('common.highRisk') : t('common.moderateRisk')}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-stone-700 mt-1 line-clamp-2">
                    {alert.message}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-black/5">
                    <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <Link
                      to={`/cows/${alert.cow_id}`}
                      className="font-bold text-[#244D38] hover:underline"
                    >
                      {t('dashboard.inspectProfile')}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. COW SELECTION & REAL-TIME TELEMETRY CHARTS */}
      <div className="space-y-6">
        {/* Selector & Status Header */}
        <div className="bg-white p-6 rounded-3xl border border-[#244D38]/10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl font-bold text-[#183629]">
                {t('dashboard.liveTelemetry')}
              </h2>
              {latestReading && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    latestReading.risk_category === 'High Risk'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : latestReading.risk_category === 'Moderate Risk'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {latestReading.risk_category === 'High Risk'
                    ? t('common.highRisk')
                    : latestReading.risk_category === 'Moderate Risk'
                    ? t('common.moderateRisk')
                    : t('common.noRisk')}
                </span>
              )}
            </div>
            <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
              #{selectedCow?.id}: {selectedCow?.name} ({selectedCow?.rfid}) &bull; {selectedCow?.breed}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-xs font-bold text-stone-600 whitespace-nowrap">
              {t('dashboard.focusCow')}
            </label>
            <select
              value={selectedCowId || ''}
              onChange={(e) => handleSelectCow(Number(e.target.value))}
              className="px-4 py-2 rounded-xl bg-[#F7F6EF] border border-[#244D38]/20 text-[#183629] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#244D38] w-full md:w-auto cursor-pointer"
            >
              {cows.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.id} — {c.name} ({c.rfid})
                </option>
              ))}
            </select>
            {selectedCowId && (
              <Link
                to={`/cows/${selectedCowId}`}
                className="px-3 py-2 rounded-xl bg-[#244D38] hover:bg-[#183629] text-white text-xs font-semibold transition shrink-0"
              >
                {t('dashboard.profileBtn')}
              </Link>
            )}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Chart 1: Temperature & Activity */}
          <div className="bg-white p-6 rounded-3xl border border-[#244D38]/10 shadow-xs flex flex-col justify-between h-[420px]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#183629] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#244D38]" />
                  {t('dashboard.chart1Title')}
                </h3>
                <p className="text-stone-400 text-xs">
                  {t('dashboard.chart1Sub')}
                </p>
              </div>
            </div>

            <div className="flex-1 w-full min-h-[280px]">
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
                <div className="h-full flex flex-col items-center justify-center text-stone-400 text-xs">
                  <Activity className="w-8 h-8 text-stone-300 mb-2" />
                  <span>{t('dashboard.noTelemetryYet')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Milk EC & pH */}
          <div className="bg-white p-6 rounded-3xl border border-[#244D38]/10 shadow-xs flex flex-col justify-between h-[420px]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#183629] flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  {t('dashboard.chart2Title')}
                </h3>
                <p className="text-stone-400 text-xs">
                  {t('dashboard.chart2Sub')}
                </p>
              </div>
            </div>

            <div className="flex-1 w-full min-h-[280px]">
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
                <div className="h-full flex flex-col items-center justify-center text-stone-400 text-xs">
                  <Droplets className="w-8 h-8 text-stone-300 mb-2" />
                  <span>{t('dashboard.noTelemetryYet')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. HERD MONITORING TABLE */}
      <div className="bg-white rounded-3xl border border-[#244D38]/10 shadow-xs overflow-hidden">
        {/* Table Filter Controls */}
        <div className="p-6 border-b border-stone-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#183629]">
              {t('dashboard.tableTitle')}
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm">
              {t('dashboard.tableSub')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder={t('dashboard.searchPlaceholder')}
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F7F6EF] border border-[#244D38]/15 text-xs text-[#183629] focus:outline-none focus:ring-2 focus:ring-[#244D38]"
              />
            </div>

            {/* Risk Category Filter */}
            <div className="flex items-center gap-1 bg-[#F7F6EF] p-1 rounded-xl border border-[#244D38]/15 text-xs font-semibold">
              <button
                onClick={() => setFilterRisk('ALL')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterRisk === 'ALL' ? 'bg-[#244D38] text-white shadow-xs' : 'text-stone-600 hover:text-[#183629]'
                }`}
              >
                {t('dashboard.filterAll')}
              </button>
              <button
                onClick={() => setFilterRisk('HIGH')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterRisk === 'HIGH' ? 'bg-red-600 text-white shadow-xs' : 'text-stone-600 hover:text-red-700'
                }`}
              >
                {t('dashboard.filterHigh')}
              </button>
              <button
                onClick={() => setFilterRisk('MODERATE')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterRisk === 'MODERATE' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600 hover:text-amber-700'
                }`}
              >
                {t('dashboard.filterMod')}
              </button>
              <button
                onClick={() => setFilterRisk('HEALTHY')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filterRisk === 'HEALTHY' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:text-emerald-700'
                }`}
              >
                {t('dashboard.filterHealthy')}
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF9F5] border-b border-stone-200/60 text-stone-600 uppercase tracking-wider font-semibold">
                <th className="py-4 px-6">{t('dashboard.thRfid')}</th>
                <th className="py-4 px-6">{t('dashboard.thName')}</th>
                <th className="py-4 px-6">{t('dashboard.thBreed')}</th>
                <th className="py-4 px-6">{t('dashboard.thRisk')}</th>
                <th className="py-4 px-6 text-right">{t('dashboard.thActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredCows.map((cow) => {
                const isHigh = highRiskCowIds.has(cow.id);
                const isMod = moderateRiskCowIds.has(cow.id);

                return (
                  <tr
                    key={cow.id}
                    className="hover:bg-[#FAF9F5] transition-colors"
                  >
                    <td className="py-4 px-6 font-mono font-semibold text-[#183629]">
                      <span className="bg-[#F7F6EF] px-2 py-1 rounded-md border border-stone-200">
                        {cow.rfid}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium text-[#183629]">
                      <div className="flex items-center gap-2.5">
                        <MastiCareLogoIcon size={24} theme="light" framed={true} />
                        <span className="font-semibold">{cow.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-stone-600">
                      {cow.breed} &bull; {cow.age} {t('cows.years')}
                    </td>
                    <td className="py-4 px-6">
                      {isHigh ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-bold text-[11px] border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                          {t('common.highRisk')}
                        </span>
                      ) : isMod ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                          {t('common.moderateRisk')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          {t('common.noRisk')}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleSelectCow(cow.id)}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-[#F7F6EF] font-semibold text-xs transition cursor-pointer"
                      >
                        {t('dashboard.btnChart')}
                      </button>
                      <Link
                        to={`/cows/${cow.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#244D38] hover:bg-[#183629] text-white font-semibold text-xs transition"
                      >
                        <span>{t('dashboard.btnDetails')}</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {filteredCows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-500">
                    {t('dashboard.noMatch')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Platform Status Footnote */}
      <div className="pt-2 text-center text-xs text-stone-400">
        {t('common.researchDisclaimer')}
      </div>
    </div>
  );
};

export default Dashboard;
