/**
 * 역할별 대시보드 — UI/UX 통합 가이드 v1.0 §13 (Action-first)
 *
 *  - 브랜드: Action Summary → 이어서 하기 → 진행 중 후원 → 성과 → 다음 제안 순서.
 *    KPI보다 "지금 해야 할 일"을 먼저 보여준다.
 *  - 선수: 승인 필요 → 서명 대기 → 내 슬롯 → 팬 → 성과 → 데이터 체크인.
 *  - 측정하지 않은 값은 0으로 만들지 않고 "집계 중"으로 둔다 (LEG-06).
 *  - 관리자 대시보드는 도메인 console 재편(백로그 C8) 전까지 기존 구성을 유지한다.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import {
  Activity, ArrowRight, ArrowUpRight, BarChart3, Bookmark, CalendarCheck, CheckCircle2, ClipboardList,
  Clock, CreditCard, FileSignature, FileText, Heart, PenLine, PlayCircle, ShieldCheck,
  ShoppingBag as ShoppingBagIcon, Sparkles, TrendingUp, Users, Wallet,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { formatCurrency, formatDate, formatTimeRemaining, getStatusLabel, cn } from '../utils';
import { getEventMonthLabel } from '../utils/eventMonth';

export function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'BRAND') return <BrandDashboard />;
  if (user?.role === 'ATHLETE') return <AthleteDashboard />;
  /* 팬 계정의 홈은 팬 참여(/fan). 관리자용 운영 홈을 보여주지 않는다 */
  if (user?.role === 'FAN') return <Navigate to="/fan" replace />;
  return <AdminDashboard />;
}

/* ── 공통 조각 ─────────────────────────────────────────── */

const APP_STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: '작성 중', cls: 'bg-slate-100 text-slate-600' },
  SUBMITTED: { label: '승인 대기', cls: 'bg-amber-50 text-amber-700' },
  PARTIAL_APPROVAL: { label: '일부 승인', cls: 'bg-amber-50 text-amber-700' },
  APPROVED: { label: '결제 대기', cls: 'bg-sky-50 text-sky-700' },
  PAYMENT_PENDING: { label: '결제 확인 중', cls: 'bg-sky-50 text-sky-700' },
  ACTIVE: { label: '진행 중', cls: 'bg-emerald-50 text-emerald-700' },
  REJECTED: { label: '거절', cls: 'bg-rose-50 text-rose-700' },
  EXPIRED: { label: '만료', cls: 'bg-slate-100 text-slate-500' },
  CANCELLED: { label: '취소', cls: 'bg-slate-100 text-slate-500' },
};

function ActionTile({ icon: I, label, count, to, tone, hint }: {
  icon: typeof Clock; label: string; count: number | null; to: string; tone: 'warn' | 'info' | 'ok' | 'muted'; hint?: string;
}) {
  const t = {
    warn: 'border-amber-200 bg-amber-50/60 text-amber-800',
    info: 'border-sky-200 bg-sky-50/60 text-sky-800',
    ok: 'border-emerald-200 bg-emerald-50/60 text-emerald-800',
    muted: 'border-slate-200 bg-white text-slate-700',
  }[tone];
  const active = count != null && count > 0;
  return (
    <Link to={to} className={`rounded-2xl border p-4 flex items-center gap-3 transition-all hover:shadow-[0_10px_28px_-16px_rgba(15,23,42,0.25)] ${active ? t : 'border-slate-200 bg-white text-slate-600'}`}>
      <span className={`w-11 h-11 rounded-xl inline-flex items-center justify-center shrink-0 ${active ? 'bg-white/80' : 'bg-slate-50'}`}>
        <I className="w-5 h-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold">{label}</span>
        <span className="block text-[22px] font-extrabold leading-tight tabular-nums">
          {count == null ? <span className="text-[14px] font-bold text-slate-500">집계 중</span> : `${count}건`}
        </span>
        {hint && <span className="block text-[12px] text-slate-500 truncate">{hint}</span>}
      </span>
      <ArrowRight className="w-4 h-4 shrink-0 opacity-60" />
    </Link>
  );
}

