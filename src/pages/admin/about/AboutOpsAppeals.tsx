/**
 * IA09 이의제기 · 보완지원 (핸드오프 v1.0 §8.5 · §16.4)
 * 재무적 영향이 있는 결정은 2인 승인이 필요하다. 지원 원장은 변경할 수 없다.
 */
import { useCallback, useEffect, useState } from 'react';
import { Gavel, AlertTriangle, Clock, Wallet, ShieldCheck } from 'lucide-react';
import { api } from '../../../services/api';
import AboutAdminShell, {
  KpiCard, Panel, Tag, Empty, Loading, useAdminGuard, nf, fmtDate,
} from '../../../components/aboutadmin/AboutAdminShell';

const STATUS_TONE: Record<string, 'slate' | 'sky' | 'emerald' | 'amber' | 'rose' | 'violet'> = {
  RECEIVED: 'sky', UNDER_REVIEW: 'amber', DECIDED: 'emerald',
  SUPPORT_ISSUED: 'violet', REJECTED: 'rose',
};

const fmtRemain = (ms: number | null) => {
  if (ms === null || ms === undefined) return '—';
  const over = ms < 0, abs = Math.abs(ms);
  const d = Math.floor(abs / 86400000);
  const h = Math.floor((abs % 86400000) / 3600000);
  const t = d > 0 ? `${d}일 ${h}시간` : `${h}시간`;
  return over ? `${t} 초과` : `D-${d || 0} (${t})`;
};

