/**
 * F01 팬참여 랜딩 — 팬보트 · 팬온도 · 팬포인트 · 팬스토어 4축 (핸드오프 §18.1)
 * 팬이 처음 보는 화면. "무엇을 하면 무엇이 돌아오는지"를 한 화면에서 알 수 있게 한다.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Vote, Thermometer, Coins, ShoppingBag, ArrowRight, Sparkles, Megaphone, Heart,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  SectionTitle, Card, Chip, TempBar, AthleteAvatar, Countdown,
  EmptyState, Skeleton, nf,
} from '../../components/fanhub/FanKit';

const ENTRY_ICON: Record<string, any> = {
  VOTE: Vote, TEMPERATURE: Thermometer, POINT: Coins, STORE: ShoppingBag,
};
const ENTRY_STYLE: Record<string, string> = {
  VOTE: 'from-[#EEF2FF] to-[#F5F3FF] text-indigo-600',
  TEMPERATURE: 'from-[#FFF1E7] to-[#FFE9EC] text-orange-600',
  POINT: 'from-[#ECFDF5] to-[#F0FDFA] text-emerald-600',
  STORE: 'from-[#FEF6E7] to-[#FFF1F2] text-amber-600',
};

export default function FanHub() {
  const nav = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFanHub()
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const entries = data?.entries || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* 히어로 — 팬 참여가 무엇인지 한 문장으로 */}
      <div className="relative overflow-hidden rounded-[28px] bg-slate-900 px-6 sm:px-10 py-9 sm:py-12 mb-8">
        <div className="absolute -right-16 -top-20 w-72 h-72 rounded-full blur-3xl opacity-40"
          style={{ background: 'radial-gradient(circle, #F2415B 0%, #7C5CFF 60%, transparent 70%)' }} />
        <div className="absolute -left-10 bottom-[-60px] w-56 h-56 rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, #FF9F5A 0%, transparent 70%)' }} />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold tracking-wide text-white/80 mb-4">
            <Sparkles className="w-3 h-3" /> FAN ENGAGEMENT
          </div>
          <h1 className="text-[28px] sm:text-[38px] font-extrabold text-white leading-[1.15] tracking-[-0.03em]">
            응원이 쌓이면<br />선수의 기회가 됩니다
          </h1>
          <p className="mt-3 text-[14px] sm:text-[15px] text-white/60 leading-relaxed max-w-md">
            투표하고, 이야기 나누고, 함께 만든 팬온도가 브랜드에게 선수를 소개합니다.
            참여한 만큼 팬포인트로 돌아옵니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/fan/vote"
              className="inline-flex items-center gap-1.5 h-11 px-5 rounded-2xl bg-white text-slate-900 text-[14px] font-bold hover:bg-slate-100 transition">
              지금 투표하기 <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/fan/activity"
              className="inline-flex items-center h-11 px-5 rounded-2xl bg-white/10 text-white text-[14px] font-bold hover:bg-white/20 transition">
              내 팬활동
            </Link>
          </div>
        </div>
      </div>

      {/* 4축 진입 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        {(loading ? Array.from({ length: 4 }) : entries).map((e: any, i: number) =>
          e ? (
            <Link key={e.key} to={e.to}
              className={`group rounded-3xl bg-gradient-to-br ${ENTRY_STYLE[e.key]} p-5 transition hover:-translate-y-0.5`}>
              <div className="w-9 h-9 rounded-2xl bg-white/70 flex items-center justify-center mb-3">
                {(() => { const I = ENTRY_ICON[e.key]; return <I className="w-[18px] h-[18px]" />; })()}
              </div>
              <div className="text-[15px] font-extrabold text-slate-900">{e.label}</div>
              <div className="text-[12px] font-semibold text-slate-500 mt-0.5">{e.sub}</div>
              <p className="mt-2.5 text-[12px] text-slate-500/90 leading-relaxed hidden sm:block">{e.desc}</p>
            </Link>
          ) : <Skeleton key={i} className="h-[150px] rounded-3xl" />,
        )}
      </div>

      {/* 지금 참여할 수 있는 투표 */}
      <section className="mb-10">
        <SectionTitle title="지금 참여할 수 있는 투표" sub="참여하면 팬포인트가 적립됩니다" to="/fan/vote" />
        {loading ? (
          <div className="space-y-2.5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[86px]" />)}</div>
        ) : data?.votes?.length ? (
          <div className="space-y-2.5">
            {data.votes.map((v: any) => (
              <Card key={v.id} as="link" to={`/fan/vote/${v.id}`} className="px-4 py-4">
                <div className="flex items-center gap-3.5">
                  {v.athlete ? <AthleteAvatar athlete={v.athlete} size={44} /> : (
                    <div className="w-11 h-11 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                      <Vote className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Chip size="xs" tone="violet">{v.typeLabel}</Chip>
                      <Countdown ms={new Date(v.closeAt).getTime() - Date.now()} />
                    </div>
                    <p className="text-[14px] font-bold text-slate-900 truncate">{v.title}</p>
                    <p className="text-[12px] text-slate-400 mt-0.5">
                      {v.athlete ? `${v.athlete.name} · ` : ''}{nf(v.participants)}명 참여
                    </p>
                  </div>
                  <span className="shrink-0 text-[12px] font-bold text-emerald-600 bg-emerald-50 rounded-full px-2.5 py-1">
                    +{v.earnPoints}P
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Vote className="w-5 h-5" />} title="진행 중인 투표가 없습니다"
            desc={'새로운 투표가 열리면 이곳에서 가장 먼저 알려드립니다.'} />
        )}
      </section>

      {/* 내가 응원하는 선수 */}
      <section className="mb-10">
        <SectionTitle title="내가 응원하는 선수" sub="팬들의 참여가 모여 만든 팬온도" />
        {loading ? (
          <Skeleton className="h-[104px]" />
        ) : data?.supported?.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.supported.map((s: any) => (
              <Card key={s.athlete.id} as="link" to={`/fan/temperature/${s.athlete.id}`} className="p-4">
                <div className="flex items-center gap-3 mb-3.5">
                  <AthleteAvatar athlete={s.athlete} size={40} />
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-slate-900 truncate">{s.athlete.name}</p>
                    <p className="text-[12px] text-slate-400 truncate">{s.athlete.tour || s.athlete.sportType || '선수'}</p>
                  </div>
                </div>
                <TempBar score={s.score} tier={s.tier?.label} lowSample={s.lowSample} />
                {s.weeklyDelta !== null && s.weeklyDelta !== undefined && (
                  <p className="mt-2 text-[11px] text-slate-400">
                    지난주 대비 {s.weeklyDelta > 0 ? '+' : ''}{s.weeklyDelta.toFixed(1)}℃
                  </p>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Heart className="w-5 h-5" />} title="아직 응원하는 선수가 없습니다"
            desc={'관심 선수를 등록하면 팬온도 변화를 함께 지켜볼 수 있습니다.'}
            action={
              <button onClick={() => nav('/athletes')}
                className="h-10 px-5 rounded-2xl bg-slate-900 text-white text-[13px] font-bold hover:bg-slate-800 transition">
                선수 둘러보기
              </button>
            } />
        )}
      </section>

      {/* 팬포인트 요약 */}
      {data?.points && (
        <section className="mb-10">
          <SectionTitle title="내 팬포인트" to="/fan/points" />
          <Card className="p-5">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[12px] font-semibold text-slate-400 mb-1">사용 가능</p>
                <p className="text-[34px] font-extrabold text-slate-900 tabular-nums leading-none tracking-[-0.03em]">
                  {nf(data.points.balance)}<span className="text-[18px] text-slate-400 ml-1">P</span>
                </p>
              </div>
              <div className="flex gap-2">
                <div className="rounded-2xl bg-slate-50 px-3.5 py-2.5 text-center min-w-[86px]">
                  <p className="text-[11px] text-slate-400 font-semibold">적립 예정</p>
                  <p className="text-[15px] font-bold text-slate-700 tabular-nums">{nf(data.points.pending)}P</p>
                </div>
                <div className="rounded-2xl bg-amber-50 px-3.5 py-2.5 text-center min-w-[86px]">
                  <p className="text-[11px] text-amber-600/80 font-semibold">30일 내 소멸</p>
                  <p className="text-[15px] font-bold text-amber-700 tabular-nums">{nf(data.points.expiringSoon)}P</p>
                </div>
              </div>
            </div>
            {data.points.nextBadge && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[12px] text-slate-500">
                  <b className="text-slate-800">{data.points.badge?.label}</b> · 다음 배지까지 {nf(data.points.nextBadge.remaining)}P
                </span>
                <Link to="/fan/points" className="text-[12px] font-bold text-slate-900">혜택 보기</Link>
              </div>
            )}
          </Card>
        </section>
      )}

      {/* 팬스토어 콜라보 */}
      {data?.collabs?.length > 0 && (
        <section className="mb-10">
          <SectionTitle title="선수 × 브랜드 스토어" sub="팬의 응원이 상품이 되는 곳" to="/fan/store" />
          <div className="grid sm:grid-cols-3 gap-3">
            {data.collabs.map((c: any) => (
              <Card key={c.id} as="link" to={`/fan/store`} className="overflow-hidden">
                <div className="aspect-[16/10] bg-slate-100">
                  {c.heroImageUrl && <img src={c.heroImageUrl} alt={c.title} className="w-full h-full object-cover" />}
                </div>
                <div className="p-4">
                  <p className="text-[14px] font-bold text-slate-900 line-clamp-1">{c.title}</p>
                  {c.athlete && <p className="text-[12px] text-slate-400 mt-1">{c.athlete.name}</p>}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 연말 캠페인 */}
      {data?.campaign && (
        <Link to="/fan/campaign"
          className="block rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5 hover:border-slate-300 transition">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-slate-900">{data.campaign.title}</p>
              <p className="text-[12px] text-slate-400 mt-0.5 line-clamp-1">{data.campaign.description}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
          </div>
        </Link>
      )}
    </div>
  );
}
