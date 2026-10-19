import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
  Search,
  ChevronRight,
  Layers,
  Filter,
  AlertCircle,
  HeartPulse,
} from 'lucide-react';
import { MastiCareLogoIcon } from './components/MastiCareLogo';

export interface Cow {
  id: number;
  name: string;
  rfid: string;
  breed: string;
  age: number;
}

const API_BASE = 'http://localhost:8000/api/v1';

const CowList: React.FC = () => {
  const { t } = useTranslation();
  const [cows, setCows] = useState<Cow[]>([]);
  const [search, setSearch] = useState('');
  const [selectedBreed, setSelectedBreed] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCows();
  }, []);

  const fetchCows = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/cows`);
      setCows(res.data || []);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError('Failed to connect to backend API on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const breeds = Array.from(new Set(cows.map((c) => c.breed)));

  const filteredCows = cows.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.rfid.toLowerCase().includes(search.toLowerCase());
    const matchesBreed = selectedBreed === 'ALL' || c.breed === selectedBreed;
    return matchesSearch && matchesBreed;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#244D38]/15 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-start gap-4">
          <MastiCareLogoIcon size={42} theme="light" framed={true} className="mt-0.5 shrink-0" />
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#244D38] mb-1">
              <Layers className="w-4 h-4 text-[#244D38]" />
              <span>{t('cows.headerBadge')}</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#183629]">
              {t('cows.title')}
            </h1>
            <p className="text-stone-500 text-xs sm:text-sm mt-1">
              {t('cows.subtitle', { count: cows.length })}
            </p>
          </div>
        </div>

        {/* Search & Breed Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-3 text-stone-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('cows.searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#F7F6EF] border border-[#244D38]/15 text-xs text-[#183629] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#244D38]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {breeds.length > 1 && (
            <div className="flex items-center gap-1.5 bg-[#F7F6EF] px-3 py-2 rounded-xl border border-[#244D38]/15 text-xs">
              <Filter className="w-3.5 h-3.5 text-stone-500" />
              <select
                value={selectedBreed}
                onChange={(e) => setSelectedBreed(e.target.value)}
                className="bg-transparent border-none text-[#183629] font-medium focus:outline-none text-xs cursor-pointer"
              >
                <option value="ALL">{t('cows.allBreeds')}</option>
                {breeds.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Herd Table */}
      <div className="bg-white rounded-3xl border border-[#244D38]/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#FAF9F5] border-b border-stone-200/60 text-stone-600 uppercase tracking-wider font-semibold">
                <th className="py-4 px-6">{t('cows.thRfid')}</th>
                <th className="py-4 px-6">{t('cows.thName')}</th>
                <th className="py-4 px-6">{t('cows.thBreed')}</th>
                <th className="py-4 px-6">{t('cows.thAge')}</th>
                <th className="py-4 px-6">{t('cows.thTelemetry')}</th>
                <th className="py-4 px-6 text-right">{t('cows.thActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredCows.map((c) => (
                <tr key={c.id} className="hover:bg-[#FAF9F5] transition">
                  <td className="py-4 px-6 font-mono font-semibold text-[#183629]">
                    <span className="bg-[#F7F6EF] px-2.5 py-1 rounded-md border border-stone-200">
                      {c.rfid}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-medium text-[#183629]">
                    <div className="flex items-center gap-2.5">
                      <MastiCareLogoIcon size={24} theme="light" framed={true} />
                      <span className="font-semibold">{c.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-stone-600">{c.breed}</td>
                  <td className="py-4 px-6 text-stone-600">{c.age} {t('cows.years')}</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-200">
                      <HeartPulse className="w-3 h-3 text-emerald-600" />
                      {t('cows.collarMilk')}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <Link
                      to={`/simulation`}
                      className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:text-[#183629] hover:bg-[#F7F6EF] font-semibold text-xs transition"
                    >
                      {t('cows.telemetryBtn')}
                    </Link>
                    <Link
                      to={`/cows/${c.id}`}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#244D38] hover:bg-[#183629] text-white font-semibold text-xs transition shadow-2xs"
                    >
                      <span>{t('cows.viewHealthBtn')}</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}

              {filteredCows.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    {t('cows.noMatch', { search })}
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    {t('cows.loadingRecords')}
                  </td>
                </tr>
              )}
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

export default CowList;
