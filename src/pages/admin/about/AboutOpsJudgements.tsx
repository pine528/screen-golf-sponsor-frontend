/**
 * IA08 성과보장 판정 (핸드오프 v1.0 §8.5)
 * 계약 기준과 수집 실적을 나란히 놓고 비교한다.
 * 최종 확정 후에는 수정할 수 없으며, 필수 데이터가 없으면 확정 자체가 막힌다.
 */
import { useCallback, useEffect, useState } from 'react';
import {Search, Lock, AlertTriangle, Database, Scale, X} from 'lucide-react';
import { api } from '../../../services/api';
import AboutAdminShell, {
  Panel, Tag, Empty, Loading, useAdminGuard, nf, fmtDate,
} from '../../../components/aboutadmin/AboutAdminShell';

const RESULT_TONE: Record<string, 'emerald' | 'rose' | 'amber' | 'slate'> = {
  MET: 'emerald', NOT_MET: 'rose', DATA_PENDING: 'amber',
};

const JUDGE_TONE: Record<string, 'emerald' | 'rose' | 'amber' | 'slate'> = {
  MET: 'emerald', NOT_MET: 'rose', DATA_PENDING: 'amber', EXCLUDED: 'slate',
};

export default function AboutOpsJudgements() {
  const guard = useAdminGuard();
  const [status, setStatus] = useState('ALL');
  const [q, setQ] = useState('');
  const [list, setList] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.getGuaranteeJudgements({ status, q: q || undefined, limit: 30 })
      .then((r) => {
        setList(r.data);
        if (!selected && r.data?.items?.[0]) setSelected(r.data.items[0].id);
      })
      .catch((e) => guard(e, '/admin/about/judgements'))
      .finally(() => setLoading(false));
  }, [status, q]);
  useEffect(() => { load(); }, [load]);

  const loadDetail = useCallback((id: string) => {
    setError(null); setMsg(null);
    api.getGuaranteeJudgement(id).then((r) => setDetail(r.data)).catch(() => setDetail(null));
  }, []);
  useEffect(() => { if (selected) loadDetail(selected); }, [selected, loadDetail]);

  const updateObs = async (id: string, body: any) => {
    setBusy(true); setError(null);
    try { await api.updateGuaranteeObservation(id, body); loadDetail(selected!); }
    catch (e: any) { setError(e?.response?.data?.error?.message || '수정에 실패했습니다'); }
    finally { setBusy(false); }
  };

  const finalize = async () => {
    setBusy(true); setError(null); setMsg(null);
    try {
      const r = await api.finalizeGuaranteeJudgement(selected!);
      setMsg(`최종 확정되었습니다 · ${r.data.result}${r.data.notice ? ` (${r.data.notice})` : ''}`);
      setConfirm(false);
      await load(); loadDetail(selected!);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '확정에 실패했습니다');
      setConfirm(false);
    } finally { setBusy(false); }
  };

  const s = detail?.snapshot;
  const auto = detail?.autoResult;

  return (
    <AboutAdminShell title="성과보장 판정" desc="계약별 KPI 실적을 검토하고 결과를 확정합니다."
      breadcrumb={['성과보장', '판정 관리']}>
      {loading && !list ? <Loading /> : !list ? <Empty title="판정 목록을 불러오지 못했습니다" /> : (
        <div className="space-y-4">
          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">{error}</div>}
          {msg && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">{msg}</div>}

          <div className="grid lg:grid-cols-5 gap-4">
            {/* 목록 */}
            <Panel className="lg:col-span-2" title={`계약 ${nf(list.total)}건`}
              right={
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-300" />
                  <input value={q} onChange={(e) => setQ(e.target.value)}
                    placeholder="브랜드 · 선수"
                    className="h-9 w-36 pl-8 pr-2 rounded-lg border border-slate-200 text-[12px] focus:outline-none focus:border-slate-400" />
                </div>
              }>
              <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap gap-1.5">
                {[{ code: 'ALL', label: '전체' }, ...(list.byStatus ?? []).map((b: any) => ({ code: b.code, label: `${b.code} ${b.count}` }))].map((b: any) => (
                  <button key={b.code} onClick={() => setStatus(b.code)}
                    className={`h-7 px-2.5 rounded-lg text-[11.5px] font-bold border transition ${
                      status === b.code ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'
                    }`}>
                    {b.label}
                  </button>
                ))}
              </div>
              {list.items.length ? (
                <div className="divide-y divide-slate-50 max-h-[560px] overflow-y-auto">
                  {list.items.map((it: any) => (
                    <button key={it.id} onClick={() => setSelected(it.id)}
                      className={`w-full text-left px-4 py-3.5 transition ${
                        selected === it.id ? 'bg-emerald-50/50 border-l-2 border-l-emerald-500' : 'hover:bg-slate-50'
                      }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Tag tone={RESULT_TONE[it.autoResult] ?? 'slate'}>{it.autoResult}</Tag>
                        <span className="font-mono text-[11px] text-slate-400">{it.policyVersion}</span>
                        {it.finalized && <Lock className="w-3 h-3 text-slate-400" />}
                      </div>
                      <p className="text-[13.5px] font-bold text-slate-800 truncate">
                        {it.brandName} × {it.athleteName}
                      </p>
                      <p className="text-[11.5px] text-slate-400 mt-0.5 tabular-nums">
                        측정 {fmtDate(it.measureStart)} ~ {fmtDate(it.measureEnd)}
                      </p>
                    </button>
                  ))}
                </div>
              ) : <Empty title="해당하는 계약이 없습니다" />}
            </Panel>

            {/* 상세 */}
            <div className="lg:col-span-3 space-y-4">
              {!detail || !s ? (
                <Panel><Empty title="계약을 선택하세요" /></Panel>
              ) : (
                <>
                  <Panel title={`${s.brandName} × ${s.athleteName}`}
                    right={
                      <div className="flex items-center gap-2">
                        <Tag>{s.policyVersion} 잠금됨</Tag>
                        {s.locked && <Tag tone="slate"><Lock className="w-3 h-3" /> 확정</Tag>}
                      </div>
                    }>
                    <div className="p-5 grid sm:grid-cols-4 gap-4 text-[13px]">
                      {[
                        { l: '계약 ID', v: s.contractId ?? '—' },
                        { l: '계약 금액', v: s.contractAmount ? `${nf(s.contractAmount)}원` : '—' },
                        { l: '측정 기간', v: `${fmtDate(s.measureStart)} ~ ${fmtDate(s.measureEnd)}` },
                        { l: '판정 방식', v: s.judgeMode + (s.minScore ? ` (${s.minScore}%)` : '') },
                      ].map((r) => (
                        <div key={r.l}>
                          <p className="text-[11px] text-slate-400 font-semibold">{r.l}</p>
                          <p className="mt-0.5 font-semibold text-slate-800 tabular-nums">{r.v}</p>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  {/* KPI 비교 */}
                  <Panel title="성과 지표별 실적 및 판정" right={<span className="text-[11.5px] text-slate-400">자동 산출</span>}>
                    {detail.observations.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                          <thead>
                            <tr className="text-[11px] text-slate-400 border-b border-slate-100">
                              <th className="text-left font-semibold px-5 py-2.5">지표</th>
                              <th className="text-left font-semibold py-2.5">출처</th>
                              <th className="text-right font-semibold py-2.5">실적</th>
                              <th className="text-right font-semibold py-2.5">목표</th>
                              <th className="text-right font-semibold py-2.5">달성률</th>
                              <th className="text-right font-semibold py-2.5">가중치</th>
                              <th className="text-left font-semibold py-2.5 pl-4">자동 판정</th>
                              <th className="text-left font-semibold px-5 py-2.5">예외</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.observations.map((o: any) => (
                              <tr key={o.id} className="border-b border-slate-50 last:border-0">
                                <td className="px-5 py-3">
                                  <p className="font-semibold text-slate-800">{o.label}</p>
                                  {!o.required && <span className="text-[10.5px] text-slate-400">보조 지표</span>}
                                </td>
                                <td className="py-3 text-slate-500">{o.sourceName ?? '—'}</td>
                                <td className="py-3 text-right tabular-nums">
                                  {o.actual === null ? (
                                    <span className="text-slate-300">집계 중</span>
                                  ) : (
                                    <span className="font-bold text-slate-900">{nf(o.actual)}{o.unit}</span>
                                  )}
                                </td>
                                <td className="py-3 text-right tabular-nums text-slate-600">{nf(o.target)}{o.unit}</td>
                                <td className={`py-3 text-right tabular-nums font-extrabold ${
                                  o.achievementRate === null ? 'text-slate-300'
                                    : o.achievementRate >= 100 ? 'text-emerald-600' : 'text-rose-500'
                                }`}>
                                  {o.achievementRate === null ? '—' : `${o.achievementRate}%`}
                                </td>
                                <td className="py-3 text-right tabular-nums text-slate-500">{o.weight}%</td>
                                <td className="py-3 pl-4">
                                  <Tag tone={JUDGE_TONE[o.judgement] ?? 'slate'}>{o.judgement}</Tag>
                                </td>
                                <td className="px-5 py-3">
                                  <select value={o.excludeReason ?? 'NONE'} disabled={busy || s.locked}
                                    onChange={(e) => updateObs(o.id, { excludeReason: e.target.value, sourceName: o.sourceName })}
                                    className="h-8 px-2 rounded-lg border border-slate-200 text-[11.5px] font-semibold focus:outline-none disabled:bg-slate-50">
                                    {detail.exclusions.map((x: any) => <option key={x.code} value={x.code}>{x.label}</option>)}
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="px-5 py-3 border-t border-slate-100 text-[11.5px] text-slate-400">
                          달성률은 소수점 반올림이며, 최종 판정은 가중 합산 및 정책 규칙에 따릅니다.
                          미수집 지표는 0으로 간주하지 않습니다.
                        </p>
                      </div>
                    ) : (
                      <Empty title="등록된 KPI 관측치가 없습니다" />
                    )}
                  </Panel>

                  <div className="grid lg:grid-cols-2 gap-4">
                    {/* 자동 판정 */}
                    <Panel title="판정 및 조치">
                      <div className="p-5">
                        <p className="text-[12px] font-semibold text-slate-400 mb-1.5">자동 예비 판정</p>
                        <p className={`text-[24px] font-extrabold tabular-nums ${
                          auto?.status === 'MET' ? 'text-emerald-600'
                            : auto?.status === 'NOT_MET' ? 'text-rose-600' : 'text-amber-600'
                        }`}>
                          {auto?.status}
                          {auto?.score !== null && auto?.score !== undefined && (
                            <span className="text-[15px] text-slate-400 ml-2">{auto.score}%</span>
                          )}
                        </p>
                        <p className="mt-2 text-[13px] text-slate-600 leading-relaxed">{auto?.reason}</p>

                        {detail.remedyEstimate && (
                          <div className="mt-4 rounded-2xl bg-violet-50 border border-violet-100 px-4 py-3.5">
                            <p className="text-[12px] font-bold text-violet-800 mb-1">예상 보완지원</p>
                            <p className="text-[18px] font-extrabold text-violet-700 tabular-nums">
                              {nf(detail.remedyEstimate.amount)}원
                              <span className="text-[12px] text-violet-500 ml-2">({detail.remedyEstimate.ratio}%)</span>
                            </p>
                            <p className="mt-1 text-[11px] text-violet-600">
                              상한 {nf(detail.remedyEstimate.cap)}원 · 사용 기한 {detail.remedyEstimate.validMonths}개월
                            </p>
                          </div>
                        )}

                        {detail.warnings?.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {detail.warnings.map((w: string, i: number) => (
                              <div key={i} className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-3.5 py-2.5">
                                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                <p className="text-[12px] text-amber-800 leading-relaxed">{w}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-5 grid grid-cols-2 gap-2">
                          <button disabled={busy || s.locked}
                            onClick={() => detail.observations.forEach((o: any) => updateObs(o.id, { collectStatus: 'PENDING' }))}
                            className="h-11 rounded-xl border border-emerald-200 text-emerald-700 text-[13px] font-bold hover:bg-emerald-50 disabled:opacity-40 inline-flex items-center justify-center gap-1.5">
                            <Database className="w-4 h-4" /> 데이터 재수집
                          </button>
                          <button disabled={busy || s.locked || auto?.status === 'DATA_PENDING'}
                            onClick={() => setConfirm(true)}
                            className="h-11 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 inline-flex items-center justify-center gap-1.5">
                            <Scale className="w-4 h-4" /> 최종 확정
                          </button>
                        </div>
                      </div>
                    </Panel>

                    {/* 감사 추적 */}
                    <Panel title="감사 추적" right={<span className="text-[11.5px] text-slate-400">{detail.auditTrail.length}건</span>}>
                      {detail.auditTrail.length ? (
                        <div className="divide-y divide-slate-50 max-h-[320px] overflow-y-auto">
                          {detail.auditTrail.map((l: any, i: number) => (
                            <div key={i} className="px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <span className="text-[11px] text-slate-400 tabular-nums w-24 shrink-0">{fmtDate(l.at, true)}</span>
                                <span className="font-mono text-[11px] text-slate-500 truncate">{l.actor.slice(0, 10)}</span>
                              </div>
                              <p className="text-[12.5px] text-slate-700 mt-0.5">{l.reason || l.action}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Empty title="기록된 조치가 없습니다" />
                      )}
                    </Panel>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 확정 확인 */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" onClick={() => setConfirm(false)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-extrabold text-slate-900">최종 판정 확정</h2>
              <button onClick={() => setConfirm(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3.5 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[13.5px] font-bold text-rose-700">확정 후에는 판정을 변경할 수 없습니다.</p>
                <p className="text-[12px] text-rose-600 mt-0.5">계속하시겠습니까?</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3.5">
              <p className="text-[12px] text-slate-500 mb-1">최종 판정 결과</p>
              <p className={`text-[18px] font-extrabold ${auto?.status === 'MET' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {auto?.status}
              </p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={() => setConfirm(false)}
                className="h-11 rounded-xl border border-slate-200 text-[14px] font-bold text-slate-600">취소</button>
              <button disabled={busy} onClick={finalize}
                className="h-11 rounded-xl bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700 disabled:bg-slate-200">
                {busy ? '처리 중…' : '확정'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AboutAdminShell>
  );
}
