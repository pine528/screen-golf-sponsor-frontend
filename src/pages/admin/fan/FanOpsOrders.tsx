/**
 * A10 주문 · 환불 · 정산 (핸드오프 v1.0 §8.2 · §8.4 · §18.2)
 * 외부몰 전환은 SPONPIK 주문이 아니다. 화면에서 내부 주문과 분리해서 보여준다.
 */
import { useCallback, useEffect, useState } from 'react';
import { Info, Copy, Check } from 'lucide-react';
import { api } from '../../../services/api';
import FanAdminShell, {
  KpiCard, Panel, StatusTag, Empty, Loading, useAdminGuard, nf, fmtDate,
} from '../../../components/fanadmin/FanAdminShell';

const TABS = [
  { key: 'EXTERNAL', label: '외부몰 전환', badge: '주문 아님' },
  { key: 'INTERNAL', label: 'SPON Pay 주문' },
  { key: 'SETTLE', label: '정산 현황' },
];

export default function FanOpsOrders() {
  const guard = useAdminGuard();
  const [tab, setTab] = useState('EXTERNAL');
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.getFanAdminOrders({ from, to })
      .then((r) => setData(r.data))
      .catch((e) => guard(e, '/admin/fan/orders'))
      .finally(() => setLoading(false));
  }, [from, to]);
  useEffect(() => { load(); }, [load]);

  const copy = (t: string) => {
    navigator.clipboard?.writeText(t);
    setCopied(t);
    setTimeout(() => setCopied(null), 1500);
  };

  const ext = data?.externalExits;

  return (
    <FanAdminShell title="주문 · 환불 · 정산" desc="팬스토어 전환과 정산 현황을 확인합니다."
      breadcrumb={['팬 운영', '주문·정산']}
      actions={
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
          <span className="text-slate-300">~</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-slate-400" />
        </div>
      }>
      {loading && !data ? <Loading /> : !data ? <Empty title="주문 현황을 불러오지 못했습니다" /> : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="외부몰 이동" value={ext.total} unit="건" sub="선택 기간 기준" />
            <KpiCard label="구매확정 회신" value={ext.confirmed} unit="건" sub="브랜드 postback 기준" />
            <KpiCard label="전환율" value={ext.conversionRate} unit="%" sub={ext.total > 0 ? '이동 대비 확정' : '이동 기록 없음'} />
            <KpiCard label="확정 매출" value={ext.revenue} unit="원" sub="브랜드 회신 합계" />
          </div>

          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`h-9 px-4 rounded-xl text-[13px] font-semibold border transition inline-flex items-center gap-1.5 ${
                  tab === t.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}>
                {t.label}
                {t.badge && (
                  <span className={`text-[12.5px] font-bold px-1.5 py-0.5 rounded ${
                    tab === t.key ? 'bg-white/20' : 'bg-amber-100 text-amber-700'
                  }`}>{t.badge}</span>
                )}
              </button>
            ))}
          </div>

          {tab === 'INTERNAL' && (
            <Panel title="SPON Pay 주문">
              <div className="px-5 py-4 border-b border-slate-100 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                <p className="text-[13px] text-slate-600">{data.internalOrders.notice}</p>
              </div>
              <Empty title="내부 결제 주문이 없습니다"
                desc={'SPON Pay는 2차 단계에서 도입 예정입니다.\n지금은 외부몰 연결형으로만 운영됩니다.'} />
            </Panel>
          )}

          {tab === 'EXTERNAL' && (
            <Panel title="외부몰 전환 내역"
              right={<StatusTag label="SPONPIK 주문 아님" tone="amber" />}>
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-start gap-2.5 bg-amber-50/40">
                <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[12px] text-amber-800 leading-relaxed">{ext.notice}</p>
              </div>
              {ext.items.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-[12px] text-slate-500 border-b border-slate-100">
                        <th className="text-left font-semibold px-5 py-2.5">CLICK ID</th>
                        <th className="text-left font-semibold py-2.5">스토어 / 상품</th>
                        <th className="text-left font-semibold py-2.5">팬</th>
                        <th className="text-left font-semibold py-2.5">회신</th>
                        <th className="text-right font-semibold py-2.5">추정 매출</th>
                        <th className="text-right font-semibold py-2.5">적립 예정</th>
                        <th className="text-left font-semibold px-5 py-2.5">이동 시각</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ext.items.map((i: any) => (
                        <tr key={i.clickId} className="border-b border-slate-50 last:border-0">
                          <td className="px-5 py-3">
                            <button onClick={() => copy(i.clickId)}
                              className="font-mono text-[12px] text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
                              {i.clickId.slice(0, 16)}
                              {copied === i.clickId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-300" />}
                            </button>
                          </td>
                          <td className="py-3">
                            <p className="font-semibold text-slate-800 truncate max-w-[220px]">
                              {i.product?.name ?? i.store?.title}
                            </p>
                            <p className="text-[12px] text-slate-500">{i.store?.brandName}</p>
                          </td>
                          <td className="py-3 text-slate-500 font-mono text-[12px]">{i.userId ?? '비로그인'}</td>
                          <td className="py-3">
                            <StatusTag label={i.confirmed ? '구매확정' : '대기'} tone={i.confirmed ? 'emerald' : 'slate'} />
                          </td>
                          <td className="py-3 text-right tabular-nums text-slate-700">
                            {i.amount === null || i.amount === undefined ? '—' : `${nf(i.amount)}원`}
                          </td>
                          <td className="py-3 text-right tabular-nums text-emerald-600 font-semibold">
                            {i.estimatedPoints === null ? '—' : `${nf(i.estimatedPoints)}P`}
                          </td>
                          <td className="px-5 py-3 text-slate-500 tabular-nums text-[12px]">{fmtDate(i.createdAt, true)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty title="선택 기간의 이동 기록이 없습니다" />
              )}
            </Panel>
          )}

          {tab === 'SETTLE' && (
            <Panel title="스토어별 전환 현황"
              right={<span className="text-[12px] text-slate-500">정산 금액은 브랜드 회신 데이터가 있어야 산출됩니다</span>}>
              {data.byStore.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-[12px] text-slate-500 border-b border-slate-100">
                        <th className="text-left font-semibold px-5 py-2.5">스토어</th>
                        <th className="text-left font-semibold py-2.5">브랜드 / 선수</th>
                        <th className="text-right font-semibold py-2.5">이동</th>
                        <th className="text-right font-semibold py-2.5">확정</th>
                        <th className="text-right font-semibold py-2.5">전환율</th>
                        <th className="text-right font-semibold px-5 py-2.5">확정 매출</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byStore.map((s: any) => (
                        <tr key={s.storeId} className="border-b border-slate-50 last:border-0">
                          <td className="px-5 py-3 font-semibold text-slate-800 max-w-[240px] truncate">{s.title}</td>
                          <td className="py-3 text-slate-500">
                            {s.brandName}{s.athlete ? ` · ${s.athlete}` : ''}
                          </td>
                          <td className="py-3 text-right tabular-nums">{nf(s.clicks)}</td>
                          <td className="py-3 text-right tabular-nums">{nf(s.confirmed)}</td>
                          <td className="py-3 text-right tabular-nums font-semibold">
                            {s.conversionRate === null ? '집계 중' : `${s.conversionRate}%`}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums font-extrabold text-slate-900">
                            {s.amount > 0 ? `${nf(s.amount)}원` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty title="집계할 전환 데이터가 없습니다"
                  desc="브랜드가 구매확정을 회신하면 매출과 정산 금액이 채워집니다." />
              )}
            </Panel>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-[12px] font-bold text-slate-600 mb-2">CS 담당 구분 (§8.4)</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { s: '외부몰 주문 문의', who: '브랜드', sla: '브랜드 정책' },
                { s: '코드 미적용', who: 'SPONPIK 1차', sla: '1영업일' },
                { s: '배송 지연', who: '판매자', sla: '정책 고지' },
                { s: '성과 데이터 오류', who: 'SPONPIK', sla: 'D+1 배치' },
              ].map((r) => (
                <div key={r.s} className="rounded-xl bg-slate-50 px-3.5 py-3">
                  <p className="text-[12px] font-bold text-slate-700">{r.s}</p>
                  <p className="text-[12px] text-slate-500 mt-1">{r.who} · {r.sla}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </FanAdminShell>
  );
}
