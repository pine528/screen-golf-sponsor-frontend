import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, DollarSign, Receipt } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { api } from '../../services/api';
import { formatCurrency, cn } from '../../utils';

const statusConfig: Record<string, { label: string; class: string }> = {
  CREATED: { label: '생성됨', class: 'badge-info' },
  PENDING: { label: '대기중', class: 'badge-warning' },
  PAID: { label: '완료', class: 'badge-success' },
  FAILED: { label: '실패', class: 'badge-danger' },
  CANCELED: { label: '취소', class: 'badge-info' },
  REFUNDED: { label: '환불', class: 'badge-danger' },
};

const providerLabels: Record<string, string> = {
  TOSS: '토스',
  STRIPE: 'Stripe',
  MOCK: '테스트',
};

export default function AdminPayments() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: topupsData, isLoading } = useQuery({
    queryKey: ['adminTopups', { status: statusFilter, page }],
    queryFn: () => api.getAdminTopups({
      status: statusFilter || undefined,
      limit,
      offset: (page - 1) * limit
    }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['adminTopupStats'],
    queryFn: () => api.getAdminTopupStats(),
  });

  const topups = topupsData?.data?.items || [];
  const total = topupsData?.data?.total || 0;
  const totalPages = Math.ceil(total / limit);
  const stats = statsData?.data;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">결제 관리</h1>
          <p className="text-slate-600 mt-1">브랜드 지갑 충전 내역을 조회하세요</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">총 결제금액</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {formatCurrency(stats?.totalAmount || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">총 결제건수</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalCount || 0}건</p>
              </div>
              <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
                <Receipt className="w-6 h-6 text-sky-600" />
              </div>
            </div>
          </div>
          {stats?.byProvider?.slice(0, 2).map((p: any) => (
            <div key={p.provider} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">{providerLabels[p.provider] || p.provider}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {formatCurrency(p.amount || 0)}
                  </p>
                  <p className="text-xs text-slate-500">{p.count}건</p>
                </div>
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-violet-600" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex gap-4 items-center">
            <label className="text-sm text-slate-600">상태 필터:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="input w-auto"
            >
              <option value="">전체</option>
              <option value="PAID">완료</option>
              <option value="PENDING">대기중</option>
              <option value="CREATED">생성됨</option>
              <option value="FAILED">실패</option>
              <option value="CANCELED">취소</option>
              <option value="REFUNDED">환불</option>
            </select>
          </div>
        </div>

        {/* Topups Table */}
        <div className="card overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  충전 ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  브랜드
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  금액
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  결제수단
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  결제일시
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {topups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                        <CreditCard className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500">결제 내역이 없습니다</p>
                    </div>
                  </td>
                </tr>
              ) : (
                topups.map((topup: any) => (
                  <tr key={topup.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">
                      {topup.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-slate-900">
                        {topup.brandId ? topup.brandId.slice(0, 8) + '...' : '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(Number(topup.amount))}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {providerLabels[topup.provider] || topup.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn('badge', statusConfig[topup.status]?.class || 'badge-info')}>
                        {statusConfig[topup.status]?.label || topup.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {topup.paidAt
                        ? new Date(topup.paidAt).toLocaleString()
                        : new Date(topup.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                총 {total}건 중 {(page - 1) * limit + 1} -{' '}
                {Math.min(page * limit, total)}건
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary text-sm disabled:opacity-50"
                >
                  이전
                </button>
                <span className="px-3 py-2 text-sm text-slate-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn btn-secondary text-sm disabled:opacity-50"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
