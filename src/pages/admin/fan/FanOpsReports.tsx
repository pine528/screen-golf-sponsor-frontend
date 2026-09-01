/**
 * A05 신고 · 제재 · 이의제기 (핸드오프 v1.0 §10.3 · §18.2)
 * 신고자는 익명 처리한다. 영구 정지는 관리자 2인 승인이 필요하다.
 */
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, ShieldOff, Ban, AlertTriangle, Lock, Check } from 'lucide-react';
import { api } from '../../../services/api';
import FanAdminShell, {
  KpiCard, Panel, RiskTag, StatusTag, Empty, Loading, useAdminGuard, nf, fmtDate, fmtRemain,
} from '../../../components/fanadmin/FanAdminShell';

const LEVEL_ICON: Record<string, any> = {
  WARNING: AlertTriangle, FEATURE_LIMIT: Lock, SUSPEND: ShieldOff, PERMANENT: Ban,
};
const DAY_OPTIONS = [1, 3, 7, 14, 30];

export default function FanOpsReports() {
  const guard = useAdminGuard();
  const [sp] = useSearchParams();
  const [tab, setTab] = useState('RECEIVED');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(sp.get('id'));
  const [detail, setDetail] = useState<any>(null);

  const [level, setLevel] = useState('');
  const [days, setDays] = useState<number>(7);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.getFanAdminReports({ tab, limit: 20 })
      .then((r) => {
        setData(r.data);
        if (!selected && r.data?.reports?.[0]) setSelected(r.data.reports[0].id);
      })
      .catch((e) => guard(e, '/admin/fan/reports'))
      .finally(() => setLoading(false));
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    setLevel(''); setReason(''); setError(null); setMsg(null);
    api.getFanAdminReport(selected).then((r) => setDetail(r.data)).catch(() => setDetail(null));
  }, [selected]);

  const levelDef = data?.sanctionLevels?.find((l: any) => l.code === level);

  const applySanction = async () => {
    if (!detail || !level || !reason.trim()) return;
    setBusy(true); setError(null); setMsg(null);
    try {
      const r = await api.createFanSanction({
        reportId: detail.id,
        userId: detail.targetUserId ?? detail.targetId,
        level, days: levelDef?.needsDays ? days : undefined,
        reason: reason.trim(),
      });
      setMsg(r.data?.message ?? '제재가 적용되었습니다');
      await load();
      const d = await api.getFanAdminReport(detail.id);
      setDetail(d.data);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '제재 적용에 실패했습니다');
    } finally { setBusy(false); }
  };

  const approve = async (id: string) => {
    setBusy(true); setError(null);
    try {
      await api.approveFanSanction(id);
      const d = await api.getFanAdminReport(detail.id);
      setDetail(d.data);
      setMsg('영구 정지가 승인되었습니다');
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '승인에 실패했습니다');
    } finally { setBusy(false); }
  };

  const decideAppeal = async (id: string, decision: string) => {
    if (!reason.trim()) { setError('판단 사유를 입력해주세요'); return; }
    setBusy(true); setError(null);
    try {
      await api.decideFanAppeal(id, { decision, note: reason.trim(), days: decision === 'REDUCED' ? days : undefined });
      setMsg('이의제기 처리가 완료되었습니다');
      setReason('');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '처리에 실패했습니다');
    } finally { setBusy(false); }
  };

  const k = data?.kpis;

  return (
    <FanAdminShell title="신고 · 제재 · 이의제기" desc="접수된 신고를 분류하고 정책에 따라 조치합니다."
      breadcrumb={['팬 운영', '신고·제재']}>
      {loading ? <Loading /> : !data ? <Empty title="신고함을 불러오지 못했습니다" /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="미처리 신고" value={k.open} unit="건" sub="접수·분류완료 합계" />
            <KpiCard label="P0 긴급" value={k.p0} unit="건" sub="1시간 내 처리 대상" />
            <KpiCard label="SLA 초과" value={k.overdue} unit="건" sub="기한을 넘긴 건" />
            <KpiCard label="이의제기 진행" value={k.appeals} unit="건" sub="검토 대기 중" />
          </div>

          <div className="flex flex-wrap gap-2">
            {data.tabs.map((t: any) => (
              <button key={t.code} onClick={() => { setTab(t.code); setSelected(null); }}
                className={`h-9 px-4 rounded-xl text-[13px] font-semibold border transition ${
                  tab === t.code ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">{error}</div>}
          {msg && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">{msg}</div>}

          {tab === 'APPEAL' ? (
            <Panel title={`이의제기 ${nf(data.appeals.length)}건`}>
              {data.appeals.length ? (
                <div className="divide-y divide-slate-50">
                  {data.appeals.map((a: any) => (
                    <div key={a.id} className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-[12px] text-slate-400">{a.code}</span>
                        <StatusTag label={a.status === 'RECEIVED' ? '접수' : '검토 중'} tone="sky" />
                        <span className="ml-auto text-[11px] text-slate-400 tabular-nums">{fmtDate(a.createdAt, true)}</span>
                      </div>
                      <p className="text-[13px] text-slate-700 leading-relaxed">{a.statement}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <input value={reason} onChange={(e) => setReason(e.target.value)}
                          placeholder="판단 사유 (필수)"
                          className="flex-1 min-w-[220px] h-9 px-3 rounded-xl border border-slate-200 text-[13px] placeholder:text-slate-300 focus:outline-none focus:border-slate-400" />
                        <button disabled={busy} onClick={() => decideAppeal(a.id, 'UPHELD')}
                          className="h-9 px-4 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:border-slate-400">
                          유지
                        </button>
                        <button disabled={busy} onClick={() => decideAppeal(a.id, 'REDUCED')}
                          className="h-9 px-4 rounded-xl border border-sky-200 text-[13px] font-bold text-sky-700 hover:border-sky-400">
                          감경
                        </button>
                        <button disabled={busy} onClick={() => decideAppeal(a.id, 'LIFTED')}
                          className="h-9 px-4 rounded-xl bg-rose-500 text-white text-[13px] font-bold hover:bg-rose-600">
                          해제·복구
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <Empty title="진행 중인 이의제기가 없습니다" />}
            </Panel>
          ) : (
            <div className="grid lg:grid-cols-5 gap-4">
              {/* 목록 */}
              <Panel className="lg:col-span-2" title={`신고 목록 ${nf(data.total)}건`}>
                {data.reports.length ? (
                  <div className="divide-y divide-slate-50 max-h-[620px] overflow-y-auto">
                    {data.reports.map((r: any) => (
                      <button key={r.id} onClick={() => setSelected(r.id)}
                        className={`w-full text-left px-4 py-3.5 transition ${
                          selected === r.id ? 'bg-emerald-50/50 border-l-2 border-l-emerald-500' : 'hover:bg-slate-50'
                        }`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <RiskTag risk={r.risk} />
                          <span className="font-mono text-[11px] text-slate-400">{r.code}</span>
                          {r.overdue && <span className="text-[11px] font-bold text-rose-500">SLA 초과</span>}
                        </div>
                        <p className="text-[13px] font-semibold text-slate-800">{r.reason}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {r.targetTypeLabel}{r.targetUser ? ` · ${r.targetUser}` : ''} · {fmtDate(r.createdAt, true)}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : <Empty title="해당 상태의 신고가 없습니다" />}
              </Panel>

              {/* 상세 + 조치 */}
              <div className="lg:col-span-3 space-y-4">
                {!detail ? <Panel><Empty title="신고를 선택하세요" /></Panel> : (
                  <>
                    <Panel title="신고 상세"
                      right={
                        <span className={`text-[12px] font-bold tabular-nums ${detail.slaRemainMs !== null && detail.slaRemainMs < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                          SLA {fmtRemain(detail.slaRemainMs)}
                        </span>
                      }>
                      <div className="p-5 space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <RiskTag risk={detail.risk} />
                          <span className="font-mono text-[12px] text-slate-400">{detail.code}</span>
                          <StatusTag label={detail.targetTypeLabel} />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3 text-[13px]">
                          <div>
                            <p className="text-[11px] font-semibold text-slate-400 mb-1">신고 사유</p>
                            <p className="font-semibold text-slate-800">{detail.reason}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold text-slate-400 mb-1">신고 시각</p>
                            <p className="text-slate-600 tabular-nums">{fmtDate(detail.createdAt, true)}</p>
                          </div>
                        </div>

                        {detail.detail && (
                          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                            <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-line">{detail.detail}</p>
                          </div>
                        )}

                        {/* 신고자 보호 */}
                        <div className="rounded-2xl border border-slate-200 px-4 py-3 flex items-start gap-2.5">
                          <Shield className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[12px] font-bold text-slate-600">신고자 정보는 비공개 처리되었습니다</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              신고자 보호 정책에 따라 익명 처리된 정보는 열람할 수 없습니다. ({detail.reporter})
                            </p>
                          </div>
                        </div>

                        {/* 과거 이력 */}
                        {detail.history?.length > 0 && (
                          <div>
                            <p className="text-[12px] font-bold text-slate-500 mb-2">대상자 과거 제재 이력</p>
                            <div className="space-y-1.5">
                              {detail.history.map((h: any) => (
                                <div key={h.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                                  <span className="text-[11px] text-slate-400 tabular-nums w-16">{fmtDate(h.createdAt)}</span>
                                  <StatusTag label={h.levelLabel} tone={h.level === 'PERMANENT' ? 'rose' : 'slate'} />
                                  <span className="text-[12px] text-slate-500 truncate flex-1">{h.reason}</span>
                                  <span className="text-[11px] text-slate-400">{h.status === 'ACTIVE' ? '적용 중' : '만료'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 감사 로그 */}
                        {detail.auditLogs?.length > 0 && (
                          <div>
                            <p className="text-[12px] font-bold text-slate-500 mb-2">감사 로그 (불변)</p>
                            <div className="rounded-2xl bg-slate-50 border border-slate-100 divide-y divide-slate-100">
                              {detail.auditLogs.map((l: any, i: number) => (
                                <div key={i} className="flex items-center gap-3 px-3 py-2">
                                  <span className="text-[11px] text-slate-400 tabular-nums w-28">{fmtDate(l.at, true)}</span>
                                  <span className="text-[11px] text-slate-500 font-mono">{l.actor.slice(0, 8)}</span>
                                  <span className="text-[12px] text-slate-600 truncate flex-1">{l.reason || l.action}</span>
                                </div>
                              ))}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1.5">{detail.notice}</p>
                          </div>
                        )}
                      </div>
                    </Panel>

                    {/* 조치 결정 */}
                    <Panel title="조치 결정" right={<span className="text-[11px] text-rose-500 font-bold">필수: 사유 입력</span>}>
                      <div className="p-5 space-y-3">
                        <p className="text-[11px] text-slate-400">제재 단계 (누적 적용)</p>
                        {detail.sanctionLevels.map((l: any) => {
                          const I = LEVEL_ICON[l.code] ?? AlertTriangle;
                          return (
                            <button key={l.code} onClick={() => setLevel(l.code)}
                              className={`w-full text-left rounded-2xl border px-4 py-3 transition flex items-center gap-3 ${
                                level === l.code
                                  ? l.code === 'PERMANENT' ? 'border-rose-400 bg-rose-50' : 'border-slate-900 bg-slate-50'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}>
                              <I className={`w-4 h-4 shrink-0 ${l.code === 'PERMANENT' ? 'text-rose-500' : 'text-slate-400'}`} />
                              <span className="min-w-0 flex-1">
                                <span className="block text-[14px] font-bold text-slate-900">{l.label}</span>
                                <span className="block text-[11px] text-slate-400 mt-0.5">{l.desc}</span>
                              </span>
                              {l.needsDays && level === l.code && (
                                <select value={days} onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => setDays(Number(e.target.value))}
                                  className="h-8 rounded-lg border border-slate-200 px-2 text-[12px] font-semibold">
                                  {DAY_OPTIONS.map((d) => <option key={d} value={d}>{d}일</option>)}
                                </select>
                              )}
                            </button>
                          );
                        })}

                        <textarea value={reason} onChange={(e) => setReason(e.target.value.slice(0, 500))}
                          placeholder="구체적인 사유를 입력해주세요. (필수)" rows={3}
                          className="w-full rounded-2xl border border-slate-200 p-3.5 text-[13px] placeholder:text-slate-300 resize-none focus:outline-none focus:border-slate-400" />

                        {levelDef?.needsTwoApprovals && (
                          <div className="rounded-xl bg-rose-50 px-4 py-3 flex items-start gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                            <p className="text-[12px] text-rose-600 leading-relaxed">
                              영구 정지는 관리자 2인 승인이 필요합니다. 부과한 관리자는 승인할 수 없습니다.
                            </p>
                          </div>
                        )}

                        <button disabled={!level || !reason.trim() || busy} onClick={applySanction}
                          className="w-full h-11 rounded-xl bg-slate-900 text-white text-[14px] font-bold hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition">
                          {busy ? '처리 중…' : '제재 적용'}
                        </button>

                        {/* 승인 대기 */}
                        {detail.sanctions?.filter((s: any) => s.status === 'PENDING_APPROVAL').map((s: any) => (
                          <div key={s.id} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3">
                            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                            <p className="text-[12px] text-amber-700 flex-1">
                              <b>{s.levelLabel}</b> 승인 대기 중 · {s.reason}
                            </p>
                            <button disabled={busy} onClick={() => approve(s.id)}
                              className="h-8 px-3 rounded-lg bg-amber-500 text-white text-[12px] font-bold hover:bg-amber-600 inline-flex items-center gap-1">
                              <Check className="w-3 h-3" /> 승인
                            </button>
                          </div>
                        ))}
                      </div>
                    </Panel>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </FanAdminShell>
  );
}
