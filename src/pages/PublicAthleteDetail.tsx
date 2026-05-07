/**
 * 공개 선수 상세 페이지 (/athletes/:id)
 *
 * docx "SPONPIK 론칭 준비 개발과업지시서" 3-9 구조:
 *   상단: 기본 프로필 + 진행 중 슬롯
 *   중단: 슬롯별 실시간 경매 현황 (좌 슬롯목록 / 우 호가창·입찰내역)
 *         - 첫 슬롯 디폴트 선택, 클릭 시 우측 즉시 변경
 *         - WebSocket으로 실시간 입찰 반영
 *   하단: 미디어 노출 / 풀퍼널 리포트 / 최근 대회 결과
 *
 * 원칙:
 *   - 모든 값 실데이터 (mock/이미지 제거)
 *   - Null/빈값 → "-"
 *   - 슬롯 0개일 때 "현재 진행 중인 슬롯이 없습니다" 안내
 */

import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Trophy, Instagram, Globe, User,
  Gavel, Clock, TrendingUp, AlertCircle, Users, Calendar, MapPin,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuctionSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';

// 빈 값 → '-' 표기 헬퍼
const dash = (v: any, suffix = ''): string => {
  if (v == null || v === '' || (typeof v === 'number' && isNaN(v))) return '-';
  return `${v}${suffix}`;
};
const dashKRW = (v: any): string => {
  if (v == null || v === '' || isNaN(Number(v))) return '-';
  return `₩${Number(v).toLocaleString()}`;
};

