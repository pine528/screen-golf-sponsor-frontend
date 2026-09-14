/**
 * A07 포인트 정책 · 캠페인 (핸드오프 v1.0 §7 · §18.2)
 * 정책은 버전으로 발행한다. 캠페인은 총 예산과 1인 상한이 반드시 있어야 한다.
 */
import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Plus } from 'lucide-react';
import { api } from '../../../services/api';
import FanAdminShell, {
  Panel, StatusTag, Empty, Loading, useAdminGuard, nf, fmtDate,
} from '../../../components/fanadmin/FanAdminShell';

const TABS = [
  { key: 'EARN', label: '적립 정책' },
  { key: 'SPEND', label: '사용 정책' },
  { key: 'EXPIRY', label: '만료 정책' },
  { key: 'CAMPAIGN', label: '캠페인' },
];

const emptyCampaign = {
  name: '', description: '', totalBudget: 0, perUserCap: 0,
  startAt: new Date().toISOString().slice(0, 10),
  endAt: new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10),
  target: 'ALL', status: 'DRAFT',
};

export default function FanOpsPointPolicy() {
  const guard = useAdminGuard();
  const [tab, setTab] = useState('EARN');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(emptyCampaign);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.getFanPointPolicy()
      .then((r) => setData(r.data))
      .catch((e) => guard(e, '/admin/fan/point-policy'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const saveCampaign = async () => {
    setBusy(true); setError(null); setMsg(null);
    try {
      await api.upsertPointCampaign(form);
      setForm(emptyCampaign);
      setMsg('캠페인이 저장되었습니다');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '저장에 실패했습니다');
    } finally { setBusy(false); }
  };

  const earn = data?.current?.earnRules ?? [];
  const spend = data?.current?.spendRules ?? [];
  const expiry = data?.current?.expiry ?? {};

  return (
    <FanAdminShell title="포인트 정책 · 캠페인" desc="팬포인트의 적립·사용·만료 정책과 캠페인을 관리합니다."
      breadcrumb={['팬 운영', '포인트 정책']}>
      {loading ? <Loading /> : !data ? <Empty title="정책을 불러오지 못했습니다" /> : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`h-9 px-4 rounded-xl text-[13px] font-semibold border transition ${
                  tab === t.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}>
                {t.label}
              </button>
            ))}
            <span className="ml-auto inline-flex items-center gap-2">
              <span className="font-mono text-[12px] text-slate-500">{data.current.version}</span>
              <StatusTag label={data.current.status === 'PUBLISHED' ? '게시됨' : data.current.status} tone="emerald" />
            </span>
          </div>

          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">{error}</div>}
          {msg && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">{msg}</div>}

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              {tab === 'EARN' && (
                <Panel title="적립 규칙" right={<span className="text-[12px] text-slate-500">일일·월간 상한은 모든 활동에 합산 적용됩니다</span>}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="text-[12px] text-slate-500 border-b border-slate-100">
                          <th className="text-left font-semibold px-5 py-2.5">활동</th>
                          <th className="text-right font-semibold py-2.5">적립</th>
                          <th className="text-left font-semibold py-2.5 pl-6">한도</th>
                          <th className="text-left font-semibold px-5 py-2.5">확정 시점</th>
                        </tr>
                      </thead>
                      <tbody>
                        {earn.map((r: any) => (
                          <tr key={r.code} className="border-b border-slate-50 last:border-0">
                            <td className="px-5 py-3 font-semibold text-slate-800">{r.label}</td>
                            <td className="py-3 text-right font-extrabold text-emerald-600 tabular-nums">
                              {r.rate ? `${r.rate * 100}%` : `${r.points}P`}
                            </td>
                            <td className="py-3 pl-6 text-slate-500">{r.limit}</td>
                            <td className="px-5 py-3 text-slate-500 text-[12px]">
                              {({
                                INSTANT: '즉시', AFTER_CLOSE: '투표 종료 후', AFTER_RESULT: '결과 확정 후',
                                AFTER_24H: '24시간 후', AFTER_REVIEW: '검토 후', AFTER_BRAND: '브랜드 회신 후',
                                AFTER_CONFIRM: '구매확정 후',
                              } as any)[r.confirm] ?? r.confirm}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              )}

              {tab === 'SPEND' && (
                <Panel title="사용처">
                  <div className="p-5 grid sm:grid-cols-2 gap-3">
                    {spend.map((r: any) => (
                      <div key={r.code} className={`rounded-2xl border p-4 ${r.available ? 'border-slate-200' : 'border-slate-100 bg-slate-50/60'}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className={`text-[14px] font-bold ${r.available ? 'text-slate-900' : 'text-slate-500'}`}>{r.label}</p>
                          {r.available && <StatusTag label="사용 가능" tone="emerald" />}
                        </div>
                        <p className="text-[12px] text-slate-500 leading-relaxed">{r.desc}</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}

              {tab === 'EXPIRY' && (
                <Panel title="만료 정책">
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-slate-600">포인트 유효기간</span>
                      <span className="text-[16px] font-extrabold text-slate-900 tabular-nums">{expiry.months ?? 12}개월</span>
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-slate-500 mb-2">소멸 예고 알림</p>
                      <div className="flex gap-2">
                        {(expiry.notices ?? [90, 30, 7]).map((d: number) => (
                          <span key={d} className="inline-flex h-9 px-3.5 rounded-xl bg-slate-100 text-slate-700 text-[13px] font-bold items-center">
                            {d}일 전
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[12px] text-slate-500 leading-relaxed">
                      포인트는 적립일로부터 {expiry.months ?? 12}개월 후 자동 만료됩니다. 만료도 원장에 거래로 기록됩니다.
                    </p>
                  </div>
                </Panel>
              )}

              {tab === 'CAMPAIGN' && (
                <>
                  <Panel title="캠페인 목록">
                    {data.campaigns.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                          <thead>
                            <tr className="text-[12px] text-slate-500 border-b border-slate-100">
                              <th className="text-left font-semibold px-5 py-2.5">캠페인</th>
                              <th className="text-left font-semibold py-2.5">기간</th>
                              <th className="text-right font-semibold py-2.5">예산</th>
                              <th className="text-right font-semibold py-2.5">집행</th>
                              <th className="text-left font-semibold px-5 py-2.5">상태</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.campaigns.map((c: any) => (
                              <tr key={c.id} className="border-b border-slate-50 last:border-0">
                                <td className="px-5 py-3">
                                  <p className="font-semibold text-slate-800">{c.name}</p>
                                  <p className="text-[12px] text-slate-500">1인 최대 {nf(c.perUserCap)}P</p>
                                </td>
                                <td className="py-3 text-slate-500 tabular-nums text-[12px]">
                                  {fmtDate(c.startAt)} ~ {fmtDate(c.endAt)}
                                </td>
                                <td className="py-3 text-right tabular-nums font-semibold">{nf(c.totalBudget)}P</td>
                                <td className="py-3 text-right tabular-nums">
                                  {nf(c.spent)}P
                                  <span className="text-[12px] text-slate-500 ml-1">
                                    ({c.usedRate === null ? '—' : `${c.usedRate}%`})
                                  </span>
                                </td>
                                <td className="px-5 py-3">
                                  <StatusTag label={c.status === 'ACTIVE' ? '활성' : c.status === 'DRAFT' ? '초안' : c.status}
                                    tone={c.status === 'ACTIVE' ? 'emerald' : 'slate'} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <Empty title="등록된 캠페인이 없습니다" desc="아래에서 새 캠페인을 만들 수 있습니다." />}
                  </Panel>

                  <Panel title="새 캠페인">
                    <div className="p-5 grid sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">캠페인명 *</label>
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="예: 가을 시즌 응원 캠페인"
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] placeholder:text-slate-300 focus:outline-none focus:border-slate-400" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">총 예산 (P) *</label>
                        <input type="number" value={form.totalBudget || ''} onChange={(e) => setForm({ ...form, totalBudget: Number(e.target.value) })}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] tabular-nums focus:outline-none focus:border-slate-400" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">1인당 최대 (P) *</label>
                        <input type="number" value={form.perUserCap || ''} onChange={(e) => setForm({ ...form, perUserCap: Number(e.target.value) })}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] tabular-nums focus:outline-none focus:border-slate-400" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">시작일 *</label>
                        <input type="date" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">종료일 *</label>
                        <input type="date" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">설명</label>
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                          rows={2}
                          className="w-full rounded-xl border border-slate-200 p-3 text-[13px] resize-none focus:outline-none focus:border-slate-400" />
                      </div>
                      <div className="sm:col-span-2 flex justify-end">
                        <button disabled={busy} onClick={saveCampaign}
                          className="h-10 px-5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 inline-flex items-center gap-1.5">
                          <Plus className="w-4 h-4" /> 캠페인 저장
                        </button>
                      </div>
                    </div>
                  </Panel>
                </>
              )}
            </div>

            {/* 우측 — 정책 검증 + 버전 */}
            <div className="space-y-4">
              <Panel title="정책 검증">
                <div className="p-4 space-y-2.5">
                  {data.validations.map((v: any) => (
                    <div key={v.key} className="flex items-start gap-2.5">
                      {v.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        : <XCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800">{v.label}</p>
                        <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{v.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="버전 히스토리">
                {data.versions.length ? (
                  <div className="divide-y divide-slate-50">
                    {data.versions.map((v: any) => (
                      <div key={v.id} className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] text-slate-700">{v.version}</span>
                          <StatusTag label={v.status === 'PUBLISHED' ? '게시됨' : '종료'} tone={v.status === 'PUBLISHED' ? 'emerald' : 'slate'} />
                        </div>
                        <p className="text-[12px] text-slate-500 mt-1">
                          {v.summary ?? '변경 사유 없음'} · {fmtDate(v.publishedAt ?? v.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty title="발행된 버전이 없습니다" desc="현재는 코드 기본 정책으로 운영 중입니다." />
                )}
              </Panel>

              <p className="text-[12px] text-slate-500 px-1 leading-relaxed">{data.notice}</p>
            </div>
          </div>
        </div>
      )}
    </FanAdminShell>
  );
}
