/**
 * 후원하기 랜딩 (핸드오프 v1.0 §1.1 · §2.1, 시안 img_15)
 *
 * 상위 선택은 직접 PICK / 추천 PICK 두 갈래를 유지하고,
 * "지금 가능한 후원"은 그 아래 핵심 섹션으로 둔다 (§1.1 권장 배치).
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Crosshair, Loader2, Sparkles } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import OfferCard from '../../components/offer/OfferCard';
import { api } from '../../services/api';

const TABS = [
  { key: 'READY_NOW', label: '바로 시작' },
  { key: 'CLOSING_SOON', label: '마감임박' },
  { key: 'ONLINE_ONLY', label: '온라인 전용' },
];

export default function SponsorLanding() {
  const [sections, setSections] = useState<any[]>([]);
  const [tab, setTab] = useState('READY_NOW');
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const r: any = await api.getOfferSections({ surface: 'SPONSOR_LANDING', keys: TABS.map((t) => t.key).join(',') });
      const list = r?.data?.sections || [];
      setSections(list);
      const ids = list.flatMap((s: any) => s.offers.map((o: any) => o.id));
      if (ids.length) api.trackOfferImpressions(ids).catch(() => null);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.getSavedOffers()
      .then((r: any) => setSavedIds((r?.data?.saved || []).map((s: any) => s.offer.id)))
      .catch(() => null);
  }, []);

  const toggleSave = async (o: any) => {
    try {
      if (savedIds.includes(o.id)) { await api.unsaveOffer(o.id); setSavedIds((p) => p.filter((x) => x !== o.id)); }
      else { await api.saveOffer(o.id); setSavedIds((p) => [...p, o.id]); }
    } catch { /* 비로그인은 상세에서 로그인 유도 */ }
  };

  const current = sections.find((s) => s.key === tab);

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16">
      <PublicHeader />

      <div className="max-w-[1400px] mx-auto px-5 pt-6">
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[12.5px]">
          <Link to="/" className="text-slate-400 hover:text-slate-600">홈</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-emerald-700">후원하기</span>
        </nav>

        {/* 상위 두 갈래 */}
        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <Link
            to="/sponsor/direct/athletes"
            className="rounded-2xl border border-slate-200 p-6 sm:p-7 flex items-center gap-5 hover:border-emerald-300 hover:shadow-[0_16px_40px_-24px_rgba(15,23,42,0.24)] transition-all"
          >
            <span className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <Crosshair className="w-7 h-7 text-emerald-600" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[19px] sm:text-[22px] font-black leading-tight break-keep">선수 · 후원슬롯<br />직접 PICK</span>
              <span className="mt-2 block text-[12.5px] text-slate-500 break-keep">
                원하는 선수와 후원슬롯을 직접 선택해 나만의 후원 조합을 만들어보세요.
              </span>
            </span>
            <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
          </Link>

          <Link
            to="/sponsor/recommended"
            className="rounded-2xl border border-slate-200 p-6 sm:p-7 flex items-center gap-5 hover:border-emerald-300 hover:shadow-[0_16px_40px_-24px_rgba(15,23,42,0.24)] transition-all"
          >
            <span className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <Sparkles className="w-7 h-7 text-emerald-600" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[19px] sm:text-[22px] font-black leading-tight break-keep">스폰픽 추천 PICK</span>
              <span className="mt-2 block text-[12.5px] text-slate-500 break-keep">
                목표와 예산을 알려주시면 스폰픽이 선수·슬롯·콘텐츠를 조합해 추천합니다.
              </span>
            </span>
            <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
          </Link>
        </div>

        {/* 지금 가능한 후원 */}
        <section id="available" className="mt-6 rounded-2xl border border-slate-200 p-5 sm:p-6 scroll-mt-24">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0">
              <h2 className="text-[20px] sm:text-[24px] font-black tracking-tight">지금 가능한 후원</h2>
              <p className="mt-1 text-[12.5px] text-slate-500 break-keep">
                선수와 스폰픽이 미리 구성한 후원상품을 비교하고 바로 시작하세요.
              </p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  aria-pressed={tab === t.key}
                  className={`h-9 px-4 rounded-full text-[12.5px] font-bold transition-colors ${
                    tab === t.key ? 'bg-emerald-600 text-white' : 'border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
              <Link
                to="/sponsor/available"
                className="h-9 px-4 inline-flex items-center gap-1 rounded-full border border-emerald-600 text-emerald-700 text-[12.5px] font-bold hover:bg-emerald-50"
              >
                전체보기 <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center"><Loader2 className="w-7 h-7 text-emerald-500 animate-spin mx-auto" /></div>
          ) : !current?.offers?.length ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 py-14 text-center">
              <p className="text-[13.5px] font-bold text-slate-600">이 조건에 해당하는 상품이 아직 없습니다</p>
              <Link to="/sponsor/available" className="mt-4 inline-flex h-11 px-5 items-center rounded-xl border border-slate-200 text-sm font-bold text-slate-600">
                전체 상품 보기
              </Link>
            </div>
          ) : (
            <>
              <p className="mt-4 text-[12px] text-slate-400">{current.desc}</p>
              <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {current.offers.map((o: any) => (
                  <OfferCard key={o.id} offer={o} saved={savedIds.includes(o.id)} onSave={toggleSave} compact />
                ))}
              </div>
              {current.sponsored?.length > 0 && (
                <p className="mt-3 text-[11px] text-slate-400">일부 상품은 제휴 우선 노출입니다.</p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