export default function PublicAthleteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  // ROI 대시보드 view mode (BASIC/EXTENDED) — RoiDashboard ↔ ScoringAndDataSources 동기화
  // docx §10 G-1/G-2 — 점수 산정 기준은 현재 보고 있는 viewMode와 반드시 일치해야 함
  const [roiViewMode, setRoiViewMode] = useState<'BASIC' | 'EXTENDED'>('BASIC');

  const { data: resp, isLoading, error } = useQuery({
    queryKey: ['public-athlete', id],
    queryFn: () => api.getPublicAthlete(id!),
    enabled: !!id,
  });

  // ROI 대시보드 (docx 3-5)
  const { data: roiResp } = useQuery({
    queryKey: ['public-athlete-roi', id],
    queryFn: () => api.getPublicAthleteRoiDashboard(id!),
    enabled: !!id,
  });
  const roi = (roiResp?.data as any) || null;

  // SPONPIK Phase 2 SNS — YouTube 채널 데이터 (콘텐츠 반응 카테고리)
  const { data: ytResp } = useQuery({
    queryKey: ['public-athlete-youtube', id],
    queryFn: () => api.getYoutubeAthleteAggregate(id!),
    enabled: !!id,
  });
  const youtube = (ytResp?.data as any) || null;

  // SPONPIK Phase 2 SNS 옵션 B — 출연 영상 (mention) 집계
  const { data: mentionsResp } = useQuery({
    queryKey: ['public-athlete-mentions', id],
    queryFn: () => api.getAthleteMentionsAggregate(id!),
    enabled: !!id,
  });
  const mentions = (mentionsResp?.data as any) || null;

  const athlete = resp?.data?.athlete;
  const slotInstances: any[] = (resp?.data as any)?.slotInstances || [];
  const recentEvents: any[] = (resp?.data as any)?.recentEvents || [];
  const eventResults: any[] = (resp?.data as any)?.eventResults || [];

  // 슬롯 동적 생성 + 첫 슬롯 디폴트 선택 (docx 3-2 + 4)
  // 1순위: 관리자 slotOrder (낮을수록 먼저)
  // 2순위: 상태 (IN_AUCTION/OPEN 우선)
  // 3순위: createdAt (등록 순)
  const orderedSlots = useMemo(() => {
    return [...slotInstances].sort((a, b) => {
      // slot_order 우선 적용 (null/undefined는 최하위)
      const ao = a.slotOrder ?? Number.MAX_SAFE_INTEGER;
      const bo = b.slotOrder ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;

      const order = ['IN_AUCTION', 'OPEN', 'RESERVED', 'SOLD', 'CLOSED'];
      const ai = order.indexOf(a.status);
      const bi = order.indexOf(b.status);
      if (ai !== bi) return ai - bi;
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });
  }, [slotInstances]);

  const [selectedSlotId, setSelectedSlotId] = useState<string | undefined>(undefined);

  // 슬롯 로드되면 첫 슬롯 자동 선택
  useEffect(() => {
    if (orderedSlots.length > 0 && !selectedSlotId) {
      setSelectedSlotId(orderedSlots[0].id);
    }
  }, [orderedSlots, selectedSlotId]);

  // docx §13 화면명 'selectedAthlete? > ROI 대시보드' — 브라우저 페이지 타이틀 동기화
  const athleteName = (resp?.data as any)?.athlete?.name;
  useEffect(() => {
    const prev = document.title;
    document.title = athleteName
      ? `${athleteName} - 선수 상세 > ROI 대시보드 | SPONPIK`
      : '선수 상세 > ROI 대시보드 | SPONPIK';
    return () => {
      document.title = prev;
    };
  }, [athleteName]);

  const selectedSlot = orderedSlots.find((s) => s.id === selectedSlotId) || orderedSlots[0];
  const auction = selectedSlot?.auction;

  // WebSocket 실시간 (3-3)
  useAuctionSocket(auction?.id, {
    onBidPlaced: () => {
      queryClient.invalidateQueries({ queryKey: ['public-athlete', id] });
    },
    onAuctionExtended: () => queryClient.invalidateQueries({ queryKey: ['public-athlete', id] }),
    onAuctionStatus: () => queryClient.invalidateQueries({ queryKey: ['public-athlete', id] }),
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-400">로딩 중...</div>;
  if (error || !athlete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <div className="text-base font-semibold text-slate-700 mb-1">선수를 찾을 수 없습니다</div>
        <Link to="/athletes" className="text-sm text-emerald-600 hover:underline mt-3">선수 목록으로</Link>
      </div>
    );
  }

  const social = (athlete.socialLinks || {}) as Record<string, string>;
  const sponsors = (athlete.primarySponsors || []) as any[];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* === A. 선수 기본 정보 영역 (docx §4 A) === */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 text-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 flex items-center justify-between">
          <Link to="/athletes" className="inline-flex items-center gap-1 text-xs opacity-90 hover:opacity-100">
            <ArrowLeft className="w-3 h-3" /> 선수 목록
          </Link>
          {/* docx §3 #1, §4 A 영역명 — 다른 영역 (B/C/D/E/F/G) 과 일관성 */}
          <span className="text-[10px] font-bold opacity-70 uppercase tracking-wide">A. 선수 기본 정보 영역</span>
        </div>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-12 grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6 items-start">
          {/* 프로필 사진 */}
          <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden bg-white/20 backdrop-blur border-4 border-white/40 shadow-2xl mx-auto sm:mx-0">
            {athlete.profileImageUrl ? (
              <img src={athlete.profileImageUrl} alt={athlete.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl font-extrabold">{athlete.name.charAt(0)}</div>
            )}
          </div>
          {/* 기본 정보 (실데이터, 없으면 -) */}
          <div className="text-center sm:text-left">
            {/* docx §4 A '소속 배지' — 그룹 라벨 + KLPGA / WGTOUR / 스크린골프 */}
            <div className="inline-flex flex-wrap items-center gap-1 mb-2 justify-center sm:justify-start">
              <span className="text-[10px] font-bold opacity-80 mr-0.5">소속 배지:</span>
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur text-xs font-bold px-2.5 py-1 rounded-full">
                <Trophy className="w-3 h-3" /> {dash(athlete.tour)}
              </span>
              {athlete.sportType && (
                <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur text-xs font-bold px-2.5 py-1 rounded-full">
                  🏅 {athlete.sportType === 'GOLF' ? '골프' : athlete.sportType === 'SCREEN_GOLF' ? '스크린골프' : athlete.sportType}
                </span>
              )}
              {athlete.affiliation && (
                <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur text-xs font-bold px-2.5 py-1 rounded-full">
                  🤝 {athlete.affiliation}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-1">{athlete.name}</h1>
            {athlete.realName && athlete.realName !== athlete.name && (
              <div className="text-sm opacity-90 mb-2">본명: {athlete.realName}</div>
            )}
            {/* docx §4 A '기본 프로필 요약' — 그룹 라벨 + 키 / 프로 입회연도 / 지역 (docx 명시 순서) */}
            {(athlete.height || athlete.region || athlete.debutYear) && (
              <div className="text-sm opacity-95 mb-3 inline-flex flex-wrap items-center gap-x-2 gap-y-1 justify-center sm:justify-start">
                <span className="text-[10px] font-bold opacity-80 mr-0.5">기본 프로필 요약:</span>
                {athlete.height && (
                  <span className="inline-flex items-center gap-1">📏 {athlete.height}cm</span>
                )}
                {athlete.debutYear && (
                  <>
                    {athlete.height && <span className="opacity-50">·</span>}
                    <span className="inline-flex items-center gap-1">🎯 프로 입회 {athlete.debutYear}년</span>
                  </>
                )}
                {athlete.region && (
                  <>
                    {(athlete.height || athlete.debutYear) && <span className="opacity-50">·</span>}
                    <span className="inline-flex items-center gap-1">📍 {athlete.region}</span>
                  </>
                )}
              </div>
            )}
            <p className="text-sm sm:text-base opacity-95 leading-relaxed max-w-2xl mb-3">
              {dash(athlete.bio)}
            </p>

            {/* docx §4 A 활동 상태 배지 — 그룹 라벨 + 활동중 / 슬롯 오픈 / 경매 진행중 */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2 justify-center sm:justify-start">
              <span className="text-[10px] font-bold opacity-80">활동 상태:</span>
              <span className="inline-flex items-center gap-1 bg-emerald-400/90 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur">
                ● 활동중
              </span>
              {orderedSlots.length > 0 && (
                <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur text-[10px] font-bold px-2 py-1 rounded-full">
                  🎯 슬롯 오픈
                </span>
              )}
              {orderedSlots.some((s) => s.auction?.status === 'LIVE') && (
                <span className="inline-flex items-center gap-1 bg-rose-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur animate-pulse">
                  🔥 경매 진행중
                </span>
              )}
            </div>

            {/* docx §4 A '최근 참가 대회 요약' — docx 정확 라벨 */}
            {recentEvents.length > 0 && (
              <div className="text-xs opacity-90 mb-1 inline-flex items-center gap-1 justify-center sm:justify-start">
                <Calendar className="w-3 h-3" />
                <span className="font-semibold">최근 참가 대회 요약:</span>
                <span className="truncate max-w-[300px]">{recentEvents[0].name}</span>
                {recentEvents[0].dateStart && (
                  <span className="opacity-70 text-[10px]">
                    ({new Date(recentEvents[0].dateStart).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })})
                  </span>
                )}
              </div>
            )}

            {/* docx §4 A '현재 열려 있는 슬롯 수' — docx 정확 라벨 */}
            <div className="text-xs opacity-90 mb-3 inline-flex items-center gap-1 justify-center sm:justify-start">
              <Gavel className="w-3 h-3" />
              <span className="font-semibold">현재 열려 있는 슬롯 수:</span>
              <span className={`font-extrabold ${orderedSlots.length > 0 ? 'text-amber-200' : 'opacity-60'}`}>
                {orderedSlots.length}개
              </span>
            </div>

            {/* 소셜 링크 */}
            {(social.instagram || social.youtube || social.website) && (
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {social.instagram && (
                  <a href={social.instagram.startsWith('http') ? social.instagram : `https://instagram.com/${social.instagram}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-semibold">
                    <Instagram className="w-3.5 h-3.5" /> Instagram
                  </a>
                )}
                {social.youtube && (
                  <a href={social.youtube} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-semibold">
                    🎥 YouTube
                  </a>
                )}
                {social.website && (
                  <a href={social.website} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-semibold">
                    <Globe className="w-3.5 h-3.5" /> 웹사이트
                  </a>
                )}
              </div>
            )}

            {/* docx §4 A 우측 버튼 3종 — 현재 슬롯 보기 / 프로필 상세 / 경매 참여하기 (항상 노출, LIVE 없을 때 disabled) */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
              <button
                onClick={() => {
                  document.querySelector('[data-section="slots"]')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 bg-white text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-lg text-xs font-extrabold shadow-md transition-colors"
              >
                <Gavel className="w-3.5 h-3.5" /> 현재 슬롯 보기
                {orderedSlots.length > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-full ml-0.5">{orderedSlots.length}</span>
                )}
              </button>
              <button
                onClick={() => {
                  document.querySelector('[data-section="profile-detail"]')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
              >
                <User className="w-3.5 h-3.5" /> 프로필 상세
              </button>
              {(() => {
                const hasLive = orderedSlots.some((s) => s.auction?.status === 'LIVE');
                return (
                  <button
                    disabled={!hasLive}
                    onClick={() => {
                      if (!hasLive) return;
                      const liveSlot = orderedSlots.find((s) => s.auction?.status === 'LIVE');
                      if (liveSlot) setSelectedSlotId(liveSlot.id);
                      document.querySelector('[data-section="slots"]')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    title={hasLive ? '진행 중인 경매에 참여' : '진행 중인 경매가 없습니다'}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold transition-colors ${
                      hasLive
                        ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md animate-pulse'
                        : 'bg-white/15 text-white/60 cursor-not-allowed'
                    }`}
                  >
                    {hasLive ? '🔥 경매 참여하기' : '경매 참여하기'}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* 중단: 슬롯별 실시간 경매 현황 (3-2 + 3-3 + 3-4) */}
      <section data-section="slots" className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
        <h2 className="text-xl font-extrabold text-slate-900 mb-4 inline-flex items-center gap-2">
          <Gavel className="w-5 h-5 text-emerald-500" />
          진행 중인 광고 슬롯
          {orderedSlots.length > 0 && (
            <span className="text-sm font-semibold text-slate-500">({orderedSlots.length}개)</span>
          )}
        </h2>

        {orderedSlots.length === 0 ? (
          /* 슬롯 0개 케이스 (3-2 예외 처리) */
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <Gavel className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-900 mb-1">현재 진행 중인 슬롯이 없습니다</h3>
            <p className="text-sm text-slate-500">{athlete.name} 선수의 슬롯이 등록되면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
            {/* 좌측: 슬롯 목록 (동적 생성, 클릭 변경) */}
            <div className="space-y-2">
              {orderedSlots.map((s, i) => (
                <SlotCard
                  key={s.id}
                  slot={s}
                  selected={s.id === selectedSlotId}
                  index={i + 1}
                  onClick={() => setSelectedSlotId(s.id)}
                />
              ))}
            </div>

            {/* 우측: 호가창 + 입찰 내역 (선택 슬롯 기준 즉시 갱신) */}
            <div className="space-y-4">
              {selectedSlot && (
                <SlotAuctionPanel
                  slot={selectedSlot}
                  athleteName={athlete.name}
                  isAuthenticated={isAuthenticated}
                  userRole={user?.role}
                  onLoginRedirect={() => navigate('/login')}
                  onPlaced={() => queryClient.invalidateQueries({ queryKey: ['public-athlete', id] })}
                />
              )}
            </div>
          </div>
        )}
      </section>

      {/* ROI 대시보드 풀 섹션 (docx §13 화면명: 선수 상세 > ROI 대시보드) */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] text-slate-400 mb-0.5">선수 상세 &gt; ROI 대시보드</div>
            <h2 className="text-xl font-extrabold text-slate-900 inline-flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> ROI 대시보드
            </h2>
          </div>
          {roi?.meta && (
            <span className="text-[10px] text-slate-400">
              수집률 {roi.meta.collectionProgress.collected}/{roi.meta.collectionProgress.total} 지표
            </span>
          )}
        </div>
        <RoiDashboard roi={roi} youtube={youtube} mentions={mentions} viewMode={roiViewMode} onViewModeChange={setRoiViewMode} />
      </section>

      {/* === E. 운영 현황 카드 영역 (docx §8 정확 영역명 + E-1, E-2, E-3 3열) === */}
      <section data-section="profile-detail" className="max-w-6xl mx-auto px-5 sm:px-8 pb-12">
        <h2 className="text-xl font-extrabold text-slate-900 mb-4 inline-flex items-center gap-2">
          <Gavel className="w-5 h-5 text-emerald-500" />
          E. 운영 현황 카드 영역
          <span className="text-[10px] font-normal text-slate-400">슬롯 현황 / 최근 대회 / 예정 대회</span>
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* E-1. 슬롯 현황 카드 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-base font-extrabold text-slate-900 mb-3 inline-flex items-center gap-2">
            <Gavel className="w-4 h-4 text-emerald-500" /> 슬롯 현황
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="전체 슬롯" value={dash(orderedSlots.length)} />
            <Stat label="진행 중" value={String(orderedSlots.filter((s) => s.status === 'OPEN' || s.status === 'IN_AUCTION').length)} />
            <Stat label="낙찰" value={String(orderedSlots.filter((s) => s.status === 'SOLD').length)} />
            <Stat label="계약 시작일" value={athlete.createdAt ? new Date(athlete.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' }) : '-'} />
          </div>
          {/* 계약 상태 (docx E-1) */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">계약 상태</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold text-[10px]">
              ● 활동중
            </span>
          </div>
        </div>

        {/* E-2. 최근 참가 대회 카드 (docx §8 — 최근 성적 포함) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-base font-extrabold text-slate-900 mb-3 inline-flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" /> 최근 참가 대회
          </h2>
          {recentEvents.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-400">최근 대회 정보가 없습니다.</div>
          ) : (
            <div className="space-y-2">
              {recentEvents.slice(0, 3).map((e: any) => {
                // docx §8 — 최근 성적: eventResults에서 같은 이름의 결과 찾기
                const matched = eventResults.find((r: any) =>
                  r.eventName && e.name && (
                    r.eventName === e.name ||
                    r.eventName.includes(e.name) ||
                    e.name.includes(r.eventName)
                  )
                );
                return (
                  <div key={e.id} className="py-2 border-b border-slate-100 last:border-b-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{e.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {e.tour} · {e.dateStart ? new Date(e.dateStart).toLocaleDateString('ko-KR') : '-'}
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                        e.status === 'LIVE' ? 'bg-rose-100 text-rose-700'
                        : e.status === 'UPCOMING' ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                      }`}>{e.status}</span>
                    </div>
                    {/* 최근 성적 (rank + score) */}
                    {matched ? (
                      <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                        {matched.rank != null && (
                          <span className={`font-extrabold ${
                            matched.rank <= 3 ? 'text-amber-600'
                            : matched.rank <= 10 ? 'text-emerald-600'
                            : 'text-slate-700'
                          }`}>
                            🏆 {matched.rank}위
                          </span>
                        )}
                        {matched.score && <span className="text-slate-500 font-mono">{matched.score}</span>}
                      </div>
                    ) : e.status === 'COMPLETED' ? (
                      <div className="mt-1.5 text-[10px] text-slate-400">📡 성적 수집 준비 중</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* E-3. 다음 참가 예정 대회 카드 (신규 — docx E-3) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-base font-extrabold text-slate-900 mb-3 inline-flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-500" /> 다음 참가 예정 대회
          </h2>
          {(() => {
            const upcoming = recentEvents.filter((e: any) => e.status === 'UPCOMING' && new Date(e.dateStart) >= new Date());
            const next = upcoming[0] || roi?.athletePerformance?.nextEvent || roi?.operations?.nextEvent;
            if (!next) {
              return <div className="text-center py-6 text-sm text-slate-400">예정된 대회가 없습니다.</div>;
            }
            return (
              <div className="space-y-2">
                <div className="text-sm font-extrabold text-slate-900">{next.name}</div>
                <div className="text-xs text-slate-600 inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {next.dateStart ? new Date(next.dateStart).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                </div>
                {next.venue && (
                  <div className="text-xs text-slate-600 inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {next.venue}
                  </div>
                )}
                {next.tour && (
                  <div>
                    <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {next.tour}
                    </span>
                  </div>
                )}
                <span className="inline-block text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full mt-1">
                  📅 UPCOMING
                </span>
              </div>
            );
          })()}
        </div>
        </div>
      </section>

      {/* 경기결과 + 메인 스폰서 (별도 행) */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* === F. 경기결과 / 분석 (docx §9) === */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-slate-900 inline-flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-500" /> F. 경기결과 / 분석
            </h2>
            {eventResults.length > 0 && (
              <span className="text-[10px] text-slate-400">
                업데이트: {new Date(eventResults[0].sourceUpdatedAt).toLocaleDateString('ko-KR')}
              </span>
            )}
          </div>
          {/* docx §9 F. 영역 목적 — '선수의 최근 경기 흐름과 공식 성과를 연도별로 확인할 수 있게 구성' */}
          <p className="text-[10px] text-slate-500 mb-3">
            📌 선수의 최근 경기 흐름과 공식 성과를 연도별로 확인할 수 있게 구성
          </p>

          {/* F 추가 권장 항목 (docx §9): 최근 3개 대회 평균순위 / 시즌 누적 성적 / 추이 / 향후 일정 */}
          {roi?.matchAnalysis && (
            <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-slate-500">최근 3개 대회 평균순위</div>
                <div className="text-lg font-extrabold text-emerald-700">
                  {roi.matchAnalysis.recentAvgRank != null ? `${roi.matchAnalysis.recentAvgRank}위` : '-'}
                </div>
              </div>
              <div className="bg-sky-50 rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-slate-500">시즌 누적 성적</div>
                <div className="text-lg font-extrabold text-sky-700">
                  {roi.matchAnalysis.seasonAvgRank != null ? `평균 ${roi.matchAnalysis.seasonAvgRank}위` : '-'}
                </div>
                <div className="text-[9px] text-slate-400">출전 {roi.matchAnalysis.seasonTotalEvents}회</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-slate-500">시즌 최고</div>
                <div className="text-lg font-extrabold text-amber-700">
                  {roi.matchAnalysis.seasonBestRank != null ? `${roi.matchAnalysis.seasonBestRank}위` : '-'}
                </div>
                <div className="text-[9px] text-slate-400">TOP3 {roi.matchAnalysis.seasonTop3Count}회</div>
              </div>
              <div className="bg-violet-50 rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-slate-500">TOP 10 진입</div>
                <div className="text-lg font-extrabold text-violet-700">
                  {roi.matchAnalysis.seasonTop10Count}회
                </div>
                <div className="text-[9px] text-slate-400">시즌 누적</div>
              </div>
            </div>
          )}

          {/* 최근 5개 추이 (간단 라인 차트) */}
          {roi?.matchAnalysis?.recentTrend?.length >= 2 && (
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700">📈 최근 대회 추이</span>
                <span className="text-[9px] text-slate-400">최근 5개 (낮을수록 좋음)</span>
              </div>
              <div className="flex items-end justify-between gap-2 h-16">
                {roi.matchAnalysis.recentTrend.map((t: any, i: number) => {
                  const rank = t.rank || 99;
                  // 1위 = 100% 높이, 50위+ = 10% 높이
                  const heightPct = Math.max(10, Math.min(100, 100 - (rank - 1) * 2));
                  const color = rank <= 3 ? 'bg-amber-500' : rank <= 10 ? 'bg-emerald-500' : rank <= 30 ? 'bg-sky-500' : 'bg-slate-400';
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative" title={`${t.eventName} · ${t.rank}위`}>
                      <div className="text-[10px] font-bold text-slate-600">{rank}위</div>
                      <div className={`w-full ${color} rounded-t transition-all`} style={{ height: `${heightPct}%`, minHeight: '4px' }} />
                      <div className="text-[8px] text-slate-400 truncate max-w-full">
                        {t.eventDate ? new Date(t.eventDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }) : '-'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {eventResults.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400 bg-slate-50 rounded-lg">
              📡 최신 경기 정보 준비 중
            </div>
          ) : (
            <EventResultsByYear results={eventResults} fallbackTour={athlete.tour} />
          )}

          {/* 향후 대회 일정 (docx §9 추가 권장) */}
          {roi?.operations?.upcomingList?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 mb-2 inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-500" /> 향후 대회 일정 ({roi.operations.upcomingList.length})
              </h3>
              <div className="space-y-1.5">
                {roi.operations.upcomingList.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-sky-50/50 hover:bg-sky-50 transition-colors text-xs">
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold truncate">{e.name}</span>
                      {e.category && (
                        <span className="ml-1.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                          {e.category}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 ml-2 whitespace-nowrap">
                      {new Date(e.dateStart).toLocaleDateString('ko-KR')}{e.venue ? ` · ${e.venue}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 메인 스폰서 */}
        {sponsors.length > 0 && (
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-base font-extrabold text-slate-900 mb-3">🏆 메인 스폰서</h2>
            <div className="flex flex-wrap gap-2">
              {sponsors.map((s: any, i: number) => (
                <span key={i} className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full font-semibold">
                  {typeof s === 'string' ? s : s.name || s.brand || ''}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* === G. 점수 산정 기준 / 데이터 출처 (docx §13 — F 이후 마지막 섹션) ===
           ※ docx §10 G-1/G-2 — 가중치 표는 현재 RoiDashboard 의 viewMode 와 동기화 */}
      <ScoringAndDataSources roi={roi} viewMode={roiViewMode} />
    </div>
  );
}

/** 좌측 슬롯 카드 — 클릭 시 우측 호가창 변경 */
function SlotCard({ slot, selected, index, onClick }: { slot: any; selected: boolean; index: number; onClick: () => void }) {
  const auction = slot.auction;
  const isLive = auction?.status === 'LIVE';
  const isOpen = slot.status === 'OPEN' || slot.status === 'IN_AUCTION';
  const tpl = slot.slotTemplate || {};

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
        selected
          ? 'border-emerald-500 bg-emerald-50 shadow-md'
          : 'border-slate-200 bg-white hover:border-emerald-300'
      } ${!isOpen ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold text-slate-400">#{index}</span>
        {isLive && <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded animate-pulse">LIVE</span>}
        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{slot.status}</span>
      </div>
      {/* docx 4: slot_name 우선, 없으면 SlotTemplate.name fallback */}
      <div className="text-sm font-extrabold text-slate-900">{dash(slot.slotName || tpl.name || tpl.code)}</div>
      <div className="text-[10px] text-slate-500 mb-2">{dash(tpl.bodyPart)}{tpl.grade && ` · ${tpl.grade}등급`}</div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">현재가</span>
        <span className="font-bold text-emerald-600">{dashKRW(auction?.currentPrice)}</span>
      </div>
    </button>
  );
}

/** 우측 호가창 + 입찰 내역 + 입찰 영역 (3-3 + 3-4) */
function SlotAuctionPanel({ slot, athleteName, isAuthenticated, userRole, onLoginRedirect, onPlaced }: any) {
  const auction = slot.auction;
  const tpl = slot.slotTemplate || {};

  const placeBidMut = useMutation({
    mutationFn: ({ amount }: { amount: number }) => api.placeBid(auction.id, amount),
    onSuccess: () => {
      onPlaced?.();
      setBidError('');
    },
    onError: (e: any) => {
      setBidError(e?.response?.data?.error?.message || '입찰 실패');
    },
  });

  const [customBid, setCustomBid] = useState('');
  const [bidError, setBidError] = useState('');

  const currentPrice = auction?.currentPrice || 0;
  const minIncrement = auction?.minBidIncrement || 10000;
  const minNextBid = currentPrice + minIncrement;

  // 카운트다운
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remainingMs = auction?.endAt ? new Date(auction.endAt).getTime() - now : null;
  const isEnded = remainingMs != null && remainingMs <= 0;
  const remainingText = remainingMs == null
    ? '-'
    : isEnded
      ? '경매 종료'
      : formatRemaining(remainingMs);

  // docx 3-3: 입찰 사전 검증 — 마감/비활성/현재가/최소단위
  const validateBid = (amt: number): string | null => {
    if (auction?.status !== 'LIVE') return '진행 중인 경매가 아닙니다';
    if (isEnded) return '경매가 종료되었습니다';
    if (slot.isActive === false) return '비활성 상태인 슬롯입니다';
    if (isNaN(amt) || amt <= 0) return '유효한 금액을 입력해주세요';
    if (amt <= currentPrice) return `현재가(${dashKRW(currentPrice)})보다 높은 금액을 입력하세요`;
    if (amt < minNextBid) return `최소 ${dashKRW(minNextBid)} 이상 입력해주세요`;
    return null;
  };

  const handleQuickBid = (delta: number) => {
    if (!isAuthenticated) return onLoginRedirect();
    if (userRole !== 'BRAND') {
      setBidError('입찰은 브랜드 계정만 가능합니다.');
      return;
    }
    const amt = currentPrice + delta;
    const err = validateBid(amt);
    if (err) return setBidError(err);
    setBidError('');
    placeBidMut.mutate({ amount: amt });
  };

  const handleCustomBid = () => {
    const amt = Number(customBid.replace(/,/g, ''));
    if (!isAuthenticated) return onLoginRedirect();
    if (userRole !== 'BRAND') return setBidError('입찰은 브랜드 계정만 가능합니다.');
    const err = validateBid(amt);
    if (err) return setBidError(err);
    setBidError('');
    placeBidMut.mutate({ amount: amt });
  };

  const bids = auction?.bids || [];

  return (
    <>
      {/* 호가창 카드 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-700">{athleteName} · {dash(slot.slotName || tpl.name || tpl.code)}</h3>
            <div className="text-[10px] text-slate-400">{dash(tpl.bodyPart)}{tpl.grade && ` · ${tpl.grade}등급`}</div>
          </div>
          {auction?.status === 'LIVE' && <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2 py-1 rounded animate-pulse">● LIVE</span>}
        </div>

        {!auction ? (
          /* 경매 미생성 슬롯 */
          <div className="text-center py-8 bg-slate-50 rounded-xl">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <div className="text-sm text-slate-500">아직 경매가 시작되지 않은 슬롯입니다.</div>
          </div>
        ) : (
          <>
            {/* 현재가 + 카운트다운 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-emerald-50 rounded-xl p-3">
                <div className="text-[10px] font-bold text-emerald-700 mb-1">현재가</div>
                <div className="text-2xl font-extrabold text-emerald-600">{dashKRW(currentPrice)}</div>
              </div>
              <div className={`rounded-xl p-3 ${isEnded ? 'bg-slate-100' : remainingMs && remainingMs < 60000 ? 'bg-rose-50' : 'bg-slate-50'}`}>
                <div className="text-[10px] font-bold text-slate-700 mb-1 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 남은 시간
                </div>
                <div className={`text-xl font-extrabold tabular-nums ${isEnded ? 'text-slate-400' : remainingMs && remainingMs < 60000 ? 'text-rose-600' : 'text-slate-900'}`}>{remainingText}</div>
              </div>
            </div>

            {/* 메타 정보 */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
              <div className="bg-slate-50 rounded p-2">
                <div className="text-[9px] text-slate-500">입찰 건수</div>
                <div className="font-bold">{dash(bids.length, '건')}</div>
              </div>
              <div className="bg-slate-50 rounded p-2">
                <div className="text-[9px] text-slate-500">최소 단위</div>
                <div className="font-bold">{dashKRW(minIncrement)}</div>
              </div>
              <div className="bg-slate-50 rounded p-2">
                <div className="text-[9px] text-slate-500">상태</div>
                <div className="font-bold text-[11px]">{dash(auction.status)}</div>
              </div>
            </div>

            {/* SPONPIK 3-3: 호가 리스트 (단계별 가격대) + 다음 5단계 + 총합 */}
            <BidTierLadder
              currentPrice={currentPrice}
              minIncrement={minIncrement}
              onTierClick={(tierAmt) => {
                if (!isAuthenticated) return onLoginRedirect();
                if (userRole !== 'BRAND') {
                  setBidError('입찰은 브랜드 계정만 가능합니다.');
                  return;
                }
                setBidError('');
                placeBidMut.mutate({ amount: tierAmt });
              }}
              disabled={placeBidMut.isPending || auction.status !== 'LIVE' || isEnded}
            />

            {/* 입찰 영역 */}
            {auction.status === 'LIVE' && !isEnded && (
              <>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[500000, 1000000, 5000000].map((delta) => (
                    <button
                      key={delta}
                      onClick={() => handleQuickBid(delta)}
                      disabled={placeBidMut.isPending}
                      className="px-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                    >
                      +₩{(delta / 10000).toLocaleString()}만
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={customBid}
                    onChange={(e) => setCustomBid(e.target.value)}
                    placeholder={`최소 ${dashKRW(minNextBid)}`}
                    className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleCustomBid}
                    disabled={placeBidMut.isPending || !customBid}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-lg disabled:opacity-50"
                  >
                    입찰
                  </button>
                </div>
                {bidError && (
                  <div className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded mb-2">{bidError}</div>
                )}
                {!isAuthenticated && (
                  <div className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded">
                    로그인 후 입찰 가능합니다.{' '}
                    <button onClick={onLoginRedirect} className="font-bold underline">로그인하기</button>
                  </div>
                )}
              </>
            )}

            {isEnded && (
              <div className="text-center py-4 bg-slate-50 rounded-xl text-sm font-bold text-slate-500">
                ⏰ 경매가 종료되었습니다
              </div>
            )}
          </>
        )}
      </div>

      {/* 최근 입찰 내역 (3-4) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-3 inline-flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" /> 최근 입찰 내역
        </h3>
        {bids.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-400">아직 입찰 내역이 없습니다.</div>
        ) : (
          <div className="space-y-1.5">
            {bids.slice(0, 10).map((b: any, i: number) => (
              <div key={b.id} className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm ${i === 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2 min-w-0">
                  {i === 0 && <span className="text-[9px] font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded">최고</span>}
                  <span className="font-semibold truncate">{maskBrand(b.brand?.name)}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-600">{dashKRW(b.currentProxy || b.maxBid)}</div>
                  <div className="text-[9px] text-slate-400">{b.createdAt ? formatRelativeTime(b.createdAt) : '-'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * SPONPIK 3-3 — 호가 리스트 (Bid Tier Ladder)
 * 현재가 기준 다음 5단계 가격을 보여주고, 클릭으로 즉시 입찰.
 * 총합(누적 5단계 합)도 표시 — 브랜드가 "5단계까지 가면 얼마"인지 한눈에 파악.
 */
function BidTierLadder({
  currentPrice,
  minIncrement,
  onTierClick,
  disabled,
}: {
  currentPrice: number;
  minIncrement: number;
  onTierClick: (amt: number) => void;
  disabled: boolean;
}) {
  // 단계별 호가 (현재가 + 1*N, 2*N, ..., 5*N)
  const tiers = Array.from({ length: 5 }, (_, i) => ({
    step: i + 1,
    amount: currentPrice + minIncrement * (i + 1),
    delta: minIncrement * (i + 1),
  }));
  const totalSum = tiers.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] font-extrabold text-emerald-700 inline-flex items-center gap-1">
          📊 호가 리스트 (다음 5단계)
        </div>
        <div className="text-[10px] text-slate-500">
          5단계 누적 <span className="font-bold text-emerald-700">₩{totalSum.toLocaleString()}</span>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {tiers.map((t) => (
          <button
            key={t.step}
            onClick={() => onTierClick(t.amount)}
            disabled={disabled}
            className="bg-white hover:bg-emerald-100 border border-emerald-200 rounded-lg px-1.5 py-2 text-center disabled:opacity-50 disabled:hover:bg-white transition-colors group"
            title={`${t.step}단계: ₩${t.amount.toLocaleString()}`}
          >
            <div className="text-[9px] font-bold text-emerald-600">{t.step}단계</div>
            <div className="text-[11px] font-extrabold text-slate-900 group-hover:text-emerald-700 truncate">
              ₩{t.amount.toLocaleString()}
            </div>
            <div className="text-[8px] text-slate-400">+₩{t.delta.toLocaleString()}</div>
          </button>
        ))}
      </div>
      <div className="text-[9px] text-slate-500 mt-1.5 text-center">
        💡 단계 버튼을 클릭하면 해당 가격으로 즉시 입찰됩니다
      </div>
    </div>
  );
}

/** ROI 대시보드 (docx 3-5: 5카테고리 13지표) */
/**
 * SPONPIK 선수 ROI 대시보드 (docx 2026-05-04 '선수 상세 페이지 수정개발')
 *
 * 계약유형별 2단 구조:
 *  - BASIC (기본형, 모든 사용자): 4개 카드 — 미디어/콘텐츠/팬덤/선수성과
 *  - EXTENDED (확장형, 중장기 계약 브랜드): + 랜딩 유입 + 구매·전환·ROI
 *
 * 가중치:
 *  - BASIC: 미디어(30) + 콘텐츠(20) + 팬덤(20) + 선수성과(30)
 *  - EXTENDED: 미디어(20) + 콘텐츠(15) + 팬덤(15) + 선수성과(20) + 랜딩(10) + 구매(20)
 *
 * 등급: A (≥80) / B (≥65) / C (≥50) / D (≥35) / E (<35)
 * 상태 배지: 공식 산정 (≥70%) / 예비 산정 (40-69%) / 산정중 (<40%)
 */
function RoiDashboard({
  roi,
  youtube,
  viewMode: viewModeProp,
  onViewModeChange,
}: {
  roi: any;
  youtube?: any;
  mentions?: any;
  viewMode?: 'BASIC' | 'EXTENDED';
  onViewModeChange?: (m: 'BASIC' | 'EXTENDED') => void;
}) {
  // 부모(PublicAthleteDetail)가 viewMode 를 끌어올려 G 섹션과 공유 — controlled mode
  // props 전달 안 됐을 때만 자체 로컬 상태로 동작 (uncontrolled fallback)
  const [internalMode, setInternalMode] = useState<'BASIC' | 'EXTENDED'>('BASIC');
  const viewMode = viewModeProp ?? internalMode;
  const setViewMode = (m: 'BASIC' | 'EXTENDED') => {
    if (onViewModeChange) onViewModeChange(m);
    else setInternalMode(m);
  };
  if (!roi) {
    return <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">ROI 지표 로딩 중...</div>;
  }

  const fmt = (v: any, type: 'number' | 'currency' | 'percent' | 'time' = 'number'): string => {
    if (v == null || v === '' || (typeof v === 'number' && isNaN(v))) return '-';
    if (type === 'currency') return `₩${Math.round(Number(v)).toLocaleString()}`;
    if (type === 'percent') return `${Number(v).toFixed(2)}%`;
    if (type === 'time') {
      const sec = Number(v);
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m}분 ${s}초`;
    }
    return Number(v).toLocaleString();
  };

  const sum = roi.summary || {};
  const score = viewMode === 'EXTENDED' ? sum.extendedScore : sum.basicScore;
  // docx §11 — 산정중 상태에서 보수적 처리는 backend toGrade()에서 적용되므로
  // backend 가 보낸 basicGrade/extendedGrade 를 우선 사용 (frontend 자체 매핑 금지)
  const backendGrade = viewMode === 'EXTENDED' ? sum.extendedGrade : sum.basicGrade;
  const grade = backendGrade ?? (score == null ? null
    : score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : score >= 35 ? 'D' : 'E');
  const gradeColor = grade === 'A' ? 'emerald' : grade === 'B' ? 'sky' : grade === 'C' ? 'amber' : grade === 'D' ? 'orange' : grade === 'E' ? 'rose' : 'slate';
  const gradeBgs: Record<string, string> = {
    emerald: 'from-emerald-100 to-teal-50 text-emerald-700 border-emerald-300',
    sky: 'from-sky-100 to-blue-50 text-sky-700 border-sky-300',
    amber: 'from-amber-100 to-yellow-50 text-amber-700 border-amber-300',
    orange: 'from-orange-100 to-amber-50 text-orange-700 border-orange-300',
    rose: 'from-rose-100 to-pink-50 text-rose-700 border-rose-300',
    slate: 'from-slate-100 to-slate-50 text-slate-400 border-slate-200',
  };

  const statusBadgeClass = sum.statusBadge === 'OFFICIAL' ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : sum.statusBadge === 'PRELIMINARY' ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-slate-100 text-slate-600 border-slate-200';

  const isExtended = viewMode === 'EXTENDED';

  return (
    <div className="space-y-4">
      {/* === B. 종합 광고효과 요약 영역 (docx §3 #2, §4 B 영역명) === */}
      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">B. 종합 광고효과 요약 영역</div>
      <div className={`border-2 rounded-2xl p-5 bg-gradient-to-br ${gradeBgs[gradeColor]}`}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[11px] font-bold opacity-70">📊 SPONPIK Ad Impact Score</span>
              {/* docx §4 B-1 명시 헤더 '기본형 기준' / '확장형 기준' */}
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-current/10">
                {isExtended ? '확장형 기준' : '기본형 기준'}
              </span>
            </div>
            {/* docx §4 B-1 보조 문구 예시 — 2개 모두 노출 (기본형 모드) */}
            <div className="text-[10px] opacity-60 leading-relaxed">
              {isExtended
                ? '확장형 종합 점수 — 광고효과 + 유입 + 전환까지 포함'
                : '기본 스폰서십 광고효과 종합지수'}
            </div>
            {!isExtended && (
              <div className="text-[10px] opacity-50 leading-relaxed">
                미디어·콘텐츠·팬덤·선수성과 기준 산정
              </div>
            )}
          </div>
          {/* docx §4 B-1 상태 배지 + §11 매핑 룰 안내 (호버 툴팁) */}
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-full border cursor-help ${statusBadgeClass}`}
            title={
              '점수 상태 매핑 (docx §11):\n' +
              '· 공식 산정: 데이터 수집률 70% 이상\n' +
              '· 예비 산정: 데이터 수집률 40~69%\n' +
              '· 산정중: 데이터 수집률 40% 미만 (등급 보수적 처리)'
            }
          >
            {sum.statusLabel || '-'}
          </span>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            {/* docx §4 B-1 '종합 점수: 00 / 100' 형식 — 라벨 명시 */}
            <div className="text-[10px] font-bold opacity-70 mb-0.5">종합 점수</div>
            <div className="text-5xl font-black tabular-nums leading-none">
              {score != null ? score.toFixed(1) : '-'}
              {score != null && <span className="text-xl font-bold opacity-70 ml-1">/ 100</span>}
            </div>
            {/* docx §4 B-1 + §7 '산정 기준' — 헤더 + 안내문 + 4축(기본)/6축(확장) 가중치 + 총 100점 */}
            <div className="text-[10px] font-bold opacity-70 mt-2">📐 산정 기준 <span className="opacity-60">(총 100점)</span></div>
            <div className="text-[10px] opacity-60 mt-0.5">
              {isExtended
                ? '확장형 종합점수는 아래 6개 축을 반영'
                : '기본형 종합점수는 아래 4개 축만 반영'}
            </div>
            <div className="text-[11px] opacity-70 mt-0.5 leading-relaxed">
              {isExtended
                ? '미디어노출지수(20) · 콘텐츠 반응(15) · 팬덤지수(15) · 선수성과/대회가치(20) · 랜딩 유입(10) · 구매/전환/ROI(20)'
                : '미디어노출지수(30) · 콘텐츠 반응(20) · 팬덤지수(20) · 선수성과/대회가치(30) 가중 합산'}
            </div>
          </div>
          <div className="text-right">
            {/* docx §4 B-1 '등급: A / B / C / D / E' 형식 — 가능 옵션 안내 + 현재 등급 강조 */}
            <div className="text-[10px] font-bold opacity-70 mb-0.5">등급</div>
            <div className="text-4xl font-black leading-none">{grade ?? '-'}</div>
            <div className="text-[9px] opacity-50 mt-1">A · B · C · D · E</div>
          </div>
        </div>
        {/* === B-2. 보조 정보 카드 (docx §4 B-2 카드명 정확 일치) === */}
        <div className="mt-4 pt-3 border-t border-current/10">
          <div className="text-[10px] font-bold opacity-70 mb-2">📋 보조 정보 카드</div>
        </div>
        {/* B-2 보조 정보 4개 (docx §4 B-2 — 예시 형식 정확히 일치) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
          {/* docx §4 B-2 1) '현재 수집 완료된 데이터 비율 표시' 부연 설명 */}
          <AuxStat num={1} label="데이터 수집률" value={`${sum.collectionRate ?? 0}%`} hint="수집 완료 비율" />
          <AuxStat num={2} label="신뢰도" value={sum.reliabilityLabel ?? '-'} hint="높음/보통/낮음" />
          {/* 예: 2026.05.03 14:20 (날짜+시간) */}
          <AuxStat
            num={3}
            label="최근 업데이트"
            value={sum.updatedAt
              ? (() => {
                  const d = new Date(sum.updatedAt);
                  const yy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                  const dd = String(d.getDate()).padStart(2, '0');
                  const hh = String(d.getHours()).padStart(2, '0');
                  const mi = String(d.getMinutes()).padStart(2, '0');
                  return `${yy}.${mm}.${dd} ${hh}:${mi}`;
                })()
              : '-'}
          />
          {/* 예: 2026 WGTOUR 1차 / 2위 (대회명 + 순위) */}
          <AuxStat
            num={4}
            label="최근 성과"
            value={sum.latestPerformance?.eventName && sum.latestPerformance?.rank
              ? `${sum.latestPerformance.eventName} / ${sum.latestPerformance.rank}위`
              : sum.latestPerformance?.rank
              ? `${sum.latestPerformance.rank}위`
              : '-'}
          />
        </div>
        {/* 뷰 토글 */}
        <div className="mt-3 flex items-center justify-end gap-1 text-[10px]">
          <span className="opacity-60">대시보드 유형:</span>
          <button
            onClick={() => setViewMode('BASIC')}
            className={`px-2 py-1 rounded font-bold ${viewMode === 'BASIC' ? 'bg-white shadow text-slate-900' : 'opacity-50'}`}
          >
            기본형
          </button>
          <button
            onClick={() => setViewMode('EXTENDED')}
            className={`px-2 py-1 rounded font-bold ${viewMode === 'EXTENDED' ? 'bg-white shadow text-slate-900' : 'opacity-50'}`}
          >
            확장형
          </button>
        </div>
      </div>

      {/* === C. 핵심 성과 카드 영역 (docx §3 #3, §6 C 영역명 / 기본형 4개 카드) === */}
      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide pt-2">C. 핵심 성과 카드 영역 <span className="text-slate-400">(기본형 4종)</span></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
        {/* C-1. 미디어노출지수 — docx §6 C-1 '데이터 없을 때 상태 문구: 데이터 수집 전' */}
        <RoiCard
          title="📺 미디어노출지수"
          color="rose"
          score={roi.mediaExposure?.score}
          subtitle="방송/중계/외부노출 기준"
          purpose="선수가 실제 방송·중계·기사·하이라이트 등에서 얼마나 노출되었는지 보여주는 핵심 지표"
          emptyLabel="데이터 수집 전"
          metrics={[
            // docx §6 C-1 정확 라벨 — 횟수/수 등 단위 명시
            { label: '중계 노출 횟수', value: fmt(roi.mediaExposure?.broadcastCount) },
            { label: '중계 노출 시간', value: fmt(roi.mediaExposure?.broadcastSeconds, 'time') },
            { label: '패치/로고 노출 추정 횟수', value: fmt(roi.mediaExposure?.patchExposureEstimate) },
            { label: '기사/외부 언급 수', value: fmt(roi.mediaExposure?.articleMentions) },
            { label: '하이라이트 노출 수', value: fmt(roi.mediaExposure?.highlightCount) },
            { label: '출연 영상 (YT 자동)', value: roi.mediaExposure?.mentionVideos ? `${roi.mediaExposure.mentionVideos}건` : '-' },
          ]}
        />

        {/* C-2. 콘텐츠 반응 */}
        <RoiCard
          title="🎬 콘텐츠 반응"
          color="sky"
          score={roi.contentEngagement?.score}
          subtitle="SNS 및 콘텐츠 반응 기준"
          purpose="선수 관련 콘텐츠가 얼마나 주목받고 반응을 일으켰는지 보여줌"
          // YouTube 동기화 실패 시 docx §11 '오류: 데이터 확인 필요' 표시
          error={youtube?.syncStatus === 'FAILED' ? `YouTube 동기화 실패: ${youtube?.syncError || '알 수 없는 오류'}` : undefined}
          metrics={[
            { label: '조회수', value: fmt(roi.contentEngagement?.videoViews) },
            { label: '도달수 (구독자)', value: fmt(roi.contentEngagement?.reach) },
            { label: '좋아요', value: fmt(roi.contentEngagement?.likes) },
            { label: '댓글', value: fmt(roi.contentEngagement?.comments) },
            { label: '저장', value: fmt(roi.contentEngagement?.saves) },
            { label: '공유', value: fmt(roi.contentEngagement?.shares) },
            { label: '참여율 (ER)', value: roi.contentEngagement?.engagementRate != null ? `${roi.contentEngagement.engagementRate}%` : '-' },
          ]}
        />

        {/* C-3. 팬덤지수 */}
        <RoiCard
          title="💜 팬덤지수"
          color="violet"
          score={roi.fandom?.score}
          subtitle="팬 반응 및 참여 데이터 기준"
          purpose="선수의 팬 기반 규모와 반응성, 브랜드 친화력을 보여주는 지표"
          error={youtube?.syncStatus === 'FAILED' ? 'YouTube 동기화 실패 — 팔로워 정보 확인 필요' : undefined}
          metrics={[
            // docx §6 C-3 정확 라벨
            { label: '팔로워 수', value: fmt(roi.fandom?.followers) },
            { label: '최근 증가율', value: roi.fandom?.followerGrowthPct != null ? `${roi.fandom.followerGrowthPct}%` : '-' },
            { label: '팬 댓글/멘션 수', value: fmt(roi.fandom?.fanCommentsMentions) },
            { label: '응원/참여 이벤트 수', value: fmt(roi.fandom?.fanEvents) },
            { label: '팬 투표 참여율', value: roi.fandom?.voteParticipationRate != null ? `${roi.fandom.voteParticipationRate}%` : '-' },
            { label: 'UGC 건수', value: fmt(roi.fandom?.ugcCount) },
          ]}
        />

        {/* C-4. 선수성과 / 대회가치 */}
        <RoiCard
          title="🏆 선수성과 / 대회가치"
          color="emerald"
          score={roi.athletePerformance?.score}
          subtitle="공식 대회 기록 및 일정 기준"
          purpose="선수의 최근 경기력과 향후 대회 노출 기대치를 함께 반영"
          metrics={[
            // docx §6 C-4 정확 라벨
            { label: '최근 순위', value: roi.athletePerformance?.latestRank ? `${roi.athletePerformance.latestRank}위` : '-' },
            { label: '최근 3개 대회 평균 순위', value: roi.athletePerformance?.recentAvgRank != null ? `${roi.athletePerformance.recentAvgRank}위` : '-' },
            { label: '최근 대회명', value: roi.athletePerformance?.latestEventName || '-', truncate: true },
            { label: '다음 참가 예정 대회', value: roi.athletePerformance?.nextEvent?.name || '-', truncate: true },
            { label: '노출 기대지수', value: fmt(roi.athletePerformance?.exposureExpectation) },
          ]}
        />
      </div>

      {/* === D. 확장형 대시보드 추가 카드 구성 (docx §6 D / 중장기 계약 브랜드 전용) === */}
      {isExtended && (
        <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wide pt-2">
          D. 확장형 대시보드 추가 카드 구성 <span className="text-slate-400">(중장기 계약 브랜드 전용)</span>
        </div>
      )}
      {isExtended && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <RoiCard
            title="🎯 랜딩 유입"
            color="amber"
            score={roi.landingTraffic?.score}
            subtitle="브랜드 전용 트래킹 데이터 기준"
            purpose="노출이 실제 브랜드 페이지 방문으로 이어졌는지 보여주는 확장 지표"
            extendedBadge
            metrics={[
              // docx §6 D-1 정확 라벨
              { label: '클릭 수', value: fmt(roi.landingTraffic?.clicks) },
              { label: '방문 수', value: fmt(roi.landingTraffic?.visits) },
              { label: 'CTR', value: roi.landingTraffic?.ctr != null ? `${roi.landingTraffic.ctr}%` : '-' },
              { label: '신규 방문자 수', value: fmt(roi.landingTraffic?.newVisitors) },
              { label: '평균 체류시간', value: fmt(roi.landingTraffic?.avgDwellTime, 'time') },
            ]}
          />
          <RoiCard
            title="💰 구매 / 전환 / ROI"
            color="orange"
            score={roi.conversion?.score}
            subtitle="중장기 계약 브랜드 전용 성과지표"
            purpose="브랜드 입장에서 실제 매출성과를 보여주는 최종 퍼널 지표"
            extendedBadge
            metrics={[
              { label: '전환 수', value: fmt(roi.conversion?.conversions) },
              { label: '구매 건수', value: fmt(roi.conversion?.purchases) },
              { label: '매출액', value: fmt(roi.conversion?.revenue, 'currency') },
              { label: '쿠폰 사용량', value: fmt(roi.conversion?.couponUsage) },
              { label: 'CVR', value: roi.conversion?.cvr != null ? `${roi.conversion.cvr}%` : '-' },
              { label: 'CAC', value: fmt(roi.conversion?.cac, 'currency') },
              { label: 'ROAS', value: fmt(roi.conversion?.roas) },
            ]}
          />
        </div>
      )}
      {!isExtended && (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            🔒 <strong className="text-slate-700">랜딩 유입</strong>·<strong className="text-slate-700">구매/전환/ROI</strong> 카드는 중장기 계약 브랜드 전용 리포트에서 제공됩니다.
          </div>
          <button
            onClick={() => setViewMode('EXTENDED')}
            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700"
          >
            확장형 미리보기 →
          </button>
        </div>
      )}

      <div className="text-[10px] text-slate-400 text-right">
        ※ "-" 표시 = 아직 수집되지 않은 지표 (데이터 들어오면 자동 반영)
        {/* G 섹션은 페이지 최하단 (F 경기결과 이후) 별도 위치 — docx §13 순서 준수 */}
      </div>
    </div>
  );
}

/**
 * G. 점수 산정 기준 + 데이터 출처 (docx §10, §13)
 * - 페이지 최하단 (F 경기결과 이후)에 별도 섹션으로 배치
 */
function ScoringAndDataSources({ roi, viewMode }: { roi: any; viewMode: 'BASIC' | 'EXTENDED' }) {
  if (!roi) return null;
  const isExtended = viewMode === 'EXTENDED';
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-12">
      {/* docx §10 G. '점수 산정 기준 안내' 정확 영역명 + G-3 '데이터 출처' */}
      <h2 className="text-xl font-extrabold text-slate-900 mb-2 inline-flex items-center gap-2">
        <Trophy className="w-5 h-5 text-emerald-500" />
        G. 점수 산정 기준 안내 / 데이터 출처
      </h2>
      {/* docx §10 G. '이 영역은 반드시 넣는 것을 권장한다 / 브랜드가 점수를 신뢰하려면 무엇으로 계산된 점수인지를 알아야 하기 때문' */}
      <p className="text-[11px] text-slate-500 mb-4">
        📌 브랜드가 점수를 신뢰하려면 "무엇으로 계산된 점수인지"를 알아야 합니다.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <h3 className="text-sm font-extrabold text-slate-900 mb-2">📐 {isExtended ? '확장형' : '기본형'} 점수 산정 기준</h3>
          <div className="space-y-1.5 text-[11px]">
            {(isExtended ? roi.scoringRules?.extended : roi.scoringRules?.basic)?.map((r: any) => (
              <div key={r.axis} className="flex items-center justify-between">
                <span className="text-slate-600">{r.axis}</span>
                <span className="font-bold text-slate-900">{r.weight}%</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-3">
            {isExtended
              ? '중장기 계약 브랜드에 한해 확장 성과지표가 제공됩니다.'
              : '대회별 기본 입찰 및 직접 구매형 스폰서십에 제공되는 기본 광고효과 지표입니다. 랜딩 유입 및 구매전환 데이터는 중장기 계약 브랜드 전용 리포트에서 제공됩니다.'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          {/* docx §10 G-3 정확 카드명 '데이터 출처 카드' */}
          <h3 className="text-sm font-extrabold text-slate-900 mb-2">📦 데이터 출처 카드</h3>
          <div className="space-y-1.5 text-[11px]">
            {roi.dataSources?.map((s: any) => (
              <div key={s.code} className="flex items-center justify-between">
                <span className="text-slate-600">{s.name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  s.status === 'OK' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                }`}>
                  {s.status === 'OK' ? '연결됨' : '미수집'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* docx §11 점수 상태값 매핑 룰 안내 — 사용자가 점수 신뢰도 기준을 알 수 있도록 */}
      <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
        <div className="text-[11px] font-bold text-slate-700 mb-1.5">📊 점수 상태값 산정 기준 (docx §11)</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
          <div className="flex items-center gap-2">
            <span className="inline-block px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">공식 산정</span>
            <span className="text-slate-600">데이터 수집률 70% 이상</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">예비 산정</span>
            <span className="text-slate-600">40~69%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 font-bold">산정중</span>
            <span className="text-slate-600">40% 미만 · 등급 보수적 처리</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/** ROI 카드 — 영역 점수 + 지표 목록 */
function RoiCard({
  title, color, score, subtitle, purpose, metrics, extendedBadge, error, emptyLabel,
}: {
  title: string;
  color: 'rose' | 'sky' | 'violet' | 'emerald' | 'amber' | 'orange';
  score?: number | null;
  subtitle?: string;
  purpose?: string;   // docx §6 카드별 '목적' 명시 설명문 (호버 툴팁 + ? 아이콘)
  metrics: { label: string; value: string; truncate?: boolean }[];
  extendedBadge?: boolean;
  error?: string | null;  // docx §11 — 오류 상태: "데이터 확인 필요"
  emptyLabel?: string;    // docx §6 카드별 '데이터 없을 때 상태 문구' (예: C-1 '데이터 수집 전')
}) {
  const colorMap: Record<string, { border: string; bg: string; scoreText: string }> = {
    rose: { border: 'border-rose-200', bg: 'bg-rose-50/30', scoreText: 'text-rose-700' },
    sky: { border: 'border-sky-200', bg: 'bg-sky-50/30', scoreText: 'text-sky-700' },
    violet: { border: 'border-violet-200', bg: 'bg-violet-50/30', scoreText: 'text-violet-700' },
    emerald: { border: 'border-emerald-200', bg: 'bg-emerald-50/30', scoreText: 'text-emerald-700' },
    amber: { border: 'border-amber-200', bg: 'bg-amber-50/30', scoreText: 'text-amber-700' },
    orange: { border: 'border-orange-200', bg: 'bg-orange-50/30', scoreText: 'text-orange-700' },
  };
  const c = colorMap[color];
  return (
    <div className={`border rounded-2xl p-4 ${c.border} ${c.bg}`}>
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
          {/* docx §6 카드별 '목적' 명시 설명문 — ? 아이콘 호버 툴팁 */}
          {purpose && (
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-600 text-[9px] font-bold cursor-help"
              title={`📌 카드 목적 (docx §6)\n${purpose}`}
              aria-label={`카드 목적: ${purpose}`}
            >
              ?
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {error && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200" title={error}>
              ⚠ 데이터 확인 필요
            </span>
          )}
          {extendedBadge && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
              확장 전용
            </span>
          )}
        </div>
      </div>
      {/* docx §6 - 목적 설명문 (있으면 subtitle 위에 표시) */}
      {purpose && <p className="text-[10px] text-slate-600 mb-1 leading-relaxed">📌 {purpose}</p>}
      {subtitle && <p className="text-[10px] text-slate-500 mb-2">{subtitle}</p>}
      <div className="flex items-baseline gap-2 mb-3 pb-2 border-b border-current/10">
        <span className="text-[10px] text-slate-500">영역 점수</span>
        <span className={`text-2xl font-black tabular-nums ${score == null ? 'text-slate-400' : c.scoreText}`}>
          {score != null ? score.toFixed(1) : '-'}
        </span>
        {score != null && <span className="text-[10px] text-slate-400">/100</span>}
        {score == null && (
          <span className="text-[9px] text-slate-400 italic ml-auto">📡 {emptyLabel || '수집 준비 중'}</span>
        )}
      </div>
      <div className="space-y-1.5">
        {metrics.map((m) => {
          // docx 11. 상태값 처리 — 미수집 항목은 "-" 대신 의미있는 라벨 (옵션)
          const isEmpty = m.value === '-' || m.value === '' || m.value == null;
          return (
            <div key={m.label} className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500">{m.label}</span>
              <span className={`text-xs font-bold ${isEmpty ? 'text-slate-400' : 'text-slate-900'} ${m.truncate ? 'truncate max-w-[140px]' : ''}`}>
                {m.value}
              </span>
            </div>
          );
        })}
      </div>
      {/* 모든 지표 미수집 시 docx §11 '수집 준비 중' (또는 카드별 명시 라벨, 예: C-1 '데이터 수집 전') */}
      {metrics.every(m => m.value === '-' || !m.value) && (
        <div className="mt-3 pt-2 border-t border-current/10 text-[10px] text-center text-slate-400">
          📡 {emptyLabel || '수집 준비 중'}
        </div>
      )}
    </div>
  );
}

/** 보조 정보 (수집률/신뢰도/업데이트/최근성과) */
function AuxStat({ label, value, hint, num }: { label: string; value: string; hint?: string; num?: number }) {
  return (
    <div className="text-center" title={hint || undefined}>
      {/* docx §4 B-2 — '1)' '2)' '3)' '4)' 번호 매기기 (있을 때) */}
      <div className="opacity-60 mb-0.5">
        {num != null && <span className="opacity-50">{num}) </span>}{label}
      </div>
      <div className="font-bold text-[12px] truncate">{value}</div>
      {hint && <div className="opacity-40 text-[8px] truncate">{hint}</div>}
    </div>
  );
}

/**
 * 경기결과 — 연도별 그룹핑 + 같은 연도 내 최신순 (docx 3-6 + §9 F)
 * docx §9 각 대회별 표시 항목: 순위 / 대회명 / 개최일 / 투어명 / 스코어 / 분석 코멘트
 *  - 투어명은 r.tour > fallbackTour(선수.tour) 순으로 표시
 */
function EventResultsByYear({ results, fallbackTour }: { results: any[]; fallbackTour?: string }) {
  // 연도별 그룹
  const byYear = useMemo(() => {
    const map = new Map<number, any[]>();
    for (const r of results) {
      const y = new Date(r.eventDate).getFullYear();
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(r);
    }
    // 각 연도 내에서 최신순 정렬
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
    }
    // 연도 내림차순
    return Array.from(map.entries()).sort(([a], [b]) => b - a);
  }, [results]);

  return (
    <div className="space-y-4">
      {byYear.map(([year, items]) => (
        <div key={year}>
          <h3 className="text-sm font-extrabold text-emerald-700 mb-2 inline-flex items-center gap-1">
            {year}년 <span className="text-[10px] text-slate-400 font-normal">({items.length}개)</span>
          </h3>
          <div className="space-y-1.5">
            {items.map((r: any) => (
              <div key={r.id} className="flex items-start gap-3 py-2 px-3 bg-slate-50 hover:bg-emerald-50/30 rounded-lg transition-colors">
                {/* 순위 */}
                <div className="w-12 text-center">
                  {r.rank != null ? (
                    <div className={`text-lg font-extrabold ${r.rank === 1 ? 'text-amber-500' : r.rank <= 3 ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {r.rank}{r.rank === 1 ? '위' : r.rank <= 10 ? '위' : ''}
                    </div>
                  ) : (
                    <div className="text-base text-slate-400">-</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">{r.eventName}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span>{new Date(r.eventDate).toLocaleDateString('ko-KR')}</span>
                    {/* docx §9 — 투어명 (r.tour > 선수 tour fallback) */}
                    {(r.tour || fallbackTour) && (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold text-[9px]">
                        🏌️ {r.tour || fallbackTour}
                      </span>
                    )}
                    {r.category && <span className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-600">{r.category}</span>}
                    {r.source !== 'MANUAL' && (
                      <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded">{r.source}</span>
                    )}
                  </div>
                  {/* docx §9 F 표시 항목 - '분석 코멘트' 명시 라벨 */}
                  {r.summary && (
                    <div className="mt-1 flex items-start gap-1">
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 mt-0.5">분석 코멘트</span>
                      <p className="text-xs text-slate-600 line-clamp-2 flex-1">{r.summary}</p>
                    </div>
                  )}
                </div>
                {r.score && (
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">스코어</div>
                    <div className="text-sm font-bold text-slate-900">{r.score}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center bg-slate-50 rounded-lg p-3">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-lg font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

function formatRemaining(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (d > 0) return `${d}일 ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  return new Date(iso).toLocaleDateString('ko-KR');
}

function maskBrand(name?: string): string {
  if (!name) return '익명';
  if (name.length <= 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name.slice(-1);
}
