/**
 * 직접 PICK 1·2단계 — 선수 탐색 + 선수정보 레이어 (시안 2026-09-14 Desktop·Mobile)
 *
 *  - 히어로: "직접 PICK, 원하는 선수를 직접 선택하세요." + 9단계 스텝
 *  - 좌: 검색·종목 칩·빠르게 시작하기·카드 그리드·페이지네이션 / 우: 선수탐색 안내 카드
 *  - 카드 신호: 사진·추천 배지·관심·이름·투어·지역·팬온도·TOP10 → 선수정보 / 후원슬롯보기 / 비교하기
 *  - 하단 고정 비교 바(최대 3명)
 *  - 미수집 값은 "집계 중"·"확인 필요" (LEG-06). 종목은 현재 골프만 운영한다.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, Coins, Flame, Heart,
  Info, Loader2, MapPin, Megaphone, Scale, Search, SlidersHorizontal, Star, Trophy, UserPlus, X, ZoomIn,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import DirectStepBar from '../../components/direct/DirectStepBar';
import { api } from '../../services/api';
import { FAN_TEMP_NOTE } from '../../components/fanhub/FanKit';
import { EmptyState, ErrorState, LoadingState, useSlowLoading } from '../../components/ui/StateView';

const SORTS = [
  { key: 'RECENT', label: '추천순' },
  { key: 'FAN_TEMP', label: '팬온도순' },
  { key: 'PERFORMANCE', label: '최근 성적순' },
  { key: 'PRICE', label: '가격 낮은순' },
  { key: 'NEW', label: '신규순' },
];

/** 종목 — 지금은 골프만 운영한다. 나머지는 준비 중으로 보여준다 (가짜 결과 금지) */
const SPORTS = ['전체', '골프', '야구', '축구', '농구', '배구', 'e스포츠', '육상', '테니스'];
const LIVE_SPORTS = new Set(['전체', '골프']);

/** 빠르게 시작하기 — 조건 프리셋 */
const QUICK = [
  { key: 'RECOMMENDED', label: '추천 선수', icon: Star },
  { key: 'RECENT', label: '최근 본 선수', icon: Clock },
  { key: 'REGION', label: '지역 기반', icon: MapPin },
  { key: 'BUDGET', label: '예산별', icon: Coins },
  { key: 'OPEN', label: '모집중', icon: Megaphone },
] as const;
type QuickKey = typeof QUICK[number]['key'];

const RECENT_KEY = 'sponpik.direct.recentAthletes';
const PAGE = 8;

const AVAILABILITY: Record<string, string> = { OPEN: '모집중', PARTIAL: '일부 가능', CLOSED: '모집 마감' };

function readRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function pushRecent(id: string) {
  const next = [id, ...readRecent().filter((x) => x !== id)].slice(0, 12);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* 무시 */ }
}

