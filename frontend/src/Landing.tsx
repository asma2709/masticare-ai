import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Droplets,
  Zap,
  Thermometer,
  Cpu,
  BarChart3,
  Stethoscope,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Info,
} from 'lucide-react';
import MastiCareLogo from './components/MastiCareLogo';

const Landing: React.FC = () => {
  const { t } = useTranslation();

  const scrollToWorkflow = () => {
    const el = document.getElementById('prediction-workflow');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-[#FAF9F3] text-[#183629]">
      {/* 1. CINEMATIC PRODUCT HERO */}
      <section className="relative w-full min-h-[88vh] flex items-center justify-center overflow-hidden bg-[#183629] text-white">
        {/* Background Image with Dark Green Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero_pasture.jpg"
            alt="Dairy cows grazing peacefully at dawn in pasture"
            className="w-full h-full object-cover object-center filter brightness-[0.55] contrast-[1.08] saturate-[0.85]"
          />
          {/* Subtle gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#183629] via-[#183629]/60 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#183629]/80 via-transparent to-[#183629]/50" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 flex flex-col items-center text-center">
          {/* Official Logo Banner */}
          <div className="mb-6">
            <MastiCareLogo
              variant="horizontal"
              theme="dark"
              size="lg"
              className="bg-black/35 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-white/20 shadow-lg"
            />
          </div>

          {/* Prototype Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#A9BCA3] text-xs font-semibold tracking-wide mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{t('landing.prototypeBadge')}</span>
          </div>

          {/* Hero Headline */}
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#FAF9F3] max-w-4xl leading-[1.1]">
            {t('landing.heroTitle')} <br />
            <span className="italic font-normal text-[#A9BCA3]">{t('landing.heroSubtitle')}</span>
          </h1>

          {/* Supporting Copy */}
          <p className="mt-6 text-base sm:text-xl md:text-2xl text-stone-200/95 max-w-3xl font-light leading-relaxed">
            {t('landing.heroDesc')}
          </p>

          {/* Three Key CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            {/* Primary CTA: Launch Live Demo */}
            <Link
              to="/simulation"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#A9BCA3] hover:bg-[#99ac93] text-[#183629] font-extrabold text-base shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <Cpu className="w-5 h-5 text-[#183629]" />
              <span>{t('landing.launchDemo')}</span>
              <ArrowRight className="w-4 h-4 text-[#183629]" />
            </Link>

            {/* Secondary CTA: Explore Workflow */}
            <button
              type="button"
              onClick={scrollToWorkflow}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-base backdrop-blur-md border border-white/25 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#A9BCA3]" />
              <span>{t('landing.exploreWorkflow')}</span>
            </button>

            {/* Third CTA: View Model Evaluation */}
            <Link
              to="/metrics"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-black/25 hover:bg-black/40 text-stone-200 font-semibold text-sm backdrop-blur-md border border-white/15 transition-all duration-200 hover:-translate-y-0.5"
            >
              <BarChart3 className="w-4 h-4 text-[#A9BCA3]" />
              <span>{t('landing.viewModel')}</span>
            </Link>
          </div>

          {/* Transparent Simulation Notice */}
          <div className="mt-12 flex items-center gap-2.5 text-xs text-stone-300 bg-black/35 backdrop-blur-md px-4 py-2 rounded-full border border-white/15">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{t('landing.demoNotice')}</span>
          </div>
        </div>
      </section>

      {/* 2. SECTION 1: HOW MASTICARE AI WORKS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#244D38] bg-[#244D38]/10 px-3 py-1 rounded-full">
            {t('landing.principlesBadge')}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#183629] mt-3">
            {t('landing.principlesTitle')}
          </h2>
          <p className="text-stone-600 mt-3 text-base leading-relaxed">
            {t('landing.principlesDesc')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1: Temperature */}
          <div className="p-6 rounded-3xl bg-white border border-[#244D38]/15 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-5 border border-orange-200">
                <Thermometer className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#183629] mb-2">
                {t('landing.tempTitle')}
              </h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                {t('landing.tempDesc')}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] font-mono text-stone-500">
              {t('landing.tempInterval')}
            </div>
          </div>

          {/* Pillar 2: Rumination & Activity */}
          <div className="p-6 rounded-3xl bg-white border border-[#244D38]/15 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 border border-indigo-200">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#183629] mb-2">
                {t('landing.ruminationTitle')}
              </h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                {t('landing.ruminationDesc')}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] font-mono text-stone-500">
              {t('landing.ruminationInterval')}
            </div>
          </div>

          {/* Pillar 3: Milk Electrical Conductivity */}
          <div className="p-6 rounded-3xl bg-white border border-[#244D38]/15 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 border border-blue-200">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#183629] mb-2">
                {t('landing.ecTitle')}
              </h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                {t('landing.ecDesc')}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] font-mono text-stone-500">
              {t('landing.ecInterval')}
            </div>
          </div>

          {/* Pillar 4: Milk pH Level */}
          <div className="p-6 rounded-3xl bg-white border border-[#244D38]/15 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5 border border-teal-200">
                <Droplets className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#183629] mb-2">
                {t('landing.phTitle')}
              </h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                {t('landing.phDesc')}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] font-mono text-stone-500">
              {t('landing.phInterval')}
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION 2: THE COW MONITORING & PREDICTION WORKFLOW */}
      <section id="prediction-workflow" className="bg-white border-y border-[#244D38]/10 py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#244D38] bg-[#244D38]/10 px-3 py-1 rounded-full">
              {t('landing.pipelineBadge')}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#183629] mt-3">
              {t('landing.pipelineTitle')}
            </h2>
            <p className="text-stone-600 mt-3 text-base">
              {t('landing.pipelineDesc')}
            </p>
          </div>

          {/* Step-by-Step Interactive Flowchart */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 relative">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-[#FAF9F3] border border-stone-200 flex flex-col justify-between">
              <div>
                <span className="w-7 h-7 rounded-full bg-[#183629] text-white flex items-center justify-center font-bold text-xs mb-3">
                  1
                </span>
                <h4 className="font-bold text-sm text-[#183629]">{t('landing.step1Title')}</h4>
                <p className="text-stone-600 text-xs mt-1 leading-relaxed">
                  {t('landing.step1Desc')}
                </p>
              </div>
              <div className="mt-3 text-[10px] text-[#244D38] font-semibold">{t('landing.step1Sub')}</div>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-[#FAF9F3] border border-stone-200 flex flex-col justify-between">
              <div>
                <span className="w-7 h-7 rounded-full bg-[#183629] text-white flex items-center justify-center font-bold text-xs mb-3">
                  2
                </span>
                <h4 className="font-bold text-sm text-[#183629]">{t('landing.step2Title')}</h4>
                <p className="text-stone-600 text-xs mt-1 leading-relaxed">
                  {t('landing.step2Desc')}
                </p>
              </div>
              <div className="mt-3 text-[10px] text-[#244D38] font-semibold">{t('landing.step2Sub')}</div>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-[#FAF9F3] border border-stone-200 flex flex-col justify-between">
              <div>
                <span className="w-7 h-7 rounded-full bg-[#183629] text-white flex items-center justify-center font-bold text-xs mb-3">
                  3
                </span>
                <h4 className="font-bold text-sm text-[#183629]">{t('landing.step3Title')}</h4>
                <p className="text-stone-600 text-xs mt-1 leading-relaxed">
                  {t('landing.step3Desc')}
                </p>
              </div>
              <div className="mt-3 text-[10px] text-[#244D38] font-semibold">{t('landing.step3Sub')}</div>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-[#FAF9F3] border border-stone-200 flex flex-col justify-between">
              <div>
                <span className="w-7 h-7 rounded-full bg-[#183629] text-white flex items-center justify-center font-bold text-xs mb-3">
                  4
                </span>
                <h4 className="font-bold text-sm text-[#183629]">{t('landing.step4Title')}</h4>
                <p className="text-stone-600 text-xs mt-1 leading-relaxed">
                  {t('landing.step4Desc')}
                </p>
              </div>
              <div className="mt-3 text-[10px] text-[#244D38] font-semibold">{t('landing.step4Sub')}</div>
            </div>

            {/* Step 5 */}
            <div className="p-5 rounded-2xl bg-[#FAF9F3] border border-stone-200 flex flex-col justify-between">
              <div>
                <span className="w-7 h-7 rounded-full bg-[#183629] text-white flex items-center justify-center font-bold text-xs mb-3">
                  5
                </span>
                <h4 className="font-bold text-sm text-[#183629]">{t('landing.step5Title')}</h4>
                <p className="text-stone-600 text-xs mt-1 leading-relaxed">
                  {t('landing.step5Desc')}
                </p>
              </div>
              <div className="mt-3 text-[10px] text-[#244D38] font-semibold">{t('landing.step5Sub')}</div>
            </div>

            {/* Step 6 */}
            <div className="p-5 rounded-2xl bg-[#FAF9F3] border border-stone-200 flex flex-col justify-between">
              <div>
                <span className="w-7 h-7 rounded-full bg-[#183629] text-white flex items-center justify-center font-bold text-xs mb-3">
                  6
                </span>
                <h4 className="font-bold text-sm text-[#183629]">{t('landing.step6Title')}</h4>
                <p className="text-stone-600 text-xs mt-1 leading-relaxed">
                  {t('landing.step6Desc')}
                </p>
              </div>
              <div className="mt-3 text-[10px] text-[#244D38] font-semibold">{t('landing.step6Sub')}</div>
            </div>
          </div>

          {/* Workflow CTA */}
          <div className="mt-12 text-center">
            <Link
              to="/simulation"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#183629] hover:bg-[#244D38] text-white font-bold text-sm shadow-md transition hover:-translate-y-0.5"
            >
              <span>{t('landing.testLoopBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. SECTION 3: INTERACTIVE HEALTH ASSESSMENT STUDIO */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="bg-[#183629] text-white rounded-3xl p-8 sm:p-12 lg:p-16 border border-[#244D38] relative overflow-hidden">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#A9BCA3]">
                {t('landing.juryBadge')}
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#FAF9F3] leading-tight">
                {t('landing.presetsTitle')}
              </h2>
              <p className="text-stone-300 text-sm sm:text-base leading-relaxed font-light">
                {t('landing.presetsDesc')}
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  to="/simulation"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#A9BCA3] hover:bg-[#9cb096] text-[#183629] font-bold text-sm transition"
                >
                  <Cpu className="w-4 h-4" />
                  <span>{t('landing.openSimBtn')}</span>
                </Link>
                <Link
                  to="/vet"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition"
                >
                  <Stethoscope className="w-4 h-4 text-[#A9BCA3]" />
                  <span>{t('landing.inspectVetBtn')}</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 font-semibold text-stone-200">
                <span>{t('landing.presetListHeader')}</span>
                <span className="text-[10px] text-[#A9BCA3]">{t('landing.fastApiReady')}</span>
              </div>
              <ul className="space-y-2 text-stone-300">
                <li className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                  <span>{t('landing.preset1')}</span>
                  <span className="text-emerald-400 font-bold text-[11px]">No Risk</span>
                </li>
                <li className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                  <span>{t('landing.preset2')}</span>
                  <span className="text-blue-400 font-bold text-[11px]">Low Risk</span>
                </li>
                <li className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                  <span>{t('landing.preset3')}</span>
                  <span className="text-blue-400 font-bold text-[11px]">Low Risk</span>
                </li>
                <li className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                  <span>{t('landing.preset4')}</span>
                  <span className="text-amber-400 font-bold text-[11px]">Moderate Risk</span>
                </li>
                <li className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                  <span>{t('landing.preset5')}</span>
                  <span className="text-red-400 font-bold text-[11px]">High Risk</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION 4: RISK CLASSIFICATION & VETERINARY RESPONSE */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#244D38] bg-[#244D38]/10 px-3 py-1 rounded-full">
            {t('landing.protocolBadge')}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#183629] mt-3">
            {t('landing.riskResponseTitle')}
          </h2>
          <p className="text-stone-600 mt-3 text-base">
            {t('landing.riskResponseDesc')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* No Risk */}
          <div className="p-6 rounded-3xl bg-white border border-emerald-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 mb-4">
                NO RISK
              </span>
              <h3 className="font-serif text-lg font-bold text-[#183629] mb-2">{t('landing.noRiskTitle')}</h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                {t('landing.noRiskDesc')}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-stone-100 text-xs text-stone-700 bg-emerald-50/50 p-2.5 rounded-xl">
              <strong className="block text-emerald-900 font-semibold mb-0.5">{t('landing.recommendedAction')}</strong>
              {t('landing.noRiskAction')}
            </div>
          </div>

          {/* Low Risk */}
          <div className="p-6 rounded-3xl bg-white border border-blue-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 mb-4">
                LOW RISK
              </span>
              <h3 className="font-serif text-lg font-bold text-[#183629] mb-2">{t('landing.lowRiskTitle')}</h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                {t('landing.lowRiskDesc')}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-stone-100 text-xs text-stone-700 bg-blue-50/50 p-2.5 rounded-xl">
              <strong className="block text-blue-900 font-semibold mb-0.5">{t('landing.recommendedAction')}</strong>
              {t('landing.lowRiskAction')}
            </div>
          </div>

          {/* Moderate Risk */}
          <div className="p-6 rounded-3xl bg-white border border-amber-300 shadow-xs flex flex-col justify-between">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 mb-4">
                MODERATE RISK
              </span>
              <h3 className="font-serif text-lg font-bold text-[#183629] mb-2">{t('landing.modRiskTitle')}</h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                {t('landing.modRiskDesc')}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-stone-100 text-xs text-stone-700 bg-amber-50/60 p-2.5 rounded-xl">
              <strong className="block text-amber-950 font-semibold mb-0.5">{t('landing.recommendedAction')}</strong>
              {t('landing.modRiskAction')}
            </div>
          </div>

          {/* High Risk */}
          <div className="p-6 rounded-3xl bg-white border border-red-300 shadow-xs flex flex-col justify-between">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-900 mb-4">
                HIGH RISK
              </span>
              <h3 className="font-serif text-lg font-bold text-[#183629] mb-2">{t('landing.highRiskTitle')}</h3>
              <p className="text-stone-600 text-xs leading-relaxed">
                {t('landing.highRiskDesc')}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-stone-100 text-xs text-stone-700 bg-red-50/60 p-2.5 rounded-xl">
              <strong className="block text-red-950 font-semibold mb-0.5">{t('landing.recommendedAction')}</strong>
              {t('landing.highRiskAction')}
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION 5: MODEL EVALUATION & CURRENT PROTOTYPE LIMITATIONS */}
      <section className="bg-white border-t border-[#244D38]/10 py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#244D38] bg-[#244D38]/10 px-3 py-1 rounded-full">
                {t('landing.integrityBadge')}
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#183629] leading-tight">
                {t('landing.limitationsTitle')}
              </h2>

              <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
                {t('landing.limitationsDesc')}
              </p>

              <ul className="space-y-3 text-xs sm:text-sm text-stone-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{t('landing.limitation1Title')}</strong> {t('landing.limitation1Desc')}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{t('landing.limitation2Title')}</strong> {t('landing.limitation2Desc')}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{t('landing.limitation3Title')}</strong> {t('landing.limitation3Desc')}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{t('landing.limitation4Title')}</strong> {t('landing.limitation4Desc')}
                  </span>
                </li>
              </ul>

              <div className="pt-2">
                <Link
                  to="/metrics"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#244D38] hover:underline"
                >
                  <span>{t('landing.inspectMatrix')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Scientific Evaluation Summary Card */}
            <div className="lg:col-span-6 bg-[#FAF9F3] p-8 rounded-3xl border border-stone-200 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <span className="font-bold text-xs uppercase tracking-wider text-stone-500">
                  {t('landing.holdoutSummary')}
                </span>
                <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-bold">
                  {t('landing.verifiedArtifact')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-stone-200">
                  <span className="text-xs text-stone-500 block">{t('landing.testAccuracy')}</span>
                  <span className="font-serif text-3xl font-bold text-[#183629]">93.67%</span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">{t('landing.holdoutRecords')}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-stone-200">
                  <span className="text-xs text-stone-500 block">{t('landing.macroF1')}</span>
                  <span className="font-serif text-3xl font-bold text-[#183629]">0.9366</span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">{t('landing.balancedClasses')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-stone-600 block">
                  {t('landing.featureImportancesTitle')}
                </span>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>{t('landing.ecTitle')}</span>
                      <strong className="font-mono">38.0%</strong>
                    </div>
                    <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#244D38] h-full" style={{ width: '38.0%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>{t('landing.featMovement')}</span>
                      <strong className="font-mono">28.7%</strong>
                    </div>
                    <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#244D38] h-full" style={{ width: '28.7%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>{t('landing.featPh')}</span>
                      <strong className="font-mono">23.2%</strong>
                    </div>
                    <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#244D38] h-full" style={{ width: '23.2%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>{t('landing.featTemp')}</span>
                      <strong className="font-mono">10.0%</strong>
                    </div>
                    <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#244D38] h-full" style={{ width: '10.0%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
