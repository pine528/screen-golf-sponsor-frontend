/**
 * F02 Fan VOTE 목록 `/fan/vote` — 시안 2026-09-15 (Desktop · Mobile)
 *
 *  히어로 → 탭(진행 중/예정/종료/내 참여, 개수) → 유형 칩 + 필터(관심선수·정렬) + [투표 만들기]
 *  → 투표 카드(선수 · 유형 · 질문 · 남은 시간 · 적립 P · 참여 수 · 투표하기/자세히 보기)
 *  → 우측: 내가 만든 투표(개수 + 새 투표 만들기) · 참여 가이드 → 참여 원칙 → "팬보트는 이렇게 이어집니다" 4단계.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BarChart3, ChevronDown, ChevronRight, Clock, Coins, FilePlus2, Heart, Info, Lock, Plus, Users, Vote,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { AthleteAvatar, Countdown, Skeleton, nf } from '../../components/fanhub/FanKit';

const TABS = [
  { key: 'OPEN', label: '진행 중' }, { key: 'UPCOMING', label: '예정' }, { key: 'CLOSED', label: '종료' }, { key: 'MINE', label: '내 참여' },
];
const TYPE_TONE: Record<string, string> = {
  OX: 'bg-emerald-50 text-emerald-700', MULTI: 'bg-sky-50 text-sky-700', PREDICT: 'bg-amber-50 text-amber-700',
  BRAND: 'bg-violet-50 text-violet-700', PICK: 'bg-rose-50 text-rose-700',
};
const GUIDE = [
  { icon: Heart, tone: 'bg-rose-50 text-rose-500', t: '참여 시 팬온도 반영', d: '당신의 응원이 선수에게!' },
  { icon: Coins, tone: 'bg-sky-50 text-sky-600', t: '참여 완료 시 팬포인트 적립', d: '투표 종료 후 확정 지급' },
  { icon: BarChart3, tone: 'bg-emerald-50 text-emerald-600', t: '다양한 주제의 투표로 선수와 더 가까이', d: '경기 예측 · 브랜드 설문 · 팬선정' },
  { icon: Lock, tone: 'bg-amber-50 text-amber-600', t: '결과는 종료 후 공개', d: '더 공정한 팬 참여를 위해' },
];
const STEPS = [
  { icon: FilePlus2, tone: 'bg-emerald-50 text-emerald-600', t: '참여하기', d: '관심 있는 투표에 지금 참여하세요.' },
  { icon: Heart, tone: 'bg-rose-50 text-rose-500', t: '팬온도 반영', d: '당신의 참여가 선수의 팬온도에 반영됩니다.' },
  { icon: Coins, tone: 'bg-sky-50 text-sky-600', t: '팬포인트 적립', d: '투표 완료 시 팬포인트가 쌓입니다.' },
  { icon: Users, tone: 'bg-violet-50 text-violet-600', t: '선수에게 연결', d: '더 많은 응원이 선수의 더 큰 기회가 됩니다.' },
];

export default function FanVoteList() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState('OPEN');
  const [type, setType] = useState('ALL');
  const [sort, setSort] = useState('LATEST');
  const [favOnly, setFavOnly] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    api.listFanVotes({ tab, type, sort, limit: 40, favorites: favOnly || undefined })
      .then((r) => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [tab, type, sort, favOnly]);
  useEffect(() => {
    if (!isAuthenticated) { setMine(null); return; }
    api.getMyFanVotes().then((r: any) => setMine(r?.data || null)).catch(() => setMine(null));
  }, [isAuthenticated]);

  const types = useMemo(() => [{ code: 'ALL', label: '전체' }, ...(data?.types || [])], [data?.types]);
  const createTo = isAuthenticated ? '/fan/vote/create' : `/login?returnUrl=${encodeURIComponent('/fan/vote/create')}`;

  return (
    <div className="min-h-screen bg-[#f3faf6] text-slate-900 pb-16">
      <PublicHeader />

      {/* ── 히어로 ── */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute right-[-80px] top-[-140px] w-[520px] h-[520px] rounded-full bg-emerald-200/40 blur-3xl" />
          <p className="absolute right-10 top-16 hidden lg:block font-script text-[30px] leading-[1.05] text-emerald-500/80 -rotate-6 select-none whitespace-nowrap">Fans<br />Make a<br />Difference</p>
          <span className="absolute right-[26%] top-10 hidden lg:inline-flex w-24 h-24 rounded-2xl bg-white/70 border border-emerald-100 items-center justify-center text-emerald-500 rotate-6"><Vote className="w-10 h-10" /></span>
        </div>
        <div className="max-w-[1180px] mx-auto px-5 pt-5 pb-6 relative">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} aria-label="뒤로" className="w-9 h-9 rounded-xl border border-slate-200 bg-white inline-flex items-center justify-center text-slate-600"><ArrowLeft className="w-4 h-4" /></button>
            <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[13px]">
              <Link to="/" className="text-slate-500 hover:text-slate-700">홈</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <Link to="/fan" className="text-slate-500 hover:text-slate-700">팬 참여</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="font-bold text-emerald-700">Fan VOTE</span>
            </nav>
          </div>
          <p className="mt-6 text-[13.5px] font-bold text-emerald-700">Good Fans, A Brighter Tomorrow</p>
          <h1 className="mt-1 text-[30px] sm:text-[40px] font-extrabold tracking-[-0.03em] leading-tight">팬의 선택을 보여주세요</h1>
          <p className="mt-2 text-[14.5px] text-slate-600 break-keep leading-relaxed max-w-xl">투표하고, 응원하고, 예측하며 함께 만들어가는 특별한 순간.<br className="hidden sm:block" />여러분의 참여가 팬온도와 팬포인트로 이어져, 선수에게 더 큰 힘이 됩니다.</p>
        </div>
      </section>

      <div className="max-w-[1180px] mx-auto px-5">
        {/* 탭 */}
        <div className="rounded-2xl bg-white border border-slate-200 p-1 grid grid-cols-4">
          {TABS.map((t) => {
            const on = tab === t.key;
            const n = data?.counts?.[t.key] ?? 0;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} aria-pressed={on} className={`h-11 rounded-xl text-[13.5px] sm:text-[15px] font-bold inline-flex items-center justify-center gap-1.5 border-b-2 ${on ? 'border-emerald-500 text-emerald-700 bg-emerald-50/40' : 'border-transparent text-slate-600'}`}>
                {t.label} <span className={`px-1.5 min-w-[22px] h-[22px] rounded-full text-[11.5px] tabular-nums inline-flex items-center justify-center ${on ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{n}</span>
              </button>
            );
          })}
        </div>

        {/* 유형 칩 · 필터 · 만들기 */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] max-w-full">
            {types.map((t: any) => (
              <button key={t.code} onClick={() => setType(t.code)} aria-pressed={type === t.code} className={`shrink-0 h-10 px-4 rounded-full text-[13px] font-bold border ${type === t.code ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'}`}>{t.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <button onClick={() => (isAuthenticated ? setFavOnly((v) => !v) : navigate(`/login?returnUrl=${encodeURIComponent('/fan/vote')}`))} aria-pressed={favOnly} className={`h-10 px-3.5 rounded-xl border text-[12.5px] font-bold inline-flex items-center gap-1.5 ${favOnly ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700'}`}><Heart className="w-3.5 h-3.5" /> 관심선수</button>
            <label className="relative">
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-10 pl-3.5 pr-8 rounded-xl border border-slate-200 bg-white text-[12.5px] font-bold text-slate-700 appearance-none">
                <option value="LATEST">최신순</option><option value="CLOSING">마감 임박순</option><option value="POPULAR">참여 많은순</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </label>
            <Link to={createTo} className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-[13px] font-bold inline-flex items-center gap-1.5 hover:bg-emerald-700"><Plus className="w-4 h-4" /> 투표 만들기</Link>
          </div>
        </div>

        <div className="mt-4 grid lg:grid-cols-[minmax(0,1fr)_260px] gap-4 items-start">
          {/* 목록 */}
          <section className="min-w-0">
            {loading ? (
              <div className="space-y-2.5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[120px]" />)}</div>
            ) : data?.votes?.length ? (
              <ul className="space-y-2.5">
                {data.votes.map((v: any) => (
                  <li key={v.id} className="rounded-2xl bg-white border border-slate-200 p-3.5 sm:p-4">
                    <div className="flex gap-3.5">
                      <Link to={`/fan/vote/${v.id}`} className="shrink-0">
                        {v.athlete ? (
                          <span className="block w-[84px] h-[84px] sm:w-[104px] sm:h-[104px] rounded-2xl overflow-hidden bg-slate-100">
                            {v.athlete.profileImageUrl ? <img src={v.athlete.profileImageUrl} alt="" className="w-full h-full object-cover object-top" /> : <AthleteAvatar athlete={v.athlete} size={84} />}
                          </span>
                        ) : <span className="w-[84px] h-[84px] sm:w-[104px] sm:h-[104px] rounded-2xl bg-emerald-50 text-emerald-500 inline-flex items-center justify-center"><Vote className="w-8 h-8" /></span>}
                      </Link>
                      <div className="min-w-0 flex-1 grid sm:grid-cols-[minmax(0,1fr)_auto] gap-3">
                        <div className="min-w-0">
                          {v.athlete && (
                            <p className="text-[14px] font-extrabold truncate">{v.athlete.name} <span className="text-[12px] text-slate-500 font-bold">프로</span> <span className="ml-1 text-[11.5px] font-bold text-slate-500">{v.athlete.tour}</span></p>
                          )}
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[11px] font-extrabold ${TYPE_TONE[v.type] || 'bg-slate-100 text-slate-600'}`}>{v.typeLabel}</span>
                            {v.voted && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-bold text-slate-600">참여함</span>}
                            {v.createdByMe && <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-bold">내가 만든 투표</span>}
                          </div>
                          <Link to={`/fan/vote/${v.id}`} className="mt-1 block text-[15px] sm:text-[16px] font-extrabold leading-snug break-keep hover:text-emerald-700">{v.title}</Link>
                          <p className="mt-1.5 text-[12.5px] text-slate-500 inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> {v.closed ? '종료' : <>남은 시간 <span className="font-bold text-emerald-700"><Countdown ms={v.remainMs} closed={v.closed} /></span></>}
                          </p>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 sm:min-w-[150px]">
                          <div className="text-[12.5px] text-slate-600 space-y-1">
                            <p className="inline-flex items-center gap-1 font-extrabold text-emerald-700"><Coins className="w-4 h-4" /> {v.earnPoints}P{v.correctBonus ? ` +${v.correctBonus}` : ''}</p>
                            <p className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> {nf(v.participants)}명 참여</p>
                            <p className="hidden sm:flex items-center gap-1 text-slate-500"><Info className="w-3.5 h-3.5 text-slate-400" /> 투표 종료 후 결과 공개</p>
                          </div>
                          <div className="flex sm:flex-col gap-1.5 shrink-0">
                            <Link to={`/fan/vote/${v.id}`} className={`h-10 px-4 rounded-xl text-[13px] font-bold inline-flex items-center justify-center ${v.closed || v.voted || v.createdByMe ? 'border border-slate-200 bg-white text-slate-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                              {v.closed ? '결과 보기' : v.voted ? '내 투표 보기' : v.createdByMe ? '현황 보기' : '투표하기'}
                            </Link>
                            <Link to={`/fan/vote/${v.id}`} className="hidden sm:inline-flex h-10 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 items-center justify-center">자세히 보기</Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl bg-white border border-dashed border-slate-200 py-12 text-center">
                <span className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 inline-flex items-center justify-center"><Vote className="w-6 h-6" /></span>
                <p className="mt-3 text-[15px] font-extrabold">{tab === 'MINE' ? '참여한 투표가 없습니다' : '해당하는 투표가 없습니다'}</p>
                <p className="mt-1 text-[13px] text-slate-500 break-keep">{tab === 'MINE' ? '투표에 참여하면 이곳에서 결과를 다시 확인할 수 있습니다.' : '다른 탭이나 유형을 확인하거나, 직접 투표를 만들어보세요.'}</p>
                <Link to={createTo} className="mt-4 inline-flex h-10 px-4 items-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold"><Plus className="w-4 h-4" /> 투표 만들기</Link>
              </div>
            )}

            {data?.notice && (
              <div className="mt-4 rounded-2xl bg-white border border-slate-200 px-4 py-3 text-[12.5px] text-slate-600 flex items-start gap-2 break-keep">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> {data.notice}
              </div>
            )}
          </section>

          {/* 우측 */}
          <aside className="space-y-3 lg:sticky lg:top-20">
            <div className="rounded-2xl bg-white border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[14.5px] font-extrabold">내가 만든 투표</p>
                <Link to={isAuthenticated ? '/fan/vote/mine' : `/login?returnUrl=${encodeURIComponent('/fan/vote/mine')}`} className="text-[12px] font-bold text-slate-500 hover:text-emerald-700 inline-flex items-center">더보기 <ChevronRight className="w-3.5 h-3.5" /></Link>
              </div>
              <div className="mt-3 flex flex-col items-center text-center">
                <span className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 inline-flex items-center justify-center"><FilePlus2 className="w-8 h-8" /></span>
                <p className="mt-2 text-[14px] font-extrabold">내가 만든 투표 <span className="ml-1 px-1.5 rounded-full bg-emerald-600 text-white text-[11.5px] tabular-nums">{mine?.summary?.total ?? 0}</span></p>
                <p className="mt-1 text-[12px] text-slate-500 break-keep">관심 선수, 경기 예측, 브랜드 설문 등 팬이 직접 투표를 만들 수 있습니다.</p>
                {mine?.summary?.hostEarned > 0 && <p className="mt-1 text-[12px] font-bold text-emerald-700">참여 적립 {nf(mine.summary.hostEarned)}P</p>}
                {mine?.summary?.needsAnswer > 0 && <Link to="/fan/vote/mine" className="mt-1 text-[12px] font-bold text-amber-700">정답 입력 대기 {mine.summary.needsAnswer}건 →</Link>}
              </div>
              <Link to={createTo} className="mt-3 h-11 w-full rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold inline-flex items-center justify-center gap-1.5 hover:bg-emerald-700"><Plus className="w-4 h-4" /> 새 투표 만들기</Link>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-4">
              <p className="text-[14.5px] font-extrabold">참여 가이드</p>
              <ul className="mt-3 space-y-2.5">
                {GUIDE.map((g) => {
                  const I = g.icon;
                  return (
                    <li key={g.t} className="flex items-start gap-2.5">
                      <span className={`w-9 h-9 rounded-full inline-flex items-center justify-center shrink-0 ${g.tone}`}><I className="w-4 h-4" /></span>
                      <span><span className="block text-[13px] font-bold">{g.t}</span><span className="block text-[11.5px] text-slate-500">{g.d}</span></span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>

        {/* ── 4단계 ── */}
        <section className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-[18px] sm:text-[20px] font-extrabold tracking-[-0.02em]">팬보트는 이렇게 이어집니다</h2>
              <p className="mt-1 text-[13px] text-slate-500">여러분의 한 표가 선수와 더 가까운 내일을 만듭니다.</p>
            </div>
            <p className="text-[12.5px] text-slate-500"><b className="text-slate-800">SPONPIK</b>와 함께, 더 특별한 팬이 되어주세요.</p>
          </div>
          <ol className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {STEPS.map((s, i) => {
              const I = s.icon;
              return (
                <li key={s.t} className="rounded-2xl bg-white border border-slate-200 p-4 flex items-start gap-3">
                  <span className={`w-11 h-11 rounded-full inline-flex items-center justify-center shrink-0 ${s.tone}`}><I className="w-5 h-5" /></span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold text-slate-400">0{i + 1}</span>
                    <span className="block text-[14px] font-extrabold">{s.t}</span>
                    <span className="block mt-0.5 text-[12px] text-slate-500 break-keep">{s.d}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}
