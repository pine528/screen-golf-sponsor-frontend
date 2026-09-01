/**
 * A01 팬 운영 대시보드 (핸드오프 v1.0 §18.2)
 * 집계할 데이터가 없는 지표는 비율을 만들지 않고 "집계 중"으로 둔다 (LEG-06).
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Inbox, RefreshCw, CheckCircle2, XCircle, MinusCircle, Play } from 'lucide-react';
import { api } from '../../../services/api';
import FanAdminShell, {
  KpiCard, Panel, RiskTag, Empty, Loading, useAdminGuard, nf, fmtDate, fmtRemain,
} from '../../../components/fanadmin/FanAdminShell';

export default function FanOpsDashboard() {
  const nav = useNavigate();
  const guard = useAdminGuard();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);

  const load = () =>
    api.getFanAdminDashboard()
      .then((r) => setData(r.data))
      .catch((e) => guard(e, '/admin/fan'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const runBatch = async (job: string) => {
    setRunning(job);
    try { await api.runFanBatch(job); await load(); }
    finally { setRunning(null); }
  };

  return (
    <FanAdminShell
      title="팬 운영 대시보드"
      desc="팬 운영 전반의 현황을 한 눈에 확인하세요."
      breadcrumb={['팬 운영', '대시보드']}
      actions={
        <>
          <button onClick={() => nav('/admin/fan/votes')}
            className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 transition inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> VOTE 관리
          </button>
          <Link to="/admin/fan/moderation"
            className="h-10 px-4 rounded-xl border border-emerald-200 text-emerald-700 text-[13px] font-bold hover:bg-emerald-50 transition inline-flex items-center gap-1.5">
            <Inbox className="w-4 h-4" /> 검수함 열기
          </Link>
        </>
      }>
      {loading ? <Loading /> : !data ? <Empty title="대시보드를 불러오지 못했습니다" /> : (
        <div className="space-y-4">
          {/* KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {data.kpis.map((k: any) => (
              <KpiCard key={k.key} label={k.label} value={k.value} unit={k.unit} delta={k.delta} sub={k.deltaLabel} />
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* 예외 처리 큐 */}
            <Panel className="lg:col-span-2"
              title="오늘의 예외 처리 큐"
              right={
                <span className="inline-flex items-center h-6 px-2 rounded-lg bg-rose-50 text-rose-600 text-[11px] font-bold">
                  {nf(data.queueTotal)}건
                </span>
              }>
              {data.queue.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-[11px] text-slate-400 border-b border-slate-100">
                        <th className="text-left font-semibold px-5 py-2.5">우선순위</th>
                        <th className="text-left font-semibold py-2.5">유형</th>
                        <th className="text-left font-semibold py-2.5">제목</th>
                        <th className="text-left font-semibold py-2.5 whitespace-nowrap">발생 시간</th>
                        <th className="text-left font-semibold py-2.5 whitespace-nowrap">SLA</th>
                        <th className="text-right font-semibold px-5 py-2.5">작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.queue.map((q: any) => (
                        <tr key={q.id} className="border-b border-slate-50 last:border-0">
                          <td className="px-5 py-3"><RiskTag risk={q.risk} /></td>
                          <td className="py-3 text-slate-600 whitespace-nowrap">{q.kind}</td>
                          <td className="py-3 min-w-[200px]">
                            <p className="font-semibold text-slate-800 truncate max-w-[280px]">{q.title}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{q.sub}</p>
                          </td>
                          <td className="py-3 text-slate-500 whitespace-nowrap tabular-nums">{fmtDate(q.at, true)}</td>
                          <td className={`py-3 whitespace-nowrap font-semibold tabular-nums ${q.overdue ? 'text-rose-500' : 'text-slate-500'}`}>
                            {q.slaDueAt ? fmtRemain(+new Date(q.slaDueAt) - Date.now()) : '기준 없음'}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Link to={q.to}
                              className="inline-flex h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-600 hover:border-slate-400 items-center">
                              {q.action}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty title="처리할 예외가 없습니다" desc="SLA를 넘긴 검수·신고 건이 생기면 이곳에 표시됩니다." />
              )}
            </Panel>

            {/* 모듈 헬스 */}
            <Panel title="모듈별 상태">
              <div className="p-4 grid grid-cols-2 gap-2">
                {data.modules.map((m: any) => (
                  <div key={m.label} className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3">
                    <p className="text-[12px] font-bold text-slate-700 mb-1.5">{m.label}</p>
                    <div className="flex items-center gap-1.5">
                      {m.ok === null ? <MinusCircle className="w-3.5 h-3.5 text-slate-300" />
                        : m.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        : <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                      <span className={`text-[12px] font-semibold ${
                        m.ok === null ? 'text-slate-400' : m.ok ? 'text-emerald-600' : 'text-rose-500'
                      }`}>
                        {m.ok === null ? '데이터 없음' : m.ok ? '정상' : '점검 필요'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
                      {m.healthRate !== null ? `${m.healthRate}% · ${nf(m.total)}건` : m.note}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* 배치 작업 */}
            <Panel title="배치 작업 상태">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-[11px] text-slate-400 border-b border-slate-100">
                      <th className="text-left font-semibold px-5 py-2.5">작업명</th>
                      <th className="text-left font-semibold py-2.5">최근 실행</th>
                      <th className="text-left font-semibold py-2.5">상태</th>
                      <th className="text-right font-semibold px-5 py-2.5">수동 실행</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.batches.map((b: any) => (
                      <tr key={b.job} className="border-b border-slate-50 last:border-0">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-slate-800">{b.label}</p>
                          <p className="text-[11px] text-slate-400">{b.schedule}</p>
                        </td>
                        <td className="py-3 text-slate-500 tabular-nums whitespace-nowrap">
                          {b.lastRunAt ? fmtDate(b.lastRunAt, true) : '—'}
                        </td>
                        <td className="py-3">
                          {b.status ? (
                            <span className={`inline-flex h-6 px-2 rounded-lg text-[11px] font-bold ${
                              b.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700'
                                : b.status === 'FAILED' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {b.status === 'SUCCESS' ? '성공' : b.status === 'FAILED' ? '실패' : '실행 중'}
                            </span>
                          ) : <span className="text-[12px] text-slate-300">{b.message}</span>}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button disabled={running === b.job} onClick={() => runBatch(b.job)}
                            className="inline-flex h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-600 hover:border-slate-400 items-center gap-1 disabled:opacity-40">
                            {running === b.job ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                            실행
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            {/* 최근 운영 활동 */}
            <Panel title="최근 운영 활동">
              {data.activities.length ? (
                <div className="divide-y divide-slate-50">
                  {data.activities.map((a: any) => (
                    <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="text-[11px] text-slate-400 tabular-nums w-24 shrink-0">{fmtDate(a.at, true)}</span>
                      <span className="inline-flex h-6 px-2 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold shrink-0">
                        {a.module}
                      </span>
                      <p className="text-[13px] text-slate-700 truncate flex-1">{a.reason || a.action}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty title="기록된 운영 활동이 없습니다" desc="관리자 조치가 발생하면 감사 로그와 함께 이곳에 표시됩니다." />
              )}
            </Panel>
          </div>

          <p className="text-[11px] text-slate-400 px-1">{data.notice}</p>
        </div>
      )}
    </FanAdminShell>
  );
}
