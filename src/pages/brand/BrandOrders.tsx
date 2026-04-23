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
import { X, Receipt, Download, Search } from 'lucide-react';

export default function BrandOrders() {
  const [filter, setFilter] = useState<GlobalFilterValue>({});
  const [includeRefunded, setIncludeRefunded] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<'all' | 'new' | 'returning'>('all');

  const { data: meResp } = useQuery({
    queryKey: ['my-brand'],
    queryFn: async () => (await api.get('/brands/me')).data,
  });
  const brandId = (meResp as any)?.id;

  const { data: ordersResp, isLoading } = useQuery({
    queryKey: ['brand-funnel-orders', brandId, filter],
    queryFn: () => api.listBrandFunnelOrders(brandId!, { from: filter.from, to: filter.to }),
    enabled: !!brandId,
  });
  const orders: any[] = ordersResp?.data || [];

  const downloadCsv = () => {
    if (!brandId) return;
    const params = new URLSearchParams();
    if (filter.from) params.set('from', filter.from);
    if (filter.to) params.set('to', filter.to);
    const token = localStorage.getItem('accessToken');
    fetch(`${import.meta.env.VITE_API_URL || '/api'}/reports/brand/${brandId}/orders.csv?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (r) => {
      const blob = await r.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `orders-${brandId}-${Date.now()}.csv`;
      a.click();
    }).catch((e) => alert('다운로드 실패: ' + e.message));
  };

  const filtered = orders
    .filter((o) => includeRefunded || (o.status !== 'REFUNDED' && o.status !== 'CANCELLED'))
    .filter((o) => !statusFilter || o.status === statusFilter)
    .filter((o) => {
      if (customerFilter === 'all') return true;
      if (customerFilter === 'new') return o.isNewCustomer;
      return !o.isNewCustomer;
    })
    .filter((o) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (o.athlete?.name || '').toLowerCase().includes(q)
        || (o.promoCode || '').toLowerCase().includes(q)
        || (o.id || '').toLowerCase().includes(q);
    });

  const downloadXlsx = () => {
    // 간단한 XLSX 대체: CSV를 .xls 확장자로 저장 (Excel이 열어줌)
    if (!brandId) return;
    const params = new URLSearchParams();
    if (filter.from) params.set('from', filter.from);
    if (filter.to) params.set('to', filter.to);
    const token = localStorage.getItem('accessToken');
    fetch(`${import.meta.env.VITE_API_URL || '/api'}/reports/brand/${brandId}/orders.csv?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (r) => {
      const blob = await r.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `orders-${brandId}-${Date.now()}.xls`;
      a.click();
    });
  };

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

        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={includeRefunded} onChange={(e) => setIncludeRefunded(e.target.checked)} className="rounded" />
              환불/취소 포함
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="선수명/코드/주문번호 검색"
                className="pl-7 pr-2 py-1.5 text-sm border border-slate-200 rounded-lg w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden lg:inline">※ 개인정보 보호 — 주문자 실명/전화/주소는 표시되지 않습니다</span>
            <button onClick={downloadCsv} className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button onClick={downloadXlsx} className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg">
              <Download className="w-3.5 h-3.5" /> XLSX
            </button>
          </div>
        </div>

        {/* 추가 필터 행 */}
        <div className="flex items-center gap-2 flex-wrap mb-4 text-xs">
          <span className="text-slate-500 font-semibold">상태:</span>
          {['', 'PAID', 'REFUNDED', 'CANCELLED', 'PARTIAL_REFUND'].map((s) => (
            <button key={s || 'all'} onClick={() => setStatusFilter(s)} className={`px-2 py-1 rounded-full border ${statusFilter === s ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-600 border-slate-200'}`}>
              {s === '' ? '전체' : s === 'PAID' ? '결제완료' : s === 'REFUNDED' ? '환불' : s === 'CANCELLED' ? '취소' : '부분환불'}
            </button>
          ))}
          <span className="ml-3 text-slate-500 font-semibold">고객:</span>
          {(['all', 'new', 'returning'] as const).map((c) => (
            <button key={c} onClick={() => setCustomerFilter(c)} className={`px-2 py-1 rounded-full border ${customerFilter === c ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-600 border-slate-200'}`}>
              {c === 'all' ? '전체' : c === 'new' ? '신규' : '재구매'}
            </button>
          ))}
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
                {selectedOrder.refundedAt && (
                  <>
                    <Field label="환불 일시" value={new Date(selectedOrder.refundedAt).toLocaleString()} />
                    <Field label="환불 사유" value={
                      <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-xs font-semibold">
                        {selectedOrder.refundReason || '사유 미기재'}
                      </span>
                    } />
                  </>
                )}
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
