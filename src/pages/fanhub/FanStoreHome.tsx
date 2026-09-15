/**
 * F11 팬스토어 메인 `/fan/store` — 시안 2026-09-15 (Desktop · Mobile)
 *
 *  히어로("좋아하는 선수를 더 가까이, 특별하게.") → 가치 4칸(선수×브랜드 협업 / 팬 전용 할인 / 한정판·단독 / 구매 시 포인트 적립)
 *  → 상품 탭(전체/추천/신규 출시/한정판/할인 상품) + 상품 그리드(배지·선수×브랜드·가격·정가) → 배너 2(브랜드 스토리 / 한정판)
 *  → 내가 응원하는 선수의 스토어 · 브랜드로 찾기 → 진행 중인 스토어 목록(판매 책임·혜택·마감) → 안내.
 *  상품·배지·브랜드·선수는 공개 스토어 실데이터. 사진이 없는 상품은 브랜드 이니셜 카드로 표시한다.
 */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, BadgePercent, ChevronRight, Clock, Coins, Crown, Gift, Heart, Info, ShoppingBag, Store, X,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { AthleteAvatar, Skeleton, nf } from '../../components/fanhub/FanKit';

const TABS = [
  { key: 'ALL', label: '전체' }, { key: 'RECOMMENDED', label: '추천' }, { key: 'NEW', label: '신규 출시' }, { key: 'LIMITED', label: '한정판' }, { key: 'SALE', label: '할인 상품' },
];
const BADGE: Record<string, { label: (p: any) => string; cls: string }> = {
  NEW: { label: () => 'NEW', cls: 'bg-emerald-600 text-white' },
  BEST: { label: () => 'BEST', cls: 'bg-rose-500 text-white' },
  SALE: { label: (p) => `${p.discountRate}%`, cls: 'bg-emerald-600 text-white' },
  LIMITED: { label: () => 'LIMITED', cls: 'bg-slate-900 text-white' },
};

