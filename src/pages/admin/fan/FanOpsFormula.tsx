/**
 * A06 팬온도 산식 · 스냅샷 (핸드오프 v1.0 §6.4 · §18.2)
 * 점수는 직접 수정할 수 없다. 가중치를 바꾸면 새 버전으로 발행한다.
 */
import { useCallback, useEffect, useState } from 'react';
import { Lock, Play, RefreshCw, AlertTriangle, Thermometer } from 'lucide-react';
import { api } from '../../../services/api';
import FanAdminShell, {
  Panel, StatusTag, Empty, Loading, useAdminGuard, nf, fmtDate,
} from '../../../components/fanadmin/FanAdminShell';

export default function FanOpsFormula() {
  const guard = useAdminGuard();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [athleteId, setAthleteId] = useState('');
  const [athletes, setAthletes] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [version, setVersion] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.getFanFormula(athleteId || undefined)
      .then((r) => {
        setData(r.data);
        setWeights(r.data?.current?.weights ?? {});
      })
      .catch((e) => guard(e, '/admin/fan/formula'))
      .finally(() => setLoading(false));
  }, [athleteId]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.getCommunityAthletes({ limit: 60 })
      .then((r: any) => setAthletes(r?.data?.athletes ?? []))
      .catch(() => setAthletes([]));
  }, []);

  const sum = Object.values(weights).reduce((a, b) => a + Number(b || 0), 0);

  const publish = async () => {
    setBusy(true); setError(null); setMsg(null);
    try {
      await api.publishFanFormula({ version, weights, note });
      setEditing(false); setVersion(''); setNote('');
      setMsg('새 산식 버전이 발행되었습니다. 다음 배치부터 적용됩니다.');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '발행에 실패했습니다');
    } finally { setBusy(false); }
  };

  const runBatch = async () => {
    setBusy(true);
    try { await api.runFanBatch('FAN_TEMPERATURE'); await load(); }
    finally { setBusy(false); }
  };

  const snap = data?.snapshot;
  const trend = snap?.history ?? [];
  const maxT = Math.max(...trend.map((t: any) => t.score), 1);

  return (
    <FanAdminShell title="팬온도 산식 · 스냅샷" desc="산식 버전과 선수별 스냅샷, 계산 상태를 관리합니다."
      breadcrumb={['팬 운영', '팬온도']}
      actions={
        <button disabled={busy} onClick={runBatch}
          className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-600 hover:border-slate-400 inline-flex items-center gap-1.5 disabled:opacity-40">
          {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} 재계산 실행
        </button>
      }>
      {loading ? <Loading /> : !data ? <Empty title="산식 정보를 불러오지 못했습니다" /> : (
        <div className="space-y-4">
          {/* 수정 불가 고지 */}
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 flex items-start gap-3">
            <Lock className="w-4.5 h-4.5 text-sky-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-sky-800">점수 직접 수정 불가</p>
              <p className="text-[12px] text-sky-700 mt-0.5">{data.notice}</p>
            </div>
          </div>

          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">{error}</div>}
          {msg && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">{msg}</div>}

          <div className="grid lg:grid-cols-3 gap-4">
            {/* 산식 정보 */}
            <Panel title="산식 정보">
              <div className="p-5 space-y-3 text-[13px]">
                {[
                  { l: '버전', v: data.current.version },
                  { l: '집계 기간', v: `최근 ${data.current.windowDays}일` },
                  { l: '최근 7일 가중', v: `${data.current.recentBoost}배` },
                  { l: '최소 표본', v: `${data.current.minSample}명` },
                  { l: '적용 시작', v: data.current.effectiveAt ? fmtDate(data.current.effectiveAt, true) : '—' },
                ].map((r) => (
                  <div key={r.l} className="flex items-center justify-between">
                    <span className="text-slate-400">{r.l}</span>
                    <span className="font-semibold text-slate-800 tabular-nums">{r.v}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-slate-100">
                  <StatusTag label={data.current.status === 'ACTIVE' ? '운영 중' : data.current.status} tone="emerald" />
                  {data.current.note && <p className="text-[11px] text-slate-400 mt-2">{data.current.note}</p>}
                </div>
              </div>
            </Panel>

            {/* 가중치 */}
            <Panel className="lg:col-span-2" title="가중치"
              right={
                editing ? (
                  <span className={`text-[13px] font-extrabold tabular-nums ${sum === 100 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    합계 {sum}%
                  </span>
                ) : (
                  <button onClick={() => setEditing(true)}
                    className="h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-600 hover:border-slate-400">
                    가중치 편집
                  </button>
                )
              }>
              <div className="p-5 space-y-3">
                {data.components.map((c: any) => (
                  <div key={c.key} className="flex items-center gap-3">
                    <span className="text-[13px] font-semibold text-slate-700 w-40 shrink-0">{c.label}</span>
                    {editing ? (
                      <input type="number" min={0} max={100}
                        value={weights[c.key] ?? 0}
                        onChange={(e) => setWeights((w) => ({ ...w, [c.key]: Number(e.target.value) }))}
                        className="w-16 h-8 px-2 rounded-lg border border-slate-200 text-[13px] text-right tabular-nums focus:outline-none focus:border-slate-400" />
                    ) : (
                      <span className="w-16 text-right text-[13px] font-extrabold text-slate-900 tabular-nums">
                        {weights[c.key] ?? 0}%
                      </span>
                    )}
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-slate-900 transition-[width]"
                        style={{ width: `${weights[c.key] ?? 0}%` }} />
                    </div>
                  </div>
                ))}

                {editing && (
                  <div className="pt-4 mt-2 border-t border-slate-100 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">새 버전명 *</label>
                        <input value={version} onChange={(e) => setVersion(e.target.value)}
                          placeholder="예: fan-temp-v1.1-2026-09-01"
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] placeholder:text-slate-300 focus:outline-none focus:border-slate-400" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">변경 사유</label>
                        <input value={note} onChange={(e) => setNote(e.target.value)}
                          placeholder="무엇을 왜 바꿨는지"
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] placeholder:text-slate-300 focus:outline-none focus:border-slate-400" />
                      </div>
                    </div>
                    {sum !== 100 && (
                      <p className="text-[12px] font-semibold text-rose-500">가중치 합계가 100%여야 발행할 수 있습니다.</p>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => { setEditing(false); setWeights(data.current.weights); }}
                        className="h-10 px-4 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600">
                        취소
                      </button>
                      <button disabled={sum !== 100 || !version || busy} onClick={publish}
                        className="h-10 px-4 rounded-xl bg-slate-900 text-white text-[13px] font-bold hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400">
                        새 버전 발행
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      발행해도 과거 스냅샷은 이전 버전으로 보존됩니다. 소급 재계산은 하지 않습니다.
                    </p>
                  </div>
                )}
              </div>
            </Panel>
          </div>

          {/* 선수 스냅샷 */}
          <Panel title="선수 스냅샷"
            right={
              <select value={athleteId} onChange={(e) => setAthleteId(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 text-[13px] font-semibold focus:outline-none focus:border-slate-400">
                <option value="">선수를 선택하세요</option>
                {athletes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            }>
            {!snap ? (
              <Empty title="선수를 선택하면 스냅샷을 볼 수 있습니다"
                desc="배치가 실행되지 않았거나 활동이 없으면 스냅샷이 비어 있습니다." />
            ) : (
              <div className="p-5 grid lg:grid-cols-3 gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Thermometer className="w-5 h-5 text-slate-300" />
                    <span className="text-[36px] font-extrabold text-slate-900 tabular-nums leading-none">
                      {snap.score === null ? '—' : snap.score.toFixed(1)}
                      {snap.score !== null && <span className="text-[16px] text-slate-400 ml-1">℃</span>}
                    </span>
                  </div>
                  {snap.tier && <StatusTag label={snap.tier.label} tone="amber" />}
                  <div className="mt-4 space-y-2 text-[13px]">
                    {[
                      { l: '표본 수', v: snap.sampleSize === null ? '—' : `${nf(snap.sampleSize)}명` },
                      { l: '신뢰도', v: snap.confidence === null ? '—' : `${Math.round(snap.confidence * 100)}%` },
                      { l: '감점', v: snap.penalties === null ? '—' : `${snap.penalties}` },
                      { l: '전일 대비', v: snap.dailyDelta === null ? '비교 데이터 없음' : `${snap.dailyDelta > 0 ? '+' : ''}${snap.dailyDelta}℃` },
                      { l: '마지막 계산', v: snap.calculatedAt ? fmtDate(snap.calculatedAt, true) : '—' },
                    ].map((r) => (
                      <div key={r.l} className="flex items-center justify-between">
                        <span className="text-slate-400">{r.l}</span>
                        <span className="font-semibold text-slate-800 tabular-nums">{r.v}</span>
                      </div>
                    ))}
                  </div>
                  {snap.lowSample && (
                    <p className="mt-3 text-[12px] text-amber-600 font-semibold">
                      표본 부족 — 팬 화면에서는 점수가 공개되지 않습니다.
                    </p>
                  )}
                </div>

                {/* 추이 */}
                <div className="lg:col-span-2">
                  <p className="text-[12px] font-bold text-slate-500 mb-3">최근 30일 추이</p>
                  {trend.length > 1 ? (
                    <>
                      <div className="flex items-end gap-1 h-28">
                        {trend.map((t: any, i: number) => (
                          <div key={i} className="flex-1 rounded-t bg-slate-900/80"
                            style={{ height: `${Math.max(3, (t.score / maxT) * 100)}%` }} title={`${t.score.toFixed(1)}℃`} />
                        ))}
                      </div>
                      <div className="flex justify-between mt-2 text-[11px] text-slate-400">
                        <span>{fmtDate(trend[0].date)}</span>
                        <span>{fmtDate(trend[trend.length - 1].date)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-[13px] text-slate-400 py-8 text-center">스냅샷이 2일 이상 쌓여야 추이를 볼 수 있습니다.</p>
                  )}

                  {/* 기여 이벤트 */}
                  <p className="text-[12px] font-bold text-slate-500 mt-6 mb-2">최근 7일 기여 활동</p>
                  {snap.contributions?.length ? (
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="text-[11px] text-slate-400 border-b border-slate-100">
                          <th className="text-left font-semibold py-2">활동</th>
                          <th className="text-left font-semibold py-2">구성요소</th>
                          <th className="text-right font-semibold py-2">건수</th>
                          <th className="text-right font-semibold py-2">기여(추정)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {snap.contributions.map((c: any) => (
                          <tr key={c.source} className="border-b border-slate-50 last:border-0">
                            <td className="py-2.5 text-slate-700 font-semibold">{c.label}</td>
                            <td className="py-2.5 text-slate-500">{c.component ?? '—'}</td>
                            <td className="py-2.5 text-right tabular-nums">{nf(c.count)}</td>
                            <td className="py-2.5 text-right tabular-nums font-semibold text-slate-800">
                              {c.estimatedScore === null ? '—' : `+${c.estimatedScore}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-[13px] text-slate-400 py-4">최근 7일 활동 기록이 없습니다.</p>
                  )}
                </div>
              </div>
            )}
          </Panel>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* 배치 · 이상 징후 */}
            <Panel title="배치 모니터">
              <div className="p-5">
                {data.batch ? (
                  <div className="grid grid-cols-2 gap-4 text-[13px]">
                    {[
                      { l: '최근 계산', v: fmtDate(data.batch.lastRunAt, true) },
                      { l: '성공률', v: data.batch.successRate === null ? '집계 중' : `${data.batch.successRate}%` },
                      { l: '대상 선수 수', v: nf(data.batch.processed) },
                      { l: '평균 처리 시간', v: data.batch.durationMs ? `${(data.batch.durationMs / 1000).toFixed(1)}초` : '—' },
                    ].map((r) => (
                      <div key={r.l}>
                        <p className="text-[11px] text-slate-400 font-semibold">{r.l}</p>
                        <p className="text-[16px] font-extrabold text-slate-900 tabular-nums mt-0.5">{r.v}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty title="배치 실행 기록이 없습니다" desc="상단의 '재계산 실행'으로 첫 배치를 돌릴 수 있습니다." />
                )}
              </div>
            </Panel>

            <Panel title="이상 징후 알림"
              right={data.alerts?.length > 0 && (
                <span className="inline-flex h-6 px-2 rounded-lg bg-rose-50 text-rose-600 text-[11px] font-bold">
                  {data.alerts.reduce((s: number, a: any) => s + a.count, 0)}건
                </span>
              )}>
              {data.alerts?.length ? (
                <div className="divide-y divide-slate-50">
                  {data.alerts.map((a: any) => (
                    <div key={a.key} className="flex items-start gap-3 px-5 py-3.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800">{a.label}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{a.athletes.join(', ')}</p>
                      </div>
                      <span className="ml-auto text-[13px] font-extrabold text-rose-500 tabular-nums">{a.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty title="감지된 이상 징후가 없습니다" desc="점수 급변과 표본 급감을 매일 자동으로 확인합니다." />
              )}
            </Panel>
          </div>

          {/* 버전 히스토리 */}
          {data.versions?.length > 0 && (
            <Panel title="버전 히스토리">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[11px] text-slate-400 border-b border-slate-100">
                    <th className="text-left font-semibold px-5 py-2.5">버전</th>
                    <th className="text-left font-semibold py-2.5">적용 기간</th>
                    <th className="text-left font-semibold py-2.5">상태</th>
                    <th className="text-left font-semibold px-5 py-2.5">사유</th>
                  </tr>
                </thead>
                <tbody>
                  {data.versions.map((v: any) => (
                    <tr key={v.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3 font-mono text-[12px] text-slate-700">{v.version}</td>
                      <td className="py-3 text-slate-500 tabular-nums">
                        {fmtDate(v.effectiveAt)} ~ {v.retiredAt ? fmtDate(v.retiredAt) : ''}
                      </td>
                      <td className="py-3">
                        <StatusTag label={v.status === 'ACTIVE' ? '운영 중' : '종료'} tone={v.status === 'ACTIVE' ? 'emerald' : 'slate'} />
                      </td>
                      <td className="px-5 py-3 text-slate-500">{v.note ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          )}
        </div>
      )}
    </FanAdminShell>
  );
}
