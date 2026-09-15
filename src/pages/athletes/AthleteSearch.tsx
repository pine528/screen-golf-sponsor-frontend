/**
 * 선수 찾기 `/athletes/search` — ATH-01 (선수 메뉴 핸드오프 v1.0 §4, 시안 2026-09-15 Desktop·Mobile)
 *
 *  검색 + 종목 칩 → 빠른 필터(지역·투어·후원 가능·온라인·정렬) → 빠른 테마 5개
 *  → 좌측 상세 필터(데스크톱) / 필터 시트(모바일) → 카드 4열×2행(8명) + 페이지네이션 → 하단 비교 바
 *  검색·필터·정렬·page는 URL query와 양방향 동기화한다 (§4.3). 0건이면 조건 초기화 / 나에게 맞는 선수.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronDown, ChevronLeft, ChevronRight, Flame, Heart, MapPin, RotateCcw, Search, SlidersHorizontal,
  Smartphone, Target, TrendingUp, Trophy, X,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import AthleteCard, { ACTIVITY_LABELS } from '../../components/athlete/AthleteCard';
import QuickProfile from '../../components/athlete/QuickProfile';
import CompareBar from '../../components/athlete/CompareBar';
import { useCompare, useFavorites } from '../../components/athlete/useAthleteTools';
import { api } from '../../services/api';
import { EmptyState, ErrorState, LoadingState, useSlowLoading } from '../../components/ui/StateView';

const PAGE = 8;
const SPORTS = ['전체', '골프', '야구', '축구', '농구', '배구', 'e스포츠', '육상', '테니스', '기타'];
const LIVE_SPORTS = new Set(['전체', '골프']);
const SORTS = [
  { key: 'RECOMMENDED', label: '추천순' },
  { key: 'NEW', label: '최신순' },
  { key: 'FAN_TEMP', label: '팬온도순' },
  { key: 'PERFORMANCE', label: '최근 성적순' },
  { key: 'PRICE', label: '가격 낮은순' },
  { key: 'NAME', label: '이름순' },
];
const SPONSORSHIP = [
  { key: '', label: '후원 가능 · 전체' }, { key: 'available', label: '바로 가능' }, { key: 'confirmation', label: '선수 확인 후' },
];
const ONLINE = [{ key: '', label: '온라인 활동 · 전체' }, { key: 'active', label: '활발' }, { key: 'none', label: '없음' }];
const BUDGET = [{ key: '', label: '예산 무관' }, { key: '300000', label: '월 30만원 이하' }, { key: '500000', label: '월 50만원 이하' }, { key: '1000000', label: '월 100만원 이하' }];

/** 빠른 테마 — 실데이터로 판정할 수 있는 것만 (§4.1 Quick theme) */
const THEMES = [
  { key: 'FAN', icon: Heart, title: '팬온도 높은 선수', desc: '지금 가장 주목받는 선수', patch: { sort: 'FAN_TEMP' } },
  { key: 'PERF', icon: TrendingUp, title: '최근 성적 우수', desc: '최근 5경기 평균 순위가 좋은 선수', patch: { sort: 'PERFORMANCE' } },
  { key: 'OPEN', icon: Target, title: '후원 가능', desc: '바로 후원할 수 있는 선수', patch: { sponsorship: 'available' } },
  { key: 'REGION', icon: MapPin, title: '지역 연계', desc: '내 지역의 선수', patch: { region: '서울' } },
  { key: 'ONLINE', icon: Smartphone, title: '온라인 활동 활발', desc: 'SNS 활동이 활발한 선수', patch: { online: 'active' } },
];

type Q = { q: string; sport: string; tour: string; region: string; activity: string; online: string; sponsorship: string; budget: string; sort: string; page: number };
const DEFAULT: Q = { q: '', sport: '전체', tour: '', region: '', activity: '', online: '', sponsorship: '', budget: '', sort: 'RECOMMENDED', page: 1 };

function readQ(sp: URLSearchParams): Q {
  return {
    q: sp.get('q') || '', sport: sp.get('sport') || '전체', tour: sp.get('tour') || '', region: sp.get('region') || '',
    activity: sp.get('activity') || '', online: sp.get('online') || '', sponsorship: sp.get('sponsorship') || '',
    budget: sp.get('budget') || '', sort: sp.get('sort') || 'RECOMMENDED', page: Math.max(1, Number(sp.get('page')) || 1),
  };
}

