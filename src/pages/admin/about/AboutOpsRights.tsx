/**
 * IA13 권리 · 만료 큐 (핸드오프 v1.0 §10.4 · §17.1)
 * 권리가 만료되면 신규 게시가 자동 차단된다. 감사 이력과 증빙은 삭제하지 않는다.
 */
import { useCallback, useEffect, useState } from 'react';
import {Search, RefreshCw, AlertTriangle, FileWarning, Lock, X} from 'lucide-react';
import { api } from '../../../services/api';
import AboutAdminShell, {
  KpiCard, Panel, Tag, Empty, Loading, useAdminGuard, nf, fmtDate,
} from '../../../components/aboutadmin/AboutAdminShell';

const ASSET_TYPES = [
  { code: 'ALL', label: '전체' }, { code: 'PORTRAIT', label: '초상' },
  { code: 'LOGO', label: '로고' }, { code: 'QUOTE', label: '인용문' },
  { code: 'PHOTO', label: '사진' }, { code: 'VIDEO', label: '영상' },
];
const STATUSES = [
  { code: 'ALL', label: '전체' }, { code: 'VALID', label: '유효' },
  { code: 'EXPIRING', label: '만료 임박' }, { code: 'EXPIRED', label: '만료' },
  { code: 'MISSING_EVIDENCE', label: '증빙 누락' }, { code: 'BLOCKED', label: '게시 차단' },
];

const STATUS_TONE: Record<string, 'emerald' | 'amber' | 'rose' | 'slate'> = {
  '유효': 'emerald', '30일 이내 만료': 'amber', '만료': 'rose',
  '증빙 누락': 'amber', '게시 차단됨': 'rose',
};

