/**
 * A09 팬스토어 · 외부몰 · 코드 (핸드오프 v1.0 §8 · §18.2)
 * UTM·click_id 는 서버가 만든다. 화면은 결과만 보여주고 책임주체 고지를 강제한다.
 */
import { useCallback, useEffect, useState } from 'react';
import { Copy, Check, Plus } from 'lucide-react';
import { api } from '../../../services/api';
import FanAdminShell, {
  Panel, StatusTag, Empty, Loading, useAdminGuard, nf, fmtDate,
} from '../../../components/fanadmin/FanAdminShell';

const STATUS_TONE: Record<string, 'emerald' | 'slate' | 'amber'> = {
  PUBLISHED: 'emerald', DRAFT: 'slate', CLOSED: 'amber',
};
const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: '운영중', DRAFT: '작성 중', CLOSED: '종료',
};

export default function FanOpsStores() {
  const guard = useAdminGuard();
  const [status, setStatus] = useState('ALL');
  const [list, setList] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.getFanAdminStores({ status })
      .then((r) => {
        setList(r.data);
        if (!selected && r.data?.stores?.[0]) setSelected(r.data.stores[0].id);
      })
      .catch((e) => guard(e, '/admin/fan/stores'))
      .finally(() => setLoading(false));
  }, [status]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selected) { setDetail(null); setForm(null); return; }
    setAgreed(false); setError(null); setMsg(null);
    api.getFanAdminStore(selected)
      .then((r) => { setDetail(r.data); setForm({ ...r.data.store, athleteId: r.data.store.athlete?.id }); })
      .catch(() => setDetail(null));
  }, [selected]);

  const save = async (publish: boolean) => {
    if (!form) return;
    setBusy(true); setError(null); setMsg(null);
    try {
      await api.upsertFanStore({ ...form, status: publish ? 'PUBLISHED' : form.status });
      setMsg(publish ? '스토어가 게시되었습니다' : '저장되었습니다');
      await load();
      const r = await api.getFanAdminStore(selected!);
      setDetail(r.data);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || '저장에 실패했습니다');
    } finally { setBusy(false); }
  };

  const copyCode = () => {
    if (!form?.benefitCode) return;
    navigator.clipboard?.writeText(form.benefitCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <FanAdminShell title="팬스토어 · 외부몰 · 코드" desc="외부몰과 연동하여 팬에게 혜택 코드를 제공하고 성과를 추적합니다."
      breadcrumb={['팬 운영', '팬스토어']}>
      {loading && !list ? <Loading /> : !list ? <Empty title="스토어를 불러오지 못했습니다" /> : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {list.statuses.map((s: any) => (
              <button key={s.code} onClick={() => { setStatus(s.code); setSelected(null); }}
                className={`h-9 px-4 rounded-xl text-[13px] font-semibold border transition ${
                  status === s.code ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}>
                {s.label}
              </button>
            ))}
          </div>

          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">{error}</div>}
          {msg && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">{msg}</div>}

          <div className="grid lg:grid-cols-4 gap-4">
            {/* 목록 */}
            <Panel title={`스토어 ${nf(list.stores.length)}개`}>
              {list.stores.length ? (
                <div className="divide-y divide-slate-50 max-h-[640px] overflow-y-auto">
                  {list.stores.map((s: any) => (
                    <button key={s.id} onClick={() => setSelected(s.id)}
                      className={`w-full text-left px-4 py-3.5 transition ${
                        selected === s.id ? 'bg-emerald-50/50 border-l-2 border-l-emerald-500' : 'hover:bg-slate-50'
                      }`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <StatusTag label={STATUS_LABEL[s.status] ?? s.status} tone={STATUS_TONE[s.status] ?? 'slate'} />
                        <span className="text-[12px] text-slate-500">{s.responsibleLabel}</span>
                      </div>
                      <p className="text-[13px] font-bold text-slate-800 truncate">{s.title}</p>
                      <p className="text-[12px] text-slate-500 mt-0.5">
                        {s.athlete?.name} × {s.brandName} · 상품 {s.products}개 · 클릭 {nf(s.clicks)}
                      </p>
                    </button>
                  ))}
                </div>
              ) : <Empty title="등록된 스토어가 없습니다" />}
            </Panel>

            {/* 상세 */}
            <div className="lg:col-span-3 space-y-4">
              {!detail || !form ? (
                <Panel><Empty title="스토어를 선택하세요" /></Panel>
              ) : (
                <>
                  <Panel title={detail.store.title}
                    right={
                      <div className="flex gap-2">
                        <button disabled={busy} onClick={() => save(false)}
                          className="h-9 px-4 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:border-slate-400">
                          저장
                        </button>
                        <button disabled={busy || !agreed} onClick={() => save(true)}
                          className="h-9 px-4 rounded-xl bg-slate-900 text-white text-[13px] font-bold hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400">
                          게시
                        </button>
                      </div>
                    }>
                    <div className="p-5 grid lg:grid-cols-2 gap-5">
                      {/* 기본 설정 */}
                      <div className="space-y-3">
                        <p className="text-[12px] font-bold text-slate-500">기본 설정</p>
                        <div>
                          <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">판매 책임 주체 *</label>
                          <select value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400">
                            {list.responsibleOptions.map((o: any) => (
                              <option key={o.code} value={o.code}>{o.label}</option>
                            ))}
                          </select>
                          <p className="text-[12px] text-slate-500 mt-1">
                            {list.responsibleOptions.find((o: any) => o.code === form.responsible)?.desc}
                          </p>
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">외부몰 URL *</label>
                          <input value={form.externalUrl ?? ''} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
                            placeholder="https://"
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] placeholder:text-slate-300 focus:outline-none focus:border-slate-400" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">할인 코드</label>
                          <div className="flex gap-2">
                            <input value={form.benefitCode ?? ''} onChange={(e) => setForm({ ...form, benefitCode: e.target.value })}
                              placeholder="예: FANCODE10"
                              className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-[13px] font-bold tracking-wider placeholder:font-normal placeholder:text-slate-300 focus:outline-none focus:border-slate-400" />
                            <button onClick={copyCode}
                              className="h-10 px-3 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:border-slate-400 inline-flex items-center gap-1">
                              {copied ? <><Check className="w-3.5 h-3.5" /> 복사됨</> : <><Copy className="w-3.5 h-3.5" /> 복사</>}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">혜택 문구</label>
                          <input value={form.benefitLabel ?? ''} onChange={(e) => setForm({ ...form, benefitLabel: e.target.value })}
                            placeholder="예: 팬 전용 10% 할인"
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] placeholder:text-slate-300 focus:outline-none focus:border-slate-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">판매자명 *</label>
                            <input value={form.sellerName ?? ''} onChange={(e) => setForm({ ...form, sellerName: e.target.value })}
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
                          </div>
                          <div>
                            <label className="block text-[12px] font-semibold text-slate-500 mb-1.5">판매자 문의</label>
                            <input value={form.sellerContact ?? ''} onChange={(e) => setForm({ ...form, sellerContact: e.target.value })}
                              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
                          </div>
                        </div>
                      </div>

                      {/* 추적 · 성과 */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-[12px] font-bold text-slate-500 mb-2">추적 설정 (자동 생성)</p>
                          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2 text-[12px]">
                            {[
                              { l: 'utm_source', v: detail.tracking.utmSource },
                              { l: 'utm_medium', v: detail.tracking.utmMedium },
                              { l: 'utm_campaign', v: detail.tracking.utmCampaign },
                              { l: 'click_id 파라미터', v: detail.tracking.clickIdParam },
                            ].map((r) => (
                              <div key={r.l} className="flex items-center justify-between">
                                <span className="text-slate-500">{r.l}</span>
                                <span className="font-mono font-semibold text-slate-700">{r.v}</span>
                              </div>
                            ))}
                            {detail.tracking.sample && (
                              <p className="pt-2 mt-2 border-t border-slate-200 font-mono text-[12.5px] text-slate-500 break-all">
                                {detail.tracking.sample}
                              </p>
                            )}
                          </div>
                          <p className="text-[12px] text-slate-500 mt-1.5">
                            팬이 이동할 때마다 익명 click_id가 새로 발급됩니다. 관리자가 직접 만들지 않습니다.
                          </p>
                        </div>

                        <div>
                          <p className="text-[12px] font-bold text-slate-500 mb-2">성과 지표 ({detail.performance.window})</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { l: '클릭 수', v: nf(detail.performance.clicks) },
                              { l: '구매확정', v: nf(detail.performance.confirmed) },
                              { l: '전환율', v: detail.performance.conversionRate === null ? '집계 중' : `${detail.performance.conversionRate}%` },
                            ].map((r) => (
                              <div key={r.l} className="rounded-xl bg-slate-50 px-3 py-3 text-center">
                                <p className="text-[17px] font-extrabold text-slate-900 tabular-nums">{r.v}</p>
                                <p className="text-[12.5px] text-slate-500 mt-1">{r.l}</p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                            <span className="text-[12px] text-slate-500">포스트백 상태</span>
                            <span className="text-[12px] font-semibold text-slate-700">
                              {detail.performance.postbackStatus}
                              {detail.performance.lastPostbackAt && ` · ${fmtDate(detail.performance.lastPostbackAt, true)}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 책임 고지 — 게시 전 동의 필수 */}
                    <div className="mx-5 mb-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                      <p className="text-[12px] font-bold text-slate-600 mb-2">안내 및 책임 고지</p>
                      <ul className="space-y-1 mb-3">
                        {detail.disclosure.map((d: string, i: number) => (
                          <li key={i} className="text-[12px] text-slate-500 leading-relaxed pl-3 relative">
                            <span className="absolute left-0 top-[7px] w-1 h-1 rounded-full bg-slate-300" />{d}
                          </li>
                        ))}
                      </ul>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                          className="w-4 h-4 rounded accent-emerald-600" />
                        <span className="text-[12px] font-semibold text-slate-700">위 내용을 확인했으며, 설정에 동의합니다.</span>
                      </label>
                    </div>
                  </Panel>

                  {/* 연동 상품 */}
                  <Panel title={`연동 상품 ${detail.products.length}개`}
                    right={
                      <span className="text-[12px] text-slate-500 inline-flex items-center gap-1">
                        <Plus className="w-3 h-3" /> 상품 등록은 다음 단계에서 연결됩니다
                      </span>
                    }>
                    {detail.products.length ? (
                      <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {detail.products.map((p: any) => (
                          <div key={p.id} className="rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="aspect-[4/3] bg-slate-100">
                              {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />}
                            </div>
                            <div className="p-3">
                              <p className="text-[13px] font-bold text-slate-800 line-clamp-1">{p.name}</p>
                              <p className="text-[13px] font-extrabold text-slate-900 tabular-nums mt-1">{nf(p.price)}원</p>
                              <div className="flex items-center gap-1 mt-1.5">
                                {p.isSponsored && <StatusTag label="광고" />}
                                {p.pointRate && <StatusTag label={`${Math.round(p.pointRate * 100)}% 적립`} tone="emerald" />}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty title="연동된 상품이 없습니다" desc="상품이 없어도 스토어 단위 외부몰 이동은 동작합니다." />
                    )}
                  </Panel>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </FanAdminShell>
  );
}
