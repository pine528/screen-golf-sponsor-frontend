/**
 * A08 판매 · 전환 · 재고 대시보드 (핸드오프 v1.0 §11.4, 시안 img_14)
 *
 * 집계되지 않은 단계는 비율을 만들지 않고 '집계 중'으로 둔다 (LEG-06).
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bookmark, ChevronRight, CreditCard,
  Eye, Loader2, RotateCcw, Search, ShoppingBag, Wallet,
} from 'lucide-react';
import { api } from '../../../services/api';

const TABS = [
  { key: 'OFFER', label: '상품별' },
  { key: 'ATHLETE', label: '선수별' },
  { key: 'CHANNEL', label: '채널별' },
];

export default function AdminOfferDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('OFFER');
  const [from, setFrom] = useState(new Date(Date.now() - 21 * 86400_000).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r: any = await api.getOfferDashboard({ from, to });
      setData(r?.data || null);
    } catch (e: any) {
      if ([401, 403].includes(e?.response?.status)) navigate('/login?returnUrl=/admin/offers/dashboard');
    } finally { setLoading(false); }
  }, [from, to, navigate]);
  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="min-h-screen bg-slate-900 py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" /></div>;
  }

  const k = data?.kpis ?? {};
  const maxRevenue = Math.max(1, ...(data?.daily || []).map((d: any) => d.revenue));

  const KPIS = [
    { icon: Eye, label: '노출', value: k.impression, fmt: (v: number) => v.toLocaleString() },
    { icon: Search, label: '상세조회', value: k.detail, fmt: (v: number) => v.toLocaleString() },
    { icon: Bookmark, label: '보관 (찜)', value: k.save, fmt: (v: number) => v.toLocaleString() },
    { icon: CreditCard, label: '결제진입', value: k.checkout, fmt: (v: number) => v.toLocaleString() },
    { icon: ShoppingBag, label: '구매', value: k.purchase, fmt: (v: number) => v.toLocaleString() },
    { icon: Wallet, label: '매출', value: k.revenue, fmt: (v: number) => `${v.toLocaleString()}원`, accent: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-[1600px] mx-auto px-5 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/admin/offers" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" /> 상품 목록
          </Link>
          <h1 className="text-[22px] font-black">판매 · 전환 · 재고 대시보드</h1>
          <div className="ml-auto flex items-center gap-2">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-[12.5px]" />
            <span className="text-slate-400">~</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-[12.5px]" />
            <button onClick={load} aria-label="새로고침"
              className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-800">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* KPI */}
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {KPIS.map((x) => (
            <div key={x.label} className={`rounded-2xl bg-white border p-4 ${x.accent ? 'border-emerald-300' : 'border-slate-200'}`}>
              <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <x.icon className="w-3.5 h-3.5" /> {x.label}
              </p>
              <p className={`mt-1.5 text-[22px] font-black leading-tight ${x.accent ? 'text-emerald-600' : ''}`}>
                {x.value != null ? x.fmt(x.value) : '집계 중'}
              </p>
              {x.value === 0 && <p className="text-[10.5px] text-slate-400">아직 집계된 값이 없습니다</p>}
            </div>
          ))}
        </div>

        <div className="mt-4 grid lg:grid-cols-2 gap-4">
          {/* 전환 퍼널 */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h2 className="text-[14px] font-extrabold">전환 퍼널</h2>
            <ul className="mt-4 space-y-2.5">
              {(data?.funnel || []).map((f: any, i: number) => {
                const width = Math.max(12, 100 - i * 16);
                return (
                  <li key={f.key} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10.5px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="text-[12.5px] font-bold w-[72px] shrink-0">{f.label}</span>
                    <span className="flex-1 h-7 rounded-lg bg-slate-100 overflow-hidden">
                      <span className="block h-full bg-gradient-to-r from-indigo-500 to-indigo-400" style={{ width: `${width}%` }} />
                    </span>
                    <span className="text-[12.5px] font-black tabular-nums w-16 text-right shrink-0">{f.value.toLocaleString()}</span>
                    <span className="text-[12px] font-bold text-indigo-600 tabular-nums w-14 text-right shrink-0">
                      {f.rate == null ? '집계 중' : `${f.rate}%`}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-[11px] text-slate-400 break-keep">
              비율은 직전 단계 대비입니다. 상위 단계가 집계되지 않으면 비율을 계산하지 않습니다.
            </p>
          </div>

          {/* 일별 매출 */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h2 className="text-[14px] font-extrabold">일별 매출 추이</h2>
            <div className="mt-4 h-[200px] flex items-end gap-1">
              {(data?.daily || []).map((d: any) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <span
                    className="w-full rounded-t bg-indigo-400 group-hover:bg-indigo-600 transition-colors"
                    style={{ height: `${Math.max(2, (d.revenue / maxRevenue) * 170)}px` }}
                  />
                  <span className="absolute -top-6 hidden group-hover:block px-1.5 py-0.5 rounded bg-slate-900 text-white text-[10px] whitespace-nowrap">
                    {d.revenue.toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
              <span>{data?.daily?.[0]?.date?.slice(5)}</span>
              <span>{data?.daily?.[data.daily.length - 1]?.date?.slice(5)}</span>
            </div>
          </div>
        </div>

        {/* 비율 지표 */}
        <div className="mt-4 rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex gap-1 border-b border-slate-100">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-[13px] font-bold border-b-2 ${
                  tab === t.key ? 'border-indigo-500 text-indigo-700' : 'border-transparent text-slate-400'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {[
              { label: '찜→구매 전환율', v: data?.rates?.saveToBuy },
              { label: '상세조회→구매 전환율', v: data?.rates?.detailToBuy },
              { label: '결제진입→구매 전환율', v: data?.rates?.checkoutToBuy },
              { label: '취소율', v: data?.rates?.cancelRate },
              { label: '재고 임박 상품 비율', v: data?.rates?.lowStockRatio },
            ].map((r) => (
              <div key={r.label} className="rounded-xl border border-slate-200 p-4">
                <p className="text-[11.5px] text-slate-500 break-keep">{r.label}</p>
                <p className="mt-1 text-[19px] font-black">{r.v == null ? <span className="text-[13px] text-slate-400">집계 중</span> : `${r.v}%`}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-x-auto">
            {tab === 'OFFER' && (
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-left">
                    {['순위', '상품명', '노출', '상세조회', '보관(찜)', '구매', '매출(원)', '찜→구매'].map((h) => (
                      <th key={h} className="px-3 py-2.5 font-bold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.byOffer || []).slice(0, 10).map((o: any, i: number) => (
                    <tr key={o.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2.5 font-black text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2.5">
                        <Link to={`/admin/offers/${o.id}`} className="font-bold hover:text-emerald-700 break-keep">{o.title}</Link>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">{o.view.toLocaleString()}</td>
                      <td className="px-3 py-2.5 tabular-nums">{o.detail.toLocaleString()}</td>
                      <td className="px-3 py-2.5 tabular-nums">{o.save.toLocaleString()}</td>
                      <td className="px-3 py-2.5 tabular-nums font-bold">{o.sold.toLocaleString()}</td>
                      <td className="px-3 py-2.5 tabular-nums font-bold">{o.revenue.toLocaleString()}</td>
                      <td className="px-3 py-2.5 tabular-nums text-indigo-600 font-bold">{o.saveToBuy ?? '—'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'ATHLETE' && (
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-left">
                    {['선수', '등록 상품', '판매', '매출(원)'].map((h) => (
                      <th key={h} className="px-3 py-2.5 font-bold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.byAthlete || []).map((a: any) => (
                    <tr key={a.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 shrink-0">
                            {a.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                          </span>
                          <span className="font-bold">{a.name}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">{a.offers}</td>
                      <td className="px-3 py-2.5 tabular-nums font-bold">{a.sold}</td>
                      <td className="px-3 py-2.5 tabular-nums font-bold">{a.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'CHANNEL' && (
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-left">
                    <th className="px-3 py-2.5 font-bold">노출 채널</th>
                    <th className="px-3 py-2.5 font-bold">판매 건수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.byChannel || []).map((c: any) => (
                    <tr key={c.channel} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2.5 font-bold">{c.channel}</td>
                      <td className="px-3 py-2.5 tabular-nums">{c.sold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 상위 상품 + 알림 */}
        <div className="mt-4 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h2 className="text-[14px] font-extrabold">성과 상위 상품 TOP 3</h2>
            <ul className="mt-4 space-y-2">
              {(data?.topOffers || []).map((o: any, i: number) => (
                <li key={o.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-[12px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                    {o.heroImageUrl && <img src={o.heroImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <Link to={`/admin/offers/${o.id}`} className="block text-[13px] font-extrabold hover:text-emerald-700 break-keep">{o.title}</Link>
                    <span className="block text-[11px] text-slate-400">노출 {o.view.toLocaleString()} · 상세 {o.detail.toLocaleString()} · 구매 {o.sold}</span>
                  </span>
                  <span className="text-[14px] font-black tabular-nums shrink-0">{o.revenue.toLocaleString()}원</span>
                </li>
              ))}
              {!data?.topOffers?.length && <p className="py-8 text-center text-[12.5px] text-slate-400">아직 판매 실적이 없습니다</p>}
            </ul>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-extrabold">재고 · 만료 · 운영 알림</h2>
              <Link to="/admin/offers" className="text-[12px] font-bold text-slate-500 inline-flex items-center gap-1">
                전체 보기 <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <ul className="mt-4 space-y-2">
              {(data?.alerts || []).map((a: any, i: number) => (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${
                    a.severity === 'ERROR' ? 'bg-rose-100 text-rose-700' : a.severity === 'WARN' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
                  }`}>
                    {a.badge}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-bold break-keep">{a.title}</span>
                    <span className="block text-[11px] text-slate-500 break-keep">{a.detail || a.message}</span>
                  </span>
                  {a.action && (
                    <Link to={a.action.to} aria-label={a.action.label} className="text-slate-300 hover:text-slate-700 shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </li>
              ))}
              {!data?.alerts?.length && <p className="py-8 text-center text-[12.5px] text-slate-400">처리할 알림이 없습니다</p>}
            </ul>
          </div>
        </div>

        <p className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            지표 설명 · 찜→구매 전환율: 보관(찜) 대비 구매 수 비율 | 취소율: 주문 대비 취소 수 비율
          </span>
          <span>데이터 기준: {new Date().toLocaleString('ko-KR')}</span>
        </p>
      </div>
    </div>
  );
}
