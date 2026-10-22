import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from './services/api';
import {
  Sliders,
  Thermometer,
  Activity,
  Droplets,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Info,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Stethoscope,
  Layers,
  Cpu,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { MastiCareLogoIcon } from './components/MastiCareLogo';

interface Cow {
  id: number;
  name: string;
  rfid: string;
  breed: string;
  age: number;
}

interface ScenarioPreset {
  id: string;
  name: string;
  scenario_type: string;
  description: string;
  temperature: number;
  activity: number;
  milk_ph: number;
  milk_ec: number;
  expected_risk: string;
  clinical_notes: string;
}

interface PredictionResult {
  status: string;
  reading_id: number | null;
  cow_id: number;
  cow_name: string;
  cow_rfid: string;
  cow_breed: string;
  timestamp: string;
  scenario_name: string;
  inputs: {
    temperature: { value: number; unit: string; normal_range: number[]; label: string; status: string; note: string };
    activity: { value: number; unit: string; normal_range: number[]; label: string; status: string; note: string };
    milk_ph: { value: number; unit: string; normal_range: number[]; label: string; status: string; note: string };
    milk_ec: { value: number; unit: string; normal_range: number[]; label: string; status: string; note: string };
  };
  risk_category: 'No Risk' | 'Low Risk' | 'Moderate Risk' | 'High Risk';
  confidence: number;
  probabilities: Record<string, number>;
  contributing_factors: string[];
  recommended_action: string;
  alert_created: boolean;
  alert_id: number | null;
  is_synthetic: boolean;
  reference_bounds: Record<string, { normal: number[]; unit: string }>;
  model_engine: string;
}

// Reference Bounds
const PHYSIO_RANGES = {
  temperature: { min: 36.5, max: 42.0, step: 0.1, normMin: 38.0, normMax: 39.0, unit: '°C', label: 'Body / Rumen Temperature' },
  activity: { min: 10, max: 120, step: 1, normMin: 65, normMax: 95, unit: 'index', label: 'Movement / Rumination' },
  milk_ph: { min: 6.2, max: 7.8, step: 0.05, normMin: 6.5, normMax: 6.8, unit: 'pH', label: 'Milk Acidity' },
  milk_ec: { min: 3.0, max: 8.5, step: 0.05, normMin: 4.0, normMax: 5.0, unit: 'mS/cm', label: 'Electrical Conductivity' },
};

const SimulationPanel: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // State
  const [cows, setCows] = useState<Cow[]>([]);
  const [selectedCowId, setSelectedCowId] = useState<number | null>(null);
  const [presets, setPresets] = useState<ScenarioPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>('healthy');

  // Sliders state
  const [temperature, setTemperature] = useState<number>(38.5);
  const [activity, setActivity] = useState<number>(82.0);
  const [milkPh, setMilkPh] = useState<number>(6.65);
  const [milkEc, setMilkEc] = useState<number>(4.4);
  const [simulationNotes, setSimulationNotes] = useState<string>('');

  // Workflow execution state
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [batchLoading, setBatchLoading] = useState<boolean>(false);
  const [batchFeedback, setBatchFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [cowsRes, presetsRes] = await Promise.all([
        axios.get(`${API_BASE}/cows`),
        axios.get(`${API_BASE}/simulation/presets`),
      ]);
      const cowList: Cow[] = cowsRes.data || [];
      setCows(cowList);
      if (cowList.length > 0) {
        setSelectedCowId(cowList[0].id);
      }
      const presetsList: ScenarioPreset[] = presetsRes.data || [];
      setPresets(presetsList);
      if (presetsList.length > 0) {
        applyPreset(presetsList[0]);
      }
    } catch (e) {
      console.error('Error loading initial data:', e);
      setErrorMessage('Failed to connect to backend simulation service. Check if FastAPI is running.');
    }
  };

  const applyPreset = (preset: ScenarioPreset) => {
    setActivePresetId(preset.id);
    setTemperature(preset.temperature);
    setActivity(preset.activity);
    setMilkPh(preset.milk_ph);
    setMilkEc(preset.milk_ec);
    setSimulationNotes(preset.clinical_notes || '');
    setErrorMessage(null);
  };

  const handleRunPrediction = async () => {
    if (!selectedCowId) {
      setErrorMessage('Please select a target cow from the herd.');
      return;
    }

    setIsPredicting(true);
    setErrorMessage(null);

    try {
      const activePreset = presets.find((p) => p.id === activePresetId);
      const payload = {
        cow_id: selectedCowId,
        temperature: Number(temperature),
        activity: Number(activity),
        milk_ph: Number(milkPh),
        milk_ec: Number(milkEc),
        scenario_name: activePreset ? activePreset.name : 'Custom Telemetry Configuration',
        notes: simulationNotes,
        persist: true,
      };

      const response = await axios.post(`${API_BASE}/simulation/predict`, payload);
      setPredictionResult(response.data);
    } catch (err: any) {
      console.error('Prediction error:', err);
      const detail = err.response?.data?.detail || 'Inference engine unavailable. Check backend logs.';
      setErrorMessage(`Prediction failed: ${detail}`);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleRunHerdBatch = async () => {
    setBatchLoading(true);
    setBatchFeedback(null);
    try {
      const res = await axios.post(`${API_BASE}/simulation/generate`);
      setBatchFeedback(res.data?.message || 'Routine telemetry cycle completed across all cows.');
    } catch (e: any) {
      console.error(e);
      setBatchFeedback('Failed to run herd cycle.');
    } finally {
      setBatchLoading(false);
    }
  };

  const selectedCow = cows.find((c) => c.id === selectedCowId);

  // Status helper for slider values
  const getParamStatus = (param: 'temperature' | 'activity' | 'milk_ph' | 'milk_ec', val: number) => {
    const r = PHYSIO_RANGES[param];
    if (param === 'activity') {
      if (val < 40) return { label: t('simulation.statusSevereLethargy', 'Severe Lethargy'), color: 'text-red-600 bg-red-50 border-red-200' };
      if (val < r.normMin) return { label: t('simulation.statusReducedActivity', 'Reduced Activity'), color: 'text-amber-600 bg-amber-50 border-amber-200' };
      return { label: t('simulation.statusNormalRumination', 'Normal Rumination'), color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
    if (param === 'temperature') {
      if (val > 39.5) return { label: t('simulation.statusHighFever', 'High Fever'), color: 'text-red-600 bg-red-50 border-red-200' };
      if (val > r.normMax) return { label: t('simulation.statusElevatedFever', 'Elevated (Fever Drift)'), color: 'text-amber-600 bg-amber-50 border-amber-200' };
      return { label: t('simulation.statusNormalThermal', 'Normal Thermal Range'), color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
    if (param === 'milk_ph') {
      if (val > 7.15) return { label: t('simulation.statusAlkalineLeakage', 'Alkaline Leakage (Severe)'), color: 'text-red-600 bg-red-50 border-red-200' };
      if (val > r.normMax) return { label: t('simulation.statusMildAlkaline', 'Mild Alkaline Drift'), color: 'text-amber-600 bg-amber-50 border-amber-200' };
      return { label: t('simulation.statusNormalAcidity', 'Normal Acidity'), color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
    if (param === 'milk_ec') {
      if (val > 6.0) return { label: t('simulation.statusSevereIonic', 'Severe Ionic Breakdown'), color: 'text-red-600 bg-red-50 border-red-200' };
      if (val > r.normMax) return { label: t('simulation.statusElevatedConductivity', 'Elevated Conductivity'), color: 'text-amber-600 bg-amber-50 border-amber-200' };
      return { label: t('simulation.statusNormalConductivity', 'Normal Conductivity'), color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
    return { label: t('simulation.statusNormal', 'Normal'), color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  const getRiskBadge = (category: string) => {
    switch (category) {
      case 'High Risk':
        return {
          bg: 'bg-red-50 border-red-300 text-red-900',
          dot: 'bg-red-600',
          border: 'border-l-4 border-l-red-600',
        };
      case 'Moderate Risk':
        return {
          bg: 'bg-amber-50 border-amber-300 text-amber-900',
          dot: 'bg-amber-500',
          border: 'border-l-4 border-l-amber-500',
        };
      case 'Low Risk':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-900',
          dot: 'bg-blue-500',
          border: 'border-l-4 border-l-blue-500',
        };
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          dot: 'bg-emerald-600',
          border: 'border-l-4 border-l-emerald-600',
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. PROFESSIONAL TELEMETRY STATUS BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-[#244D38]/5 border border-[#244D38]/15 p-4 sm:p-5 text-[#183629] shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-[#244D38]/10 text-[#244D38] shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#244D38] text-white">
                {t('simulation.badgeSimulated', 'ILLUSTRATIVE TELEMETRY — SIMULATION MODE')}
              </span>
              <span className="text-xs font-semibold text-[#244D38]">{t('simulation.juryBadge', 'Real-Time Telemetry Simulation')}</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-normal">
              {t('simulation.bannerDisclaimer')}
            </p>
          </div>
        </div>
      </div>

      {/* 2. LAB HEADER & COW SELECTION */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#244D38]/15 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-start gap-4">
          <MastiCareLogoIcon size={46} theme="light" framed={true} className="mt-0.5 shrink-0" />
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#244D38] mb-1">
              <Cpu className="w-4 h-4 text-[#244D38]" />
              <span>{t('simulation.labTitle', 'Health Assessment Studio • Real-Time Telemetry')}</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#183629]">
              {t('simulation.interactiveLab', 'Interactive Health Assessment Studio')}
            </h1>
            <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-2xl">
              {t('simulation.labSubtitle')}
            </p>
          </div>
        </div>

        {/* Cow Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto bg-[#FAF9F3] p-3 rounded-2xl border border-[#244D38]/15">
          <label className="text-xs font-bold text-[#183629] whitespace-nowrap flex items-center gap-1.5">
            <span>{t('simulation.targetCow', 'Target Cow:')}</span>
          </label>
          <select
            className="px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-[#183629] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#244D38] w-full sm:w-64 cursor-pointer"
            value={selectedCowId || ''}
            onChange={(e) => setSelectedCowId(Number(e.target.value))}
          >
            {cows.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.id} — {c.name} ({c.breed}, RFID: {c.rfid})
              </option>
            ))}
          </select>
          {selectedCow && (
            <Link
              to={`/cows/${selectedCow.id}`}
              className="inline-flex items-center justify-center p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#183629] text-xs font-semibold transition"
              title={t("simulation.inspectHistory", "Inspect historical records for this cow")}
            >
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* 3. SCENARIO PRESETS BAR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-600">
            <Layers className="w-4 h-4 text-[#244D38]" />
            <span>{t('simulation.presetsHeader', 'Calibrated Clinical Health Profiles')}</span>
          </div>
          <span className="text-[11px] text-stone-400">{t("simulation.presetsSub", "Click a preset to automatically populate telemetry inputs")}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {presets.map((preset) => {
            const isSelected = activePresetId === preset.id;
            const badge = getRiskBadge(preset.expected_risk);
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#183629] text-white border-[#183629] shadow-md ring-2 ring-[#244D38]/30 scale-[1.02]'
                    : 'bg-white hover:bg-[#FAF9F3] border-stone-200 text-[#183629]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isSelected
                          ? 'bg-white/20 text-white border-white/30'
                          : `${badge.bg} border-stone-200`
                      }`}
                    >
                      {preset.expected_risk}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#A9BCA3]" />}
                  </div>
                  <h2 className="font-bold text-xs sm:text-sm line-clamp-1">{preset.name}</h2>
                  <p
                    className={`text-[11px] mt-1.5 line-clamp-2 leading-relaxed ${
                      isSelected ? 'text-stone-300' : 'text-stone-500'
                    }`}
                  >
                    {preset.description}
                  </p>
                </div>
                <div
                  className={`mt-3 pt-2 text-[10px] border-t font-mono ${
                    isSelected ? 'border-white/10 text-stone-300' : 'border-stone-100 text-stone-400'
                  }`}
                >
                  EC: {preset.milk_ec} | T: {preset.temperature}°C | pH: {preset.milk_ph}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. MAIN INTERACTIVE LAB GRID: INPUTS ON LEFT, LIVE PREDICTION ON RIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: INTERACTIVE TELEMETRY SLIDERS (7 COLUMNS) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#244D38]/15 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#244D38]/10 text-[#244D38]">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#183629]">
                    {t('simulation.telemetryParameters', 'Telemetry Parameters & Physiological Reference Ranges')}
                  </h2>
                  <p className="text-stone-500 text-xs">
                    {t('simulation.telemetryDesc', 'Adjust variables within physiological limits to observe real-time inference reaction.')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const healthy = presets.find((p) => p.id === 'healthy');
                  if (healthy) applyPreset(healthy);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-[#183629] p-1.5 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                title={t("simulation.resetBaseline", "Reset to healthy baseline")}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('simulation.resetBaseline', 'Reset Baseline')}</span>
              </button>
            </div>

            {/* SLIDER 1: TEMPERATURE */}
            <div className="p-4 rounded-2xl bg-[#FAF9F3] border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-orange-600" />
                  <span className="font-bold text-xs sm:text-sm text-[#183629]">
                    {t('simulation.sliderTemp', 'Rumen / Body Temperature')}
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono">({PHYSIO_RANGES.temperature.unit})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getParamStatus('temperature', temperature).color}`}>
                    {getParamStatus('temperature', temperature).label}
                  </span>
                  <span className="text-base font-black font-mono text-[#183629] bg-white px-2.5 py-0.5 rounded-lg border border-stone-200">
                    {temperature.toFixed(1)}°C
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={PHYSIO_RANGES.temperature.min}
                max={PHYSIO_RANGES.temperature.max}
                step={PHYSIO_RANGES.temperature.step}
                value={temperature}
                onChange={(e) => {
                  setActivePresetId('custom');
                  setTemperature(parseFloat(e.target.value));
                }}
                className="w-full accent-[#244D38] cursor-pointer"
              />

              <div className="flex justify-between items-center text-[11px] text-stone-500">
                <span>Min: {PHYSIO_RANGES.temperature.min}°C</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Normal: 38.0°C – 39.0°C
                </span>
                <span>Max: {PHYSIO_RANGES.temperature.max}°C</span>
              </div>
            </div>

            {/* SLIDER 2: ACTIVITY / RUMINATION */}
            <div className="p-4 rounded-2xl bg-[#FAF9F3] border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-xs sm:text-sm text-[#183629]">
                    {t('simulation.sliderActivity', 'Movement & Rumination Activity')}
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono">({PHYSIO_RANGES.activity.unit})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getParamStatus('activity', activity).color}`}>
                    {getParamStatus('activity', activity).label}
                  </span>
                  <span className="text-base font-black font-mono text-[#183629] bg-white px-2.5 py-0.5 rounded-lg border border-stone-200">
                    {Math.round(activity)}
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={PHYSIO_RANGES.activity.min}
                max={PHYSIO_RANGES.activity.max}
                step={PHYSIO_RANGES.activity.step}
                value={activity}
                onChange={(e) => {
                  setActivePresetId('custom');
                  setActivity(parseFloat(e.target.value));
                }}
                className="w-full accent-[#244D38] cursor-pointer"
              />

              <div className="flex justify-between items-center text-[11px] text-stone-500">
                <span>Lethargy: &lt;40</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Normal: 65 – 95 index
                </span>
                <span>Hyperactivity: &gt;100</span>
              </div>
            </div>

            {/* SLIDER 3: MILK ELECTRICAL CONDUCTIVITY (EC) */}
            <div className="p-4 rounded-2xl bg-[#FAF9F3] border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-xs sm:text-sm text-[#183629]">
                    {t('simulation.sliderEc', 'Milk Electrical Conductivity (EC)')}
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono">({PHYSIO_RANGES.milk_ec.unit})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getParamStatus('milk_ec', milkEc).color}`}>
                    {getParamStatus('milk_ec', milkEc).label}
                  </span>
                  <span className="text-base font-black font-mono text-[#183629] bg-white px-2.5 py-0.5 rounded-lg border border-stone-200">
                    {milkEc.toFixed(2)} mS/cm
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={PHYSIO_RANGES.milk_ec.min}
                max={PHYSIO_RANGES.milk_ec.max}
                step={PHYSIO_RANGES.milk_ec.step}
                value={milkEc}
                onChange={(e) => {
                  setActivePresetId('custom');
                  setMilkEc(parseFloat(e.target.value));
                }}
                className="w-full accent-[#244D38] cursor-pointer"
              />

              <div className="flex justify-between items-center text-[11px] text-stone-500">
                <span>Healthy Floor: 3.5</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Normal: 4.0 – 5.0 mS/cm
                </span>
                <span>Inflammatory Spike: &gt;5.8</span>
              </div>
            </div>

            {/* SLIDER 4: MILK PH */}
            <div className="p-4 rounded-2xl bg-[#FAF9F3] border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-teal-600" />
                  <span className="font-bold text-xs sm:text-sm text-[#183629]">
                    {t('simulation.sliderPh', 'Milk Acidity (pH Level)')}
                  </span>
                  <span className="text-[11px] text-stone-400 font-mono">({PHYSIO_RANGES.milk_ph.unit})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getParamStatus('milk_ph', milkPh).color}`}>
                    {getParamStatus('milk_ph', milkPh).label}
                  </span>
                  <span className="text-base font-black font-mono text-[#183629] bg-white px-2.5 py-0.5 rounded-lg border border-stone-200">
                    {milkPh.toFixed(2)} pH
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={PHYSIO_RANGES.milk_ph.min}
                max={PHYSIO_RANGES.milk_ph.max}
                step={PHYSIO_RANGES.milk_ph.step}
                value={milkPh}
                onChange={(e) => {
                  setActivePresetId('custom');
                  setMilkPh(parseFloat(e.target.value));
                }}
                className="w-full accent-[#244D38] cursor-pointer"
              />

              <div className="flex justify-between items-center text-[11px] text-stone-500">
                <span>Acidic: 6.20</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Normal: 6.50 – 6.80 pH
                </span>
                <span>Alkaline Leakage: &gt;7.00</span>
              </div>
            </div>

            {/* SIMULATION ACTION BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleRunPrediction}
                disabled={isPredicting || !selectedCowId}
                className="w-full py-4 px-6 rounded-2xl bg-[#183629] hover:bg-[#244D38] text-white font-bold text-sm sm:text-base transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
              >
                {isPredicting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{t('simulation.evaluating', 'Executing Random Forest Inference...')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-[#A9BCA3]" />
                    <span>{t('simulation.runInference', 'Run AI Prediction & Persist Simulation')}</span>
                    <ArrowRight className="w-5 h-5 text-[#A9BCA3]" />
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-stone-400 mt-2">
                {t('simulation.sendPayloadDesc')}
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE INFERENCE RESULTS & CLINICAL TRIAGE ROUTE (5 COLUMNS) */}
        <div className="lg:col-span-5 space-y-6">
          {predictionResult ? (
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#244D38]/20 shadow-lg space-y-6">
              {/* Header with Risk Category */}
              <div className="space-y-3 pb-5 border-b border-stone-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    {t('simulation.resultHeader', 'Live Inference Result')}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">
                    {new Date(predictionResult.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className={`p-4 rounded-2xl border ${getRiskBadge(predictionResult.risk_category).bg} ${getRiskBadge(predictionResult.risk_category).border}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase font-extrabold tracking-wider text-stone-500 block mb-0.5">
                        {t('simulation.riskStratification', 'Predicted Risk Category')}
                      </span>
                      <h2 className="text-2xl font-black font-serif tracking-tight">
                        {predictionResult.risk_category}
                      </h2>
                    </div>
                    <div className="text-right">
                      <span className="text-xs uppercase font-bold text-stone-500 block mb-0.5">{t("simulation.confidence", "Confidence")}</span>
                      <span className="text-xl font-black font-mono">
                        {(predictionResult.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Cow Profile & DB Record ID */}
              <div className="p-3.5 rounded-2xl bg-[#FAF9F3] border border-stone-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">{t("simulation.evaluatedSubject", "Evaluated Subject:")}</span>
                  <span className="font-bold text-[#183629]">
                    #{predictionResult.cow_id} — {predictionResult.cow_name} ({predictionResult.cow_breed})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{t("simulation.databaseRecord", "Database Record:")}</span>
                  <span className="font-mono text-stone-700">Reading #{predictionResult.reading_id || 'Temp'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{t("simulation.modelEngine", "Model Engine:")}</span>
                  <span className="text-[11px] font-semibold text-[#244D38]">{predictionResult.model_engine}</span>
                </div>
              </div>

              {/* Class Probability Distribution Gauge */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-[#183629]">
                  <span>{t('simulation.probabilityDist', 'Multi-Class Softmax Probabilities')}</span>
                  <span className="text-[11px] text-stone-400 font-normal">{t("simulation.calcByRf", "Calculated by Random Forest")}</span>
                </div>
                <div className="space-y-1.5 bg-[#FAF9F3] p-3 rounded-2xl border border-stone-100">
                  {Object.entries(predictionResult.probabilities).map(([cls, prob]) => {
                    const pct = Math.round(prob * 100);
                    const isDominant = cls === predictionResult.risk_category;
                    return (
                      <div key={cls} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className={isDominant ? 'font-bold text-[#183629]' : 'text-stone-600'}>
                            {cls}
                          </span>
                          <span className="font-mono font-semibold">{pct}%</span>
                        </div>
                        <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              cls === 'High Risk'
                                ? 'bg-red-500'
                                : cls === 'Moderate Risk'
                                ? 'bg-amber-500'
                                : cls === 'Low Risk'
                                ? 'bg-blue-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contributing Factors & Physiological Shifts */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#183629] block">
                  {t('simulation.deviationsHeader', 'Contributing Bio-Physical Deviations')}
                </span>
                <ul className="space-y-2">
                  {predictionResult.contributing_factors.map((factor, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 flex items-start gap-2 leading-relaxed"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#244D38] shrink-0 mt-1.5"></span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Clinical Next Step */}
              <div className="p-4 rounded-2xl bg-[#183629]/5 border border-[#244D38]/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#183629]">
                  <Stethoscope className="w-4 h-4 text-[#244D38]" />
                  <span>{t('simulation.recommendedHeader', 'Recommended Clinical Action')}</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  {predictionResult.recommended_action}
                </p>
              </div>

              {/* Alert Generation Notification & Transition to Vet Portal */}
              {predictionResult.alert_created && predictionResult.alert_id && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-300 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-900">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>{t("simulation.alertDispatched", { id: predictionResult.alert_id })}</span>
                  </div>
                  <p className="text-[11px] text-red-800 leading-normal">
                    Due to elevated risk, a high-priority alert was written to SQLite and is now awaiting triage in the Veterinary Case Portal.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/vet')}
                    className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>{t('simulation.openCaseInVet', 'Open Case in Vet Portal')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Cow Profile Dossier Link */}
              <div className="pt-2 text-center">
                <Link
                  to={`/cows/${predictionResult.cow_id}`}
                  className="text-xs font-bold text-[#244D38] hover:underline inline-flex items-center gap-1"
                >
                  <span>{t("simulation.viewDossier", { id: predictionResult.cow_id })}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-[#244D38]/15 shadow-xs text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#FAF9F3] border border-stone-200 text-[#244D38] flex items-center justify-center mx-auto">
                <Cpu className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="font-serif text-lg font-bold text-[#183629]">
                  {t('simulation.awaitingSim', 'Awaiting Telemetry Simulation')}
                </h2>
                <p className="text-stone-500 text-xs leading-relaxed max-w-sm mx-auto">
                  {t('simulation.awaitingSimDesc')}
                </p>
              </div>
              <div className="pt-4 border-t border-stone-100 flex items-center justify-center gap-4 text-xs text-stone-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {t("simulation.fastApiEndpoint", "Real FastAPI ML Endpoint")}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {t("simulation.sqlitePersistence", "SQLite Persistence")}
                </span>
              </div>
            </div>
          )}

          {/* SECONDARY CARD: BATCH TELEMETRY GENERATOR */}
          <div className="bg-[#FAF9F3] p-5 sm:p-6 rounded-3xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#244D38]" />
                <span className="font-bold text-xs text-[#183629]">{t("simulation.routineHerdCycle", "Routine Herd Telemetry Cycle")}</span>
              </div>
              <span className="text-[10px] text-stone-400 font-mono">{cows.length} {t("simulation.registeredCows", "Registered Cows")}</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              {t('simulation.routineHerdDesc')}
            </p>
            <button
              type="button"
              onClick={handleRunHerdBatch}
              disabled={batchLoading || cows.length === 0}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-[#183629] font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${batchLoading ? 'animate-spin' : ''}`} />
              <span>{batchLoading ? t('simulation.simulatingRoutine', 'Simulating Routine Step...') : t('simulation.triggerHerdStep', 'Trigger Full Herd Step')}</span>
            </button>
            {batchFeedback && (
              <p className="text-[11px] text-emerald-700 font-medium text-center">{batchFeedback}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationPanel;
