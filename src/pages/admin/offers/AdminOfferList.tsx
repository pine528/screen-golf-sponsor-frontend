/**
 * A01 상품 목록 · 필터 · 운영경보 (핸드오프 v1.0 §11.1~§11.3, 시안 img_00)
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Clock, Copy, Eye, Loader2, MoreVertical, Package, Pause,
  Pencil, Play, Plus, RotateCcw, Search, ShoppingBag,
} from 'lucide-react';
import { api } from '../../../services/api';
import { OFFER_STATUS, PRICE_TYPE_LABEL } from '../../../components/offer/OfferCard';

const QUICK = [
  { key: '', label: '전체' },
  { key: 'CLOSING', label: '곧 만료' },
  { key: 'LOW_STOCK', label: '품절 임박' },
  { key: 'NEEDS_REVIEW', label: '승인 만료' },
  { key: 'STALE', label: '데이터 stale' },
  { key: 'MARGIN', label: '마진 이상' },
  { key: 'CONFLICT', label: '재고 충돌' },
];

const ALERT_TONE: Record<string, string> = {
  ERROR: 'border-rose-200 bg-rose-50/60',
  WARN: 'border-amber-200 bg-amber-50/60',
  INFO: 'border-sky-200 bg-sky-50/60',
};
const BADGE_TONE: Record<string, string> = {
  ERROR: 'bg-rose-100 text-rose-700',
  WARN: 'bg-amber-100 text-amber-700',
  INFO: 'bg-sky-100 text-sky-700',
};

export default function AdminOfferList() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [menu, setMenu] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('ALL');
  const [priceType, setPriceType] = useState('ALL');
  const [quick, setQuick] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [l, a]: any[] = await Promise.all([
        api.listAdminOffers({ q: q.trim() || undefined, status, priceType, quick: quick || undefined, page, limit: 10 }),
        api.getOfferAlerts(),
      ]);
      setData(l?.data || null);
      setAlerts(a?.data || null);
    } catch (e: any) {
      if ([401, 403].includes(e?.response?.status)) navigate('/login?returnUrl=/admin/offers');
    } finally { setLoading(false); }
  }, [q, status, priceType, quick, page, navigate]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const act = async (id: string, fn: () => Promise<any>) => {
    setBusy(id);
    setMenu(null);
    try { await fn(); await load(); } finally { setBusy(null); }
  };

  const stats = data?.stats;
  const rows = data?.offers ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 10)));

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-[1600px] mx-auto px-5 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-[12px] font-bold text-slate-500">ADMIN SCREEN A01 · 상품 목록 · 필터 · 운영경보</p>
            <h1 className="mt-1 text-[26px] font-black tracking-tight">
              지금 가능한 <span className="text-emerald-600">후원 상품관리</span>
            </h1>
          </div>
          <Link
            to="/admin/offers/new"
            className="ml-auto h-12 px-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" /> 새 상품 만들기
          </Link>
        </div>

        <div className="mt-5 grid xl:grid-cols-[minmax(0,1fr)_minmax(0,330px)] gap-5 items-start">
          <div>
            {/* KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: ShoppingBag, label: '판매중', value: stats?.published ?? 0, sub: '활성 상품', cls: 'bg-emerald-50 text-emerald-600' },
                { icon: Clock, label: '승인대기', value: stats?.pendingApproval ?? 0, sub: '승인 필요', cls: 'bg-amber-50 text-amber-600' },
                { icon: AlertTriangle, label: '마감임박', value: stats?.closingSoon ?? 0, sub: '7일 이내 마감', cls: 'bg-orange-50 text-orange-600' },
                { icon: Package, label: '재고충돌', value: stats?.stockConflict ?? 0, sub: '슬롯 중복', cls: 'bg-rose-50 text-rose-600' },
              ].map((k) => (
                <div key={k.label} className="rounded-2xl bg-white border border-slate-200 p-5 flex items-center gap-4">
                  <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${k.cls}`}>
                    <k.icon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12px] text-slate-500">{k.label}</p>
                    <p className="text-[26px] font-black leading-tight">{k.value}</p>
                    <p className="text-[12px] text-slate-500">{k.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 필터 */}
            <div className="mt-4 rounded-2xl bg-white border border-slate-200 p-4">
              <div className="grid lg:grid-cols-[minmax(0,1fr)_150px_150px_auto] gap-2.5">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-300" />
                  <input
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setPage(1); }}
                    placeholder="상품ID, 상품명, 선수명 검색"
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-[13.5px] focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  aria-label="상태" className="h-11 px-3 rounded-xl border border-slate-200 text-[13px] font-bold">
                  <option value="ALL">상태 전체</option>
                  {['DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'PAUSED', 'ARCHIVED'].map((s) => (
                    <option key={s} value={s}>{OFFER_STATUS[s]?.label ?? s}</option>
                  ))}
                </select>
                <select value={priceType} onChange={(e) => { setPriceType(e.target.value); setPage(1); }}
                  aria-label="구매방식" className="h-11 px-3 rounded-xl border border-slate-200 text-[13px] font-bold">
                  <option value="ALL">구매방식 전체</option>
                  {Object.entries(PRICE_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <button
                  onClick={() => { setQ(''); setStatus('ALL'); setPriceType('ALL'); setQuick(''); setPage(1); }}
                  className="h-11 px-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-500 hover:bg-slate-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> 필터 초기화
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {QUICK.map((k) => (
                  <button
                    key={k.key || 'all'}
                    onClick={() => { setQuick(k.key); setPage(1); }}
                    className={`h-8 px-3 rounded-lg text-[12px] font-bold transition-colors ${
                      quick === k.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 테이블 */}
            <div className="mt-4 rounded-2xl bg-white border border-slate-200 overflow-hidden">
              {loading ? (
                <div className="py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
              ) : rows.length === 0 ? (
                <div className="py-20 text-center">
                  <Package className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="mt-3 text-[14px] font-bold text-slate-600">조건에 맞는 상품이 없습니다</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12.5px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-left">
                        {['상품ID', '상품명', '선수', '구매방식', '가격', '재고', '노출기간', '상태', '담당자', '작업'].map((h) => (
                          <th key={h} className="px-4 py-3 font-bold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((o: any) => {
                        const st = OFFER_STATUS[o.displayStatus] || OFFER_STATUS.DRAFT;
                        const low = o.availableQty != null && o.capacity > 0 && o.availableQty / o.capacity <= 0.34;
                        return (
                          <tr key={o.id} className="hover:bg-slate-50/60">
                            <td className="px-4 py-3 font-mono text-[12.5px] text-slate-500 whitespace-nowrap">{o.code}</td>
                            <td className="px-4 py-3">
                              <Link to={`/admin/offers/${o.id}`} className="font-bold hover:text-emerald-700 break-keep">{o.title}</Link>
                              {o.stale && <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[12.5px] font-bold">stale</span>}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 shrink-0">
                                  {o.athletes[0]?.profileImageUrl && <img src={o.athletes[0].profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                                </span>
                                <span>
                                  <span className="block font-bold">{o.athletes[0]?.name ?? '—'}</span>
                                  <span className="block text-[12.5px] text-slate-500">{o.athletes[0]?.tour ?? ''}</span>
                                </span>
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">{PRICE_TYPE_LABEL[o.priceType] || o.priceType}</td>
                            <td className="px-4 py-3 font-bold whitespace-nowrap">
                              {o.priceType === 'NEGOTIABLE' ? '협의'
                                : o.priceType === 'SUBSCRIPTION' ? `월 ${o.monthlyAmount.toLocaleString()}원`
                                : `${o.supplyAmount.toLocaleString()}원`}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {o.stockMode === 'UNLIMITED' ? <span className="text-slate-500">—</span> : (
                                <span className={low ? 'font-black text-rose-600' : 'font-bold text-emerald-600'}>
                                  {o.availableQty} <span className="text-slate-500 font-normal">/ {o.capacity}</span>
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                              {o.salesFrom ? new Date(o.salesFrom).toLocaleDateString('ko-KR') : '—'}
                              <br />~ {o.salesTo ? new Date(o.salesTo).toLocaleDateString('ko-KR') : '—'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-md text-[12px] font-bold ${st.cls}`}>{st.label}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{o.ownerName ?? '—'}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 relative">
                                <Link to={`/sponsor/available/${o.id}`} target="_blank" aria-label="미리보기"
                                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-600">
                                  <Eye className="w-3.5 h-3.5" />
                                </Link>
                                <Link to={`/admin/offers/${o.id}`} aria-label="수정"
                                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-600">
                                  <Pencil className="w-3.5 h-3.5" />
                                </Link>
                                <button onClick={() => setMenu(menu === o.id ? null : o.id)} aria-label="더보기" disabled={busy === o.id}
                                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700">
                                  {busy === o.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MoreVertical className="w-3.5 h-3.5" />}
                                </button>
                                {menu === o.id && (
                                  <div className="absolute right-0 top-9 z-20 w-40 rounded-xl border border-slate-200 bg-white shadow-lg py-1">
                                    <button onClick={() => act(o.id, () => api.duplicateAdminOffer(o.id))}
                                      className="w-full px-3 py-2 text-left text-[12.5px] font-bold hover:bg-slate-50 inline-flex items-center gap-2">
                                      <Copy className="w-3.5 h-3.5" /> 복제
                                    </button>
                                    {o.status === 'PAUSED' ? (
                                      <button onClick={() => act(o.id, () => api.setAdminOfferStatus(o.id, 'PUBLISHED'))}
                                        className="w-full px-3 py-2 text-left text-[12.5px] font-bold hover:bg-slate-50 inline-flex items-center gap-2">
                                        <Play className="w-3.5 h-3.5" /> 판매 재개
                                      </button>
                                    ) : (
                                      <button onClick={() => act(o.id, () => api.setAdminOfferStatus(o.id, 'PAUSED', '운영 사유'))}
                                        className="w-full px-3 py-2 text-left text-[12.5px] font-bold hover:bg-slate-50 inline-flex items-center gap-2">
                                        <Pause className="w-3.5 h-3.5" /> 일시중지
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <p className="text-[12.5px] text-slate-500">전체 {data?.total ?? 0}건</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                    className="w-8 h-8 rounded-lg border border-slate-200 text-[12px] disabled:opacity-40">‹</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((n) => (
                    <button key={n} onClick={() => setPage(n)}
                      className={`w-8 h-8 rounded-lg text-[12.5px] font-bold ${n === page ? 'bg-emerald-600 text-white' : 'border border-slate-200 text-slate-600'}`}>
                      {n}
                    </button>
                  ))}
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                    className="w-8 h-8 rounded-lg border border-slate-200 text-[12px] disabled:opacity-40">›</button>
                </div>
              </div>
            </div>
          </div>

          {/* 운영 경보 */}
          <aside className="xl:sticky xl:top-6">
            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h2 className="text-[15px] font-extrabold">운영 경보</h2>
                {alerts?.counts?.total > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[12px] font-black">{alerts.counts.total}</span>
                )}
              </div>

              {!alerts?.alerts?.length ? (
                <p className="py-10 text-center text-[12.5px] text-slate-500">처리할 경보가 없습니다</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {alerts.alerts.slice(0, 6).map((a: any, i: number) => (
                    <li key={i} className={`rounded-xl border p-4 ${ALERT_TONE[a.severity]}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-extrabold break-keep">{a.title}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[12.5px] font-black shrink-0 ${BADGE_TONE[a.severity]}`}>{a.badge}</span>
                      </div>
                      <p className="mt-1.5 text-[12px] text-slate-600 break-keep">{a.message}</p>
                      {a.detail && <p className="mt-1 text-[12.5px] text-slate-500 break-keep">{a.detail}</p>}
                      {a.period && (
                        <p className="mt-1 text-[12px] text-slate-500">
                          충돌 기간 {new Date(a.period.from).toLocaleDateString('ko-KR')} ~ {new Date(a.period.to).toLocaleDateString('ko-KR')}
                        </p>
                      )}
                      {a.action && (
                        <Link to={a.action.to} className="mt-2.5 w-full h-9 inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 text-[12px] font-bold hover:bg-slate-50">
                          {a.action.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[12px] text-slate-500">
                최근 업데이트 {new Date().toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                <button onClick={load} aria-label="새로고침" className="text-slate-500 hover:text-slate-700">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </p>
            </div>

            <div className="mt-4 rounded-2xl bg-white border border-slate-200 p-5">
              <h2 className="text-[14px] font-extrabold">바로가기</h2>
              <div className="mt-3 space-y-2">
                {[
                  { to: '/admin/offers/placements', label: '진열 배치관리' },
                  { to: '/admin/offers/dashboard', label: '판매 · 전환 · 재고 대시보드' },
                ].map((l) => (
                  <Link key={l.to} to={l.to} className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3 text-[13px] font-bold hover:bg-slate-50">
                    {l.label} <span className="text-slate-300">›</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