export default function AboutOpsAppeals() {
  const guard = useAdminGuard();
  const [status, setStatus] = useState('ALL');
  const [list, setList] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [decisionType, setDecisionType] = useState('PARTIAL');
  const [decisionCode, setDecisionCode] = useState('');
  const [note, setNote] = useState('');
  const [ratio, setRatio] = useState(10);
  const [cap, setCap] = useState(30_000_000);
  const [approverId, setApproverId] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.getGuaranteeAppeals({ status: status === 'ALL' ? undefined : status, limit: 30 })
      .then((r) => {
        setList(r.data);
        if (!selected && r.data?.appeals?.[0]) setSelected(r.data.appeals[0]);
      })
      .catch((e) => guard(e, '/admin/about/appeals'))
      .finally(() => setLoading(false));
  }, [status]);
  useEffect(() => { load(); }, [load]);

  const decide = async () => {
    if (!selected || !decisionCode) return;
    setBusy(true); setError(null); setMsg(null);
    try {
      const r = await api.decideGuaranteeAppeal(selected.id, { decisionType, decisionCode, note });
      setMsg(r.data.notice ?? '결정이 저장되었습니다');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '처리에 실패했습니다');
    } finally { setBusy(false); }
  };

  const issue = async () => {
    if (!selected) return;
    setBusy(true); setError(null); setMsg(null);
    try {
      const r = await api.issueRemedyGrant({
        snapshotId: selected.snapshotId ?? selected.id,
        ratio, capAmount: cap, approverId, note,
      });
      setMsg(r.data.notice ?? '보완지원이 발급되었습니다');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '발급에 실패했습니다');
    } finally { setBusy(false); }
  };

  const k = list?.kpis;
  const estimate = selected?.contractAmount
    ? Math.min(Math.floor(selected.contractAmount * (ratio / 100)), cap)
    : null;

  return (
    <AboutAdminShell title="이의제기 · 보완지원 관리" desc="브랜드의 이의제기 접수와 보완지원 검토·발급을 관리합니다."
      breadcrumb={['성과보장', '이의제기 · 보완지원']}>
      {loading && !list ? <Loading /> : !list ? <Empty title="이의제기를 불러오지 못했습니다" /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiCard label="전체" value={k.total} unit="건" />
            <KpiCard label="접수" value={k.received} unit="건" sub="검토 대기" />
            <KpiCard label="검토 중" value={k.reviewing} unit="건" />
            <KpiCard label="결정 완료" value={k.decided} unit="건" />
            <KpiCard label="SLA 경과" value={k.overdue} unit="건" tone={k.overdue > 0 ? 'danger' : 'default'} />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'RECEIVED', 'UNDER_REVIEW', 'DECIDED', 'SUPPORT_ISSUED'].map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={`h-9 px-4 rounded-xl text-[13px] font-semibold border transition ${
                  status === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}>
                {({ ALL: '전체', RECEIVED: '접수', UNDER_REVIEW: '검토 중', DECIDED: '결정 완료', SUPPORT_ISSUED: '지원 발급' } as any)[s]}
              </button>
            ))}
          </div>

          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">{error}</div>}
          {msg && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">{msg}</div>}

          <div className="grid lg:grid-cols-5 gap-4">
            {/* 목록 */}
            <Panel className="lg:col-span-2" title={`이의제기 ${nf(list.total)}건`}>
              {list.appeals.length ? (
                <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                  {list.appeals.map((a: any) => (
                    <button key={a.id} onClick={() => setSelected(a)}
                      className={`w-full text-left px-4 py-3.5 transition ${
                        selected?.id === a.id ? 'bg-emerald-50/50 border-l-2 border-l-emerald-500' : 'hover:bg-slate-50'
                      }`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Tag tone={STATUS_TONE[a.status] ?? 'slate'}>{a.status}</Tag>
                        <span className="font-mono text-[12px] text-slate-500">#{a.code}</span>
                        {a.overdue && <span className="text-[12px] font-bold text-rose-500">SLA 경과</span>}
                      </div>
                      <p className="text-[13.5px] font-bold text-slate-800 truncate">{a.reason}</p>
                      <p className="text-[12.5px] text-slate-500 mt-0.5 truncate">
                        {a.brandName} · {a.athleteName}
                      </p>
                      <p className="text-[12px] text-slate-500 mt-1 tabular-nums">
                        접수 {fmtDate(a.createdAt, true)}
                        {a.slaDueAt && ` · SLA ${fmtRemain(a.slaRemainMs)}`}
                      </p>
                    </button>
                  ))}
                </div>
              ) : <Empty title="해당 상태의 이의제기가 없습니다" />}
            </Panel>

            {/* 상세 · 결정 */}
            <div className="lg:col-span-3 space-y-4">
              {!selected ? (
                <Panel><Empty title="이의제기를 선택하세요" /></Panel>
              ) : (
                <>
                  <Panel title={`#${selected.code}`}
                    right={
                      <span className={`inline-flex items-center gap-1.5 text-[13px] font-bold tabular-nums ${
                        selected.overdue ? 'text-rose-600' : 'text-slate-500'
                      }`}>
                        <Clock className="w-3.5 h-3.5" /> SLA {fmtRemain(selected.slaRemainMs)}
                      </span>
                    }>
                    <div className="p-5 space-y-4">
                      <div className="grid sm:grid-cols-3 gap-4 text-[13px]">
                        {[
                          { l: '브랜드', v: selected.brandName },
                          { l: '선수', v: selected.athleteName },
                          { l: '계약 금액', v: selected.contractAmount ? `${nf(selected.contractAmount)}원` : '—' },
                        ].map((r) => (
                          <div key={r.l}>
                            <p className="text-[12px] text-slate-500 font-semibold">{r.l}</p>
                            <p className="mt-0.5 font-semibold text-slate-800 tabular-nums">{r.v ?? '—'}</p>
                          </div>
                        ))}
                      </div>

                      <div>
                        <p className="text-[12px] font-bold text-slate-500 mb-2">브랜드 진술</p>
                        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                          <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-line">{selected.reason}</p>
                        </div>
                      </div>

                      {selected.evidenceTypes?.length > 0 && (
                        <div>
                          <p className="text-[12px] font-bold text-slate-500 mb-2">제출 증빙 유형</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selected.evidenceTypes.map((t: string) => <Tag key={t}>{t}</Tag>)}
                          </div>
                        </div>
                      )}
                    </div>
                  </Panel>

                  {/* 결정 */}
                  <Panel title="결정 및 지원 설정">
                    <div className="p-5 space-y-4">
                      <div>
                        <p className="text-[12px] font-bold text-slate-500 mb-2">결정 유형</p>
                        <div className="grid grid-cols-3 gap-2">
                          {list.decisionTypes.map((d: any) => (
                            <button key={d.code} onClick={() => setDecisionType(d.code)}
                              className={`rounded-2xl border px-4 py-3 text-left transition ${
                                decisionType === d.code ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                              }`}>
                              <p className="text-[13.5px] font-bold text-slate-900">{d.label}</p>
                              <p className="text-[12px] text-slate-500 mt-0.5">{d.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">사유 코드 *</label>
                          <select value={decisionCode} onChange={(e) => setDecisionCode(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400">
                            <option value="">선택하세요</option>
                            {list.decisionCodes.map((c: any) => (
                              <option key={c.code} value={c.code}>{c.code} · {c.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">내부 메모</label>
                          <input value={note} onChange={(e) => setNote(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
                        </div>
                      </div>

                      {decisionType !== 'REJECT' && (
                        <>
                          <div className="grid sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">지원 적용률 (%)</label>
                              <input type="number" value={ratio} onChange={(e) => setRatio(Number(e.target.value))}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] text-right tabular-nums focus:outline-none" />
                              <p className="mt-1 text-[12.5px] text-slate-500">권장 범위 0~15%</p>
                            </div>
                            <div>
                              <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">지원 한도 (원)</label>
                              <input type="number" value={cap} onChange={(e) => setCap(Number(e.target.value))}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] text-right tabular-nums focus:outline-none" />
                            </div>
                            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                              <p className="text-[12px] font-semibold text-emerald-700">예상 지원액</p>
                              <p className="mt-1 text-[18px] font-extrabold text-emerald-700 tabular-nums">
                                {estimate === null ? '계약금액 없음' : `${nf(estimate)}원`}
                              </p>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">
                              승인자 ID * <span className="text-slate-500">(요청자와 달라야 합니다)</span>
                            </label>
                            <input value={approverId} onChange={(e) => setApproverId(e.target.value)}
                              placeholder="다른 관리자의 사용자 ID"
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] font-mono focus:outline-none focus:border-slate-400" />
                          </div>

                          <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3.5 space-y-1.5">
                            <p className="text-[12px] text-slate-600 leading-relaxed inline-flex items-start gap-2">
                              <ShieldCheck className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                              본 지원은 현금이 아닌 SPONPIK 보장 지원으로 지급됩니다.
                            </p>
                            <p className="text-[12px] text-slate-600 leading-relaxed inline-flex items-start gap-2">
                              <ShieldCheck className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                              타인 양도 및 현금 전환은 불가합니다.
                            </p>
                            <p className="text-[12px] text-rose-600 leading-relaxed inline-flex items-start gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              재무적 영향이 있는 결정은 2인 승인이 필수입니다.
                            </p>
                          </div>
                        </>
                      )}

                      <div className="flex flex-wrap gap-2 justify-end pt-2">
                        <button disabled={busy || !decisionCode} onClick={decide}
                          className="h-11 px-5 rounded-xl border border-slate-200 text-[13.5px] font-bold text-slate-600 hover:border-slate-400 disabled:opacity-40 inline-flex items-center gap-1.5">
                          <Gavel className="w-4 h-4" /> 결정 저장
                        </button>
                        {decisionType !== 'REJECT' && (
                          <button disabled={busy || !approverId} onClick={issue}
                            className="h-11 px-5 rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 inline-flex items-center gap-1.5">
                            <Wallet className="w-4 h-4" /> 지원 발급
                          </button>
                        )}
                      </div>
                    </div>
                  </Panel>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AboutAdminShell>
  );
}
