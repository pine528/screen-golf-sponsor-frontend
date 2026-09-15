/**
 * F10 포인트 내역 `/fan/points/ledger` — 시안 2026-09-15 (리디자인/9 · 21)
 *
 *  탭(전체/적립/사용/예정/소멸) → 요약 3(사용 가능 · 예정 · 30일 내 소멸) → 기간 · 선수 필터 · 초기화
 *  → 표(일시 · 유형 · 내용 · 선수 · 포인트 · 상태, 행 펼침: 적립 사유 · 참조 번호 · 유의 사항 · 이의 신청) → 숫자 페이지네이션
 *  우: 포인트 소멸 예정 일정 · 포인트 정책 안내. 하단 고지.
 *  값은 원장(PointLedgerTx) 그대로. 원장은 삭제되지 않는다.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, HelpCircle, Hourglass, Receipt, RotateCcw, ShieldCheck, UserRound, Wallet } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { AthleteAvatar, Skeleton, nf } from '../../components/fanhub/FanKit';
import { FanPage, Container, FanCrumb, BackButton, Panel, fmtDate } from '../../components/fanhub/FanShell';

const FILTERS = [
  { key: '', label: '전체' }, { key: 'EARN', label: '적립' }, { key: 'SPEND', label: '사용' }, { key: 'PENDING', label: '예정' }, { key: 'EXPIRED', label: '소멸' },
];
const KIND: Record<string, { label: string; dot: string; amount: string; status: string; statusCls: string; note: string }> = {
  EARN: { label: '적립', dot: 'bg-emerald-500', amount: 'text-emerald-600', status: '확정', statusCls: 'bg-emerald-50 text-emerald-700', note: '확정된 포인트는 바로 사용할 수 있습니다.' },
  PENDING: { label: '적립', dot: 'bg-emerald-500', amount: 'text-emerald-600', status: '예정', statusCls: 'bg-amber-50 text-amber-700', note: '검증(투표 결과 확정 · 24시간 유지 · 구매 확정 등) 후 포인트가 지급됩니다.' },
  SPEND: { label: '사용', dot: 'bg-rose-500', amount: 'text-rose-500', status: '사용', statusCls: 'bg-slate-100 text-slate-600', note: '사용한 포인트는 주문 취소 시 원장에 환원 거래로 기록됩니다.' },
  EXPIRE: { label: '소멸', dot: 'bg-slate-400', amount: 'text-slate-500', status: '소멸', statusCls: 'bg-slate-100 text-slate-500', note: '유효기간이 지나 자동 소멸된 포인트입니다.' },
  REVERSE: { label: '차감', dot: 'bg-rose-500', amount: 'text-rose-500', status: '취소', statusCls: 'bg-rose-50 text-rose-600', note: '중복·부정 참여 또는 취소로 회수된 포인트입니다.' },
};
const fmtTs = (d: string) => {
  const t = new Date(d);
  return { date: fmtDate(t), time: t.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }) };
};
const toInput = (d: Date) => d.toISOString().slice(0, 10);

export default function FanPointLedger() {
  const { isAuthenticated } = useAuth();
  const [sp, setSp] = useSearchParams();
  const kind = sp.get('kind') || '';
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [athleteId, setAthleteId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const LIMIT = 10;

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    setLoading(true);
    api.getMyPointLedger({ kind: kind || undefined, page, limit: LIMIT, from: from || undefined, to: to ? `${to}T23:59:59` : undefined, athleteId: athleteId || undefined })
      .then((r) => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [isAuthenticated, kind, page, from, to, athleteId]);

  const items: any[] = data?.items || [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const pages = useMemo(() => {
    const arr: (number | '…')[] = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - page) <= 2) arr.push(p);
      else if (arr[arr.length - 1] !== '…') arr.push('…');
    }
    return arr;
  }, [totalPages, page]);
  const setKind = (k: string) => { setSp(k ? { kind: k } : {}); setPage(1); setOpen(null); };
  const reset = () => { setFrom(''); setTo(''); setAthleteId(''); setPage(1); setKind(''); };
  const filtered = !!(from || to || athleteId);

  return (
    <FanPage>
      <Container className="pt-5">
        <FanCrumb items={[{ label: '팬 참여', to: '/fan' }, { label: '팬포인트', to: '/fan/points' }, { label: '포인트 내역' }]} />
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-start gap-4">
              <BackButton to="/fan/points" />
              <div className="min-w-0 flex-1">
                <h1 className="text-[28px] sm:text-[34px] font-extrabold tracking-[-0.03em] leading-tight">포인트 내역</h1>
                <p className="mt-1 text-[13.5px] text-slate-600 break-keep">팬포인트의 적립, 사용, 예정, 소멸 내역을 확인하세요.</p>
              </div>
              <Link to="/fan/points" className="text-[12.5px] font-bold text-slate-600 inline-flex items-center gap-1 hover:text-slate-900"><HelpCircle className="w-3.5 h-3.5" /> 팬포인트란?</Link>
            </div>

            {!isAuthenticated ? (
              <Panel className="mt-6 max-w-lg text-center py-10">
                <p className="text-[16px] font-extrabold">로그인하면 포인트 내역을 볼 수 있어요</p>
                <Link to={`/login?returnUrl=${encodeURIComponent('/fan/points/ledger')}`} className="mt-5 inline-flex h-11 px-6 rounded-xl bg-emerald-600 text-white text-[14px] font-bold items-center">로그인하기</Link>
              </Panel>
            ) : (
              <>
                {/* 탭 */}
                <div className="mt-5 inline-grid grid-cols-5 rounded-xl border border-slate-200 bg-white p-1 w-full sm:w-auto">
                  {FILTERS.map((f) => <button key={f.key} type="button" onClick={() => setKind(f.key)} aria-pressed={kind === f.key} className={`h-10 px-4 sm:px-6 rounded-lg text-[13.5px] font-bold ${kind === f.key ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{f.label}</button>)}
                </div>

                {/* 요약 */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { icon: Wallet, k: '사용 가능 포인트', v: data?.summary?.available, cls: 'text-emerald-700', bg: 'bg-emerald-50 text-emerald-600', hint: '사용 가능한 포인트입니다.' },
                    { icon: Hourglass, k: '예정 포인트', v: data?.summary?.pending, cls: 'text-emerald-700', bg: 'bg-emerald-50 text-emerald-600', hint: '확정 전인 포인트입니다.' },
                    { icon: CalendarDays, k: '소멸 예정 포인트', v: data?.summary?.expiringSoon, cls: 'text-rose-500', bg: 'bg-rose-50 text-rose-500', hint: '30일 이내 소멸 예정 포인트입니다.' },
                  ].map((x) => { const I = x.icon; return (
                    <Panel key={x.k} className="!p-4 flex items-center gap-3.5">
                      <span className={`w-12 h-12 rounded-full inline-flex items-center justify-center shrink-0 ${x.bg}`}><I className="w-5 h-5" /></span>
                      <div className="min-w-0"><p className="text-[12.5px] font-bold text-slate-600">{x.k}</p><p className={`text-[22px] font-black tabular-nums leading-none mt-0.5 ${x.cls}`}>{data ? `${nf(x.v ?? 0)}P` : '—'}</p><p className="mt-1 text-[11px] text-slate-500">{x.hint}</p></div>
                    </Panel>
                  ); })}
                </div>

                {/* 필터 */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <label className="h-11 px-3 rounded-xl border border-slate-200 bg-white inline-flex items-center gap-2 text-[12.5px]"><CalendarDays className="w-4 h-4 text-slate-400" />
                    <input type="date" value={from} max={to || toInput(new Date())} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="bg-transparent outline-none tabular-nums" aria-label="시작일" />
                    <span className="text-slate-400">~</span>
                    <input type="date" value={to} min={from || undefined} max={toInput(new Date())} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="bg-transparent outline-none tabular-nums" aria-label="종료일" />
                  </label>
                  <label className="h-11 px-3 rounded-xl border border-slate-200 bg-white inline-flex items-center gap-2 text-[12.5px]"><UserRound className="w-4 h-4 text-slate-400" />
                    <select value={athleteId} onChange={(e) => { setAthleteId(e.target.value); setPage(1); }} className="bg-transparent outline-none font-bold text-slate-700 pr-2" aria-label="선수">
                      <option value="">전체 선수</option>
                      {(data?.athletes || []).map((a: any) => <option key={a.id} value={a.id}>{a.name} 프로</option>)}
                    </select>
                  </label>
                  <button type="button" onClick={reset} disabled={!filtered && !kind} className="ml-auto h-11 px-4 rounded-xl border border-slate-200 bg-white text-[12.5px] font-bold text-slate-600 inline-flex items-center gap-1.5 hover:border-slate-400 disabled:opacity-40"><RotateCcw className="w-3.5 h-3.5" /> 초기화</button>
                </div>

                {/* 표 */}
                <Panel className="mt-3 !p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-[13px]">
                      <thead><tr className="bg-slate-50 text-[12px] text-slate-500">
                        {['일시', '유형', '내용', '선수', '포인트', '상태', ''].map((h, i) => <th key={i} className={`px-4 py-3 font-bold ${i === 4 ? 'text-right' : i === 5 ? 'text-center' : 'text-left'}`}>{h}</th>)}
                      </tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {loading ? (
                          Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-8" /></td></tr>)
                        ) : items.length ? items.map((t) => {
                          const m = KIND[t.kind] || KIND.EARN;
                          const ts = fmtTs(t.createdAt);
                          const isOpen = open === t.id;
                          return [
                            <tr key={t.id} onClick={() => setOpen(isOpen ? null : t.id)} className={`cursor-pointer hover:bg-slate-50/70 ${isOpen ? 'bg-emerald-50/40' : ''}`}>
                              <td className="px-4 py-3 tabular-nums text-slate-700"><span className="block">{ts.date}</span><span className="block text-[11.5px] text-slate-400">{ts.time}</span></td>
                              <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 font-bold text-slate-700"><span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />{m.label}</span></td>
                              <td className="px-4 py-3"><span className="block font-bold text-slate-900 break-keep">{t.label}</span>{t.description && t.description !== t.label && <span className="block text-[11.5px] text-slate-500 truncate max-w-[280px]" title={t.description}>{t.description}</span>}</td>
                              <td className="px-4 py-3">{t.athlete ? <span className="inline-flex items-center gap-2"><AthleteAvatar athlete={t.athlete} size={26} /><span className="font-bold text-slate-700">{t.athlete.name} 프로</span></span> : <span className="text-slate-400">—</span>}</td>
                              <td className={`px-4 py-3 text-right font-black tabular-nums ${m.amount}`}>{t.amount > 0 ? '+' : t.amount < 0 ? '−' : ''}{nf(Math.abs(t.amount))}P</td>
                              <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-md text-[11.5px] font-bold ${m.statusCls}`}>{m.status}</span></td>
                              <td className="px-3 py-3 text-slate-400">{isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</td>
                            </tr>,
                            isOpen && (
                              <tr key={`${t.id}-d`} className="bg-emerald-50/40">
                                <td colSpan={7} className="px-4 pb-4 pt-0">
                                  <div className="rounded-xl bg-white border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-[1fr_1fr_1.3fr_auto] gap-4 text-[12.5px]">
                                    <div><p className="font-bold text-slate-500">{t.amount >= 0 ? '적립 사유' : '차감 사유'}</p><p className="mt-1 text-slate-800 break-keep">{t.description || t.label}</p></div>
                                    <div><p className="font-bold text-slate-500">참조 번호</p><p className="mt-1 text-slate-800 font-mono text-[12px] break-all">{t.refType}{t.refId ? `-${String(t.refId).slice(0, 18)}` : ''}</p></div>
                                    <div><p className="font-bold text-slate-500">유의 사항</p><p className="mt-1 text-slate-800 break-keep">{m.note}{t.expiresAt && t.kind === 'EARN' ? ` 유효기간 ${fmtDate(t.expiresAt)}까지.` : ''}</p></div>
                                    <div className="sm:self-center"><Link to="/contact" className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-slate-200 font-bold text-slate-700 hover:border-slate-400">이의 신청하기 <ChevronRight className="w-3.5 h-3.5" /></Link></div>
                                  </div>
                                </td>
                              </tr>
                            ),
                          ];
                        }) : (
                          <tr><td colSpan={7} className="px-4 py-12 text-center"><Receipt className="w-6 h-6 text-slate-300 mx-auto" /><p className="mt-2 text-[14px] font-bold text-slate-600">해당하는 내역이 없습니다</p><p className="text-[12px] text-slate-500">다른 탭이나 기간을 선택해보세요.</p></td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Panel>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-1">
                    <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="이전" className="w-9 h-9 rounded-lg border border-slate-200 bg-white inline-flex items-center justify-center text-slate-600 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                    {pages.map((p, i) => p === '…' ? <span key={`e${i}`} className="w-9 text-center text-slate-400">…</span> : (
                      <button key={p} type="button" onClick={() => setPage(p)} aria-current={p === page ? 'page' : undefined} className={`w-9 h-9 rounded-lg border text-[13px] font-bold tabular-nums ${p === page ? 'border-emerald-500 bg-white text-emerald-700' : 'border-transparent text-slate-600 hover:bg-white'}`}>{p}</button>
                    ))}
                    <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="다음" className="w-9 h-9 rounded-lg border border-slate-200 bg-white inline-flex items-center justify-center text-slate-600 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                )}
                <p className="mt-5 text-[12px] text-slate-500 break-keep">{data?.policy?.notice || '포인트는 현금으로 환불이 불가하며, 타인에게 양도할 수 없습니다. 부정 사용이 확인될 경우 포인트 회수 및 서비스 이용이 제한될 수 있습니다.'}</p>
              </>
            )}
          </div>

          {/* ── 사이드 ── */}
          <aside className="space-y-3">
            <Panel>
              <p className="text-[14.5px] font-extrabold inline-flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-rose-500" /> 포인트 소멸 예정 일정</p>
              <div className="mt-3 rounded-xl bg-rose-50/60 border border-rose-100 px-4 py-3 flex items-center justify-between"><span className="text-[13px] font-bold text-slate-700">30일 이내 소멸 예정</span><span className="text-[18px] font-black text-rose-500 tabular-nums">{data ? `${nf(data.summary?.expiringSoon ?? 0)}P` : '—'}</span></div>
              {data?.summary?.expirySchedule?.length ? (
                <ul className="mt-3 divide-y divide-slate-100">{data.summary.expirySchedule.map((e: any, i: number) => <li key={i} className="py-2 flex justify-between text-[13px]"><span className="text-slate-600 tabular-nums">{fmtDate(e.expiresAt)}</span><span className="font-bold tabular-nums">{nf(e.amount)}P</span></li>)}</ul>
              ) : <p className="mt-3 text-[12.5px] text-slate-500">30일 이내에 소멸 예정인 포인트가 없습니다.</p>}
              <button type="button" onClick={() => setKind('EXPIRED')} className="mt-3 w-full h-10 rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-700 inline-flex items-center justify-center gap-1 hover:border-slate-400">전체 소멸 내역 보기 <ChevronRight className="w-3.5 h-3.5" /></button>
            </Panel>
            <Panel>
              <p className="text-[14.5px] font-extrabold inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> 포인트 정책 안내</p>
              <ul className="mt-3 space-y-3">
                {[
                  { icon: Clock, t: '포인트 유효기간', d: `적립일로부터 ${data?.policy?.expiryMonths ?? 12}개월간 유효하며, 이후 자동 소멸됩니다.` },
                  { icon: Receipt, t: '포인트 적립 기준', d: 'VOTE 참여, 예측 성공, 커뮤니티 활동, 브랜드 추천, 팬스토어 구매 등 다양한 활동을 통해 적립할 수 있습니다.' },
                  { icon: Wallet, t: '사용 안내', d: '팬스토어 할인, 응원 프로젝트 참여 등에 사용할 수 있습니다.' },
                ].map((x) => { const I = x.icon; return (
                  <li key={x.t} className="flex gap-3"><span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 inline-flex items-center justify-center shrink-0"><I className="w-4 h-4" /></span><div><p className="text-[13px] font-bold">{x.t}</p><p className="mt-0.5 text-[12px] text-slate-500 break-keep">{x.d}</p></div></li>
                ); })}
              </ul>
              <Link to="/fan/points" className="mt-4 w-full h-10 rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-700 inline-flex items-center justify-center gap-1 hover:border-slate-400">자세히 보기</Link>
            </Panel>
          </aside>
        </div>
      </Container>
    </FanPage>
  );
}
