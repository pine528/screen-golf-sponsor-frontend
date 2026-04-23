/**
 * BRD-02: 선수별/콘텐츠별 성과 비교
 *
 * Refs: wireframe_spec.docx > BRD-02
 * - 보기 전환: 선수/콘텐츠/코드별
 * - 비교 차트 (Recharts BarChart)
 * - 상세 테이블 (CVR, CAC, ROAS 비교)
 * - 자동 해석 문구 (룰 기반)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../../components/Layout';
import { GlobalFilter, GlobalFilterValue } from '../../components/funnel/GlobalFilter';
import { DetailTable, Column } from '../../components/funnel/DetailTable';
import { api } from '../../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Lightbulb } from 'lucide-react';

type ViewMode = 'athletes' | 'codes' | 'contents';

export default function BrandPerformanceCompare() {
  const [filter, setFilter] = useState<GlobalFilterValue>({});
  const [view, setView] = useState<ViewMode>('athletes');

  const { data: meResp } = useQuery({
    queryKey: ['my-brand'],
    queryFn: async () => (await api.get('/brands/me')).data,
  });
  const brandId = (meResp as any)?.id;

  const { data: reportResp, isLoading } = useQuery({
    queryKey: ['brand-compare', brandId, filter],
    queryFn: () => api.getBrandFunnelReport(brandId!, { from: filter.from, to: filter.to, include_breakdown: true }),
    enabled: !!brandId,
  });
  const breakdown = reportResp?.data?.breakdown || { athletes: [], codes: [] };

  const items = view === 'athletes' ? breakdown.athletes : view === 'codes' ? breakdown.codes : [];

  // 자동 해석: 표본 부족 + 최고 성과 강조
  const interpretations = generateInterpretations(items, view);

  const columns: Column<any>[] = view === 'athletes' ? [
    { key: 'name', label: '선수', render: (r) => (
      <div className="flex items-center gap-2">
        {r.profileImageUrl ? <img src={r.profileImageUrl} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-slate-100" />}
        <div>
          <div className="font-semibold">{r.name}</div>
          <div className="text-[10px] text-slate-400">{r.tour}</div>
        </div>
      </div>
    ) },
    { key: 'purchases', label: '주문', sortable: true, align: 'right' },
    { key: 'netRevenue', label: '순매출', sortable: true, align: 'right',
      render: (r) => `₩${Math.round(r.netRevenue).toLocaleString()}`,
    },
    { key: 'aov', label: '객단가', align: 'right',
      render: (r) => r.purchases > 0 ? `₩${Math.round(r.netRevenue / r.purchases).toLocaleString()}` : '-',
    },
  ] : [
    { key: 'code', label: '코드', render: (r) => <code className="font-bold">{r.code}</code> },
    { key: 'purchases', label: '사용', sortable: true, align: 'right' },
    { key: 'netRevenue', label: '순매출', sortable: true, align: 'right',
      render: (r) => `₩${Math.round(r.netRevenue).toLocaleString()}`,
    },
  ];

  const chartData = items.slice(0, 10).map((r: any) => ({
    name: view === 'athletes' ? r.name : r.code,
    purchases: r.purchases,
    netRevenue: Math.round(r.netRevenue / 10000),  // 만원 단위
  }));

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">성과 비교 분석</h1>
          <p className="text-sm text-slate-500 mt-1">어떤 선수와 어떤 콘텐츠 유형이 전환을 잘 만드는지 비교 분석합니다 (BRD-02)</p>
        </div>

        <GlobalFilter value={filter} onChange={setFilter} hideAthlete hideCampaign />

        {/* 보기 전환 */}
        <div className="flex border-b border-slate-200 mb-4">
          <ViewBtn active={view === 'athletes'} onClick={() => setView('athletes')}>선수별 비교</ViewBtn>
          <ViewBtn active={view === 'codes'} onClick={() => setView('codes')}>코드별 비교</ViewBtn>
          <ViewBtn active={view === 'contents'} onClick={() => setView('contents')}>콘텐츠별 비교</ViewBtn>
        </div>

        {/* 자동 해석 문구 */}
        {interpretations.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
            <div className="text-xs font-bold text-emerald-700 mb-2 inline-flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5" /> 자동 해석
            </div>
            <ul className="space-y-1">
              {interpretations.map((t, i) => (
                <li key={i} className="text-sm text-slate-700 inline-flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span> {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 비교 차트 */}
        {chartData.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">비교 차트 (TOP 10)</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ left: 0, right: 30, top: 10, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} angle={-30} textAnchor="end" height={50} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}만`} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="left" dataKey="purchases" name="주문수" fill="#34d399" />
                  <Bar yAxisId="right" dataKey="netRevenue" name="매출(만원)" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-sm text-slate-400">로딩 중...</div>
        ) : (
          <DetailTable data={items} columns={columns} pageSize={20} emptyMessage="비교할 데이터가 없습니다" />
        )}
      </div>
    </Layout>
  );
}

function ViewBtn({ active, onClick, children }: any) {
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

function generateInterpretations(items: any[], view: ViewMode): string[] {
  if (items.length === 0) return [];
  const out: string[] = [];

  // 표본 부족
  const lowSample = items.filter((i) => i.purchases < 3);
  if (lowSample.length > items.length / 2) {
    out.push(`⚠️ 표본 수가 부족한 ${view === 'athletes' ? '선수' : '코드'}가 많아 해석에 주의가 필요합니다.`);
  }

  // 최고 매출
  const top = items[0];
  if (top && top.purchases >= 3) {
    if (view === 'athletes') {
      out.push(`${top.name} 선수가 가장 높은 순매출(₩${Math.round(top.netRevenue).toLocaleString()})을 기록했습니다.`);
    } else if (view === 'codes') {
      out.push(`${top.code} 코드가 가장 높은 순매출(₩${Math.round(top.netRevenue).toLocaleString()})을 기록했습니다.`);
    }
  }

  // 객단가 높은 선수/코드
  const withAov = items.filter((i) => i.purchases > 0).map((i) => ({ ...i, aov: i.netRevenue / i.purchases }));
  if (withAov.length > 0) {
    const topAov = withAov.sort((a, b) => b.aov - a.aov)[0];
    if (topAov.aov > 100000) {
      out.push(`${view === 'athletes' ? topAov.name : topAov.code}의 객단가(₩${Math.round(topAov.aov).toLocaleString()})가 두드러집니다.`);
    }
  }

  return out;
}
