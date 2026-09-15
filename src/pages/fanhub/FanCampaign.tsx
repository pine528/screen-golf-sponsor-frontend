/**
 * F15 연말 응원광고 이벤트 `/fan/campaign` — 시안 2026-09-15 (리디자인/9 · 26)
 *
 *  히어로: "팬이 만든 응원, 서울에 뜹니다" · 설명 · 이벤트 기간 | 비주얼(예시 이미지 고지) | 선정 심사 기준(가중치 4)
 *  하단 좌: 후보 선수 현황(팬 온도 종합 지수 · 달성까지 남은 % · 4개 항목 마크, 순위 아님)
 *  하단 우: 내가 응원하는 선수의 광고 자격(닉네임 노출 기본값 · 활동 다양성 · 지속성 · 응원 편지)
 *  꼭 확인해주세요(집행 비보장) + [이벤트 안내] [응원 이어가기]
 *  캠페인이 없으면 심사 기준·자격은 그대로 보여주고 기간은 "공고 예정".
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Check, ChevronRight, FileText, Flame, Heart, HelpCircle, Info, Leaf, Mail, Megaphone, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { AthleteAvatar, Skeleton } from '../../components/fanhub/FanKit';
import { FanPage, Container, FanCrumb, BackButton, Panel, fmtDate } from '../../components/fanhub/FanShell';

const CRIT_ICON: Record<string, any> = { activity: Flame, continuity: CalendarDays, letter: Mail, mission: Leaf };
const MARK_LABEL: Record<string, string> = { activity: '팬 활동', continuity: '지속성', letter: '응원 편지', mission: '공익 미션' };
const dayLabel = (d: string) => { const t = new Date(d); return `${fmtDate(t)}(${['일', '월', '화', '수', '목', '금', '토'][t.getDay()]})`; };

export default function FanCampaign() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getFanAdCampaign().then((r) => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false)); }, []);

  if (loading) {
    return <FanPage><Container className="pt-5 space-y-4"><Skeleton className="h-8 w-60" /><Skeleton className="h-[360px] rounded-3xl" /><Skeleton className="h-[300px] rounded-3xl" /></Container></FanPage>;
  }
  const c = data?.campaign;
  const mine = data?.mine;
  const myConds = mine ? [
    { key: 'diversity', label: '활동 다양성', hint: '다양한 활동 참여하기', m: mine.diversity, unit: '' },
    { key: 'continuity', label: '활동 지속성', hint: '이번 주 누적 응원 주차', m: mine.continuity, unit: ' 주' },
    { key: 'letter', label: '응원 편지', hint: '진심 담긴 응원 보내기', m: mine.letter, unit: '' },
  ] : [];

  return (
    <FanPage>
      <Container className="pt-5">
        <FanCrumb items={[{ label: '팬 참여', to: '/fan' }, { label: '연말 응원광고' }]} />

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
          {/* ── 히어로 ── */}
          <section className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 items-stretch">
            <div>
              <BackButton to="/fan" label="팬 참여로 돌아가기" />
              <p className="mt-6 inline-flex items-center gap-2"><span className="px-2 h-7 rounded-md bg-emerald-700 text-white text-[12px] font-extrabold inline-flex items-center">F15</span><span className="text-[13.5px] font-bold text-slate-600">연말 응원광고 이벤트</span></p>
              <h1 className="mt-2 text-[32px] sm:text-[42px] font-extrabold tracking-[-0.03em] leading-[1.15] break-keep">팬이 만든 응원,<br />서울에 뜹니다 <Heart className="inline w-8 h-8 text-rose-400" /></h1>
              <p className="mt-4 text-[13.5px] text-slate-700 leading-relaxed break-keep">{c?.description || '팬 온도가 높은 선수, 다양한 팬 활동, 꾸준한 응원, 진심 어린 응원 편지까지! 여러 요소를 종합해 선정된 선수에게 연말 서울 주요 지역 전광판 광고 기회를 드립니다.'}</p>
              <p className="mt-1.5 text-[13.5px] break-keep"><span className="text-rose-500 font-bold">후원 금액만으로 결정되지 않으며,</span> <b>팬의 진심과 활동이 더 중요합니다.</b></p>
              <div className="mt-5 rounded-2xl bg-white border border-slate-200 px-4 py-3.5 inline-flex flex-wrap items-center gap-3 text-[13.5px]">
                <span className="inline-flex items-center gap-1.5 font-bold text-slate-700"><CalendarDays className="w-4 h-4 text-emerald-700" /> 이벤트 기간</span>
                {c ? <span className="font-extrabold text-emerald-800 tabular-nums">{dayLabel(c.startAt)} ~ {dayLabel(c.endAt)}</span> : <span className="font-bold text-slate-500">공고 예정 · 캠페인이 열리면 팬 참여 홈에서 안내됩니다</span>}
                {c?.status === 'JUDGING' && <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11.5px] font-bold">심사 중</span>}
              </div>
            </div>
            <div className="relative min-h-[260px] rounded-3xl overflow-hidden bg-[#0a1411] text-white">
              <div aria-hidden className="pointer-events-none absolute inset-0"><div className="absolute left-[-20%] top-[-30%] w-[80%] h-[120%] rounded-full bg-emerald-500/25 blur-3xl" /><div className="absolute right-[-20%] bottom-[-40%] w-[70%] h-[120%] rounded-full bg-rose-400/20 blur-3xl" /></div>
              <div className="absolute inset-x-6 top-6 bottom-6 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                <p className="text-[11px] font-extrabold tracking-[0.3em] text-emerald-300">SEOUL · YEAR-END</p>
                <p className="mt-3 font-script text-[36px] sm:text-[44px] leading-none text-white">Our cheers make your today</p>
                <p className="mt-3 text-[13px] text-white/80 break-keep">우리의 응원이 너의 오늘을 만든다</p>
                <p className="mt-5 inline-flex items-center gap-2 text-[12px] font-extrabold"><Megaphone className="w-4 h-4 text-emerald-300" /> SPONPIK</p>
              </div>
              <p className="absolute left-4 bottom-3 text-[10.5px] text-white/60">※ 이미지는 이해를 돕기 위한 예시입니다.</p>
            </div>
          </section>

          {/* ── 심사 기준 ── */}
          <Panel>
            <p className="text-[15px] font-extrabold inline-flex items-center gap-1">선정 심사 기준 <HelpCircle className="w-3.5 h-3.5 text-slate-400" /></p>
            <p className="mt-1 text-[12px] text-slate-500 break-keep">아래 항목을 종합적으로 평가하여 후보 선수를 선정합니다.</p>
            <ul className="mt-3 divide-y divide-slate-100">
              {(data?.criteria || []).map((cr: any) => { const I = CRIT_ICON[cr.key] || Star; return (
                <li key={cr.key} className="py-3 flex items-center gap-3"><span className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 inline-flex items-center justify-center shrink-0"><I className="w-4 h-4" /></span><div className="min-w-0 flex-1"><p className="text-[13.5px] font-extrabold">{cr.label}</p><p className="text-[11.5px] text-slate-500 break-keep">{cr.desc}</p></div><span className="text-[18px] font-black text-emerald-700 tabular-nums shrink-0">{cr.weight}%</span></li>
              ); })}
            </ul>
            <div className="mt-2 rounded-xl bg-emerald-50 px-3.5 py-3 flex gap-2 text-[12px] text-slate-700 break-keep"><ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" /> 부정 행위 및 악의적 활동은 심사에서 제외되며, 운영팀의 검토가 필요합니다.</div>
          </Panel>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-4 items-start">
          {/* ── 후보 선수 현황 ── */}
          <Panel>
            <p className="text-[15px] font-extrabold inline-flex items-center gap-1">후보 선수 현황 <HelpCircle className="w-3.5 h-3.5 text-slate-400" /></p>
            <p className="mt-1 text-[12px] text-slate-500 break-keep">현재까지의 팬 활동을 기반으로 한 후보 선수 현황입니다. <b className="text-emerald-700">(순위 아님)</b></p>
            {data?.candidates?.length ? (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {data.candidates.map((cand: any) => (
                  <Link key={cand.athlete.id} to={`/fan/temperature/${cand.athlete.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-emerald-400 transition">
                    <div className="flex items-center gap-3"><AthleteAvatar athlete={cand.athlete} size={48} /><div className="min-w-0"><p className="text-[14.5px] font-extrabold">{cand.athlete.name} <span className="text-[11.5px] text-slate-500 font-bold">프로</span></p><p className="text-[11px] text-slate-500">팬 온도 종합 지수</p><p className="text-[22px] font-black text-emerald-700 tabular-nums leading-none">{cand.index}%</p></div></div>
                    <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${cand.index}%` }} /></div>
                    <p className="mt-1 text-[11px] text-slate-500">선정 기준 달성까지 {cand.remaining}% 남음</p>
                    <ul className="mt-3 grid grid-cols-4 gap-1">
                      {Object.entries(cand.marks).map(([k, v]) => { const I = CRIT_ICON[k] || Star; return <li key={k} className="rounded-lg bg-slate-50 px-1 py-1.5 text-center"><I className="w-3.5 h-3.5 mx-auto text-emerald-700" /><p className="mt-0.5 text-[9.5px] text-slate-500 leading-tight">{MARK_LABEL[k]}</p><p className="text-[10.5px] font-extrabold leading-tight">{String(v)}</p></li>; })}
                    </ul>
                  </Link>
                ))}
              </div>
            ) : <p className="mt-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 py-8 text-center text-[13px] text-slate-500">팬온도 일별 기록이 쌓이면 후보 현황이 표시됩니다.</p>}
            <div className="mt-3 rounded-xl bg-slate-50 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-1.5 text-[12px] text-slate-600"><span className="inline-flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> 후보 결과는 매주 업데이트되며, 이벤트 종료 후 최종 심사를 통해 광고 기회 대상자가 확정됩니다.</span><a href="#criteria" className="sm:ml-auto font-bold text-slate-700 inline-flex items-center gap-1">평가 기준 자세히 보기 <ChevronRight className="w-3.5 h-3.5" /></a></div>
          </Panel>

          {/* ── 내 자격 ── */}
          <Panel>
            <p className="text-[15px] font-extrabold inline-flex items-center gap-1 break-keep">내가 응원하는 선수의 광고 자격, 내가 함께 만들고 있어요! <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" /></p>
            {!isAuthenticated ? (
              <div className="mt-3 rounded-xl bg-slate-50 px-4 py-5 text-center"><p className="text-[13.5px] font-bold">로그인하면 내 참여 현황을 볼 수 있어요</p><Link to={`/login?returnUrl=${encodeURIComponent('/fan/campaign')}`} className="mt-3 inline-flex h-10 px-5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold items-center">로그인하기</Link></div>
            ) : !mine ? (
              <div className="mt-3 rounded-xl bg-slate-50 px-4 py-5 text-center"><p className="text-[13.5px] font-bold">아직 응원 기록이 없어요</p><p className="mt-1 text-[12px] text-slate-500 break-keep">투표·커뮤니티·응원 편지로 활동을 시작하면 자격 현황이 표시됩니다.</p></div>
            ) : (
              <>
                <div className="mt-3 rounded-xl border border-slate-200 px-4 py-3 flex flex-wrap items-center gap-2 text-[12.5px]"><span className="font-bold">내 닉네임 노출 설정</span><span className="text-slate-500">기본값: 닉네임</span><span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">설정됨</span><span className="ml-auto text-slate-500">실명 표기는 별도 동의 시</span></div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {myConds.map((x) => { const done = x.m.have >= x.m.need; return (
                    <div key={x.key} className="rounded-xl border border-slate-200 p-3 text-center">
                      <p className="text-[13px] font-extrabold">{x.label}</p><p className="text-[10.5px] text-slate-500 break-keep">{x.hint}</p>
                      <div className="mt-2.5 flex justify-center gap-1">{Array.from({ length: x.m.need }).map((_, i) => <span key={i} className={`w-5 h-5 rounded-full inline-flex items-center justify-center ${i < x.m.have ? 'bg-emerald-600 text-white' : 'border-2 border-slate-200 text-transparent'}`}><Check className="w-3 h-3" strokeWidth={3} /></span>)}</div>
                      <p className={`mt-2 text-[13px] font-black tabular-nums ${done ? 'text-emerald-700' : 'text-slate-800'}`}>{x.m.have} <span className="text-slate-400 font-bold">/ {x.m.need}{x.unit}</span></p>
                    </div>
                  ); })}
                </div>
                <div className={`mt-3 rounded-xl px-4 py-3 flex gap-2 text-[12.5px] break-keep ${mine.met ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-slate-700'}`}><Heart className={`w-4 h-4 shrink-0 mt-0.5 ${mine.met ? 'text-white fill-current' : 'text-emerald-600'}`} />{mine.met ? '모든 조건을 달성했어요! 내 닉네임이 광고에 함께 노출될 자격이 주어졌습니다.' : '좋아요! 지금처럼 꾸준히 참여하면, 내 닉네임이 광고에 함께 노출될 가능성이 높아져요!'}</div>
                <Link to="/fan/contributions" className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-emerald-700 hover:underline">선수별 기여도 자세히 보기 <ChevronRight className="w-3.5 h-3.5" /></Link>
              </>
            )}
          </Panel>
        </div>

        {/* ── 고지 + CTA ── */}
        <div id="criteria" className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-4 items-stretch">
          <div className="rounded-2xl bg-rose-50 border border-rose-100 p-5 flex gap-3">
            <Megaphone className="w-6 h-6 text-rose-500 shrink-0" />
            <div><p className="text-[14px] font-extrabold text-rose-600">꼭 확인해주세요!</p><ul className="mt-1.5 space-y-1">{(data?.notices || []).map((t: string) => <li key={t} className="flex gap-2 text-[12.5px] text-slate-700 break-keep"><span className="w-1 h-1 rounded-full bg-rose-400 mt-2 shrink-0" />{t}</li>)}{c?.notice && <li className="flex gap-2 text-[12.5px] text-slate-700 break-keep"><span className="w-1 h-1 rounded-full bg-rose-400 mt-2 shrink-0" />{c.notice}</li>}</ul></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <a href="#criteria" className="rounded-2xl border-2 border-emerald-600 bg-white text-emerald-700 text-[15px] font-extrabold inline-flex items-center justify-center gap-2 min-h-[64px] hover:bg-emerald-50">이벤트 안내 <FileText className="w-4 h-4" /></a>
            <Link to="/fan/community" className="rounded-2xl bg-emerald-700 text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 min-h-[64px] hover:bg-emerald-800">응원 이어가기 <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
        <p className="mt-3 text-[11.5px] text-slate-500 inline-flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> 구매 금액은 심사 항목에 포함되지 않습니다. 팬 이름은 닉네임이 기본이며, 실명 표기는 별도 동의를 받습니다.</p>
      </Container>
    </FanPage>
  );
}
