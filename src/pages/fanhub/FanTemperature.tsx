/**
 * F07 팬온도 상세 `/fan/temperature/:athleteId` — 시안 2026-09-15 (리디자인/9 · 18)
 *
 *  좌: 선수 카드(사진·이름·종목·활동 중인 팬·"팬온도는 어떻게 계산되나요?")
 *  중: "함께 만든 {선수}의 팬온도" → 현재 팬온도(큰 숫자·상태·이번 주 변화·마지막 계산·산정 기간)
 *     → 팬온도 구성 요소(6종 가중치 막대) · 팬온도 추이(7/30/90일 라인 차트 + 이전 30일 대비)
 *  우: 최근 팬온도 상승 요인(지난 7일) · 감사 카드
 *  하단: 팬온도 이용 안내. 표본 30 미만이면 점수 대신 "집계 중".
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight, CalendarDays, Calculator, ChevronRight, Flame, Heart, HelpCircle, Info, MessageCircle, Repeat, Reply,
  ShoppingBag, Sparkles, TrendingDown, TrendingUp, Users, Vote,
} from 'lucide-react';
import { api } from '../../services/api';
import { AthleteAvatar, Skeleton, nf, FAN_TEMP_NOTE } from '../../components/fanhub/FanKit';
import { FanPage, Container, FanCrumb, BackButton, Panel, fmtDate, fmtDateTime } from '../../components/fanhub/FanShell';

const COMP_ICON: Record<string, any> = { activeFans: Users, vote: Vote, community: MessageCircle, store: ShoppingBag, continuity: Repeat, athleteReply: Reply };
const SOURCE_ICON: Record<string, any> = { VOTE: Vote, COMMUNITY: MessageCircle, LETTER: Heart, STORE: ShoppingBag, BRAND_SUGGEST: ShoppingBag, FAVORITE: Users };
const RANGES = [7, 30, 90];

/** 라인 차트 — 스냅샷이 2개 이상일 때만 그린다 */
function TrendChart({ points }: { points: { date: string; score: number }[] }) {
  const W = 560, H = 190, L = 34, R = 14, T = 14, B = 26;
  const xs = points.map((_, i) => L + (i / Math.max(1, points.length - 1)) * (W - L - R));
  const y = (v: number) => T + (1 - Math.max(0, Math.min(100, v)) / 100) * (H - T - B);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${xs[i].toFixed(1)},${y(p.score).toFixed(1)}`).join(' ');
  const area = `${path} L${xs[xs.length - 1].toFixed(1)},${(H - B).toFixed(1)} L${xs[0].toFixed(1)},${(H - B).toFixed(1)} Z`;
  const last = points[points.length - 1];
  const labelIdx = [0, Math.floor((points.length - 1) / 2), points.length - 1].filter((v, i, a) => a.indexOf(v) === i);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="팬온도 추이">
      <defs><linearGradient id="tempArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.28" /><stop offset="100%" stopColor="#10b981" stopOpacity="0" /></linearGradient></defs>
      {[0, 20, 40, 60, 80, 100].map((g) => (
        <g key={g}><line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke="#e2e8f0" strokeDasharray="3 3" /><text x={L - 6} y={y(g) + 4} fontSize="10" textAnchor="end" fill="#94a3b8">{g}°</text></g>
      ))}
      <path d={area} fill="url(#tempArea)" />
      <path d={path} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => <circle key={i} cx={xs[i]} cy={y(p.score)} r={i === points.length - 1 ? 4.5 : 2} fill={i === points.length - 1 ? '#059669' : '#a7f3d0'} stroke="#fff" strokeWidth="1.5" />)}
      {labelIdx.map((i) => <text key={i} x={xs[i]} y={H - 8} fontSize="10" textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'} fill="#64748b">{fmtDate(points[i].date, { month: '2-digit', day: '2-digit' })}</text>)}
      <g transform={`translate(${Math.min(xs[xs.length - 1], W - R - 46)}, ${Math.max(T + 10, y(last.score) - 22)})`}>
        <rect x="-2" y="-11" width="48" height="18" rx="4" fill="#0f172a" /><text x="22" y="2" fontSize="10.5" fontWeight="700" textAnchor="middle" fill="#fff">{last.score.toFixed(1)}°C</text>
      </g>
    </svg>
  );
}

export default function FanTemperature() {
  const { athleteId = '' } = useParams();
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getFanTemperature(athleteId, { days })
      .then((r) => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [athleteId, days]);

  const trend: { date: string; score: number }[] = useMemo(() => data?.history || [], [data]);
  const shown = !!data && !data.lowSample && data.score > 0;
  const windowStart = data ? new Date(Date.now() - (data.windowDays || 30) * 86400_000) : null;

  if (loading && !data) {
    return <FanPage><Container className="pt-5 space-y-4"><Skeleton className="h-8 w-56" /><Skeleton className="h-[200px] rounded-3xl" /><Skeleton className="h-[320px] rounded-3xl" /></Container></FanPage>;
  }
  if (!data) {
    return <FanPage><Container className="py-20 text-center text-slate-500">팬온도를 불러오지 못했습니다</Container></FanPage>;
  }
  const a = data.athlete;
  const delta: number | null = data.weeklyDelta;

  return (
    <FanPage>
      <Container className="pt-5">
        <FanCrumb items={[{ label: '팬 참여', to: '/fan' }, { label: '팬온도' }]} />
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)_280px] gap-4 items-start">
          {/* ── 좌: 선수 카드 ── */}
          <aside className="space-y-3">
            <BackButton to={a ? `/fan/community/${a.id}` : '/fan'} />
            <Panel className="text-center">
              <Link to={a ? `/athletes/${a.id}` : '#'} className="inline-block rounded-full ring-4 ring-emerald-50"><AthleteAvatar athlete={a} size={120} /></Link>
              <p className="mt-3 text-[18px] font-extrabold tracking-[-0.02em]">{a?.name} 프로</p>
              <p className="text-[12.5px] text-slate-500">{a?.sportType === 'GOLF' || !a?.sportType ? '골프' : a.sportType}{a?.tour ? ` · ${a.tour}` : ''}</p>
              <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 py-3">
                <p className="text-[20px] font-black text-emerald-700 tabular-nums inline-flex items-center gap-1.5"><Users className="w-4 h-4" /> {nf(data.activeFanCount)}</p>
                <p className="text-[11.5px] text-slate-600">활동 중인 팬 (30일)</p>
              </div>
            </Panel>
            <a href="#formula" className="block rounded-2xl bg-emerald-50 border border-emerald-100 p-4 hover:bg-emerald-100/60">
              <span className="w-9 h-9 rounded-xl bg-white inline-flex items-center justify-center text-emerald-700"><Calculator className="w-4 h-4" /></span>
              <p className="mt-2.5 text-[14px] font-extrabold break-keep">팬온도는 어떻게 계산되나요?</p>
              <p className="mt-1 text-[12px] text-slate-600 break-keep inline-flex items-center gap-1">산정 기준과 가중치를 확인해 보세요. <ChevronRight className="w-3.5 h-3.5" /></p>
            </a>
          </aside>

          {/* ── 중앙 ── */}
          <div className="min-w-0 space-y-4">
            <div>
              <h1 className="text-[26px] sm:text-[32px] font-extrabold tracking-[-0.03em] leading-tight break-keep inline-flex flex-wrap items-center gap-2">
                함께 만든 <span className="text-emerald-700">{a?.name} 프로</span>의 팬온도
                <span className="px-2.5 h-7 rounded-full border border-slate-200 bg-white text-[12px] font-bold text-slate-600 inline-flex items-center gap-1" title={FAN_TEMP_NOTE}>팬온도란? <HelpCircle className="w-3.5 h-3.5" /></span>
              </h1>
              <p className="mt-2 text-[13.5px] text-slate-600 leading-relaxed break-keep">팬온도는 최근 {data.windowDays || 30}일 동안 팬 여러분의 다양한 활동을 종합해 측정한 지표입니다.<br className="hidden sm:block" />선수의 실력이나 성적을 평가하는 지표가 아니에요.</p>
            </div>

            {/* 현재 팬온도 */}
            <section className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] divide-y md:divide-y-0 md:divide-x divide-slate-100">
                <div className="p-5">
                  <p className="text-[13px] font-bold text-slate-600 inline-flex items-center gap-1">현재 팬온도 <HelpCircle className="w-3.5 h-3.5 text-slate-400" /></p>
                  {shown ? (
                    <p className="mt-2 text-[56px] sm:text-[64px] font-black text-emerald-700 tabular-nums leading-none tracking-[-0.04em] inline-flex items-end gap-2">{Number(data.score).toFixed(1)}<span className="text-[22px] font-extrabold mb-2">°C</span><Flame className="w-9 h-9 text-orange-500 mb-2" /></p>
                  ) : (
                    <>
                      <p className="mt-2 text-[34px] font-black text-slate-400 leading-none">집계 중</p>
                      <p className="mt-2 text-[12.5px] text-slate-500 break-keep">최근 {data.windowDays || 30}일 참여 팬 {nf(data.sampleSize)}명 · 30명 이상 모이면 팬온도가 공개됩니다.</p>
                    </>
                  )}
                </div>
                <div className="p-5 grid grid-cols-2 md:grid-cols-1 gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] text-slate-600">상태</span>
                    <span className="px-3 h-8 rounded-full border border-emerald-200 bg-emerald-50 text-[13px] font-extrabold text-emerald-700 inline-flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> {shown ? data.tier?.label : '데이터 축적 중'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] text-slate-600">이번 주 변화</span>
                    {shown && delta !== null && delta !== undefined ? (
                      <span className={`text-[18px] font-black tabular-nums inline-flex items-center gap-1 ${delta >= 0 ? 'text-emerald-700' : 'text-slate-600'}`}>{delta > 0 ? '+' : ''}{delta.toFixed(1)}°C {delta >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}</span>
                    ) : <span className="text-[12.5px] font-bold text-slate-400">집계 중</span>}
                  </div>
                </div>
                <div className="p-5 md:w-[210px]">
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[12px] text-slate-500 inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> 마지막 계산</p>
                    <p className="mt-1 text-[13px] font-bold tabular-nums">{fmtDateTime(data.calculatedAt)}</p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/70 text-[12px] text-slate-500 inline-flex items-center gap-1.5 w-full break-keep">
                <Info className="w-3.5 h-3.5 shrink-0" /> 팬온도는 최근 {data.windowDays || 30}일({windowStart ? fmtDate(windowStart) : ''} ~ {fmtDate(new Date())})의 팬 활동을 기준으로 계산됩니다.
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4">
              {/* 구성 요소 */}
              <Panel>
                <div id="formula" className="flex items-center justify-between gap-2">
                  <p className="text-[15px] font-extrabold inline-flex items-center gap-1">팬온도 구성 요소 <HelpCircle className="w-3.5 h-3.5 text-slate-400" /></p>
                  <span className="text-[11.5px] text-slate-500">가중치 합 100</span>
                </div>
                <ul className="mt-4 space-y-3.5">
                  {(data.components || []).map((c: any) => { const I = COMP_ICON[c.key] || Users; return (
                    <li key={c.key} className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 inline-flex items-center justify-center shrink-0"><I className="w-4 h-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold leading-tight">{c.label}</p>
                        <p className="text-[11px] text-slate-500 truncate">{c.desc}</p>
                      </div>
                      <div className="w-24 sm:w-40 shrink-0">
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${shown ? Math.min(100, c.score) : 0}%` }} title={shown ? `달성 ${Math.round(c.score)}/100` : '집계 중'} /></div>
                      </div>
                      <span className="w-9 text-right text-[13px] font-extrabold tabular-nums shrink-0">{c.weight}%</span>
                    </li>
                  ); })}
                </ul>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-[12px]">
                  <span className="text-slate-500 break-keep">막대는 최근 {data.windowDays || 30}일 각 요소의 달성도, 숫자는 산정 가중치입니다.</span>
                  <span className="text-slate-400 shrink-0">{data.formulaVersion}</span>
                </div>
              </Panel>

              {/* 추이 */}
              <Panel>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[15px] font-extrabold inline-flex items-center gap-1">팬온도 {days}일 추이 <HelpCircle className="w-3.5 h-3.5 text-slate-400" /></p>
                  <div className="flex gap-1">{RANGES.map((d) => <button key={d} type="button" onClick={() => setDays(d)} aria-pressed={days === d} className={`h-7 px-2.5 rounded-lg text-[11.5px] font-bold border ${days === d ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}>{d}일</button>)}</div>
                </div>
                {trend.length > 1 ? (
                  <div className="mt-3"><TrendChart points={trend} /></div>
                ) : (
                  <div className="mt-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 h-[190px] flex flex-col items-center justify-center text-center px-4">
                    <p className="text-[13px] font-bold text-slate-600">일별 기록이 아직 쌓이지 않았습니다</p>
                    <p className="mt-1 text-[12px] text-slate-500 break-keep">팬온도는 매일 새벽 저장되며, 이틀 이상 기록되면 추이가 표시됩니다.</p>
                  </div>
                )}
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-3">
                  <div><p className="text-[11px] text-slate-500">이전 {days}일</p><p className="text-[16px] font-extrabold tabular-nums">{data.prevWindowScore != null ? `${Number(data.prevWindowScore).toFixed(1)}°C` : '집계 중'}</p></div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div><p className="text-[11px] text-emerald-700 font-bold">최근 {days}일</p><p className="text-[16px] font-extrabold tabular-nums text-emerald-700">{shown ? `${Number(data.score).toFixed(1)}°C` : '집계 중'}</p></div>
                  <div className="ml-auto text-right">
                    {data.windowDelta != null && shown ? <p className={`text-[15px] font-black tabular-nums ${data.windowDelta >= 0 ? 'text-emerald-700' : 'text-slate-600'}`}>{data.windowDelta > 0 ? '+' : ''}{Number(data.windowDelta).toFixed(1)}°C</p> : <p className="text-[12px] text-slate-400 font-bold">비교 집계 중</p>}
                  </div>
                </div>
                <p className="mt-2 text-[11.5px] text-slate-500 inline-flex items-center gap-1"><Info className="w-3.5 h-3.5" /> 본 선수의 이전 기간 대비 변화만 제공됩니다.</p>
              </Panel>
            </div>
          </div>

          {/* ── 우 ── */}
          <aside className="space-y-3">
            <Panel>
              <p className="text-[15px] font-extrabold inline-flex items-center gap-1">최근 팬온도 상승 요인 <HelpCircle className="w-3.5 h-3.5 text-slate-400" /></p>
              <p className="text-[11.5px] text-slate-500">지난 7일 기준 · 직전 7일 대비</p>
              {data.risingFactors?.length ? (
                <ul className="mt-3 space-y-2">
                  {data.risingFactors.map((f: any) => { const I = SOURCE_ICON[f.source] || Vote; return (
                    <li key={f.source} className="rounded-xl border border-slate-200 px-3.5 py-3 flex items-center gap-3">
                      <span className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 inline-flex items-center justify-center shrink-0"><I className="w-4 h-4" /></span>
                      <div className="min-w-0 flex-1"><p className="text-[13px] font-bold break-keep">{f.label}</p><p className="text-[11px] text-slate-500">+{nf(f.count)}건</p></div>
                      <span className="text-[13.5px] font-black text-emerald-700 tabular-nums shrink-0">+{Number(f.delta).toFixed(1)}°C</span>
                    </li>
                  ); })}
                </ul>
              ) : <p className="mt-3 rounded-xl bg-slate-50 px-3.5 py-3 text-[12.5px] text-slate-500 break-keep">지난 7일 동안 직전 주보다 늘어난 활동이 아직 없습니다.</p>}
            </Panel>
            <div className="relative overflow-hidden rounded-2xl bg-white border border-rose-100 p-5 text-center">
              <Heart aria-hidden className="absolute -right-3 -bottom-3 w-20 h-20 text-rose-100 fill-current" />
              <p className="relative text-[13.5px] text-slate-700 break-keep">팬 여러분의 응원이<br /><b>{a?.name} 프로</b>에게 큰 힘이 되고 있어요!</p>
              <p className="relative mt-3 font-script text-[22px] text-rose-400 leading-none">Thank you for cheering :)</p>
            </div>
            {data.mine && (
              <Panel>
                <p className="text-[14px] font-extrabold">이 선수에 대한 내 기여</p>
                <dl className="mt-2.5 grid grid-cols-3 gap-1.5 text-center">
                  {[{ k: '레벨', v: `Lv.${data.mine.level}` }, { k: '활동 영역', v: `${data.mine.diversity}/4` }, { k: '연속 주', v: `${data.mine.streakWeeks}주` }].map((x) => (
                    <div key={x.k} className="rounded-xl bg-slate-50 py-2.5"><dd className="text-[15px] font-black tabular-nums">{x.v}</dd><dt className="text-[11px] text-slate-500">{x.k}</dt></div>
                  ))}
                </dl>
                <Link to="/fan/contributions" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold text-emerald-700 hover:underline">내 응원이 만든 변화 보기 <ChevronRight className="w-3.5 h-3.5" /></Link>
              </Panel>
            )}
          </aside>
        </div>

        <div className="mt-5 rounded-2xl bg-white border border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 text-[12.5px] text-slate-600">
          <span className="inline-flex items-center gap-1.5 break-keep"><Info className="w-4 h-4 text-slate-400 shrink-0" /> 팬온도는 팬 참여를 독려하고, 선수와 팬이 더 가까워질 수 있도록 돕는 지표입니다. 더 건강하고 즐거운 팬 문화를 함께 만들어가요!</span>
          <Link to="/fan" className="sm:ml-auto font-bold text-emerald-700 inline-flex items-center gap-1 shrink-0">팬온도 이용 가이드 <ChevronRight className="w-3.5 h-3.5" /></Link>
        </div>
      </Container>
    </FanPage>
  );
}
