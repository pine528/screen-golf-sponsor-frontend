/**
 * F03 VOTE 투표하기 + F04 투표 완료·결과 `/fan/vote/:id` — 시안 2026-09-15 (리디자인/9 · 14~15)
 *
 *  좌: 선수 헤더(사진·투어·팬온도) → Fan VOTE 질문 + 큰 선택 버튼(OX는 O/X 원형) → 투표 종료까지 · 참여 보상 · 지난 투표 결과 스트립
 *     → 최근 성적 요약(평균 순위 · TOP10 · 최고 순위 · 최근 대회) → 하단 고정 "이 선택으로 투표하기"
 *  우: 투표 안내(1계정 1회 · 변경 가능 여부 · 검증 후 지급) · 이번 VOTE 정보(마감 · 참여 · 유형)
 *  결과 3상태: 내 선택(집계 전) → 유효성 확인 중(결과 집계 중) → 투표 종료 · 공식 결과(득표율 + 내 예측 결과 · 적중 P)
 *  값은 실데이터만 — 지난 투표 결과는 같은 선수의 종료된 투표가 있을 때만, 성적은 승인된 대회 기록만.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle, Award, BarChart3, Check, CheckCircle2, Circle, Clock, Coins, Flame, History, Info, Lock,
  Share2, Trophy, Users, Vote, X,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { AthleteAvatar, Skeleton, nf, FAN_TEMP_NOTE } from '../../components/fanhub/FanKit';
import { FanPage, Container, FanCrumb, BackButton, Panel, fmtDateTime, fmtDate } from '../../components/fanhub/FanShell';

const TYPE_TONE: Record<string, string> = {
  OX: 'bg-emerald-50 text-emerald-700', MULTI: 'bg-sky-50 text-sky-700', PREDICT: 'bg-amber-50 text-amber-700',
  BRAND: 'bg-violet-50 text-violet-700', PICK: 'bg-rose-50 text-rose-700',
};

const remain = (ms: number) => {
  if (ms <= 0) return '종료';
  const d = Math.floor(ms / 86400_000), h = Math.floor((ms % 86400_000) / 3600_000), m = Math.floor((ms % 3600_000) / 60_000);
  return d > 0 ? `${d}일 ${h}시간` : h > 0 ? `${h}시간 ${m}분` : `${Math.max(1, m)}분`;
};

export default function FanVoteDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { isAuthenticated } = useAuth();
  const [vote, setVote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [earned, setEarned] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);

  const load = () =>
    api.getFanVote(id)
      .then((r) => { setVote(r.data); setPicked(r.data?.myAnswer ?? null); })
      .catch((e) => setError(e?.response?.data?.error?.message || '투표를 불러오지 못했습니다'))
      .finally(() => setLoading(false));
  useEffect(() => { setLoading(true); setEarned(null); load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!picked) return;
    if (!isAuthenticated) { nav(`/login?returnUrl=${encodeURIComponent(`/fan/vote/${id}`)}`); return; }
    setSubmitting(true); setError(null);
    try {
      const r = await api.submitFanBallot(id, picked);
      setVote(r.data.vote); setEarned(r.data.point);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      if (e?.response?.status === 401) { nav(`/login?returnUrl=${encodeURIComponent(`/fan/vote/${id}`)}`); return; }
      setError(e?.response?.data?.error?.message || '투표에 실패했습니다');
    } finally { setSubmitting(false); }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: vote?.title, url });
      else { await navigator.clipboard?.writeText(url); setShared(true); setTimeout(() => setShared(false), 2000); }
    } catch { /* 사용자가 취소 */ }
  };

  const state = useMemo(() => {
    if (!vote) return 'LOADING';
    if (vote.results) return 'RESULT';           // 결과 공개
    if (vote.closed) return 'COUNTING';          // 종료했지만 아직 집계·검증 중
    if (vote.voted) return 'VOTED';              // 참여 완료, 결과 비공개
    return 'OPEN';
  }, [vote]);

  if (loading) {
    return (
      <FanPage><Container className="pt-5 space-y-4"><Skeleton className="h-8 w-56" /><Skeleton className="h-[220px] rounded-3xl" /><Skeleton className="h-[300px] rounded-3xl" /></Container></FanPage>
    );
  }
  if (!vote) {
    return (
      <FanPage><Container className="py-20 text-center">
        <p className="text-slate-500">{error || '투표를 찾을 수 없습니다'}</p>
        <Link to="/fan/vote" className="inline-block mt-4 text-[14px] font-bold text-emerald-700">Fan VOTE 목록으로</Link>
      </Container></FanPage>
    );
  }

  const a = vote.athlete;
  const temp = vote.temperature;
  const results: any[] | null = vote.results;
  const isOX = vote.type === 'OX' && vote.options.length === 2;
  const canChange = vote.changeable && vote.voted;
  const selectable = state === 'OPEN' || (state === 'VOTED' && canChange);
  const rs = vote.recentSummary;
  const prev = vote.previousVote;
  const mine = vote.myAnswer;
  const myRes = results?.find((r) => r.label === mine);
  const stateChip = state === 'RESULT'
    ? { cls: 'bg-slate-900 text-white', label: vote.correctAnswer ? '공식 결과 확정' : '투표 종료 · 결과 공개' }
    : state === 'COUNTING' ? { cls: 'bg-amber-50 text-amber-700', label: '결과 집계 중' }
    : state === 'VOTED' ? { cls: 'bg-emerald-50 text-emerald-700', label: '참여 완료' }
    : { cls: 'bg-emerald-600 text-white', label: '진행 중' };

  return (
    <FanPage>
      <Container className="pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <BackButton to="/fan/vote" label="VOTE 목록으로" />
          <FanCrumb items={[{ label: '팬 참여', to: '/fan' }, { label: 'Fan VOTE', to: '/fan/vote' }, { label: state === 'RESULT' || state === 'COUNTING' ? '투표 결과' : '투표하기' }]} />
        </div>

        {/* 방금 참여 배너 (F04 1단계) */}
        {earned && (
          <div className="mt-4 rounded-2xl bg-[#0a1411] text-white px-5 py-4 flex items-center gap-3.5">
            <span className="w-10 h-10 rounded-xl bg-emerald-400/20 inline-flex items-center justify-center shrink-0"><CheckCircle2 className="w-5 h-5 text-emerald-300" /></span>
            <div className="min-w-0">
              <p className="text-[14.5px] font-extrabold">투표가 완료됐습니다</p>
              <p className="text-[12.5px] text-white/70 mt-0.5 break-keep">
                {earned.earned > 0 ? `참여 보상 ${earned.earned}P가 적립 예정입니다. 투표 종료 후 확정 지급됩니다.`
                  : earned.reason === 'DAILY_CAP' ? '오늘 VOTE 적립 한도를 채웠습니다. 참여 기록은 팬온도에 반영됩니다.'
                  : '참여 기록이 팬온도에 반영됩니다.'}
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
          {/* ── 본문 ── */}
          <div className="min-w-0 space-y-3">
            {/* 선수 헤더 */}
            {a && (
              <section className="rounded-3xl bg-white border border-slate-200 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Link to={`/athletes/${a.id}`} className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span className="rounded-full ring-4 ring-emerald-50"><AthleteAvatar athlete={a} size={64} /></span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {a.tour && <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11.5px] font-extrabold">{a.tour}</span>}
                        {a.region && <span className="text-[12px] text-slate-500">{a.region}</span>}
                      </div>
                      <p className="mt-1 text-[22px] font-extrabold tracking-[-0.02em] leading-none">{a.name} <span className="text-[13px] font-bold text-emerald-600">PRO</span></p>
                      <p className="mt-1.5 text-[12.5px] text-slate-500 break-keep">이 투표의 참여는 {a.name} 프로의 팬온도에 반영됩니다.</p>
                    </div>
                  </Link>
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 sm:w-[190px] shrink-0" title={FAN_TEMP_NOTE}>
                    <p className="text-[11.5px] font-bold text-slate-600">팬온도</p>
                    <p className="mt-0.5 inline-flex items-center gap-1.5 text-[24px] font-black text-emerald-700 tabular-nums leading-none">
                      <Flame className="w-5 h-5 text-orange-500" />
                      {temp && !temp.lowSample && temp.score > 0 ? `${Number(temp.score).toFixed(1)}°` : <span className="text-[13px] font-bold text-slate-500">집계 중</span>}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500 break-keep">{temp && !temp.lowSample && temp.score > 0 ? temp.tier?.meaning || temp.tier?.label : '팬 30명 이상 참여 시 공개'}</p>
                  </div>
                </div>
              </section>
            )}

            {/* 질문 + 선택 */}
            <section className="rounded-3xl bg-white border border-slate-200 p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11.5px] font-extrabold inline-flex items-center gap-1"><Vote className="w-3 h-3" /> Fan VOTE</span>
                <span className={`px-2 py-0.5 rounded-md text-[11.5px] font-extrabold ${TYPE_TONE[vote.type] || TYPE_TONE.OX}`}>{vote.typeLabel}</span>
                <span className={`px-2 py-0.5 rounded-md text-[11.5px] font-extrabold ${stateChip.cls}`}>{stateChip.label}</span>
                {!vote.closed && <span className="ml-auto text-[12px] font-bold text-rose-500 inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {remain(vote.remainMs)} 남음</span>}
              </div>
              <h1 className="mt-3 text-[22px] sm:text-[28px] font-extrabold tracking-[-0.02em] leading-snug break-keep">{vote.title}</h1>
              {vote.description && <p className="mt-2 text-[14px] text-slate-600 leading-relaxed break-keep">{vote.description}</p>}

              <p className="mt-5 text-[13px] font-bold text-slate-500">
                {state === 'RESULT' ? '투표 결과' : state === 'COUNTING' ? '내 선택 · 결과 집계 중' : state === 'VOTED' ? (canChange ? '내 선택 (마감 전 변경 가능)' : '내 선택') : '하나를 선택해주세요'}
              </p>

              {/* OX 큰 버튼 */}
              {isOX && state !== 'RESULT' ? (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {vote.options.map((opt: string, i: number) => {
                    const on = (state === 'OPEN' || canChange ? picked : mine) === opt;
                    const I = i === 0 ? Circle : X;
                    return (
                      <button key={opt} type="button" disabled={!selectable} onClick={() => selectable && setPicked(opt)} aria-pressed={on}
                        className={`rounded-3xl border-2 py-7 sm:py-9 flex flex-col items-center gap-3 transition ${
                          on ? (i === 0 ? 'border-emerald-500 bg-emerald-50' : 'border-rose-400 bg-rose-50') : 'border-slate-200 bg-white hover:border-slate-400'
                        } ${selectable ? 'cursor-pointer' : 'cursor-default'}`}>
                        <span className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full inline-flex items-center justify-center ${
                          i === 0 ? 'bg-emerald-600 text-white' : 'bg-rose-500 text-white'}`}><I className="w-9 h-9 sm:w-11 sm:h-11" strokeWidth={3} /></span>
                        <span className="text-[16px] sm:text-[18px] font-extrabold break-keep px-2 text-center">{opt}</span>
                        {on && <span className="text-[11.5px] font-bold text-slate-500 inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> 선택됨</span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {vote.options.map((opt: string) => {
                    const res = results?.find((r) => r.label === opt);
                    const on = (state === 'OPEN' || canChange ? picked : mine) === opt;
                    const correct = vote.correctAnswer && vote.correctAnswer === opt;
                    const top = results ? Math.max(...results.map((r) => r.count), 1) : 1;
                    return (
                      <button key={opt} type="button" disabled={!selectable} onClick={() => selectable && setPicked(opt)} aria-pressed={on}
                        className={`relative w-full text-left rounded-2xl border-2 px-4 py-4 overflow-hidden transition ${
                          correct ? 'border-emerald-500 bg-emerald-50/50' : on ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white'
                        } ${selectable ? 'hover:border-slate-400 cursor-pointer' : 'cursor-default'}`}>
                        {res && <span className={`absolute inset-y-0 left-0 ${correct ? 'bg-emerald-100/70' : 'bg-slate-100/80'} transition-[width] duration-700`} style={{ width: `${(res.count / top) * 100}%` }} />}
                        <span className="relative flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full border-2 inline-flex items-center justify-center shrink-0 ${on ? 'border-slate-900 bg-slate-900' : 'border-slate-300 bg-white'}`}>{on && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}</span>
                          <span className={`flex-1 text-[15px] break-keep ${on || correct ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-700'}`}>{opt}</span>
                          {correct && <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-extrabold inline-flex items-center gap-1"><Trophy className="w-3 h-3" /> 정답</span>}
                          {on && results && <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-extrabold">내 선택</span>}
                          {res && <span className="text-[16px] font-black tabular-nums shrink-0">{res.percent}%</span>}
                        </span>
                        {res && <span className="relative block mt-1 pl-9 text-[11.5px] text-slate-500 tabular-nums">{nf(res.count)}표</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 결과 비공개 · 집계 중 안내 */}
              {state === 'VOTED' && vote.resultHidden && (
                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <p className="text-[12.5px] text-slate-600 leading-relaxed break-keep">{vote.resultHiddenReason} 투표 종료 후 공식 결과가 공개되며, 알림으로 안내됩니다.</p>
                </div>
              )}
              {state === 'COUNTING' && (
                <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3.5">
                  <p className="text-[13.5px] font-extrabold text-amber-800 inline-flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> 유효성 확인 중 · 결과 집계 중</p>
                  <p className="mt-1 text-[12.5px] text-amber-700 leading-relaxed break-keep">1계정 1표 원칙에 따라 중복·비정상 참여를 제외한 뒤 결과를 확정합니다. {vote.correctBonus > 0 ? `공식 기록 확인 후 정답자에게 ${vote.correctBonus}P가 지급됩니다.` : '확정되면 참여 보상이 지급됩니다.'}</p>
                  {mine && <p className="mt-2 text-[12.5px] text-amber-800">내 선택 · <b>{mine}</b></p>}
                </div>
              )}

              {/* 공식 결과 · 내 예측 */}
              {state === 'RESULT' && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-slate-600">
                    <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 유효 참여 <b className="text-slate-900 tabular-nums">{nf(vote.participants)}명</b></span>
                    <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 마감 {fmtDateTime(vote.closeAt)}</span>
                    {vote.correctAnswer && <span className="inline-flex items-center gap-1"><Award className="w-3.5 h-3.5 text-emerald-600" /> 공식 결과 <b className="text-emerald-700">{vote.correctAnswer}</b></span>}
                  </div>
                  {mine && (
                    <div className={`mt-3 rounded-xl px-4 py-3 flex items-center gap-3 ${vote.myCorrect === true ? 'bg-emerald-600 text-white' : vote.myCorrect === false ? 'bg-white border border-slate-200' : 'bg-white border border-slate-200'}`}>
                      <span className={`w-9 h-9 rounded-full inline-flex items-center justify-center shrink-0 ${vote.myCorrect === true ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>{vote.myCorrect === true ? <Trophy className="w-4 h-4" /> : <Vote className="w-4 h-4" />}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-extrabold">{vote.myCorrect === true ? `내 예측 결과 · 적중! ${vote.correctBonus}P 지급` : vote.myCorrect === false ? '내 예측 결과 · 아쉽게 빗나갔어요' : '내 선택'}</p>
                        <p className={`text-[12px] mt-0.5 ${vote.myCorrect === true ? 'text-white/80' : 'text-slate-500'}`}>{mine}{myRes ? ` · 득표율 ${myRes.percent}%` : ''}{vote.myCorrect === true ? ' · 팬포인트 내역에서 확인할 수 있어요' : vote.myCorrect === false ? ' · 참여 보상은 그대로 적립됩니다' : ''}</p>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <Link to="/fan/vote?tab=MINE" className="h-10 rounded-xl border border-slate-200 bg-white text-[12.5px] font-bold text-slate-700 inline-flex items-center justify-center hover:border-slate-400">내 참여 보기</Link>
                    <Link to="/fan/vote" className="h-10 rounded-xl bg-emerald-600 text-white text-[12.5px] font-bold inline-flex items-center justify-center hover:bg-emerald-700">다른 VOTE 참여</Link>
                    <button type="button" onClick={share} className="h-10 rounded-xl border border-slate-200 bg-white text-[12.5px] font-bold text-slate-700 inline-flex items-center justify-center gap-1 hover:border-slate-400"><Share2 className="w-3.5 h-3.5" /> {shared ? '복사됨' : '공유하기'}</button>
                  </div>
                </div>
              )}

              {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-2.5 text-[13px] font-bold text-rose-600 break-keep">{error}</p>}
            </section>

            {/* 종료까지 · 보상 · 지난 결과 스트립 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Panel className="!p-4">
                <p className="text-[12px] font-bold text-slate-500 inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 투표 종료까지</p>
                <p className="mt-1.5 text-[20px] font-black tabular-nums leading-none">{vote.closed ? '종료' : remain(vote.remainMs)}</p>
                <p className="mt-1.5 text-[11.5px] text-slate-500">{fmtDateTime(vote.closeAt)} 마감</p>
              </Panel>
              <Panel className="!p-4">
                <p className="text-[12px] font-bold text-slate-500 inline-flex items-center gap-1"><Coins className="w-3.5 h-3.5" /> 참여 보상</p>
                <p className="mt-1.5 text-[20px] font-black tabular-nums leading-none text-emerald-700">{vote.earnPoints}P{vote.correctBonus > 0 && <span className="text-[13px] text-amber-600"> + 정답 {vote.correctBonus}P</span>}</p>
                <p className="mt-1.5 text-[11.5px] text-slate-500">투표 종료 후 확정 지급</p>
              </Panel>
              <Panel className="!p-4">
                <p className="text-[12px] font-bold text-slate-500 inline-flex items-center gap-1"><History className="w-3.5 h-3.5" /> 지난 투표 결과</p>
                {prev?.results?.length ? (
                  <>
                    <p className="mt-1.5 text-[13px] font-extrabold truncate" title={prev.title}>{prev.title}</p>
                    <p className="mt-1 text-[12px] text-slate-600 break-keep">
                      <b className="text-slate-900">{prev.results[0].label}</b> {prev.results[0].percent}% · {nf(prev.participants)}명 참여
                    </p>
                    <Link to={`/fan/vote/${prev.id}`} className="mt-1.5 inline-block text-[11.5px] font-bold text-emerald-700 hover:underline">결과 보기</Link>
                  </>
                ) : <p className="mt-1.5 text-[12.5px] text-slate-500 break-keep">{a ? `${a.name} 프로의 종료된 투표가 아직 없습니다.` : '지난 투표 기록이 없습니다.'}</p>}
              </Panel>
            </div>

            {/* 최근 성적 요약 */}
            {a && (
              <Panel>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[15px] font-extrabold inline-flex items-center gap-1.5"><BarChart3 className="w-4 h-4 text-emerald-600" /> 최근 성적 요약</p>
                  <Link to={`/athletes/${a.id}?tab=results`} className="text-[12px] font-bold text-slate-500 hover:text-slate-900">대회 성과 전체 보기</Link>
                </div>
                {rs ? (
                  <>
                    <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { k: `최근 ${rs.count}경기 평균 순위`, v: `${rs.avgRank}위` },
                        { k: 'TOP 10 진입', v: `${rs.top10}회` },
                        { k: '최고 순위', v: `${rs.bestRank}위` },
                        { k: '최근 대회', v: rs.latest?.rank != null ? `${rs.latest.rank}위` : '기록 확인 필요', sub: rs.latest ? `${rs.latest.eventName} · ${fmtDate(rs.latest.eventDate, { month: 'numeric', day: 'numeric' })}` : undefined },
                      ].map((x) => (
                        <div key={x.k} className="rounded-xl bg-slate-50 px-3 py-3">
                          <dt className="text-[11.5px] text-slate-500">{x.k}</dt>
                          <dd className="mt-1 text-[18px] font-black tabular-nums leading-none">{x.v}</dd>
                          {x.sub && <dd className="mt-1 text-[11px] text-slate-500 truncate" title={x.sub}>{x.sub}</dd>}
                        </div>
                      ))}
                    </dl>
                    <p className="mt-2.5 text-[11.5px] text-slate-500">승인된 공식 대회 기록 기준 · 최근 {rs.results.length}개 대회</p>
                  </>
                ) : <p className="mt-3 text-[13px] text-slate-500">공식 대회 기록이 아직 등록되지 않았습니다. <span className="text-slate-400">확인 필요</span></p>}
              </Panel>
            )}
          </div>

          {/* ── 사이드바 ── */}
          <aside className="space-y-3 lg:sticky lg:top-20">
            <Panel>
              <p className="text-[14px] font-extrabold inline-flex items-center gap-1.5"><Info className="w-4 h-4 text-sky-500" /> 투표 안내</p>
              <ol className="mt-3 space-y-3">
                {vote.guides?.map((g: any, i: number) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[11.5px] font-extrabold inline-flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="min-w-0"><p className="text-[13px] font-bold">{g.title}</p><p className="text-[12px] text-slate-500 break-keep">{g.desc}</p></div>
                  </li>
                ))}
              </ol>
            </Panel>
            <Panel>
              <p className="text-[14px] font-extrabold inline-flex items-center gap-1.5"><Vote className="w-4 h-4 text-emerald-600" /> 이번 VOTE 정보</p>
              <dl className="mt-3 divide-y divide-slate-100 text-[12.5px]">
                {[
                  { k: '유형', v: vote.typeLabel },
                  { k: '시작', v: fmtDateTime(vote.createdAt) },
                  { k: '마감', v: fmtDateTime(vote.closeAt) },
                  { k: '참여', v: `${nf(vote.participants)}명` },
                  { k: '선택 변경', v: vote.changeable ? '마감 전 1회 가능' : '불가' },
                  { k: '결과 공개', v: '종료 후 검증 완료 시' },
                ].map((x) => (
                  <div key={x.k} className="flex justify-between gap-3 py-2"><dt className="text-slate-500">{x.k}</dt><dd className="font-bold text-right tabular-nums break-keep">{x.v}</dd></div>
                ))}
              </dl>
            </Panel>
            <Link to={a ? `/fan/community/${a.id}` : '/fan/community'} className="block rounded-2xl bg-[#0a1411] text-white p-4 hover:bg-[#0e1a16]">
              <p className="text-[11px] font-extrabold tracking-[0.2em] text-emerald-300">COMMUNITY</p>
              <p className="mt-1.5 text-[15px] font-extrabold break-keep">{a ? `${a.name} 프로 커뮤니티에서 응원 남기기` : '선수 커뮤니티에서 응원 남기기'}</p>
              <p className="mt-1 text-[12px] text-white/70 break-keep">투표 소감을 나누면 팬온도와 팬포인트에 함께 반영됩니다.</p>
            </Link>
          </aside>
        </div>
      </Container>

      {/* 하단 고정 CTA */}
      {selectable && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200">
          <div className="max-w-[1180px] mx-auto px-5 py-3 flex items-center gap-3">
            <div className="hidden sm:block min-w-0 flex-1">
              <p className="text-[12px] text-slate-500">내 선택</p>
              <p className="text-[14px] font-extrabold truncate">{picked || '아직 선택하지 않았습니다'}</p>
            </div>
            <button type="button" onClick={submit} disabled={!picked || submitting || (canChange && picked === mine)}
              className="h-12 flex-1 sm:flex-none sm:w-[320px] rounded-xl bg-emerald-600 text-white text-[15px] font-extrabold hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 inline-flex items-center justify-center gap-2">
              <Vote className="w-4 h-4" /> {submitting ? '제출 중…' : canChange ? '이 선택으로 변경하기' : isAuthenticated ? '이 선택으로 투표하기' : '로그인하고 투표하기'}
            </button>
          </div>
        </div>
      )}
      {selectable && <div className="h-20" />}
    </FanPage>
  );
}
