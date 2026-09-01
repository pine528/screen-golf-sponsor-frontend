/**
 * A04 콘텐츠 검수함 (핸드오프 v1.0 §10.2 · §18.2)
 * 일괄 승인은 위험도 P3에만 허용한다. 조치에는 사유가 필수다.
 */
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, MessageSquare, Mail, Lightbulb, FileText, AlertCircle } from 'lucide-react';
import { api } from '../../../services/api';
import FanAdminShell, {
  KpiCard, Panel, RiskTag, StatusTag, Empty, Loading, useAdminGuard, nf, fmtDate, fmtRemain,
} from '../../../components/fanadmin/FanAdminShell';

const TYPE_ICON: Record<string, any> = {
  POST: FileText, COMMENT: MessageSquare, LETTER: Mail, BRAND_SUGGEST: Lightbulb,
};

const DECISION_STYLE: Record<string, string> = {
  APPROVED: 'bg-emerald-600 text-white hover:bg-emerald-700',
  HIDDEN: 'bg-white text-slate-700 border border-slate-200 hover:border-slate-400',
  EDIT_REQUESTED: 'bg-white text-sky-700 border border-sky-200 hover:border-sky-400',
  SANCTION_REVIEW: 'bg-white text-rose-600 border border-rose-200 hover:border-rose-400',
};

