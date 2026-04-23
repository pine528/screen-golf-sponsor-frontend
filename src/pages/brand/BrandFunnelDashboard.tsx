/**
 * BRD-01: 브랜드 성과 대시보드
 *
 * Refs: wireframe_spec.docx > BRD-01
 * - KPI: 유입수/주문수/순매출/CVR/CAC/ROAS
 * - 추이 차트
 * - 선수별 TOP / 코드별 성과
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../../components/Layout';
import { GlobalFilter, GlobalFilterValue } from '../../components/funnel/GlobalFilter';
import { SummaryCard } from '../../components/funnel/SummaryCard';
import { TimeSeriesChart } from '../../components/funnel/TimeSeriesChart';
import { DataSourceBadge } from '../../components/funnel/DataSourceBadge';
import { api } from '../../services/api';
import { Users, ShoppingCart, DollarSign, TrendingUp, BadgePercent, Target } from 'lucide-react';

export default function BrandFunnelDashboard() {
  const [filter, setFilter] = useState<GlobalFilterValue>({});

  // 브랜드 ID 조회
  const { data: meResp } = useQuery({
    queryKey: ['my-brand'],
    queryFn: async () => {
      const r = await api.get('/brands/me');
      return r.data;
    },
  });
  const brandId = (meResp as any)?.id;

  const { data: reportResp, isLoading } = useQuery({
    queryKey: ['brand-funnel-report', brandId, filter],
    queryFn: () => api.getBrandFunnelReport(brandId!, { from: filter.from, to: filter.to, include_breakdown: true }),
    enabled: !!brandId,
  });
  const report = reportResp?.data;
  const summary = report?.summary || {};

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">성과 대시보드</h1>
          <p className="text-sm text-slate-500 mt-1 inline-flex items-center gap-2">
            매출 증명 — 선수 후원으로 발생한 유입·주문·매출을 한눈에 확인하세요
            <DataSourceBadge type="measured" />
          </p>
        </div>

        <GlobalFilter value={filter} onChange={setFilter} hideAthlete hideCampaign campaigns={report?.campaigns || []} />

        {isLoading ? (
          <div className="text-center py-12 text-sm text-slate-400">로딩 중...</div>
        ) : (
          <>
            {/* KPI 카드 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <SummaryCard label="유입수" value={summary.landingViews || 0} icon={Users} />
              <SummaryCard label="주문수" value={summary.purchases || 0} icon={ShoppingCart} variant="highlight" />
              <SummaryCard label="순매출" value={summary.netRevenue || 0} format="currency" icon={DollarSign} variant="highlight" />
              <SummaryCard label="CVR" value={summary.cvr || 0} format="percent" icon={TrendingUp} hint="유입→구매" />
              <SummaryCard label="CAC" value={summary.cac || 0} format="currency" icon={Target} hint="고객획득비용" />
              <SummaryCard label="ROAS" value={summary.roas?.toFixed(2) || '-'} icon={BadgePercent} hint="투자대비매출" />
            </div>

            {/* 추이 차트 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">일자별 추이 (유입 / 주문 / 순매출)</h3>
              <TimeSeriesChart data={report?.timeseries || []} />
            </div>

            {/* 선수별 TOP / 코드별 성과 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">선수별 성과 TOP</h3>
                <div className="space-y-2">
                  {(report?.breakdown?.athletes || []).slice(0, 10).map((a: any, i: number) => (
                    <div key={a.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-b-0">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">{i + 1}</span>
                      {a.profileImageUrl ? (
                        <img src={a.profileImageUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">{a.name.charAt(0)}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{a.name}</div>
                        <div className="text-[10px] text-slate-400">{a.tour}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">₩{Math.round(a.netRevenue).toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500">주문 {a.purchases}건</div>
                      </div>
                    </div>
                  ))}
                  {(report?.breakdown?.athletes || []).length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400">데이터가 없습니다</div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">코드별 성과</h3>
                <div className="space-y-2">
                  {(report?.breakdown?.codes || []).slice(0, 10).map((c: any) => (
                    <div key={c.code} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-b-0">
                      <code className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded">{c.code}</code>
                      <div className="flex-1" />
                      <div className="text-right">
                        <div className="text-sm font-bold">₩{Math.round(c.netRevenue).toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500">사용 {c.purchases}건</div>
                      </div>
                    </div>
                  ))}
                  {(report?.breakdown?.codes || []).length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400">데이터가 없습니다</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
