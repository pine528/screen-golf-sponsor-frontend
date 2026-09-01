/**
 * A08 포인트 조정 · 원장 (핸드오프 v1.0 §7.4 · §18.2)
 * 잔액은 직접 수정할 수 없다. 조정은 사유·케이스ID가 필요하고 10,000P 초과는 2인 승인이다.
 */
import { useCallback, useEffect, useState } from 'react';
import { Lock, Search, AlertTriangle, Check, X } from 'lucide-react';
import { api } from '../../../services/api';
import FanAdminShell, {
  KpiCard, Panel, StatusTag, Empty, Loading, useAdminGuard, nf, fmtDate,
} from '../../../components/fanadmin/FanAdminShell';

const TYPES = [
  { code: 'ALL', label: '유형 전체' },
  { code: 'EARN', label: '적립' },
  { code: 'SPEND', label: '사용·차감' },
];
const STATUSES = [
  { code: 'ALL', label: '상태 전체' },
  { code: 'AVAILABLE', label: '확정' },
  { code: 'PENDING', label: '미확정' },
  { code: 'EXPIRED', label: '만료' },
  { code: 'REVERSED', label: '회수' },
];

const STATUS_TONE: Record<string, 'emerald' | 'slate' | 'amber' | 'rose'> = {
  AVAILABLE: 'emerald', PENDING: 'slate', EXPIRED: 'amber', REVERSED: 'rose',
};
const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: '확정', PENDING: '미확정', EXPIRED: '만료', REVERSED: '회수', USED: '사용',
};