export default function AboutOpsRights() {
  const guard = useAdminGuard();
  const [assetType, setAssetType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.getRightsQueue({ assetType, status, q: q || undefined, page, limit: 20 })
      .then((r) => setData(r.data))
      .catch((e) => guard(e, '/admin/about/rights'))
      .finally(() => setLoading(false));
  }, [assetType, status, q, page]);
  useEffect(() => { load(); }, [load]);

  const sweep = async () => {
    setBusy(true);
    try {
      const r = await api.sweepRights();
      setMsg(`만료 ${r.data.expired}건 · 임박 ${r.data.expiring}건 갱신했습니다`);
      await load();
    } finally { setBusy(false); }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <AboutAdminShell title="권리 · 만료 큐" desc="초상권·상표권·인용 사용권의 유효기간과 증빙을 관리합니다."
      breadcrumb={['권리·감사', '권리 관리']}
      actions={
        <button disabled={busy} onClick={sweep}
          className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-600 hover:border-slate-400 inline-flex items-center gap-1.5 disabled:opacity-40">
          <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /> 만료 상태 갱신
        </button>
      }>
      {loading && !data ? <Loading /> : !data ? <Empty title="권리 큐를 불러오지 못했습니다" /> : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <p className="text-[13px] text-rose-800">{data.notice}</p>
          </div>

          {msg && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">{msg}</div>}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {data.kpis.map((k: any) => (
              <KpiCard key={k.key} label={k.label} value={k.value} unit="건"
                sub={k.percent === null ? '전체 대비 집계 중' : `전체 에셋의 ${k.percent}%`}
                tone={['expired', 'blocked'].includes(k.key) && k.value > 0 ? 'danger' : k.value > 0 ? 'warn' : 'default'} />
            ))}
          </div>

          {/* 필터 */}
          <Panel>
            <div className="p-4 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2">
                <span className="text-[12.5px] font-semibold text-slate-500">에셋 유형</span>
                <select value={assetType} onChange={(e) => { setAssetType(e.target.value); setPage(1); }}
                  className="h-9 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none">
                  {ASSET_TYPES.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2">
                <span className="text-[12.5px] font-semibold text-slate-500">상태</span>
                <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  className="h-9 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none">
                  {STATUSES.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
                </select>
              </label>
              <div className="relative ml-auto">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
                <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }}
                  placeholder="에셋명 검색"
                  className="h-9 w-56 pl-9 pr-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
              </div>
            </div>
          </Panel>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* 목록 */}
            <Panel className="lg:col-span-2" title={`전체 ${nf(data.total)}건`}>
              {data.rights.length ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="text-[12px] text-slate-500 border-b border-slate-100">
                          <th className="text-left font-semibold px-5 py-2.5">에셋</th>
                          <th className="text-left font-semibold py-2.5">권리 보유자</th>
                          <th className="text-left font-semibold py-2.5">허용 채널</th>
                          <th className="text-left font-semibold py-2.5">기간</th>
                          <th className="text-left font-semibold px-5 py-2.5">상태</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.rights.map((r: any) => (
                          <tr key={r.id} onClick={() => setSelected(r)}
                            className={`border-b border-slate-50 last:border-0 cursor-pointer transition ${
                              selected?.id === r.id ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
                            }`}>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                                  {r.thumbnailUrl && <img src={r.thumbnailUrl} alt="" className="w-full h-full object-cover" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-800 truncate max-w-[180px]">{r.assetName}</p>
                                  <p className="text-[12.5px] text-slate-500">{r.assetType}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-slate-600">{r.holderName}</td>
                            <td className="py-3 text-slate-500 text-[12px]">
                              {r.allowedScopes?.length ? r.allowedScopes.join(', ') : '—'}
                            </td>
                            <td className="py-3 tabular-nums text-[12px]">
                              <p className="text-slate-600">{fmtDate(r.validFrom)} ~ {fmtDate(r.validTo)}</p>
                              {r.remainDays !== null && (
                                <p className={`text-[12px] ${r.remainDays < 0 ? 'text-rose-500' : r.remainDays <= 30 ? 'text-amber-600' : 'text-slate-500'}`}>
                                  {r.remainDays < 0 ? `만료됨 (${Math.abs(r.remainDays)}일 경과)` : `D-${r.remainDays}`}
                                </p>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <Tag tone={STATUS_TONE[r.statusLabel] ?? 'slate'}>{r.statusLabel}</Tag>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                <Empty title="해당 조건의 권리가 없습니다" desc="에셋 사용권을 등록하면 이곳에서 만료를 관리합니다." />
              )}
            </Panel>

            {/* 상세 */}
            <Panel title="권리 상세"
              right={selected && (
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              )}>
              {!selected ? (
                <Empty title="에셋을 선택하세요" />
              ) : (
                <div className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                      {selected.thumbnailUrl && <img src={selected.thumbnailUrl} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-slate-900">{selected.assetName}</p>
                      <p className="text-[12.5px] text-slate-500 mt-0.5">{selected.assetType}</p>
                      <span className="mt-1.5 inline-block">
                        <Tag tone={STATUS_TONE[selected.statusLabel] ?? 'slate'}>{selected.statusLabel}</Tag>
                      </span>
                    </div>
                  </div>

                  {selected.remainDays !== null && (
                    <div className={`rounded-2xl px-4 py-3.5 text-center ${
                      selected.remainDays < 0 ? 'bg-rose-50' : selected.remainDays <= 30 ? 'bg-amber-50' : 'bg-slate-50'
                    }`}>
                      <p className="text-[12px] font-semibold text-slate-500">종료까지 남은 기간</p>
                      <p className={`text-[24px] font-extrabold tabular-nums ${
                        selected.remainDays < 0 ? 'text-rose-600' : selected.remainDays <= 30 ? 'text-amber-600' : 'text-slate-700'
                      }`}>
                        {selected.remainDays < 0 ? '만료' : `D-${selected.remainDays}`}
                      </p>
                      <p className="text-[12px] text-slate-500 mt-0.5 tabular-nums">{fmtDate(selected.validTo)} 까지</p>
                    </div>
                  )}

                  <dl className="space-y-2.5 text-[12.5px]">
                    {[
                      { l: '권리 보유자', v: `${selected.holderName} (${selected.holderType})` },
                      { l: '허용 채널', v: selected.allowedScopes?.join(', ') || '—' },
                      { l: '허용 지역', v: selected.allowedRegion ?? '—' },
                      { l: '사용 기간', v: `${fmtDate(selected.validFrom)} ~ ${fmtDate(selected.validTo)}` },
                      { l: '증빙 파일', v: selected.hasEvidence ? selected.evidenceName ?? '등록됨' : '없음' },
                      { l: '소유팀', v: selected.ownerTeam ?? '—' },
                    ].map((r) => (
                      <div key={r.l} className="flex items-start justify-between gap-3">
                        <dt className="text-slate-500 shrink-0">{r.l}</dt>
                        <dd className="font-semibold text-slate-700 text-right">{r.v}</dd>
                      </div>
                    ))}
                  </dl>

                  {!selected.hasEvidence && (
                    <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 flex items-start gap-2.5">
                      <FileWarning className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-[12px] text-amber-800 leading-relaxed">
                        증빙 파일이 없어 게시에 사용할 수 없습니다. 동의서를 등록해주세요.
                      </p>
                    </div>
                  )}

                  {Array.isArray(selected.usedIn) && selected.usedIn.length > 0 && (
                    <div>
                      <p className="text-[12px] font-bold text-slate-500 mb-2">
                        영향받는 게시 콘텐츠 ({selected.usedIn.length})
                      </p>
                      <div className="space-y-1.5">
                        {selected.usedIn.slice(0, 4).map((u: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                            <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="text-[12px] text-slate-600 truncate flex-1">{u.title ?? u.url}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}
    </AboutAdminShell>
  );
}