function Section({ title, desc, to, toLabel = '전체 보기', children }: {
  title: string; desc?: string; to?: string; toLabel?: string; children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="min-w-0">
          <h2 className="text-[16px] font-extrabold text-slate-900">{title}</h2>
          {desc && <p className="mt-0.5 text-[12.5px] text-slate-500">{desc}</p>}
        </div>
        {to && (
          <Link to={to} className="ml-auto shrink-0 inline-flex items-center gap-1 text-[13px] font-bold text-emerald-700 hover:text-emerald-800">
            {toLabel} <ArrowUpRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function EmptyRow({ text, to, cta }: { text: string; to?: string; cta?: string }) {
  return (
    <div className="px-6 py-8 text-center">
      <p className="text-[13.5px] font-semibold text-slate-600">{text}</p>
      {to && cta && (
        <Link to={to} className="mt-3 inline-flex h-10 px-4 items-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold">
          {cta} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

/* ── 브랜드 (§13.1) ─────────────────────────────────────── */

function BrandDashboard() {
  const { data: apps } = useQuery({ queryKey: ['brand-applications'], queryFn: () => api.listApplications(), retry: 1 });
  const { data: campaigns } = useQuery({ queryKey: ['brand-campaigns'], queryFn: () => api.getMyCampaigns(), retry: 1 });
  const { data: saved } = useQuery({ queryKey: ['brand-saved-offers'], queryFn: () => api.getSavedOffers(), retry: 1 });
  const { data: drafts } = useQuery({ queryKey: ['brand-direct-drafts'], queryFn: () => api.listDirectDrafts(), retry: 1 });
  const { data: stats } = useQuery({ queryKey: ['brand-stats'], queryFn: () => api.getMyBrandStats(), retry: 1 });
  const { data: reports } = useQuery({ queryKey: ['brand-new-reports'], queryFn: () => api.getMyRoiReports(30), retry: 0 });

  const list: any[] = useMemo(() => (Array.isArray(apps?.data) ? apps.data : apps?.data?.applications || []), [apps]);
  const campaignList: any[] = useMemo(() => (Array.isArray(campaigns?.data) ? campaigns.data : []), [campaigns]);
  const savedList: any[] = useMemo(() => saved?.data?.saved || [], [saved]);
  const draftList: any[] = useMemo(() => drafts?.data?.drafts || [], [drafts]);

  const counts = useMemo(() => {
    if (!apps) return { approval: null, payment: null, running: null };
    const by = (s: string[]) => list.filter((a) => s.includes(a.status)).length;
    return {
      approval: by(['SUBMITTED', 'PARTIAL_APPROVAL']),
      payment: by(['APPROVED', 'PAYMENT_PENDING']),
      running: by(['ACTIVE']) + campaignList.filter((c) => c.status === 'ACTIVE').length,
    };
  }, [apps, list, campaignList]);

  const running = list.filter((a) => a.status === 'ACTIVE').slice(0, 5);
  const recent = list.filter((a) => a.status !== 'ACTIVE').slice(0, 4);
  /* 타일은 가장 먼저 처리할 신청 상세로 바로 보낸다. 없으면 목록/허브로. */
  const firstOf = (st: string[]) => list.find((a) => st.includes(a.status));
  const approvalTo = firstOf(['SUBMITTED', 'PARTIAL_APPROVAL']) ? `/sponsor/applications/${firstOf(['SUBMITTED', 'PARTIAL_APPROVAL']).id}` : '/sponsor/cart';
  const paymentTo = firstOf(['APPROVED', 'PAYMENT_PENDING']) ? `/sponsor/applications/${firstOf(['APPROVED', 'PAYMENT_PENDING']).id}` : '/contracts';

  return (
    <Layout>
      <div className="space-y-6 max-w-[1180px]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-extrabold text-slate-900 tracking-[-0.02em]">지금 해야 할 일</h1>
            <p className="text-[14px] text-slate-600 mt-1">승인 · 결제 · 진행 중인 후원부터 확인하세요. 성과는 아래에 있습니다.</p>
          </div>
          <Link to="/sponsor" className="hidden sm:inline-flex h-11 px-4 items-center gap-2 rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold hover:bg-emerald-700">
            <Sparkles className="w-4 h-4" /> 새 후원 시작
          </Link>
        </div>

        {/* 1. Action Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <ActionTile icon={Clock} label="승인 대기" count={counts.approval} to={approvalTo} tone="warn" hint="선수 응답을 기다리는 신청" />
          <ActionTile icon={CreditCard} label="결제 대기" count={counts.payment} to={paymentTo} tone="info" hint="승인 완료 · 결제 진행 필요" />
          <ActionTile icon={PlayCircle} label="진행 중" count={counts.running} to="/campaigns" tone="ok" hint="계약 · 캠페인 실행 중" />
          <ActionTile icon={BarChart3} label="새 리포트" count={reports ? (reports.data?.count ?? 0) : null} to="/brand/reports/roi" tone={reports?.data?.count ? 'info' : 'muted'} hint="최근 30일 완료된 성과 리포트" />
        </div>

        {/* 2. 이어서 하기 */}
        <Section title="이어서 하기" desc="저장한 구성안 · 상품 · 최근 신청">
          <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="p-5">
              <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-slate-500"><ClipboardList className="w-4 h-4" /> 직접 PICK 구성안</p>
              {draftList.length ? (
                <ul className="mt-2.5 space-y-2">
                  {draftList.slice(0, 3).map((d: any) => (
                    <li key={d.id}>
                      <Link to={`/sponsor/direct/cart?draft=${d.id}`} className="block rounded-xl border border-slate-200 px-3 py-2.5 hover:border-emerald-300">
                        <span className="block text-[13px] font-bold text-slate-800">항목 {d.summary?.itemCount ?? d.items?.length ?? 0}개</span>
                        <span className="block text-[12px] text-slate-500 tabular-nums">
                          {d.summary?.totalAmount != null ? `${d.summary.totalAmount.toLocaleString()}원 · VAT 포함` : '금액 검증 전'}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2.5 text-[13px] text-slate-500">저장된 구성안이 없습니다.</p>}
              <Link to="/sponsor/direct/athletes" className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-emerald-700">선수 고르기 <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="p-5">
              <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-slate-500"><Bookmark className="w-4 h-4" /> 보관한 후원상품</p>
              {savedList.length ? (
                <ul className="mt-2.5 space-y-2">
                  {savedList.slice(0, 3).map((s: any) => (
                    <li key={s.offer?.id}>
                      <Link to={`/sponsor/available/${s.offer?.id}`} className="block rounded-xl border border-slate-200 px-3 py-2.5 hover:border-emerald-300">
                        <span className="block text-[13px] font-bold text-slate-800 truncate">{s.offer?.title}</span>
                        <span className="block text-[12px] text-slate-500 tabular-nums">
                          {s.offer?.priceType === 'SUBSCRIPTION' ? `월 ${s.offer?.monthlyAmount?.toLocaleString()}원` : s.offer?.supplyAmount != null ? `${s.offer.supplyAmount.toLocaleString()}원 · VAT 별도` : '협의'}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2.5 text-[13px] text-slate-500">보관한 상품이 없습니다.</p>}
              <Link to="/sponsor/available" className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-emerald-700">지금 가능한 후원 <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="p-5">
              <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-slate-500"><FileText className="w-4 h-4" /> 최근 신청</p>
              {recent.length ? (
                <ul className="mt-2.5 space-y-2">
                  {recent.slice(0, 3).map((a: any) => {
                    const st = APP_STATUS[a.status] || { label: a.status, cls: 'bg-slate-100 text-slate-600' };
                    return (
                      <li key={a.id}>
                        <Link to={`/sponsor/applications/${a.id}`} className="block rounded-xl border border-slate-200 px-3 py-2.5 hover:border-emerald-300">
                          <span className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-slate-800 truncate">{a.planName || (a.items?.[0]?.athlete?.name ? `${a.items[0].athlete.name} 외` : '후원 신청')}</span>
                            <span className={`ml-auto shrink-0 px-1.5 py-0.5 rounded text-[12px] font-bold ${st.cls}`}>{st.label}</span>
                          </span>
                          <span className="block text-[12px] text-slate-500">{a.items?.length ?? 0}개 항목 · {a.submittedAt ? formatDate(a.submittedAt) : '미제출'}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="mt-2.5 text-[13px] text-slate-500">아직 신청이 없습니다.</p>}
            </div>
          </div>
        </Section>

        {/* 3. 진행 중 후원 */}
        <Section title="진행 중 후원" desc="선수 · 일정 · 실행 상태 · 다음 액션" to="/campaigns">
          {running.length === 0 && campaignList.filter((c) => c.status === 'ACTIVE').length === 0 ? (
            <EmptyRow text="진행 중인 후원이 없습니다. 지금 별도 작업은 필요하지 않습니다." to="/sponsor" cta="새 후원 시작" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {running.map((a: any) => (
                <li key={a.id}>
                  <Link to={`/sponsor/applications/${a.id}`} className="px-5 sm:px-6 py-4 flex items-center gap-4 hover:bg-slate-50">
                    <span className="flex -space-x-2 shrink-0">
                      {(a.items || []).slice(0, 3).map((it: any) => (
                        <span key={it.id} className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 ring-2 ring-white">
                          {it.athlete?.profileImageUrl && <img src={it.athlete.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                        </span>
                      ))}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-bold text-slate-900 truncate">
                        {a.planName || (a.items || []).map((it: any) => it.athlete?.name).filter(Boolean).join(' · ')}
                      </span>
                      <span className="block text-[12.5px] text-slate-500">
                        {a.durationMonths ? `${a.durationMonths}개월` : ''}{a.items?.length ? ` · ${a.items.length}개 항목` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[12.5px] font-bold"><CheckCircle2 className="w-3 h-3" /> 진행 중</span>
                      <span className="block mt-1 text-[12px] text-slate-500">다음: 소재 · 실행 확인</span>
                    </span>
                  </Link>
                </li>
              ))}
              {campaignList.filter((c) => c.status === 'ACTIVE').slice(0, 3).map((c: any) => (
                <li key={c.id}>
                  <Link to={`/brand/campaigns/${c.id}`} className="px-5 sm:px-6 py-4 flex items-center gap-4 hover:bg-slate-50">
                    <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 inline-flex items-center justify-center shrink-0"><PlayCircle className="w-4 h-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-bold text-slate-900 truncate">{c.name || c.title || '캠페인'}</span>
                      <span className="block text-[12.5px] text-slate-500">캠페인 실행 중</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* 4. 성과 — 측정된 값만 */}
        <Section title="성과" desc="Media · Social · Fan · Commerce 4축은 ROI 리포트에서 확인합니다" to="/brand/reports/roi" toLabel="ROI 리포트">
          <div className="grid grid-cols-3 divide-x divide-slate-100">
            {[
              { k: '누적 계약', v: stats?.data?.totalContracts != null ? `${stats.data.totalContracts}건` : null },
              { k: '누적 집행액', v: stats?.data?.totalSpent != null ? formatCurrency(stats.data.totalSpent) : null },
              { k: '입찰 참여', v: stats?.data?.totalBids != null ? `${stats.data.totalBids}회` : null },
            ].map((s) => (
              <div key={s.k} className="px-5 py-5 text-center">
                <p className="text-[12.5px] text-slate-500">{s.k}</p>
                <p className="mt-1 text-[18px] font-extrabold tabular-nums text-slate-900">{s.v ?? <span className="text-[13px] font-bold text-slate-500">집계 중</span>}</p>
              </div>
            ))}
          </div>
          <p className="px-5 sm:px-6 pb-4 text-[12px] text-slate-500">예상성과와 실제성과는 분리해 표시합니다. 실제 값은 집행 후 리포트에서만 제공합니다.</p>
        </Section>

        {/* 5. 다음 제안 */}
        <div className="grid sm:grid-cols-2 gap-3">
          <Link to="/sponsor/recommended" className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 flex items-center gap-4 hover:border-rose-300">
            <span className="w-11 h-11 rounded-xl bg-rose-500 text-white inline-flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5" /></span>
            <span className="min-w-0"><span className="block text-[14.5px] font-extrabold text-slate-900">추천안 새로 받기</span><span className="block text-[12.5px] text-slate-600">목표·예산을 다시 입력하면 실행 가능한 후원안을 조합합니다.</span></span>
          </Link>
          <Link to="/sponsor/direct/athletes" className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 flex items-center gap-4 hover:border-emerald-300">
            <span className="w-11 h-11 rounded-xl bg-emerald-600 text-white inline-flex items-center justify-center shrink-0"><Users className="w-5 h-5" /></span>
            <span className="min-w-0"><span className="block text-[14.5px] font-extrabold text-slate-900">재후원 · 유사 선수 찾기</span><span className="block text-[12.5px] text-slate-600">함께했던 선수와 비슷한 투어·지역의 선수를 바로 탐색합니다.</span></span>
          </Link>
        </div>
      </div>
    </Layout>
  );
}

/* ── 선수 (§13.2) ─────────────────────────────────────── */

const ITEM_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: '승인 필요', cls: 'bg-amber-50 text-amber-700' },
  APPROVED: { label: '승인함', cls: 'bg-emerald-50 text-emerald-700' },
  NEEDS_REVISION: { label: '수정 요청', cls: 'bg-sky-50 text-sky-700' },
  REJECTED: { label: '거절', cls: 'bg-rose-50 text-rose-700' },
  EXPIRED: { label: '만료', cls: 'bg-slate-100 text-slate-500' },
};

function AthleteDashboard() {
  const { data: requests } = useQuery({ queryKey: ['athlete-requests'], queryFn: () => api.getAthleteRequests(), retry: 1 });
  const { data: signatures } = useQuery({ queryKey: ['athlete-pending-signatures'], queryFn: () => api.getPendingSignatures(), retry: 1 });
  const { data: stats } = useQuery({ queryKey: ['athlete-stats'], queryFn: () => api.getMyAthleteStats(), retry: 1 });
  const { data: contracts } = useQuery({ queryKey: ['my-contracts'], queryFn: () => api.getMyContracts(), retry: 1 });
  const { data: settlement } = useQuery({ queryKey: ['settlement-stats'], queryFn: () => api.getMySettlementStats(), retry: 1 });
  const { data: meResp } = useQuery({ queryKey: ['athlete-me'], queryFn: () => api.getMyAthlete(), retry: 0 });
  const athleteId: string | undefined = meResp?.data?.id;
  const { data: tempResp } = useQuery({ queryKey: ['fan-temperature', athleteId], queryFn: () => api.getFanTemperature(athleteId!), enabled: !!athleteId, retry: 0 });
  const temp: any = tempResp?.data || null;
  const tempText = temp?.score != null && temp.score > 0 && !temp.lowSample ? `${Number(temp.score).toFixed(1)}℃` : temp?.lowSample ? `집계 중 (참여 ${temp.sampleSize ?? 0}명)` : '집계 중';
  const checkedAt: string | null = meResp?.data?.profileUpdatedAt || null;
  const checkedDays = checkedAt ? Math.floor((Date.now() - new Date(checkedAt).getTime()) / 86400_000) : null;

  const reqList: any[] = useMemo(() => (Array.isArray(requests?.data) ? requests.data : []), [requests]);
  const pending = reqList.filter((r) => r.status === 'PENDING');
  const sigList: any[] = useMemo(() => (Array.isArray(signatures?.data) ? signatures.data : []), [signatures]);
  const activeContracts: any[] = useMemo(() => (contracts?.data || []).filter((c: any) => c.status === 'ACTIVE' || c.status === 'SIGNED').slice(0, 4), [contracts]);

  return (
    <Layout>
      <div className="space-y-6 max-w-[1180px]">
        <div>
          <h1 className="text-[24px] font-extrabold text-slate-900 tracking-[-0.02em]">지금 해야 할 일</h1>
          <p className="text-[14px] text-slate-600 mt-1">승인 · 서명 · 이번 달 실행만 빠르게 끝내세요. 슬롯과 팬 현황은 아래에 있습니다.</p>
        </div>

        {/* 1. 승인 필요 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <ActionTile icon={Clock} label="새 후원 요청" count={requests ? pending.length : null} to="/athlete/requests" tone="warn" hint="승인 · 수정 요청 · 거절" />
          <ActionTile icon={FileSignature} label="서명 대기 계약" count={signatures ? sigList.length : null} to="/athlete/pending-signatures" tone={sigList.some((s) => s.isUrgent) ? 'warn' : 'info'} hint={sigList.some((s) => s.isUrgent) ? '60분 내 서명 필요 건 있음' : '계약서 확인 후 서명'} />
          <ActionTile icon={CalendarCheck} label="판매 가능 슬롯" count={stats?.data?.activeSlots ?? null} to="/my-slots" tone="ok" hint="가격 · 판매 방식 확인" />
          <ActionTile icon={Wallet} label="정산 대기" count={null} to="/contracts" tone="muted" hint={settlement?.data?.pendingAmount != null ? formatCurrency(settlement.data.pendingAmount) : '집계 중'} />
        </div>

        {/* 승인 필요 목록 */}
        <Section title="승인이 필요한 후원 요청" desc="브랜드가 보낸 요청입니다. 승인 유효기간이 지나면 자동 만료됩니다." to="/athlete/requests">
          {!requests ? (
            <EmptyRow text="불러오는 중…" />
          ) : pending.length === 0 ? (
            <EmptyRow text="새 요청이 없습니다. 지금 별도 작업은 필요하지 않습니다." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {pending.slice(0, 5).map((r: any) => {
                const st = ITEM_STATUS[r.status] || { label: r.status, cls: 'bg-slate-100 text-slate-600' };
                return (
                  <li key={r.id}>
                    <Link to="/athlete/requests" className="px-5 sm:px-6 py-4 flex items-center gap-4 hover:bg-slate-50">
                      <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 inline-flex items-center justify-center shrink-0"><ClipboardList className="w-4 h-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-bold text-slate-900 truncate">{r.slotName || r.role || r.application?.planName || '후원 요청'}</span>
                        <span className="block text-[12.5px] text-slate-500">
                          {r.application?.planName ? `${r.application.planName} · ` : ''}
                          {r.application?.approvalDueAt ? `응답 기한 ${formatTimeRemaining(r.application.approvalDueAt)}` : '기한 정보 없음'}
                        </span>
                      </span>
                      <span className={`shrink-0 px-2 py-0.5 rounded-md text-[12.5px] font-bold ${st.cls}`}>{st.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {/* 진행 중 계약 · 슬롯 · 팬 */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Section title="진행 중 계약" desc="실행할 콘텐츠 · 자료 업로드" to="/contracts">
            {activeContracts.length === 0 ? (
              <EmptyRow text="진행 중인 계약이 없습니다." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {activeContracts.map((c: any) => (
                  <li key={c.id}>
                    <Link to={`/contracts/${c.id}`} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-bold text-slate-900 truncate">{c.brand?.name || '브랜드'}</span>
                        <span className="block text-[12.5px] text-slate-500 truncate">
                          {c.auction?.slotInstance?.slotTemplate?.name} · {getEventMonthLabel(c.auction?.slotInstance?.event)}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-[13.5px] font-extrabold tabular-nums">{formatCurrency(c.priceFinal)}</span>
                        <span className={cn('badge', c.status === 'COMPLETED' ? 'badge-success' : 'badge-warning')}>{getStatusLabel(c.status)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="팬 · 데이터 체크인" desc="팬온도는 실력이 아니라 최근 30일 팬 활동의 활성도입니다">
            <ul className="divide-y divide-slate-100">
              <li>
                <Link to={athleteId ? `/fan/temperature/${athleteId}` : '/fan'} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50">
                  <span className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 inline-flex items-center justify-center shrink-0"><Heart className="w-4 h-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-bold text-slate-900">팬온도 <span className="text-rose-600 tabular-nums">{tempText}</span></span>
                    <span className="block text-[12.5px] text-slate-500">
                      {temp?.weeklyDelta != null && !temp?.lowSample ? `지난주 대비 ${temp.weeklyDelta > 0 ? '+' : ''}${Number(temp.weeklyDelta).toFixed(1)}℃ · ` : ''}최근 30일 팬 활동 활성도입니다. 실력 점수가 아닙니다.
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                </Link>
              </li>
              <li>
                <Link to="/profile" className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50">
                  <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 inline-flex items-center justify-center shrink-0"><PenLine className="w-4 h-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-bold text-slate-900">
                      5분 체크인
                      {checkedDays != null && (
                        <span className={`ml-2 text-[12.5px] font-bold ${checkedDays >= 28 ? 'text-amber-700' : 'text-slate-500'}`}>마지막 확인 {checkedDays === 0 ? '오늘' : `${checkedDays}일 전`}</span>
                      )}
                    </span>
                    <span className="block text-[12.5px] text-slate-500">
                      {checkedDays != null && checkedDays >= 28 ? '4주 넘게 확인하지 않았습니다. ' : ''}일정 · 활동 · 가격 · 업종 · SNS를 확인하고 "변경 없음"이라도 저장하세요.
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                </Link>
              </li>
              <li>
                <Link to="/my-slots" className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50">
                  <span className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 inline-flex items-center justify-center shrink-0"><CalendarCheck className="w-4 h-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-bold text-slate-900">내 슬롯</span>
                    <span className="block text-[12.5px] text-slate-500">판매 가능 · 예약 · 판매완료 상태와 가격을 관리합니다.</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                </Link>
              </li>
            </ul>
          </Section>
        </div>

        {/* 성과 — 측정된 값만 */}
        <Section title="성과 · 정산" desc="측정된 값만 표시합니다" to="/contracts">
          <div className="grid grid-cols-3 divide-x divide-slate-100">
            {[
              { k: '누적 계약', v: stats?.data?.totalContracts != null ? `${stats.data.totalContracts}건` : null },
              { k: '누적 수익', v: settlement?.data?.totalPaid != null ? formatCurrency(settlement.data.totalPaid) : null },
              { k: '정산 대기', v: settlement?.data?.pendingAmount != null ? formatCurrency(settlement.data.pendingAmount) : null },
            ].map((s) => (
              <div key={s.k} className="px-5 py-5 text-center">
                <p className="text-[12.5px] text-slate-500">{s.k}</p>
                <p className="mt-1 text-[18px] font-extrabold tabular-nums text-slate-900">{s.v ?? <span className="text-[13px] font-bold text-slate-500">집계 중</span>}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </Layout>
  );
}

/* ── 관리자 운영 홈 — 도메인 console 9종 (UI 가이드 §16 · v2.1 §16) ── */

const CONSOLES: { key: string; title: string; role: string; desc: string; icon: typeof Users; tone: string; to: string; links: { label: string; to: string }[] }[] = [
  { key: 'athlete', title: '선수운영', role: 'AthleteOps', desc: '프로필 · 일정 · 슬롯 · 가격 · 권리 · 데이터 최신성', icon: Users, tone: 'bg-sky-50 text-sky-600', to: '/admin/entities',
    links: [{ label: 'KYC 심사', to: '/admin/kyc' }, { label: '대회 · 이벤트', to: '/admin/events' }, { label: '슬롯 템플릿', to: '/admin/slot-templates' }, { label: '경기 결과', to: '/admin/athletes/event-results' }] },
  { key: 'offer', title: '상품운영', role: 'OfferEditor · Merchandiser', desc: 'Offer builder · 템플릿 · 재고 · 진열 · 발행', icon: ShoppingBagIcon, tone: 'bg-emerald-50 text-emerald-600', to: '/admin/offers',
    links: [{ label: '후원상품', to: '/admin/offers' }, { label: '진열 · 배지', to: '/admin/offers/placements' }, { label: '상품 성과', to: '/admin/offers/dashboard' }, { label: '디지털 플랜 가격', to: '/admin/digital-plans' }] },
  { key: 'reco', title: '추천운영', role: 'Recommendation Ops', desc: 'brief · 후보 · 점수 · diversity · rerun · 품질', icon: Sparkles, tone: 'bg-rose-50 text-rose-500', to: '/admin/offers/dashboard',
    links: [{ label: '엔진 버전 · 품질 (준비 중)', to: '/admin/offers/dashboard' }] },
  { key: 'tx', title: '거래운영', role: 'Transaction · Finance', desc: '신청 · 승인 · 계약 · 결제 · 환불 · 정산', icon: CreditCard, tone: 'bg-violet-50 text-violet-600', to: '/admin/payments',
    links: [{ label: '결제', to: '/admin/payments' }, { label: '검수', to: '/admin/reviews' }, { label: '재무 콘솔', to: '/admin/finance' }, { label: '분쟁', to: '/admin/disputes' }] },
  { key: 'fan', title: '팬운영', role: 'FanOps · Moderator', desc: 'VOTE · 온도 · 포인트 · 스토어 · 신고', icon: Heart, tone: 'bg-rose-50 text-rose-500', to: '/admin/fan',
    links: [{ label: '검수함 · 신고', to: '/admin/fan/moderation' }, { label: 'VOTE', to: '/admin/fan/votes' }, { label: '팬온도 산식', to: '/admin/fan/formula' }, { label: '포인트 정책', to: '/admin/fan/point-policy' }] },
  { key: 'cms', title: 'Trust · CMS', role: 'Reviewer · Publisher', desc: '서비스 · 사례 · 브랜드 · FAQ · 권리', icon: FileText, tone: 'bg-amber-50 text-amber-600', to: '/admin/about',
    links: [{ label: '페이지 · 메뉴', to: '/admin/about/pages' }, { label: '매칭사례', to: '/admin/about/cases' }, { label: '브랜드', to: '/admin/about/brands' }, { label: '권리 큐', to: '/admin/about/rights' }] },
  { key: 'guarantee', title: '성과보장', role: 'Legal · Finance', desc: '정책 버전 · 판정 · 이의 · 보완지원 원장', icon: ShieldCheck, tone: 'bg-emerald-50 text-emerald-600', to: '/admin/about/policies',
    links: [{ label: '정책 버전', to: '/admin/about/policies' }, { label: '판정', to: '/admin/about/judgements' }, { label: '이의제기', to: '/admin/about/appeals' }] },
  { key: 'data', title: '데이터품질 · 성과', role: 'DataReviewer', desc: 'freshness · 미디어 노출 · ROI · 퍼널', icon: BarChart3, tone: 'bg-sky-50 text-sky-600', to: '/admin/reports',
    links: [{ label: '미디어 노출', to: '/admin/athletes/media-exposure' }, { label: '검출 검수', to: '/admin/roi/qa' }, { label: '통합 ROI', to: '/admin/funnel/integrated-report' }, { label: '통합 리포트', to: '/admin/reports' }] },
  { key: 'audit', title: '분석 · 감사', role: 'Admin · SuperAdmin', desc: '퍼널 · 전환 · 변경로그 · 권한', icon: Activity, tone: 'bg-slate-100 text-slate-700', to: '/admin/about/audit',
    links: [{ label: '감사로그', to: '/admin/about/audit' }, { label: '소개 분석 · SEO', to: '/admin/about/analytics' }, { label: '관리자 · 권한', to: '/admin/users' }, { label: '설정', to: '/admin/settings' }] },
];

function AdminDashboard() {
  const { data: stats } = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => api.getAdminDashboard(), retry: 1 });
  const d = stats?.data;

  return (
    <Layout>
      <div className="space-y-6 max-w-[1180px]">
        <div>
          <h1 className="text-[24px] font-extrabold text-slate-900 tracking-[-0.02em]">운영 홈</h1>
          <p className="text-[14px] text-slate-600 mt-1">처리가 필요한 일부터 확인하고, 아래 도메인 콘솔로 이동하세요. 모든 수동 변경은 감사로그에 남습니다.</p>
        </div>

        {/* 1. 지금 처리할 일 — 측정된 대기 건수만 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <ActionTile icon={Clock} label="KYC 대기 (브랜드)" count={d?.brands?.pendingKyc ?? null} to="/admin/kyc" tone="warn" />
          <ActionTile icon={Clock} label="KYC 대기 (선수)" count={d?.athletes?.pendingKyc ?? null} to="/admin/kyc" tone="warn" />
          <ActionTile icon={Wallet} label="정산 대기" count={d?.settlements?.pending ?? null} to="/admin/finance" tone="info" />
          <ActionTile icon={PlayCircle} label="진행 중 경매" count={d?.auctions?.live ?? null} to="/admin/auctions" tone="ok" />
        </div>

        {/* 2. 도메인 console 9종 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CONSOLES.map((c) => {
            const I = c.icon;
            return (
              <section key={c.key} className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col">
                <div className="flex items-start gap-3">
                  <span className={`w-10 h-10 rounded-xl inline-flex items-center justify-center shrink-0 ${c.tone}`}><I className="w-5 h-5" /></span>
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-extrabold text-slate-900">{c.title}</h2>
                    <p className="text-[12px] text-slate-500">{c.role}</p>
                  </div>
                </div>
                <p className="mt-3 text-[13px] text-slate-600 break-keep">{c.desc}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {c.links.map((l) => (
                    <li key={l.to + l.label}>
                      <Link to={l.to} className="inline-flex h-8 px-2.5 items-center rounded-lg bg-slate-50 border border-slate-200 text-[12.5px] font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700">{l.label}</Link>
                    </li>
                  ))}
                </ul>
                <Link to={c.to} className="mt-auto pt-4 inline-flex items-center gap-1 text-[13px] font-bold text-emerald-700 hover:text-emerald-800">
                  콘솔 열기 <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </section>
            );
          })}
        </div>

        {/* 3. 플랫폼 수익 — 측정값 */}
        <Section title="플랫폼 수익" desc="누적 플랫폼 수수료">
          <div className="px-6 py-5 flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 inline-flex items-center justify-center"><TrendingUp className="w-6 h-6 text-emerald-600" /></span>
            <p className="text-[26px] font-extrabold text-slate-900 tabular-nums">
              {d?.revenue?.total != null ? formatCurrency(d.revenue.total) : <span className="text-[14px] font-bold text-slate-500">집계 중</span>}
            </p>
          </div>
        </Section>
      </div>
    </Layout>
  );
}
