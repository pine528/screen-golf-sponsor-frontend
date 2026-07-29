import { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  User,
  Calendar,
  Gavel,
  AlertCircle,
  ArrowLeft,
  Info,
  TrendingUp,
  Shield,
  CheckCircle,
  XCircle,
  Timer,
  MapPin,
  Ruler,
  FileText,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { useAuctionSocket } from '../hooks/useSocket';
import { api } from '../services/api';
import {
  formatCurrency,
  formatTimeRemaining,
  formatDate,
  getBodyPartLabel,
  cn,
} from '../utils';
import { getEventMonthLabel } from '../utils/eventMonth';
import LegalNotice from '../components/LegalNotice';

export function AuctionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState<string | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);
  // 개편 Phase 4 (§12.2) — 계약조건 확인 체크박스
  const [bidAgreed, setBidAgreed] = useState(false);
  const [newBidAlert, setNewBidAlert] = useState<string | null>(null);

  // Real-time socket connection
  const handleBidPlaced = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['auction', id] });
    // 새 입찰 알림 표시
    setNewBidAlert('새로운 입찰이 접수되었습니다!');
    setTimeout(() => setNewBidAlert(null), 3000);
  }, [id, queryClient]);

  const handleAuctionExtended = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['auction', id] });
  }, [id, queryClient]);

  const handleAuctionStatus = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['auction', id] });
  }, [id, queryClient]);

  const { isConnected, viewerCount } = useAuctionSocket(id, {
    onBidPlaced: handleBidPlaced,
    onAuctionExtended: handleAuctionExtended,
    onAuctionStatus: handleAuctionStatus,
  });

  const { data: auction, isLoading } = useQuery({
    queryKey: ['auction', id],
    queryFn: () => api.getAuction(id!),
    enabled: !!id,
    refetchInterval: (query): number | false => {
      const auctionData = query.state.data?.data;
      return auctionData?.status === 'LIVE' ? 3000 : false;
    },
  });

  const placeBidMutation = useMutation({
    mutationFn: ({ auctionId, maxBid }: { auctionId: string; maxBid: number }) =>
      api.placeBid(auctionId, maxBid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction', id] });
      setShowBidModal(false);
      setBidAmount('');
      setBidError(null);
    },
    onError: (error: any) => {
      setBidError(error.response?.data?.error?.message || '입찰에 실패했습니다');
    },
  });

  const handleBid = () => {
    if (!bidAmount) return;

    const amount = parseInt(bidAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      setBidError('유효한 금액을 입력하세요');
      return;
    }

    // docx 3-3 요구사항 — 클라이언트 사전 검증
    const cur = Number(auctionData?.currentPrice || slot?.reservePrice || 0);
    const inc = Number(auctionData?.minBidIncrement || 500_000);
    const minNext = cur + inc;

    // 1) 마감 여부
    if (auctionData?.status !== 'LIVE') {
      setBidError('진행 중인 경매가 아닙니다');
      return;
    }
    if (auctionData?.endAt && new Date(auctionData.endAt).getTime() <= Date.now()) {
      setBidError('경매가 종료되었습니다');
      return;
    }
    // 2) 비활성 슬롯 여부
    if (slot && slot.isActive === false) {
      setBidError('비활성 상태인 슬롯입니다');
      return;
    }
    // 3) 현재가보다 높은지 여부
    if (amount <= cur) {
      setBidError(`현재가(₩${cur.toLocaleString()})보다 높은 금액을 입력하세요`);
      return;
    }
    // 4) 최소 입찰단위
    if (amount < minNext) {
      setBidError(`최소 ₩${minNext.toLocaleString()} 이상 입력하세요 (현재가 + 최소 단위)`);
      return;
    }

    placeBidMutation.mutate({ auctionId: id!, maxBid: amount });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">경매 정보를 불러오는 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!auction?.data) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-slate-600 mb-4">경매를 찾을 수 없습니다</p>
          <Link to="/auctions" className="btn btn-primary">
            경매 목록으로
          </Link>
        </div>
      </Layout>
    );
  }

  const auctionData = auction.data;
  const slot = auctionData.slotInstance;
  const template = slot?.slotTemplate;
  const athlete = slot?.athlete;
  // 개편 Phase 4 (§12.2) — 다음 최소 입찰가 · 입찰 단위
  const minIncrement = Number(auctionData.minBidIncrement || 500_000);
  const nextMinBid = Number(auctionData.currentPrice || slot?.reservePrice || 0) + minIncrement;
  const bidCount = Array.isArray(auctionData.bids) ? auctionData.bids.length : (auctionData.bidCount ?? 0);
  const event = slot?.event;
  const bids = auctionData.bids || [];
  const isPublicAuction = auctionData.isFeatured === true;

  const getStatusInfo = () => {
    switch (auctionData.status) {
      case 'LIVE':
        return { label: '진행 중', color: 'bg-emerald-500', icon: Timer };
      case 'SCHEDULED':
        return { label: '예정', color: 'bg-blue-500', icon: Calendar };
      case 'ENDED':
        return { label: '종료', color: 'bg-slate-500', icon: CheckCircle };
      case 'UNSOLD':
        return { label: '유찰', color: 'bg-amber-500', icon: XCircle };
      case 'CANCELLED':
        return { label: '취소됨', color: 'bg-red-500', icon: XCircle };
      default:
        return { label: auctionData.status, color: 'bg-slate-500', icon: Info };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Real-time Bid Alert */}
        {newBidAlert && (
          <div className="fixed top-4 right-4 z-50 animate-pulse">
            <div className="bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
              <Gavel className="w-5 h-5" />
              <span className="font-medium">{newBidAlert}</span>
            </div>
          </div>
        )}

        {/* 경로 */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-400">
          <Link to="/" className="hover:text-slate-700">홈</Link>
          <span>›</span>
          <Link to="/auctions" className="hover:text-slate-700">라이브 경매</Link>
          <span>›</span>
          <span className="text-slate-700 font-semibold">{template?.name}</span>
          <button onClick={() => navigate(-1)} className="ml-auto inline-flex items-center gap-1 hover:text-slate-700">
            <ArrowLeft className="w-3.5 h-3.5" /> 뒤로
          </button>
        </nav>

        {/* ── 히어로 카드 (밝은 톤) ── */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6 items-center bg-gradient-to-br from-emerald-50/70 via-white to-white">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                {auctionData.status === 'LIVE' && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-extrabold tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> LIVE
                  </span>
                )}
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 truncate">{template?.name}</h1>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[11px] font-bold">{statusInfo.label}</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px] font-semibold">
                  {isPublicAuction ? '공개 경매' : '비공개 경매'}
                </span>
                <span className={cn(
                  'ml-auto inline-flex items-center gap-1 text-[11px] font-semibold',
                  isConnected ? 'text-emerald-600' : 'text-slate-400'
                )}>
                  {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isConnected ? '실시간' : '연결 중...'}
                  {auctionData.status === 'LIVE' && viewerCount > 0 && <span className="ml-1.5 text-slate-400">· {viewerCount}명</span>}
                </span>
              </div>

              <p className="text-sm text-slate-500 mb-4">{athlete?.name} 프로 · {getEventMonthLabel(event)}</p>

              <p className="text-[11px] text-slate-400 mb-0.5">{bidCount > 0 ? '현재가' : '경매 시작가'}</p>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums mb-3">
                {formatCurrency(auctionData.currentPrice || slot?.reservePrice || 0)}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-600 tabular-nums">
                  다음 최소 입찰가 {formatCurrency(nextMinBid)}
                </span>
                {auctionData.status === 'LIVE' && (
                  user?.role === 'BRAND' ? (
                    <button
                      onClick={() => { setShowBidModal(true); setBidError(null); }}
                      className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors shadow-sm shadow-emerald-500/20"
                    >
                      <Gavel className="w-4 h-4" /> 입찰 참여하기
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-colors"
                    >
                      <Gavel className="w-4 h-4" /> 브랜드 로그인 후 입찰
                    </Link>
                  )
                )}
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <SlotShape code={template?.code} />
            </div>
          </div>

          {/* 지표 5종 — 모두 실제 값 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-3 sm:p-4 border-t border-slate-100 bg-slate-50/60">
            <HeroStat label="남은 시간" icon={<Clock className="w-3 h-3" />}
              value={auctionData.status === 'LIVE' ? formatTimeRemaining(auctionData.endAt) : '—'}
              sub={auctionData.endAt ? `마감 ${new Date(auctionData.endAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}` : ''} />
            <HeroStat label="최소 단위" value={formatCurrency(minIncrement)} sub="입찰 단위" />
            <HeroStat label="입찰 횟수" value={`${bidCount}회`} sub="전체 누적" />
            <HeroStat label="경쟁 지수" value={bidCount === 0 ? '낮음' : bidCount < 5 ? '보통' : '높음'} sub={`입찰 ${bidCount}건 기준`} />
            <HeroStat label="노출 배수" value={`${event?.multiplier ?? 1}x`} sub="대회 가중치" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ══ 좌: 본문 ══ */}
          <div className="lg:col-span-2 space-y-5">
            {/* 슬롯 정보 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <Ruler className="w-4 h-4 text-emerald-500" /> 슬롯 정보
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-5">
                <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <SlotShape code={template?.code} />
                  <span className="mt-2 text-[11px] text-slate-400">위치 미리보기</span>
                </div>

                <dl className="grid grid-cols-2 gap-2.5 content-start">
                  <SpecBox label="위치 코드" value={template?.code || '—'} />
                  <SpecBox label="최대 크기" value={template?.sizeMaxWMm ? `${template.sizeMaxWMm} × ${template.sizeMaxHMm} mm` : '—'} />
                  <SpecBox label="권장 크기" value={template?.recommendedWMm ? `${template.recommendedWMm} × ${template.recommendedHMm} mm` : '—'} />
                  <SpecBox label="최대 둘레" value={template?.perimeterMaxMm ? `${template.perimeterMaxMm} mm` : '—'} />
                  <SpecBox label="소재 가이드" value={template?.materialRules === 'EMBROIDERY_OK' ? '자수 가능' : template?.materialRules === 'PRINTED_ONLY' ? '인쇄만 가능' : '—'} />
                  <SpecBox label="부위" value={getBodyPartLabel(template?.bodyPart) || '—'} />
                </dl>
              </div>

              {template?.forbiddenNotes && (
                <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-3">
                  <div className="text-[11px] font-bold text-amber-800 mb-0.5 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> 주의사항
                  </div>
                  <p className="text-[11px] text-amber-900/80 leading-relaxed break-keep">{template.forbiddenNotes}</p>
                </div>
              )}
            </div>

            {/* 입찰 현황 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> 입찰 현황
                </h2>
                <span className={cn(
                  'px-2 py-0.5 rounded-md text-[11px] font-bold',
                  bidCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                )}>
                  {bidCount > 0 ? '입찰 진행 중' : '입찰 시작 전'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_150px_1.2fr] gap-4 items-center">
                {/* 좌: 금액 지표 */}
                <div className="space-y-2">
                  <SpecBox label="현재 입찰가" value={formatCurrency(auctionData.currentPrice || slot?.reservePrice || 0)} strong />
                  <SpecBox label="입찰 횟수" value={`${bidCount}회`} />
                  <SpecBox label="다음 최소 입찰가" value={formatCurrency(nextMinBid)} />
                </div>

                {/* 중: 경쟁 지수 게이지 */}
                <div className="flex flex-col items-center">
                  <CompetitionGauge bidCount={bidCount} />
                  <span className="mt-1.5 text-[11px] text-slate-400">경쟁 지수</span>
                </div>

                {/* 우: 최근 입찰 내역 */}
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-700 mb-1.5">최근 입찰 내역</div>
                  {bids.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-4 text-center">
                      <p className="text-xs font-semibold text-slate-600">아직 입찰이 없습니다</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">첫 번째 입찰의 주인공이 되어보세요</p>
                    </div>
                  ) : (
                    <ul className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {bids.slice(0, 6).map((b: any, i: number) => (
                        <li key={b.id || i} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
                          <span className="flex items-center gap-1.5 min-w-0">
                            {i === 0 && <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">최고</span>}
                            <span className="text-[11px] font-semibold text-slate-700 truncate">
                              {maskBrandName(b.brand?.name)}
                            </span>
                          </span>
                          <span className="text-[11px] font-bold text-slate-900 tabular-nums shrink-0">
                            {formatCurrency(b.currentProxy ?? b.maxBid ?? 0)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-2 text-[10px] text-slate-400 break-keep">
                    {auctionData.status === 'LIVE'
                      ? '입찰이 접수되면 실시간으로 현황이 갱신됩니다.'
                      : '종료된 경매입니다.'}
                  </p>
                </div>
              </div>
            </div>

            <LegalNotice />

            {/* 운영 방식 안내 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <TrustItem icon={<Shield className="w-4 h-4" />} title="투명한 경매 운영" desc="모든 입찰은 서버 시간 기준으로 기록됩니다." />
              <TrustItem icon={<FileText className="w-4 h-4" />} title="공식 계약 체결" desc="낙찰 후 계약서와 이행 조건이 제공됩니다." />
              <TrustItem icon={<CheckCircle className="w-4 h-4" />} title="안전한 정산" desc="대금은 에스크로 보관 후 이행 확인 시 지급됩니다." />
            </div>
          </div>

          {/* ══ 우: 사이드바 ══ */}
          <div className="space-y-5">
            {/* 선수 정보 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-500" /> 선수 정보
              </h2>
              <div className="flex items-center gap-3 mb-3">
                {athlete?.profileImageUrl ? (
                  <img src={athlete.profileImageUrl} alt="" className="w-14 h-14 rounded-full object-cover bg-slate-100" />
                ) : (
                  <span className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 text-lg font-extrabold inline-flex items-center justify-center">
                    {athlete?.name?.charAt(0)}
                  </span>
                )}
                <div className="min-w-0">
                  <Link to={`/athletes/${athlete?.id}`} className="block text-base font-extrabold text-slate-900 hover:text-emerald-600 truncate">
                    {athlete?.name} 프로
                  </Link>
                  <span className="text-[11px] text-slate-400">{athlete?.tourQualification || athlete?.tour || ''}</span>
                </div>
              </div>

              {(athlete?.awards || athlete?.career || athlete?.affiliation) && (
                <ul className="space-y-1.5 mb-3">
                  {athlete?.awards && <AthleteFact icon="🏆" text={athlete.awards} />}
                  {athlete?.career && <AthleteFact icon="⭐" text={athlete.career} />}
                  {athlete?.affiliation && <AthleteFact icon="📍" text={athlete.affiliation} />}
                </ul>
              )}

              {athlete?.kycStatus === 'APPROVED' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                  <CheckCircle className="w-3 h-3" /> KYC 인증됨
                </span>
              )}
            </div>

            {/* 이벤트 정보 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" /> 이벤트 정보
              </h2>
              <dl className="space-y-2.5">
                <SideRow label="이벤트" value={getEventMonthLabel(event)} />
                <SideRow label="무대" value={event?.tour || '—'} />
                <SideRow label="일정" value={event?.dateStart ? `${formatDate(event.dateStart)} ~ ${formatDate(event.dateEnd)}` : '—'} />
                <SideRow label="경매 방식" value={isPublicAuction ? '공개 입찰' : '비공개 입찰'} />
              </dl>
            </div>

            {/* 관련 정보 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-2">
              <SideLink to="/auctions" icon={<Gavel className="w-4 h-4" />} label="다른 경매 보기" />
              <SideLink to={`/athletes/${athlete?.id}`} icon={<MapPin className="w-4 h-4" />} label="선수 인벤토리" />
              <SideLink to="/athletes" icon={<User className="w-4 h-4" />} label="다른 선수 둘러보기" />
            </div>
          </div>
        </div>

        {/* Bid Modal */}
        {showBidModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
            <div className="bg-white rounded-t-2xl sm:rounded-xl p-6 w-full sm:max-w-md sm:mx-4 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Gavel className="w-6 h-6 text-emerald-600" />
                입찰하기
              </h2>

              <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-900">{template?.name}</p>
                <p className="text-sm text-slate-600">
                  {athlete?.name} · {getEventMonthLabel(event)}
                </p>
              </div>

              <div className="mb-4 p-4 bg-emerald-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">시작가</span>
                  <span className="font-semibold text-emerald-700">
                    {formatCurrency(auctionData.currentPrice || slot?.reservePrice || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">다음 최소 입찰가</span>
                  <span className="font-semibold text-emerald-700">
                    {formatCurrency(nextMinBid)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">입찰 수</span>
                  <span className="font-semibold text-emerald-700">{bidCount}회</span>
                </div>
                <p className="text-xs text-slate-500 pt-2 border-t border-emerald-200">
                  {isPublicAuction
                    ? '공개 경매: 입찰 내역이 공개됩니다'
                    : '비공개 경매: 다른 입찰자의 금액을 알 수 없습니다'}
                </p>
              </div>

              {bidError && (
                <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg flex items-center gap-2 text-sm border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {bidError}
                </div>
              )}

              <div className="mb-6">
                <label className="label">최대 입찰가</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400 leading-none">₩</span>
                  <input
                    type="number"
                    className="input pl-10"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="입찰 금액을 입력하세요"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  <Info className="w-3 h-3 inline mr-1" />
                  {isPublicAuction
                    ? '공개 입찰: 경매 종료 시 최고 입찰자가 낙찰됩니다'
                    : '비공개 입찰: 경매 종료 시 최고 입찰자가 낙찰됩니다'}
                </p>

                {/* 자동입찰 안내 (핸드오프 §12.2/12.3) */}
                <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-800 mb-1">자동입찰로 진행됩니다</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed break-keep">
                    입력하신 금액은 <b>최대 한도</b>입니다. 실제로는 다른 입찰자를 이기는 데 필요한 만큼만
                    {' '}{formatCurrency(minIncrement)} 단위로 자동 입찰되며, 한도는 다른 참여자에게 공개되지 않습니다.
                    한도를 넘어서면 알림을 보내드립니다.
                  </p>
                </div>

                {/* 마감 임박 연장 · 취소 제한 안내 */}
                <p className="mt-2 text-[11px] text-slate-500 break-keep">
                  종료 {Math.round((auctionData.softCloseSec ?? 120) / 60)}분 이내 입찰이 들어오면 종료시간이 자동 연장됩니다.
                  입찰은 철회할 수 없으며, 낙찰 시 계약이 생성됩니다.
                </p>

                {/* 계약조건 확인 (§12.2) */}
                <label className="flex items-start gap-2 mt-3 cursor-pointer">
                  <input type="checkbox" checked={bidAgreed} onChange={(e) => setBidAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-slate-900" />
                  <span className="text-[11px] text-slate-600 break-keep">
                    계약조건과 권리관계 안내를 확인했으며, 낙찰 시 계약 체결에 동의합니다.
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBidModal(false);
                    setBidError(null);
                  }}
                  className="btn btn-secondary flex-1"
                >
                  취소
                </button>
                <button
                  onClick={handleBid}
                  disabled={placeBidMutation.isPending || !bidAgreed}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {placeBidMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    <>
                      <Gavel className="w-4 h-4" />
                      입찰하기
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

/** 히어로 지표 스트립 한 칸 */
function HeroStat({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-sm font-extrabold tabular-nums truncate">{value}</div>
      {sub && <div className="text-[10px] text-slate-500 truncate">{sub}</div>}
    </div>
  );
}

/**
 * 착장 이미지 매핑 — public/slots/ 에 파일을 넣으면 벡터 도형 대신 그 이미지를 쓴다.
 *
 * 파일을 추가할 위치: src/frontend/public/slots/
 *   cap-front.png / cap-side.png / cap-back.png / top-front.png / top-back.png / pants.png
 * 이미지가 없으면 아래 벡터 도형으로 자동 대체되므로 순서대로 채워 넣어도 된다.
 */
const SLOT_IMAGES: Record<string, string> = {
  CAP_FRONT: '/slots/cap-front.png',
  CAP_BRIM_TOP: '/slots/cap-front.png',
  CAP_SIDE_L: '/slots/cap-side.png',
  CAP_SIDE_R: '/slots/cap-side.png',
  CAP_BACK: '/slots/cap-back.png',
  COLLAR_L: '/slots/top-front.png',
  COLLAR_R: '/slots/top-front.png',
  CHEST_L: '/slots/top-front.png',
  CHEST_R: '/slots/top-front.png',
  SLEEVE_L: '/slots/top-front.png',
  SLEEVE_R: '/slots/top-front.png',
  SHOULDER_LINE_L: '/slots/top-front.png',
  SHOULDER_LINE_R: '/slots/top-front.png',
  BACK_SHOULDER_L: '/slots/top-back.png',
  BACK_SHOULDER_R: '/slots/top-back.png',
  PANTS_HIP_SIDE_FACING: '/slots/pants-side.png',
  PANTS_THIGH_SIDE_FACING: '/slots/pants-side.png',
};

/**
 * 이미지 위 슬롯 표시 위치 (이미지 기준 %, [중심 left, 중심 top, 너비, 높이])
 * 좌/우는 보는 사람 기준으로 배치한다.
 */
const SLOT_IMAGE_MARKS: Record<string, [number, number, number, number]> = {
  CAP_FRONT: [50, 42, 26, 15],
  CAP_BRIM_TOP: [50, 68, 34, 9],
  CAP_SIDE_L: [58, 40, 20, 14],
  CAP_SIDE_R: [58, 40, 20, 14],
  CAP_BACK: [50, 40, 24, 14],
  COLLAR_L: [43, 12, 9, 6],
  COLLAR_R: [57, 12, 9, 6],
  SHOULDER_LINE_L: [30, 20, 16, 6],
  SHOULDER_LINE_R: [70, 20, 16, 6],
  CHEST_L: [35, 33, 16, 11],
  CHEST_R: [65, 33, 16, 11],
  SLEEVE_L: [17, 33, 12, 9],
  SLEEVE_R: [83, 33, 12, 9],
  BACK_SHOULDER_L: [36, 22, 15, 8],
  BACK_SHOULDER_R: [64, 22, 15, 8],
  PANTS_HIP_SIDE_FACING: [52, 30, 18, 11],
  PANTS_THIGH_SIDE_FACING: [52, 52, 16, 13],
};

/**
 * 슬롯 위치 표시 — 등록된 착장 이미지가 있으면 이미지 위에, 없으면 벡터 도형 위에 표시한다.
 */
function SlotShape({ code }: { code?: string }) {
  const c = code || '';
  const isCap = c.startsWith('CAP');
  const isPants = c.startsWith('PANTS');

  // 구버전·미등록 코드도 부위로 판별해 해당 착장 이미지를 쓴다 (예: CAP_F → 모자 정면)
  const img =
    SLOT_IMAGES[c] ||
    (isCap ? '/slots/cap-front.png' : isPants ? '/slots/pants-side.png' : '/slots/top-front.png');
  if (img) {
    const [left, top, w, h] =
      SLOT_IMAGE_MARKS[c] ||
      (isCap ? SLOT_IMAGE_MARKS.CAP_FRONT : isPants ? SLOT_IMAGE_MARKS.PANTS_THIGH_SIDE_FACING : SLOT_IMAGE_MARKS.CHEST_L);
    return (
      <div className="relative w-full max-w-[190px]">
        <img src={img} alt="착장 위치" className="w-full h-auto select-none" draggable={false} />
        <span
          aria-hidden
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-dashed border-emerald-500 bg-emerald-500/20"
          style={{ left: `${left}%`, top: `${top}%`, width: `${w}%`, height: `${h}%` }}
        />
      </div>
    );
  }

  // [x, y, w, h] — 부위마다 표시 영역 크기가 다르다
  const POS: Record<string, [number, number, number, number]> = {
    CAP_FRONT: [39, 44, 22, 13],
    CAP_BRIM_TOP: [40, 65, 20, 6],
    CAP_SIDE_L: [30, 48, 11, 9],
    CAP_SIDE_R: [59, 48, 11, 9],
    CAP_BACK: [42, 34, 16, 8],
    COLLAR_L: [33, 27, 10, 7], COLLAR_R: [57, 27, 10, 7],
    SHOULDER_LINE_L: [20, 31, 16, 7], SHOULDER_LINE_R: [64, 31, 16, 7],
    BACK_SHOULDER_L: [27, 36, 14, 8], BACK_SHOULDER_R: [59, 36, 14, 8],
    CHEST_L: [26, 45, 18, 12], CHEST_R: [56, 45, 18, 12],
    SLEEVE_L: [15, 45, 12, 10], SLEEVE_R: [73, 45, 12, 10],
    PANTS_HIP_SIDE_FACING: [54, 30, 14, 10],
    PANTS_THIGH_SIDE_FACING: [54, 55, 14, 12],
  };
  // 구버전·미등록 코드는 부위 기본 위치로 표시한다 (모자인데 가슴에 찍히는 일 방지)
  const FALLBACK: [number, number, number, number] = isCap
    ? [39, 44, 22, 13]
    : isPants
      ? [54, 55, 14, 12]
      : [41, 45, 18, 12];
  const [mx, my, mw, mh] = POS[c] || FALLBACK;

  return (
    <svg viewBox="0 0 100 100" className="w-full max-w-[190px]" role="img" aria-label="슬롯 위치">
      {isCap ? (
        <g>
          {/* 챙 */}
          <path d="M24 64 Q50 82 76 64 Q50 71 24 64 Z" fill="#dfe5ec" stroke="#c2cbd6" strokeWidth="1.2" strokeLinejoin="round" />
          {/* 크라운 */}
          <path d="M28 65 C28 40 72 40 72 65 Z" fill="#f1f5f9" stroke="#c2cbd6" strokeWidth="1.4" strokeLinejoin="round" />
          {/* 패널 솔기 */}
          <path d="M50 41 C44 49 41 57 40.5 65" fill="none" stroke="#cbd5e1" strokeWidth="1" />
          <path d="M50 41 C56 49 59 57 59.5 65" fill="none" stroke="#cbd5e1" strokeWidth="1" />
          {/* 버튼 */}
          <circle cx="50" cy="41" r="2.2" fill="#c2cbd6" />
        </g>
      ) : isPants ? (
        <g>
          <path d="M31 18 L69 18 L67 92 L55 92 L50 48 L45 92 L33 92 Z" fill="#f1f5f9" stroke="#c2cbd6" strokeWidth="1.4" strokeLinejoin="round" />
          <rect x="31" y="18" width="38" height="6" fill="#dfe5ec" stroke="#c2cbd6" strokeWidth="1" />
        </g>
      ) : (
        <g>
          <path d="M50 22 L34 26 Q24 30 21 39 L16 53 L26 57 L30 45 L30 84 L70 84 L70 45 L74 57 L84 53 L79 39 Q76 30 66 26 Z"
            fill="#f1f5f9" stroke="#c2cbd6" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M43 24 L50 32 L57 24" fill="#dfe5ec" stroke="#c2cbd6" strokeWidth="1.2" strokeLinejoin="round" />
        </g>
      )}

      {/* 슬롯 영역 */}
      <rect x={mx} y={my} width={mw} height={mh} rx="2"
        fill="#10b981" fillOpacity="0.25" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 2" />
    </svg>
  );
}

/** 하단 운영 방식 안내 항목 */
function TrustItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3">
      <span className="mt-0.5 text-emerald-600 shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs font-bold text-slate-800">{title}</span>
        <span className="block text-[11px] text-slate-500 break-keep">{desc}</span>
      </span>
    </div>
  );
}

/** 라벨 + 값 박스 (슬롯 규격·금액 지표 공용) */
function SpecBox({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <dt className="text-[10px] text-slate-400 mb-0.5">{label}</dt>
      <dd className={`tabular-nums truncate ${strong ? 'text-base font-extrabold text-slate-900' : 'text-xs font-bold text-slate-800'}`}>
        {value}
      </dd>
    </div>
  );
}

/** 경쟁 지수 게이지 — 실제 입찰 수만으로 그린다 */
function CompetitionGauge({ bidCount }: { bidCount: number }) {
  const pct = Math.min(100, bidCount * 20); // 5건이면 가득
  const label = bidCount === 0 ? '낮음' : bidCount < 5 ? '보통' : '높음';
  const color = bidCount === 0 ? '#cbd5e1' : bidCount < 5 ? '#f59e0b' : '#ef4444';
  const R = 38;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative w-[118px] h-[118px]">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle cx="50" cy="50" r={R} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${(C * pct) / 100} ${C}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-slate-900 leading-none">{label}</span>
        <span className="text-[10px] text-slate-400 mt-0.5">입찰 {bidCount}건</span>
      </div>
    </div>
  );
}

/** 사이드바 라벨/값 행 */
function SideRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[11px] text-slate-400 shrink-0">{label}</dt>
      <dd className="text-[11px] font-semibold text-slate-800 text-right break-keep">{value}</dd>
    </div>
  );
}

/** 사이드바 이동 링크 행 */
function SideLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
      <span className="text-slate-400">{icon}</span>
      <span className="text-xs font-semibold text-slate-700 flex-1">{label}</span>
      <span className="text-slate-300">›</span>
    </Link>
  );
}

/** 선수 주요 정보 한 줄 (긴 문자열은 2줄까지) */
function AthleteFact({ icon, text }: { icon: string; text: string }) {
  return (
    <li className="flex items-start gap-1.5">
      <span className="text-[11px] shrink-0">{icon}</span>
      <span className="text-[11px] text-slate-600 leading-relaxed break-keep line-clamp-2">{text}</span>
    </li>
  );
}

/** 입찰 브랜드명 마스킹 — 경매 중 신원 노출 방지 */
function maskBrandName(name?: string) {
  if (!name) return '브랜드';
  if (name.length <= 2) return `${name.charAt(0)}*`;
  return `${name.charAt(0)}${'*'.repeat(Math.max(1, name.length - 2))}${name.charAt(name.length - 1)}`;
}
