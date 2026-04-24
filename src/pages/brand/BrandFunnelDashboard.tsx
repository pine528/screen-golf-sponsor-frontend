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
import { FunnelChart, FunnelStep } from '../../components/funnel/FunnelChart';
import { DataSourceBadge } from '../../components/funnel/DataSourceBadge';
import { api } from '../../services/api';
import { Users, ShoppingCart, DollarSign, TrendingUp, BadgePercent, Target, Lightbulb, Smartphone, Globe, UserPlus, RotateCw, CreditCard } from 'lucide-react';

type Tab = 'overview' | 'predict' | 'segments';

export default function BrandFunnelDashboard() {
  const [filter, setFilter] = useState<GlobalFilterValue>({});
  const [tab, setTab] = useState<Tab>('overview');

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

  // Phase 3: 세그먼트 + 예측 (해당 탭 활성화 시에만 호출)
  const { data: segResp } = useQuery({
    queryKey: ['brand-segments', brandId, filter],
    queryFn: () => api.getBrandSegments(brandId!, filter),
    enabled: !!brandId && tab === 'segments',
  });
  const segments = segResp?.data;

  const firstActiveCampaign = report?.campaigns?.find((c: any) => c.status === 'ACTIVE');
  const { data: predictResp } = useQuery({
    queryKey: ['brand-predict', firstActiveCampaign?.id],
    queryFn: () => api.getCampaignPredict(firstActiveCampaign!.id),
    enabled: !!firstActiveCampaign && tab === 'predict',
  });
  const predict = predictResp?.data;

  // 전일 대비 증감 (어제 ~ 오늘)
  const { data: dailyDeltaResp } = useQuery({
    queryKey: ['brand-daily-delta', brandId],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const dayBefore = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
      const r = await api.get(`/reports/brand/${brandId}/period-compare`, {
        from: yesterday, to: today,
        prev_from: dayBefore, prev_to: yesterday,
      });
      return r;
    },
    enabled: !!brandId && tab === 'overview',
    staleTime: 5 * 60 * 1000,
  });
  const dailyDelta = dailyDeltaResp?.data?.delta || {};

  // 콘텐츠별 성과 (BRD-01 위젯)
  const { data: contentsResp } = useQuery({
    queryKey: ['brand-contents', brandId, filter],
    queryFn: async () => {
      const r = await api.get(`/reports/brand/${brandId}/segments`, { from: filter.from, to: filter.to });
      return r;
    },
    enabled: !!brandId && tab === 'overview',
  });
  const contents = (contentsResp?.data?.byReferrer || []) as any[];

  // 최근 주문 (BRD-01 하단)
  const { data: recentOrdersResp } = useQuery({
    queryKey: ['brand-recent-orders', brandId, filter],
    queryFn: () => api.listBrandFunnelOrders(brandId!, { from: filter.from, to: filter.to, limit: 5 }),
    enabled: !!brandId && tab === 'overview',
  });
  const recentOrders = recentOrdersResp?.data || [];

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

        <GlobalFilter
          value={filter}
          onChange={setFilter}
          campaigns={(report?.campaigns || []) as any[]}
          athletes={(report?.breakdown?.athletes || []).map((a: any) => ({ id: a.id, name: a.name }))}
        />
        {/* 채널/코드 필터 */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 mb-6 flex items-center gap-3 flex-wrap text-xs -mt-4">
          <span className="text-slate-500 font-semibold">채널:</span>
          {['all', 'instagram', 'youtube', 'naver', 'kakao', 'direct'].map((ch) => (
            <button key={ch} onClick={() => setFilter({ ...filter, channel: ch === 'all' ? undefined : ch })} className={`px-2 py-1 rounded-full border ${filter.channel === ch || (ch === 'all' && !filter.channel) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-600 border-slate-200'}`}>
              {ch === 'all' ? '전체' : ch}
            </button>
          ))}
          <span className="text-slate-500 font-semibold ml-3">코드:</span>
          <select
            value={filter.code || ''}
            onChange={(e) => setFilter({ ...filter, code: e.target.value || undefined })}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1"
          >
            <option value="">전체</option>
            {(report?.breakdown?.codes || []).map((c: any) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-4">
          <TabBtn active={tab === 'overview'} onClick={() => setTab('overview')}>📊 개요</TabBtn>
          <TabBtn active={tab === 'predict'} onClick={() => setTab('predict')}>🔮 예측 (Phase 3)</TabBtn>
          <TabBtn active={tab === 'segments'} onClick={() => setTab('segments')}>👥 세그먼트 (Phase 3)</TabBtn>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-sm text-slate-400">로딩 중...</div>
        ) : tab === 'predict' ? (
          <PredictPanel predict={predict} campaign={firstActiveCampaign} />
        ) : tab === 'segments' ? (
          <SegmentPanel segments={segments} />
        ) : (
          <>
            {/* KPI 카드 (체크아웃 완료율 추가 + 전일 대비 증감) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
              <SummaryCard label="유입수" value={summary.landingViews || 0} icon={Users} delta={dailyDelta.landingViews ?? undefined} hint="전일 대비" />
              <SummaryCard label="주문수" value={summary.purchases || 0} icon={ShoppingCart} variant="highlight" delta={dailyDelta.purchases ?? undefined} hint="전일 대비" />
              <SummaryCard label="순매출" value={summary.netRevenue || 0} format="currency" icon={DollarSign} variant="highlight" delta={dailyDelta.netRevenue ?? undefined} hint="전일 대비" />
              <SummaryCard label="CVR" value={summary.cvr || 0} format="percent" icon={TrendingUp} hint="유입→구매" delta={dailyDelta.cvr ?? undefined} />
              <SummaryCard label="체크아웃 완료율" value={summary.checkoutCompletion || 0} format="percent" icon={CreditCard} hint="결제시작→구매" />
              <SummaryCard label="CAC" value={summary.cac || 0} format="currency" icon={Target} hint="고객획득비용" />
              <SummaryCard label="ROAS" value={summary.roas?.toFixed(2) || '-'} icon={BadgePercent} hint="투자대비매출" />
            </div>

            {/* 풀 퍼널 차트 (handoff 7조: 노출→클릭→유입→장바구니→결제→구매→순매출) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">📊 매출 증명 퍼널</h3>
                <DataSourceBadge type="measured" />
              </div>
              <FunnelChart steps={[
                { name: '클릭', value: summary.linkClicks || 0 },
                { name: '유입', value: summary.landingViews || 0 },
                { name: '상품조회', value: summary.productViews || 0 },
                { name: '장바구니', value: summary.addToCarts || 0 },
                { name: '결제시작', value: summary.beginCheckouts || 0 },
                { name: '구매완료', value: summary.purchases || 0 },
              ] as FunnelStep[]} height={280} />
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

            {/* 콘텐츠별 성과 (referrer 기반) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 mt-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3">콘텐츠/유입 채널별 성과</h3>
              {contents.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">데이터가 없습니다</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {contents.map((c: any) => (
                    <div key={c.referrer} className="text-center bg-slate-50 rounded p-2">
                      <div className="text-[10px] text-slate-500 truncate">{c.referrer}</div>
                      <div className="text-sm font-bold text-emerald-600">{c.visits}</div>
                      <div className="text-[9px] text-slate-400">방문</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 최근 주문/특이사항 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 mt-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3">최근 주문 / 특이사항</h3>
              {recentOrders.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">최근 주문이 없습니다</div>
              ) : (
                <div className="space-y-2">
                  {recentOrders.slice(0, 5).map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{new Date(o.paidAt).toLocaleString().slice(5)}</span>
                        <span className="font-semibold">{o.athlete?.name || o.athleteId.slice(0, 8)}</span>
                        {o.promoCode && <code className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">{o.promoCode}</code>}
                        {o.status === 'REFUNDED' && <span className="text-[10px] text-rose-600 font-bold">환불</span>}
                      </div>
                      <span className="font-bold">₩{Math.round(Number(o.netAmount)).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function TabBtn({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
        active ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

function PredictPanel({ predict, campaign }: { predict: any; campaign: any }) {
  if (!campaign) {
    return <div className="text-center py-12 text-sm text-slate-400 bg-slate-50 rounded-xl">활성 캠페인이 없습니다</div>;
  }
  if (!predict) {
    return <div className="text-center py-12 text-sm text-slate-400">예측 계산 중...</div>;
  }
  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm">
        <span className="font-bold text-emerald-700">📌 대상 캠페인:</span> {campaign.name} · 잔여 {predict.daysRemaining}일 · 신뢰도 <strong>{predict.confidence}</strong> ({predict.basisDays}일 데이터, 방법: {predict.method?.toUpperCase()})
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="예상 순매출 (캠페인 종료까지)" value={predict.predictedNetRevenue || 0} format="currency" icon={DollarSign} variant="highlight" />
        <SummaryCard label="예상 주문 수" value={predict.predictedPurchases || 0} icon={ShoppingCart} />
        <SummaryCard label="예상 신규 고객" value={predict.predictedNewCustomers || 0} icon={UserPlus} />
        <SummaryCard label="예상 ROAS" value={predict.predictedRoas?.toFixed(2) || '-'} icon={BadgePercent} variant="highlight" />
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-bold mb-2 inline-flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" /> 해석</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          최근 {predict.basisDays}일 데이터 기준 {predict.method === 'sma' ? '단순 이동평균' : '지수평활'}으로 캠페인 종료일까지 예측한 수치입니다.
          신뢰도가 <strong>{predict.confidence}</strong>이므로 {predict.confidence === 'low' ? '추가 데이터 누적 후 재평가가 필요합니다.' : predict.confidence === 'medium' ? '참고 지표로 활용하세요.' : '의사결정에 활용하기에 충분한 신뢰성을 가집니다.'}
        </p>
      </div>
    </div>
  );
}

function SegmentPanel({ segments }: { segments: any }) {
  if (!segments) return <div className="text-center py-12 text-sm text-slate-400">세그먼트 데이터 로딩 중...</div>;
  const { newReturning = { new: { count: 0, revenue: 0 }, returning: { count: 0, revenue: 0 } }, byDevice = [], byReferrer = [] } = segments;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-bold mb-3 inline-flex items-center gap-2"><UserPlus className="w-4 h-4 text-emerald-500" /> 신규 vs 재구매</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-lg p-3">
              <div className="text-xs text-emerald-700 font-bold mb-1">신규 고객</div>
              <div className="text-2xl font-extrabold">{newReturning.new.count}</div>
              <div className="text-xs text-slate-500">₩{Math.round(newReturning.new.revenue).toLocaleString()}</div>
            </div>
            <div className="bg-sky-50 rounded-lg p-3">
              <div className="text-xs text-sky-700 font-bold mb-1 inline-flex items-center gap-1"><RotateCw className="w-3 h-3" /> 재구매</div>
              <div className="text-2xl font-extrabold">{newReturning.returning.count}</div>
              <div className="text-xs text-slate-500">₩{Math.round(newReturning.returning.revenue).toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-bold mb-3 inline-flex items-center gap-2"><Smartphone className="w-4 h-4 text-emerald-500" /> 디바이스별</h3>
          <div className="space-y-2">
            {byDevice.length === 0 && <div className="text-xs text-slate-400">데이터 없음</div>}
            {byDevice.map((d: any) => (
              <div key={d.device} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
                <span className="text-sm capitalize">{d.device}</span>
                <span className="text-sm font-bold">{d.count}건</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-bold mb-3 inline-flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-500" /> 유입 경로 TOP 10</h3>
        <div className="space-y-2">
          {byReferrer.length === 0 && <div className="text-xs text-slate-400">데이터 없음</div>}
          {byReferrer.map((r: any, i: number) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
              <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">{r.referrer}</code>
              <span className="text-sm font-bold">{r.visits} 방문</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
