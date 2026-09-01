/**
 * A02 VOTE 목록 · 캘린더 + A03 결과 확정 (핸드오프 v1.0 §18.2 · §5)
 * 같은 선수의 기간이 겹치는 VOTE는 목록 위에 경고로 띄운다.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Search, Calendar, List, Lock, X } from 'lucide-react';
import { api } from '../../../services/api';
import FanAdminShell, {
  Panel, StatusTag, Empty, Loading, useAdminGuard, nf, fmtDate,
} from '../../../components/fanadmin/FanAdminShell';

const STATUS_TONE: Record<string, 'emerald' | 'sky' | 'violet' | 'slate'> = {
  OPEN: 'emerald', CLOSED: 'slate', SETTLED: 'violet',
};

export default function FanOpsVotes() {
  const guard = useAdminGuard();
  const [view, setView] = useState<'LIST' | 'CALENDAR'>('LIST');
  const [status, setStatus] = useState('ALL');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settleId, setSettleId] = useState<string | null>(null);
  const [settlement, setSettlement] = useState<any>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.getFanAdminVotes({ status, q: q || undefined, page, limit: 10 })
      .then((r) => setData(r.data))
      .catch((e) => guard(e, '/admin/fan/votes'))
      .finally(() => setLoading(false));
  }, [status, q, page]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!settleId) { setSettlement(null); return; }
    api.getFanAdminVoteSettlement(settleId).then((r) => setSettlement(r.data)).catch(() => setSettlement(null));
  }, [settleId]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  /* 캘린더 — 이번 달 그리드 */
  const cal = useMemo(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const startPad = (first.getDay() + 6) % 7; // 월요일 시작
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [
      ...Array.from({ length: startPad }, () => null),
      ...Array.from({ length: days }, (_, i) => new Date(now.getFullYear(), now.getMonth(), i + 1)),
    ];
    return { cells, label: `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}` };
  }, []);

  const votesOn = (d: Date) =>
    (data?.calendar ?? []).filter((v: any) => {
      const open = new Date(v.openAt), close = new Date(v.closeAt);
      return d >= new Date(open.toDateString()) && d <= new Date(close.toDateString());
    });

  return (
    <FanAdminShell title="VOTE 목록 · 캘린더" desc="진행 중인 팬 투표와 결과 확정 상태를 관리합니다."
      breadcrumb={['팬 운영', 'VOTE 관리']}
      actions={
        <div className="flex rounded-xl border border-slate-200 bg-white p-0.5">
          {[
            { key: 'LIST', label: '목록', icon: List },
            { key: 'CALENDAR', label: '캘린더', icon: Calendar },
          ].map((v) => {
            const I = v.icon;
            return (
              <button key={v.key} onClick={() => setView(v.key as any)}
                className={`h-9 px-3.5 rounded-lg text-[13px] font-bold inline-flex items-center gap-1.5 transition ${
                  view === v.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                }`}>
                <I className="w-3.5 h-3.5" /> {v.label}
              </button>
            );
          })}
        </div>
      }>
      {/* 중복 경고 */}
      {data?.overlaps?.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="w-4.5 h-4.5 text-amber-500 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-amber-800">
              동일 선수 · 기간 중복 {data.overlaps.length}건
            </p>
            <p className="text-[12px] text-amber-700 mt-1">
              {data.overlaps.slice(0, 3).map((o: any) => o.athlete?.name).filter(Boolean).join(', ')} 선수의 VOTE 기간이 겹칩니다.
              팬 참여가 분산될 수 있으니 일정을 확인하세요.
            </p>
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(data?.statuses ?? []).map((s: any) => (
          <button key={s.code} onClick={() => { setStatus(s.code); setPage(1); }}
            className={`h-9 px-3.5 rounded-xl text-[13px] font-semibold border transition ${
              status === s.code ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}>
            {s.label}
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="VOTE ID · 문항 검색"
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-[13px] placeholder:text-slate-300 focus:outline-none focus:border-slate-400" />
        </div>
      </div>

      {loading ? <Loading /> : view === 'LIST' ? (
        <Panel>
          {data?.votes?.length ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-[11px] text-slate-400 border-b border-slate-100">
                      <th className="text-left font-semibold px-5 py-3">문항</th>
                      <th className="text-left font-semibold py-3">선수</th>
                      <th className="text-left font-semibold py-3 whitespace-nowrap">공개 기간</th>
                      <th className="text-right font-semibold py-3">참여</th>
                      <th className="text-left font-semibold py-3 pl-6">상태</th>
                      <th className="text-right font-semibold px-5 py-3">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.votes.map((v: any) => (
                      <tr key={v.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-800 max-w-[320px] truncate">{v.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{v.id.slice(0, 8)}</p>
                        </td>
                        <td className="py-3.5 text-slate-600 whitespace-nowrap">{v.athlete?.name ?? '—'}</td>
                        <td className="py-3.5 text-slate-500 tabular-nums whitespace-nowrap text-[12px]">
                          {fmtDate(v.openAt)} ~ {fmtDate(v.closeAt)}
                        </td>
                        <td className="py-3.5 text-right tabular-nums font-semibold text-slate-700">{nf(v.participants)}</td>
                        <td className="py-3.5 pl-6"><StatusTag label={v.statusLabel} tone={STATUS_TONE[v.status] ?? 'slate'} /></td>
                        <td className="px-5 py-3.5 text-right">
                          <button onClick={() => setSettleId(v.id)}
                            className="inline-flex h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-600 hover:border-slate-400 items-center">
                            결과 확인
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-4 border-t border-slate-100">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                    className="h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-semibold disabled:opacity-40">이전</button>
                  <span className="text-[12px] text-slate-500 tabular-nums px-2">{page} / {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                    className="h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-semibold disabled:opacity-40">다음</button>
                </div>
              )}
            </>
          ) : (
            <Empty title="해당하는 VOTE가 없습니다" desc="다른 상태나 검색어로 확인해보세요." />
          )}
        </Panel>
      ) : (
        <Panel title={cal.label}>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['월', '화', '수', '목', '금', '토', '일'].map((d) => (
                <div key={d} className="text-center text-[11px] font-bold text-slate-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cal.cells.map((d, i) => (
                <div key={i} className={`min-h-[86px] rounded-xl border p-1.5 ${
                  d ? 'border-slate-100 bg-white' : 'border-transparent'
                }`}>
                  {d && (
                    <>
                      <p className="text-[11px] font-semibold text-slate-400 mb-1">{d.getDate()}</p>
                      <div className="space-y-1">
                        {votesOn(d).slice(0, 2).map((v: any) => (
                          <button key={v.id} onClick={() => setSettleId(v.id)}
                            className={`w-full text-left px-1.5 py-1 rounded-md text-[10px] font-semibold leading-tight truncate ${
                              v.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700'
                                : v.status === 'SETTLED' ? 'bg-violet-50 text-violet-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {v.athlete?.name ? `${v.athlete.name} · ` : ''}{v.title}
                          </button>
                        ))}
                        {votesOn(d).length > 2 && (
                          <p className="text-[10px] text-slate-400 px-1.5">+{votesOn(d).length - 2}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
              {[
                { label: '진행 중', cls: 'bg-emerald-500' },
                { label: '결과확정', cls: 'bg-violet-500' },
                { label: '종료', cls: 'bg-slate-300' },
              ].map((l) => (
                <span key={l.label} className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className={`w-2 h-2 rounded-full ${l.cls}`} /> {l.label}
                </span>
              ))}
            </div>
          </div>
        </Panel>
      )}

      {/* A03 결과 확정 패널 */}
      {settleId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30" onClick={() => setSettleId(null)}>
          <div className="w-full max-w-[520px] h-full bg-white overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-slate-900">결과 확인 및 확정</h2>
              <button onClick={() => setSettleId(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {!settlement ? <div className="p-6"><Loading /></div> : (
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-[16px] font-bold text-slate-900 leading-snug">{settlement.title}</p>
                  <p className="text-[12px] text-slate-400 mt-1">마감 {fmtDate(settlement.closeAt, true)}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[11px] text-slate-400 font-semibold">유효 참여</p>
                    <p className="text-[19px] font-extrabold text-slate-900 tabular-nums">{nf(settlement.validParticipants)}명</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 px-4 py-3">
                    <p className="text-[11px] text-amber-600 font-semibold">보류·의심 표</p>
                    <p className="text-[19px] font-extrabold text-amber-700 tabular-nums">{nf(settlement.suspiciousCount)}건</p>
                  </div>
                </div>

                <div>
                  <p className="text-[12px] font-bold text-slate-500 mb-2">집계 결과</p>
                  <div className="space-y-2">
                    {settlement.results.map((r: any) => (
                      <div key={r.label} className="rounded-xl border border-slate-200 px-4 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[14px] font-semibold text-slate-800">{r.label}</span>
                          <span className="text-[13px] font-extrabold text-slate-900 tabular-nums">
                            {r.percent === null ? '집계 중' : `${r.percent}%`}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-slate-900" style={{ width: `${r.percent ?? 0}%` }} />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 tabular-nums">{nf(r.count)}표</p>
                      </div>
                    ))}
                  </div>
                </div>

                {settlement.settled ? (
                  <div className="rounded-xl bg-emerald-50 px-4 py-3.5 flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <p className="text-[13px] font-bold text-emerald-700">
                      결과가 확정되었습니다{settlement.correctAnswer ? ` · 정답 "${settlement.correctAnswer}"` : ''}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3.5">
                      <ul className="space-y-1">
                        {settlement.warnings.map((w: string, i: number) => (
                          <li key={i} className="text-[12px] text-rose-600 leading-relaxed pl-3 relative">
                            <span className="absolute left-0 top-[7px] w-1 h-1 rounded-full bg-rose-400" />{w}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-[12px] text-slate-400 leading-relaxed">
                      결과 확정은 공식 기록 출처를 등록한 뒤 진행합니다. 출처 등록·확정 처리는 다음 단계에서 연결됩니다.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </FanAdminShell>
  );
}
