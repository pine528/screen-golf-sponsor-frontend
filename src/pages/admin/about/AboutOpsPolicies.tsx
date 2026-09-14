/**
 * IA07 성과보장 정책 (핸드오프 v1.0 §8.1)
 * ACTIVE 정책은 수정할 수 없다. 바꾸려면 새 버전을 만들고 법무 승인 후 활성화한다.
 */
import { useCallback, useEffect, useState } from 'react';
import { Plus, Save, Scale, ShieldCheck, AlertTriangle, Lock, Play } from 'lucide-react';
import { api } from '../../../services/api';
import AboutAdminShell, {
  Panel, Tag, Empty, Loading, useAdminGuard, fmtDate,
} from '../../../components/aboutadmin/AboutAdminShell';

const emptyPolicy = {
  version: '', summary: '',
  eligibleProductTypes: ['RECOMMENDED_PICK'],
  qualificationRules: { minAmount: 0, minMonths: 1 },
  metricRules: [] as any[],
  judgeMode: 'ALL', minScore: 80,
  remedyRules: { ratio: 30, cap: 15000000, validMonths: 6, cashRefund: false },
  appealWindowDays: 14,
  effectiveFrom: '',
};

export default function AboutOpsPolicies() {
  const guard = useAdminGuard();
  const [list, setList] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.getGuaranteePolicies()
      .then((r) => {
        setList(r.data);
        if (!selected && r.data?.policies?.[0]) setSelected(r.data.policies[0].id);
      })
      .catch((e) => guard(e, '/admin/about/policies'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    setError(null); setMsg(null);
    api.getGuaranteePolicyAdmin(selected)
      .then((r) => {
        setDetail(r.data);
        setForm({
          ...r.data.policy,
          effectiveFrom: r.data.policy.effectiveFrom ? String(r.data.policy.effectiveFrom).slice(0, 10) : '',
        });
      })
      .catch(() => setDetail(null));
  }, [selected]);

  const save = async () => {
    setBusy(true); setError(null); setMsg(null);
    try {
      const r = await api.saveGuaranteePolicy(form);
      setMsg('저장되었습니다');
      await load();
      setSelected(r.data.policy.id);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '저장에 실패했습니다');
    } finally { setBusy(false); }
  };

  const act = async (fn: () => Promise<any>, ok: string) => {
    setBusy(true); setError(null); setMsg(null);
    try {
      const r = await fn();
      setMsg(r?.data?.notice ?? ok);
      await load();
      if (selected) {
        const d = await api.getGuaranteePolicyAdmin(selected);
        setDetail(d.data);
      }
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '처리에 실패했습니다');
    } finally { setBusy(false); }
  };

  const rules: any[] = form?.metricRules ?? [];
  const setRule = (i: number, patch: any) => {
    const next = [...rules];
    next[i] = { ...next[i], ...patch };
    setForm({ ...form, metricRules: next });
  };

  return (
    <AboutAdminShell title="성과보장 정책" desc="정책 버전을 만들고 법무 승인 후 활성화합니다."
      breadcrumb={['성과보장', '정책 관리']}
      actions={
        <button onClick={() => { setSelected(null); setDetail(null); setForm({ ...emptyPolicy }); }}
          className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 inline-flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> 새 버전
        </button>
      }>
      {loading && !list ? <Loading /> : !list ? <Empty title="정책을 불러오지 못했습니다" /> : (
        <div className="space-y-4">
          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">{error}</div>}
          {msg && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">{msg}</div>}

          <div className="grid lg:grid-cols-4 gap-4">
            {/* 버전 목록 */}
            <Panel title={`정책 버전 ${list.policies.length}개`}>
              {list.policies.length ? (
                <div className="divide-y divide-slate-50">
                  {list.policies.map((p: any) => (
                    <button key={p.id} onClick={() => setSelected(p.id)}
                      className={`w-full text-left px-4 py-3.5 transition ${
                        selected === p.id ? 'bg-emerald-50/50 border-l-2 border-l-emerald-500' : 'hover:bg-slate-50'
                      }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[13px] font-bold text-slate-800">{p.version}</span>
                        <Tag tone={p.status === 'ACTIVE' ? 'emerald' : p.status === 'DRAFT' ? 'slate' : 'amber'}>
                          {p.status}
                        </Tag>
                      </div>
                      <p className="text-[12.5px] text-slate-500">{p.summary ?? '설명 없음'}</p>
                      <p className="text-[12px] text-slate-500 mt-0.5 tabular-nums">
                        시행 {fmtDate(p.effectiveFrom)}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <Empty title="등록된 정책이 없습니다" desc="새 버전을 만들어 시작하세요." />
              )}
            </Panel>

            {/* 편집 */}
            <div className="lg:col-span-3 space-y-4">
              {!form ? (
                <Panel><Empty title="정책을 선택하세요" /></Panel>
              ) : (
                <>
                  {detail && !detail.editable && (
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3.5 flex items-start gap-3">
                      <Lock className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                      <p className="text-[13px] text-sky-800">{detail.notice}</p>
                    </div>
                  )}

                  <Panel title="정책 기본"
                    right={
                      <div className="flex items-center gap-2">
                        {form.status && <Tag tone={form.status === 'ACTIVE' ? 'emerald' : 'slate'}>{form.status}</Tag>}
                        <button disabled={busy || (detail && !detail.editable)} onClick={save}
                          className="h-9 px-4 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:border-slate-400 disabled:opacity-40 inline-flex items-center gap-1.5">
                          <Save className="w-3.5 h-3.5" /> 저장
                        </button>
                        {form.id && !form.legalApprovedAt && (
                          <button disabled={busy} onClick={() => act(() => api.legalApprovePolicy(form.id), '법무 승인 완료')}
                            className="h-9 px-4 rounded-xl border border-amber-200 text-amber-700 text-[13px] font-bold hover:bg-amber-50 inline-flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5" /> 법무 검토 요청
                          </button>
                        )}
                        {form.id && form.status === 'DRAFT' && (
                          <button disabled={busy || !form.legalApprovedAt}
                            onClick={() => act(() => api.activateGuaranteePolicy(form.id), '정책이 활성화되었습니다')}
                            className="h-9 px-4 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 inline-flex items-center gap-1.5">
                            <Play className="w-3.5 h-3.5" /> 활성화
                          </button>
                        )}
                      </div>
                    }>
                    <div className="p-5 grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">버전 *</label>
                        <input value={form.version ?? ''} disabled={detail && !detail.editable}
                          onChange={(e) => setForm({ ...form, version: e.target.value })}
                          placeholder="예: v1.1"
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] font-mono focus:outline-none focus:border-slate-400 disabled:bg-slate-50" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">시행 예정일</label>
                        <input type="date" value={form.effectiveFrom ?? ''} disabled={detail && !detail.editable}
                          onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400 disabled:bg-slate-50" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">설명</label>
                        <input value={form.summary ?? ''} disabled={detail && !detail.editable}
                          onChange={(e) => setForm({ ...form, summary: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400 disabled:bg-slate-50" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">집계 방식</label>
                        <select value={form.judgeMode} disabled={detail && !detail.editable}
                          onChange={(e) => setForm({ ...form, judgeMode: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none disabled:bg-slate-50">
                          {list.judgeModes.map((m: any) => <option key={m.code} value={m.code}>{m.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">
                          최소 달성률 (%) {form.judgeMode !== 'WEIGHTED' && <span className="text-slate-300">— 가중 방식에서만 사용</span>}
                        </label>
                        <input type="number" value={form.minScore ?? ''} disabled={(detail && !detail.editable) || form.judgeMode !== 'WEIGHTED'}
                          onChange={(e) => setForm({ ...form, minScore: Number(e.target.value) })}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] tabular-nums focus:outline-none disabled:bg-slate-50" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">이의제기 기간 (일)</label>
                        <input type="number" value={form.appealWindowDays ?? 14} disabled={detail && !detail.editable}
                          onChange={(e) => setForm({ ...form, appealWindowDays: Number(e.target.value) })}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] tabular-nums focus:outline-none disabled:bg-slate-50" />
                      </div>
                    </div>
                  </Panel>

                  {/* KPI 정의 */}
                  <Panel title="KPI 정의"
                    right={
                      <button disabled={detail && !detail.editable}
                        onClick={() => setForm({ ...form, metricRules: [...rules, { code: '', label: '', operator: 'gte', target: 0, unit: '', weight: 0, source: '', required: true, definition: '' }] })}
                        className="h-9 px-3.5 rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-600 hover:border-slate-400 disabled:opacity-40 inline-flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> KPI 추가
                      </button>
                    }>
                    {rules.length ? (
                      <div className="p-4 space-y-3">
                        {rules.map((r: any, i: number) => (
                          <div key={i} className="rounded-2xl border border-slate-200 p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="inline-flex h-6 px-2 rounded-lg bg-emerald-50 text-emerald-700 text-[12px] font-bold items-center">
                                KPI {i + 1}
                              </span>
                              <input value={r.label ?? ''} disabled={detail && !detail.editable}
                                onChange={(e) => setRule(i, { label: e.target.value })}
                                placeholder="지표명 (예: 방송 노출)"
                                className="flex-1 h-8 px-2.5 rounded-lg border border-slate-200 text-[13px] font-semibold focus:outline-none focus:border-slate-400 disabled:bg-slate-50" />
                              <label className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
                                <input type="checkbox" checked={r.required !== false} disabled={detail && !detail.editable}
                                  onChange={(e) => setRule(i, { required: e.target.checked })}
                                  className="w-4 h-4 rounded accent-emerald-600" />
                                필수
                              </label>
                              <button disabled={detail && !detail.editable}
                                onClick={() => setForm({ ...form, metricRules: rules.filter((_, j) => j !== i) })}
                                className="text-[12px] font-bold text-rose-500 hover:text-rose-700 disabled:opacity-40">삭제</button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              {[
                                { k: 'code', l: '코드', type: 'text' },
                                { k: 'target', l: '목표값', type: 'number' },
                                { k: 'unit', l: '단위', type: 'text' },
                                { k: 'weight', l: '가중치(%)', type: 'number' },
                                { k: 'source', l: '데이터 출처', type: 'text' },
                              ].map((f) => (
                                <div key={f.k}>
                                  <label className="block text-[12px] font-semibold text-slate-500 mb-1">{f.l}</label>
                                  <input type={f.type} value={r[f.k] ?? ''} disabled={detail && !detail.editable}
                                    onChange={(e) => setRule(i, { [f.k]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-[12.5px] focus:outline-none focus:border-slate-400 disabled:bg-slate-50" />
                                </div>
                              ))}
                            </div>
                            <div className="mt-2">
                              <label className="block text-[12px] font-semibold text-slate-500 mb-1">집계 정의</label>
                              <input value={r.definition ?? ''} disabled={detail && !detail.editable}
                                onChange={(e) => setRule(i, { definition: e.target.value })}
                                placeholder="중복 제거 기준 등"
                                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-[12.5px] focus:outline-none focus:border-slate-400 disabled:bg-slate-50" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty title="KPI가 정의되지 않았습니다" desc="KPI가 없으면 정책을 활성화할 수 없습니다." />
                    )}
                  </Panel>

                  <div className="grid lg:grid-cols-2 gap-4">
                    {/* 보완지원 */}
                    <Panel title="보완지원 규칙">
                      <div className="p-5 grid grid-cols-3 gap-3">
                        {[
                          { k: 'ratio', l: '지원 비율 (%)' },
                          { k: 'cap', l: '지원 상한 (원)' },
                          { k: 'validMonths', l: '사용 기한 (개월)' },
                        ].map((f) => (
                          <div key={f.k}>
                            <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">{f.l}</label>
                            <input type="number" value={(form.remedyRules ?? {})[f.k] ?? ''}
                              disabled={detail && !detail.editable}
                              onChange={(e) => setForm({ ...form, remedyRules: { ...(form.remedyRules ?? {}), [f.k]: Number(e.target.value) } })}
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] text-right tabular-nums focus:outline-none focus:border-slate-400 disabled:bg-slate-50" />
                          </div>
                        ))}
                      </div>
                      <div className="mx-5 mb-5 rounded-xl bg-rose-50 px-4 py-3 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                        <p className="text-[12px] text-rose-700 leading-relaxed">
                          보완지원은 현금 환급이 아닙니다. 화면과 계약서에 "차기 후원 시 사용 가능한 지원"으로 표기해야 합니다.
                        </p>
                      </div>
                    </Panel>

                    {/* 검토 필요 */}
                    <Panel title="검토가 필요한 항목">
                      {detail?.warnings?.length ? (
                        <div className="p-4 space-y-2.5">
                          {detail.warnings.map((w: string, i: number) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                              <p className="text-[13px] text-slate-700 leading-relaxed">{w}</p>
                            </div>
                          ))}
                          {detail.conflict && (
                            <div className="mt-3 rounded-xl bg-rose-50 px-4 py-3 flex items-start gap-2.5">
                              <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                              <p className="text-[12.5px] text-rose-700">{detail.conflict}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-5 flex items-center gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <p className="text-[13px] text-slate-600">검토가 필요한 항목이 없습니다.</p>
                        </div>
                      )}
                      {detail?.policy?.legalApprovedAt && (
                        <p className="px-5 pb-5 text-[12.5px] text-emerald-600 font-semibold">
                          법무 승인 완료 · {fmtDate(detail.policy.legalApprovedAt, true)}
                        </p>
                      )}
                    </Panel>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AboutAdminShell>
  );
}
