/**
 * IA03 매칭사례 목록 + IA04 사례 편집 + IA05 근거 검수 + IA06 당사자 승인
 * (핸드오프 v1.0 §6 · §20)
 *
 * 게시 게이트를 통과하지 못하면 게시 버튼을 누를 수 없다 (§5.4).
 */
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {Plus, Search, Save, Send, AlertTriangle, CheckCircle2, XCircle, Lock} from 'lucide-react';
import { api } from '../../../services/api';
import AboutAdminShell, {
  Panel, Status, Tag, Empty, Loading, useAdminGuard, nf, fmtDate,
} from '../../../components/aboutadmin/AboutAdminShell';

const TABS = [
  { key: 'EDIT', label: '사례 편집' },
  { key: 'EVIDENCE', label: '근거 · 공개범위' },
  { key: 'APPROVAL', label: '당사자 승인' },
];

export default function AboutOpsCases() {
  const guard = useAdminGuard();
  const [sp] = useSearchParams();
  const [status, setStatus] = useState('ALL');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [list, setList] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(sp.get('id'));
  const [tab, setTab] = useState('EDIT');

  const [detail, setDetail] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [evidence, setEvidence] = useState<any>(null);
  const [approval, setApproval] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.getAboutAdminCases({ status, q: q || undefined, page, limit: 20 })
      .then((r) => {
        setList(r.data);
        if (!selected && r.data?.cases?.[0]) setSelected(r.data.cases[0].id);
      })
      .catch((e) => guard(e, '/admin/about/cases'))
      .finally(() => setLoading(false));
  }, [status, q, page]);
  useEffect(() => { load(); }, [load]);

  const loadDetail = useCallback(async (id: string) => {
    setError(null); setMsg(null);
    const [d, ev, ap] = await Promise.all([
      api.getAboutAdminCase(id).then((r) => r.data).catch(() => null),
      api.getCaseEvidenceReview(id).then((r) => r.data).catch(() => null),
      api.getCaseApproval(id).then((r) => r.data).catch(() => null),
    ]);
    setDetail(d); setForm(d?.case ?? null); setEvidence(ev); setApproval(ap);
  }, []);

  useEffect(() => { if (selected) loadDetail(selected); }, [selected, loadDetail]);

  const save = async () => {
    setBusy(true); setError(null); setMsg(null);
    try {
      await api.saveAboutCase({ ...form, id: form.id });
      setMsg('저장되었습니다');
      await load(); await loadDetail(form.id);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '저장에 실패했습니다');
    } finally { setBusy(false); }
  };

  const move = async (to: string) => {
    setBusy(true); setError(null); setMsg(null);
    try {
      await api.moveAboutCase(selected!, { to });
      setMsg(`상태를 ${to} 로 변경했습니다`);
      await load(); await loadDetail(selected!);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '상태 변경에 실패했습니다');
    } finally { setBusy(false); }
  };

  const reviewMetric = async (metricId: string, body: any) => {
    setBusy(true); setError(null);
    try {
      await api.reviewCaseMetric(metricId, body);
      const ev = await api.getCaseEvidenceReview(selected!).then((r) => r.data);
      setEvidence(ev);
      await loadDetail(selected!);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '검수에 실패했습니다');
    } finally { setBusy(false); }
  };

  const recordApproval = async (party: string, st: string, comment?: string) => {
    setBusy(true); setError(null);
    try {
      const r = await api.recordCaseApproval(selected!, { party, status: st, comment });
      setApproval(r.data);
      await load(); await loadDetail(selected!);
      setMsg('승인 상태를 기록했습니다');
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '기록에 실패했습니다');
    } finally { setBusy(false); }
  };

  const gate = detail?.gate;
  const totalPages = list ? Math.max(1, Math.ceil(list.total / list.limit)) : 1;

  return (
    <AboutAdminShell title="매칭사례" desc="사례를 작성하고 근거·권리·승인을 확인해 게시합니다."
      breadcrumb={['매칭사례', '사례 관리']}
      actions={
        <button onClick={() => { setSelected(null); setDetail(null); setForm({ title: '', sponsorTypes: [], objectiveCodes: [] }); setTab('EDIT'); }}
          className="h-10 px-4 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 inline-flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> 사례 작성
        </button>
      }>
      {loading && !list ? <Loading /> : !list ? <Empty title="사례를 불러오지 못했습니다" /> : (
        <div className="space-y-4">
          {/* 요약 */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {list.summary.byStatus.slice(0, 6).map((s: any) => (
              <button key={s.code} onClick={() => { setStatus(s.code); setPage(1); }}
                className={`rounded-2xl border px-4 py-3.5 text-left transition ${
                  status === s.code ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                <p className="text-[11.5px] font-semibold text-slate-500">{s.label}</p>
                <p className="mt-1 text-[20px] font-extrabold text-slate-900 tabular-nums leading-none">{nf(s.count)}</p>
              </button>
            ))}
          </div>

          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">{error}</div>}
          {msg && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">{msg}</div>}

          <div className="grid lg:grid-cols-5 gap-4">
            {/* 목록 */}
            <Panel className="lg:col-span-2" title={`사례 ${nf(list.total)}건`}
              right={
                <div className="flex items-center gap-2">
                  <button onClick={() => { setStatus('ALL'); setQ(''); setPage(1); }}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-500">전체</button>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-300" />
                    <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
                      placeholder="사례명 · 코드"
                      className="h-9 w-36 pl-8 pr-2 rounded-lg border border-slate-200 text-[12px] focus:outline-none focus:border-slate-400" />
                  </div>
                </div>
              }>
              {list.cases.length ? (
                <>
                  <div className="divide-y divide-slate-50 max-h-[620px] overflow-y-auto">
                    {list.cases.map((c: any) => (
                      <button key={c.id} onClick={() => { setSelected(c.id); setTab('EDIT'); }}
                        className={`w-full text-left px-4 py-3.5 transition ${
                          selected === c.id ? 'bg-emerald-50/50 border-l-2 border-l-emerald-500' : 'hover:bg-slate-50'
                        }`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Status code={c.status} label={c.statusLabel} />
                          <span className="font-mono text-[11px] text-slate-400">{c.code}</span>
                        </div>
                        <p className="text-[13.5px] font-bold text-slate-800 truncate">{c.title}</p>
                        <p className="text-[11.5px] text-slate-400 mt-0.5 truncate">
                          {c.brandName} · {c.athleteName}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <Tag tone={c.verificationTone as any}>{c.verificationLabel}</Tag>
                          <Tag tone={c.partyLabel === '승인 완료' ? 'emerald' : 'slate'}>{c.partyLabel}</Tag>
                        </div>
                      </button>
                    ))}
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
                <Empty title="해당하는 사례가 없습니다" />
              )}
            </Panel>

            {/* 상세 */}
            <div className="lg:col-span-3 space-y-4">
              {!form ? (
                <Panel><Empty title="사례를 선택하세요" /></Panel>
              ) : (
                <>
                  {/* 게시 게이트 */}
                  {gate && (
                    <Panel title="게시 게이트"
                      right={
                        gate.ok
                          ? <Tag tone="emerald"><CheckCircle2 className="w-3 h-3" /> 게시 가능</Tag>
                          : <Tag tone="rose"><Lock className="w-3 h-3" /> 게시 차단 {gate.blockers.length}건</Tag>
                      }>
                      <div className="p-4 grid sm:grid-cols-2 gap-2.5">
                        {gate.checks.map((c: any) => (
                          <div key={c.code} className="flex items-start gap-2.5">
                            {c.ok
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              : <XCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />}
                            <span className="min-w-0">
                              <span className={`block text-[13px] ${c.ok ? 'text-slate-600' : 'font-semibold text-slate-800'}`}>{c.label}</span>
                              {c.detail && <span className="block text-[11.5px] text-rose-500 mt-0.5">{c.detail}</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Panel>
                  )}

                  {/* 탭 */}
                  <div className="flex gap-1.5">
                    {TABS.map((t) => (
                      <button key={t.key} onClick={() => setTab(t.key)}
                        className={`h-9 px-4 rounded-xl text-[13px] font-bold border transition ${
                          tab === t.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}>
                        {t.label}
                      </button>
                    ))}
                    <div className="ml-auto flex gap-2">
                      <button disabled={busy} onClick={save}
                        className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-600 hover:border-slate-400 inline-flex items-center gap-1.5">
                        <Save className="w-3.5 h-3.5" /> 저장
                      </button>
                      {(detail?.case?.nextStates ?? []).map((s: string) => (
                        <button key={s} disabled={busy} onClick={() => move(s)}
                          className={`h-9 px-4 rounded-xl text-[13px] font-bold inline-flex items-center gap-1.5 ${
                            s === 'PUBLISHED'
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400'
                              : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                          }`}>
                          {s === 'IN_REVIEW' ? '검토 요청' : s === 'AWAITING_PARTY' ? '승인 요청'
                            : s === 'APPROVED' ? '내부 승인' : s === 'PUBLISHED' ? <><Send className="w-3.5 h-3.5" /> 게시</>
                            : s === 'ARCHIVED' ? '보관' : s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 편집 */}
                  {tab === 'EDIT' && (
                    <Panel title="기본 정보">
                      <div className="p-5 grid sm:grid-cols-2 gap-3">
                        {[
                          { k: 'title', l: '사례 제목 *' },
                          { k: 'brandName', l: '브랜드명' },
                          { k: 'athleteName', l: '선수명' },
                          { k: 'contractId', l: '계약 ID (게시 필수)' },
                          { k: 'sport', l: '스포츠' },
                          { k: 'tour', l: '투어' },
                        ].map((f) => (
                          <div key={f.k}>
                            <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">{f.l}</label>
                            <input value={form[f.k] ?? ''} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
                          </div>
                        ))}
                        <div className="sm:col-span-2">
                          <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">요약 (공개용)</label>
                          <textarea value={form.summary ?? ''} onChange={(e) => setForm({ ...form, summary: e.target.value.slice(0, 300) })}
                            rows={2}
                            className="w-full rounded-xl border border-slate-200 p-3 text-[13px] resize-none focus:outline-none focus:border-slate-400" />
                          <p className="mt-1 text-right text-[10.5px] text-slate-400 tabular-nums">{(form.summary ?? '').length} / 300</p>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">브랜드 목표 · 배경</label>
                          <textarea value={form.background ?? ''} onChange={(e) => setForm({ ...form, background: e.target.value })}
                            rows={3}
                            className="w-full rounded-xl border border-slate-200 p-3 text-[13px] resize-none focus:outline-none focus:border-slate-400" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">후원 방식 (쉼표 구분)</label>
                          <input value={(form.sponsorTypes ?? []).join(', ')}
                            onChange={(e) => setForm({ ...form, sponsorTypes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">대표 이미지 URL</label>
                          <input value={form.heroImageUrl ?? ''} onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value })}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
                        </div>
                      </div>
                    </Panel>
                  )}

                  {/* 근거 검수 (IA05) */}
                  {tab === 'EVIDENCE' && (
                    <Panel title="공개범위 · 근거 검수"
                      right={evidence && (
                        <span className="text-[12px] font-bold text-slate-500 tabular-nums">
                          검수 {evidence.progress.done}/{evidence.progress.total}
                        </span>
                      )}>
                      {!evidence ? <Empty title="검수 정보를 불러오지 못했습니다" />
                        : evidence.metrics.length ? (
                          <>
                            <div className="overflow-x-auto">
                              <table className="w-full text-[13px]">
                                <thead>
                                  <tr className="text-[11px] text-slate-400 border-b border-slate-100">
                                    <th className="text-left font-semibold px-5 py-2.5">지표</th>
                                    <th className="text-right font-semibold py-2.5">표시 값</th>
                                    <th className="text-left font-semibold py-2.5 pl-4">출처</th>
                                    <th className="text-left font-semibold py-2.5">검증</th>
                                    <th className="text-left font-semibold px-5 py-2.5">공개 범위</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {evidence.metrics.map((m: any) => (
                                    <tr key={m.id} className="border-b border-slate-50 last:border-0">
                                      <td className="px-5 py-3">
                                        <p className="font-semibold text-slate-800">{m.label}</p>
                                        <p className="text-[11px] text-slate-400 font-mono">{m.metricCode}</p>
                                      </td>
                                      <td className="py-3 text-right tabular-nums font-bold text-slate-900">
                                        {m.displayValue ?? `${nf(m.value)}${m.unit}`}
                                      </td>
                                      <td className="py-3 pl-4">
                                        {m.hasEvidence
                                          ? <span className="text-slate-600">{m.sourceName}</span>
                                          : <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                                              <AlertTriangle className="w-3.5 h-3.5" /> 출처 없음
                                            </span>}
                                      </td>
                                      <td className="py-3">
                                        <select value={m.verificationStatus} disabled={busy}
                                          onChange={(e) => reviewMetric(m.id, { verificationStatus: e.target.value })}
                                          className="h-8 px-2 rounded-lg border border-slate-200 text-[12px] font-semibold focus:outline-none">
                                          {['RAW', 'VERIFIED', 'FINAL', 'REJECTED'].map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                      </td>
                                      <td className="px-5 py-3">
                                        <select value={m.visibility} disabled={busy}
                                          onChange={(e) => reviewMetric(m.id, { visibility: e.target.value })}
                                          className="h-8 px-2 rounded-lg border border-slate-200 text-[12px] font-semibold focus:outline-none">
                                          {evidence.visibilityOptions.map((o: any) => (
                                            <option key={o.code} value={o.code}>{o.label}</option>
                                          ))}
                                        </select>
                                        {m.lockReason && (
                                          <p className="mt-1 text-[10.5px] text-rose-500 max-w-[220px] leading-tight">{m.lockReason}</p>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <p className="px-5 py-3.5 border-t border-slate-100 text-[11.5px] text-slate-400">{evidence.notice}</p>
                          </>
                        ) : (
                          <Empty title="등록된 성과 지표가 없습니다" desc="지표를 추가하면 이곳에서 출처와 공개범위를 검수합니다." />
                        )}
                    </Panel>
                  )}

                  {/* 당사자 승인 (IA06) */}
                  {tab === 'APPROVAL' && (
                    <Panel title="당사자 승인"
                      right={
                        <button disabled={busy} onClick={async () => {
                          await api.requestCaseApproval(selected!);
                          const r = await api.getCaseApproval(selected!);
                          setApproval(r.data); await load();
                          setMsg('승인 요청을 보냈습니다');
                        }}
                          className="h-9 px-4 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:border-slate-400">
                          승인 요청 발송
                        </button>
                      }>
                      {!approval ? <Empty title="승인 정보를 불러오지 못했습니다" /> : (
                        <div className="p-5 space-y-4">
                          <div className="grid sm:grid-cols-2 gap-3">
                            {approval.parties.map((p: any) => (
                              <div key={p.party} className={`rounded-2xl border p-4 ${
                                p.status === 'APPROVED' ? 'border-emerald-200 bg-emerald-50/40'
                                  : p.status === 'CHANGES_REQUESTED' ? 'border-amber-200 bg-amber-50/40'
                                  : 'border-slate-200'
                              }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[12px] font-bold text-slate-500">{p.label}</span>
                                  <Tag tone={p.status === 'APPROVED' ? 'emerald' : p.status === 'CHANGES_REQUESTED' ? 'amber' : 'slate'}>
                                    {p.statusLabel}
                                  </Tag>
                                </div>
                                <p className="text-[15px] font-bold text-slate-900">{p.name ?? '—'}</p>
                                {p.comment && <p className="mt-2 text-[12.5px] text-slate-600 leading-relaxed">{p.comment}</p>}
                                <p className="mt-2 text-[11px] text-slate-400 tabular-nums">
                                  요청 {fmtDate(p.requestedAt, true)}
                                  {p.respondedAt && ` · 응답 ${fmtDate(p.respondedAt, true)}`}
                                </p>
                                <div className="mt-3 flex gap-1.5">
                                  <button disabled={busy} onClick={() => recordApproval(p.party, 'APPROVED')}
                                    className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-[12px] font-bold hover:bg-emerald-700">
                                    승인 기록
                                  </button>
                                  <button disabled={busy}
                                    onClick={() => {
                                      const c = window.prompt('변경 요청 사유를 입력하세요');
                                      if (c) recordApproval(p.party, 'CHANGES_REQUESTED', c);
                                    }}
                                    className="h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-600 hover:border-slate-400">
                                    변경 요청
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div>
                            <p className="text-[12px] font-bold text-slate-500 mb-2.5">항목별 승인 대상</p>
                            <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100">
                              {approval.items.map((it: any) => (
                                <div key={it.key} className="flex items-center gap-3 px-4 py-3">
                                  <span className="text-[12.5px] font-semibold text-slate-600 w-32 shrink-0">{it.label}</span>
                                  <span className="text-[12.5px] text-slate-500 truncate flex-1">
                                    {it.preview
                                      ? (String(it.preview).startsWith('http') ? '이미지 등록됨' : String(it.preview).slice(0, 60))
                                      : '미등록'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <p className="text-[11.5px] text-slate-400">{approval.notice}</p>
                        </div>
                      )}
                    </Panel>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AboutAdminShell>
  );
}
