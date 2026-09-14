/**
 * 브랜드 ROI 대시보드 — UI/UX 통합 가이드 v1.0 §15 · 통합 핸드오프 v2.1 §14
 *
 *  - 성과 4축: Media(패치 노출) · Social(게시·도달) · Fan(관심·VOTE·팬온도 변화) · Commerce(클릭·구매·매출)
 *  - Expected(계약 시 예상 범위)와 Actual(집행 후 실측)을 같은 필드·색으로 섞지 않는다.
 *  - 측정되지 않은 축은 0이 아니라 "집계 중"으로 두고, 측정 불가 사유를 적는다 (LEG-06).
 *  - 팬 데이터는 집계·추세만 (개인 팬 데이터 없음).
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { api } from '../../services/api';
import {
  ArrowUpRight, BarChart3, CheckCircle, Eye, FileText, Filter, Heart, Info, Loader2,
  Share2, ShoppingCart, Timer, TrendingUp, Video,
} from 'lucide-react';

const fmtDuration = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0초';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
};
const won = (n: number) => `${Math.round(n).toLocaleString()}원`;
const Pending = ({ why }: { why?: string }) => (
  <span className="text-[13px] font-semibold text-slate-500" title={why}>집계 중</span>
);

function last30() {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 86400_000);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default function BrandROIDashboard() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const range = useMemo(last30, []);

  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['my-campaigns'],
    queryFn: () => api.get('/campaigns/my'),
  });
  const { data: me } = useQuery({ queryKey: ['brand-me'], queryFn: () => api.get('/brands/me'), retry: 0 });
  const brandId: string | undefined = (me as any)?.data?.id;

  /* Media — AI 로고 검출 노출 (캠페인 단위) */
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['campaign-roi-dashboard', selectedCampaignId],
    queryFn: () => api.get(`/roi/campaigns/${selectedCampaignId}/dashboard`),
    enabled: !!selectedCampaignId,
  });
  const { data: exposureStatsData } = useQuery({
    queryKey: ['campaign-exposure-stats', selectedCampaignId],
    queryFn: () => api.get(`/roi/campaigns/${selectedCampaignId}/exposures`, { limit: 10, isValid: true }),
    enabled: !!selectedCampaignId,
  });

  /* Commerce — 브랜드 퍼널 (최근 30일, 브랜드 단위) */
  const { data: funnelData } = useQuery({
    queryKey: ['brand-funnel-30d', brandId, range.from],
    queryFn: () => api.getBrandFunnelReport(brandId!, { from: range.from, to: range.to }),
    enabled: !!brandId,
    retry: 0,
  });

  const campaigns: any[] = campaignsData?.data || [];
  const campaign = campaigns.find((c) => c.id === selectedCampaignId);
  const dashboard = dashboardData?.data;
  const exposures: any[] = exposureStatsData?.data?.items || [];
  const funnel: any = (funnelData as any)?.data?.summary || null;

  /* 계약 시 예상 범위 — 캠페인 스냅샷에 있을 때만 (없으면 "기록 없음") */
  const expected: any = campaign?.expectedPerformance || campaign?.snapshot?.expectedPerformance || null;
  const expectedOf = (metric: string) => {
    const m = (expected?.metrics || []).find((x: any) => String(x.metric).includes(metric));
    if (!m) return null;
    const f = (n: number) => (n >= 10000 ? `${Math.round(n / 10000).toLocaleString()}만` : n.toLocaleString());
    return m.minValue != null && m.maxValue != null ? `${f(m.minValue)}~${f(m.maxValue)}` : f(m.maxValue ?? m.minValue ?? 0);
  };

  const hasMedia = !!dashboard && (dashboard.totalExposures ?? 0) > 0;

  const axes = [
    {
      key: 'media', icon: Eye, tone: 'bg-emerald-50 text-emerald-600', title: 'Media',
      sub: '패치 노출 시간 · 방송 횟수',
      rows: [
        { k: '유효 노출', v: dashboard ? `${(dashboard.validExposures || 0).toLocaleString()}회` : null },
        { k: '노출 시간', v: dashboard ? fmtDuration(dashboard.totalDuration || 0) : null },
      ],
      why: selectedCampaignId ? 'AI 로고 검출 결과가 검수를 통과하면 집계됩니다' : '캠페인을 선택하면 표시됩니다',
      to: selectedCampaignId ? `/brand/campaigns/${selectedCampaignId}/evidence` : undefined, toLabel: '노출 근거',
    },
    {
      key: 'social', icon: Share2, tone: 'bg-violet-50 text-violet-600', title: 'Social',
      sub: '게시 · 도달 · 조회 · 반응',
      rows: [
        { k: '게시 콘텐츠', v: null },
        { k: '도달 · 반응', v: null },
      ],
      why: '선수 SNS 게시 이행 확인 후 집계됩니다. 아직 연결된 측정 소스가 없습니다',
      to: selectedCampaignId ? `/brand/campaigns/${selectedCampaignId}` : undefined, toLabel: '콘텐츠 현황',
    },
    {
      key: 'fan', icon: Heart, tone: 'bg-rose-50 text-rose-500', title: 'Fan',
      sub: '관심 · VOTE · 팬온도 변화 (집계만)',
      rows: [
        { k: '팬 관심 변화', v: null },
        { k: '브랜드 추천', v: null },
      ],
      why: '후원 선수의 팬 활동 집계는 캠페인 실행 기간 기준으로 계산됩니다. 개인 팬 데이터는 제공하지 않습니다',
      to: '/fan', toLabel: '팬 참여',
    },
    {
      key: 'commerce', icon: ShoppingCart, tone: 'bg-sky-50 text-sky-600', title: 'Commerce',
      sub: `링크 클릭 · 구매 · 매출 (최근 30일)`,
      rows: [
        { k: '링크 클릭', v: funnel?.linkClicks != null ? `${Number(funnel.linkClicks).toLocaleString()}회` : null },
        { k: '구매 · 매출', v: funnel?.purchases != null ? `${Number(funnel.purchases).toLocaleString()}건 · ${won(Number(funnel.netRevenue || 0))}` : null },
      ],
      why: '브랜드 픽셀·할인코드·QR이 연결돼야 집계됩니다',
      to: '/brand/funnel/dashboard', toLabel: '퍼널 상세',
    },
  ];

  if (campaignsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-[-0.02em]">성과 리포트</h1>
              <p className="text-[14px] text-slate-600">Media · Social · Fan · Commerce 4축으로 실제 성과만 보여드립니다. 예상치는 따로 표시합니다.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-500" />
            <select value={selectedCampaignId} onChange={(e) => setSelectedCampaignId(e.target.value)} className="input w-72">
              <option value="">캠페인 선택 (Media · Social)</option>
              {campaigns.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {selectedCampaignId && (
              <Link to={`/brand/campaigns/${selectedCampaignId}/reports`} className="btn btn-secondary flex items-center gap-2">
                <FileText className="w-4 h-4" /> 리포트
              </Link>
            )}
          </div>
        </div>

        {/* 1. 4축 요약 — 실측만 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {axes.map((a) => {
            const I = a.icon;
            return (
              <section key={a.key} className="card p-5 flex flex-col">
                <div className="flex items-center gap-2.5">
                  <span className={`w-9 h-9 rounded-xl inline-flex items-center justify-center ${a.tone}`}><I className="w-[18px] h-[18px]" /></span>
                  <div>
                    <h2 className="text-[15px] font-extrabold text-slate-900">{a.title}</h2>
                    <p className="text-[12px] text-slate-500">{a.sub}</p>
                  </div>
                </div>
                <dl className="mt-4 space-y-2 flex-1">
                  {a.rows.map((r) => (
                    <div key={r.k} className="flex items-baseline justify-between gap-2">
                      <dt className="text-[13px] text-slate-500">{r.k}</dt>
                      <dd className="text-[15px] font-extrabold text-slate-900 tabular-nums text-right">
                        {r.v ?? <Pending why={a.why} />}
                      </dd>
                    </div>
                  ))}
                </dl>
                {a.rows.every((r) => r.v == null) && (
                  <p className="mt-2 text-[12px] text-slate-500 break-keep">{a.why}</p>
                )}
                {a.to && (
                  <Link to={a.to} className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-emerald-700 hover:text-emerald-800">
                    {a.toLabel} <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </section>
            );
          })}
        </div>

        {/* 2. Expected vs Actual — 분리 표시 */}
        <section className="card overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-start gap-3">
            <div className="min-w-0">
              <h2 className="text-[16px] font-extrabold text-slate-900">예상 범위 대비 실제</h2>
              <p className="mt-0.5 text-[13px] text-slate-600 break-keep">
                예상은 구매 판단을 돕는 범위이고, 실제는 집행 후 측정한 값입니다. 둘을 같은 숫자로 섞지 않습니다.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left p-4 text-[13px] font-bold text-slate-600">축</th>
                  <th className="text-right p-4 text-[13px] font-bold text-slate-600">계약 시 예상 범위</th>
                  <th className="text-right p-4 text-[13px] font-bold text-slate-600">실제 (측정)</th>
                  <th className="text-left p-4 text-[13px] font-bold text-slate-600">비고</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { k: 'Media 노출', exp: expectedOf('노출'), act: hasMedia ? `${(dashboard.validExposures || 0).toLocaleString()}회 · ${fmtDuration(dashboard.totalDuration || 0)}` : null, note: hasMedia ? '검수 승인된 노출만 집계' : (selectedCampaignId ? '승인된 노출 없음' : '캠페인 미선택') },
                  { k: 'Social 도달', exp: expectedOf('도달'), act: null, note: '측정 소스 연결 전' },
                  { k: 'Fan 반응', exp: expectedOf('팬'), act: null, note: '캠페인 기간 집계 전' },
                  { k: 'Commerce 구매', exp: expectedOf('구매'), act: funnel?.purchases != null ? `${Number(funnel.purchases).toLocaleString()}건 · ${won(Number(funnel.netRevenue || 0))}` : null, note: funnel ? '최근 30일 · 브랜드 전체' : '픽셀·코드 연결 전' },
                ].map((r) => (
                  <tr key={r.k}>
                    <td className="p-4 text-[13.5px] font-bold text-slate-800">{r.k}</td>
                    <td className="p-4 text-right text-[13.5px] tabular-nums">
                      {r.exp ?? <span className="text-slate-500">기록 없음</span>}
                    </td>
                    <td className="p-4 text-right text-[13.5px] font-extrabold tabular-nums text-slate-900">
                      {r.act ?? <Pending />}
                    </td>
                    <td className="p-4 text-[12.5px] text-slate-500">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!expected && (
            <p className="px-5 py-3 text-[12.5px] text-slate-500 flex items-start gap-1.5 border-t border-slate-100 break-keep">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              선택한 캠페인의 계약 스냅샷에 예상 범위가 없습니다. 추천 PICK · 지금 가능한 후원으로 계약한 캠페인은 기준일·신뢰도와 함께 예상 범위가 기록됩니다.
            </p>
          )}
        </section>

        {/* 3. Media 상세 */}
        {!selectedCampaignId ? (
          <div className="card p-10 text-center">
            <Video className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-[16px] font-bold text-slate-900 mb-1">Media · Social 상세는 캠페인을 선택하면 보입니다</h3>
            <p className="text-[13.5px] text-slate-500">Commerce는 브랜드 전체 기준으로 위에 표시됩니다.</p>
          </div>
        ) : dashboardLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h2 className="text-[16px] font-extrabold text-slate-900 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Media · 슬롯별 노출</h2>
                {dashboard?.slotStats && Object.keys(dashboard.slotStats).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(dashboard.slotStats).map(([slot, stats]: [string, any]) => {
                      const maxCount = Math.max(...Object.values(dashboard.slotStats).map((s: any) => s.count));
                      const pct = maxCount > 0 ? Math.round((stats.count / maxCount) * 100) : 0;
                      return (
                        <div key={slot}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[13.5px] font-semibold text-slate-700">{slot === 'UNKNOWN' ? '미분류' : slot}</span>
                            <span className="text-[13px] text-slate-500 tabular-nums">{stats.count}회 · {fmtDuration(stats.duration)}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500"><BarChart3 className="w-10 h-10 mx-auto mb-2 text-slate-300" /><p className="text-[13.5px]">승인된 노출이 아직 없습니다</p></div>
                )}
              </div>

              <div className="card p-6">
                <h2 className="text-[16px] font-extrabold text-slate-900 mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> 검수 현황</h2>
                {dashboard?.reviewStatus ? (
                  <div className="space-y-3">
                    {[
                      { k: '검토 대기', v: dashboard.reviewStatus.pending || 0, cls: 'bg-amber-50 text-amber-700' },
                      { k: '승인됨', v: dashboard.reviewStatus.approved || 0, cls: 'bg-emerald-50 text-emerald-700' },
                      { k: '거부됨', v: dashboard.reviewStatus.rejected || 0, cls: 'bg-rose-50 text-rose-700' },
                    ].map((r) => (
                      <div key={r.k} className={`flex items-center justify-between p-3 rounded-lg ${r.cls}`}>
                        <span className="text-[13.5px] font-semibold">{r.k}</span>
                        <span className="text-[18px] font-extrabold tabular-nums">{r.v}</span>
                      </div>
                    ))}
                    <p className="text-[12.5px] text-slate-500 flex items-center gap-1"><Timer className="w-3.5 h-3.5" /> 평균 신뢰도 {((dashboard.avgConfidence || 0) * 100).toFixed(1)}%</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500"><FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" /><p className="text-[13.5px]">검수 데이터가 없습니다</p></div>
                )}
              </div>
            </div>

            {exposures.length > 0 && (
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h2 className="font-extrabold text-slate-900 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600" /> 최근 승인된 노출</h2>
                  <Link to={`/brand/campaigns/${selectedCampaignId}/evidence`} className="text-[13px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                    전체 보기 <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px]">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="text-left p-4 text-[13px] font-bold text-slate-600">슬롯</th>
                        <th className="text-right p-4 text-[13px] font-bold text-slate-600">시작</th>
                        <th className="text-right p-4 text-[13px] font-bold text-slate-600">노출 시간</th>
                        <th className="text-right p-4 text-[13px] font-bold text-slate-600">신뢰도</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {exposures.slice(0, 5).map((e: any) => (
                        <tr key={e.id} className="hover:bg-slate-50">
                          <td className="p-4 font-semibold text-slate-900 text-[13.5px]">{e.slotType || '미분류'}</td>
                          <td className="p-4 text-right text-[13px] text-slate-500 tabular-nums">{fmtDuration(e.startTs)}</td>
                          <td className="p-4 text-right font-semibold tabular-nums">{fmtDuration(e.duration)}</td>
                          <td className="p-4 text-right">
                            <span className={`badge ${e.avgConfidence >= 0.8 ? 'bg-emerald-100 text-emerald-700' : e.avgConfidence >= 0.7 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                              {(e.avgConfidence * 100).toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        <p className="text-[12.5px] text-slate-500 flex items-start gap-1.5 break-keep">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Media는 AI 로고 검출 후 운영 검수를 통과한 노출만, Commerce는 브랜드 픽셀·할인코드·QR로 귀속된 값만 집계합니다.
          팬 데이터는 개인이 아닌 집계·추세로만 제공합니다. 실제 성과는 다음 추천의 예상 범위 보정에 재사용됩니다.
        </p>
      </div>
    </Layout>
  );
}
