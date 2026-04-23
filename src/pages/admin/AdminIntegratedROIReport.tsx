/**
 * REP-01: 통합 ROI 리포트
 *
 * Refs: wireframe_spec.docx > REP-01
 * - 노출 → 클릭 → 유입 → 장바구니 → 결제 → 구매 풀 퍼널 KPI
 * - 퍼널 차트
 * - 미디어 노출 + 매출 증명 통합
 * - PDF 다운로드 (브라우저 인쇄)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../../components/Layout';
import { GlobalFilter, GlobalFilterValue } from '../../components/funnel/GlobalFilter';
import { SummaryCard } from '../../components/funnel/SummaryCard';
import { FunnelChart, FunnelStep } from '../../components/funnel/FunnelChart';
import { TimeSeriesChart } from '../../components/funnel/TimeSeriesChart';
import { DataSourceBadge } from '../../components/funnel/DataSourceBadge';
import { api } from '../../services/api';
import { Eye, MousePointer, Users, ShoppingBag, CreditCard, ShoppingCart, BadgePercent, Printer } from 'lucide-react';

export default function AdminIntegratedROIReport() {
  const [filter, setFilter] = useState<GlobalFilterValue>({});
  const [campaignId, setCampaignId] = useState<string>('');

  const { data: campaignsResp } = useQuery({
    queryKey: ['admin-funnel-campaigns'],
    queryFn: () => api.listFunnelCampaigns(),
  });
  const campaigns = (campaignsResp?.data || []) as any[];

  const { data: reportResp, isLoading } = useQuery({
    queryKey: ['integrated-report', campaignId, filter],
    queryFn: () => api.getCampaignFunnelReport(campaignId, filter),
    enabled: !!campaignId,
  });
  const report = reportResp?.data;
  const summary = report?.summary || {};

  const funnelSteps: FunnelStep[] = [
    { name: '노출', value: report?.campaign?.actualImpressions || 0 },
    { name: '클릭', value: summary.linkClicks || 0 },
    { name: '유입', value: summary.landingViews || 0 },
    { name: '상품조회', value: summary.productViews || 0 },
    { name: '장바구니', value: summary.addToCarts || 0 },
    { name: '결제시작', value: summary.beginCheckouts || 0 },
    { name: '구매완료', value: summary.purchases || 0 },
  ];

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">통합 ROI 리포트</h1>
            <p className="text-sm text-slate-500 mt-1 inline-flex items-center gap-2">
              미디어 노출 지표와 매출 지표를 한 화면에서 연결한 통합 보고서 (REP-01)
              <DataSourceBadge type="measured" />
              <DataSourceBadge type="integrated" />
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> PDF 다운로드
          </button>
        </div>

        {/* 캠페인 선택 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">캠페인:</span>
          <select
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            className="flex-1 max-w-md text-sm border border-slate-200 rounded-lg px-3 py-1.5"
          >
            <option value="">선택해주세요</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.brand?.name})</option>
            ))}
          </select>
        </div>

        <GlobalFilter value={filter} onChange={setFilter} hideAthlete hideCampaign />

        {!campaignId ? (
          <div className="text-center py-16 text-sm text-slate-400 bg-slate-50 rounded-xl">캠페인을 선택해주세요</div>
        ) : isLoading ? (
          <div className="text-center py-12 text-sm text-slate-400">로딩 중...</div>
        ) : (
          <>
            {/* 상단 풀 퍼널 KPI */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2 mb-6">
              <SummaryCard label="노출" value={report?.campaign?.actualImpressions || 0} icon={Eye} />
              <SummaryCard label="도달" value={Math.round((report?.campaign?.actualImpressions || 0) * 0.6)} icon={Users} hint="추정" />
              <SummaryCard label="클릭" value={summary.linkClicks || 0} icon={MousePointer} />
              <SummaryCard label="유입" value={summary.landingViews || 0} icon={Users} variant="highlight" />
              <SummaryCard label="장바구니" value={summary.addToCarts || 0} icon={ShoppingBag} />
              <SummaryCard label="결제시작" value={summary.beginCheckouts || 0} icon={CreditCard} />
              <SummaryCard label="구매" value={summary.purchases || 0} icon={ShoppingCart} variant="highlight" />
              <SummaryCard label="순매출" value={summary.netRevenue || 0} format="currency" variant="highlight" />
              <SummaryCard label="ROAS" value={summary.roas?.toFixed(2) || '-'} icon={BadgePercent} />
            </div>

            {/* 퍼널 차트 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3">퍼널 시각화 (드롭오프 분석)</h3>
              <FunnelChart steps={funnelSteps} />
            </div>

            {/* 추이 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3">일자별 추이</h3>
              <TimeSeriesChart data={report?.timeseries || []} />
            </div>

            {/* 좌/우 요약 박스 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-emerald-700 mb-3">📺 미디어 노출 증빙</h3>
                <div className="space-y-2 text-sm text-slate-700">
                  <div>총 노출: <strong>{(report?.campaign?.actualImpressions || 0).toLocaleString()}</strong></div>
                  <div>총 클릭: <strong>{summary.linkClicks.toLocaleString()}</strong></div>
                  <div>CTR: <strong>{(summary.ctr * 100).toFixed(2)}%</strong></div>
                </div>
              </div>
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-sky-700 mb-3">💰 매출 증빙</h3>
                <div className="space-y-2 text-sm text-slate-700">
                  <div>주문 수: <strong>{summary.purchases.toLocaleString()}</strong></div>
                  <div>순매출: <strong>₩{Math.round(summary.netRevenue).toLocaleString()}</strong></div>
                  <div>ROAS: <strong>{summary.roas?.toFixed(2) || '-'}</strong></div>
                  <div>CAC: <strong>₩{Math.round(summary.cac || 0).toLocaleString()}</strong></div>
                </div>
              </div>
            </div>

            {/* 해석 코멘트 */}
            <div className="bg-slate-900 text-white rounded-xl p-6">
              <h3 className="text-sm font-bold text-emerald-400 mb-2">📊 결론 (자동 생성)</h3>
              <p className="text-sm leading-relaxed">
                {generateExecutiveSummary(report)}
              </p>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function generateExecutiveSummary(report: any): string {
  if (!report) return '';
  const s = report.summary || {};
  const c = report.campaign || {};
  const msgs: string[] = [];

  msgs.push(`이 캠페인은 ${(c.actualImpressions || 0).toLocaleString()}회의 미디어 노출을 발생시켰으며,`);
  msgs.push(`${s.purchases || 0}건의 구매로 이어져 ₩${Math.round(s.netRevenue || 0).toLocaleString()}의 순매출을 기록했습니다.`);
  if (s.roas) {
    if (s.roas >= 3) msgs.push(`ROAS ${s.roas.toFixed(2)}x로 매우 우수한 효율성을 보였습니다.`);
    else if (s.roas >= 1) msgs.push(`ROAS ${s.roas.toFixed(2)}x로 양호한 성과를 보였습니다.`);
    else msgs.push(`ROAS ${s.roas.toFixed(2)}x로 추가 최적화가 필요합니다.`);
  }
  return msgs.join(' ');
}
