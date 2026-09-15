/**
 * 선수 비교 `/athletes/compare` — 선수 허브 메뉴 (2026-09-15)
 *
 * 최대 3명을 골라 한 표에서 비교한다. 선택은 localStorage에 남고 `?ids=a,b,c`로도 들어올 수 있다.
 * 값은 실측만 쓴다 — 없으면 "집계 중"/"확인 필요" (LEG-06).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, BarChart3, ChevronRight, Loader2, Plus, Search, X } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';
import { FAN_TEMP_NOTE } from '../../components/fanhub/FanKit';

const KEY = 'sponpik.athletes.compare';
const MAX = 3;

type Col = {
  id: string; name: string; tour?: string; region?: string; profileImageUrl?: string; isRecommended?: boolean;
  fanTemp: number | null; index: number | null; avgRank: number | null; top10: number | null;
  slotOpen: number | null; slotTotal: number | null; minPrice: number | null; activities: string[]; loading: boolean; error?: boolean;
};

const ACTIVITY_LABELS: Record<string, string> = {
  tour1: '대회 출전', tour2: '2부 투어', gtour: 'G투어', lesson: '레슨', proAm: '프로암', sns: 'SNS 콘텐츠', youtube: '유튜브', etc: '기타',
};

function readIds(): string[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.filter(Boolean).slice(0, MAX) : []; } catch { return []; }
}

export default function AthleteCompare() {
  const [sp, setSp] = useSearchParams();
  const [ids, setIds] = useState<string[]>(() => {
    const q = (sp.get('ids') || '').split(',').filter(Boolean).slice(0, MAX);
    return q.length ? q : readIds();
  });
  const [cols, setCols] = useState<Record<string, Col>>({});
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* 무시 */ }
    const next = new URLSearchParams(sp);
    if (ids.length) next.set('ids', ids.join(',')); else next.delete('ids');
    setSp(next, { replace: true });
  }, [ids]); // eslint-disable-line react-hooks/exhaustive-deps

  /* 선택한 선수 상세 — 퀵프로필 + ROI 종합점수 */
  useEffect(() => {
    ids.forEach((id) => {
      if (cols[id]) return;
      setCols((c) => ({ ...c, [id]: { id, name: '…', fanTemp: null, index: null, avgRank: null, top10: null, slotOpen: null, slotTotal: null, minPrice: null, activities: [], loading: true } }));
      Promise.all([
        api.getQuickProfile(id).then((r: any) => r?.data || null),
        api.getPublicAthleteRoiDashboard(id).then((r: any) => r?.data || null).catch(() => null),
      ]).then(([d, roi]) => {
        if (!d?.athlete) { setCols((c) => ({ ...c, [id]: { ...c[id], name: '불러오지 못함', loading: false, error: true } })); return; }
        const a = d.athlete;
        const ranked = (d.allResults || []).filter((r: any) => r.rank != null).slice(0, 5);
        const prices = (d.availableSlots || []).map((s: any) => s.price).filter((p: any) => p > 0);
        setCols((c) => ({
          ...c,
          [id]: {
            id, name: a.name, tour: a.tour, region: a.region, profileImageUrl: a.profileImageUrl, isRecommended: a.isRecommended,
            fanTemp: d.fanTemp > 0 ? Number(d.fanTemp) : null,
            index: roi?.summary?.basicScore ?? roi?.summary?.score ?? null,
            avgRank: d.recentAvgRank ?? null,
            top10: ranked.length ? ranked.filter((r: any) => Number(r.rank) <= 10).length : null,
            slotOpen: d.slotOpen ?? null, slotTotal: d.slotTotal ?? null,
            minPrice: prices.length ? Math.min(...prices) : null,
            activities: a.activityFields ? Object.entries(a.activityFields).filter(([, v]) => v).map(([k]) => ACTIVITY_LABELS[k] || k) : [],
            loading: false,
          },
        }));
      }).catch(() => setCols((c) => ({ ...c, [id]: { ...c[id], name: '불러오지 못함', loading: false, error: true } })));
    });
  }, [ids]); // eslint-disable-line react-hooks/exhaustive-deps

  /* 검색 — 300ms 디바운스 */
  const search = useCallback(async (text: string) => {
    setSearching(true);
    try {
      const r: any = await api.getPickAthletes({ q: text || undefined, limit: 8, sort: 'recommended' });
      setResults(r?.data?.athletes || []);
    } catch { setResults([]); } finally { setSearching(false); }
  }, []);
  useEffect(() => { const t = setTimeout(() => search(q.trim()), 300); return () => clearTimeout(t); }, [q, search]);

  const add = (id: string) => setIds((v) => (v.includes(id) || v.length >= MAX ? v : [...v, id]));
  const remove = (id: string) => setIds((v) => v.filter((x) => x !== id));

  const selected = useMemo(() => ids.map((id) => cols[id]).filter(Boolean), [ids, cols]);
  const full = ids.length >= MAX;

  const rows: { k: string; v: (c: Col) => string | null; note?: string; empty?: string }[] = [
    { k: '투어', v: (c) => c.tour || null, empty: '—' },
    { k: '활동지역', v: (c) => c.region || null, empty: '—' },
    { k: '팬온도', v: (c) => (c.fanTemp != null ? `${c.fanTemp.toFixed(1)}℃` : null), note: FAN_TEMP_NOTE },
    { k: 'SPONPIK INDEX', v: (c) => (c.index != null ? String(Math.round(c.index)) : null) },
    { k: '최근 5경기 평균 순위', v: (c) => (c.avgRank != null ? `${c.avgRank}위` : null), empty: '성적 확인 필요' },
    { k: 'TOP 10', v: (c) => (c.top10 != null ? `${c.top10}회` : null), empty: '성적 확인 필요' },
    { k: '후원 가능 슬롯', v: (c) => (c.slotTotal != null ? `${c.slotOpen ?? 0}/${c.slotTotal}` : null), empty: '확인 필요' },
    { k: '시작가 (월)', v: (c) => (c.minPrice != null ? `${(c.minPrice / 10000).toLocaleString()}만원` : null), empty: '확인 필요' },
    { k: '주요 활동', v: (c) => (c.activities.length ? c.activities.join(' · ') : null), empty: '—' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16">
      <PublicHeader />
      <div className="max-w-[1180px] mx-auto px-5 pt-5">
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[13px]">
          <Link to="/" className="text-slate-500 hover:text-slate-700">홈</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link to="/athletes" className="text-slate-500 hover:text-slate-700">선수</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-emerald-700">선수 비교</span>
        </nav>

        <div className="mt-5 flex items-start gap-3">
          <span className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 inline-flex items-center justify-center shrink-0"><BarChart3 className="w-6 h-6" /></span>
          <div>
            <h1 className="text-[26px] sm:text-[32px] font-extrabold tracking-[-0.03em] leading-tight">선수 비교</h1>
            <p className="mt-1 text-[13.5px] text-slate-600 break-keep">최대 {MAX}명의 선수를 한 번에 비교하고 가장 적합한 선수를 선택해보세요. 측정되지 않은 값은 표시하지 않습니다.</p>
          </div>
        </div>

        <div className="mt-6 grid lg:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
          {/* 비교 표 */}
          <section className="rounded-2xl border border-slate-200 overflow-hidden">
            {selected.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[15px] font-bold text-slate-700">아직 선택한 선수가 없습니다</p>
                <p className="mt-1 text-[13px] text-slate-500 break-keep">오른쪽 검색에서 선수를 추가하면 여기서 한눈에 비교할 수 있어요.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] min-w-[560px]">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="w-[150px] px-4 py-3 text-left text-[12px] font-bold text-slate-500">항목</th>
                      {selected.map((c) => (
                        <th key={c.id} className="px-3 py-3 text-left align-top">
                          <div className="flex items-start gap-2.5">
                            <span className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                              {c.profileImageUrl && <img src={c.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                            </span>
                            <span className="min-w-0">
                              {c.isRecommended && <span className="block w-fit px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[10.5px] font-extrabold">추천</span>}
                              <span className="block text-[14.5px] font-extrabold truncate">{c.loading ? <Loader2 className="w-4 h-4 animate-spin inline text-emerald-500" /> : `${c.name}${c.error ? '' : ' 프로'}`}</span>
                            </span>
                            <button onClick={() => remove(c.id)} aria-label={`${c.name} 비교에서 제외`} className="ml-auto shrink-0 w-7 h-7 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 inline-flex items-center justify-center"><X className="w-4 h-4" /></button>
                          </div>
                        </th>
                      ))}
                      {!full && (
                        <th className="px-3 py-3 text-left align-top">
                          <span className="inline-flex items-center gap-1.5 h-11 px-3 rounded-xl border border-dashed border-slate-300 text-[12.5px] font-bold text-slate-500"><Plus className="w-4 h-4" /> 선수 추가</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.k} className="border-t border-slate-100">
                        <th className="px-4 py-3 text-left text-[12.5px] font-bold text-slate-500 align-top" title={r.note}>{r.k}</th>
                        {selected.map((c) => {
                          const v = c.loading ? null : r.v(c);
                          return (
                            <td key={c.id} className="px-3 py-3 font-bold text-slate-800 align-top break-keep">
                              {c.loading ? <span className="text-slate-300">…</span> : v ?? <span className="text-slate-500 font-semibold">{r.empty || '집계 중'}</span>}
                            </td>
                          );
                        })}
                        {!full && <td />}
                      </tr>
                    ))}
                    <tr className="border-t border-slate-100 bg-slate-50/60">
                      <th className="px-4 py-3 text-left text-[12.5px] font-bold text-slate-500">바로가기</th>
                      {selected.map((c) => (
                        <td key={c.id} className="px-3 py-3 align-top">
                          <div className="flex flex-col gap-1.5">
                            <Link to={`/athletes/${c.id}`} className="h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-[12.5px] font-bold text-slate-700 hover:border-slate-400">전체 프로필</Link>
                            <Link to={`/sponsor/direct/build/${c.id}`} className="h-9 inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 text-white text-[12.5px] font-bold hover:bg-emerald-700">이 선수 PICK <ArrowRight className="w-3.5 h-3.5" /></Link>
                          </div>
                        </td>
                      ))}
                      {!full && <td />}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {selected.length > 0 && (
              <p className="px-4 py-2.5 border-t border-slate-100 text-[12px] text-slate-500 break-keep">{FAN_TEMP_NOTE}</p>
            )}
          </section>

          {/* 검색 · 추가 */}
          <aside className="rounded-2xl border border-slate-200 p-4 lg:sticky lg:top-20">
            <p className="text-[14px] font-extrabold">선수 추가 <span className="text-[12.5px] font-bold text-slate-500">{ids.length}/{MAX}</span></p>
            <label className="mt-3 flex items-center gap-2 h-11 px-3.5 rounded-xl border border-slate-200 focus-within:border-emerald-400">
              <Search className="w-4 h-4 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="선수 이름 검색" className="flex-1 min-w-0 text-[13.5px] outline-none bg-transparent" />
              {searching && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
            </label>
            <ul className="mt-3 space-y-1.5 max-h-[420px] overflow-y-auto">
              {results.length === 0 && !searching && <li className="py-6 text-center text-[12.5px] text-slate-500">검색 결과가 없습니다</li>}
              {results.map((a: any) => {
                const on = ids.includes(a.id);
                return (
                  <li key={a.id} className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-2.5 py-2">
                    <span className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                      {a.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold truncate">{a.name} 프로</span>
                      <span className="block text-[11.5px] text-slate-500 truncate">{[a.tour, a.region?.split(' ')[0]].filter(Boolean).join(' · ')}</span>
                    </span>
                    <button
                      onClick={() => (on ? remove(a.id) : add(a.id))}
                      disabled={!on && full}
                      className={`shrink-0 h-8 px-2.5 rounded-lg text-[12px] font-bold ${on ? 'bg-slate-900 text-white' : 'border border-emerald-600 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed'}`}
                    >
                      {on ? '제외' : full ? '가득 참' : '추가'}
                    </button>
                  </li>
                );
              })}
            </ul>
            <Link to="/athletes/find" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold text-slate-600 hover:text-emerald-700">
              목록에서 더 찾기 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
