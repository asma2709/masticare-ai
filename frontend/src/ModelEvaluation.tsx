import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API_BASE } from './services/api';
import {
  ShieldAlert,
  BarChart3,
  Info,
  CheckCircle2,
  Scale,
  Cpu,
  Layers,
} from 'lucide-react';
import { MastiCareLogoIcon } from './components/MastiCareLogo';

interface FeatureItem {
  name: string;
  label: string;
  unit: string;
  importance: number;
}

interface ClassMetric {
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
}

interface MetricsData {
  model: string;
  model_version: string;
  dataset_type: string;
  accuracy: number;
  balanced_accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  baseline_model: string;
  baseline_accuracy: number;
  baseline_f1_score: number;
  classes: string[];
  confusion_matrix: number[][];
  class_metrics: Record<string, ClassMetric>;
  feature_importances: Record<string, number>;
  train_samples: number;
  test_samples: number;
  features: FeatureItem[];
  protocol_notes: string;
}

const ModelEvaluation: React.FC = () => {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await axios.get(`${API_BASE}/model/metrics`);
      setMetrics(res.data);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError('Could not retrieve model metrics from backend.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse space-y-4 max-w-md mx-auto">
          <div className="h-8 bg-stone-200 rounded-xl w-3/4 mx-auto"></div>
          <div className="h-4 bg-stone-200 rounded-xl w-1/2 mx-auto"></div>
          <p className="text-stone-400 text-sm">{t("metrics.loadingMetrics", "Evaluating model performance and loading matrix...")}</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-[#183629]">
          {t("metrics.metricsNotFound", "Evaluation Results Unavailable")}
        </h2>
        <p className="text-stone-600 text-sm">
          {error || t('metrics.ensureMetrics', 'Model metrics file not found. Ensure backend/metrics.json is present.')}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. HEADER BANNER */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#244D38]/15 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-4">
            <MastiCareLogoIcon size={46} theme="light" framed={true} className="mt-0.5 shrink-0" />
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#244D38] mb-1">
                <BarChart3 className="w-4 h-4 text-[#244D38]" />
                <span>{t("metrics.headerBadge")}</span>
              </div>
              <h1 className="font-serif text-3xl font-bold text-[#183629]">
                {t("metrics.title")}
              </h1>
              <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-2xl">
                {t("metrics.subtitle")}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-[#183629] text-white text-xs font-mono font-bold">
              {metrics.model} v{metrics.model_version}
            </span>
          </div>
        </div>

        {/* Model Validation Guidelines */}
        <div className="p-4 rounded-2xl bg-[#244D38]/5 border border-[#244D38]/15 text-[#183629] text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-[#244D38]">
            <Info className="w-4 h-4 text-[#244D38] shrink-0" />
            <span>{t("metrics.disclaimerTitle")}</span>
          </div>
          <p className="text-stone-600 leading-relaxed pl-6">
            <strong>{metrics.dataset_type}:</strong> {metrics.protocol_notes}
          </p>
        </div>
      </div>

      {/* 2. FOUR PRIMARY METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Overall Accuracy */}
        <div className="bg-white p-6 rounded-3xl border border-[#244D38]/10 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
            {t("metrics.cardAccuracy")}
          </span>
          <div className="my-4">
            <span className="font-serif text-4xl sm:text-5xl font-bold text-[#244D38]">
              {(metrics.accuracy * 100).toFixed(2)}%
            </span>
          </div>
          <span className="text-[11px] text-stone-400 font-mono">
            {metrics.test_samples.toLocaleString()} {t("metrics.cardAccuracySub")}
          </span>
        </div>

        {/* Metric 2: {t("metrics.cardBalanced")} */}
        <div className="bg-white p-6 rounded-3xl border border-[#244D38]/10 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
            {t("metrics.cardBalanced")}
          </span>
          <div className="my-4">
            <span className="font-serif text-4xl sm:text-5xl font-bold text-blue-700">
              {(metrics.balanced_accuracy * 100).toFixed(2)}%
            </span>
          </div>
          <span className="text-[11px] text-stone-400">
            {t("metrics.cardBalancedSub")}
          </span>
        </div>

        {/* Metric 3: Precision */}
        <div className="bg-white p-6 rounded-3xl border border-[#244D38]/10 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
            {t("metrics.cardPrecision")}
          </span>
          <div className="my-4">
            <span className="font-serif text-4xl sm:text-5xl font-bold text-indigo-700">
              {(metrics.precision * 100).toFixed(2)}%
            </span>
          </div>
          <span className="text-[11px] text-stone-400">
            {t("metrics.cardPrecisionSub")}
          </span>
        </div>

        {/* Metric 4: {t("metrics.cardF1")} */}
        <div className="bg-white p-6 rounded-3xl border border-[#244D38]/10 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
            {t("metrics.cardF1")}
          </span>
          <div className="my-4">
            <span className="font-serif text-4xl sm:text-5xl font-bold text-[#183629]">
              {(metrics.f1_score * 100).toFixed(2)}%
            </span>
          </div>
          <span className="text-[11px] text-stone-400 font-mono">
            {t("metrics.cardF1Sub")}
          </span>
        </div>
      </div>

      {/* 3. BASELINE COMPARISON TABLE */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#244D38]/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#244D38]">
              <Scale className="w-4 h-4 text-[#244D38]" />
              <span>{t("metrics.comparisonTitle")}</span>
            </div>
            <h2 className="font-serif text-xl font-bold text-[#183629] mt-0.5">
              {t("metrics.comparisonSub")}
            </h2>
            <p className="text-stone-500 text-xs">
              {t("metrics.comparisonDesc")}
            </p>
          </div>
          <span className="text-xs text-stone-400 font-mono hidden sm:inline-block">80/20 Stratified Holdout</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-stone-200 rounded-2xl overflow-hidden">
            <thead className="bg-[#FAF9F3] text-stone-600 font-bold uppercase text-[11px]">
              <tr>
                <th className="p-3.5 border-b border-stone-200">{t("metrics.colArch")}</th>
                <th className="p-3.5 border-b border-stone-200">{t("metrics.colAcc")}</th>
                <th className="p-3.5 border-b border-stone-200">{t("metrics.cardF1")}</th>
                <th className="p-3.5 border-b border-stone-200">{t("metrics.colNonLinear")}</th>
                <th className="p-3.5 border-b border-stone-200">{t("metrics.colStatus")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              <tr className="bg-emerald-50/40 font-semibold text-[#183629]">
                <td className="p-3.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <strong>{metrics.model} (Primary)</strong>
                </td>
                <td className="p-3.5 font-mono text-emerald-800 font-bold">
                  {(metrics.accuracy * 100).toFixed(2)}%
                </td>
                <td className="p-3.5 font-mono text-emerald-800 font-bold">
                  {(metrics.f1_score * 100).toFixed(2)}%
                </td>
                <td className="p-3.5 text-stone-600">{t("metrics.rfNonLinearDesc")}</td>
                <td className="p-3.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {t("metrics.activeProduction")}
                  </span>
                </td>
              </tr>
              <tr className="text-stone-700">
                <td className="p-3.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-stone-400"></span>
                  <span>{metrics.baseline_model} (Baseline)</span>
                </td>
                <td className="p-3.5 font-mono">
                  {(metrics.baseline_accuracy * 100).toFixed(2)}%
                </td>
                <td className="p-3.5 font-mono">
                  {(metrics.baseline_f1_score * 100).toFixed(2)}%
                </td>
                <td className="p-3.5 text-stone-500">{t("metrics.linearBaselineDesc")}</td>
                <td className="p-3.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-medium">
                    {t("metrics.linearBaseline")}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. PER-CLASS METRICS TABLE & DYNAMIC FEATURE IMPORTANCES */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left: Per-Class Performance Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#244D38]/10 shadow-xs space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#244D38]">
              <Layers className="w-4 h-4 text-[#244D38]" />
              <span>{t("metrics.perClassTitle")}</span>
            </div>
            <h2 className="font-serif text-xl font-bold text-[#183629] mt-0.5">
              {t("metrics.perClassSub")}
            </h2>
            <p className="text-stone-500 text-xs">
              {t("metrics.perClassSensitivity", "Consistent sensitivity across all four physiological risk tiers.")}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-stone-200 rounded-2xl overflow-hidden">
              <thead className="bg-[#FAF9F3] text-stone-600 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-3 border-b border-stone-200">{t("metrics.colRiskClass")}</th>
                  <th className="p-3 border-b border-stone-200">{t("metrics.colPrecision")}</th>
                  <th className="p-3 border-b border-stone-200">{t("metrics.colRecall")}</th>
                  <th className="p-3 border-b border-stone-200">{t("metrics.colF1Score")}</th>
                  <th className="p-3 border-b border-stone-200">{t("metrics.colSupport")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono">
                {metrics.classes.map((cls) => {
                  const m = metrics.class_metrics[cls];
                  if (!m) return null;
                  return (
                    <tr key={cls} className="hover:bg-stone-50/50">
                      <td className="p-3 font-sans font-bold text-[#183629]">{cls}</td>
                      <td className="p-3 text-stone-700">{(m.precision * 100).toFixed(1)}%</td>
                      <td className="p-3 text-stone-700">{(m.recall * 100).toFixed(1)}%</td>
                      <td className="p-3 font-bold text-[#244D38]">{(m.f1_score * 100).toFixed(1)}%</td>
                      <td className="p-3 text-stone-500">{m.support}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Feature Importances (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-[#244D38]/10 shadow-xs space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#244D38]">
              <Cpu className="w-4 h-4 text-[#244D38]" />
              <span>{t("metrics.featImportanceTitle")}</span>
            </div>
            <h2 className="font-serif text-xl font-bold text-[#183629] mt-0.5">
              {t("metrics.featImportanceSub")}
            </h2>
            <p className="text-stone-500 text-xs">
              {t("metrics.featImportanceDesc")}
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {metrics.features.map((feat) => {
              const pct = (feat.importance * 100).toFixed(1);
              return (
                <div key={feat.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#183629]">{feat.label}</span>
                    <span className="font-mono text-stone-600 font-bold">{pct}%</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#244D38] h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>{t("metrics.variableLabel", { name: feat.name })}</span>
                    <span>{t("metrics.unitsLabel", { unit: feat.unit })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. FULL 4x4 CONFUSION MATRIX */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#244D38]/10 shadow-xs space-y-6">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#183629]">
            {t("metrics.confusionMatrixTitle")}
          </h2>
          <p className="text-stone-500 text-xs mt-0.5">
            {t("metrics.matrixSubtitle", { samples: metrics.test_samples.toLocaleString() })}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr>
                <th className="p-3 bg-[#FAF9F5] text-stone-500 font-semibold text-left border border-stone-200">
                  {t("metrics.truePredicted")}
                </th>
                {metrics.classes.map((cls) => (
                  <th
                    key={cls}
                    className="p-3 bg-[#FAF9F5] text-[#183629] font-bold border border-stone-200"
                  >
                    {cls}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.confusion_matrix.map((row, i) => (
                <tr key={i}>
                  <td className="p-3 bg-[#FAF9F5] font-bold text-[#183629] text-left border border-stone-200">
                    {metrics.classes[i]}
                  </td>
                  {row.map((val, j) => {
                    const isDiagonal = i === j;
                    return (
                      <td
                        key={j}
                        className={`p-3 font-mono border border-stone-200 text-sm ${
                          isDiagonal
                            ? 'bg-emerald-50 text-emerald-900 font-bold'
                            : val > 0
                            ? 'bg-red-50/70 text-red-800 font-semibold'
                            : 'text-stone-400'
                        }`}
                      >
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF9F3] border border-stone-200 text-xs text-stone-600 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {t('metrics.matrixInterpretation')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModelEvaluation;
