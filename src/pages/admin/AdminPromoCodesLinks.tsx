/**
 * ADM-03: 프로모션 코드·트래킹 링크 관리
 *
 * Refs: wireframe_spec.docx > ADM-03
 * - 탭: 코드 / 링크 / QR
 * - 캠페인별 필터
 * - 코드 비활성화, 링크 재생성, 콘텐츠별 추가 발급
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../../components/Layout';
import { StatusBadge } from '../../components/funnel/StatusBadge';
import { ActionBar } from '../../components/funnel/ActionBar';
import { DetailTable, Column } from '../../components/funnel/DetailTable';
import { api } from '../../services/api';
import { Tag, Link2, QrCode, X } from 'lucide-react';

type Tab = 'codes' | 'links' | 'qr';

export default function AdminPromoCodesLinks() {
  const [tab, setTab] = useState<Tab>('codes');
  const [campaignId, setCampaignId] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: campaignsResp } = useQuery({
    queryKey: ['admin-funnel-campaigns'],
    queryFn: () => api.listFunnelCampaigns(),
  });
  const campaigns = (campaignsResp?.data || []) as any[];

  const { data: codesResp } = useQuery({
    queryKey: ['promo-codes', campaignId],
    queryFn: () => api.listPromoCodes(campaignId),
    enabled: !!campaignId && tab === 'codes',
  });
  const { data: linksResp } = useQuery({
    queryKey: ['tracking-links', campaignId],
    queryFn: () => api.listTrackingLinks(campaignId),
    enabled: !!campaignId && (tab === 'links' || tab === 'qr'),
  });

  const codes = (codesResp?.data || []) as any[];
  const links = (linksResp?.data || []) as any[];

  const disableCode = useMutation({
    mutationFn: (id: string) => api.disablePromoCode(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promo-codes', campaignId] }),
  });

  const codeColumns: Column<any>[] = [
    { key: 'code', label: '코드', render: (r) => <code className="font-mono font-bold">{r.code}</code> },
    { key: 'discount', label: '할인',
      render: (r) => r.discountType === 'PERCENT'
        ? `${Number(r.discountValue)}%`
        : `₩${Number(r.discountValue).toLocaleString()}`,
    },
    { key: 'usageCount', label: '사용', sortable: true, render: (r) => `${r.usageCount}/${r.maxUsage || '∞'}` },
    { key: 'status', label: '상태', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'createdAt', label: '발급일', render: (r) => r.createdAt?.slice(0, 10) },
    { key: 'action', label: '액션', align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => navigator.clipboard.writeText(r.code)} className="p-1 text-slate-500 hover:text-slate-700"><Tag className="w-3 h-3" /></button>
          {r.status === 'ACTIVE' && (
            <button onClick={() => disableCode.mutate(r.id)} className="p-1 text-rose-500 hover:text-rose-700">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const linkColumns: Column<any>[] = [
    { key: 'shortCode', label: '단축코드', render: (r) => <code className="font-mono">{r.shortCode}</code> },
    { key: 'contentId', label: '콘텐츠 ID', render: (r) => r.contentId || <span className="text-slate-400">기본</span> },
    { key: 'clickCount', label: '클릭', sortable: true, align: 'right' },
    { key: 'status', label: '상태', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'action', label: '액션', align: 'right',
      render: (r) => <ActionBar actions={[{ type: 'copy', value: `${window.location.origin}/s/${r.shortCode}` }]} />,
    },
  ];

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">프로모션 코드·트래킹 링크 관리</h1>
        <p className="text-sm text-slate-500 mb-6">코드와 링크를 콘텐츠 단위로 세분 발급하고 활성/비활성 및 성과를 함께 관리합니다 (ADM-03)</p>

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

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-4">
          <TabButton active={tab === 'codes'} onClick={() => setTab('codes')} icon={Tag}>Promo Codes ({codes.length})</TabButton>
          <TabButton active={tab === 'links'} onClick={() => setTab('links')} icon={Link2}>Tracking Links ({links.length})</TabButton>
          <TabButton active={tab === 'qr'} onClick={() => setTab('qr')} icon={QrCode}>QR Assets ({links.filter(l => l.qrUrl).length})</TabButton>
        </div>

        {!campaignId ? (
          <div className="text-center py-16 text-sm text-slate-400 bg-slate-50 rounded-xl">캠페인을 선택해주세요</div>
        ) : tab === 'codes' ? (
          <DetailTable data={codes} columns={codeColumns} pageSize={15} />
        ) : tab === 'links' ? (
          <DetailTable data={links} columns={linkColumns} pageSize={15} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {links.filter(l => l.qrUrl).map((l) => (
              <div key={l.id} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                <img src={l.qrUrl} alt={l.shortCode} className="w-full aspect-square mb-2 rounded" />
                <code className="text-xs font-mono">{l.shortCode}</code>
                <div className="text-[10px] text-slate-400 mt-1">{l.clickCount}회 클릭</div>
              </div>
            ))}
            {links.filter(l => l.qrUrl).length === 0 && <div className="col-span-full text-center py-12 text-sm text-slate-400">QR 자산이 없습니다</div>}
          </div>
        )}
      </div>
    </Layout>
  );
}

function TabButton({ active, onClick, icon: Icon, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors inline-flex items-center gap-2 ${
        active ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon className="w-4 h-4" /> {children}
    </button>
  );
}
