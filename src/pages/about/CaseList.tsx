/**
 * IU02 매칭사례 목록 `/about/cases` — 시안 2026-09-17 (리디자인/10 · 14 · 26)
 *
 *  히어로 "매칭사례" → 필터 칩(전체 · 종목 · 투어 · 후원방식 · 업종 · 성과유형 ▾ + 정렬)
 *  → 대표 사례(브랜드 로고 × 선수 사진 · 목표 · 선정 조합 · 성과 요약 · 사례 자세히) + 보조 사례 2
 *  → 사례 카드 그리드(사진|로고 · 목표 · 후원방식 · 후원기간 · 검증 성과 · 사례 보기 / 비슷한 후원 시작)
 *  → 우리의 매칭 프로세스 4단계 → "우리 브랜드 매칭안 받아보기"
 *  값은 서버 facets·사례만. 예산구간·기간 필터는 데이터가 없어 넣지 않는다.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ChevronDown, ChevronRight, Filter, RotateCcw, SlidersHorizontal, X, Target, Layers, TrendingUp, Users,
  FileText, BarChart3, ShieldCheck, Sparkles, Calendar, Shirt,
} from 'lucide-react';
import { api } from '../../services/api';
import AboutShell, { VerifiedBadge, StateNotice, Skeleton, visitorKey, ym, Tag } from '../../components/about/AboutShell';

const FILTER_KEYS = [
  { key: 'sport', label: '종목', icon: Layers }, { key: 'tour', label: '투어', icon: Users }, { key: 'sponsorType', label: '후원방식', icon: Shirt },
  { key: 'category', label: '업종', icon: FileText }, { key: 'objective', label: '성과유형', icon: TrendingUp },
] as const;
const PROCESS_ICON = [Target, Users, FileText, BarChart3];

function Dropdown({ label, icon: I, options, value, onPick }: { label: string; icon: any; options: any[]; value: string; onPick: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);
  if (!options.length) return null;
  const cur = options.find((o) => o.code === value);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className={`h-10 px-3.5 rounded-xl border text-[13px] font-bold inline-flex items-center gap-1.5 transition ${value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'}`}>
        <I className="w-4 h-4" /> {cur ? cur.label : label} <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 min-w-[180px] rounded-xl border border-slate-200 bg-white shadow-[0_12px_30px_-12px_rgba(15,23,42,0.3)] py-1.5">
          <button type="button" onClick={() => { onPick(''); setOpen(false); }} className={`w-full px-3.5 py-2 text-left text-[13px] hover:bg-slate-50 ${!value ? 'font-bold text-emerald-700' : 'text-slate-600'}`}>전체</button>
          {options.map((o) => (
            <button key={o.code} type="button" onClick={() => { onPick(o.code); setOpen(false); }} className={`w-full px-3.5 py-2 text-left text-[13px] hover:bg-slate-50 flex justify-between ${value === o.code ? 'font-bold text-emerald-700' : 'text-slate-700'}`}>{o.label}<span className="text-slate-400 tabular-nums">{o.count}</span></button>
          ))}
        </div>
      )}
    </div>
  );
}

function CaseCard({ c }: { c: any }) {
  const h = c.highlights?.[0];
  return (
    <article className="rounded-3xl border border-slate-200 bg-white overflow-hidden flex flex-col hover:border-emerald-300 transition">
      <div className="grid grid-cols-[1.2fr_1fr] h-[150px]">
        <div className="bg-slate-100 relative">{c.heroImageUrl && <img src={c.heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-top" />}</div>
        <div className="bg-slate-50 flex items-center justify-center p-4">
          {c.brandLogoUrl ? <img src={c.brandLogoUrl} alt={`${c.brandName} 로고`} className="max-h-12 max-w-full object-contain" /> : <span className="text-[14px] font-bold text-slate-600 text-center">{c.brandName}</span>}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[16px] font-extrabold text-slate-900 truncate">{c.athleteName} <span className="text-slate-300 mx-0.5">×</span> {c.brandName}</p>
          {c.verified && <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" aria-label="검증 완료" />}
        </div>
        <dl className="space-y-1.5 text-[12.5px] mb-4">
          {c.summary && <div className="flex gap-2.5"><dt className="text-slate-500 w-14 shrink-0 inline-flex items-center gap-1"><Target className="w-3 h-3" /> 목표</dt><dd className="text-slate-700 line-clamp-1">{c.summary}</dd></div>}
          {c.sponsorTypes?.length > 0 && <div className="flex gap-2.5"><dt className="text-slate-500 w-14 shrink-0 inline-flex items-center gap-1"><Shirt className="w-3 h-3" /> 후원방식</dt><dd className="text-slate-700">{c.sponsorTypes.join(' · ')}</dd></div>}
          {(c.periodFrom || c.periodTo) && <div className="flex gap-2.5"><dt className="text-slate-500 w-14 shrink-0 inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> 후원기간</dt><dd className="text-slate-700 tabular-nums">{ym(c.periodFrom)}{c.periodTo ? ` ~ ${ym(c.periodTo)}` : ''}</dd></div>}
        </dl>
        <div className="rounded-2xl bg-slate-50 px-4 py-3 mb-4 flex items-center gap-2.5 min-h-[52px]">
          <span className="text-[12px] font-bold text-slate-500 shrink-0">검증 성과</span>
          {!h ? <span className="text-[12.5px] text-slate-400">공개 지표 없음</span>
            : h.restricted ? <span className="text-[12.5px] text-slate-500">{h.restrictedReason}</span>
            : <><span className={`font-extrabold text-emerald-600 tabular-nums ${h.qualitative ? 'text-[13px]' : 'text-[19px]'}`}>{h.display}</span>{!h.qualitative && <span className="text-[12px] text-slate-500 truncate">{h.label}</span>}</>}
          {c.verified && <span className="ml-auto shrink-0"><VerifiedBadge /></span>}
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2">
          <Link to={`/about/cases/${c.slug}`} className="h-11 rounded-xl border border-slate-200 text-[13.5px] font-bold text-slate-700 flex items-center justify-center hover:border-slate-400 transition">사례 보기</Link>
          <Link to="/sponsor/recommended" className="h-11 rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold flex items-center justify-center hover:bg-emerald-700 transition">비슷한 후원 시작</Link>
        </div>
      </div>
    </article>
  );
}

export default function CaseList() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState('RECOMMENDED');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.listMatchingCases({ ...filters, sort, limit: 12 })
      .then((r) => {
        setData(r.data);
        api.trackAboutEvent({ event: 'case_filter_apply', pageSlug: 'cases', visitorKey: visitorKey(), params: { filters, resultCount: r.data?.total ?? 0 } }).catch(() => null);
      })
      .catch(() => setData(null)).finally(() => setLoading(false));
  }, [filters, sort]);
  useEffect(() => { api.trackAboutEvent({ event: 'intro_view', pageSlug: 'cases', visitorKey: visitorKey() }).catch(() => null); }, []);
  useEffect(() => { load(); }, [load]);

  const setFilter = (k: string, v: string) => setFilters((f) => ({ ...f, [k]: v }));
  const activeCount = Object.values(filters).filter(Boolean).length;
  const featured = data?.featured;
  const cases: any[] = data?.cases ?? [];
  const showFeatured = !!featured && activeCount === 0 && sort === 'RECOMMENDED';
  const others = showFeatured ? cases.filter((c) => c.slug !== featured.slug) : cases;
  const fh = featured?.highlights?.filter((h: any) => !h.restricted) ?? [];

  return (
    <AboutShell current="cases"
      hero={
        <div className="relative">
          <div aria-hidden className="pointer-events-none absolute right-0 -top-16 w-[420px] h-[220px] rounded-full bg-emerald-100/50 blur-3xl" />
          <h1 className="relative text-[30px] sm:text-[44px] font-extrabold tracking-[-0.03em] leading-tight">매칭사례</h1>
          <p className="relative mt-2 text-[15px] sm:text-[17px] text-slate-500 break-keep">브랜드 목표가 실제 후원과 성과로 이어진 사례</p>
        </div>
      }>
      <div className="max-w-[1280px] mx-auto px-5 pb-20">
        {/* 필터 바 */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setFilters({})} className={`h-10 px-4 rounded-xl border text-[13px] font-bold inline-flex items-center gap-1.5 ${activeCount === 0 ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-700'}`}><Filter className="w-4 h-4" /> 전체</button>
          <div className="hidden lg:flex flex-wrap gap-2">
            {FILTER_KEYS.map((f) => <Dropdown key={f.key} label={f.label} icon={f.icon} options={data?.facets?.[f.key] ?? []} value={filters[f.key] ?? ''} onPick={(v) => setFilter(f.key, v)} />)}
          </div>
          <button onClick={() => setSheet(true)} className="lg:hidden h-10 px-4 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-700 inline-flex items-center gap-1.5"><SlidersHorizontal className="w-4 h-4" /> 필터{activeCount > 0 && <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] inline-flex items-center justify-center">{activeCount}</span>}</button>
          <div className="ml-auto flex items-center gap-2">
            {activeCount > 0 && <button onClick={() => setFilters({})} className="h-10 px-3 rounded-xl text-[12.5px] font-bold text-slate-500 inline-flex items-center gap-1 hover:text-slate-800"><RotateCcw className="w-3.5 h-3.5" /> 초기화</button>}
            <label className="h-10 px-3 rounded-xl border border-slate-200 bg-white inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-700"><SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-transparent outline-none">{(data?.sorts ?? [{ code: 'RECOMMENDED', label: '추천순' }]).map((s: any) => <option key={s.code} value={s.code}>{s.label}</option>)}</select>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[380px] rounded-3xl" />)}</div>
        ) : cases.length ? (
          <>
            {/* 대표 사례 (시안 14) */}
            {showFeatured && (
              <section className="mt-6 grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-4">
                <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white p-5 sm:p-6 relative">
                  <span className="absolute left-5 top-5 px-2.5 py-1 rounded-md bg-emerald-700 text-white text-[11.5px] font-extrabold">대표 사례</span>
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 items-center">
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center"><div className="w-[104px] h-[104px] rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden p-4">{featured.brandLogoUrl ? <img src={featured.brandLogoUrl} alt="" className="max-w-full max-h-full object-contain" /> : <span className="text-[13px] font-bold text-slate-600">{featured.brandName}</span>}</div><p className="mt-2 text-[15px] font-extrabold">{featured.brandName}</p></div>
                      <span className="text-slate-300 text-[20px]">×</span>
                      <div className="text-center"><div className="w-[124px] h-[124px] rounded-full bg-slate-100 overflow-hidden">{featured.heroImageUrl && <img src={featured.heroImageUrl} alt="" className="w-full h-full object-cover object-top" />}</div><p className="mt-2 text-[15px] font-extrabold">{featured.athleteName}</p><p className="text-[11.5px] text-slate-500">{[featured.tour, featured.sport && `프로 ${featured.sport === '골프' ? '골퍼' : featured.sport}`].filter(Boolean).join(' ')}</p></div>
                    </div>
                    <div className="space-y-4">
                      <div><p className="text-[12.5px] font-bold text-emerald-700 inline-flex items-center gap-1"><Target className="w-3.5 h-3.5" /> 목표</p><p className="mt-1 text-[15px] font-extrabold break-keep">{featured.summary || featured.title}</p></div>
                      {featured.sponsorTypes?.length > 0 && <div><p className="text-[12.5px] font-bold text-emerald-700 inline-flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> 선정 조합</p><div className="mt-1.5 flex flex-wrap gap-1.5">{featured.sponsorTypes.map((t: string) => <Tag key={t}>{t}</Tag>)}{featured.tour && <Tag>{featured.tour}</Tag>}{featured.periodFrom && <Tag>{ym(featured.periodFrom)}</Tag>}</div></div>}
                      {fh.length > 0 && <div><p className="text-[12.5px] font-bold text-emerald-700 inline-flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> 성과 요약</p><div className="mt-1.5 grid grid-cols-2 sm:grid-cols-3 gap-2">{fh.slice(0, 3).map((h: any) => <div key={h.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"><p className="text-[11px] text-slate-500 truncate">{h.label}</p><p className={`font-extrabold text-emerald-700 tabular-nums break-keep ${h.qualitative ? 'text-[12.5px]' : 'text-[18px]'}`}>{h.display}</p></div>)}</div></div>}
                      <Link to={`/about/cases/${featured.slug}`} className="h-12 px-6 rounded-xl bg-emerald-700 text-white text-[14.5px] font-extrabold inline-flex items-center gap-1.5 hover:bg-emerald-800">사례 자세히 <ChevronRight className="w-4 h-4" /></Link>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3">
                  {others.slice(0, 2).map((c) => (
                    <Link key={c.slug} to={`/about/cases/${c.slug}`} className="rounded-3xl border border-slate-200 bg-white p-4 grid grid-cols-[auto_1fr] gap-4 items-center hover:border-emerald-300 transition">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden p-2">{c.brandLogoUrl ? <img src={c.brandLogoUrl} alt="" className="max-w-full max-h-full object-contain" /> : <span className="text-[10px] font-bold text-slate-600 text-center">{c.brandName}</span>}</div>
                        <span className="text-slate-300">×</span>
                        <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden">{c.heroImageUrl && <img src={c.heroImageUrl} alt="" className="w-full h-full object-cover object-top" />}</div>
                      </div>
                      <div className="min-w-0 text-[12.5px] space-y-1">
                        <p className="font-extrabold text-[14px] truncate">{c.brandName} × {c.athleteName}</p>
                        {c.summary && <p className="text-slate-600 truncate"><b className="text-emerald-700">목표</b> {c.summary}</p>}
                        {c.sponsorTypes?.length > 0 && <p className="text-slate-600 truncate"><b className="text-emerald-700">선정 조합</b> {c.sponsorTypes.join(' · ')}</p>}
                        {c.highlights?.[0] && !c.highlights[0].restricted && <p className="text-slate-600 truncate"><b className="text-emerald-700">성과</b> {c.highlights[0].display}{!c.highlights[0].qualitative ? ` ${c.highlights[0].label}` : ''}</p>}
                        <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold">사례 보기 <ChevronRight className="w-3.5 h-3.5" /></span>
                      </div>
                    </Link>
                  ))}
                  {others.length === 0 && <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-[13px] text-slate-500">다른 사례가 등록되면 이곳에 표시됩니다.</div>}
                </div>
              </section>
            )}

            {/* 카드 그리드 */}
            {(showFeatured ? others.slice(2) : cases).length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3"><p className="text-[15px] font-extrabold">{showFeatured ? '더 많은 사례' : `사례 ${data.total}건`}</p><span className="text-[12.5px] text-slate-500 tabular-nums">전체 {data.total}건</span></div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{(showFeatured ? others.slice(2) : cases).map((c) => <CaseCard key={c.slug} c={c} />)}</div>
              </div>
            )}
          </>
        ) : (
          <div className="mt-6 max-w-lg mx-auto">
            <StateNotice kind="empty" title={data?.emptyGuide?.title ?? '선택한 조건에 맞는 사례가 없습니다.'} desc={data?.emptyGuide?.desc ?? '필터를 조정해 보세요.'}
              action={<div className="flex gap-2 justify-center"><button onClick={() => setFilters({})} className="h-10 px-4 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600">조건 초기화</button><Link to="/sponsor/recommended" className="h-10 px-4 rounded-xl bg-slate-900 text-white text-[13px] font-bold inline-flex items-center gap-1.5">추천 PICK 받기 <ArrowRight className="w-3.5 h-3.5" /></Link></div>} />
          </div>
        )}

        {/* 매칭 프로세스 (시안 14) */}
        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-[150px_1fr] gap-4 items-center">
          <p className="text-[17px] font-extrabold leading-snug">우리의 매칭<br className="hidden lg:block" /> 프로세스</p>
          <ol className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(data?.process ?? []).map((p: any, i: number) => { const I = PROCESS_ICON[i] ?? Target; return (
              <li key={p.no} className="relative flex items-center gap-3">
                <span className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0"><I className="w-6 h-6" /></span>
                <span className="min-w-0"><span className="block text-[15px] font-extrabold">{p.no}. {p.title}</span><span className="block text-[12px] text-slate-500 break-keep">{p.desc}</span></span>
                {i < 3 && <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />}
              </li>
            ); })}
          </ol>
        </section>

        <section className="mt-6 text-center">
          <Link to="/sponsor/recommended" onClick={() => api.trackAboutEvent({ event: 'intro_cta_click', pageSlug: 'cases', visitorKey: visitorKey(), params: { cta: 'match_plan' } }).catch(() => null)}
            className="h-14 px-10 rounded-2xl bg-emerald-700 text-white text-[16px] font-extrabold inline-flex items-center gap-2 hover:bg-emerald-800 transition">우리 브랜드 매칭안 받아보기 <ChevronRight className="w-4 h-4" /></Link>
          <p className="mt-3 text-[12.5px] text-slate-500 inline-flex items-center gap-1 w-full justify-center"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 성과보장 프로그램으로 안심하고 시작하세요.</p>
          <p className="mt-2 text-[12px] text-slate-400 inline-flex items-center gap-1 w-full justify-center"><Sparkles className="w-3 h-3" /> 사례는 당사자 승인과 검증을 거친 것만 게시됩니다.</p>
        </section>
      </div>

      {sheet && (
        <div className="fixed inset-0 z-50 lg:hidden flex items-end bg-slate-900/40" onClick={() => setSheet(false)}>
          <div className="w-full max-h-[80vh] overflow-y-auto rounded-t-[28px] bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h2 className="text-[17px] font-extrabold inline-flex items-center gap-1.5"><Filter className="w-4 h-4 text-slate-500" /> 필터</h2><button onClick={() => setSheet(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-500" /></button></div>
            <div className="space-y-4">
              {FILTER_KEYS.map((f) => { const options = data?.facets?.[f.key] ?? []; if (!options.length) return null; return (
                <div key={f.key}><p className="text-[12px] font-bold text-slate-500 mb-2">{f.label}</p><div className="flex flex-wrap gap-1.5">{options.map((o: any) => <button key={o.code} onClick={() => setFilter(f.key, filters[f.key] === o.code ? '' : o.code)} className={`h-8 px-3 rounded-full text-[12.5px] font-semibold border ${filters[f.key] === o.code ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>{o.label} <span className="opacity-60 tabular-nums">{o.count}</span></button>)}</div></div>
              ); })}
            </div>
            <div className="sticky bottom-0 bg-white pt-4 mt-6 flex gap-2"><button onClick={() => setFilters({})} className="h-12 px-5 rounded-2xl border border-slate-200 text-[14px] font-bold text-slate-600">초기화</button><button onClick={() => setSheet(false)} className="flex-1 h-12 rounded-2xl bg-slate-900 text-white text-[14px] font-bold">{loading ? '조회 중…' : `결과 ${data?.total ?? 0}건 보기`}</button></div>
          </div>
        </div>
      )}
    </AboutShell>
  );
}
