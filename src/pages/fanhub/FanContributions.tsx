/**
 * F08 내 응원이 만든 변화 `/fan/contributions` — 시안 2026-09-15 (리디자인/9 · 19)
 *
 *  좌: 내가 응원하는 선수 목록(기여도 레벨 · 진행 막대) + "기여도는 금액이 아닌…" 안내
 *  중: 선택한 선수 카드(함께한 기간) → 활동 다양성(도넛 n/4) · 지속성(링 n주) · 나의 활동 기여(VOTE/게시글·댓글/스토어·후원/브랜드 추천)
 *     → 다음 목표(실제 미충족 조건에서 계산) → 응원 이어가기
 *  우: 연말 팬 감사 이벤트 참여 현황(활동 다양성 · 지속성 · 응원 편지)
 *  기여도 점수(0~100)는 서버 산식(다양성 40 · 지속성 30 · 편지 20 · 미션 10)의 값 그대로.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Check, CheckCircle2, Flag, Gift, Heart, HelpCircle, Lightbulb, Mail, Megaphone, MessageSquare, ShoppingBag,
  Sparkles, Star, Vote,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { AthleteAvatar, Skeleton, nf } from '../../components/fanhub/FanKit';
import { FanPage, Container, FanCrumb, BackButton, Panel, fmtDate } from '../../components/fanhub/FanShell';

const AREA_ICON = [Vote, MessageSquare, ShoppingBag, Megaphone];

/** 도넛 — 4칸 중 n칸 채움 */
function Donut({ have, need, label }: { have: number; need: number; label: string }) {
  const r = 46, c = 2 * Math.PI * r, seg = c / need, gap = 4;
  return (
    <div className="relative w-[128px] h-[128px] mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        {Array.from({ length: need }).map((_, i) => (
          <circle key={i} cx="60" cy="60" r={r} fill="none" strokeWidth="14" strokeLinecap="butt"
            stroke={i < have ? '#059669' : '#e2e8f0'} strokeDasharray={`${seg - gap} ${c - seg + gap}`} strokeDashoffset={-i * seg} />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[22px] font-black tabular-nums leading-none">{have} <span className="text-[13px] text-slate-500 font-bold">/ {need}</span></p>
        <p className="mt-1 text-[11px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function Ring({ have, need }: { have: number; need: number }) {
  const r = 46, c = 2 * Math.PI * r;
  return (
    <div className="relative w-[128px] h-[128px] mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="14" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#059669" strokeWidth="14" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, have / need))} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[30px] font-black tabular-nums leading-none">{have}</p>
        <p className="mt-1 text-[11px] text-slate-500">주 연속</p>
      </div>
    </div>
  );
}

