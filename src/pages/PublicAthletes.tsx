/**
 * 선수 목록 — 전체사이트개편 v2.0 §7.1
 *
 *  - 한 목록, 한 정렬. 추천·신규·전체를 세 번 나열하던 구조를 없앤다.
 *  - 카드에는 판단에 필요한 신호만 둔다: 사진·이름·투어·지역·팬온도·최근 성적·후원 현황·시작가.
 *  - 미수집 지표는 0으로 만들지 않고 "확인 필요"로 둔다 (LEG-06).
 *  - 이모지·장식 배지 대신 텍스트 배지만 쓴다.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Thermometer, Loader2, RotateCcw, Sparkles, ArrowRight } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import { api } from '../services/api';
import { FAN_TEMP_NOTE } from '../components/fanhub/FanKit';

const SORTS = [
  { key: 'RECENT', label: '추천순' },
  { key: 'FAN_TEMP', label: '팬온도순' },
  { key: 'PERFORMANCE', label: '최근 성적순' },
  { key: 'NEW', label: '신규순' },
  { key: 'PRICE', label: '가격 낮은순' },
];

const CHIPS = [
  { key: 'ALL', label: '전체', patch: {} },
  { key: 'KLPGA', label: 'KLPGA', patch: { tour: 'KLPGA' } },
  { key: 'KPGA', label: 'KPGA', patch: { tour: 'KPGA' } },
  { key: 'SEOUL', label: '서울·경기', patch: { region: '서울' } },
  { key: 'OPEN', label: '모집 중', patch: { mode: 'OFFLINE' } },
  { key: 'ONLINE', label: '온라인 가능', patch: { mode: 'ONLINE' } },
];

const AVAILABILITY: Record<string, { label: string; cls: string }> = {
  OPEN: { label: '후원 가능', cls: 'bg-emerald-600 text-white' },
  PARTIAL: { label: '일부 가능', cls: 'bg-amber-500 text-white' },
  CLOSED: { label: '모집 마감', cls: 'bg-slate-500 text-white' },
};

export default function PublicAthletes() {
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') || '');
  const [chip, setChip] = useState(sp.get('recommended') ? 'ALL' : 'ALL');
  const [sort, setSort] = useState('RECENT');
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const patch = CHIPS.find((c) => c.key === chip)?.patch || {};
      const r: any = await api.getPickAthletes({ q: q.trim() || undefined, sort, limit: 60, ...patch });
      setAthletes(r?.data?.athletes || []);
    } catch {
      setAthletes([]);
    } finally {
      setLoading(false);
    }
  }, [q, chip, sort]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  /* 검색어를 주소에 남겨 새로고침·공유 시 유지 */
  useEffect(() => {
    const next = new URLSearchParams(sp);
    if (q) next.set('q', q); else next.delete('q');
    setSp(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const reset = () => { setQ(''); setChip('ALL'); setSort('RECENT'); };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader />

      <div className="max-w-[1280px] mx-auto px-5">
        {/* breadcrumb */}
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 pt-5 text-[12.5px]">
          <Link to="/" className="text-slate-500 hover:text-slate-600">홈</Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-emerald-700">선수</span>
        </nav>

        {/* 헤더 */}
        <header className="pt-7 sm:pt-9 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <h1 className="text-[28px] sm:text-[36px] font-extrabold tracking-[-0.03em] leading-tight">
              후원할 선수를 찾아보세요
            </h1>
            <p className="mt-2.5 text-[14px] text-slate-500 break-keep">
              스폰픽에 등록된 선수입니다. 마음에 드는 선수를 고르면 직접 PICK으로 바로 이어집니다.
            </p>
          </div>
          <Link to="/sponsor/recommended"
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-2xl border border-slate-200 text-[13.5px] font-bold text-slate-700 hover:border-slate-400 transition shrink-0">
            <Sparkles className="w-4 h-4 text-orange-500" /> 고르기 어렵다면 추천 PICK
          </Link>
        </header>

        {/* 검색 · 필터 · 정렬 — 한 줄 */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <label className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="선수명, 투어, 지역으로 검색"
                className="w-full h-11 pl-11 pr-4 rounded-2xl border border-slate-200 text-[14px] placeholder:text-slate-300 focus:outline-none focus:border-emerald-400" />
            </label>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="h-11 px-3.5 rounded-2xl border border-slate-200 text-[13px] font-bold text-slate-700 focus:outline-none focus:border-emerald-400">
              {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <button key={c.key} onClick={() => setChip(c.key)}
                className={`h-9 px-3.5 rounded-full text-[12.5px] font-bold border transition ${
                  chip === c.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 text-[13px] text-slate-500">
          <b className="text-slate-900 tabular-nums">{loading ? '—' : athletes.length}</b>명
          <span className="ml-2 text-slate-500">선택한 정렬 기준으로 나열됩니다</span>
        </p>

        {/* 목록 */}
        {loading ? (
          <div className="py-24 text-center"><Loader2 className="w-7 h-7 text-emerald-500 animate-spin mx-auto" /></div>
        ) : athletes.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 py-16 text-center">
            <p className="text-[15px] font-bold text-slate-700">조건에 맞는 선수가 없습니다</p>
            <p className="mt-1.5 text-[13px] text-slate-500">필터를 넓히거나 추천 PICK으로 조건에 맞는 선수를 받아보세요.</p>
            <div className="mt-5 flex gap-2 justify-center">
              <button onClick={reset}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-2xl border border-slate-200 text-[13px] font-bold text-slate-600">
                <RotateCcw className="w-3.5 h-3.5" /> 필터 초기화
              </button>
              <Link to="/sponsor/recommended"
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-2xl bg-slate-900 text-white text-[13px] font-bold">
                추천 PICK 받기 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 mb-16 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {athletes.map((a) => {
              const av = AVAILABILITY[a.availability] || AVAILABILITY.OPEN;
              const temp = typeof a.fanTemp === 'number' && a.fanTemp > 0 ? a.fanTemp : null;
              return (
                <article key={a.id}
                  className="rounded-3xl border border-slate-200 bg-white overflow-hidden hover:border-emerald-300 hover:shadow-[0_12px_32px_-14px_rgba(15,23,42,0.16)] transition-all flex flex-col">
                  <Link to={`/athletes/${a.id}`} className="relative aspect-[4/5] sm:aspect-[4/3] bg-slate-100 block overflow-hidden shrink-0">
                    {a.profileImageUrl
                      ? <img src={a.profileImageUrl} alt={a.name} loading="lazy" className="w-full h-full object-cover object-top" />
                      : <span className="w-full h-full flex items-center justify-center text-[40px] font-extrabold text-slate-300">{a.name?.slice(0, 1)}</span>}
                    <span className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-[12.5px] font-extrabold ${av.cls}`}>{av.label}</span>
                    {a.isRecommended && (
                      <span className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-white/90 text-emerald-700 text-[12.5px] font-extrabold">추천</span>
                    )}
                  </Link>

                  <div className="p-4 flex-1 flex flex-col">
                    <Link to={`/athletes/${a.id}`} className="min-w-0">
                      <p className="text-[15px] font-extrabold text-slate-900 truncate">
                        {a.name} <span className="text-[12.5px] font-bold text-slate-500">프로</span>
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-slate-500 truncate">
                        {[a.tour, a.region].filter(Boolean).join(' · ') || '선수'}
                      </p>
                    </Link>

                    <dl className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]">
                      <div>
                        <dt className="text-slate-500" title={FAN_TEMP_NOTE}>팬온도</dt>
                        <dd className="mt-0.5 font-extrabold text-[13px] inline-flex items-center gap-1 tabular-nums">
                          <Thermometer className="w-3.5 h-3.5 text-emerald-600" />
                          {temp !== null ? `${temp.toFixed(1)}℃` : <span className="text-slate-500 font-bold">집계 중</span>}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">최근 성적</dt>
                        <dd className="mt-0.5 font-extrabold text-[13px] tabular-nums">
                          {a.recentAvgRank != null ? `평균 ${a.recentAvgRank}위` : <span className="text-slate-500 font-bold">확인 필요</span>}
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-slate-500">후원 현황</dt>
                        <dd className="mt-0.5 font-extrabold text-[13px] tabular-nums">
                          슬롯 {a.slotOpen ?? 0}/{a.slotTotal ?? 0}
                          {a.offerCount > 0 && <span className="ml-1.5 font-bold text-slate-500">온라인 {a.offerCount}종</span>}
                        </dd>
                      </div>
                    </dl>

                    <p className="mt-3 text-right text-[12.5px] text-slate-500">
                      시작가 <b className="text-[15px] text-emerald-600 tabular-nums">
                        {a.minPrice != null ? `${(a.minPrice / 10000).toLocaleString()}만원` : '협의'}
                      </b>부터
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Link to={`/athletes/${a.id}`}
                        className="h-10 rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-600 flex items-center justify-center hover:border-slate-400 transition">
                        프로필
                      </Link>
                      <Link to={`/sponsor/direct/build/${a.id}`}
                        className="h-10 rounded-xl bg-emerald-600 text-white text-[12.5px] font-bold flex items-center justify-center hover:bg-emerald-700 transition">
                        이 선수 PICK
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
