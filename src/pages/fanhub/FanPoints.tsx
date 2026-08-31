/**
 * 팬 참여 — 팬포인트 (리디자인 v2.0 시안 img_08)
 *
 * 보유 포인트 · 적립 경로 · 내가 올린 팬온도 · 최근 내역.
 * 모든 수치는 포인트 원장과 팬온도 원장에서 읽는다 (LEG-06 — 추정 금지).
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight, Coins, Loader2, MessageCircle, Megaphone,
  ShoppingBag, Thermometer, Vote as VoteIcon,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';

const EARN_CARDS = [
  { source: 'VOTE', icon: VoteIcon, title: '팬 VOTE', desc: '선수의 주요 순간에 투표하고 포인트를 받으세요.', to: '/fan/vote', cta: '투표하러 가기' },
  { source: 'COMMUNITY', icon: MessageCircle, title: '팬레터 · 커뮤니티', desc: '응원 메시지 작성, 댓글 참여 등 활동하고 포인트를 받으세요.', to: '/fan/community', cta: '참여하러 가기' },
  { source: 'BRAND_SUGGEST', icon: Megaphone, title: '브랜드 추천', desc: '선수를 후원하는 브랜드를 추천하고 포인트를 받으세요.', to: '/fan/community', cta: '추천하러 가기' },
  { source: 'STORE', icon: ShoppingBag, title: '팬스토어 구매', desc: '팬스토어에서 구매하면 구매금액의 1% 적립!', to: '/fan/store', cta: '팬스토어 가기' },
];

const REASON_LABEL: Record<string, string> = {
  FAN_ENGAGE_REWARD: '팬 참여 활동',
  VOTE_MICRO_REWARD: 'VOTE 참여 보상',
  VOTE_FINAL_REWARD: 'VOTE 정답 보상',
  REDEEM_GOODS: '포인트샵 사용',
  REDEEM_CANCEL_REFUND: '주문 취소 환불',
  DONATION_SEND: '후원 응모',
  POINT_TOPUP: '포인트 충전',
  ADMIN_GRANT: '운영 지급',
};

export default function FanPoints() {
  const navigate = useNavigate();
  const [engage, setEngage] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    (async () => {
      /* 적립 정책은 공개 API — 비로그인에서도 금액을 보여준다 */
      const r: any = await api.getFanEngageRules().catch(() => null);
      setRules(r?.data?.rules || []);
      try {
        const [e, h]: any[] = await Promise.all([
          api.getMyEngagement(),
          api.getMyPointHistory({ page: 1, pageSize: 8 }).catch(() => ({ data: null })),
        ]);
        setEngage(e?.data || null);
        setHistory(h?.data?.items || h?.data?.transactions || h?.data || []);
      } catch (err: any) {
        if (err?.response?.status !== 401) console.error('[FanPoints] 요약 조회 실패', err);
        setGuest(true);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
      </div>
    );
  }

  const rule = (s: string) => rules.find((r: any) => r.source === s);

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16">
      <PublicHeader />

      <div className="max-w-[1400px] mx-auto px-5 pt-6">
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[12.5px]">
          <Link to="/" className="text-slate-400 hover:text-slate-600">홈</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-400">팬 참여</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-emerald-700">팬포인트</span>
        </nav>

        <h1 className="mt-4 text-[26px] sm:text-[34px] font-black tracking-tight break-keep">
          내 응원이 쌓인 만큼, 선수의 기회도 커집니다
        </h1>
        <p className="mt-2.5 text-[13.5px] text-slate-500 break-keep">
          VOTE · 팬레터 · 커뮤니티 · 브랜드 추천 · 팬스토어 활동이 하나의 응원 기록으로 남습니다.
        </p>

        <div className="mt-6 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] gap-5 items-start">
          <div className="space-y-4">
            {/* 잔액 */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white p-6 sm:p-7">
              <p className="text-[13.5px] text-emerald-50">보유 팬포인트</p>
              {guest ? (
                <>
                  <p className="mt-2 text-[26px] sm:text-[32px] font-black">로그인하면 확인할 수 있어요</p>
                  <button
                    onClick={() => navigate(`/login?returnUrl=${encodeURIComponent('/fan/points')}`)}
                    className="mt-5 h-12 px-6 inline-flex items-center rounded-xl bg-white text-emerald-700 text-[14px] font-bold"
                  >
                    로그인하기
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-1.5 text-[40px] sm:text-[52px] font-black leading-none tabular-nums">
                    {(engage?.balance ?? 0).toLocaleString()}
                    <span className="text-[24px] sm:text-[30px] ml-0.5">P</span>
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link to="/shop" className="h-12 px-6 inline-flex items-center gap-2 rounded-xl bg-white text-emerald-700 text-[14px] font-bold">
                      <Coins className="w-4 h-4" /> 포인트 사용하기
                    </Link>
                    <Link to="/fan" className="h-12 px-6 inline-flex items-center rounded-xl border border-white/60 text-white text-[14px] font-bold hover:bg-white/10">
                      적립내역
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* 적립 경로 */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="text-[15px] font-extrabold">팬포인트 모으기</h2>
              <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {EARN_CARDS.map((c) => {
                  const r = rule(c.source);
                  return (
                    <div key={c.title} className="rounded-xl border border-slate-200 p-4 flex flex-col text-center">
                      <span className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                        <c.icon className="w-5 h-5 text-emerald-600" />
                      </span>
                      <p className="mt-3 text-[13.5px] font-extrabold">{c.title}</p>
                      <p className="mt-1 text-[17px] font-black text-emerald-600">
                        {c.source === 'STORE' ? '1%' : r?.points ? `+${r.points}P` : '적립'}
                      </p>
                      <p className="mt-1.5 flex-1 text-[11.5px] text-slate-500 break-keep">{c.desc}</p>
                      <Link
                        to={c.to}
                        className="mt-3 h-10 inline-flex items-center justify-center rounded-lg border border-emerald-600 text-emerald-700 text-[12.5px] font-bold hover:bg-emerald-50"
                      >
                        {c.cta}
                      </Link>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 pt-4 border-t border-slate-100 text-[11.5px] text-slate-400 break-keep">
                팬포인트는 현금이 아니며 SPONPIK 팬 참여 혜택에 사용됩니다.
              </p>
            </div>
          </div>

          {/* 우: 내 응원 기록 */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="text-[15px] font-extrabold">내가 올린 팬온도</h2>
              {!engage?.supported?.length ? (
                <div className="py-10 text-center">
                  <Thermometer className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="mt-3 text-[13px] text-slate-500 break-keep">
                    아직 기록된 응원이 없어요.<br />투표나 응원 글로 시작해 보세요.
                  </p>
                  <Link to="/fan/vote" className="mt-4 inline-flex h-11 px-5 items-center rounded-xl bg-emerald-600 text-white text-sm font-bold">
                    팬 VOTE 참여하기
                  </Link>
                </div>
              ) : (
                <ul className="mt-4 space-y-4">
                  {engage.supported.map((s: any) => (
                    <li key={s.athlete.id}>
                      <div className="flex items-center gap-3">
                        <span className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0">
                          {s.athlete.profileImageUrl && <img src={s.athlete.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                        </span>
                        <Link to={`/fan/community/${s.athlete.id}`} className="min-w-0 flex-1">
                          <p className="text-[14.5px] font-extrabold inline-flex items-center gap-1">
                            {s.athlete.name} <span className="text-[11.5px] font-bold text-slate-400">프로</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                          </p>
                          <p className="text-[11.5px] text-slate-400">{s.athlete.tour}</p>
                        </Link>
                        <div className="text-right shrink-0">
                          <p className="text-[11.5px] text-slate-400">내 기여</p>
                          <p className="text-[15px] font-black text-emerald-600">+{s.myCelsius.toFixed(1)}℃</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[11.5px] text-slate-400">총 팬온도</p>
                          <p className="text-[15px] font-black">{s.totalCelsius.toFixed(1)}℃</p>
                        </div>
                      </div>
                      {s.breakdown.length > 0 && (
                        <div className="mt-2 flex h-2 rounded-full overflow-hidden bg-slate-100">
                          {s.breakdown.map((b: any, i: number) => (
                            <span
                              key={b.source}
                              title={`${b.label} ${b.share}%`}
                              style={{ width: `${b.share}%` }}
                              className={['bg-emerald-500', 'bg-sky-500', 'bg-indigo-500', 'bg-violet-400', 'bg-amber-400'][i % 5]}
                            />
                          ))}
                        </div>
                      )}
                      {s.breakdown.length > 0 && (
                        <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          {s.breakdown.map((b: any) => (
                            <span key={b.source}>{b.label.replace(/ .*/, '')} {b.share}%</span>
                          ))}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 최근 내역 */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-extrabold">최근 포인트 내역</h2>
                <Link to="/fan" className="inline-flex items-center gap-1 text-[12.5px] font-bold text-slate-500 hover:text-emerald-700">
                  전체 내역 <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {!history.length ? (
                <p className="py-8 text-center text-[12.5px] text-slate-400">아직 내역이 없습니다</p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {history.slice(0, 8).map((t: any) => {
                    const delta = Number(t.delta ?? t.amount ?? 0);
                    return (
                      <li key={t.id} className="py-2.5 flex items-center gap-3">
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-bold truncate">
                            {t.description || REASON_LABEL[t.reason] || t.reason}
                          </span>
                          <span className="block text-[11.5px] text-slate-400">
                            {new Date(t.createdAt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </span>
                        <span className={`text-[13.5px] font-black tabular-nums shrink-0 ${delta >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {delta >= 0 ? '+' : ''}{delta.toLocaleString()}P
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
