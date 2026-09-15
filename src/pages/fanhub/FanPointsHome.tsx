/**
 * F09 팬포인트 메인 `/fan/points` — 시안 2026-09-15 (Desktop · Mobile)
 *
 *  히어로(어두운 톤 · 내 포인트 카드: 잔액·등급·다음 등급까지 진행바) → 요약 4칸(내 포인트/적립내역/사용내역/등급 혜택)
 *  → 팬포인트 적립 방법(서버 규칙표 EARN_RULES) · 팬포인트 사용처(SPEND_RULES; 미구축은 "준비 중" 비활성)
 *  → 최근 포인트 내역 5건 → 꼭 확인하세요 + 이용약관.
 *  값은 서버 원장 그대로. 비로그인은 정책표(`/fan-hub/meta`)만 보여주고 로그인으로 유도한다.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, ChevronRight, Coins, Crown, FileText, Gift, Heart, Info, Layers, Lightbulb, Lock,
  Megaphone, MessageCircle, ShoppingBag, Sparkles, Star, Ticket, Users, Vote,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Skeleton, nf } from '../../components/fanhub/FanKit';

/** 적립 규칙 코드 → 아이콘·이동 경로 (규칙 자체는 서버 표) */
const EARN_META: Record<string, { icon: any; tone: string; to: string }> = {
  VOTE: { icon: Vote, tone: 'bg-violet-50 text-violet-600', to: '/fan/vote' },
  VOTE_CORRECT: { icon: Star, tone: 'bg-amber-50 text-amber-600', to: '/fan/vote' },
  VOTE_HOST: { icon: Sparkles, tone: 'bg-emerald-50 text-emerald-600', to: '/fan/vote/create' },
  COMMENT: { icon: MessageCircle, tone: 'bg-sky-50 text-sky-600', to: '/fan/community' },
  POST: { icon: MessageCircle, tone: 'bg-sky-50 text-sky-600', to: '/fan/community' },
  FAVORITE: { icon: Heart, tone: 'bg-rose-50 text-rose-500', to: '/athletes/search' },
  BRAND_SUGGEST: { icon: Lightbulb, tone: 'bg-amber-50 text-amber-600', to: '/fan/community' },
  BRAND_ADOPTED: { icon: Lightbulb, tone: 'bg-amber-50 text-amber-600', to: '/fan/community' },
  STORE_PURCHASE: { icon: ShoppingBag, tone: 'bg-orange-50 text-orange-500', to: '/fan/store' },
};
/** 시안에 있으나 아직 없는 적립 경로 — 비활성으로 정직하게 표시 */
const EARN_SOON = [
  { icon: Users, label: '친구 초대', desc: '친구를 초대하면 추가 적립' },
  { icon: Gift, label: '이벤트 참여', desc: '다양한 이벤트에 참여하고 적립' },
];

const SPEND_META: Record<string, { icon: any; tone: string; to?: string; title?: string; desc?: string }> = {
  STORE_DISCOUNT: { icon: Ticket, tone: 'bg-violet-500', to: '/fan/store', title: '팬스토어 할인', desc: '포인트로 할인 쿠폰 교환' },
  YEAR_END_AD: { icon: Megaphone, tone: 'bg-emerald-500', to: '/fan/campaign', title: '연말 응원광고 프로젝트', desc: '팬 기여도 조건 충족 시 자동 응모' },
  VOTE_BADGE: { icon: Star, tone: 'bg-sky-500', title: 'VOTE 특별 배지', desc: '결과에 영향 없는 장식 배지' },
  FAN_PROJECT: { icon: Heart, tone: 'bg-rose-500', title: '선수 응원 프로젝트', desc: '포인트 기부형 응원' },
};
const SPEND_SOON = [{ icon: Gift, tone: 'bg-orange-400', title: '굿즈 응모', desc: '한정판 굿즈에 응모하기' }];

const KIND_LABEL: Record<string, { label: string; cls: string; sign: string }> = {
  EARN: { label: '적립', cls: 'text-emerald-600', sign: '+' }, PENDING: { label: '적립 예정', cls: 'text-slate-500', sign: '+' },
  SPEND: { label: '사용', cls: 'text-rose-500', sign: '' }, EXPIRE: { label: '만료', cls: 'text-slate-400', sign: '' }, REVERSE: { label: '회수', cls: 'text-rose-500', sign: '' },
};

