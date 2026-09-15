/**
 * 관심 선수 `/athletes/favorites` — ATH-04 Watchlist (선수 메뉴 핸드오프 v1.0 §7, 시안 2026-09-15)
 *
 *  로그인 전용. 상단 Summary(관심 선수 / 최근 업데이트 / 후원 가능 / 비교 중) → Watchlist 필터
 *  → 카드(업데이트 배지 + 최근 변경 1줄 + 선수정보 / 비교하기 / PICK) + 우측 안내·비교 후보 → 선수 찾기 CTA.
 *  업데이트 신호는 서버가 판정한다(임계값 서버 config). 해제는 즉시 반영 + 되돌리기.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Bell, ChevronRight, Heart, Plus, Search, Target, Trash2, X } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import AthleteCard from '../../components/athlete/AthleteCard';
import QuickProfile from '../../components/athlete/QuickProfile';
import CompareBar from '../../components/athlete/CompareBar';
import { COMPARE_MAX, useCompare, useFavorites } from '../../components/athlete/useAthleteTools';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { EmptyState, ErrorState, LoadingState, RestrictedState, useSlowLoading } from '../../components/ui/StateView';

const FILTERS = [
  { key: 'ALL', label: '전체' }, { key: 'UPDATED', label: '업데이트 있음' }, { key: 'OPEN', label: '후원 가능' },
  { key: 'FAN_UP', label: '팬온도 상승' }, { key: 'NEW_SLOT', label: '신규 슬롯' },
];
const UPDATE_BADGE: Record<string, string> = { NEW_AVAILABILITY: 'NEW_SLOT', FAN_TEMPERATURE_UP: 'FAN_UP', PERFORMANCE_UP: 'UPDATED', PROFILE_REFRESH: 'UPDATED' };
const UPDATE_ICON: Record<string, any> = { NEW_AVAILABILITY: Target, FAN_TEMPERATURE_UP: BarChart3, PERFORMANCE_UP: BarChart3, PROFILE_REFRESH: Bell };

export default function AthleteFavorites() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<any>(null);
  const slow = useSlowLoading(loading);
  const [filter, setFilter] = useState('ALL');
  const [sort, setSort] = useState<'UPDATED' | 'SAVED'>('UPDATED');

  const load = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    setLoading(true); setErr(null);
    try { const r: any = await api.getMyFavoriteAthletes(); setData(r?.data || null); }
    catch (e) { setErr(e); } finally { setLoading(false); }
  }, [isAuthenticated]);
  useEffect(() => { load(); }, [load]);

  const { favs, toggle: toggleFav, toast, undo, dismissToast } = useFavorites();
  const { compare, has: comparing, toggle: toggleCompare, remove: removeCompare, full: compareFull } = useCompare();
  const [openId, setOpenId] = useState<string | null>(null);
  const [barH, setBarH] = useState(96);

  /* 목록은 서버 기준이되, 이 화면에서 해제한 선수는 즉시 빠지고 되돌리면 다시 나온다 */
  const athletes: any[] = useMemo(() => {
    let list: any[] = (data?.athletes || []).filter((a: any) => favs.has(a.id) || !favsLoaded(favs, data));
    if (filter === 'UPDATED') list = list.filter((a) => a.updates?.length);
    if (filter === 'OPEN') list = list.filter((a) => a.sponsorAvailable);
    if (filter === 'FAN_UP') list = list.filter((a) => a.updates?.some((u: any) => u.type === 'FAN_TEMPERATURE_UP'));
    if (filter === 'NEW_SLOT') list = list.filter((a) => a.updates?.some((u: any) => u.type === 'NEW_AVAILABILITY'));
    const at = (a: any) => (a.updates?.[0] ? new Date(a.updates[0].observedAt).getTime() : 0);
    list.sort(sort === 'UPDATED' ? (a, b) => at(b) - at(a) || new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime() : (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    return list;
  }, [data, favs, filter, sort]);
  const counts = useMemo(() => {
    const all: any[] = (data?.athletes || []).filter((a: any) => favs.has(a.id) || !favsLoaded(favs, data));
    return {
      ALL: all.length, UPDATED: all.filter((a) => a.updates?.length).length, OPEN: all.filter((a) => a.sponsorAvailable).length,
      FAN_UP: all.filter((a) => a.updates?.some((u: any) => u.type === 'FAN_TEMPERATURE_UP')).length,
      NEW_SLOT: all.filter((a) => a.updates?.some((u: any) => u.type === 'NEW_AVAILABILITY')).length,
    } as Record<string, number>;
  }, [data, favs]);

  const summary = [
    { icon: Heart, tone: 'bg-rose-50 text-rose-500', label: '관심 선수', v: counts.ALL },
    { icon: Bell, tone: 'bg-sky-50 text-sky-600', label: '최근 업데이트', v: counts.UPDATED },
    { icon: Target, tone: 'bg-emerald-50 text-emerald-600', label: '후원 가능', v: counts.OPEN },
    { icon: BarChart3, tone: 'bg-violet-50 text-violet-600', label: '비교 중', v: `${compare.length}/${COMPARE_MAX}` },
  ];

  return (
    <div className="min-h-screen bg-[#f4fbf7] text-slate-900" style={{ paddingBottom: barH + 24 }}>
      <PublicHeader />

      <section className="max-w-[1180px] mx-auto px-5 pt-5">
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[13px]">
          <Link to="/" className="text-slate-500 hover:text-slate-700">홈</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link to="/athletes" className="text-slate-500 hover:text-slate-700">선수</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-emerald-700">관심 선수</span>
        </nav>
        <div className="mt-4 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-[30px] sm:text-[40px] font-extrabold tracking-[-0.03em] leading-tight">관심 선수</h1>
            <p className="mt-2 text-[14.5px] text-slate-600 break-keep leading-relaxed">관심 있는 선수를 저장하고,<br className="hidden sm:block" />최근 변화와 후원 가능 소식을 한눈에 확인하세요.</p>
          </div>
          <div className="hidden lg:flex items-center gap-5 shrink-0">
            <p aria-hidden className="font-script text-[22px] leading-[1.1] text-emerald-500/80 -rotate-6 select-none whitespace-nowrap">Keep an Eye<br />Support Their Next Step</p>
            <p className="rounded-2xl bg-white/90 shadow-sm border border-slate-100 px-3.5 py-2 text-[12.5px] font-bold text-slate-700 leading-snug">좋은 선수를 응원하는<br />더 큰 기회가 시작됩니다.</p>
          </div>
        </div>

        {isAuthenticated && (
          <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {summary.map((s) => {
              const I = s.icon;
              return (
                <div key={s.label} className="rounded-2xl bg-white border border-slate-200 px-4 py-3.5 flex items-center gap-3">
                  <span className={`w-11 h-11 rounded-full inline-flex items-center justify-center shrink-0 ${s.tone}`}><I className="w-5 h-5" /></span>
                  <div>
                    <p className="text-[12.5px] text-slate-500">{s.label}</p>
                    <p className="text-[22px] font-extrabold tabular-nums leading-none mt-0.5">{loading ? '—' : s.v}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="max-w-[1180px] mx-auto px-5 mt-5">
        {!isAuthenticated ? (
          <RestrictedState reason="관심 선수는 로그인 후 볼 수 있어요. 로그인하면 저장한 선수의 최근 변화와 후원 가능 소식을 한눈에 확인할 수 있습니다." loginReturn="/athletes/favorites">
            <Link to={`/login?returnUrl=${encodeURIComponent('/athletes/favorites')}`} className="h-10 px-4 inline-flex items-center rounded-xl bg-emerald-600 text-white text-[13px] font-bold">로그인</Link>
            <Link to="/athletes/search" className="h-10 px-4 inline-flex items-center rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700">선수 찾기</Link>
          </RestrictedState>
        ) : loading ? (
          <LoadingState label="관심 선수를 불러오는 중…" slow={slow} onRetry={load} />
        ) : err ? (
          <ErrorState error={err} onRetry={load} />
        ) : counts.ALL === 0 ? (
          <EmptyState title="아직 관심 선수가 없습니다" desc="선수 카드의 하트를 누르면 이곳에 저장되고, 새 소식을 한눈에 볼 수 있어요.">
            <Link to="/athletes/search" className="h-10 px-4 inline-flex items-center rounded-xl bg-emerald-600 text-white text-[13px] font-bold">선수 찾기</Link>
            <Link to="/athletes/match" className="h-10 px-4 inline-flex items-center rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700">나에게 맞는 선수</Link>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-5 items-start">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] flex-1">
                  {FILTERS.map((f) => (
                    <button key={f.key} onClick={() => setFilter(f.key)} aria-pressed={filter === f.key} className={`h-10 px-3.5 rounded-full text-[12.5px] font-bold whitespace-nowrap border ${filter === f.key ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>
                      {f.label} ({counts[f.key] ?? 0})
                    </button>
                  ))}
                </div>
                <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-[12.5px] font-bold text-slate-700">
                  <option value="UPDATED">최근 업데이트순</option><option value="SAVED">저장순</option>
                </select>
              </div>

              {athletes.length === 0 ? (
                <div className="mt-4"><EmptyState title="이 조건의 관심 선수가 없습니다" desc="다른 필터를 선택하거나 전체를 보세요."><button onClick={() => setFilter('ALL')} className="h-10 px-4 inline-flex items-center rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700">전체 보기</button></EmptyState></div>
              ) : (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {athletes.map((a) => {
                    const u = a.updates?.[0];
                    const UI = u ? UPDATE_ICON[u.type] || Bell : null;
                    return (
                      <AthleteCard key={a.id} a={a} fav={favs.has(a.id)} comparing={comparing(a.id)} compareFull={compareFull}
                        badgeKey={u ? UPDATE_BADGE[u.type] : a.sponsorAvailable ? 'OPEN' : null}
                        onInfo={() => setOpenId(a.id)} onFav={() => toggleFav(a.id, a.name)} onCompare={() => toggleCompare(a)}
                        primary={{ label: u?.type === 'NEW_AVAILABILITY' ? '후원하기' : 'PICK하기', to: `/sponsor/direct/build/${a.id}` }}
                        extra={u ? (
                          <p className="rounded-xl bg-slate-50 px-3 py-2 text-[12px] text-slate-700 break-keep flex items-start gap-2">
                            {UI && <UI className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />}
                            <span><span className="block text-[11px] font-bold text-slate-500">{new Date(u.observedAt).toLocaleDateString('ko-KR')} 업데이트</span>{u.summary}</span>
                          </p>
                        ) : (
                          <p className="rounded-xl bg-slate-50 px-3 py-2 text-[12px] text-slate-500">최근 {data?.config?.updateWindowDays ?? 30}일 내 확인된 변화가 없습니다.</p>
                        )} />
                    );
                  })}
                </div>
              )}
            </div>

            <aside className="space-y-4 lg:sticky lg:top-20">
              <div className="rounded-2xl bg-white border border-slate-200 p-4">
                <p className="text-[15px] font-extrabold">내 관심 선수 업데이트</p>
                <p className="mt-1 text-[12.5px] text-slate-500 break-keep">저장한 선수들의 주요 변화와 후원 가능 소식을 한눈에 확인하고, 비교와 후원까지 바로 시작해보세요.</p>
                <ul className="mt-3 space-y-2">
                  {[
                    { icon: Bell, tone: 'bg-sky-50 text-sky-600', t: '선수의 최신 소식을 알림으로 빠르게 확인할 수 있어요.' },
                    { icon: BarChart3, tone: 'bg-emerald-50 text-emerald-600', t: '여러 선수를 한눈에 비교해 더 좋은 선택을 할 수 있어요.' },
                    { icon: Heart, tone: 'bg-rose-50 text-rose-500', t: '후원 가능한 슬롯이 생기면 바로 확인하고 시작할 수 있어요.' },
                  ].map((x) => {
                    const I = x.icon;
                    return <li key={x.t} className="flex items-start gap-2.5 text-[12.5px] text-slate-700 break-keep"><span className={`w-8 h-8 rounded-full inline-flex items-center justify-center shrink-0 ${x.tone}`}><I className="w-4 h-4" /></span>{x.t}</li>;
                  })}
                </ul>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200 p-4">
                <p className="text-[15px] font-extrabold">선수 비교하기</p>
                <p className="mt-1 text-[12.5px] text-slate-500">최대 {COMPARE_MAX}명의 선수를 선택하여 비교할 수 있습니다.</p>
                <div className="mt-3 flex gap-2">
                  {Array.from({ length: COMPARE_MAX }).map((_, i) => {
                    const a = compare[i];
                    return a ? (
                      <div key={a.id} className="relative w-16 text-center">
                        <span className="block w-14 h-14 mx-auto rounded-full overflow-hidden bg-slate-100 border-2 border-emerald-300">{a.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}</span>
                        <button onClick={() => removeCompare(a.id)} aria-label={`${a.name} 비교 해제`} className="absolute -top-1 right-0 w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-500 inline-flex items-center justify-center"><X className="w-3 h-3" /></button>
                        <span className="block mt-1 text-[11.5px] font-bold truncate">{a.name}</span>
                      </div>
                    ) : (
                      <div key={i} className="w-16 text-center">
                        <span className="block w-14 h-14 mx-auto rounded-full border-2 border-dashed border-slate-200 text-slate-400 inline-flex items-center justify-center"><Plus className="w-5 h-5" /></span>
                        <span className="block mt-1 text-[11.5px] text-slate-400">선수 추가</span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-[12px] text-slate-500 tabular-nums">{compare.length}/{COMPARE_MAX} 명 선택됨</p>
                <button onClick={() => navigate(`/athletes/compare?ids=${compare.map((a) => a.id).join(',')}`)} disabled={compare.length < 2} className="mt-2 w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold disabled:opacity-40">선수 비교하기 <ArrowRight className="w-4 h-4" /></button>
              </div>
            </aside>
          </div>
        )}
      </section>

      {/* 선수 찾기 CTA */}
      <section className="max-w-[1180px] mx-auto px-5 py-8">
        <div className="relative overflow-hidden rounded-3xl bg-white border border-emerald-100 px-5 sm:px-8 py-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <p aria-hidden className="absolute right-[24%] top-3 hidden lg:block font-script text-[20px] leading-[1.1] text-emerald-500/70 -rotate-6 select-none">More Athletes<br />More Opportunities</p>
          <span className="w-14 h-14 rounded-full bg-emerald-50 inline-flex items-center justify-center text-emerald-600 shrink-0"><Search className="w-7 h-7" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[18px] font-extrabold tracking-[-0.02em]">원하는 선수가 더 필요하신가요?</p>
            <p className="mt-1 text-[13.5px] text-slate-600 break-keep">다양한 선수를 검색하고, 새로운 가능성을 찾아보세요.</p>
          </div>
          <Link to="/athletes/search" className="shrink-0 h-12 px-6 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700">선수 찾기 <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </section>

      {isAuthenticated && counts.ALL > 0 && <CompareBar compare={compare} onRemove={removeCompare} onHeight={setBarH} mobileCompact />}

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 z-40 rounded-xl bg-slate-900 text-white text-[13px] px-4 py-2.5 shadow-lg flex items-center gap-3" style={{ bottom: barH + 12 }}>
          <Trash2 className="w-4 h-4 text-slate-400" /> 관심 선수에서 해제했습니다.
          <button onClick={undo} className="font-bold text-emerald-300">되돌리기</button>
          <button onClick={dismissToast} aria-label="닫기" className="text-slate-400"><X className="w-4 h-4" /></button>
        </div>
      )}
      {openId && (
        <QuickProfile athleteId={openId} fav={favs.has(openId)} onFav={() => toggleFav(openId, athletes.find((x) => x.id === openId)?.name)} onClose={() => setOpenId(null)} onPick={(id) => navigate(`/sponsor/direct/build/${id}`)} />
      )}
    </div>
  );
}

/** favs 초기 로드 전(빈 Set)에는 서버 목록을 그대로 보여준다 */
function favsLoaded(favs: Set<string>, data: any) {
  return favs.size > 0 || !(data?.athletes?.length);
}
