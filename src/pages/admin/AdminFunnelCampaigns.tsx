/**
 * ADM-01: 캠페인 목록 / 자산 상태 관리
 *
 * Refs: wireframe_spec.docx > ADM-01
 * - 검색/기간/상태/브랜드 선수 필터
 * - 요약 카드 (전체/Active/Draft/Expired)
 * - 목록 테이블 (캠페인명/브랜드/선수/기간/코드·링크·스토어 상태)
 * - 자산 생성 실패 건은 "재시도" 버튼
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { GlobalFilter, GlobalFilterValue } from '../../components/funnel/GlobalFilter';
import { SummaryCard } from '../../components/funnel/SummaryCard';
import { StatusBadge } from '../../components/funnel/StatusBadge';
import { DetailTable, Column } from '../../components/funnel/DetailTable';
import { api } from '../../services/api';
import { Megaphone, CheckCircle2, FileEdit, AlarmClock, RefreshCw } from 'lucide-react';

interface CampaignRow {
  id: string;
  name: string;
  brand: { id: string; name: string };
  athletes: { id: string; name: string }[];
  status: string;
  dateStart: string | null;
  dateEnd: string | null;
  assetStatus: { promoCode: string; trackingLink: string; miniStore: string };
}

export default function AdminFunnelCampaigns() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<GlobalFilterValue>({});

  const { data: resp, isLoading } = useQuery({
    queryKey: ['admin-funnel-campaigns'],
    queryFn: () => api.listFunnelCampaigns(),
  });
  const all = (resp?.data || []) as CampaignRow[];

  const filtered = useMemo(() => {
    return all.filter((c) => {
      if (filter.from && c.dateStart && new Date(c.dateStart) < new Date(filter.from)) return false;
      if (filter.to && c.dateEnd && new Date(c.dateEnd) > new Date(filter.to)) return false;
      return true;
    });
  }, [all, filter]);

  const counts = useMemo(() => ({
    total: all.length,
    active: all.filter((c) => c.status === 'ACTIVE').length,
    draft: all.filter((c) => c.status === 'DRAFT').length,
    expired: all.filter((c) => c.status === 'COMPLETED' || c.status === 'CANCELLED').length,
    weekNew: all.filter((c) => c.dateStart && (Date.now() - new Date(c.dateStart).getTime() < 7 * 86400000)).length,
  }), [all]);

  const generateMut = useMutation({
    mutationFn: (campaignId: string) => api.generateCampaignAssets(campaignId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-funnel-campaigns'] }),
  });

  const columns: Column<CampaignRow>[] = [
    { key: 'name', label: '캠페인명', sortable: true,
      render: (r) => <button className="text-emerald-600 hover:underline font-semibold" onClick={(e) => { e.stopPropagation(); navigate(`/admin/funnel/campaigns/${r.id}`); }}>{r.name}</button>
    },
    { key: 'brand', label: '브랜드', render: (r) => r.brand.name },
    { key: 'athletes', label: '선수', render: (r) => r.athletes.map(a => a.name).join(', ') || '-' },
    { key: 'period', label: '기간',
      render: (r) => `${r.dateStart?.slice(0, 10) || '-'} ~ ${r.dateEnd?.slice(0, 10) || '-'}`,
    },
    { key: 'codeStatus', label: '코드', align: 'center',
      render: (r) => <StatusBadge status={r.assetStatus.promoCode} />,
    },
    { key: 'linkStatus', label: '링크', align: 'center',
      render: (r) => <StatusBadge status={r.assetStatus.trackingLink} />,
    },
    { key: 'storeStatus', label: '스토어', align: 'center',
      render: (r) => <StatusBadge status={r.assetStatus.miniStore} />,
    },
    { key: 'status', label: '상태', align: 'center',
      render: (r) => <StatusBadge status={r.status} />,
    },
    { key: 'action', label: '액션', align: 'right',
      render: (r) => {
        const allMissing = r.assetStatus.promoCode === 'MISSING' || r.assetStatus.trackingLink === 'MISSING' || r.assetStatus.miniStore === 'MISSING';
        if (allMissing) {
          return (
            <button
              onClick={(e) => { e.stopPropagation(); generateMut.mutate(r.id); }}
              disabled={generateMut.isPending}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            >
              <RefreshCw className={`w-3 h-3 ${generateMut.isPending ? 'animate-spin' : ''}`} /> 자산 생성
            </button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-emerald-500" />
            캠페인 목록 / 자산 상태 관리
          </h1>
          <p className="text-sm text-slate-500 mt-1">활성/대기/종료 캠페인을 한 화면에서 조회하고 자산 발급 상태를 확인합니다 (ADM-01)</p>
        </div>

        <GlobalFilter value={filter} onChange={setFilter} hideCampaign hideAthlete />

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <SummaryCard label="전체 캠페인" value={counts.total} icon={Megaphone} />
          <SummaryCard label="Active" value={counts.active} icon={CheckCircle2} variant="highlight" />
          <SummaryCard label="Draft" value={counts.draft} icon={FileEdit} />
          <SummaryCard label="만료/완료" value={counts.expired} icon={AlarmClock} />
          <SummaryCard label="이번 주 신규" value={counts.weekNew} />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-sm text-slate-400">로딩 중...</div>
        ) : (
          <DetailTable data={filtered} columns={columns} pageSize={20}
            onRowClick={(r) => navigate(`/admin/funnel/campaigns/${r.id}`)}
          />
        )}
      </div>
    </Layout>
  );
}
