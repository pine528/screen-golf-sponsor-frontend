/**
 * IU10 함께하는 브랜드 `/about/brands` — 시안 2026-09-17 (리디자인/10 · 22 · 42)
 *
 *  히어로 "스폰픽과 함께 선수의 가능성을 키우는 브랜드" + 협업 유형 3(후원슬롯 · 콘텐츠 협업 · 팬스토어)
 *  → 필터(검색 · 업종 · 협업유형 · 활성상태 · 팬스토어) → 브랜드 카드(로고 · 활성 파트너 · 업종 · 선수 n명 · 프로젝트 n건 · 매칭사례 · 팬스토어 · 브랜드 상세)
 *  → 페이지네이션(숫자 · 12개씩) | 우측 협업 스토리(대표 사례) → CTA "우리 브랜드도 선수와 함께 성장할 수 있을까요?" (스폰픽 추천받기 · 제휴 문의)
 *  로고는 alt 를 넣고, 권리가 만료된 로고는 텍스트로 대체한다 (§10.4 · §17.1).
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, ArrowRight, Store, FileText, Handshake, Users, ChevronRight, ChevronLeft, Shirt, Smartphone, ShoppingBag, Trophy, TrendingUp,
} from 'lucide-react';
import { api } from '../../services/api';
import AboutShell, { Tag, StateNotice, Skeleton, nf, visitorKey } from '../../components/about/AboutShell';

const TYPES = [
  { icon: Shirt, t: '후원슬롯', d: '경기 착장과 노출' }, { icon: Smartphone, t: '콘텐츠 협업', d: 'SNS · 방문 · 제품 체험' }, { icon: ShoppingBag, t: '팬스토어', d: '팬 구매와 성장 연결' },
];
const PAGE_SIZES = [12, 24, 48];

export default function BrandList() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sponsorType, setSponsorType] = useState('');
  const [status, setStatus] = useState('');
  const [hasStore, setHasStore] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.listPartnerBrands({ q: q || undefined, category: category || undefined, sponsorType: sponsorType || undefined, status: status || undefined, hasStore: hasStore || undefined, page, limit })
      .then((r) => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [q, category, sponsorType, status, hasStore, page, limit]);
  useEffect(() => { api.trackAboutEvent({ event: 'intro_view', pageSlug: 'brands', visitorKey: visitorKey() }).catch(() => null); }, []);
  useEffect(() => { load(); }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const story = data?.story;
  const sel = 'h-11 px-3 rounded-xl border border-slate-200 bg-white text-[13.5px] font-semibold text-slate-700 focus:outline-none focus:border-emerald-400';

  return (
    <AboutShell current="brands"
      hero={
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-6 items-center">
          <div>
            <h1 className="text-[28px] sm:text-[42px] font-extrabold tracking-[-0.03em] leading-tight break-keep">스폰픽과 함께<br />선수의 가능성을 키우는 브랜드</h1>
            <p className="mt-3 text-[14px] sm:text-[15.5px] text-slate-500 leading-relaxed break-keep max-w-xl">규모와 업종에 관계없이 각자의 방식으로 선수와 성장하고 있습니다.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 lg:w-[560px]">
            {TYPES.map((t) => { const I = t.icon; return (
              <div key={t.t} className="rounded-3xl border border-slate-200 bg-white p-4 text-center">
                <span className="mx-auto w-14 h-14 rounded-full bg-emerald-700 text-white flex items-center justify-center"><I className="w-6 h-6" /></span>
                <p className="mt-3 text-[15px] font-extrabold">{t.t}</p>
                <p className="text-[11.5px] text-slate-500 break-keep">{t.d}</p>
              </div>
            ); })}
          </div>
        </div>
      }>
      <div className="max-w-[1280px] mx-auto px-5 pb-20">
        {/* 필터 */}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-300" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="브랜드 검색" className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-[14px] placeholder:text-slate-300 focus:outline-none focus:border-emerald-400" />
          </div>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">업종
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className={sel}><option value="">전체</option>{(data?.categories ?? []).map((c: any) => <option key={c.code} value={c.code}>{c.label} ({c.count})</option>)}</select>
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">협업유형
            <select value={sponsorType} onChange={(e) => { setSponsorType(e.target.value); setPage(1); }} className={sel}><option value="">전체</option>{(data?.sponsorTypes ?? []).map((c: any) => <option key={c.code} value={c.code}>{c.label} ({c.count})</option>)}</select>
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">활성상태
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={sel}><option value="">전체</option><option value="ACTIVE_PARTNER">활성 파트너</option><option value="PAST_PARTNER">이전 협업</option></select>
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">팬스토어
            <select value={hasStore} onChange={(e) => { setHasStore(e.target.value); setPage(1); }} className={sel}><option value="">전체</option><option value="true">보유</option></select>
          </label>
        </div>

        <div className="mt-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
          <div className="min-w-0">
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[190px] rounded-3xl" />)}</div>
            ) : data?.brands?.length ? (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.brands.map((b: any) => (
                    <article key={b.slug} className="rounded-3xl border border-slate-200 bg-white p-5 flex flex-col hover:border-emerald-300 transition">
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div className="h-12 flex items-center">{b.logoUrl ? <img src={b.logoUrl} alt={b.logoAlt} className="max-h-11 max-w-[150px] object-contain" /> : <span className="text-[17px] font-extrabold text-slate-800">{b.name}</span>}</div>
                        <Tag tone={b.status === 'ACTIVE_PARTNER' ? 'emerald' : 'slate'}>{b.statusLabel}</Tag>
                      </div>
                      <p className="text-[12.5px] text-slate-600 inline-flex items-center gap-1.5"><Store className="w-3.5 h-3.5 text-slate-400" /> {b.category}</p>
                      <p className="mt-1 text-[12.5px] text-slate-600 inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-400" /> 선수 <b className="text-slate-800 tabular-nums">{nf(b.athletes)}</b>명 <span className="text-slate-300">·</span> 프로젝트 <b className="text-slate-800 tabular-nums">{nf(b.projects)}</b>건</p>
                      {b.sponsorTypes?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{b.sponsorTypes.map((t: string) => <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-bold text-slate-600">{t}</span>)}</div>}
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                        <Link to={`/about/cases?brand=${b.slug}`} className={`inline-flex items-center gap-1 text-[12.5px] ${b.projects > 0 ? 'text-slate-600 hover:text-emerald-700' : 'text-slate-300 pointer-events-none'}`}><FileText className="w-3.5 h-3.5" /> 매칭사례</Link>
                        {b.storeUrl ? <Link to={b.storeUrl} className="inline-flex items-center gap-1 text-[12.5px] text-slate-600 hover:text-emerald-700"><ShoppingBag className="w-3.5 h-3.5" /> 팬스토어</Link> : <span className="inline-flex items-center gap-1 text-[12.5px] text-slate-300"><ShoppingBag className="w-3.5 h-3.5" /> 팬스토어</span>}
                        <Link to={`/about/brands/${b.slug}`} onClick={() => api.trackAboutEvent({ event: 'brand_view', pageSlug: 'brands', visitorKey: visitorKey(), params: { brand: b.slug } }).catch(() => null)}
                          className="ml-auto inline-flex items-center gap-0.5 h-8 px-3 rounded-lg border border-emerald-300 text-[12px] font-bold text-emerald-700 hover:bg-emerald-50 transition">브랜드 상세 <ChevronRight className="w-3 h-3" /></Link>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="text-[13px] text-slate-500 tabular-nums">전체 {nf(data.total)}개 브랜드</span>
                  <div className="mx-auto flex items-center gap-1">
                    <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="이전" className="w-9 h-9 rounded-lg border border-slate-200 bg-white inline-flex items-center justify-center disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                    {Array.from({ length: totalPages }).map((_, i) => <button key={i} onClick={() => setPage(i + 1)} aria-current={page === i + 1 ? 'page' : undefined} className={`w-9 h-9 rounded-lg text-[13px] font-bold tabular-nums ${page === i + 1 ? 'bg-emerald-700 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{i + 1}</button>)}
                    <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="다음" className="w-9 h-9 rounded-lg border border-slate-200 bg-white inline-flex items-center justify-center disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                  <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className={sel}>{PAGE_SIZES.map((n) => <option key={n} value={n}>{n}개씩 보기</option>)}</select>
                </div>
              </>
            ) : (
              <StateNotice kind="empty" title="조건에 맞는 브랜드가 없습니다" desc={'검색어나 필터를 조정해보세요.'} action={<button onClick={() => { setQ(''); setCategory(''); setSponsorType(''); setStatus(''); setHasStore(''); setPage(1); }} className="h-10 px-4 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600">필터 초기화</button>} />
            )}
          </div>

          {/* 협업 스토리 */}
          <aside className="space-y-3">
            {story ? (
              <section className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
                <div className="relative h-[190px] bg-slate-100">
                  {story.heroImageUrl && <img src={story.heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-top" />}
                  <span className="absolute left-4 top-4 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11.5px] font-extrabold border border-emerald-200">협업 스토리</span>
                </div>
                <div className="p-5">
                  <p className="text-[19px] font-extrabold">{story.brand.name} × {story.athleteName}</p>
                  <p className="mt-1 text-[12.5px] text-slate-500 break-keep">{story.summary || story.title}</p>
                  <div className="mt-3 rounded-2xl border border-slate-200 p-3 flex items-center gap-3">
                    <span className="h-9 flex items-center">{story.brand.logoUrl ? <img src={story.brand.logoUrl} alt={story.brand.name} className="max-h-8 max-w-[90px] object-contain" /> : <b className="text-[13px]">{story.brand.name}</b>}</span>
                    <span className="text-slate-300">×</span>
                    <span><span className="block text-[13px] font-extrabold">{story.athleteName}</span><span className="block text-[11px] text-slate-500">{story.tour ? `${story.tour} 프로` : '프로'}</span></span>
                  </div>
                  {story.sponsorTypes?.length > 0 && (
                    <div className="mt-3"><p className="text-[12px] font-bold text-slate-600 mb-1.5">주요 협업 형태</p><div className="grid grid-cols-3 gap-1.5">{story.sponsorTypes.slice(0, 3).map((t: string) => <div key={t} className="rounded-xl bg-slate-50 px-2 py-2 text-center"><Trophy className="w-4 h-4 mx-auto text-emerald-600" /><p className="mt-1 text-[11.5px] font-bold text-slate-700 truncate">{t}</p></div>)}</div></div>
                  )}
                  <Link to={`/about/cases/${story.slug}`} className="mt-4 h-11 w-full rounded-xl border border-emerald-300 text-emerald-700 text-[13.5px] font-extrabold inline-flex items-center justify-center gap-1 hover:bg-emerald-50">협업사례 보기 <ChevronRight className="w-4 h-4" /></Link>
                </div>
              </section>
            ) : (
              <section className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-[12.5px] text-slate-500 break-keep">사례가 게시되면 협업 스토리가 이곳에 표시됩니다.</section>
            )}
          </aside>
        </div>

        {/* CTA */}
        <section className="mt-8 rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-4 relative overflow-hidden">
          <TrendingUp aria-hidden className="absolute right-[38%] bottom-2 w-28 h-28 text-emerald-100 hidden lg:block" />
          <span className="w-14 h-14 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0"><Trophy className="w-6 h-6" /></span>
          <div className="min-w-0 flex-1 relative"><p className="text-[18px] font-extrabold break-keep">우리 브랜드도 선수와 함께 성장할 수 있을까요?</p><p className="mt-1 text-[13px] text-slate-600 break-keep">스폰픽이 브랜드에 가장 적합한 선수와 협업 방식을 추천해 드립니다.</p></div>
          <div className="flex gap-2 shrink-0 relative">
            <Link to="/sponsor/recommended" className="h-12 px-5 rounded-xl bg-emerald-700 text-white text-[14px] font-extrabold inline-flex items-center hover:bg-emerald-800">스폰픽 추천받기</Link>
            <Link to="/contact" className="h-12 px-5 rounded-xl border border-emerald-300 bg-white text-emerald-700 text-[14px] font-extrabold inline-flex items-center gap-1 hover:bg-emerald-50"><Handshake className="w-4 h-4" /> 제휴 문의</Link>
          </div>
        </section>
        <p className="mt-4 text-[12px] text-slate-400 inline-flex items-center gap-1"><ArrowRight className="w-3 h-3" /> 다양한 브랜드들이 스폰픽을 통해 선수와 팬을 연결하고 함께 성장하고 있습니다.</p>
      </div>
    </AboutShell>
  );
}