export default function FanStoreHome() {
  const { isAuthenticated } = useAuth();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') || 'ALL';
  const athleteId = sp.get('athleteId') || '';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wish, setWish] = useState<Set<string>>(() => { try { return new Set(JSON.parse(localStorage.getItem('sponpik.store.wish') || '[]')); } catch { return new Set(); } });

  useEffect(() => {
    setLoading(true);
    api.getFanStoreHome({ tab, limit: 20, athleteId: athleteId || undefined })
      .then((r: any) => setData(r?.data || null)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [tab, athleteId, isAuthenticated]);

  const toggleWish = (id: string) => setWish((s) => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id);
    try { localStorage.setItem('sponpik.store.wish', JSON.stringify([...n])); } catch { /* 무시 */ }
    return n;
  });
  const setParam = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };

  const products: any[] = data?.products || [];
  const values = [
    { icon: Gift, title: '선수 X 브랜드 협업', desc: '좋아하는 선수의 특별한 상품' },
    { icon: BadgePercent, title: '팬 전용 할인 혜택', desc: '팬만을 위한 특별한 가격' },
    { icon: Crown, title: '한정판 & 단독 상품', desc: '오직 스폰픽에서만' },
    { icon: Coins, title: '구매 시 포인트 적립', desc: data?.pointRatePercent ? `구매 확정 금액의 ${data.pointRatePercent}% 적립` : '브랜드 구매확정 후 적립' },
  ];
  const athleteRow: any[] = (isAuthenticated && data?.myAthletes?.length ? data.myAthletes : data?.athletes) || [];
  const activeAthlete = data?.athletes?.find((a: any) => a.id === athleteId);

  return (
    <div className="min-h-screen bg-[#f3faf6] text-slate-900 pb-16">
      <PublicHeader />

      {/* ── 히어로 ── */}
      <section className="relative overflow-hidden bg-[#ecf8f1]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute right-[-120px] top-[-120px] w-[560px] h-[560px] rounded-full bg-emerald-200/50 blur-3xl" />
          <div className="absolute right-[6%] top-[18%] hidden lg:block w-[380px] h-[240px] rounded-[40px] bg-[#0f2a20] rotate-[-6deg] shadow-[0_30px_60px_-30px_rgba(15,42,32,0.7)]" />
          <div className="absolute right-[3%] top-[36%] hidden lg:flex w-[300px] h-[150px] rounded-3xl bg-white/90 border border-emerald-100 rotate-[4deg] items-center justify-center gap-3 text-emerald-700">
            <ShoppingBag className="w-8 h-8" /><span className="font-script text-[26px] leading-none text-emerald-500">Good Fans<br />Brighter Tomorrow</span>
          </div>
          <p className="absolute right-[24%] top-[14%] hidden lg:block text-[13px] font-extrabold tracking-[0.2em] text-white/70 rotate-[-6deg]">SPONPIK</p>
        </div>
        <div className="max-w-[1180px] mx-auto px-5 pt-5 pb-10 sm:pb-14 relative">
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[13px]">
            <Link to="/" className="text-slate-500 hover:text-slate-700">홈</Link><ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link to="/fan" className="text-slate-500 hover:text-slate-700">팬 참여</Link><ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-emerald-700">팬스토어</span>
          </nav>
          <p className="mt-6 text-[12.5px] font-extrabold tracking-[0.18em] text-slate-500">FAN STORE</p>
          <h1 className="mt-2 text-[30px] sm:text-[42px] font-extrabold tracking-[-0.03em] leading-[1.2] break-keep">좋아하는 선수를<br />더 가까이, 특별하게.</h1>
          <p className="mt-4 text-[14px] sm:text-[15.5px] text-slate-600 leading-relaxed break-keep max-w-md">선수와 브랜드가 함께 만드는 특별한 상품을 스폰픽에서 만나보세요.<br className="hidden sm:block" />팬만을 위한 혜택과 한정판 굿즈도 준비되어 있습니다.</p>
          <a href="#stores" className="mt-6 inline-flex h-12 px-6 items-center gap-1.5 rounded-full bg-emerald-600 text-white text-[14.5px] font-bold hover:bg-emerald-700">스토어 가이드 보기 <ArrowRight className="w-4 h-4" /></a>
        </div>
      </section>

      <div className="max-w-[1180px] mx-auto px-5">
        {/* ── 가치 4칸 ── */}
        <div className="-mt-5 relative grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {values.map((v) => { const I = v.icon; return (
            <div key={v.title} className="rounded-2xl bg-white border border-slate-200 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] px-4 py-3.5 flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 inline-flex items-center justify-center shrink-0"><I className="w-5 h-5" /></span>
              <span className="min-w-0"><span className="block text-[13px] sm:text-[13.5px] font-extrabold break-keep leading-snug">{v.title}</span><span className="block mt-0.5 text-[11.5px] text-slate-500 break-keep line-clamp-2 sm:line-clamp-1">{v.desc}</span></span>
            </div>
          ); })}
        </div>

        {/* ── 상품 탭 · 그리드 ── */}
        <section className="mt-7">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-slate-200 flex-1">
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setParam('tab', t.key === 'ALL' ? '' : t.key)} aria-pressed={tab === t.key} className={`shrink-0 h-11 px-3.5 text-[14px] font-bold border-b-2 -mb-px whitespace-nowrap ${tab === t.key ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{t.label}</button>
              ))}
            </div>
            <a href="#stores" className="text-[12.5px] font-bold text-slate-500 hover:text-emerald-700 inline-flex items-center">전체 보기 <ChevronRight className="w-3.5 h-3.5" /></a>
          </div>
          {activeAthlete && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 pl-1.5 pr-3 py-1 text-[12.5px] font-bold text-emerald-700">
              <AthleteAvatar athlete={activeAthlete} size={22} /> {activeAthlete.name} 프로의 상품만 보는 중
              <button onClick={() => setParam('athleteId', '')} aria-label="선수 필터 해제" className="text-emerald-600"><X className="w-3.5 h-3.5" /></button>
            </p>
          )}

          {loading ? (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[260px] rounded-2xl" />)}</div>
          ) : products.length ? (
            <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {products.map((p: any) => {
                const b = p.badge ? BADGE[p.badge] : null;
                return (
                  <li key={p.id} className="group rounded-2xl bg-white border border-slate-200 overflow-hidden hover:border-emerald-300 hover:shadow-[0_12px_28px_-16px_rgba(15,23,42,0.2)]">
                    <Link to={`/fan/store/product/${p.id}`} className="relative block aspect-square bg-slate-100">
                      {p.imageUrl ? <img src={p.imageUrl} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
                        : <span className="w-full h-full flex flex-col items-center justify-center text-slate-400"><Store className="w-8 h-8" /><span className="mt-1 text-[11px] font-bold">{p.store.brandName}</span></span>}
                      {b && <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[11px] font-extrabold ${b.cls}`}>{b.label(p)}</span>}
                      <button onClick={(e) => { e.preventDefault(); toggleWish(p.id); }} aria-pressed={wish.has(p.id)} aria-label="찜" className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 inline-flex items-center justify-center ${wish.has(p.id) ? 'text-rose-500' : 'text-slate-500'}`}><Heart className={`w-4 h-4 ${wish.has(p.id) ? 'fill-current' : ''}`} /></button>
                    </Link>
                    <div className="p-3">
                      <p className="text-[11.5px] text-slate-500 truncate">{p.athlete?.name ? `${p.athlete.name} 프로 × ` : ''}{p.store.brandName}</p>
                      <Link to={`/fan/store/product/${p.id}`} className="mt-0.5 block text-[13.5px] font-extrabold truncate hover:text-emerald-700">{p.name}</Link>
                      <p className="mt-1 flex items-baseline gap-1.5">
                        <span className={`text-[15px] font-extrabold tabular-nums ${p.discountRate ? 'text-rose-600' : ''}`}>{nf(p.price)}원</span>
                        {p.originalPrice && p.originalPrice > p.price && <span className="text-[12px] text-slate-400 line-through tabular-nums">{nf(p.originalPrice)}원</span>}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-4 rounded-2xl bg-white border border-dashed border-slate-200 py-12 text-center">
              <span className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 inline-flex items-center justify-center"><ShoppingBag className="w-6 h-6" /></span>
              <p className="mt-3 text-[15px] font-extrabold">{tab === 'ALL' ? '판매 중인 상품이 아직 없습니다' : '이 조건의 상품이 아직 없습니다'}</p>
              <p className="mt-1 text-[13px] text-slate-500 break-keep">선수와 브랜드의 협업 상품이 등록되면 이곳에 표시됩니다.</p>
              {tab !== 'ALL' && <button onClick={() => setParam('tab', '')} className="mt-4 h-10 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700">전체 상품 보기</button>}
            </div>
          )}
        </section>

        {/* ── 배너 2 ── */}
        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="#stores" className="relative overflow-hidden rounded-2xl bg-[#0f2a20] text-white p-6 min-h-[150px] hover:bg-[#123227]">
            <div aria-hidden className="pointer-events-none absolute inset-0"><div className="absolute right-[-30%] top-[-60%] w-[80%] h-[200%] rounded-full bg-emerald-500/20 blur-3xl" /><p className="absolute right-6 bottom-4 text-[11px] font-extrabold tracking-[0.25em] text-white/25">SPONPIK</p></div>
            <p className="relative text-[20px] sm:text-[22px] font-extrabold leading-snug break-keep">선수와 브랜드가<br />함께 만든 스토리</p>
            <p className="relative mt-1.5 text-[12.5px] text-white/75 break-keep">상품 속에 담긴 협업 스토리를 확인해보세요.</p>
            <span className="relative mt-4 inline-flex h-9 px-4 items-center gap-1 rounded-full bg-white text-slate-900 text-[12.5px] font-bold">브랜드 스토리 보기 <ArrowRight className="w-3.5 h-3.5" /></span>
          </a>
          <button onClick={() => setParam('tab', 'LIMITED')} className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-6 min-h-[150px] text-left hover:bg-slate-800">
            <div aria-hidden className="pointer-events-none absolute inset-0"><span className="absolute right-6 top-6 px-3 py-1.5 rounded-lg border border-white/40 text-[11px] font-extrabold tracking-[0.18em] rotate-[8deg] text-white/80">LIMITED<br />EDITION</span></div>
            <p className="relative text-[20px] sm:text-[22px] font-extrabold leading-snug break-keep">한정판 굿즈<br />지금 만나보세요.</p>
            <p className="relative mt-1.5 text-[12.5px] text-white/75 break-keep">지금이 아니면 만날 수 없는 특별한 아이템!</p>
            <span className="relative mt-4 inline-flex h-9 px-4 items-center gap-1 rounded-full bg-white text-slate-900 text-[12.5px] font-bold">한정판 상품 보기 <ArrowRight className="w-3.5 h-3.5" /></span>
          </button>
        </section>

        {/* ── 선수 · 브랜드로 찾기 ── */}
        <section className="mt-3 grid grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-3">
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-[15px] font-extrabold">{isAuthenticated && data?.myAthletes?.length ? '내가 응원하는 선수의 스토어' : '선수로 찾기'}</p>
            <p className="text-[12.5px] text-slate-500">{isAuthenticated && data?.myAthletes?.length ? '좋아하는 선수의 상품을 더 빠르게 만나보세요.' : '스토어가 열려 있는 선수를 골라보세요.'}</p>
            {athleteRow.length ? (
              <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {athleteRow.map((a: any) => (
                  <button key={a.id} onClick={() => setParam('athleteId', athleteId === a.id ? '' : a.id)} aria-pressed={athleteId === a.id} className={`shrink-0 w-[76px] rounded-2xl border p-2 text-center ${athleteId === a.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}>
                    <span className="inline-block"><AthleteAvatar athlete={a} size={44} /></span>
                    <span className="block mt-1 text-[12px] font-bold truncate">{a.name}</span>
                  </button>
                ))}
                <span className="shrink-0 self-center w-9 h-9 rounded-full border border-slate-200 inline-flex items-center justify-center text-slate-500"><ChevronRight className="w-4 h-4" /></span>
              </div>
            ) : <p className="mt-3 text-[12.5px] text-slate-500">{isAuthenticated ? '관심 선수 중 스토어가 열린 선수가 아직 없습니다.' : '열려 있는 스토어가 아직 없습니다.'}</p>}
            {isAuthenticated && !data?.myAthletes?.length && <Link to="/athletes/search" className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-bold text-emerald-700 hover:underline">관심 선수 등록하기 <ChevronRight className="w-3.5 h-3.5" /></Link>}
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-[15px] font-extrabold">브랜드로 찾기</p>
            <p className="text-[12.5px] text-slate-500">다양한 브랜드의 협업 상품을 만나보세요.</p>
            {data?.brands?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {data.brands.map((b: any) => (
                  <Link key={b.name} to={`/fan/store/${b.slug}`} className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 inline-flex items-center text-[13.5px] font-extrabold tracking-tight text-slate-800 hover:border-emerald-300 hover:bg-white">{b.name}</Link>
                ))}
              </div>
            ) : <p className="mt-3 text-[12.5px] text-slate-500">협업 브랜드가 아직 없습니다.</p>}
          </div>
        </section>

        {/* ── 진행 중인 스토어 ── */}
        <section id="stores" className="mt-8 scroll-mt-24">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-[19px] font-extrabold tracking-[-0.02em]">진행 중인 스토어</h2>
              <p className="mt-1 text-[13px] text-slate-500">협업 스토리 확인 → 팬 혜택 코드 → 브랜드몰 구매 → 구매확정 후 포인트 적립 순서로 진행됩니다.</p>
            </div>
          </div>
          {loading ? <Skeleton className="mt-3 h-[140px] rounded-2xl" /> : data?.stores?.length ? (
            <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.stores.map((s: any) => (
                <li key={s.id}>
                  <Link to={`/fan/store/${s.slug || s.id}`} className="block rounded-2xl bg-white border border-slate-200 overflow-hidden hover:border-emerald-300">
                    <div className="aspect-[16/8] bg-slate-100">{s.heroImageUrl && <img src={s.heroImageUrl} alt={s.title} className="w-full h-full object-cover" />}</div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-[11.5px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold text-slate-600">{s.responsibleLabel}</span>
                        {s.daysLeft !== null && s.daysLeft <= 7 && <span className="inline-flex items-center gap-1 text-amber-700 font-bold"><Clock className="w-3 h-3" /> {s.daysLeft}일 남음</span>}
                      </div>
                      <p className="mt-1.5 text-[14.5px] font-extrabold line-clamp-1">{s.title}</p>
                      <p className="text-[12px] text-slate-500 truncate">{[s.athlete?.name ? `${s.athlete.name} 프로` : null, s.brandName].filter(Boolean).join(' × ')}</p>
                      {s.benefit && <p className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-[12px] font-bold text-amber-700"><Gift className="w-3.5 h-3.5" /> {s.benefit.label}</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 rounded-2xl bg-white border border-dashed border-slate-200 py-10 text-center text-[13px] text-slate-500">열려 있는 스토어가 아직 없습니다.</p>}
        </section>

        {data?.notice && (
          <p className="mt-6 rounded-2xl bg-white border border-slate-200 px-4 py-3 text-[12.5px] text-slate-600 flex items-start gap-2 break-keep"><Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> {data.notice} 팬포인트는 브랜드가 구매확정을 회신한 뒤 적립됩니다.</p>
        )}
      </div>
    </div>
  );
}