export default function FanContributions() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    api.getMyContributions().then((r) => { setData(r.data); setSel(r.data?.contributions?.[0]?.athlete?.id ?? null); })
      .catch(() => setData(null)).finally(() => setLoading(false));
  }, [isAuthenticated]);

  const list: any[] = data?.contributions || [];
  const cur = useMemo(() => list.find((c) => c.athlete.id === sel) || list[0], [list, sel]);

  /* 다음 목표 — 실제로 미충족인 조건 중 가장 가까운 것 */
  const nextGoal = useMemo(() => {
    if (!cur) return null;
    if (cur.streakWeeks < 4) return { text: <>{4 - cur.streakWeeks}주 더 연속 활동하면 <b className="text-emerald-700">지속성 조건</b>을 채울 수 있어요!</> };
    if (cur.diversity < 4) return { text: <>{4 - cur.diversity}개 영역에서 더 활동하면 <b className="text-emerald-700">활동 다양성</b>을 모두 채울 수 있어요!</> };
    if (cur.letters < 1) return { text: <>응원 편지를 1통 보내면 <b className="text-emerald-700">연말 이벤트 참여 조건</b>이 모두 충족돼요!</> };
    return { text: <>연말 팬 감사 이벤트 참여 조건을 <b className="text-emerald-700">모두 충족</b>했어요. 꾸준히 이어가 주세요!</> };
  }, [cur]);

  const crumbs = [{ label: '팬 참여', to: '/fan' }, { label: '내 팬활동', to: '/fan/activity' }, { label: '기여도' }];

  return (
    <FanPage>
      <Container className="pt-5">
        <div className="flex flex-wrap items-center gap-3"><BackButton to="/fan/activity" /><FanCrumb items={crumbs} /></div>
        <h1 className="mt-5 text-[28px] sm:text-[36px] font-extrabold tracking-[-0.03em] leading-tight">내 응원이 만든 변화</h1>
        <p className="mt-1.5 text-[14.5px] text-slate-600 break-keep">당신의 작은 활동이 선수에게 큰 힘이 되고 있어요.</p>

        {!isAuthenticated ? (
          <Panel className="mt-6 max-w-lg text-center py-10">
            <p className="text-[16px] font-extrabold">로그인하면 선수별 기여도를 볼 수 있어요</p>
            <p className="mt-1.5 text-[13px] text-slate-500 break-keep">투표·커뮤니티·스토어·브랜드 추천 활동이 선수별로 쌓입니다.</p>
            <Link to={`/login?returnUrl=${encodeURIComponent('/fan/contributions')}`} className="mt-5 inline-flex h-11 px-6 rounded-xl bg-emerald-600 text-white text-[14px] font-bold items-center">로그인하기</Link>
          </Panel>
        ) : loading ? (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_300px] gap-4"><Skeleton className="h-[360px] rounded-3xl" /><Skeleton className="h-[460px] rounded-3xl" /><Skeleton className="h-[360px] rounded-3xl" /></div>
        ) : !list.length ? (
          <Panel className="mt-6 max-w-lg text-center py-10">
            <span className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 inline-flex items-center justify-center"><Heart className="w-6 h-6" /></span>
            <p className="mt-3 text-[16px] font-extrabold">아직 기여 기록이 없습니다</p>
            <p className="mt-1.5 text-[13px] text-slate-500 break-keep">투표하거나 커뮤니티에 응원을 남기면 선수별 기여도가 이곳에 쌓입니다.</p>
            <div className="mt-5 flex justify-center gap-2">
              <Link to="/fan/vote" className="h-11 px-5 rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold inline-flex items-center">투표 둘러보기</Link>
              <Link to="/fan/community" className="h-11 px-5 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13.5px] font-bold inline-flex items-center">커뮤니티 가기</Link>
            </div>
          </Panel>
        ) : (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_300px] gap-4 items-start">
            {/* ── 좌: 내가 응원하는 선수 ── */}
            <aside className="space-y-3">
              <p className="text-[15px] font-extrabold inline-flex items-center gap-1.5"><Heart className="w-4 h-4 text-rose-500 fill-current" /> 내가 응원하는 선수</p>
              {list.map((c) => {
                const on = c.athlete.id === cur?.athlete.id;
                return (
                  <button key={c.athlete.id} type="button" onClick={() => setSel(c.athlete.id)} aria-pressed={on}
                    className={`w-full text-left rounded-2xl border-2 bg-white p-4 transition ${on ? 'border-emerald-500 shadow-[0_10px_30px_-18px_rgba(16,185,129,0.6)]' : 'border-slate-200 hover:border-slate-400'}`}>
                    <div className="flex items-center gap-3">
                      <AthleteAvatar athlete={c.athlete} size={56} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-extrabold">{c.athlete.name} 프로</p>
                        <span className={`mt-1 inline-flex px-2 h-6 items-center rounded-md text-[11.5px] font-bold border ${c.level >= 3 ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : c.level === 2 ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>{c.levelLabel}</span>
                      </div>
                      {on && <span className="w-6 h-6 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5" strokeWidth={3} /></span>}
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-[20px] font-black text-emerald-700 tabular-nums leading-none">{Math.round(c.score)}<span className="text-[12px]">%</span></span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(100, c.score)}%` }} /></div>
                    </div>
                    <p className="mt-1 text-[11.5px] text-slate-500">나의 기여도 레벨</p>
                  </button>
                );
              })}
              <div className="rounded-2xl bg-white border border-slate-200 p-4 flex gap-3">
                <span className="w-9 h-9 rounded-full bg-amber-50 text-amber-500 inline-flex items-center justify-center shrink-0"><Lightbulb className="w-4 h-4" /></span>
                <div className="min-w-0">
                  <p className="text-[13px] font-extrabold break-keep">기여도는 금액이 아닌<br />다양한 응원 활동을 종합해 산정돼요.</p>
                  <p className="mt-1 text-[12px] text-slate-500 break-keep">구매 금액이 많다고 해서 기여도가 높아지지 않아요.</p>
                </div>
              </div>
            </aside>

            {/* ── 중: 선택 선수 ── */}
            {cur && (
              <section className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
                <div className="p-5 flex items-center gap-4">
                  <span className="rounded-full ring-4 ring-emerald-50"><AthleteAvatar athlete={cur.athlete} size={72} /></span>
                  <div className="min-w-0">
                    <p className="text-[20px] font-extrabold inline-flex flex-wrap items-center gap-2">{cur.athlete.name} 프로 <span className="px-2 h-6 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-700 text-[11.5px] font-bold inline-flex items-center">{cur.levelLabel}</span></p>
                    <p className="mt-1 text-[12.5px] text-slate-500 inline-flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-500 fill-current" /> 함께한 기간 {cur.firstActiveAt ? `${fmtDate(cur.firstActiveAt, { year: '2-digit', month: '2-digit', day: '2-digit' })} ~ 현재` : '집계 중'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-slate-100 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                  <div className="p-5 text-center">
                    <p className="text-[13.5px] font-extrabold inline-flex items-center gap-1">활동 다양성 <HelpCircle className="w-3.5 h-3.5 text-slate-400" /></p>
                    <div className="mt-4"><Donut have={cur.diversity} need={cur.diversityMax} label="활동 영역" /></div>
                    <div className="mt-3 flex justify-center gap-1.5">{AREA_ICON.map((I, i) => <span key={i} className={`w-7 h-7 rounded-lg inline-flex items-center justify-center ${i < cur.diversity ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}><I className="w-3.5 h-3.5" /></span>)}</div>
                    <p className="mt-2.5 text-[12px] text-slate-600 break-keep">{cur.diversityMax}가지 영역 중 {cur.diversity}개 영역에서 활동하고 있어요!</p>
                  </div>
                  <div className="p-5 text-center">
                    <p className="text-[13.5px] font-extrabold inline-flex items-center gap-1">지속성 <HelpCircle className="w-3.5 h-3.5 text-slate-400" /></p>
                    <div className="mt-4"><Ring have={cur.streakWeeks} need={cur.streakMax} /></div>
                    <p className="mt-2 text-[12.5px] font-bold">{cur.streakWeeks >= cur.streakMax ? `연속 ${cur.streakWeeks}주 활동 중!` : `최근 ${cur.streakMax}주 중 ${cur.streakWeeks}주 활동`}</p>
                    <div className="mt-2 flex justify-center gap-1.5">{Array.from({ length: cur.streakMax }).map((_, i) => <span key={i} className={`w-5 h-5 rounded-full inline-flex items-center justify-center ${i < cur.streakWeeks ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-300'}`}><Check className="w-3 h-3" strokeWidth={3} /></span>)}</div>
                    <p className="mt-2 text-[11.5px] text-slate-500 break-keep">이번 주도 활동하면 더 유지돼요.</p>
                  </div>
                  <div className="p-5">
                    <p className="text-[13.5px] font-extrabold inline-flex items-center gap-1">나의 활동 기여 <HelpCircle className="w-3.5 h-3.5 text-slate-400" /></p>
                    <ul className="mt-3 space-y-2">
                      {[
                        { icon: Vote, k: 'VOTE 참여', v: cur.counts.vote }, { icon: MessageSquare, k: '게시글 · 댓글 참여', v: cur.counts.post },
                        { icon: ShoppingBag, k: '스토어 · 후원 활동', v: cur.counts.store }, { icon: Megaphone, k: '브랜드 추천', v: cur.counts.recommend },
                      ].map((x) => { const I = x.icon; return (
                        <li key={x.k} className="rounded-xl bg-slate-50 px-3 py-2.5 flex items-center gap-2.5 text-[12.5px]"><I className="w-4 h-4 text-slate-500 shrink-0" /><span className="flex-1 font-bold text-slate-700">{x.k}</span><span className="font-black tabular-nums text-emerald-700">{nf(x.v)}</span></li>
                      ); })}
                    </ul>
                    <p className="mt-2 text-[11px] text-slate-500 inline-flex items-center gap-1"><Mail className="w-3 h-3" /> 응원 편지 {nf(cur.letters)}통</p>
                  </div>
                </div>
                {nextGoal && (
                  <div className="mx-5 mb-4 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3.5 flex items-center gap-3">
                    <Flag className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="min-w-0"><p className="text-[11.5px] font-bold text-emerald-700">다음 목표</p><p className="text-[13.5px] break-keep">{nextGoal.text}</p></div>
                  </div>
                )}
                <div className="px-5 pb-5">
                  <Link to={`/fan/community/${cur.athlete.id}`} className="h-12 w-full rounded-xl bg-emerald-600 text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 hover:bg-emerald-700"><Heart className="w-4 h-4 fill-current" /> 응원 이어가기</Link>
                </div>
              </section>
            )}

            {/* ── 우: 연말 이벤트 ── */}
            {cur && (
              <aside className="space-y-3">
                <Panel>
                  <p className="text-[15px] font-extrabold inline-flex items-center gap-1.5">연말 팬 감사 이벤트 참여 현황 <Gift className="w-4 h-4 text-rose-400" /></p>
                  <p className="mt-1.5 text-[12px] text-slate-600 break-keep">아래 조건을 달성하면 선수의 연말 감사 이벤트 참여 자격이 주어집니다. <span className="text-emerald-700">(당첨을 보장하지 않으며, 이벤트 참여 자격입니다.)</span></p>
                  <ul className="mt-4 space-y-3.5">
                    {[
                      { icon: Sparkles, k: '활동 다양성', m: cur.campaign.diversity, unit: '', hint: `${cur.campaign.diversity.need}개 영역 중 ${cur.campaign.diversity.need}개 활동 필요` },
                      { icon: Calendar, k: '지속성', m: cur.campaign.continuity, unit: ' 주', hint: `${cur.campaign.continuity.need}주 연속 활동 필요` },
                      { icon: Mail, k: '응원 편지', m: cur.campaign.letter, unit: '', hint: cur.campaign.letter.have >= cur.campaign.letter.need ? '응원 편지 1회 작성 완료' : '응원 편지 1회 작성 필요' },
                    ].map((x) => { const I = x.icon; const done = x.m.have >= x.m.need; return (
                      <li key={x.k} className="flex gap-3">
                        <span className={`w-9 h-9 rounded-full inline-flex items-center justify-center shrink-0 ${done ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}>{done ? <CheckCircle2 className="w-4 h-4" /> : <I className="w-4 h-4" />}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2"><p className="text-[13px] font-bold inline-flex items-center gap-1">{x.k} <HelpCircle className="w-3 h-3 text-slate-400" /></p><p className="text-[13px] font-black tabular-nums">{x.m.have} <span className="text-slate-400 font-bold">/ {x.m.need}{x.unit}</span></p></div>
                          <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(100, (x.m.have / x.m.need) * 100)}%` }} /></div>
                          <p className="mt-1 text-[11px] text-slate-500">{x.hint}</p>
                        </div>
                      </li>
                    ); })}
                  </ul>
                </Panel>
                <div className={`rounded-2xl border p-4 flex gap-3 ${cur.campaign.met ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-emerald-50 border-emerald-100'}`}>
                  <Star className={`w-5 h-5 shrink-0 ${cur.campaign.met ? 'text-white fill-current' : 'text-emerald-600'}`} />
                  <div><p className="text-[13.5px] font-extrabold">{cur.campaign.met ? '모든 조건을 달성했어요!' : '모든 조건을 달성해보세요!'}</p><p className={`text-[12px] break-keep ${cur.campaign.met ? 'text-white/85' : 'text-slate-600'}`}>{cur.campaign.met ? '연말 이벤트 참여 자격이 주어졌습니다.' : '선수에게 큰 응원이 될 거예요.'}</p></div>
                </div>
                <Link to="/fan/campaign" className="block text-center text-[12.5px] font-bold text-emerald-700 hover:underline">연말 응원광고 이벤트 자세히 보기</Link>
              </aside>
            )}
          </div>
        )}
        {data?.notice && <p className="mt-6 text-center text-[12px] text-slate-500 break-keep">기여도 및 이벤트 참여 현황은 활동 시 갱신되며, 상황에 따라 일부 지연될 수 있습니다. {data.notice}</p>}
      </Container>
    </FanPage>
  );
}
