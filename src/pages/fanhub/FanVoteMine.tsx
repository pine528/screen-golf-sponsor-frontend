/**
 * 내가 만든 투표 `/fan/vote/mine` — 시안 2026-09-15 "내가 만든 투표 더보기"
 *  요약(만든 투표 · 진행 중 · 참여자 · 참여 적립) → 목록(상태 · 참여 수 · 적립 · 정답 입력 · 취소)
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Coins, FilePlus2, Loader2, Plus, Users, Vote, X } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';
import { Countdown, Skeleton, nf } from '../../components/fanhub/FanKit';

export default function FanVoteMine() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [answering, setAnswering] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.getMyFanVotes().then((r: any) => setData(r?.data || null)).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const settle = async (id: string, answer: string) => {
    setBusyId(id); setMsg(null);
    try { const r: any = await api.settleMyFanVote(id, answer); setMsg(`정답 "${r.data.correctAnswer}" 확정 · 정답자 ${r.data.winners}명에게 보너스 적립`); setAnswering(null); load(); }
    catch (e: any) { setMsg(e?.response?.data?.error?.message || '정산하지 못했습니다'); } finally { setBusyId(null); }
  };
  const cancel = async (id: string) => {
    if (!window.confirm('이 투표를 취소할까요? 참여자가 없을 때만 가능합니다.')) return;
    setBusyId(id); setMsg(null);
    try { await api.cancelMyFanVote(id); load(); } catch (e: any) { setMsg(e?.response?.data?.error?.message || '취소하지 못했습니다'); } finally { setBusyId(null); }
  };

  const s = data?.summary;
  const STATUS: Record<string, { label: string; cls: string }> = {
    OPEN: { label: '진행 중', cls: 'bg-emerald-50 text-emerald-700' }, CLOSED: { label: '종료', cls: 'bg-slate-100 text-slate-600' },
    SETTLED: { label: '정산 완료', cls: 'bg-sky-50 text-sky-700' }, CANCELED: { label: '취소됨', cls: 'bg-rose-50 text-rose-600' },
  };

  return (
    <div className="min-h-screen bg-[#f3faf6] text-slate-900 pb-16">
      <PublicHeader />
      <div className="max-w-[1180px] mx-auto px-5 pt-5">
        <div className="flex items-center gap-3">
          <Link to="/fan/vote" aria-label="뒤로" className="w-9 h-9 rounded-xl border border-slate-200 bg-white inline-flex items-center justify-center text-slate-600"><ArrowLeft className="w-4 h-4" /></Link>
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[13px]">
            <Link to="/fan" className="text-slate-500 hover:text-slate-700">팬 참여</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link to="/fan/vote" className="text-slate-500 hover:text-slate-700">Fan VOTE</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-emerald-700">내가 만든 투표</span>
          </nav>
        </div>
        <div className="mt-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-[26px] sm:text-[32px] font-extrabold tracking-[-0.03em]">내가 만든 투표</h1>
            <p className="mt-1 text-[13.5px] text-slate-600 break-keep">다른 팬이 참여하면 팬포인트가 적립되고, 예측형은 마감 후 정답을 입력해 정산합니다.</p>
          </div>
          <Link to="/fan/vote/create" className="h-11 px-5 rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold inline-flex items-center gap-1.5 hover:bg-emerald-700"><Plus className="w-4 h-4" /> 새 투표 만들기</Link>
        </div>

        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            { icon: FilePlus2, tone: 'bg-emerald-50 text-emerald-600', l: '만든 투표', v: s?.total },
            { icon: Vote, tone: 'bg-sky-50 text-sky-600', l: '진행 중', v: s?.open },
            { icon: Users, tone: 'bg-violet-50 text-violet-600', l: '총 참여자', v: s?.participants },
            { icon: Coins, tone: 'bg-amber-50 text-amber-600', l: '참여 적립', v: s ? `${nf(s.hostEarned)}P` : undefined },
          ].map((c) => {
            const I = c.icon;
            return (
              <div key={c.l} className="rounded-2xl bg-white border border-slate-200 px-4 py-3.5 flex items-center gap-3">
                <span className={`w-10 h-10 rounded-full inline-flex items-center justify-center shrink-0 ${c.tone}`}><I className="w-5 h-5" /></span>
                <div><p className="text-[12px] text-slate-500">{c.l}</p><p className="text-[20px] font-extrabold tabular-nums leading-none mt-0.5">{loading ? '—' : c.v ?? 0}</p></div>
              </div>
            );
          })}
        </div>
        {data?.rules && <p className="mt-2 text-[12px] text-slate-500">참여자당 +{data.rules.hostPointsPerParticipant}P · 투표당 {data.rules.hostPerVoteCap}명 · 일 {data.rules.hostDailyCap}건까지 적립 · 하루 {data.rules.maxDailyCreates}개까지 만들 수 있어요</p>}
        {msg && <p className="mt-3 rounded-xl bg-white border border-emerald-200 px-4 py-2.5 text-[13px] font-bold text-emerald-700 break-keep">{msg}</p>}

        <div className="mt-4">
          {loading ? (
            <div className="space-y-2.5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[110px]" />)}</div>
          ) : !data?.votes?.length ? (
            <div className="rounded-2xl bg-white border border-dashed border-slate-200 py-12 text-center">
              <span className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 inline-flex items-center justify-center"><FilePlus2 className="w-6 h-6" /></span>
              <p className="mt-3 text-[15px] font-extrabold">아직 만든 투표가 없습니다</p>
              <p className="mt-1 text-[13px] text-slate-500">관심 선수의 경기 예측이나 브랜드 설문을 직접 열어보세요.</p>
              <Link to="/fan/vote/create" className="mt-4 inline-flex h-10 px-4 items-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold"><Plus className="w-4 h-4" /> 투표 만들기</Link>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {data.votes.map((v: any) => {
                const st = STATUS[v.status] || STATUS.OPEN;
                const label = v.status === 'OPEN' && v.closed ? { label: '마감', cls: 'bg-slate-100 text-slate-600' } : st;
                return (
                  <li key={v.id} className="rounded-2xl bg-white border border-slate-200 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[11px] font-extrabold ${label.cls}`}>{label.label}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-bold text-slate-600">{v.typeLabel}</span>
                          {v.needsAnswer && <span className="px-1.5 py-0.5 rounded bg-amber-50 text-[11px] font-extrabold text-amber-700">정답 입력 필요</span>}
                        </div>
                        <Link to={`/fan/vote/${v.id}`} className="mt-1 block text-[15px] font-extrabold break-keep hover:text-emerald-700">{v.title}</Link>
                        <p className="mt-1 text-[12.5px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
                          {v.athlete && <span>{v.athlete.name} 프로</span>}
                          <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {nf(v.participants)}명 참여</span>
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold"><Coins className="w-3.5 h-3.5" /> 적립 {nf(v.hostEarned)}P{v.hostCapReached ? ' (상한)' : ''}</span>
                          <span>{v.closed ? `${new Date(v.closeAt).toLocaleDateString('ko-KR')} 마감` : <>남은 시간 <Countdown ms={new Date(v.closeAt).getTime() - Date.now()} /></>}</span>
                          {v.correctAnswer && <span>정답: <b>{v.correctAnswer}</b></span>}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Link to={`/fan/vote/${v.id}`} className="h-10 px-3.5 rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-700 inline-flex items-center">현황 보기</Link>
                        {v.needsAnswer && <button onClick={() => setAnswering(answering === v.id ? null : v.id)} className="h-10 px-3.5 rounded-xl bg-amber-500 text-white text-[12.5px] font-bold inline-flex items-center">정답 입력</button>}
                        {v.canCancel && <button onClick={() => cancel(v.id)} disabled={busyId === v.id} className="h-10 w-10 rounded-xl border border-slate-200 text-slate-500 inline-flex items-center justify-center hover:text-rose-600 hover:border-rose-200" aria-label="투표 취소">{busyId === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}</button>}
                      </div>
                    </div>
                    {answering === v.id && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-[12.5px] font-bold text-slate-700">공식 기록 기준 정답을 고르세요. 정답자에게 보너스 포인트가 적립되고 되돌릴 수 없습니다.</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {v.options.map((o: string) => <button key={o} onClick={() => settle(v.id, o)} disabled={busyId === v.id} className="h-10 px-4 rounded-xl border border-amber-300 bg-amber-50 text-[13px] font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50">{o}</button>)}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