export default function FanOpsModeration() {
  const guard = useAdminGuard();
  const [sp, setSp] = useSearchParams();
  const [tab, setTab] = useState('ALL');
  const [risk, setRisk] = useState('ALL');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(sp.get('id'));
  const [detail, setDetail] = useState<any>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.getFanAdminModeration({ tab, risk, limit: 30 })
      .then((r) => {
        setData(r.data);
        if (!selected && r.data?.items?.[0]) setSelected(r.data.items[0].id);
      })
      .catch((e) => guard(e, '/admin/fan/moderation'))
      .finally(() => setLoading(false));
  }, [tab, risk]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    setDecision(''); setReason(''); setNote(''); setError(null);
    api.getFanAdminModerationItem(selected).then((r) => setDetail(r.data)).catch(() => setDetail(null));
  }, [selected]);

  const decide = async () => {
    if (!selected || !decision || !reason) return;
    setBusy(true); setError(null);
    try {
      await api.decideFanModeration(selected, { decision, reason, note: note || undefined });
      setSelected(null);
      setSp({});
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '조치에 실패했습니다');
    } finally { setBusy(false); }
  };

  const bulkApprove = async () => {
    if (!checked.length) return;
    setBusy(true); setError(null);
    try {
      await api.bulkApproveFanModeration(checked, '오탐 (정상 콘텐츠)');
      setChecked([]);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '일괄 승인에 실패했습니다');
    } finally { setBusy(false); }
  };

  const k = data?.kpis;
  const p3Ids = (data?.items ?? []).filter((i: any) => i.risk === 'P3').map((i: any) => i.id);

  return (
    <FanAdminShell title="콘텐츠 검수함" desc="자동 판정 결과를 검토하고 정책에 따라 조치하세요."
      breadcrumb={['팬 운영', '콘텐츠 검수']}>
      {loading ? <Loading /> : !data ? <Empty title="검수함을 불러오지 못했습니다" /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="자동 승인" value={k.autoApprovedRate} unit="%" sub={k.window} empty="집계 중" />
            <KpiCard label="자동 차단" value={k.autoBlockedRate} unit="%" sub={k.window} empty="집계 중" />
            <KpiCard label="검수 대기" value={k.pending} unit="건" sub="사람이 확인해야 하는 항목" />
            <KpiCard label="SLA 초과" value={k.overdue} unit="건" sub="기한을 넘긴 미처리 건" />
          </div>

          {/* 필터 */}
          <div className="flex flex-wrap items-center gap-2">
            {data.tabs.map((t: any) => (
              <button key={t.code} onClick={() => { setTab(t.code); setSelected(null); }}
                className={`h-9 px-3.5 rounded-xl text-[13px] font-semibold border transition ${
                  tab === t.code ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}>
                {t.label}
              </button>
            ))}
            <span className="w-px h-6 bg-slate-200 mx-1" />
            <button onClick={() => setRisk('ALL')}
              className={`h-9 px-3 rounded-xl text-[12px] font-bold border transition ${
                risk === 'ALL' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'
              }`}>전체</button>
            {data.riskCounts.map((r: any) => (
              <button key={r.code} onClick={() => setRisk(r.code)}
                className={`h-9 px-3 rounded-xl text-[12px] font-bold border transition ${
                  risk === r.code ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}>
                {r.code} {r.label} <span className="tabular-nums opacity-70">{r.count}</span>
              </button>
            ))}
          </div>

          {/* 일괄 승인 */}
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <input type="checkbox"
              checked={checked.length > 0 && checked.length === p3Ids.length}
              onChange={(e) => setChecked(e.target.checked ? p3Ids : [])}
              className="w-4 h-4 rounded accent-emerald-600" />
            <span className="text-[13px] text-slate-600">
              P3(낮음) 항목만 일괄 승인 <b className="text-slate-900 tabular-nums">({checked.length}/{p3Ids.length})</b>
            </span>
            <span className="text-[11px] text-slate-400">일괄 승인은 위험도 P3 항목에만 가능합니다.</span>
            <button disabled={!checked.length || busy} onClick={bulkApprove}
              className="ml-auto h-9 px-4 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 transition">
              일괄 승인
            </button>
          </div>

          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">{error}</div>}

          <div className="grid lg:grid-cols-5 gap-4">
            {/* 목록 */}
            <Panel className="lg:col-span-2" title={`검수 대기 ${nf(data.total)}건`}>
              {data.items.length ? (
                <div className="divide-y divide-slate-50 max-h-[640px] overflow-y-auto">
                  {data.items.map((i: any) => {
                    const I = TYPE_ICON[i.targetType] ?? FileText;
                    return (
                      <div key={i.id}
                        className={`flex gap-3 px-4 py-3.5 cursor-pointer transition ${
                          selected === i.id ? 'bg-emerald-50/50 border-l-2 border-l-emerald-500' : 'hover:bg-slate-50'
                        }`}
                        onClick={() => setSelected(i.id)}>
                        {i.risk === 'P3' && (
                          <input type="checkbox" checked={checked.includes(i.id)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setChecked((c) => e.target.checked ? [...c, i.id] : c.filter((x) => x !== i.id))}
                            className="w-4 h-4 mt-1 rounded accent-emerald-600 shrink-0" />
                        )}
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <I className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <RiskTag risk={i.risk} label={i.riskLabel} />
                            <span className="text-[11px] text-slate-400">{i.targetTypeLabel}</span>
                          </div>
                          <p className="text-[13px] text-slate-700 line-clamp-2 leading-snug">{i.excerpt || '(본문 없음)'}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] text-slate-400 tabular-nums">{fmtDate(i.createdAt, true)}</span>
                            {i.slaRemainMs !== null && (
                              <span className={`text-[11px] font-bold tabular-nums ${i.overdue ? 'text-rose-500' : 'text-slate-400'}`}>
                                SLA {fmtRemain(i.slaRemainMs)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Empty title="검수할 항목이 없습니다" desc="자동 판정을 통과하지 못한 콘텐츠가 여기에 모입니다." />
              )}
            </Panel>

            {/* 상세 + 조치 */}
            <Panel className="lg:col-span-3" title="콘텐츠 상세">
              {!detail ? (
                <Empty title="항목을 선택하세요" />
              ) : (
                <div className="p-5 space-y-5">
                  <div className="flex items-center gap-2">
                    <RiskTag risk={detail.risk} label={detail.riskLabel} />
                    <StatusTag label={detail.targetTypeLabel} />
                    <span className="ml-auto text-[11px] text-slate-400 tabular-nums">
                      접수 {fmtDate(detail.createdAt, true)}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-[14px] text-slate-700 leading-[1.75] whitespace-pre-line">
                      {detail.excerpt || '(본문이 저장되지 않았습니다)'}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {/* 작성자 */}
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-[12px] font-bold text-slate-500 mb-2.5">작성자 정보</p>
                      {detail.author ? (
                        <>
                          <p className="text-[14px] font-bold text-slate-900">{detail.author.nickname}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">가입 {fmtDate(detail.author.joinedAt)}</p>
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            {[
                              { l: '작성 글', v: detail.author.posts },
                              { l: '신고 이력', v: detail.author.reports },
                              { l: '제재 이력', v: detail.author.sanctions },
                            ].map((s) => (
                              <div key={s.l} className="text-center">
                                <p className="text-[16px] font-extrabold text-slate-900 tabular-nums">{nf(s.v)}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{s.l}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : <p className="text-[13px] text-slate-400">작성자 정보 없음</p>}
                    </div>

                    {/* AI 분석 */}
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-[12px] font-bold text-slate-500 mb-2.5">자동 판정</p>
                      {detail.aiScore !== null && detail.aiScore !== undefined ? (
                        <>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[12px] text-slate-500">위반 가능성</span>
                            <span className="text-[13px] font-extrabold text-slate-900 tabular-nums">{detail.aiScore}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-slate-900" style={{ width: `${detail.aiScore}%` }} />
                          </div>
                        </>
                      ) : (
                        <p className="text-[13px] text-slate-400">자동 판정 점수 없음</p>
                      )}
                      {detail.policies?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                          <p className="text-[11px] font-bold text-slate-400">적용 정책</p>
                          {detail.policies.map((p: string) => (
                            <p key={p} className="text-[12px] text-rose-600">{p}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 조치 */}
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-[12px] font-bold text-slate-500 mb-3">
                      조치 <span className="text-rose-500">* 사유 선택은 필수입니다</span>
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                      {detail.decisions.map((d: any) => (
                        <button key={d.code} onClick={() => setDecision(d.code)}
                          className={`h-10 rounded-xl text-[13px] font-bold transition ${
                            decision === d.code ? DECISION_STYLE[d.code] : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                    {decision && (
                      <p className="text-[12px] text-slate-400 mb-3">
                        {detail.decisions.find((d: any) => d.code === decision)?.desc}
                      </p>
                    )}
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">사유 선택 *</label>
                        <select value={reason} onChange={(e) => setReason(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400">
                          <option value="">사유를 선택하세요</option>
                          {detail.reasons.map((r: string) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">추가 의견 (선택)</label>
                        <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))}
                          placeholder="필요시 추가 의견을 입력하세요"
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] placeholder:text-slate-300 focus:outline-none focus:border-slate-400" />
                      </div>
                    </div>

                    {decision === 'HIDDEN' && (
                      <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-[12px] text-amber-700 leading-relaxed">
                          숨김 처리하면 해당 활동이 팬온도 계산에서 제외됩니다. 점수는 다음 배치에서 재계산됩니다.
                        </p>
                      </div>
                    )}

                    <button disabled={!decision || !reason || busy} onClick={decide}
                      className="mt-4 w-full h-11 rounded-xl bg-slate-900 text-white text-[14px] font-bold hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition inline-flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> {busy ? '처리 중…' : '조치 적용'}
                    </button>
                  </div>
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}
    </FanAdminShell>
  );
}