export default function FanOpsPointLedger() {
  const guard = useAdminGuard();
  const [q, setQ] = useState('');
  const [type, setType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ userId: '', delta: 0, reason: '', caseId: '', evidenceUrl: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.getFanAdminPointLedger({ q: q || undefined, type, status, page, limit: 50 })
      .then((r) => setData(r.data))
      .catch((e) => guard(e, '/admin/fan/point-ledger'))
      .finally(() => setLoading(false));
  }, [q, type, status, page]);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    setBusy(true); setError(null); setMsg(null);
    try {
      const r = await api.requestPointAdjustment({
        userId: form.userId, delta: form.delta, reason: form.reason,
        caseId: form.caseId, evidenceUrl: form.evidenceUrl || undefined,
      });
      setMsg(r.data?.message ?? '조정 요청이 등록되었습니다');
      setForm({ userId: '', delta: 0, reason: '', caseId: '', evidenceUrl: '' });
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '요청 등록에 실패했습니다');
    } finally { setBusy(false); }
  };

  const act = async (id: string, approve: boolean) => {
    setBusy(true); setError(null);
    try {
      if (approve) await api.approvePointAdjustment(id);
      else await api.rejectPointAdjustment(id, '운영 판단에 따른 반려');
      setMsg(approve ? '조정이 원장에 반영되었습니다' : '조정 요청을 반려했습니다');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '처리에 실패했습니다');
    } finally { setBusy(false); }
  };

  const s = data?.summary;
  const rec = data?.reconciliation;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const overThreshold = data && Math.abs(form.delta) > data.twoApprovalThreshold;

  return (
    <FanAdminShell title="포인트 조정 · 원장" desc="포인트 원장을 조회하고 예외 상황을 조정합니다."
      breadcrumb={['팬 운영', '포인트 원장']}>
      {loading && !data ? <Loading /> : !data ? <Empty title="원장을 불러오지 못했습니다" /> : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 flex items-start gap-3">
            <Lock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[13px] text-amber-800">{data.notice}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="사용 가능" value={s.available} unit="P" sub="전체 지갑 합계" />
            <KpiCard label="미확정" value={s.pendingCount} unit="건" sub="확정 대기 중" />
            <KpiCard label="30일 내 만료" value={s.expiringSoon} unit="P" sub="소멸 예정" />
            <KpiCard label="회수" value={s.reversed} unit="P" sub="누적 회수 금액" />
          </div>

          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">{error}</div>}
          {msg && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">{msg}</div>}

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              {/* 대사 */}
              <Panel title="원장 · 정산 대사">
                <div className="p-5 flex flex-wrap items-center gap-6">
                  <div>
                    <p className="text-[11px] text-slate-400 font-semibold">시스템 합계</p>
                    <p className="text-[19px] font-extrabold text-slate-900 tabular-nums">{nf(rec.systemTotal)}P</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-semibold">원장 합계</p>
                    <p className="text-[19px] font-extrabold text-slate-900 tabular-nums">{nf(rec.ledgerTotal)}P</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-semibold">차이</p>
                    <p className={`text-[19px] font-extrabold tabular-nums ${rec.matched ? 'text-slate-900' : 'text-rose-500'}`}>
                      {nf(rec.diff)}P
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <StatusTag label={rec.matched ? '일치' : '불일치'} tone={rec.matched ? 'emerald' : 'rose'} />
                    <p className="text-[11px] text-slate-400 mt-1 tabular-nums">{fmtDate(rec.checkedAt, true)}</p>
                  </div>
                </div>
                {!rec.matched && (
                  <div className="mx-5 mb-5 rounded-xl bg-rose-50 px-4 py-3 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    <p className="text-[12px] text-rose-600 leading-relaxed">
                      지갑 잔액 합계와 원장 합계가 어긋납니다. 원인을 찾기 전에는 조정을 적용하지 마세요.
                    </p>
                  </div>
                )}
              </Panel>

              {/* 필터 + 원장 */}
              <Panel title="원장"
                right={
                  <div className="flex flex-wrap items-center gap-2">
                    <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}
                      className="h-9 px-2.5 rounded-lg border border-slate-200 text-[12px] font-semibold focus:outline-none">
                      {TYPES.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
                    </select>
                    <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                      className="h-9 px-2.5 rounded-lg border border-slate-200 text-[12px] font-semibold focus:outline-none">
                      {STATUSES.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
                    </select>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-300" />
                      <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
                        placeholder="사용자 ID · 거래 ID"
                        className="h-9 w-44 pl-8 pr-2 rounded-lg border border-slate-200 text-[12px] placeholder:text-slate-300 focus:outline-none focus:border-slate-400" />
                    </div>
                  </div>
                }>
                {data.items.length ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="text-[11px] text-slate-400 border-b border-slate-100">
                            <th className="text-left font-semibold px-5 py-2.5">회원</th>
                            <th className="text-left font-semibold py-2.5">출처</th>
                            <th className="text-right font-semibold py-2.5">변동</th>
                            <th className="text-right font-semibold py-2.5">잔액</th>
                            <th className="text-left font-semibold py-2.5 pl-6">상태</th>
                            <th className="text-left font-semibold px-5 py-2.5">거래 시각</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.items.map((t: any) => (
                            <tr key={t.id} className="border-b border-slate-50 last:border-0">
                              <td className="px-5 py-3">
                                <p className="font-semibold text-slate-800">{t.nickname ?? `user_${t.userId.slice(0, 6)}`}</p>
                                <p className="font-mono text-[10px] text-slate-400">{t.id.slice(0, 8)}</p>
                              </td>
                              <td className="py-3 text-slate-600">{t.description || t.source}</td>
                              <td className={`py-3 text-right tabular-nums font-extrabold ${
                                t.delta > 0 ? 'text-emerald-600' : t.delta < 0 ? 'text-rose-500' : 'text-slate-400'
                              }`}>
                                {t.delta > 0 ? '+' : ''}{nf(t.delta)}P
                              </td>
                              <td className="py-3 text-right tabular-nums text-slate-500">{nf(t.balanceAfter)}P</td>
                              <td className="py-3 pl-6">
                                <StatusTag label={STATUS_LABEL[t.status] ?? t.status} tone={STATUS_TONE[t.status] ?? 'slate'} />
                              </td>
                              <td className="px-5 py-3 text-slate-500 tabular-nums text-[12px]">{fmtDate(t.createdAt, true)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
                      <span className="text-[12px] text-slate-400 tabular-nums">전체 {nf(data.total)}건</span>
                      {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                            className="h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-semibold disabled:opacity-40">이전</button>
                          <span className="text-[12px] text-slate-500 tabular-nums px-1">{page} / {totalPages}</span>
                          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                            className="h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-semibold disabled:opacity-40">다음</button>
                        </div>
                      )}
                    </div>
                  </>
                ) : <Empty title="해당하는 거래가 없습니다" />}
              </Panel>
            </div>

            {/* 수동 조정 */}
            <div className="space-y-4">
              <Panel title="수동 포인트 조정">
                <div className="p-5 space-y-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">회원 ID *</label>
                    <input value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}
                      placeholder="사용자 ID"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] placeholder:text-slate-300 focus:outline-none focus:border-slate-400" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">조정 유형 *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[{ v: 1, l: '+ 증가' }, { v: -1, l: '− 감소' }].map((o) => (
                        <button key={o.v} onClick={() => setForm({ ...form, delta: Math.abs(form.delta) * o.v })}
                          className={`h-10 rounded-xl text-[13px] font-bold border transition ${
                            (form.delta >= 0 ? 1 : -1) === o.v ? 'border-slate-900 bg-slate-50 text-slate-900' : 'border-slate-200 text-slate-500'
                          }`}>
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">조정 포인트 *</label>
                    <input type="number" value={Math.abs(form.delta) || ''}
                      onChange={(e) => setForm({ ...form, delta: Number(e.target.value) * (form.delta < 0 ? -1 : 1) })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] text-right tabular-nums focus:outline-none focus:border-slate-400" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">사유 *</label>
                    <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value.slice(0, 200) })}
                      placeholder="조정 사유를 입력해주세요" rows={2}
                      className="w-full rounded-xl border border-slate-200 p-3 text-[13px] placeholder:text-slate-300 resize-none focus:outline-none focus:border-slate-400" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">케이스 ID *</label>
                    <input value={form.caseId} onChange={(e) => setForm({ ...form, caseId: e.target.value })}
                      placeholder="CASE-YYYYMMDD-#### 형식"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] placeholder:text-slate-300 font-mono focus:outline-none focus:border-slate-400" />
                  </div>

                  {overThreshold && (
                    <div className="rounded-xl bg-amber-50 px-4 py-3 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-[12px] text-amber-700 leading-relaxed">
                        {nf(data.twoApprovalThreshold)}P 초과 조정은 다른 관리자의 승인이 필요합니다.
                      </p>
                    </div>
                  )}

                  <button disabled={busy || !form.userId || !form.delta || !form.reason || !form.caseId}
                    onClick={submit}
                    className="w-full h-11 rounded-xl bg-slate-900 text-white text-[14px] font-bold hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition">
                    {busy ? '처리 중…' : '요청 등록'}
                  </button>

                  <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
                    <p className="font-bold text-slate-500">승인 프로세스</p>
                    <p>· {nf(data.twoApprovalThreshold)}P 이하: 관리자 1인 승인</p>
                    <p>· {nf(data.twoApprovalThreshold)}P 초과: 관리자 2인 승인 (요청자 승인 불가)</p>
                  </div>
                </div>
              </Panel>

              {/* 조정 내역 */}
              <Panel title="조정 요청 내역">
                {data.adjustments.length ? (
                  <div className="divide-y divide-slate-50">
                    {data.adjustments.map((a: any) => (
                      <div key={a.id} className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[14px] font-extrabold tabular-nums ${a.delta > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {a.delta > 0 ? '+' : ''}{nf(a.delta)}P
                          </span>
                          <StatusTag
                            label={({ PENDING: '승인 대기', APPLIED: '반영됨', REJECTED: '반려' } as any)[a.status] ?? a.status}
                            tone={a.status === 'APPLIED' ? 'emerald' : a.status === 'REJECTED' ? 'rose' : 'amber'} />
                        </div>
                        <p className="text-[12px] text-slate-600 truncate">{a.reason}</p>
                        <p className="font-mono text-[10px] text-slate-400 mt-0.5">{a.caseId}</p>
                        {a.status === 'PENDING' && (
                          <div className="flex gap-1.5 mt-2">
                            <button disabled={busy} onClick={() => act(a.id, true)}
                              className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-[12px] font-bold hover:bg-emerald-700 inline-flex items-center gap-1">
                              <Check className="w-3 h-3" /> 승인
                            </button>
                            <button disabled={busy} onClick={() => act(a.id, false)}
                              className="h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-600 hover:border-slate-400 inline-flex items-center gap-1">
                              <X className="w-3 h-3" /> 반려
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <Empty title="조정 요청이 없습니다" />}
              </Panel>
            </div>
          </div>
        </div>
      )}
    </FanAdminShell>
  );
}