export default function DirectAthletes() {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<any>(null);
  const slow = useSlowLoading(loading);
  const [q, setQ] = useState('');
  const [sport, setSport] = useState('전체');
  const [quick, setQuick] = useState<QuickKey | null>(null);
  const [sort, setSort] = useState('RECENT');
  const [page, setPage] = useState(1);
  const [compare, setCompare] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [barOpen, setBarOpen] = useState(true);
  const [favs, setFavs] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr(null);
    try {
      const params: any = { q: q.trim() || undefined, sort, limit: 60 };
      if (quick === 'REGION') params.region = '서울';
      if (quick === 'BUDGET') params.maxMonthly = 500_000;
      if (quick === 'OPEN') params.mode = 'OFFLINE';
      const r: any = await api.getPickAthletes(params);
      let list: any[] = r?.data?.athletes || [];
      if (quick === 'RECOMMENDED') list = list.filter((a) => a.isRecommended);
      if (quick === 'RECENT') {
        const recent = readRecent();
        list = list.filter((a) => recent.includes(a.id)).sort((a, b) => recent.indexOf(a.id) - recent.indexOf(b.id));
      }
      if (quick === 'OPEN') list = list.filter((a) => a.availability === 'OPEN');
      setAthletes(list);
      setPage(1);
    } catch (e) {
      setLoadErr(e);
      setAthletes([]);
    } finally { setLoading(false); }
  }, [q, sort, quick]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const pages = Math.max(1, Math.ceil(athletes.length / PAGE));
  const pageItems = useMemo(() => athletes.slice((page - 1) * PAGE, page * PAGE), [athletes, page]);

  const toggleCompare = (a: any) => {
    setCompare((prev) => prev.some((x) => x.id === a.id)
      ? prev.filter((x) => x.id !== a.id)
      : prev.length >= 3 ? prev : [...prev, a]);
  };
  const toggleFav = async (a: any) => {
    const on = favs.has(a.id);
    setFavs((s) => { const n = new Set(s); on ? n.delete(a.id) : n.add(a.id); return n; });
    try { on ? await api.removeFavoriteAthlete(a.id) : await api.addFavoriteAthlete(a.id); }
    catch (e: any) {
      setFavs((s) => { const n = new Set(s); on ? n.add(a.id) : n.delete(a.id); return n; });
      if (e?.response?.status === 401) navigate(`/login?returnUrl=${encodeURIComponent('/sponsor/direct/athletes')}`);
    }
  };
  const openProfile = (id: string) => { pushRecent(id); setOpenId(id); };

  return (
    <div className="min-h-screen bg-[#f4fbf7] text-slate-900 pb-36">
      <PublicHeader />

      {/* ── 히어로 ── */}
      <div className="max-w-[1180px] mx-auto px-5 pt-5">
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[13px]">
          <Link to="/" className="text-slate-500 hover:text-slate-700">홈</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link to="/sponsor" className="text-slate-500 hover:text-slate-700">후원하기</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-emerald-700">직접 PICK</span>
        </nav>

        <div className="mt-4 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] sm:text-[34px] font-extrabold tracking-[-0.03em] leading-tight break-keep">
              <span className="text-emerald-600">직접 PICK</span>, 원하는 선수를 <span className="text-emerald-600">직접</span> 선택하세요.
            </h1>
            <p className="mt-2 text-[14.5px] text-slate-600 break-keep">원하는 선수를 직접 선택하고, 우리 브랜드에 맞는 후원 구성을 시작해보세요.</p>
          </div>
          <div className="hidden lg:flex items-center gap-5 shrink-0">
            <p aria-hidden className="font-script text-[24px] leading-[1.1] text-emerald-500/80 -rotate-6 select-none">Sports<br />Connects<br />More Possibilities</p>
            <p className="pl-5 border-l border-slate-200 text-[13px] text-slate-600 leading-relaxed">좋아하는 선수를 통해<br />더 큰 가치를 만들어보세요.</p>
          </div>
        </div>

        <div className="mt-5">
          <DirectStepBar current={1} bare />
        </div>
      </div>

      {/* ── 본문 ── */}
      <div className="max-w-[1180px] mx-auto px-5 mt-6 grid lg:grid-cols-[minmax(0,1fr)_280px] gap-5 items-start">
        <section>
          <h2 className="text-[19px] font-extrabold tracking-[-0.02em]">선수를 검색하고 선택하세요</h2>
          <p className="mt-1 text-[13.5px] text-slate-500">다양한 종목과 소속, 키워드, 조건 키워드로 가장 잘 맞는 선수를 찾아보세요.</p>

          {/* 검색 */}
          <div className="mt-4 flex gap-2">
            <label className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="선수명, 종목, 키워드로 검색해보세요."
                className="w-full h-12 pl-11 pr-4 rounded-2xl border border-slate-200 bg-white text-[14px] placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
              />
            </label>
            <label className="shrink-0">
              <span className="sr-only">정렬</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-12 px-4 rounded-2xl border border-slate-200 bg-white text-[13.5px] font-bold text-slate-700 focus:outline-none focus:border-emerald-400">
                {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </label>
          </div>

          {/* 종목 칩 */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SPORTS.map((sp) => {
              const live = LIVE_SPORTS.has(sp);
              const on = sport === sp;
              return (
                <button
                  key={sp}
                  onClick={() => live && setSport(sp)}
                  disabled={!live}
                  title={live ? undefined : '준비 중인 종목입니다'}
                  className={`h-9 px-4 rounded-full text-[13px] font-bold whitespace-nowrap border transition-colors ${
                    on ? 'bg-emerald-600 border-emerald-600 text-white' : live ? 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300' : 'bg-white border-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  {sp}
                </button>
              );
            })}
            <button disabled className="h-9 px-3.5 rounded-full text-[13px] font-bold border border-slate-100 bg-white text-slate-300 inline-flex items-center gap-1 cursor-not-allowed" title="준비 중">
              기타 <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 빠르게 시작하기 */}
          <div className="mt-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="shrink-0">
              <p className="text-[14px] font-extrabold text-slate-900">빠르게 시작하기</p>
              <p className="text-[12.5px] text-slate-500">조건에 맞는 선수를 더 빠르게 만나보세요.</p>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:ml-auto">
              {QUICK.map((k) => {
                const I = k.icon;
                const on = quick === k.key;
                return (
                  <button
                    key={k.key}
                    onClick={() => setQuick(on ? null : k.key)}
                    aria-pressed={on}
                    className={`h-9 px-3.5 rounded-full text-[12.5px] font-bold inline-flex items-center gap-1.5 border transition-colors ${
                      on ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-emerald-100 text-slate-700 hover:border-emerald-300'
                    }`}
                  >
                    <I className={`w-3.5 h-3.5 ${on ? 'text-white' : 'text-emerald-600'}`} /> {k.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 카운트 · 정렬 */}
          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-[15px] font-extrabold">
              전체 선수 <span className="text-emerald-600 tabular-nums">{loading ? '—' : athletes.length}</span>
              <span className="ml-2 text-[12.5px] font-normal text-slate-500">다양한 분야의 선수들이 여러분을 기다리고 있어요.</span>
            </p>
            <button className="lg:hidden h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-[12.5px] font-bold text-slate-700">
              <SlidersHorizontal className="w-3.5 h-3.5" /> 필터
            </button>
          </div>

          {/* 카드 */}
          {loading ? (
            <LoadingState label="선수 목록을 불러오는 중…" slow={slow} onRetry={load} />
          ) : loadErr ? (
            <div className="mt-4"><ErrorState error={loadErr} onRetry={load} /></div>
          ) : athletes.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="조건에 맞는 선수가 없습니다" desc="검색어·조건을 넓히거나, 목표와 예산으로 추천을 받아보세요.">
                <button onClick={() => { setQ(''); setQuick(null); setSport('전체'); }} className="h-10 px-4 inline-flex items-center rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700">조건 초기화</button>
                <Link to="/sponsor/recommended" className="h-10 px-4 inline-flex items-center rounded-xl bg-emerald-600 text-white text-[13px] font-bold">추천 PICK 받기</Link>
              </EmptyState>
            </div>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {pageItems.map((a) => (
                  <AthleteCard
                    key={a.id}
                    a={a}
                    fav={favs.has(a.id)}
                    comparing={compare.some((x) => x.id === a.id)}
                    compareFull={compare.length >= 3}
                    onInfo={() => openProfile(a.id)}
                    onFav={() => toggleFav(a)}
                    onCompare={() => toggleCompare(a)}
                  />
                ))}
              </div>

              {/* 페이지네이션 */}
              {pages > 1 && (
                <nav className="mt-5 flex items-center justify-center gap-1.5" aria-label="페이지">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-9 h-9 rounded-full inline-flex items-center justify-center text-slate-500 disabled:opacity-30 hover:bg-white"><ChevronLeft className="w-4 h-4" /></button>
                  {Array.from({ length: pages }).map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)} aria-current={page === i + 1 ? 'page' : undefined}
                      className={`w-9 h-9 rounded-full text-[13px] font-bold ${page === i + 1 ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-white'}`}>{i + 1}</button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="w-9 h-9 rounded-full inline-flex items-center justify-center text-slate-500 disabled:opacity-30 hover:bg-white"><ChevronRight className="w-4 h-4" /></button>
                </nav>
              )}
            </>
          )}
        </section>

        {/* 우: 단계 안내 */}
        <aside className="rounded-3xl bg-emerald-50/70 border border-emerald-100 p-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-full bg-white inline-flex items-center justify-center text-emerald-600 shadow-sm"><ZoomIn className="w-5 h-5" /></span>
            <h2 className="text-[17px] font-extrabold">선수탐색</h2>
          </div>
          <p className="mt-3 text-[13.5px] text-slate-600 leading-relaxed break-keep">브랜드에 맞는 선수를 탐색하고 후원 가능성을 확인하는 단계입니다.</p>
          <ul className="mt-4 space-y-2.5">
            {[
              '다양한 조건으로 선수를 검색할 수 있습니다.',
              '선수의 주요 정보와 활동 현황을 확인할 수 있습니다.',
              '관심 선수를 등록하고, 여러 선수를 비교할 수 있습니다.',
              '선수별 후원 슬롯을 바로 살펴볼 수 있습니다.',
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 text-[13px] text-slate-700 break-keep">
                <span className="w-[18px] h-[18px] rounded-full bg-emerald-500 text-white inline-flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" /></span>
                {t}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* ── 비교 바 (최대 3명) ── */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-8px_24px_-16px_rgba(15,23,42,0.25)]">
        <div className="max-w-[1180px] mx-auto px-5 py-3 flex items-center gap-3">
          <div className="min-w-0 shrink-0">
            <p className="text-[12.5px] text-slate-500 hidden sm:block">비교할 선수를 최대 3명까지 선택하세요.</p>
            <p className="text-[16px] font-extrabold tabular-nums"><span className="text-emerald-600">{compare.length}</span> / 3</p>
          </div>
          <div className={`flex gap-2 flex-1 overflow-x-auto ${barOpen ? '' : 'hidden sm:flex'}`}>
            {[0, 1, 2].map((i) => {
              const a = compare[i];
              return a ? (
                <span key={a.id} className="h-11 pl-1.5 pr-3 inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/60 shrink-0">
                  <span className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100">{a.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}</span>
                  <span className="text-[12.5px] font-bold whitespace-nowrap">{a.name}</span>
                  <button onClick={() => toggleCompare(a)} aria-label={`${a.name} 비교 해제`} className="text-slate-400 hover:text-slate-700"><X className="w-3.5 h-3.5" /></button>
                </span>
              ) : (
                <span key={i} className="h-11 px-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-200 text-[12.5px] text-slate-400 whitespace-nowrap shrink-0">
                  <UserPlus className="w-4 h-4" /> 선수 추가
                </span>
              );
            })}
          </div>
          <button
            onClick={() => setOpenId(compare[0]?.id ?? null)}
            disabled={compare.length < 2}
            className="ml-auto shrink-0 h-11 px-5 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold disabled:bg-emerald-100 disabled:text-emerald-400"
          >
            <Scale className="w-4 h-4" /> 선수 비교
          </button>
          <button onClick={() => setBarOpen((v) => !v)} aria-label={barOpen ? '비교 바 접기' : '비교 바 펼치기'} className="shrink-0 w-9 h-9 rounded-full border border-slate-200 inline-flex items-center justify-center text-slate-500">
            {barOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
        {barOpen && compare.length >= 2 && (
          <div className="max-w-[1180px] mx-auto px-5 pb-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${compare.length}, minmax(0,1fr))` }}>
            {compare.map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-200 p-3 bg-white">
                <p className="text-[13px] font-extrabold">{a.name} 프로</p>
                <dl className="mt-1.5 space-y-1 text-[12px]">
                  <Row k="시작가" v={a.minPrice != null ? `${(a.minPrice / 10000).toLocaleString()}만원` : '확인 필요'} />
                  <Row k="가능 슬롯" v={`${a.slotOpen}/${a.slotTotal}`} />
                  <Row k="팬온도" v={a.fanTemp > 0 ? `${a.fanTemp.toFixed(1)}℃` : '집계 중'} />
                  <Row k="최근 성적" v={a.recentAvgRank != null ? `평균 ${a.recentAvgRank}위` : '확인 필요'} />
                  <Row k="TOP10" v={a.recentResults?.length ? `${a.top10Count}회` : '확인 필요'} />
                </dl>
                <Link to={`/sponsor/direct/build/${a.id}`} className="mt-2 h-9 w-full inline-flex items-center justify-center rounded-lg bg-emerald-600 text-white text-[12px] font-bold">이 선수 PICK</Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {openId && (
        <QuickProfile
          athleteId={openId}
          fav={favs.has(openId)}
          onFav={() => { const a = athletes.find((x) => x.id === openId); if (a) toggleFav(a); }}
          onClose={() => setOpenId(null)}
          onPick={(id) => navigate(`/sponsor/direct/build/${id}`)}
        />
      )}
    </div>
  );
}

/* ── 카드 ─────────────────────────────────────────────── */

function AthleteCard({ a, fav, comparing, compareFull, onInfo, onFav, onCompare }: {
  a: any; fav: boolean; comparing: boolean; compareFull: boolean; onInfo: () => void; onFav: () => void; onCompare: () => void;
}) {
  const temp = typeof a.fanTemp === 'number' && a.fanTemp > 0 ? a.fanTemp : null;
  const hasResults = (a.recentResults?.length ?? 0) > 0;
  const badge = a.isRecommended ? { label: '추천 선수', cls: 'bg-emerald-500' } : a.availability === 'OPEN' ? { label: AVAILABILITY.OPEN, cls: 'bg-amber-500' } : null;
  return (
    <article className={`rounded-2xl bg-white border overflow-hidden flex sm:flex-col transition-all ${comparing ? 'border-emerald-400 shadow-[0_12px_28px_-14px_rgba(16,185,129,0.4)]' : 'border-slate-200 hover:border-emerald-300 hover:shadow-[0_12px_28px_-16px_rgba(15,23,42,0.18)]'}`}>
      <button onClick={onInfo} className="relative w-[40%] sm:w-full aspect-[3/4] sm:aspect-[16/11] bg-slate-100 shrink-0 text-left overflow-hidden">
        {a.profileImageUrl
          ? <img src={a.profileImageUrl} alt={a.name} loading="lazy" className="w-full h-full object-cover object-top" />
          : <span className="w-full h-full flex items-center justify-center text-[36px] font-extrabold text-slate-300">{a.name?.slice(0, 1)}</span>}
        {badge && <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[11px] font-extrabold text-white ${badge.cls}`}>{badge.label}</span>}
      </button>
      <div className="p-3.5 flex-1 flex flex-col min-w-0">
        <div className="flex items-start gap-2">
          <button onClick={onInfo} className="min-w-0 flex-1 text-left">
            <p className="text-[15px] font-extrabold truncate">{a.name} <span className="text-[12px] font-bold text-slate-500">프로</span></p>
            <p className="mt-0.5 text-[12px] text-slate-500 truncate">{[a.tour, a.region?.split(' ')[0]].filter(Boolean).join(' · ') || '선수'}</p>
          </button>
          <button onClick={onFav} aria-pressed={fav} aria-label="관심 선수" className={`shrink-0 w-8 h-8 rounded-full inline-flex items-center justify-center ${fav ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'}`}>
            <Heart className={`w-[18px] h-[18px] ${fav ? 'fill-current' : ''}`} />
          </button>
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2 text-[12.5px]">
          <span className="inline-flex items-center gap-1 font-bold tabular-nums" title={FAN_TEMP_NOTE}>
            <Flame className="w-3.5 h-3.5 text-emerald-600" />
            {temp !== null ? `${temp.toFixed(1)}℃` : <span className="text-slate-500 font-semibold">집계 중</span>}
          </span>
          <span className="inline-flex items-center gap-1 font-bold text-slate-700 tabular-nums">
            <Trophy className="w-3.5 h-3.5 text-slate-400" />
            {hasResults ? `Top 10 ${a.top10Count ?? 0}회` : <span className="text-slate-500 font-semibold">성적 확인 필요</span>}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <button onClick={onInfo} className="h-8 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:border-slate-400 whitespace-nowrap">선수정보</button>
          <Link to={`/sponsor/direct/build/${a.id}`} className="h-8 rounded-lg bg-emerald-600 text-white text-[11px] font-bold inline-flex items-center justify-center hover:bg-emerald-700 whitespace-nowrap tracking-tight">후원슬롯보기</Link>
          <button onClick={onCompare} disabled={!comparing && compareFull} className={`h-8 rounded-lg border text-[11px] font-bold whitespace-nowrap ${comparing ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-700 hover:border-slate-400 disabled:opacity-40'}`}>
            {comparing ? '비교 중' : '비교하기'}
          </button>
        </div>
      </div>
    </article>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500 shrink-0">{k}</dt>
      <dd className={`font-bold text-right ${v === '확인 필요' || v === '집계 중' ? 'text-slate-500' : ''}`}>{v}</dd>
    </div>
  );
}

/* ── 2단계: 선수정보 레이어 (시안) ─────────────────────── */

const TABS = ['요약', '대회 성과', '활동', '후원 가능 슬롯', '브랜드 협업 이력'] as const;

const ACTIVITY_LABELS: Record<string, string> = {
  tour1: '대회 출전', tour2: '2부 투어', gtour: 'G투어', lesson: '레슨',
  proAm: '프로암', sns: 'SNS 콘텐츠', youtube: '유튜브', etc: '기타',
};

function QuickProfile({ athleteId, fav, onFav, onClose, onPick }: {
  athleteId: string; fav: boolean; onFav: () => void; onClose: () => void; onPick: (id: string) => void;
}) {
  const [data, setData] = useState<any>(null);
  const [roi, setRoi] = useState<any>(null);
  const [err, setErr] = useState<any>(null);
  const [tab, setTab] = useState<string>(TABS[0]);

  useEffect(() => {
    setData(null); setRoi(null); setErr(null); setTab(TABS[0]);
    api.getQuickProfile(athleteId).then((r: any) => setData(r?.data || null)).catch((e) => setErr(e));
    api.getPublicAthleteRoiDashboard(athleteId).then((r: any) => setRoi(r?.data || null)).catch(() => setRoi(null));
  }, [athleteId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const a = data?.athlete;
  const activities: string[] = useMemo(() => (a?.activityFields
    ? Object.entries(a.activityFields).filter(([, v]) => v).map(([k]) => ACTIVITY_LABELS[k] || k)
    : []), [a]);

  const temp = data?.fanTemp > 0 ? Number(data.fanTemp) : null;
  const index: number | null = roi?.summary?.basicScore ?? roi?.summary?.score ?? null;
  const axes = [
    { label: '경기력', value: roi?.athletePerformance?.score ?? null },
    { label: '팬반응', value: roi?.fandom?.score ?? null },
    { label: '콘텐츠성', value: roi?.contentEngagement?.score ?? null },
    { label: '브랜드 적합도', value: roi?.mediaExposure?.score ?? null },
    { label: '활동성', value: roi?.activity?.score ?? (activities.length ? Math.min(100, activities.length * 20) : null) },
  ];

  const profileLine = a ? [
    a.debutYear ? `${a.debutYear}년 프로입회` : null,
    a.tourQualification || null,
    a.affiliation ? `${a.affiliation} 소속` : null,
    a.region ? `활동지역 ${a.region}` : null,
  ].filter(Boolean).join(' · ') : '';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/45 p-0 sm:p-6" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label="선수정보"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-[760px] max-h-[94vh] sm:max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6"
      >
        {err ? (
          <ErrorState error={err} title="선수 정보를 불러오지 못했습니다" onRetry={() => { setErr(null); api.getQuickProfile(athleteId).then((r: any) => setData(r?.data || null)).catch((e) => setErr(e)); }} />
        ) : !data ? (
          <div className="py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
        ) : (
          <>
            {/* 상단: 사진 · 이름 · 칩 · 3지표 */}
            <div className="grid sm:grid-cols-[200px_minmax(0,1fr)] gap-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-[4/4.4] sm:aspect-auto sm:h-[220px]">
                {a.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                {a.isRecommended && <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[11px] font-extrabold">추천 선수</span>}
              </div>
              <div className="min-w-0">
                <div className="flex items-start gap-2">
                  <p className="text-[24px] sm:text-[28px] font-extrabold leading-tight">{a.name} <span className="text-[15px] font-bold text-emerald-600">프로</span></p>
                  <button onClick={onFav} aria-pressed={fav} aria-label="관심 선수" className={`mt-1 w-9 h-9 rounded-full inline-flex items-center justify-center ${fav ? 'text-rose-500' : 'text-emerald-500 hover:text-rose-400'}`}>
                    <Heart className={`w-5 h-5 ${fav ? 'fill-current' : ''}`} />
                  </button>
                  <button onClick={onClose} aria-label="닫기" className="ml-auto shrink-0 w-9 h-9 rounded-full inline-flex items-center justify-center text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[a.tour, a.tourQualification, a.region?.split(' ')[0]].filter(Boolean).map((t: string) => (
                    <span key={t} className="px-2.5 py-1 rounded-full border border-slate-200 bg-white text-[12px] font-bold text-slate-700">{t}</span>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Stat icon={<Flame className="w-4 h-4 text-emerald-600" />} label="팬온도" value={temp !== null ? `${temp.toFixed(1)}℃` : null} pct={temp !== null ? Math.min(100, temp) : null} note={FAN_TEMP_NOTE} />
                  <Stat icon={<Trophy className="w-4 h-4 text-emerald-600" />} label="스폰픽 인덱스" value={index != null ? String(Math.round(index)) : null} pct={index != null ? Math.min(100, index) : null} />
                  <Stat icon={<Trophy className="w-4 h-4 text-emerald-600" />} label="최근 5경기 평균 순위" value={data.recentAvgRank != null ? `평균 ${data.recentAvgRank}위` : null} pct={data.recentAvgRank != null ? Math.max(8, 100 - data.recentAvgRank * 2) : null} />
                </div>
              </div>
            </div>

            {/* 탭 */}
            <div className="mt-5 flex gap-1 border-b border-slate-100 overflow-x-auto">
              {TABS.map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`px-3.5 py-2.5 text-[13.5px] font-bold border-b-2 whitespace-nowrap transition-colors ${tab === t ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t}</button>
              ))}
            </div>

            <div className="mt-4 min-h-[220px]">
              {tab === '요약' && (
                <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-3">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-[14px] font-extrabold inline-flex items-center gap-1.5">스폰픽 인덱스 요약 <Info className="w-3.5 h-3.5 text-slate-400" aria-label="경기력·팬반응·콘텐츠성·브랜드 적합도·활동성 5축. 측정된 축만 표시합니다." /></p>
                    <Radar axes={axes} />
                    {axes.every((x) => x.value == null) && <p className="text-center text-[12.5px] text-slate-500">지수 집계 중</p>}
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-[14px] font-extrabold">프로필 요약</p>
                    <p className="mt-2 text-[13px] text-slate-600 leading-relaxed break-keep">{profileLine || a.bio || '등록된 소개가 없습니다.'}</p>
                    <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Field k="신장" v={a.height ? `${a.height}cm` : null} />
                      <Field k="프로입회" v={a.debutYear ? String(a.debutYear) : null} />
                      <Field k="활동지역" v={a.region?.split(' ')[0] || null} />
                      <Field k="소속" v={a.affiliation || null} />
                    </dl>
                    {(a.highlights as string[] | null)?.length ? (
                      <ul className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                        {(a.highlights as string[]).slice(0, 4).map((h) => (
                          <li key={h} className="flex items-start gap-2 text-[12.5px] text-slate-700 break-keep">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" /> {h}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              )}

              {tab === '대회 성과' && (
                data.allResults?.length ? (
                  <table className="w-full text-[13px]">
                    <thead><tr className="text-slate-500 text-left border-b border-slate-100"><th className="py-2 font-bold">대회명</th><th className="py-2 font-bold w-24">일자</th><th className="py-2 font-bold w-16 text-right">순위</th></tr></thead>
                    <tbody>
                      {data.allResults.map((r: any, i: number) => (
                        <tr key={i} className="border-b border-slate-50">
                          <td className="py-2 truncate">{r.eventName}</td>
                          <td className="py-2 text-slate-500">{new Date(r.eventDate).toLocaleDateString('ko-KR')}</td>
                          <td className="py-2 text-right font-extrabold">{r.rank != null ? `${r.rank}위` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <Empty text="등록된 대회 성과가 아직 없습니다" />
              )}

              {tab === '활동' && (
                activities.length ? (
                  <div className="flex flex-wrap gap-2">
                    {activities.map((t) => <span key={t} className="px-3.5 py-2 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-700">{t}</span>)}
                  </div>
                ) : <Empty text="등록된 활동 정보가 아직 없습니다" />
              )}

              {tab === '후원 가능 슬롯' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[13px] font-extrabold mb-2">착장 슬롯 {data.slotOpen}/{data.slotTotal}</p>
                    {data.availableSlots?.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {data.availableSlots.map((s: any) => (
                          <span key={s.code} className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[12.5px] font-bold">{s.name} {(s.price / 10000).toLocaleString()}만원</span>
                        ))}
                      </div>
                    ) : <Empty text="현재 선택 가능한 착장 슬롯이 없습니다" />}
                  </div>
                  {data.offers?.length > 0 && (
                    <div>
                      <p className="text-[13px] font-extrabold mb-2">온라인 상품</p>
                      <div className="flex flex-wrap gap-1.5">
                        {data.offers.map((o: any) => <span key={o.code} className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-[12.5px] font-bold">{o.name} {(o.price / 10000).toLocaleString()}만원/월</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === '브랜드 협업 이력' && (
                <div className="space-y-3">
                  {data.primarySponsors ? (
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(data.primarySponsors) ? data.primarySponsors : Object.values(data.primarySponsors)).map((b: any, i: number) => (
                        <span key={i} className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-[12.5px] font-bold">{typeof b === 'string' ? b : b?.name || '—'}</span>
                      ))}
                    </div>
                  ) : <Empty text="등록된 협업 브랜드 정보가 없습니다" />}
                  {data.blockedCategories?.length > 0 && (
                    <p className="flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-3 text-[12.5px] text-rose-700 break-keep">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" /> 후원 불가 업종: {data.blockedCategories.join(' · ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-2 pt-4 border-t border-slate-100">
              <Link to={`/athletes/${a.id}`} className="h-12 inline-flex items-center justify-center rounded-xl border-2 border-emerald-600 text-[14px] font-bold text-emerald-700 hover:bg-emerald-50">전체 프로필 보기</Link>
              <button onClick={() => onPick(a.id)} className="h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700">이 선수 PICK <ArrowRight className="w-4 h-4" /></button>
            </div>
            <p className="mt-2 text-right text-[11.5px] text-slate-500">{data.verifiedAt ? `${new Date(data.verifiedAt).toLocaleDateString('ko-KR')} 기준` : ''}</p>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, pct, note }: { icon: React.ReactNode; label: string; value: string | null; pct: number | null; note?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3" title={note}>
      <p className="text-[12px] text-slate-500 truncate">{label}</p>
      <p className="mt-1 inline-flex items-center gap-1.5 text-[18px] font-extrabold text-emerald-700 tabular-nums">
        {icon} {value ?? <span className="text-[13px] font-bold text-slate-500">집계 중</span>}
      </p>
      <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        {pct != null && <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />}
      </div>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string | null }) {
  return (
    <div>
      <dt className="text-[11.5px] text-slate-500">{k}</dt>
      <dd className="mt-0.5 text-[13px] font-bold break-keep">{v ?? <span className="text-slate-500 font-semibold">—</span>}</dd>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="py-8 text-center text-[13px] text-slate-500 break-keep">
      {text}
      <span className="block mt-1 text-[12px]">확인되지 않은 정보는 표시하지 않습니다.</span>
    </p>
  );
}

/** 5축 레이더 — 측정된 축만 그리고, 없으면 축 이름만 둔다 */
function Radar({ axes }: { axes: { label: string; value: number | null }[] }) {
  const size = 220, c = size / 2, r = 78;
  const pt = (i: number, rr: number) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length;
    return [c + rr * Math.cos(ang), c + rr * Math.sin(ang)];
  };
  const ring = (rr: number) => axes.map((_, i) => pt(i, rr).join(',')).join(' ');
  const measured = axes.some((x) => x.value != null);
  const poly = axes.map((x, i) => pt(i, ((x.value ?? 0) / 100) * r).join(',')).join(' ');
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[240px] mx-auto mt-1" role="img" aria-label="스폰픽 인덱스 5축">
      {[0.25, 0.5, 0.75, 1].map((k) => <polygon key={k} points={ring(r * k)} fill="none" stroke="#e2e8f0" strokeWidth="1" />)}
      {axes.map((_, i) => { const [x, y] = pt(i, r); return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />; })}
      {measured && <polygon points={poly} fill="rgba(16,185,129,0.25)" stroke="#10b981" strokeWidth="2" />}
      {measured && axes.map((x, i) => { if (x.value == null) return null; const [px, py] = pt(i, (x.value / 100) * r); return <circle key={i} cx={px} cy={py} r="3.5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />; })}
      {axes.map((x, i) => { const [lx, ly] = pt(i, r + 22); return <text key={x.label} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill="#334155">{x.label}</text>; })}
    </svg>
  );
}
