/**
 * 선수 비교 `/athletes/compare?ids=a,b,c` — ATH-03 (선수 메뉴 핸드오프 v1.0 §6, 시안 2026-09-15)
 *
 *  비교 후보 바(최대 3명, 검색으로 변경) → 좌측 카테고리 → 핵심 요약 3열(사진·팬온도·TOP10·INDEX·5각형·태그)
 *  → 비교표(기본 정보 / 경기·팬 지표 / 후원 가능 / 추천 포인트) → 선수별 선수정보·관심선수·이 선수 PICK
 *  → 하단 바(비교 중 n명 · 전체 초기화 · 비교 결과로 추천받기).
 *  목표 context가 없으면 1등을 선언하지 않는다 (§6.3). 값은 실측만 (LEG-06). 모바일은 카드 누적 + 표 가로 스크롤.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, BarChart3, ChevronRight, Flame, Heart, Lightbulb, Loader2, Scale, Search, ShieldCheck, Star, Trash2, Trophy, UserRound, X } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import QuickProfile, { Radar } from '../../components/athlete/QuickProfile';
import { ACTIVITY_LABELS, tagsOf } from '../../components/athlete/AthleteCard';
import { COMPARE_MAX, useCompare, useFavorites } from '../../components/athlete/useAthleteTools';
import { api } from '../../services/api';
import { FAN_TEMP_NOTE } from '../../components/fanhub/FanKit';
import { EmptyState } from '../../components/ui/StateView';

type Col = {
  id: string; name: string; tour?: string; region?: string; profileImageUrl?: string; isRecommended?: boolean;
  fanTemp: number | null; index: number | null; axes: { label: string; value: number | null }[];
  avgRank: number | null; top10: number | null; slotOpen: number | null; slotTotal: number | null; minPrice: number | null;
  activities: string[]; activityKeys: string[]; modes: string[]; highlights: string[]; loading: boolean; error?: boolean;
};

const CATS = [
  { key: 'summary', label: '핵심 요약', icon: Star }, { key: 'basic', label: '기본 정보', icon: UserRound },
  { key: 'metrics', label: '경기 / 팬 지표', icon: BarChart3 }, { key: 'sponsor', label: '후원 가능', icon: ShieldCheck },
  { key: 'points', label: '추천 포인트', icon: Lightbulb },
];

export default function AthleteCompare() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const { compare, replace, remove, clear } = useCompare();
  const urlIds = useMemo(() => (sp.get('ids') || '').split(',').filter(Boolean).slice(0, COMPARE_MAX), [sp]);
  const ids = urlIds.length ? urlIds : compare.map((a) => a.id);

  /* URL ↔ 후보 동기화 — URL이 우선, URL이 비면 저장된 후보로 채운다 */
  useEffect(() => {
    if (!urlIds.length && compare.length) { const n = new URLSearchParams(sp); n.set('ids', compare.map((a) => a.id).join(',')); setSp(n, { replace: true }); }
  }, [urlIds, compare]); // eslint-disable-line react-hooks/exhaustive-deps

  const [cols, setCols] = useState<Record<string, Col>>({});
  useEffect(() => {
    ids.forEach((id) => {
      if (cols[id]) return;
      setCols((c) => ({ ...c, [id]: { id, name: '…', fanTemp: null, index: null, axes: [], avgRank: null, top10: null, slotOpen: null, slotTotal: null, minPrice: null, activities: [], activityKeys: [], modes: [], highlights: [], loading: true } }));
      Promise.all([
        api.getQuickProfile(id).then((r: any) => r?.data || null),
        api.getPublicAthleteRoiDashboard(id).then((r: any) => r?.data || null).catch(() => null),
      ]).then(([d, roi]) => {
        if (!d?.athlete) { setCols((c) => ({ ...c, [id]: { ...c[id], name: '불러오지 못함', loading: false, error: true } })); return; }
        const a = d.athlete;
        const ranked = (d.allResults || []).filter((r: any) => r.rank != null).slice(0, 5);
        const prices = (d.availableSlots || []).map((s: any) => s.price).filter((p: any) => p > 0);
        const keys = a.activityFields ? Object.entries(a.activityFields).filter(([, v]) => v).map(([k]) => k) : [];
        const modes: string[] = [];
        if ((d.availableSlots || []).length) modes.push('경기복 패치');
        if ((d.offers || []).some((o: any) => o.type === 'ONLINE_ONLY')) modes.push('온라인 전용');
        if ((d.offers || []).some((o: any) => o.type === 'STORE_MARKET')) modes.push('성장마켓');
        const col: Col = {
          id, name: a.name, tour: a.tour, region: a.region, profileImageUrl: a.profileImageUrl, isRecommended: a.isRecommended,
          fanTemp: d.fanTemp > 0 ? Number(d.fanTemp) : null,
          index: roi?.summary?.basicScore ?? roi?.summary?.score ?? null,
          axes: [
            /* 축 이름은 퀵프로필·전체 프로필과 같은 실측 축을 쓴다 — 다른 이름을 붙여 다른 지표처럼 보이게 하지 않는다 */
            { label: '경기력', value: roi?.athletePerformance?.score ?? null },
            { label: '팬반응', value: roi?.fandom?.score ?? null },
            { label: '콘텐츠성', value: roi?.contentEngagement?.score ?? null },
            { label: '브랜드 적합도', value: roi?.mediaExposure?.score ?? null },
            { label: '활동성', value: roi?.activity?.score ?? (keys.length ? Math.min(100, keys.length * 20) : null) },
          ],
          avgRank: d.recentAvgRank ?? null,
          top10: ranked.length ? ranked.filter((r: any) => Number(r.rank) <= 10).length : null,
          slotOpen: d.slotOpen ?? null, slotTotal: d.slotTotal ?? null,
          minPrice: prices.length ? Math.min(...prices) : null,
          activities: keys.map((k) => ACTIVITY_LABELS[k] || k), activityKeys: keys, modes,
          highlights: Array.isArray(a.highlights) ? a.highlights.slice(0, 2) : [],
          loading: false,
        };
        setCols((c) => ({ ...c, [id]: col }));
        /* 저장된 후보에 없으면 추가해 다른 화면과 맞춘다 */
        replace([...compare.filter((x) => ids.includes(x.id) && x.id !== id), { id, name: a.name, tour: a.tour, region: a.region, profileImageUrl: a.profileImageUrl }].filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i));
      }).catch(() => setCols((c) => ({ ...c, [id]: { ...c[id], name: '불러오지 못함', loading: false, error: true } })));
    });
  }, [ids]); // eslint-disable-line react-hooks/exhaustive-deps

  const setIds = (next: string[]) => {
    const n = new URLSearchParams(sp);
    if (next.length) n.set('ids', next.join(',')); else n.delete('ids');
    setSp(n, { replace: true });
    replace(next.map((id) => compare.find((x) => x.id === id) || cols[id] || { id }));
  };
  const removeId = (id: string) => { remove(id); setIds(ids.filter((x) => x !== id)); };
  const addId = (a: any) => { if (ids.includes(a.id) || ids.length >= COMPARE_MAX) return; setIds([...ids, a.id]); setCols((c) => c); };
  const clearAll = () => { clear(); setIds([]); };

  /* 검색 */
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const search = useCallback(async (text: string) => {
    setSearching(true);
    try { const r: any = await api.getPickAthletes({ q: text || undefined, limit: 8, sort: 'RECOMMENDED' }); setResults(r?.data?.athletes || []); }
    catch { setResults([]); } finally { setSearching(false); }
  }, []);
  useEffect(() => { if (!searchOpen) return; const t = setTimeout(() => search(q.trim()), 300); return () => clearTimeout(t); }, [q, search, searchOpen]);

  const selected = useMemo(() => ids.map((id) => cols[id]).filter(Boolean), [ids, cols]);
  const full = ids.length >= COMPARE_MAX;
  const { favs, toggle: toggleFav, toast, undo, dismissToast } = useFavorites();
  const [openId, setOpenId] = useState<string | null>(null);

  const fmt = {
    temp: (c: Col) => (c.fanTemp != null ? `${c.fanTemp.toFixed(1)}℃` : null),
    rank: (c: Col) => (c.avgRank != null ? `평균 ${c.avgRank}위` : null),
    top10: (c: Col) => (c.top10 != null ? `Top 10 (${c.top10}회)` : null),
  };
  const rows: { cat: string; k: string; v: (c: Col) => string | null; empty?: string; note?: string }[] = [
    { cat: '기본 정보', k: '활동 지역', v: (c) => c.region || null, empty: '—' },
    { cat: '기본 정보', k: '주요 활동', v: (c) => (c.activities.length ? c.activities.join(', ') : null), empty: '—' },
    { cat: '기본 정보', k: '투어', v: (c) => c.tour || null, empty: '—' },
    { cat: '경기 / 팬 지표', k: '팬온도', v: fmt.temp, note: FAN_TEMP_NOTE },
    { cat: '경기 / 팬 지표', k: '최근 5경기 평균 순위', v: fmt.rank, empty: '성적 확인 필요' },
    { cat: '경기 / 팬 지표', k: 'TOP 10 (최근 5경기)', v: fmt.top10, empty: '성적 확인 필요' },
    { cat: '후원 가능', k: '후원 가능 유형', v: (c) => (c.modes.length ? c.modes.join(', ') : null), empty: '판매 중인 상품 없음' },
    { cat: '후원 가능', k: '온라인 활동', v: (c) => { const o = c.activityKeys.filter((k) => ['sns', 'youtube'].includes(k)).map((k) => ACTIVITY_LABELS[k]); return o.length ? o.join(', ') : null; }, empty: '확인 필요' },
    { cat: '후원 가능', k: '후원 가능 슬롯', v: (c) => (c.slotTotal != null ? `${c.slotOpen ?? 0} / ${c.slotTotal}` : null), empty: '확인 필요' },
    { cat: '후원 가능', k: '시작가 (월)', v: (c) => (c.minPrice != null ? `${(c.minPrice / 10000).toLocaleString()}만원` : null), empty: '확인 필요' },
    { cat: '추천 포인트', k: '주요 이력', v: (c) => (c.highlights.length ? c.highlights.join(' · ') : null), empty: '등록된 이력 없음' },
  ];
  const catOf = (name: string) => rows.filter((r) => r.cat === name);

  const bar = (
    <div className="rounded-3xl bg-white border border-slate-200 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] font-extrabold">비교할 선수 {COMPARE_MAX}명까지 선택 <span className="text-emerald-600 tabular-nums">{ids.length}/{COMPARE_MAX}</span></p>
        <button onClick={() => { setSearchOpen((v) => !v); if (!searchOpen) search(''); }} className="h-10 px-3.5 rounded-xl border border-emerald-600 text-[12.5px] font-bold text-emerald-700 hover:bg-emerald-50">{searchOpen ? '닫기' : '선수 변경하기'}</button>
      </div>
      <div className="mt-3 grid sm:grid-cols-3 gap-2">
        {Array.from({ length: COMPARE_MAX }).map((_, i) => {
          const c = selected[i] || (ids[i] ? cols[ids[i]] : null);
          return c ? (
            <div key={c.id} className="h-14 pl-2 pr-2 inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white">
              <span className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0">{c.profileImageUrl && <img src={c.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-extrabold truncate">{c.loading ? '불러오는 중…' : `${c.name} 프로`}</span>
                <span className="block text-[11.5px] text-slate-500 truncate">{[c.tour, c.region?.split(' ')[0]].filter(Boolean).join(' · ')}</span>
              </span>
              <button onClick={() => removeId(c.id)} aria-label={`${c.name} 비교에서 제외`} className="w-8 h-8 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 inline-flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <button key={i} onClick={() => { setSearchOpen(true); search(''); }} className="h-14 rounded-xl border border-dashed border-slate-300 text-[12.5px] font-bold text-slate-500 inline-flex items-center justify-center gap-1.5 hover:border-emerald-400 hover:text-emerald-700"><Search className="w-4 h-4" /> 선수명으로 검색하여 추가</button>
          );
        })}
      </div>
      {searchOpen && (
        <div className="mt-3 rounded-2xl border border-slate-200 p-3">
          <label className="flex items-center gap-2 h-11 px-3.5 rounded-xl border border-slate-200 focus-within:border-emerald-400">
            <Search className="w-4 h-4 text-slate-400" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="선수명으로 검색하여 변경할 수 있습니다." className="flex-1 min-w-0 text-[13.5px] outline-none bg-transparent" />
            {searching && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
          </label>
          <ul className="mt-2 grid sm:grid-cols-2 gap-1.5 max-h-[260px] overflow-y-auto">
            {results.length === 0 && !searching && <li className="py-4 text-center text-[12.5px] text-slate-500">검색 결과가 없습니다</li>}
            {results.map((a: any) => {
              const on = ids.includes(a.id);
              return (
                <li key={a.id} className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-2.5 py-2">
                  <span className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden shrink-0">{a.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}</span>
                  <span className="min-w-0 flex-1"><span className="block text-[13px] font-bold truncate">{a.name} 프로</span><span className="block text-[11.5px] text-slate-500 truncate">{[a.tour, a.region?.split(' ')[0]].filter(Boolean).join(' · ')}</span></span>
                  <button onClick={() => (on ? removeId(a.id) : addId(a))} disabled={!on && full} className={`shrink-0 h-8 px-2.5 rounded-lg text-[12px] font-bold ${on ? 'bg-slate-900 text-white' : 'border border-emerald-600 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40'}`}>{on ? '제외' : full ? '가득 참' : '추가'}</button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4fbf7] text-slate-900 pb-28">
      <PublicHeader />
      <section className="max-w-[1180px] mx-auto px-5 pt-5">
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[13px]">
          <Link to="/" className="text-slate-500 hover:text-slate-700">홈</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link to="/athletes" className="text-slate-500 hover:text-slate-700">선수</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-emerald-700">선수 비교</span>
        </nav>
        <div className="mt-4 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-[30px] sm:text-[40px] font-extrabold tracking-[-0.03em] leading-tight">선수 비교</h1>
            <p className="mt-2 text-[14.5px] text-slate-600 break-keep leading-relaxed">최대 {COMPARE_MAX}명의 선수를 한눈에 비교하고,<br className="hidden sm:block" />우리 브랜드에 가장 잘 맞는 선수를 선택해보세요.</p>
          </div>
          <div className="hidden lg:flex items-center gap-5 shrink-0">
            <p aria-hidden className="font-script text-[22px] leading-[1.1] text-emerald-500/80 -rotate-6 select-none whitespace-nowrap">Compare<br />Find Your Best Athlete<br />with SPONPIK</p>
            <p className="rounded-2xl bg-white/90 shadow-sm border border-slate-100 px-3.5 py-2 text-[12.5px] font-bold text-slate-700 leading-snug">데이터로 만나는<br />더 나은 선택!</p>
          </div>
        </div>
        <div className="mt-5">{bar}</div>
      </section>

      <section className="max-w-[1180px] mx-auto px-5 mt-5 grid grid-cols-1 lg:grid-cols-[160px_minmax(0,1fr)] gap-4 items-start">
        <nav className="hidden lg:block rounded-2xl bg-white border border-slate-200 p-2 sticky top-20">
          {CATS.map((c) => { const I = c.icon; return <a key={c.key} href={`#cmp-${c.key}`} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"><I className="w-4 h-4" /> {c.label}</a>; })}
        </nav>

        <div className="min-w-0 space-y-4">
          {selected.length === 0 ? (
            <EmptyState title="비교할 선수를 선택하세요" desc="선수 찾기나 관심 선수에서 비교하기를 누르면 이곳에 담깁니다.">
              <Link to="/athletes/search" className="h-10 px-4 inline-flex items-center rounded-xl bg-emerald-600 text-white text-[13px] font-bold">선수 찾기</Link>
              <Link to="/athletes/favorites" className="h-10 px-4 inline-flex items-center rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700">관심 선수에서 선택</Link>
            </EmptyState>
          ) : (
            <>
              {/* 핵심 요약 */}
              <div id="cmp-summary" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 scroll-mt-24">
                {selected.map((c) => (
                  <article key={c.id} className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
                    <div className="relative aspect-[16/9] bg-slate-100">
                      {c.profileImageUrl && <img src={c.profileImageUrl} alt={`${c.name} 프로필 사진`} className="w-full h-full object-cover object-top" />}
                      {c.tour && <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-extrabold">{c.tour}</span>}
                      <button onClick={() => toggleFav(c.id, c.name)} aria-pressed={favs.has(c.id)} aria-label="관심 선수" className={`absolute top-2 right-2 w-9 h-9 rounded-full bg-white/90 inline-flex items-center justify-center ${favs.has(c.id) ? 'text-rose-500' : 'text-slate-500'}`}><Heart className={`w-4 h-4 ${favs.has(c.id) ? 'fill-current' : ''}`} /></button>
                    </div>
                    <div className="p-4">
                      <p className="text-[17px] font-extrabold">{c.loading ? <Loader2 className="w-4 h-4 animate-spin inline text-emerald-500" /> : c.name} <span className="text-[12px] font-bold text-slate-500">프로</span></p>
                      <p className="text-[12.5px] text-slate-500">{[c.tour, c.region?.split(' ')[0]].filter(Boolean).join(' · ')}</p>
                      <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                        <div title={FAN_TEMP_NOTE}><p className="inline-flex items-center gap-1 text-[14px] font-extrabold tabular-nums"><Flame className="w-4 h-4 text-emerald-600" />{fmt.temp(c) ?? <span className="text-[12px] text-slate-500">집계 중</span>}</p><p className="text-[11px] text-slate-500">팬온도</p></div>
                        <div><p className="inline-flex items-center gap-1 text-[14px] font-extrabold tabular-nums"><Trophy className="w-4 h-4 text-slate-500" />{fmt.top10(c) ?? <span className="text-[12px] text-slate-500">확인 필요</span>}</p><p className="text-[11px] text-slate-500">최근 5경기</p></div>
                        <div className="rounded-xl bg-emerald-50 px-3 py-1.5 text-center"><p className="text-[10px] font-bold text-emerald-700">SPONPIK INDEX</p><p className="text-[20px] font-black text-emerald-700 tabular-nums leading-none">{c.index != null ? Math.round(c.index) : <span className="text-[12px]">집계 중</span>}</p></div>
                      </div>
                      <Radar axes={c.axes} size={200} showValues />
                      {c.axes.every((x) => x.value == null) && <p className="text-center text-[12px] text-slate-500">지수 집계 중</p>}
                      <div className="mt-2 flex flex-wrap gap-1">{tagsOf({ activities: c.activityKeys, slotOpen: c.slotOpen, modes: c.modes }).map((t) => <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-bold text-slate-600">{t}</span>)}</div>
                    </div>
                  </article>
                ))}
              </div>

              {/* 비교표 */}
              <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px] min-w-[640px]">
                    <tbody>
                      {['기본 정보', '경기 / 팬 지표', '후원 가능', '추천 포인트'].map((cat, ci) => (
                        catOf(cat).map((r, ri) => (
                          <tr key={r.k} id={ri === 0 ? `cmp-${['basic', 'metrics', 'sponsor', 'points'][ci]}` : undefined} className={`border-t border-slate-100 ${ri === 0 ? 'scroll-mt-24' : ''}`}>
                            {ri === 0 && <th rowSpan={catOf(cat).length} className="w-[92px] px-3 py-3 text-left text-[12.5px] font-extrabold text-slate-800 bg-slate-50/70 align-top border-r border-slate-100">{cat}</th>}
                            <th className="w-[150px] px-3 py-3 text-left text-[12px] font-bold text-slate-500 align-top" title={r.note}>{r.k}</th>
                            {selected.map((c) => {
                              const v = c.loading ? null : r.v(c);
                              return <td key={c.id} className="px-3 py-3 text-center font-bold text-slate-800 align-top break-keep">{c.loading ? <span className="text-slate-300">…</span> : v ?? <span className="text-slate-500 font-semibold">{r.empty || '집계 중'}</span>}</td>;
                            })}
                          </tr>
                        ))
                      ))}
                      <tr className="border-t border-slate-100 bg-emerald-50/40">
                        <th className="px-3 py-3 text-left text-[12.5px] font-extrabold text-slate-800 align-top border-r border-slate-100">추천 포인트</th>
                        <th className="px-3 py-3 text-left text-[12px] font-bold text-slate-500 align-top">목표 적합</th>
                        <td colSpan={selected.length} className="px-3 py-3 text-[12.5px] text-slate-600 break-keep">
                          목표·타깃 조건을 넣으면 선수별 적합 이유가 표시됩니다. <Link to="/athletes/match" className="font-bold text-emerald-700 hover:underline">나에게 맞는 선수에서 조건 입력 →</Link>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="px-4 py-2.5 border-t border-slate-100 text-[12px] text-slate-500 break-keep">{FAN_TEMP_NOTE} 순위를 매기지 않고 차이만 보여드립니다.</p>
              </div>

              {/* 선수별 행동 */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selected.map((c) => (
                  <div key={c.id} className="grid grid-cols-3 gap-1.5">
                    <button onClick={() => setOpenId(c.id)} className="h-11 rounded-xl border border-slate-200 bg-white text-[12.5px] font-bold text-slate-700 hover:border-slate-400">선수정보</button>
                    <button onClick={() => toggleFav(c.id, c.name)} className={`h-11 rounded-xl border text-[12.5px] font-bold ${favs.has(c.id) ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'}`}>관심선수</button>
                    <Link to={`/sponsor/direct/build/${c.id}`} className="h-11 rounded-xl bg-emerald-600 text-white text-[12.5px] font-bold inline-flex items-center justify-center gap-1 hover:bg-emerald-700">이 선수 PICK</Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* 하단 바 */}
      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-14 lg:bottom-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-8px_24px_-16px_rgba(15,23,42,0.25)]">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-5 py-2.5 sm:py-3 flex items-center gap-3">
            <p className="text-[13.5px] font-bold"><span className="text-emerald-600 text-[18px] font-black tabular-nums">{selected.length}</span> 명의 선수를 비교하고 있습니다.</p>
            <div className="hidden sm:flex items-center gap-1.5">
              {selected.map((c) => <span key={c.id} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold"><span className="w-7 h-7 rounded-full overflow-hidden bg-slate-100">{c.profileImageUrl && <img src={c.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}</span>{c.name}</span>)}
            </div>
            <button onClick={clearAll} className="ml-auto h-10 px-3 inline-flex items-center gap-1 rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-600 hover:border-slate-400"><Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">전체 초기화</span></button>
            <Link to={`/athletes/match?ids=${ids.join(',')}`} className="h-10 sm:h-11 px-4 sm:px-5 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[13px] sm:text-[13.5px] font-bold"><Scale className="w-4 h-4" /> 비교 결과로 추천받기 <ArrowRight className="w-4 h-4 hidden sm:block" /></Link>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[92px] lg:bottom-20 z-40 rounded-xl bg-slate-900 text-white text-[13px] px-4 py-2.5 shadow-lg flex items-center gap-3">
          관심 선수에서 해제했습니다. <button onClick={undo} className="font-bold text-emerald-300">되돌리기</button>
          <button onClick={dismissToast} aria-label="닫기" className="text-slate-400"><X className="w-4 h-4" /></button>
        </div>
      )}
      {openId && <QuickProfile athleteId={openId} fav={favs.has(openId)} onFav={() => toggleFav(openId, cols[openId]?.name)} onClose={() => setOpenId(null)} onPick={(id) => navigate(`/sponsor/direct/build/${id}`)} />}
    </div>
  );
}
