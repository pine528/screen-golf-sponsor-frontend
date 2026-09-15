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
  Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Coins, MapPin, Megaphone, Search, SlidersHorizontal, Star, X, ZoomIn,
} from 'lucide-react';
import AthleteCard from '../../components/athlete/AthleteCard';
import QuickProfile from '../../components/athlete/QuickProfile';
import CompareBar from '../../components/athlete/CompareBar';
import { useCompare, useFavorites } from '../../components/athlete/useAthleteTools';
import PublicHeader from '../../components/PublicHeader';
import DirectStepBar from '../../components/direct/DirectStepBar';
import { api } from '../../services/api';
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
  const [openId, setOpenId] = useState<string | null>(null);
  /* 관심 선수·비교 후보는 선수 메뉴 공통 훅 — 다른 화면과 같은 상태를 본다 */
  const { favs, toggle: toggleFav, toast, undo, dismissToast } = useFavorites();
  const { compare, has: comparing, toggle: toggleCompare, remove: removeCompare, full: compareFull } = useCompare();
  /* 비교 바는 화면 아래 고정 — 바 높이만큼 본문 여백 */
  const [barH, setBarH] = useState(96);

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

  const openProfile = (id: string) => { pushRecent(id); setOpenId(id); };

  return (
    <div className="min-h-screen bg-[#f4fbf7] text-slate-900" style={{ paddingBottom: barH + 24 }}>
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
                    comparing={comparing(a.id)}
                    compareFull={compareFull}
                    onInfo={() => openProfile(a.id)}
                    onFav={() => toggleFav(a.id, a.name)}
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

      {/* ── 비교 바 (최대 3명) — 공통 CompareSelectionBar ── */}
      <CompareBar compare={compare} onRemove={removeCompare} onHeight={setBarH} mobileCompact />

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 z-40 rounded-xl bg-slate-900 text-white text-[13px] px-4 py-2.5 shadow-lg flex items-center gap-3" style={{ bottom: barH + 12 }}>
          관심 선수에서 해제했습니다.
          <button onClick={undo} className="font-bold text-emerald-300">되돌리기</button>
          <button onClick={dismissToast} aria-label="닫기" className="text-slate-400"><X className="w-4 h-4" /></button>
        </div>
      )}

      {openId && (
        <QuickProfile
          athleteId={openId}
          fav={favs.has(openId)}
          onFav={() => { const a = athletes.find((x) => x.id === openId); toggleFav(openId, a?.name); }}
          onClose={() => setOpenId(null)}
          onPick={(id) => navigate(`/sponsor/direct/build/${id}`)}
        />
      )}
    </div>
  );
}
