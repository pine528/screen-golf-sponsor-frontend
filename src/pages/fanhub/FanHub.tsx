/**
 * F01 팬 참여 메인 `/fan` — 시안 2026-09-15 (Desktop · Mobile, 로그인 전/후 분기)
 *
 *  히어로(어두운 경기장 톤): 비로그인 = "응원이 선수의 성장으로 이어지는 곳" + 로그인 유도 카드(혜택 4가지)
 *                          로그인 = "응원이 쌓이면 선수의 기회가 됩니다" + 인사·내 팬포인트·응원 선수 수
 *  → 4축 카드(팬투표 Green · 팬온도 Coral · 팬포인트 Blue · 팬스토어 Yellow)
 *  → 로그인: 지금 참여할 수 있는 투표 / 내가 응원하는 선수 / 내 팬포인트 / 브랜드 팬스토어 4패널
 *  → "팬 참여는 이렇게 이어집니다" 4단계 → EVENT 배너(진행 중 캠페인이 있을 때만).
 *  값은 실데이터만. 없으면 비우거나 "집계 중" (LEG-06). 팬온도는 §11.4 고정 문구를 붙인다.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, ChevronRight, Coins, Crown, Gift, Heart, Layers, ListChecks, Lock, Megaphone,
  Send, ShoppingBag, Star, Ticket, Users, Vote, Wallet,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { AthleteAvatar, Countdown, Skeleton, TempBar, nf, FAN_TEMP_NOTE } from '../../components/fanhub/FanKit';

const AXES = [
  { key: 'VOTE', icon: BarChart3, title: '팬투표', desc: '당신의 한 표가\n선수의 기회를 만듭니다.', cta: '투표 참여하기', to: '/fan/vote',
    card: 'from-emerald-400 to-emerald-500 text-white', icon2: 'text-emerald-500', foot: 'bg-emerald-50 text-emerald-700' },
  { key: 'TEMP', icon: Heart, title: '팬온도', desc: '팬의 마음이 모여\n선수에게 힘이 됩니다.', cta: '지금 응원하기', to: '/fan/community',
    card: 'from-rose-400 to-rose-500 text-white', icon2: 'text-rose-500', foot: 'bg-rose-50 text-rose-700' },
  { key: 'POINT', icon: Coins, title: '팬포인트', desc: '참여할수록 쌓이는\n특별한 리워드.', cta: '포인트 알아보기', to: '/fan/points',
    card: 'from-sky-300 to-sky-400 text-white', icon2: 'text-sky-500', foot: 'bg-sky-50 text-sky-700' },
  { key: 'STORE', icon: ShoppingBag, title: '팬스토어', desc: '좋아하는 선수를\n더 가까이, 특별하게.', cta: '스토어 둘러보기', to: '/fan/store',
    card: 'from-amber-300 to-amber-400 text-slate-900', icon2: 'text-amber-500', foot: 'bg-amber-50 text-amber-800' },
];

const STEPS = [
  { icon: Send, tone: 'bg-sky-100 text-sky-600', title: '참여하기', desc: '투표하고, 응원하고,\n다양한 방식으로 참여해요.' },
  { icon: BarChart3, tone: 'bg-emerald-100 text-emerald-600', title: '반영되기', desc: '팬들의 참여가 모여\n선수의 활동에 반영돼요.' },
  { icon: Layers, tone: 'bg-rose-100 text-rose-500', title: '포인트 쌓기', desc: '활동할수록 팬포인트가 쌓여\n다양한 혜택을 받을 수 있어요.' },
  { icon: Heart, tone: 'bg-violet-100 text-violet-600', title: '선수와 연결', desc: '쌓인 응원이 선수에게 힘이 되고,\n더 큰 기회로 이어집니다.' },
];

const GUEST_BENEFITS = ['지금 참여할 수 있는 투표 확인', '내가 응원하는 선수 설정', '나의 팬포인트 현황', '응원하는 선수의 브랜드 스토어 이용'];

export default function FanHub() {
  const { isAuthenticated, user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [favCount, setFavCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getFanHub().then((r) => r.data).catch(() => null),
      api.listFanStores({ limit: 1 }).then((r: any) => r?.data?.stores?.[0] ?? null).catch(() => null),
      isAuthenticated ? api.getMyFavoriteAthleteIds().then((r: any) => (r?.data?.ids || []).length).catch(() => null) : Promise.resolve(null),
    ]).then(([hub, st, fc]) => { setData(hub); setStore(st); setFavCount(fc); }).finally(() => setLoading(false));
  }, [isAuthenticated]);

  const name = (user as any)?.nickname || (user as any)?.name || (user?.email ? user.email.split('@')[0] : '스폰픽 회원');
  const votes: any[] = data?.votes || [];
  const supported: any[] = data?.supported || [];
  const points = data?.points || null;
  const campaign = data?.campaign || null;
  const favTotal = favCount ?? (supported.length || null);

  return (
    <div className="min-h-screen bg-[#f3faf6] text-slate-900 pb-16">
      <PublicHeader />

      {/* ── 히어로 ── */}
      <section className="relative overflow-hidden bg-[#0a1411] text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[-30%] w-[60%] h-[120%] rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute right-[-10%] bottom-[-40%] w-[55%] h-[120%] rounded-full bg-teal-400/15 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a1411] to-transparent" />
          <p className="absolute right-6 sm:right-12 top-1/2 -translate-y-1/2 hidden md:block font-script text-[36px] leading-[1.05] text-emerald-300/70 -rotate-6 select-none whitespace-nowrap">Good Fans<br />Brighter Tomorrow</p>
        </div>
        <div className="max-w-[1180px] mx-auto px-5 py-9 sm:py-14 relative grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-center">
          <div>
            <p className="text-[13px] font-bold text-emerald-300">Fans Make a Difference</p>
            {isAuthenticated ? (
              <>
                <h1 className="mt-2 text-[30px] sm:text-[44px] font-extrabold tracking-[-0.03em] leading-[1.2] break-keep">응원이 쌓이면<br /><span className="text-emerald-300">선수의 기회</span>가 됩니다</h1>
                <p className="mt-4 text-[14px] sm:text-[15.5px] text-white/80 leading-relaxed break-keep max-w-md">당신의 투표, 응원, 팬온도, 팬포인트가 모여 선수에게 더 큰 가능성을 만들어갑니다. 지금, 당신의 응원으로 선수의 내일을 함께 만들어주세요.</p>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  <Link to="/fan/vote" className="h-12 px-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-400 text-slate-900 text-[14.5px] font-extrabold hover:bg-emerald-300">지금 투표하기 <ArrowRight className="w-4 h-4" /></Link>
                  <Link to="/fan/activity" className="h-12 px-6 inline-flex items-center gap-1.5 rounded-full border border-white/40 text-white text-[14.5px] font-bold hover:bg-white/10">내 팬활동 보기 <ArrowRight className="w-4 h-4" /></Link>
                </div>
              </>
            ) : (
              <>
                <h1 className="mt-2 text-[30px] sm:text-[44px] font-extrabold tracking-[-0.03em] leading-[1.2] break-keep">응원이 선수의<br /><span className="text-emerald-300">성장</span>으로 이어지는 곳</h1>
                <p className="mt-4 text-[14px] sm:text-[15.5px] text-white/80 leading-relaxed break-keep max-w-md">팬의 참여가 선수에게는 더 큰 기회가 됩니다. 팬투표, 팬온도, 팬포인트, 팬스토어로 선수의 내일을 함께 만들어보세요. 지금 로그인하면 더 많은 기능을 이용할 수 있습니다.</p>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  <Link to={`/login?returnUrl=${encodeURIComponent('/fan')}`} className="h-12 px-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-400 text-slate-900 text-[14.5px] font-extrabold hover:bg-emerald-300">로그인하고 시작하기 <ArrowRight className="w-4 h-4" /></Link>
                  <Link to="/guide" className="h-12 px-6 inline-flex items-center gap-1.5 rounded-full border border-white/40 text-white text-[14.5px] font-bold hover:bg-white/10">팬 활동 가이드 보기 <ChevronRight className="w-4 h-4" /></Link>
                </div>
              </>
            )}
          </div>

          {/* 우측 카드 */}
          <div className="rounded-2xl border border-emerald-300/30 bg-white/5 backdrop-blur px-5 py-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-emerald-400/20 text-emerald-300 inline-flex items-center justify-center"><Crown className="w-5 h-5" /></span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-extrabold truncate">{name}님,</p>
                    <p className="text-[12.5px] text-white/75">오늘도 특별한 응원 감사합니다!</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-3">
                  <Link to="/fan/points" className="group">
                    <p className="text-[11.5px] text-white/60 inline-flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> 내 팬포인트</p>
                    <p className="text-[22px] font-extrabold text-emerald-300 tabular-nums leading-tight">{loading ? '—' : points ? `${nf(points.balance)} P` : <span className="text-[13px] text-white/60">집계 중</span>}</p>
                  </Link>
                  <Link to="/athletes/favorites" className="group">
                    <p className="text-[11.5px] text-white/60 inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 내가 응원하는 선수</p>
                    <p className="text-[22px] font-extrabold tabular-nums leading-tight inline-flex items-center gap-1">{loading ? '—' : favTotal != null ? `${favTotal}명` : '0명'} <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-emerald-300" /></p>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-[14px] font-extrabold inline-flex items-center gap-2"><Lock className="w-4 h-4 text-emerald-300" /> 로그인하고 더 많은 혜택을 만나보세요.</p>
                <ul className="mt-3 pt-3 border-t border-white/10 space-y-2">
                  {GUEST_BENEFITS.map((t) => (
                    <li key={t} className="flex items-center gap-2 text-[13px] text-white/85"><span className="w-[18px] h-[18px] rounded-full bg-emerald-400 text-slate-900 inline-flex items-center justify-center shrink-0"><ListChecks className="w-3 h-3" /></span>{t}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── 4축 카드 ── */}
      <section className="max-w-[1180px] mx-auto px-5 -mt-5 relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {AXES.map((a) => {
            const I = a.icon;
            return (
              <Link key={a.key} to={a.to} className="group rounded-2xl overflow-hidden shadow-[0_14px_36px_-20px_rgba(15,23,42,0.35)] hover:-translate-y-0.5 transition-transform">
                <div className={`relative bg-gradient-to-br ${a.card} p-4 sm:p-5 min-h-[150px] sm:min-h-[190px]`}>
                  <I aria-hidden className="absolute right-3 bottom-3 w-20 h-20 sm:w-24 sm:h-24 opacity-20" />
                  <span className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white inline-flex items-center justify-center ${a.icon2}`}><I className="w-5 h-5 sm:w-7 sm:h-7" /></span>
                  <p className="mt-3 text-[18px] sm:text-[22px] font-extrabold">{a.title}</p>
                  <p className="mt-1 text-[12px] sm:text-[13.5px] font-semibold whitespace-pre-line opacity-90 leading-snug">{a.desc}</p>
                  <span className="absolute right-4 bottom-4 w-8 h-8 rounded-full bg-white/90 text-slate-800 inline-flex items-center justify-center"><ArrowRight className="w-4 h-4" /></span>
                </div>
                <div className={`hidden sm:flex items-center gap-1 px-5 py-3 text-[13px] font-bold ${a.foot}`}>{a.cta} <ArrowRight className="w-3.5 h-3.5" /></div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 로그인: 내 활동 4패널 ── */}
      {isAuthenticated && (
        <section className="max-w-[1180px] mx-auto px-5 mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
          {/* 투표 */}
          <Panel title="지금 참여할 수 있는 투표" to="/fan/vote">
            {loading ? <Skeleton className="h-[120px]" /> : votes.length ? (
              <ul className="space-y-2.5">
                {votes.slice(0, 2).map((v: any) => (
                  <li key={v.id}>
                    <Link to={`/fan/vote/${v.id}`} className="flex items-center gap-3 group">
                      <span className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 inline-flex items-center justify-center text-slate-400">
                        {v.athlete?.profileImageUrl ? <img src={v.athlete.profileImageUrl} alt="" className="w-full h-full object-cover object-top" /> : <Vote className="w-5 h-5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700"><span className="px-1.5 py-0.5 rounded bg-emerald-50">진행중</span><Countdown ms={new Date(v.closeAt).getTime() - Date.now()} /></span>
                        <span className="block text-[13.5px] font-extrabold truncate">{v.title}</span>
                        <span className="block text-[12px] text-slate-500">{v.typeLabel}{v.athlete ? ` · ${v.athlete.name}` : ''} · {nf(v.participants)}명 참여</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <PanelEmpty icon={Vote} text="진행 중인 투표가 없습니다" />}
          </Panel>

          {/* 응원 선수 */}
          <Panel title="내가 응원하는 선수" to="/athletes/favorites">
            {loading ? <Skeleton className="h-[120px]" /> : supported[0] ? (() => {
              const s = supported[0];
              return (
                <div>
                  <div className="flex items-center gap-3">
                    <AthleteAvatar athlete={s.athlete} size={56} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-extrabold truncate">{s.athlete.name} <span className="text-[12px] text-slate-500">프로</span></p>
                      <p className="text-[12px] text-slate-500 truncate">{s.athlete.tour || s.athlete.sportType || '선수'}</p>
                    </div>
                    <Heart className="w-5 h-5 text-rose-500 fill-current shrink-0" />
                  </div>
                  <div className="mt-3" title={FAN_TEMP_NOTE}><TempBar score={s.score} tier={s.tier?.label} lowSample={s.lowSample} /></div>
                  {supported.length > 1 && <p className="mt-2 text-[12px] text-slate-500">외 {supported.length - 1}명을 응원하고 있어요</p>}
                  <div className="mt-3 grid grid-cols-2 gap-1.5">
                    <Link to={`/fan/community/${s.athlete.id}`} className="h-9 rounded-lg bg-slate-900 text-white text-[12px] font-bold inline-flex items-center justify-center">선수 응원하기</Link>
                    <Link to={`/athletes/${s.athlete.id}`} className="h-9 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-700 inline-flex items-center justify-center">선수 소식보기</Link>
                  </div>
                </div>
              );
            })() : (
              <PanelEmpty icon={Heart} text="아직 응원하는 선수가 없습니다">
                <Link to="/athletes/search" className="mt-2 inline-flex h-9 px-3.5 items-center rounded-lg bg-slate-900 text-white text-[12px] font-bold">선수 찾기</Link>
              </PanelEmpty>
            )}
          </Panel>

          {/* 팬포인트 */}
          <Panel title="내 팬포인트" to="/fan/points">
            {loading ? <Skeleton className="h-[120px]" /> : points ? (
              <div>
                <div className="flex items-end justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-11 h-11 rounded-full bg-sky-50 text-sky-600 inline-flex items-center justify-center"><Coins className="w-5 h-5" /></span>
                    <div>
                      <p className="text-[11.5px] text-slate-500">보유 포인트</p>
                      <p className="text-[24px] font-extrabold tabular-nums leading-none">{nf(points.balance)} <span className="text-[13px] text-slate-500">P</span></p>
                    </div>
                  </div>
                  {points.nextBadge && (
                    <div className="text-right">
                      <p className="text-[11.5px] text-slate-500">다음 레벨까지</p>
                      <p className="text-[14px] font-bold tabular-nums text-slate-700">{nf(points.nextBadge.remaining)} P</p>
                    </div>
                  )}
                </div>
                {points.nextBadge && (
                  <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.max(4, Math.min(100, Math.round((points.balance / Math.max(1, points.balance + points.nextBadge.remaining)) * 100)))}%` }} />
                  </div>
                )}
                {points.badge && <p className="mt-2 text-[12.5px] font-bold text-slate-700 inline-flex items-center gap-1.5">{points.badge.label} <Crown className="w-3.5 h-3.5 text-amber-500" /></p>}
                {points.pending > 0 && <p className="mt-1 text-[12px] text-slate-500">적립 예정 {nf(points.pending)}P</p>}
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {[{ icon: ListChecks, l: '포인트 내역', to: '/fan/points/ledger' }, { icon: Ticket, l: '포인트 사용', to: '/fan/points' }, { icon: Gift, l: '혜택 보기', to: '/fan/points' }].map((b) => {
                    const I = b.icon;
                    return <Link key={b.l} to={b.to} className="h-14 rounded-xl border border-slate-200 inline-flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-slate-700 hover:border-sky-300"><I className="w-4 h-4 text-sky-600" />{b.l}</Link>;
                  })}
                </div>
              </div>
            ) : <PanelEmpty icon={Coins} text="팬포인트는 팬 계정에서 쌓입니다" />}
          </Panel>

          {/* 팬스토어 */}
          <Panel title="브랜드 팬스토어" to="/fan/store">
            {loading ? <Skeleton className="h-[120px]" /> : store ? (
              <Link to={`/fan/store/${store.slug || store.id}`} className="block group">
                <div className="aspect-[4/3] rounded-xl bg-slate-100 overflow-hidden">
                  {store.heroImageUrl && <img src={store.heroImageUrl} alt={store.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />}
                </div>
                {store.benefit?.label && <span className="mt-2.5 inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-extrabold">{store.benefit.label}</span>}
                <p className="mt-1.5 text-[14px] font-extrabold line-clamp-2 break-keep">{store.title}</p>
                <p className="text-[12px] text-slate-500 truncate">{[store.brandName, store.athlete?.name ? `${store.athlete.name} 프로` : null].filter(Boolean).join(' × ')}</p>
                <span className="mt-3 h-9 w-full rounded-lg bg-slate-900 text-white text-[12px] font-bold inline-flex items-center justify-center">스토어 보기</span>
              </Link>
            ) : <PanelEmpty icon={ShoppingBag} text="열려 있는 팬스토어가 없습니다" />}
          </Panel>
        </section>
      )}

      {/* ── 4단계 ── */}
      <section className="max-w-[1180px] mx-auto px-5 mt-5">
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
          <div className="lg:flex lg:items-center lg:gap-8">
            <div className="lg:w-[220px] shrink-0">
              <h2 className="text-[18px] sm:text-[20px] font-extrabold tracking-[-0.02em]">팬 참여는 이렇게 이어집니다</h2>
              <p className="mt-1 text-[13px] text-slate-500">당신의 참여가 선수의 더 큰 가능성을 만듭니다.</p>
            </div>
            <ol className="mt-4 lg:mt-0 grid grid-cols-2 lg:grid-cols-4 gap-2.5 flex-1">
              {STEPS.map((s, i) => {
                const I = s.icon;
                return (
                  <li key={s.title} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex items-start gap-3">
                    <span className={`w-10 h-10 rounded-full inline-flex items-center justify-center shrink-0 ${s.tone}`}><I className="w-[18px] h-[18px]" /></span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-bold text-slate-400">0{i + 1}</span>
                      <span className="block text-[14px] font-extrabold">{s.title}</span>
                      <span className="hidden sm:block mt-0.5 text-[12px] text-slate-500 whitespace-pre-line leading-snug">{s.desc}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
          {!isAuthenticated && (
            <p className="mt-4 text-[12.5px] text-slate-500 break-keep">{FAN_TEMP_NOTE} 브랜드에는 개인 팬 데이터가 아니라 집계·추세만 전달됩니다.</p>
          )}
        </div>
      </section>

      {/* ── EVENT 배너 — 진행 중 캠페인이 있을 때만 ── */}
      {campaign && (
        <section className="max-w-[1180px] mx-auto px-5 mt-5">
          <Link to="/fan/campaign" className="relative block overflow-hidden rounded-2xl bg-[#0a1411] text-white px-5 sm:px-8 py-6 sm:py-7 hover:bg-[#0e1a16]">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute right-[10%] top-[-60%] w-[40%] h-[200%] rounded-full bg-emerald-500/15 blur-3xl" />
              <p className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:block font-script text-[26px] leading-[1.05] text-emerald-300/70 -rotate-6 select-none whitespace-nowrap">Fans<br />Make a Difference</p>
            </div>
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-300/60 text-emerald-300 text-[11px] font-extrabold"><Megaphone className="w-3 h-3" /> EVENT</span>
                <p className="mt-2 text-[20px] sm:text-[24px] font-extrabold tracking-[-0.02em] break-keep">{campaign.title}</p>
                {campaign.description && <p className="mt-1 text-[13px] text-white/75 break-keep line-clamp-2">{campaign.description}</p>}
                {campaign.endAt && <p className="mt-1 text-[12px] text-white/60">{new Date(campaign.endAt).toLocaleDateString('ko-KR')}까지</p>}
              </div>
              <span className="shrink-0 h-11 px-5 inline-flex items-center gap-1.5 rounded-full border border-white/50 text-[13.5px] font-bold">이벤트 자세히 보기 <ArrowRight className="w-4 h-4" /></span>
            </div>
          </Link>
        </section>
      )}

      {!isAuthenticated && (
        <p className="max-w-[1180px] mx-auto px-5 mt-6 text-[12px] text-slate-500 inline-flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-500" /> 팬 계정으로 로그인하면 투표·응원·포인트가 내 활동으로 기록됩니다.</p>
      )}
    </div>
  );
}

function Panel({ title, to, children }: { title: string; to: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-[14.5px] font-extrabold truncate">{title}</h2>
        <Link to={to} className="shrink-0 text-[12px] font-bold text-slate-500 hover:text-emerald-700 inline-flex items-center">더보기 <ChevronRight className="w-3.5 h-3.5" /></Link>
      </div>
      {children}
    </section>
  );
}

function PanelEmpty({ icon: I, text, children }: { icon: any; text: string; children?: React.ReactNode }) {
  return (
    <div className="py-6 text-center">
      <span className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 inline-flex items-center justify-center"><I className="w-5 h-5" /></span>
      <p className="mt-2 text-[12.5px] text-slate-500 break-keep">{text}</p>
      {children}
    </div>
  );
}