export default function FanPointsHome() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);
  const [counts, setCounts] = useState<{ earn: number | null; spend: number | null }>({ earn: null, spend: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const jobs: Promise<any>[] = [api.getFanMeta().then((r: any) => setMeta(r?.data || null)).catch(() => null)];
    if (isAuthenticated) {
      jobs.push(api.getMyFanPoints().then((r: any) => setData(r?.data || null)).catch(() => setData(null)));
      jobs.push(Promise.all([
        api.getMyPointLedger({ kind: 'EARN', limit: 1 }).then((r: any) => r?.data?.total ?? null).catch(() => null),
        api.getMyPointLedger({ kind: 'SPEND', limit: 1 }).then((r: any) => r?.data?.total ?? null).catch(() => null),
      ]).then(([earn, spend]) => setCounts({ earn, spend })));
    }
    Promise.all(jobs).finally(() => setLoading(false));
  }, [isAuthenticated]);

  const earnRules: any[] = data?.earnRules || meta?.earnRules || [];
  const spendRules: any[] = data?.spendRules || meta?.spendRules || [];
  const expiryMonths = meta?.pointExpiryMonths ?? 12;
  const badge = data?.badge;
  const next = data?.nextBadge;
  const progress = useMemo(() => (data && next ? Math.max(4, Math.min(100, Math.round((data.balance / Math.max(1, next.min)) * 100))) : 100), [data, next]);
  const loginTo = `/login?returnUrl=${encodeURIComponent('/fan/points')}`;

  return (
    <div className="min-h-screen bg-[#f3faf6] text-slate-900 pb-16">
      <PublicHeader />

      {/* ── 히어로 ── */}
      <section className="relative overflow-hidden bg-[#0a1411] text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[-30%] w-[55%] h-[120%] rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute right-[-10%] bottom-[-40%] w-[50%] h-[120%] rounded-full bg-teal-400/15 blur-3xl" />
          <p className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block font-script text-[30px] leading-[1.05] text-emerald-300/70 -rotate-6 select-none whitespace-nowrap">Fans Make<br />Sports Better</p>
          <p className="absolute right-8 bottom-4 hidden lg:block text-[10px] font-extrabold tracking-[0.25em] text-white/25">SPONPIK</p>
        </div>
        <div className="max-w-[1180px] mx-auto px-5 pt-5 pb-9 sm:pb-12 relative">
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[13px] text-white/60">
            <Link to="/" className="hover:text-white">홈</Link><ChevronRight className="w-3.5 h-3.5" />
            <Link to="/fan" className="hover:text-white">팬 참여</Link><ChevronRight className="w-3.5 h-3.5" />
            <span className="font-bold text-emerald-300">팬포인트</span>
          </nav>
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6 items-center">
            <div>
              <p className="text-[13px] font-extrabold tracking-[0.18em] text-emerald-300">FAN POINTS</p>
              <h1 className="mt-2 text-[30px] sm:text-[44px] font-extrabold tracking-[-0.03em] leading-[1.2] break-keep">참여할수록 쌓이는<br /><span className="text-emerald-300">팬포인트</span></h1>
              <p className="mt-4 text-[14px] sm:text-[15.5px] text-white/80 leading-relaxed break-keep max-w-md">투표, 응원, 커뮤니티 활동, 팬스토어 참여까지 당신의 응원이 더 특별한 가치를 만듭니다. 지금, 팬포인트로 더 가까운 응원을 경험하세요.</p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <a href="#spend" className="h-12 px-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-400 text-slate-900 text-[14.5px] font-extrabold hover:bg-emerald-300">포인트 사용처 보기 <ArrowRight className="w-4 h-4" /></a>
                <Link to={isAuthenticated ? '/fan/points/ledger' : loginTo} className="h-12 px-6 inline-flex items-center gap-1.5 rounded-full border border-white/40 text-white text-[14.5px] font-bold hover:bg-white/10">적립내역 보기</Link>
              </div>
            </div>

            {/* 내 포인트 카드 */}
            <div className="rounded-2xl border border-emerald-300/30 bg-white/5 backdrop-blur p-5">
              {isAuthenticated ? (
                loading && !data ? <Skeleton className="h-[150px] bg-white/10" /> : data ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[12.5px] text-white/70">내 포인트</p>
                        <p className="mt-1 text-[36px] font-black tabular-nums leading-none">{nf(data.balance)} <span className="text-[16px] font-bold text-white/70">P</span></p>
                        {(data.pending > 0 || data.expiringSoon > 0) && (
                          <p className="mt-2 flex flex-wrap gap-1.5 text-[11.5px]">
                            {data.pending > 0 && <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80">적립 예정 {nf(data.pending)}P</span>}
                            {data.expiringSoon > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200">30일 내 소멸 {nf(data.expiringSoon)}P</span>}
                          </p>
                        )}
                      </div>
                      <span className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-slate-900 font-black text-[22px] inline-flex items-center justify-center shadow-[0_10px_24px_-10px_rgba(245,158,11,0.8)] shrink-0">P</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[12.5px] font-extrabold"><Crown className="w-3.5 h-3.5 text-amber-300" /> {badge?.label || '팬스타터'}</span>
                        <span className="text-[12px] text-white/70">{next ? <>다음 등급까지 <b className="text-white tabular-nums">{nf(next.remaining)}P</b></> : '최고 등급'}</span>
                      </div>
                      <div className="mt-2.5 h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${progress}%` }} /></div>
                      <div className="mt-1.5 flex justify-between text-[11.5px] text-white/60 tabular-nums"><span>현재 {nf(data.balance)}P</span>{next && <span>다음 등급 {nf(next.min)}P</span>}</div>
                    </div>
                  </>
                ) : <p className="text-[13px] text-white/70">포인트 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>
              ) : (
                <>
                  <p className="text-[14px] font-extrabold inline-flex items-center gap-2"><Lock className="w-4 h-4 text-emerald-300" /> 로그인하고 내 포인트를 확인하세요</p>
                  <ul className="mt-3 space-y-1.5 text-[12.5px] text-white/80">
                    {['보유 포인트와 등급 진행 상황', '적립 예정 · 소멸 예정 포인트', '전체 적립 · 사용 내역'].map((t) => <li key={t} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{t}</li>)}
                  </ul>
                  <Link to={loginTo} className="mt-4 h-11 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-400 text-slate-900 text-[13.5px] font-extrabold">로그인하고 시작하기 <ArrowRight className="w-4 h-4" /></Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1180px] mx-auto px-5">
        {/* ── 요약 4칸 ── */}
        {isAuthenticated && (
          <div className="-mt-5 relative grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              { icon: Coins, tone: 'bg-amber-100 text-amber-600', l: '내 포인트', v: data ? `${nf(data.balance)} P` : '—', to: '/fan/points/ledger' },
              { icon: BarChart3, tone: 'bg-emerald-100 text-emerald-600', l: '적립내역', v: counts.earn != null ? `${nf(counts.earn)} 건` : '—', to: '/fan/points/ledger?kind=EARN' },
              { icon: Layers, tone: 'bg-rose-100 text-rose-500', l: '사용내역', v: counts.spend != null ? `${nf(counts.spend)} 건` : '—', to: '/fan/points/ledger?kind=SPEND' },
              { icon: Crown, tone: 'bg-amber-100 text-amber-600', l: '등급 혜택', v: badge?.label || '—', to: '#benefit' },
            ].map((c) => {
              const I = c.icon;
              const inner = (
                <>
                  <span className={`w-11 h-11 rounded-xl inline-flex items-center justify-center shrink-0 ${c.tone}`}><I className="w-5 h-5" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[12px] text-slate-500">{c.l}</span><span className="block text-[15px] sm:text-[20px] font-extrabold tabular-nums leading-tight truncate">{loading ? "—" : c.v}</span></span>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </>
              );
              const cls = 'rounded-2xl bg-white border border-slate-200 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] px-4 py-3.5 flex items-center gap-3 hover:border-emerald-300';
              return c.to.startsWith('#') ? <a key={c.l} href={c.to} className={cls}>{inner}</a> : <Link key={c.l} to={c.to} className={cls}>{inner}</Link>;
            })}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
          {/* ── 적립 방법 ── */}
          <section>
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[19px] font-extrabold tracking-[-0.02em]">팬포인트 적립 방법</h2>
                <p className="mt-1 text-[13px] text-slate-500">다양한 활동으로 포인트를 적립하고, 더 큰 혜택을 받아보세요.</p>
              </div>
              <Link to="/fan" className="shrink-0 text-[12.5px] font-bold text-slate-500 hover:text-emerald-700 inline-flex items-center">전체보기 <ChevronRight className="w-3.5 h-3.5" /></Link>
            </div>
            <ul className="mt-3 grid sm:grid-cols-2 gap-2.5">
              {earnRules.map((r: any) => {
                const m = EARN_META[r.code] || { icon: Coins, tone: 'bg-slate-100 text-slate-600', to: '/fan' };
                const I = m.icon;
                return (
                  <li key={r.code}>
                    <Link to={m.to} className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200 px-4 py-3.5 hover:border-emerald-300">
                      <span className={`w-11 h-11 rounded-xl inline-flex items-center justify-center shrink-0 ${m.tone}`}><I className="w-5 h-5" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-extrabold truncate">{r.label}</span>
                        <span className="block text-[11.5px] text-slate-500 truncate">{r.limit}{r.confirm === 'INSTANT' ? ' · 즉시' : ' · 확인 후 지급'}</span>
                      </span>
                      <span className="shrink-0 text-[14px] font-extrabold text-emerald-600 tabular-nums">{r.rate ? `${Math.round(r.rate * 100)}%` : `+${r.points}P`}</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    </Link>
                  </li>
                );
              })}
              {EARN_SOON.map((s) => {
                const I = s.icon;
                return (
                  <li key={s.label} className="flex items-center gap-3 rounded-2xl bg-white border border-dashed border-slate-200 px-4 py-3.5 opacity-70" aria-disabled>
                    <span className="w-11 h-11 rounded-xl inline-flex items-center justify-center shrink-0 bg-slate-100 text-slate-400"><I className="w-5 h-5" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-[14px] font-extrabold text-slate-500">{s.label}</span><span className="block text-[11.5px] text-slate-400">{s.desc}</span></span>
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">준비 중</span>
                  </li>
                );
              })}
            </ul>

            {/* ── 최근 내역 ── */}
            {isAuthenticated && (
              <div className="mt-8">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-[19px] font-extrabold tracking-[-0.02em]">최근 포인트 내역</h2>
                    <p className="mt-1 text-[13px] text-slate-500">최근 5개의 내역을 확인할 수 있습니다.</p>
                  </div>
                  <Link to="/fan/points/ledger" className="shrink-0 text-[12.5px] font-bold text-slate-500 hover:text-emerald-700 inline-flex items-center">전체보기 <ChevronRight className="w-3.5 h-3.5" /></Link>
                </div>
                <div className="mt-3 rounded-2xl bg-white border border-slate-200 overflow-hidden">
                  {loading ? <Skeleton className="h-[180px]" /> : data?.recent?.length ? (
                    <table className="w-full text-[13px]">
                      <thead><tr className="bg-slate-50 text-[12px] text-slate-500"><th className="px-4 py-2.5 text-left font-bold">일시</th><th className="px-3 py-2.5 text-left font-bold">내용</th><th className="px-3 py-2.5 text-center font-bold">구분</th><th className="px-4 py-2.5 text-right font-bold">포인트</th></tr></thead>
                      <tbody>
                        {data.recent.map((t: any) => {
                          const k = KIND_LABEL[t.kind] || KIND_LABEL.EARN;
                          return (
                            <tr key={t.id} className="border-t border-slate-100">
                              <td className="px-4 py-3 text-slate-500 tabular-nums whitespace-nowrap">{new Date(t.createdAt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}</td>
                              <td className="px-3 py-3 font-semibold text-slate-800 break-keep">{t.label}</td>
                              <td className={`px-3 py-3 text-center font-bold ${k.cls}`}>{k.label}</td>
                              <td className={`px-4 py-3 text-right font-extrabold tabular-nums ${k.cls}`}>{t.amount > 0 ? '+' : ''}{nf(t.amount)}P</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : <p className="py-10 text-center text-[13px] text-slate-500">아직 포인트 내역이 없습니다. 투표나 응원에 참여하면 적립됩니다.</p>}
                </div>
              </div>
            )}
          </section>

          {/* ── 사용처 ── */}
          <section id="spend" className="scroll-mt-24">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[19px] font-extrabold tracking-[-0.02em]">팬포인트 사용처</h2>
                <p className="mt-1 text-[13px] text-slate-500">적립한 포인트로 더 특별한 경험을 즐겨보세요.</p>
              </div>
              <Link to="/fan/store" className="shrink-0 text-[12.5px] font-bold text-slate-500 hover:text-emerald-700 inline-flex items-center">전체보기 <ChevronRight className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {[...spendRules.filter((r: any) => r.code !== 'CASH').map((r: any) => ({ code: r.code, available: !!r.available, ...(SPEND_META[r.code] || { icon: Coins, tone: 'bg-slate-400', title: r.label, desc: r.desc }) })),
                ...SPEND_SOON.map((s) => ({ code: s.title, available: false, ...s }))].map((c: any) => {
                const I = c.icon;
                const active = c.available && c.to;
                const body = (
                  <>
                    <span className={`w-11 h-11 rounded-xl inline-flex items-center justify-center text-white shrink-0 ${active ? c.tone : 'bg-slate-300'}`}><I className="w-5 h-5" /></span>
                    <span className="block mt-3 text-[14.5px] font-extrabold break-keep">{c.title}</span>
                    <span className="block mt-0.5 text-[12px] text-slate-500 break-keep">{c.desc}</span>
                    {active ? <ChevronRight className="absolute right-3 top-3 w-4 h-4 text-slate-300" /> : <span className="absolute right-3 top-3 px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">준비 중</span>}
                  </>
                );
                return active
                  ? <Link key={c.code} to={c.to} className="relative rounded-2xl bg-white border border-slate-200 p-4 hover:border-emerald-300">{body}</Link>
                  : <div key={c.code} className="relative rounded-2xl bg-white border border-dashed border-slate-200 p-4 opacity-70" aria-disabled>{body}</div>;
              })}
            </div>

            {/* ── 등급 혜택 ── */}
            <div id="benefit" className="mt-6 rounded-2xl bg-white border border-slate-200 p-4 scroll-mt-24">
              <p className="text-[14.5px] font-extrabold inline-flex items-center gap-1.5"><Crown className="w-4 h-4 text-amber-500" /> 등급 혜택</p>
              <ul className="mt-2.5 grid grid-cols-2 gap-2">
                {(meta?.badges || []).map((b: any) => {
                  const on = badge?.code === b.code;
                  return (
                    <li key={b.code} className={`rounded-xl border px-3.5 py-3 ${on ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'}`}>
                      <p className="text-[13.5px] font-extrabold inline-flex items-center gap-1.5">{b.label}{on && <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10.5px]">현재</span>}</p>
                      <p className="text-[12px] text-slate-500 tabular-nums">{b.min > 0 ? `${nf(b.min)}P 이상` : '가입 시'}</p>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[12px] text-slate-500 break-keep">등급별 추가 혜택(전용 배지·우선 응모)은 준비 중입니다. 현재는 등급 표시만 제공합니다.</p>
            </div>

            {/* ── 꼭 확인하세요 ── */}
            <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-4">
              <p className="text-[14.5px] font-extrabold inline-flex items-center gap-1.5"><Info className="w-4 h-4 text-sky-500" /> 꼭 확인하세요!</p>
              <ul className="mt-2.5 space-y-1.5 text-[12.5px] text-slate-600">
                {[
                  '팬포인트는 SPONPIK 내 다양한 활동을 통해 적립할 수 있습니다.',
                  '적립된 포인트는 팬스토어 할인 등 SPONPIK 팬 참여 혜택에만 사용할 수 있습니다.',
                  `포인트의 유효기간은 적립일로부터 ${expiryMonths}개월입니다.`,
                  '부정한 방법으로 적립한 포인트는 사전 안내 없이 회수될 수 있습니다.',
                  data?.notice || '팬포인트는 현금이 아니며 현금 전환과 타인 양도는 불가합니다.',
                ].map((t) => <li key={t} className="flex items-start gap-1.5 break-keep"><span className="w-1 h-1 rounded-full bg-slate-400 mt-2 shrink-0" />{t}</li>)}
              </ul>
              <Link to="/terms" className="mt-3 inline-flex h-9 px-3.5 items-center gap-1.5 rounded-lg border border-slate-200 text-[12.5px] font-bold text-slate-700 hover:border-slate-400"><FileText className="w-3.5 h-3.5" /> 이용약관 보기</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