export default function AthleteSearch() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const qs = useMemo(() => readQ(sp), [sp]);
  const [text, setText] = useState(qs.q);
  useEffect(() => setText(qs.q), [qs.q]);

  const patch = useCallback((p: Partial<Q>, resetPage = true) => {
    const next = { ...qs, ...p, ...(resetPage ? { page: 1 } : {}) };
    const out = new URLSearchParams();
    (Object.keys(next) as (keyof Q)[]).forEach((k) => {
      const v = next[k];
      if (v === DEFAULT[k] || v === '' || v == null) return;
      out.set(k, String(v));
    });
    setSp(out, { replace: false });
  }, [qs, setSp]);
  const reset = () => setSp(new URLSearchParams(), { replace: false });

  /* 데이터 */
  const [all, setAll] = useState<any[]>([]);       // 필터 적용 결과
  const [base, setBase] = useState<any[]>([]);     // 조건 없는 전체 — 필터 패널의 개수 표기용
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<any>(null);
  const slow = useSlowLoading(loading);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const r: any = await api.getPickAthletes({
        q: qs.q || undefined, tour: qs.tour || undefined, region: qs.region || undefined, activity: qs.activity || undefined,
        online: qs.online || undefined, sponsorship: qs.sponsorship || undefined,
        maxMonthly: qs.budget ? Number(qs.budget) : undefined, sort: qs.sort, limit: 120,
      });
      setAll(r?.data?.athletes || []);
    } catch (e) { setErr(e); setAll([]); } finally { setLoading(false); }
  }, [qs.q, qs.tour, qs.region, qs.activity, qs.online, qs.sponsorship, qs.budget, qs.sort]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.getPickAthletes({ limit: 120, sort: 'RECOMMENDED' }).then((r: any) => setBase(r?.data?.athletes || [])).catch(() => {}); }, []);

  const pages = Math.max(1, Math.ceil(all.length / PAGE));
  const page = Math.min(qs.page, pages);
  const items = useMemo(() => all.slice((page - 1) * PAGE, page * PAGE), [all, page]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [page]);

  /* 패널 facet — 전체 목록 기준 개수 */
  const facets = useMemo(() => {
    const count = (fn: (a: any) => string | null) => {
      const m = new Map<string, number>();
      base.forEach((a) => { const k = fn(a); if (k) m.set(k, (m.get(k) || 0) + 1); });
      return [...m.entries()].sort((x, y) => y[1] - x[1]);
    };
    return {
      tours: count((a) => a.tour || null),
      regions: count((a) => a.region?.split(' ')[0] || null),
      activities: Object.keys(ACTIVITY_LABELS).map((k) => [k, base.filter((a) => a.activities?.includes(k)).length] as [string, number]).filter(([, n]) => n > 0),
      open: base.filter((a) => a.availability === 'OPEN').length,
    };
  }, [base]);

  const { favs, toggle: toggleFav, toast, undo, dismissToast } = useFavorites();
  const { compare, has: comparing, toggle: toggleCompare, remove: removeCompare, full: compareFull } = useCompare();
  const [openId, setOpenId] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [barH, setBarH] = useState(96);

  const multi = (v: string) => v.split(',').filter(Boolean);
  const toggleMulti = (key: 'tour' | 'region' | 'activity', val: string) => {
    const cur = multi(qs[key]);
    const next = cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val];
    patch({ [key]: next.join(',') } as any);
  };
  const activeCount = [qs.tour, qs.region, qs.activity, qs.online, qs.sponsorship, qs.budget].filter(Boolean).length + (qs.sport !== '전체' ? 1 : 0);
  const themeOn = (t: typeof THEMES[number]) => Object.entries(t.patch).every(([k, v]) => (qs as any)[k] === v);

  const filterPanel = (
    <div className="space-y-4">
      <Facet title="종목">
        {SPORTS.slice(1).map((s) => {
          const live = LIVE_SPORTS.has(s);
          return (
            <label key={s} className={`flex items-center gap-2 text-[13px] ${live ? 'text-slate-700' : 'text-slate-400'}`}>
              <input type="checkbox" disabled={!live} checked={qs.sport === s} onChange={() => patch({ sport: qs.sport === s ? '전체' : s })} className="accent-emerald-600 w-4 h-4" />
              {s} <span className="text-slate-400">({live ? base.length : 0})</span>{!live && <span className="text-[11px]">준비 중</span>}
            </label>
          );
        })}
      </Facet>
      <Facet title="투어 / 리그">
        {facets.tours.map(([t, n]) => (
          <label key={t} className="flex items-center gap-2 text-[13px] text-slate-700">
            <input type="checkbox" checked={multi(qs.tour).includes(t)} onChange={() => toggleMulti('tour', t)} className="accent-emerald-600 w-4 h-4" />
            {t} <span className="text-slate-400">({n})</span>
          </label>
        ))}
      </Facet>
      <Facet title="지역">
        <select value={multi(qs.region)[0] || ''} onChange={(e) => patch({ region: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] bg-white">
          <option value="">지역 선택</option>
          {facets.regions.map(([r, n]) => <option key={r} value={r}>{r} ({n})</option>)}
        </select>
      </Facet>
      <Facet title="활동 유형">
        {facets.activities.map(([k, n]) => (
          <label key={k} className="flex items-center gap-2 text-[13px] text-slate-700">
            <input type="checkbox" checked={multi(qs.activity).includes(k)} onChange={() => toggleMulti('activity', k)} className="accent-emerald-600 w-4 h-4" />
            {ACTIVITY_LABELS[k] || k} <span className="text-slate-400">({n})</span>
          </label>
        ))}
      </Facet>
      <Facet title="후원 가능 여부">
        <label className="flex items-center gap-2 text-[13px] text-slate-700">
          <input type="checkbox" checked={qs.sponsorship === 'available'} onChange={() => patch({ sponsorship: qs.sponsorship === 'available' ? '' : 'available' })} className="accent-emerald-600 w-4 h-4" />
          후원 가능 <span className="text-slate-400">({facets.open})</span>
        </label>
      </Facet>
      <Facet title="예산">
        <select value={qs.budget} onChange={(e) => patch({ budget: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] bg-white">
          {BUDGET.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
        </select>
      </Facet>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4fbf7] text-slate-900" style={{ paddingBottom: barH + 24 }}>
      <PublicHeader />

      {/* ── 히어로 ── */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute right-[-100px] top-[-120px] w-[480px] h-[480px] rounded-full bg-emerald-100/60 blur-2xl" />
        </div>
        <div className="max-w-[1180px] mx-auto px-5 pt-5 relative">
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[13px]">
            <Link to="/" className="text-slate-500 hover:text-slate-700">홈</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link to="/athletes" className="text-slate-500 hover:text-slate-700">선수</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-emerald-700">선수 찾기</span>
          </nav>
          <div className="mt-4 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h1 className="text-[30px] sm:text-[40px] font-extrabold tracking-[-0.03em] leading-tight">선수 찾기</h1>
              <p className="mt-2 text-[14.5px] text-slate-600 break-keep leading-relaxed">등록된 다양한 선수를 종목, 지역, 활동 분야, 후원 적합도 등으로 검색해보세요.<br className="hidden sm:block" />브랜드에 꼭 맞는 선수를 더 쉽게 찾을 수 있습니다.</p>
            </div>
            <div className="hidden lg:flex items-center gap-5 shrink-0">
              <p aria-hidden className="font-script text-[24px] leading-[1.1] text-emerald-500/80 -rotate-6 select-none">Athletes<br />Connect<br />More Possibilities</p>
              <p className="rounded-2xl bg-white/90 shadow-sm border border-slate-100 px-3.5 py-2 text-[12.5px] font-bold text-slate-700 leading-snug">좋은 선수가<br />더 큰 가능성을 만듭니다.</p>
            </div>
          </div>

          {/* 검색 */}
          <form onSubmit={(e) => { e.preventDefault(); patch({ q: text.trim() }); }} className="mt-5 flex gap-2">
            <label className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="선수명, 종목, 지역, 키워드로 검색해보세요." className="w-full h-13 h-[52px] pl-12 pr-4 rounded-2xl border border-slate-200 bg-white text-[14.5px] placeholder:text-slate-400 focus:outline-none focus:border-emerald-400" />
            </label>
            <button type="submit" className="shrink-0 h-[52px] px-5 sm:px-6 rounded-2xl bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700">검색</button>
          </form>

          {/* 종목 칩 */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SPORTS.map((s) => {
              const live = LIVE_SPORTS.has(s);
              const on = qs.sport === s;
              return (
                <button key={s} onClick={() => live && patch({ sport: s })} disabled={!live} title={live ? undefined : '준비 중인 종목입니다'}
                  className={`h-10 px-4 rounded-full text-[13px] font-bold whitespace-nowrap border transition-colors ${on ? 'bg-emerald-600 border-emerald-600 text-white' : live ? 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300' : 'bg-white border-slate-100 text-slate-300 cursor-not-allowed'}`}>
                  {s}
                </button>
              );
            })}
          </div>

          {/* 빠른 필터 (데스크톱) / 필터·정렬 (모바일) */}
          <div className="mt-3 hidden lg:flex flex-wrap gap-2 items-center">
            <Select value={multi(qs.region)[0] || ''} onChange={(v) => patch({ region: v })} options={[{ key: '', label: '지역' }, ...facets.regions.map(([r]) => ({ key: r, label: r }))]} />
            <Select value={multi(qs.tour)[0] || ''} onChange={(v) => patch({ tour: v })} options={[{ key: '', label: '투어' }, ...facets.tours.map(([t]) => ({ key: t, label: t }))]} />
            <Select value={qs.sponsorship} onChange={(v) => patch({ sponsorship: v })} options={SPONSORSHIP} />
            <Select value={qs.online} onChange={(v) => patch({ online: v })} options={ONLINE} />
            <div className="ml-auto"><Select value={qs.sort} onChange={(v) => patch({ sort: v })} options={SORTS.map((s) => ({ key: s.key, label: `정렬: ${s.label}` }))} /></div>
          </div>
          <div className="mt-3 flex lg:hidden gap-2">
            <button onClick={() => setSheet(true)} className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-[13.5px] font-bold text-slate-700">
              <SlidersHorizontal className="w-4 h-4" /> 필터{activeCount > 0 && <span className="ml-0.5 px-1.5 rounded-full bg-emerald-600 text-white text-[11px]">{activeCount}</span>}
            </button>
            <div className="flex-1"><Select value={qs.sort} onChange={(v) => patch({ sort: v })} options={SORTS.map((s) => ({ key: s.key, label: `정렬: ${s.label}` }))} full /></div>
          </div>
        </div>
      </section>

      {/* ── 본문 ── */}
      <div className="max-w-[1180px] mx-auto px-5 mt-5 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-5 items-start">
        {/* 상세 필터 (데스크톱) */}
        <aside className="hidden lg:block rounded-2xl bg-white border border-slate-200 p-4 sticky top-20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-extrabold">상세 조건으로 찾기</p>
              <p className="text-[12px] text-slate-500">원하는 조건을 선택해보세요.</p>
            </div>
            <button onClick={reset} className="inline-flex items-center gap-1 text-[12px] font-bold text-slate-500 hover:text-emerald-700"><RotateCcw className="w-3.5 h-3.5" /> 전체 초기화</button>
          </div>
          <div className="mt-4">{filterPanel}</div>
        </aside>

        <section className="min-w-0">
          {/* 빠른 테마 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {THEMES.map((t) => {
              const I = t.icon;
              const on = themeOn(t);
              return (
                <button key={t.key} onClick={() => patch(on ? Object.fromEntries(Object.keys(t.patch).map((k) => [k, (DEFAULT as any)[k]])) as any : t.patch)} aria-pressed={on}
                  className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-colors ${on ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-100 bg-white hover:border-emerald-300'}`}>
                  <span className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center justify-center shrink-0"><I className="w-4 h-4" /></span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-extrabold truncate">{t.title}</span>
                    <span className="block text-[11px] text-slate-500 truncate">{t.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* 카운트 · 정렬 */}
          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-[17px] font-extrabold">전체 선수 <span className="text-emerald-600 tabular-nums">{loading ? '—' : all.length}</span></p>
            {activeCount > 0 && <button onClick={reset} className="lg:hidden inline-flex items-center gap-1 text-[12px] font-bold text-slate-500"><RotateCcw className="w-3.5 h-3.5" /> 초기화</button>}
          </div>

          {loading ? (
            <LoadingState label="선수 목록을 불러오는 중…" slow={slow} onRetry={load} />
          ) : err ? (
            <div className="mt-4"><ErrorState error={err} onRetry={load} /></div>
          ) : all.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="조건에 맞는 선수가 없습니다" desc="조건을 초기화하거나, 목표와 타깃으로 맞는 선수를 추천받아 보세요.">
                <button onClick={reset} className="h-10 px-4 inline-flex items-center rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700">조건 초기화</button>
                <Link to="/athletes/match" className="h-10 px-4 inline-flex items-center rounded-xl bg-emerald-600 text-white text-[13px] font-bold">나에게 맞는 선수</Link>
              </EmptyState>
            </div>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {items.map((a) => (
                  <AthleteCard key={a.id} a={a} fav={favs.has(a.id)} comparing={comparing(a.id)} compareFull={compareFull}
                    onInfo={() => setOpenId(a.id)} onFav={() => toggleFav(a.id, a.name)} onCompare={() => toggleCompare(a)}
                    primary={{ label: '관심선수', onClick: () => toggleFav(a.id, a.name) }} />
                ))}
              </div>
              {pages > 1 && (
                <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label="페이지">
                  <button onClick={() => patch({ page: page - 1 }, false)} disabled={page === 1} className="w-9 h-9 rounded-full inline-flex items-center justify-center text-slate-500 disabled:opacity-30 hover:bg-white"><ChevronLeft className="w-4 h-4" /></button>
                  {pageWindow(page, pages).map((n) => (
                    <button key={n} onClick={() => patch({ page: n }, false)} aria-current={page === n ? 'page' : undefined}
                      className={`w-9 h-9 rounded-full text-[13px] font-bold ${page === n ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-white'}`}>{n}</button>
                  ))}
                  <button onClick={() => patch({ page: page + 1 }, false)} disabled={page === pages} className="w-9 h-9 rounded-full inline-flex items-center justify-center text-slate-500 disabled:opacity-30 hover:bg-white"><ChevronRight className="w-4 h-4" /></button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>

      {/* 모바일 필터 시트 */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-900/45" onClick={() => setSheet(false)}>
          <div role="dialog" aria-modal="true" aria-label="필터" onClick={(e) => e.stopPropagation()} className="w-full max-h-[86vh] overflow-y-auto rounded-t-3xl bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-[16px] font-extrabold">상세 조건으로 찾기</p>
              <button onClick={() => setSheet(false)} aria-label="닫기" className="w-9 h-9 rounded-full inline-flex items-center justify-center text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="mt-4">{filterPanel}</div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={reset} className="h-11 rounded-xl border border-slate-200 text-[13.5px] font-bold text-slate-700">초기화</button>
              <button onClick={() => setSheet(false)} className="h-11 rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold">적용하기</button>
            </div>
          </div>
        </div>
      )}

      <CompareBar compare={compare} onRemove={removeCompare} onHeight={setBarH} mobileCompact />

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 z-40 rounded-xl bg-slate-900 text-white text-[13px] px-4 py-2.5 shadow-lg flex items-center gap-3" style={{ bottom: barH + 12 }}>
          관심 선수에서 해제했습니다.
          <button onClick={undo} className="font-bold text-emerald-300">되돌리기</button>
          <button onClick={dismissToast} aria-label="닫기" className="text-slate-400"><X className="w-4 h-4" /></button>
        </div>
      )}

      {openId && (
        <QuickProfile athleteId={openId} fav={favs.has(openId)} onFav={() => { const a = all.find((x) => x.id === openId); toggleFav(openId, a?.name); }} onClose={() => setOpenId(null)} onPick={(id) => navigate(`/sponsor/direct/build/${id}`)} />
      )}
    </div>
  );
}

function pageWindow(page: number, pages: number) {
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  return Array.from({ length: Math.min(5, pages) }, (_, i) => start + i);
}

function Facet({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-t border-slate-100 pt-3 first:border-0 first:pt-0">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="w-full flex items-center justify-between text-[13.5px] font-extrabold text-slate-800">
        <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{title}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="mt-2 space-y-1.5">{children}</div>}
    </div>
  );
}

function Select({ value, onChange, options, full }: { value: string; onChange: (v: string) => void; options: { key: string; label: string }[]; full?: boolean }) {
  return (
    <label className={`relative ${full ? 'block' : 'inline-block'}`}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`h-11 pl-3.5 pr-9 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 appearance-none focus:outline-none focus:border-emerald-400 ${full ? 'w-full' : ''}`}>
        {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    </label>
  );
}

void Flame; void Trophy;
