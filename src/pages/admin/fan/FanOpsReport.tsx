/**
 * A12 팬 · 선수 · 브랜드 통합 성과 리포트 (핸드오프 v1.0 §18.2)
 * 개별 팬을 식별할 수 있는 항목은 넣지 않는다. 집계가 불가능한 지표는 비운다 (LEG-06).
 */
import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../../../services/api';
import FanAdminShell, {
  KpiCard, Panel, Empty, Loading, useAdminGuard, nf, fmtDate,
} from '../../../components/fanadmin/FanAdminShell';

export default function FanOpsReport() {
  const guard = useAdminGuard();
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.getFanAdminReport12({ from, to })
      .then((r) => setData(r.data))
      .catch((e) => guard(e, '/admin/fan/report'))
      .finally(() => setLoading(false));
  }, [from, to]);
  useEffect(() => { load(); }, [load]);

  const maxFunnel = data ? Math.max(1, ...data.funnel.map((f: any) => f.value)) : 1;

  return (
    <FanAdminShell title="팬 · 선수 · 브랜드 통합 성과 리포트" desc="팬 참여 전반의 성과를 기간별로 집계합니다."
      breadcrumb={['분석·리포트', '팬 참여']}
      actions={
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
          <span className="text-slate-300">~</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
          <button onClick={load}
            className="h-10 px-3 rounded-xl border border-slate-200 text-slate-500 hover:border-slate-400 flex items-center">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }>
      {loading && !data ? <Loading /> : !data ? <Empty title="리포트를 불러오지 못했습니다" /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {data.kpis.map((k: any) => (
              <KpiCard key={k.key} label={k.label} value={k.value} unit={k.unit} delta={k.delta} sub={k.sub} />
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* 스토어 퍼널 */}
            <Panel title="스토어 전환 퍼널">
              <div className="p-5 space-y-3">
                {data.funnel.map((f: any) => (
                  <div key={f.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-semibold text-slate-700">{f.label}</span>
                      <span className="text-[13px] font-extrabold text-slate-900 tabular-nums">
                        {nf(f.value)}
                        {f.rate !== null && <span className="text-[11px] text-slate-400 ml-1.5">{f.rate}%</span>}
                      </span>
                    </div>
                    <div className="h-7 rounded-lg bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-lg bg-slate-900/85 transition-[width]"
                        style={{ width: `${Math.max(2, (f.value / maxFunnel) * 100)}%` }} />
                    </div>
                  </div>
                ))}
                {data.funnel.every((f: any) => f.value === 0) && (
                  <p className="text-[12px] text-slate-400 text-center py-4">
                    선택 기간에 스토어 이동 기록이 없습니다.
                  </p>
                )}
              </div>
            </Panel>

            {/* 선수 성과 */}
            <Panel title="선수별 성과 TOP">
              {data.topAthletes.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-[11px] text-slate-400 border-b border-slate-100">
                        <th className="text-left font-semibold px-5 py-2.5">선수</th>
                        <th className="text-right font-semibold py-2.5">활성 팬</th>
                        <th className="text-right font-semibold py-2.5">활동</th>
                        <th className="text-right font-semibold py-2.5">팬온도</th>
                        <th className="text-right font-semibold px-5 py-2.5">포인트 발행</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topAthletes.map((a: any, i: number) => (
                        <tr key={a.athlete?.id ?? i} className="border-b border-slate-50 last:border-0">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="text-[11px] font-extrabold text-slate-300 tabular-nums w-4">{i + 1}</span>
                              <span className="font-semibold text-slate-800">{a.athlete?.name ?? '—'}</span>
                            </div>
                          </td>
                          <td className="py-3 text-right tabular-nums">{nf(a.activeFans)}</td>
                          <td className="py-3 text-right tabular-nums">{nf(a.activities)}</td>
                          <td className="py-3 text-right tabular-nums font-semibold">
                            {a.temperature === null ? '집계 중' : `${a.temperature.toFixed(1)}℃`}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums">{nf(a.pointsIssued)}P</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty title="집계할 선수 활동이 없습니다" desc="선택 기간에 유효한 팬 활동이 기록되지 않았습니다." />
              )}
            </Panel>
          </div>

          {/* 개인정보 고지 */}
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 flex items-start gap-3">
            <ShieldCheck className="w-4.5 h-4.5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-slate-700">개인정보 보호 및 집계 기준</p>
              <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{data.privacy.notice}</p>
              <p className="text-[11px] text-slate-400 mt-1.5 tabular-nums">
                집계 기간 {fmtDate(data.period.from)} ~ {fmtDate(data.period.to)} ({data.period.days}일) ·
                생성 {fmtDate(data.generatedAt, true)} (KST)
              </p>
            </div>
          </div>
        </div>
      )}
    </FanAdminShell>
  );
}
