/**
 * BRD-03: 주문·매출 상세 내역
 *
 * Refs: wireframe_spec.docx > BRD-03
 * - 주문 테이블 (개인정보 비노출, 주문번호/금액/귀속 근거)
 * - 우측 슬라이드 패널 (주문 상세)
 * - 환불 포함/제외 토글, 검색
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../../components/Layout';
import { GlobalFilter, GlobalFilterValue } from '../../components/funnel/GlobalFilter';
import { DetailTable, Column } from '../../components/funnel/DetailTable';
import { StatusBadge } from '../../components/funnel/StatusBadge';
import { api } from '../../services/api';
import { X, Receipt } from 'lucide-react';

export default function BrandOrders() {
  const [filter, setFilter] = useState<GlobalFilterValue>({});
  const [includeRefunded, setIncludeRefunded] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const { data: meResp } = useQuery({
    queryKey: ['my-brand'],
    queryFn: async () => (await api.get('/brands/me')).data,
  });
  const brandId = (meResp as any)?.id;

  const { data: reportResp, isLoading } = useQuery({
    queryKey: ['brand-funnel-report-orders', brandId, filter],
    queryFn: () => api.getBrandFunnelReport(brandId!, { from: filter.from, to: filter.to, include_breakdown: false }),
    enabled: !!brandId,
  });

  // 주문 목록은 funnel-report에서 별도 조회
  // 백엔드 endpoint가 없으므로 클라이언트에서 임시 표시
  const orders: any[] = (reportResp as any)?.data?.orders || [];

  const filtered = includeRefunded ? orders : orders.filter((o) => o.status !== 'REFUNDED' && o.status !== 'CANCELLED');

  const columns: Column<any>[] = [
    { key: 'paidAt', label: '주문일시', sortable: true, render: (r) => new Date(r.paidAt).toLocaleString() },
    { key: 'id', label: '주문번호', render: (r) => <code className="text-[10px]">{r.id?.slice(0, 8)}...</code> },
    { key: 'athlete', label: '선수', render: (r) => r.athlete?.name || '-' },
    { key: 'promoCode', label: '코드', render: (r) => r.promoCode ? <code className="text-xs bg-emerald-50 px-1.5 py-0.5 rounded">{r.promoCode}</code> : <span className="text-slate-400">-</span> },
    { key: 'netAmount', label: '순매출', sortable: true, align: 'right', render: (r) => `₩${Math.round(Number(r.netAmount)).toLocaleString()}` },
    { key: 'attributionReason', label: '귀속', render: (r) => (
      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{r.attributionReason || 'manual'}</span>
    ) },
    { key: 'status', label: '상태', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 inline-flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-500" />
            주문·매출 상세 내역
          </h1>
          <p className="text-sm text-slate-500 mt-1">주문번호 단위로 성과 근거를 열람하여 매출 증빙 신뢰도를 확인합니다 (BRD-03)</p>
        </div>

        <GlobalFilter value={filter} onChange={setFilter} hideAthlete hideCampaign />

        <div className="flex items-center justify-between mb-4">
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={includeRefunded} onChange={(e) => setIncludeRefunded(e.target.checked)} className="rounded" />
            환불/취소 포함
          </label>
          <span className="text-xs text-slate-500">
            ※ 개인정보 보호 — 주문자 실명/전화/주소는 표시되지 않습니다
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={selectedOrder ? 'lg:col-span-2' : 'lg:col-span-3'}>
            {isLoading ? (
              <div className="text-center py-12 text-sm text-slate-400">로딩 중...</div>
            ) : (
              <DetailTable
                data={filtered}
                columns={columns}
                pageSize={20}
                emptyMessage="주문이 없습니다"
                onRowClick={(r) => setSelectedOrder(r)}
              />
            )}
          </div>

          {selectedOrder && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">주문 상세</h3>
                <button onClick={() => setSelectedOrder(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <Field label="주문번호" value={<code className="text-xs">{selectedOrder.id}</code>} />
                <Field label="외부 주문번호" value={selectedOrder.externalOrderId || '-'} />
                <Field label="주문일시" value={new Date(selectedOrder.paidAt).toLocaleString()} />
                <Field label="총 결제액" value={`₩${Math.round(Number(selectedOrder.grossAmount)).toLocaleString()}`} />
                <Field label="할인" value={`₩${Math.round(Number(selectedOrder.discountAmount)).toLocaleString()}`} />
                <Field label="순매출" value={`₩${Math.round(Number(selectedOrder.netAmount)).toLocaleString()}`} />
                <Field label="환불 금액" value={`₩${Math.round(Number(selectedOrder.refundedAmount)).toLocaleString()}`} />
                <Field label="신규 고객" value={selectedOrder.isNewCustomer ? '예' : '아니오'} />
                <Field label="귀속 근거" value={
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-semibold">{selectedOrder.attributionReason}</span>
                } />
                <Field label="상태" value={<StatusBadge status={selectedOrder.status} />} />
                {selectedOrder.items && (
                  <div>
                    <div className="text-xs font-semibold text-slate-600 mb-1">상품</div>
                    <div className="space-y-1">
                      {selectedOrder.items.map((it: any, i: number) => (
                        <div key={i} className="text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded">
                          {it.product_id} × {it.qty}개 (₩{Number(it.unit_price).toLocaleString()})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function Field({ label, value }: any) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
