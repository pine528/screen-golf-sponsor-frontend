/**
 * IA14 감사로그 (핸드오프 v1.0 §11.4)
 * 로그는 변경·삭제가 불가능하다. 민감 변경은 별도로 표시한다.
 */
import { useCallback, useEffect, useState } from 'react';
import { Search, ShieldCheck, AlertTriangle, X, Lock } from 'lucide-react';
import { api } from '../../../services/api';
import AboutAdminShell, {
  Panel, Tag, Empty, Loading, useAdminGuard, nf, fmtDate,
} from '../../../components/aboutadmin/AboutAdminShell';

export default function AboutOpsAudit() {
  const guard = useAdminGuard();
  const [from, setFrom] = useState(new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [entity, setEntity] = useState('ALL');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.getAboutAuditLogs({ from, to, entity, action: action || undefined, page, limit: 20 })
      .then((r) => setData(r.data))
      .catch((e) => guard(e, '/admin/about/audit'))
      .finally(() => setLoading(false));
  }, [from, to, entity, action, page]);
  useEffect(() => { load(); }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <AboutAdminShell title="감사로그" desc="시스템에서 발생한 모든 관리자 조치를 확인합니다. 로그는 변경·삭제가 불가능합니다."
      breadcrumb={['권리·감사', '감사로그']}
      actions={
        <span className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-emerald-200 bg-emerald-50 text-[12.5px] font-bold text-emerald-700">
          <ShieldCheck className="w-4 h-4" /> 무결성 보존
        </span>
      }>
      {loading && !data ? <Loading /> : !data ? <Empty title="감사로그를 불러오지 못했습니다" /> : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 flex flex-wrap items-center gap-3">
            <span className="text-[12px] font-semibold text-slate-500">보관 기간</span>
            <Tag>{data.retention.years}년 · {data.retention.policy}</Tag>
            <span className="text-[12px] text-slate-500 tabular-nums ml-auto">
              총 {nf(data.total)}건 (조회 범위 내)
            </span>
          </div>

          {/* 필터 */}
          <Panel>
            <div className="p-4 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2">
                <span className="text-[12.5px] font-semibold text-slate-500">기간</span>
                <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }}
                  className="h-9 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none" />
                <span className="text-slate-300">~</span>
                <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }}
                  className="h-9 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none" />
              </label>
              <label className="flex items-center gap-2">
                <span className="text-[12.5px] font-semibold text-slate-500">엔티티</span>
                <select value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }}
                  className="h-9 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none">
                  <option value="ALL">전체</option>
                  {data.entityTypes.map((e2: any) => (
                    <option key={e2.code} value={e2.code}>{e2.code} ({e2.count})</option>
                  ))}
                </select>
              </label>
              <div className="relative ml-auto">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
                <input value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}
                  placeholder="액션 검색"
                  className="h-9 w-52 pl-9 pr-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
              </div>
            </div>
          </Panel>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* 로그 목록 */}
            <Panel className="lg:col-span-2" title="이벤트">
              {data.logs.length ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="text-[12px] text-slate-500 border-b border-slate-100">
                          <th className="text-left font-semibold px-5 py-2.5">시간</th>
                          <th className="text-left font-semibold py-2.5">액터</th>
                          <th className="text-left font-semibold py-2.5">액션</th>
                          <th className="text-left font-semibold py-2.5">엔티티</th>
                          <th className="text-left font-semibold px-5 py-2.5">사유</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.logs.map((l: any) => (
                          <tr key={l.id} onClick={() => setSelected(l)}
                            className={`border-b border-slate-50 last:border-0 cursor-pointer transition ${
                              selected?.id === l.id ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
                            }`}>
                            <td className="px-5 py-3 tabular-nums text-slate-500 whitespace-nowrap">{fmtDate(l.at, true)}</td>
                            <td className="py-3 font-mono text-[12px] text-slate-600 truncate max-w-[110px]">{l.actor.slice(0, 10)}</td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-1.5">
                                {l.sensitive && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                <span className="font-semibold text-slate-800 truncate max-w-[180px]">{l.action}</span>
                              </span>
                            </td>
                            <td className="py-3 text-slate-500 text-[12px]">{l.entityType}</td>
                            <td className="px-5 py-3 text-slate-500 truncate max-w-[200px]">{l.reason ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 py-3.5 border-t border-slate-100">
                      <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                        className="h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-semibold disabled:opacity-40">이전</button>
                      <span className="text-[12px] text-slate-500 tabular-nums px-1">{page} / {totalPages}</span>
                      <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                        className="h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-semibold disabled:opacity-40">다음</button>
                    </div>
                  )}
                </>
              ) : (
                <Empty title="해당 조건의 로그가 없습니다" desc="관리자 조치가 발생하면 이곳에 기록됩니다." />
              )}
            </Panel>

            {/* 상세 */}
            <Panel title="이벤트 상세"
              right={selected && (
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              )}>
              {!selected ? (
                <Empty title="이벤트를 선택하세요" />
              ) : (
                <div className="p-5 space-y-4">
                  {selected.sensitive && (
                    <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[13px] font-bold text-rose-700">민감 작업</p>
                        <p className="text-[12.5px] text-rose-600 mt-0.5">공개범위·성과·권리·정산에 영향을 주는 변경입니다.</p>
                      </div>
                    </div>
                  )}

                  <dl className="space-y-2.5 text-[12.5px]">
                    {[
                      { l: '이벤트 ID', v: selected.id },
                      { l: '시간', v: fmtDate(selected.at, true) },
                      { l: '액터', v: selected.actor },
                      { l: '액션', v: selected.action },
                      { l: '엔티티', v: `${selected.entityType} / ${selected.entityId?.slice(0, 20) ?? '—'}` },
                      { l: 'IP', v: selected.ip ?? '—' },
                    ].map((r) => (
                      <div key={r.l} className="flex items-start justify-between gap-3">
                        <dt className="text-slate-500 shrink-0">{r.l}</dt>
                        <dd className="font-mono text-[12.5px] text-slate-700 text-right break-all">{r.v}</dd>
                      </div>
                    ))}
                  </dl>

                  {selected.reason && (
                    <div>
                      <p className="text-[12px] font-bold text-slate-500 mb-1.5">사유</p>
                      <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-[12.5px] text-slate-700 leading-relaxed">{selected.reason}</p>
                    </div>
                  )}

                  {selected.body && (
                    <div>
                      <p className="text-[12px] font-bold text-slate-500 mb-1.5">변경 내용</p>
                      <pre className="rounded-xl bg-slate-900 text-slate-200 p-3.5 text-[12px] leading-relaxed overflow-x-auto">
                        {JSON.stringify(selected.body, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                    <p className="text-[12px] text-slate-500 leading-relaxed">{data.notice}</p>
                  </div>
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}
    </AboutAdminShell>
  );
}
