/**
 * 공개 선수 상세 페이지 (/athletes/:id) — 전체 프로필
 *
 * 2026-09-15 시안 적용:
 *   상단 히어로 = 사진 · 이름/칩/기본정보 · 3지표(팬온도/최근 5경기 평균 순위/SPONPIK INDEX) · INDEX 레이더 · 공유/관심
 *   탭 5개 = 요약 / 대회 성과 / 활동 / 후원 가능 슬롯 / 브랜드 협업 이력 (직접 PICK 선수정보 팝업과 같은 구성)
 *   하단 = 전체 프로필 공유하기 / 전체 프로필 다운로드(PDF) / 이 선수 PICK
 *
 * 원칙:
 *   - 모든 값 실데이터. 측정되지 않은 값은 "집계 중"/"확인 필요"로 두고 추정치를 쓰지 않는다 (LEG-06)
 *   - 팬온도는 실력 점수가 아니라는 고정 문구를 항상 붙인다 (§11.4)
 *   - 후원 가능 슬롯 탭은 통합 구매화면(UnifiedPurchase)과 진행 중 경매를 그대로 쓴다
 */

import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight, Trophy, Instagram, Gavel, Clock, TrendingUp, AlertCircle, Users, Calendar, MapPin,
  Heart, Share2, Download, Flame, BarChart3, Info, ChevronRight, Home, Cake, Ruler, GraduationCap,
  Building2, BadgeCheck, Activity, AtSign, Flag, Camera, Presentation, PartyPopper, Youtube, Check,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuctionSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import LegalNotice from '../components/LegalNotice';
import UnifiedPurchase from '../components/purchase/UnifiedPurchase';
import PublicHeader from '../components/PublicHeader';
import AthleteFanPanel from '../components/athlete/AthleteFanPanel';
import { FAN_TEMP_NOTE } from '../components/fanhub/FanKit';

// 빈 값 → '-' 표기 헬퍼
const dash = (v: any, suffix = ''): string => {
  if (v == null || v === '' || (typeof v === 'number' && isNaN(v))) return '-';
  return `${v}${suffix}`;
};
const dashKRW = (v: any): string => {
  if (v == null || v === '' || isNaN(Number(v))) return '-';
  return `₩${Number(v).toLocaleString()}`;
};
// SlotGrade enum → 표시용 (A_PLUS → A+)
const fmtGrade = (g?: string | null): string | null => (g ? g.replace('A_PLUS', 'A+') : null);

/** 탭 — 직접 PICK 선수정보 팝업과 같은 5구간. 예전 ?tab= 값은 아래에서 대응시킨다 */
type ProfileTab = 'summary' | 'results' | 'activity' | 'slots' | 'brands';
const TABS: { key: ProfileTab; label: string }[] = [
  { key: 'summary', label: '요약' },
  { key: 'results', label: '대회 성과' },
  { key: 'activity', label: '활동' },
  { key: 'slots', label: '후원 가능 슬롯' },
  { key: 'brands', label: '브랜드 협업 이력' },
];
const LEGACY_TAB: Record<string, ProfileTab> = {
  profile: 'summary', games: 'results', sponsor: 'slots', fan: 'activity', content: 'activity',
};

const ACTIVITY_LABELS: Record<string, string> = {
  tour1: '대회 출전', tour2: '2부 투어', gtour: 'G투어', lesson: '레슨',
  proAm: '프로암', sns: 'SNS 콘텐츠', youtube: '유튜브', etc: '기타',
};

export default function PublicAthleteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const [sp, setSp] = useSearchParams();
  const rawTab = sp.get('tab') || '';
  const tab: ProfileTab = (TABS.some((t) => t.key === rawTab) ? rawTab : LEGACY_TAB[rawTab] || 'summary') as ProfileTab;
  const setTab = (t: ProfileTab) => {
    const next = new URLSearchParams(sp);
    next.set('tab', t);
    setSp(next, { replace: true });
  };

  // ROI 대시보드 view mode (BASIC/EXTENDED)
  const [roiViewMode, setRoiViewMode] = useState<'BASIC' | 'EXTENDED'>('BASIC');

  const { data: resp, isLoading, error } = useQuery({
    queryKey: ['public-athlete', id],
    queryFn: () => api.getPublicAthlete(id!),
    enabled: !!id,
  });

  // 기간별 슬롯 인벤토리 (통합 구매화면 데이터 소스)
  const { data: invResp, isLoading: inventoryLoading } = useQuery({
    queryKey: ['public-athlete-inventory', id],
    queryFn: () => api.getAthleteInventory(id!),
    enabled: !!id,
  });
  const inventorySlots: any[] = (invResp?.data as any)?.slots || [];

  // ROI 대시보드 — SPONPIK INDEX 5축의 출처
  const { data: roiResp } = useQuery({
    queryKey: ['public-athlete-roi', id],
    queryFn: () => api.getPublicAthleteRoiDashboard(id!),
    enabled: !!id,
  });
  const roi = (roiResp?.data as any) || null;

  // 팬온도 (최근 30일 팬 활동 신호)
  const { data: tempResp } = useQuery({
    queryKey: ['fan-temperature', id],
    queryFn: () => api.getFanTemperature(id!),
    enabled: !!id,
    retry: 0,
  });
  const fanTemp: any = tempResp?.data || null;

  const { data: ytResp } = useQuery({
    queryKey: ['public-athlete-youtube', id],
    queryFn: () => api.getYoutubeAthleteAggregate(id!),
    enabled: !!id,
  });
  const youtube = (ytResp?.data as any) || null;

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

  // 슬롯 정렬: 관리자 slotOrder → 상태 → 등록순
  const orderedSlots = useMemo(() => {
    return [...slotInstances].sort((a, b) => {
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

  const auctionSlots = useMemo(
    () => orderedSlots.filter((s) => s.auction && ['LIVE', 'SCHEDULED'].includes(s.auction.status)),
    [orderedSlots]
  );

  const [selectedSlotId, setSelectedSlotId] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (auctionSlots.length > 0 && !auctionSlots.some((s) => s.id === selectedSlotId)) {
      setSelectedSlotId(auctionSlots[0].id);
    }
  }, [auctionSlots, selectedSlotId]);

  const athleteName = (resp?.data as any)?.athlete?.name;
  useEffect(() => {
    const prev = document.title;
    document.title = athleteName ? `${athleteName} 프로 - 선수 프로필 | SPONPIK` : '선수 프로필 | SPONPIK';
    return () => { document.title = prev; };
  }, [athleteName]);

  // `/athletes/<id>#slots` 로 들어오면 후원 가능 슬롯 탭으로
  useEffect(() => {
    if (window.location.hash !== '#slots') return;
    setTab('slots');
    let tries = 0;
    const timer = setInterval(() => {
      const el = document.querySelector('[data-section="purchase"]');
      if (el) {
        clearInterval(timer);
        el.scrollIntoView({ behavior: 'auto', block: 'start' });
      } else if (++tries > 40) {
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [id]);

  const selectedSlot = auctionSlots.find((s) => s.id === selectedSlotId) || auctionSlots[0];
  const auction = selectedSlot?.auction;

  useAuctionSocket(auction?.id, {
    onBidPlaced: () => { queryClient.invalidateQueries({ queryKey: ['public-athlete', id] }); },
    onAuctionExtended: () => queryClient.invalidateQueries({ queryKey: ['public-athlete', id] }),
    onAuctionStatus: () => queryClient.invalidateQueries({ queryKey: ['public-athlete', id] }),
  });

  /* ── 관심 선수 (팬 계정) ── */
  const { data: favResp } = useQuery({
    queryKey: ['fan-favorites'],
    queryFn: () => api.getFavorites(),
    enabled: isAuthenticated && user?.role === 'FAN',
    retry: 0,
  });
  const favFromServer = useMemo(() => {
    const list: any[] = (favResp?.data as any)?.athletes || [];
    return list.some((f) => (f.athleteId ?? f.athlete?.id ?? f.id) === id);
  }, [favResp, id]);
  const [favLocal, setFavLocal] = useState<boolean | null>(null);
  const fav = favLocal ?? favFromServer;
  const favMut = useMutation({
    mutationFn: (on: boolean) => (on ? api.removeFavoriteAthlete(id!) : api.addFavoriteAthlete(id!)),
    onMutate: (on) => setFavLocal(!on),
    onError: (e: any, on) => {
      if (e?.response?.status === 409) { setFavLocal(true); return; }
      setFavLocal(on);
      alert(e?.response?.data?.error?.message || '관심 선수 처리에 실패했습니다.');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fan-favorites'] }),
  });
  const onFavorite = () => {
    if (!isAuthenticated) return navigate('/login');
    if (user?.role && user.role !== 'FAN') { alert('관심 선수 등록은 팬 계정에서 이용할 수 있습니다.'); return; }
    if (!favMut.isPending) favMut.mutate(fav);
  };

  /* ── 공유 / PDF ── */
  const [copied, setCopied] = useState(false);
  const onShare = async () => {
    const url = window.location.origin + `/athletes/${id}`;
    const title = `${athlete?.name} 프로 | SPONPIK`;
    try {
      if (navigator.share) { await navigator.share({ title, url }); return; }
    } catch { /* 사용자가 취소 */ return; }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { window.prompt('아래 주소를 복사하세요', url); }
  };
  const onPdf = () => window.print();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">로딩 중...</div>;
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
  const act = (athlete.activityFields || {}) as Record<string, boolean>;
  const hasActivityData = Object.keys(act).length > 0;
  const activityLabels = Object.entries(act).filter(([, v]) => v).map(([k]) => ACTIVITY_LABELS[k] || k);

  /* 경기 — 최근 5경기 평균 순위 + 직전 5경기 대비 변화 (모두 실측 결과 기반) */
  const ranked = [...eventResults]
    .filter((r) => r.rank != null)
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  const recent5 = ranked.slice(0, 5);
  const prev5 = ranked.slice(5, 10);
  const avg = (xs: any[]) => (xs.length ? xs.reduce((s, r) => s + Number(r.rank), 0) / xs.length : null);
  const avgRank = avg(recent5);
  const prevAvgRank = prev5.length === 5 ? avg(prev5) : null;
  const rankDelta = avgRank != null && prevAvgRank != null ? Math.round(prevAvgRank - avgRank) : null; // +면 순위 상승
  const rankSpark = recent5.length >= 2 ? [...recent5].reverse().map((r) => Math.max(0, 100 - Number(r.rank) * 2)) : null;

  /* 팬온도 — 표본이 충분할 때만 숫자 */
  const tempScore = fanTemp?.score != null && fanTemp.score > 0 && !fanTemp.lowSample ? Number(fanTemp.score) : null;
  const tempDelta = tempScore != null && fanTemp?.windowDelta != null ? Number(fanTemp.windowDelta) : null;
  const tempSpark = tempScore != null && Array.isArray(fanTemp?.history) && fanTemp.history.length >= 2
    ? fanTemp.history.slice(-8).map((h: any) => Number(h.score)) : null;

  /* SPONPIK INDEX — ROI 대시보드 종합 점수 + 5축 */
  const index: number | null = roi?.summary?.basicScore ?? roi?.summary?.score ?? null;
  const axes = [
    { label: '경기력', value: roi?.athletePerformance?.score ?? null },
    { label: '팬반응', value: roi?.fandom?.score ?? null },
    { label: '콘텐츠성', value: roi?.contentEngagement?.score ?? null },
    { label: '브랜드 적합도', value: roi?.mediaExposure?.score ?? null },
    { label: '활동성', value: roi?.activity?.score ?? (hasActivityData ? Math.min(100, activityLabels.length * 20) : null) },
  ];

  /* 주요 이력 — 없으면 수상/경력에서 폴백 */
  const highlights: string[] = Array.isArray(athlete.highlights) ? athlete.highlights : [];
  const careerList = highlights.length > 0 ? highlights : [
    ...(athlete.awards ? String(athlete.awards).split(' · ') : []),
    ...(athlete.career ? String(athlete.career).split(' · ') : []),
  ].filter(Boolean);

  const birthYear = (() => { const m = String(athlete.birthDate || '').match(/(\d{4})/); return m ? m[1] : null; })();
  const birthLabel = (() => {
    const m = String(athlete.birthDate || '').match(/(\d{4})[.](\d{1,2})[.](\d{1,2})/);
    return m ? `${m[1]}년 ${Number(m[2])}월 ${Number(m[3])}일` : athlete.birthDate || null;
  })();
  const chips = [
    athlete.tour,
    ...String(athlete.tourQualification || '').split(/\s*[·,/]\s*/).filter(Boolean),
    athlete.region ? String(athlete.region).split(' ')[0] : null,
  ].filter((v, i, arr) => v && arr.indexOf(v) === i) as string[];
  const insta = social.instagram ? String(social.instagram).replace(/^@/, '') : null;
  const sns = (athlete.snsStats || {}) as Record<string, string>;

  const pickTo = `/sponsor/direct/build/${athlete.id}`;

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24 lg:pb-0 print:pb-0">
      <div className="print:hidden"><PublicHeader /></div>

      {/* 브레드크럼 */}
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-4 flex items-center justify-between gap-3 print:hidden">
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[12.5px] text-slate-500 min-w-0">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-slate-800 shrink-0"><Home className="w-3.5 h-3.5" /> 홈</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <Link to="/athletes" className="hover:text-slate-800 shrink-0">선수</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="font-bold text-slate-700 truncate">{athlete.name} 프로</span>
        </nav>
        <p className="hidden sm:block text-right text-[10px] tracking-[0.18em] text-slate-400 leading-4 shrink-0">
          ATHLETE&nbsp;&nbsp;BRAND&nbsp;&nbsp;FAN<br />FOR A BRIGHTER TOMORROW
        </p>
      </div>

      {/* ═══ 히어로 ═══ */}
      <section className="max-w-[1180px] mx-auto px-4 sm:px-6 mt-3">
        <div className="rounded-3xl bg-gradient-to-br from-[#eefaf3] via-[#f2fbf6] to-[#e6f6ee] border border-emerald-100/70 p-4 sm:p-6 lg:p-7">
          <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)_268px] lg:gap-7 items-start">

            {/* 사진 (모바일: 사진 + 이름 나란히) */}
            <div className="flex gap-3 lg:block">
              <div className="relative w-[128px] sm:w-[180px] lg:w-full aspect-[3/4] lg:aspect-[300/330] rounded-2xl overflow-hidden bg-emerald-100 shrink-0">
                {athlete.profileImageUrl ? (
                  <img src={athlete.profileImageUrl} alt={athlete.name} className="w-full h-full object-cover object-top" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl font-extrabold text-emerald-300">{athlete.name.charAt(0)}</div>
                )}
                <p aria-hidden className="hidden lg:block absolute left-4 bottom-4 font-script text-white text-[26px] leading-[1.05] drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
                  Play<br />Create<br />More Value
                </p>
              </div>
              {/* 모바일 이름 블록 */}
              <div className="lg:hidden min-w-0 flex-1">
                {athlete.isRecommended && <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10.5px] font-extrabold">추천 선수</span>}
                <div className="mt-1 flex items-center gap-1.5">
                  <h1 className="text-[22px] font-extrabold leading-tight truncate">{athlete.name} <span className="text-[13px] font-bold text-emerald-700">프로</span></h1>
                  <button onClick={onFavorite} aria-pressed={fav} aria-label="관심 선수" className={`w-8 h-8 rounded-full border inline-flex items-center justify-center shrink-0 ${fav ? 'border-rose-200 text-rose-500 bg-rose-50' : 'border-slate-200 text-slate-400 bg-white'}`}>
                    <Heart className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {chips.map((c) => <span key={c} className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[11.5px] font-bold text-slate-700">{c}</span>)}
                </div>
                <ul className="mt-2 space-y-1 text-[12px] text-slate-600">
                  {birthYear && <li className="flex items-center gap-1.5"><Cake className="w-3.5 h-3.5 text-slate-400" /> {birthYear}년생{athlete.height ? <><span className="text-slate-300">|</span><Ruler className="w-3.5 h-3.5 text-slate-400" /> {athlete.height}cm</> : null}</li>}
                  {athlete.education && <li className="flex items-center gap-1.5 truncate"><GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span className="truncate">{athlete.education}</span></li>}
                  {athlete.affiliation && <li className="flex items-center gap-1.5 truncate"><Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span className="truncate">{athlete.affiliation}</span></li>}
                  {athlete.region && <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> 활동지역 {athlete.region}</li>}
                </ul>
                <div className="mt-3 flex gap-2">
                  <button onClick={onFavorite} className={`h-9 px-3 flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border text-[12.5px] font-bold ${fav ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-emerald-200 bg-white text-emerald-700'}`}>
                    <Heart className={`w-3.5 h-3.5 ${fav ? 'fill-current' : ''}`} /> {fav ? '관심선수 등록됨' : '관심선수'}
                  </button>
                  <button onClick={onShare} aria-label="공유하기" className="h-9 w-11 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 데스크톱 이름 · 칩 · 기본정보 · 3지표 */}
            <div className="min-w-0">
              <div className="hidden lg:block">
                {athlete.isRecommended && <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[11.5px] font-extrabold">추천 선수</span>}
                <div className="mt-2 flex items-center gap-3">
                  <h1 className="text-[34px] font-extrabold leading-none tracking-tight">{athlete.name} <span className="text-[16px] font-bold text-emerald-700">프로</span></h1>
                  <button onClick={onFavorite} aria-pressed={fav} aria-label="관심 선수" className={`w-9 h-9 rounded-full border inline-flex items-center justify-center ${fav ? 'border-rose-200 text-rose-500 bg-rose-50' : 'border-slate-200 text-slate-400 bg-white hover:text-rose-400'}`}>
                    <Heart className={`w-[18px] h-[18px] ${fav ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {chips.map((c) => <span key={c} className="px-3 py-1 rounded-full bg-white border border-slate-200 text-[12.5px] font-bold text-slate-700">{c}</span>)}
                </div>
                <ul className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-600">
                  {birthYear && <li className="inline-flex items-center gap-1.5"><Cake className="w-4 h-4 text-slate-400" /> {birthYear}년생</li>}
                  {athlete.height && <li className="inline-flex items-center gap-1.5 before:content-['|'] before:text-slate-300 before:mr-1.5"><Ruler className="w-4 h-4 text-slate-400" /> {athlete.height}cm</li>}
                  {athlete.education && <li className="inline-flex items-center gap-1.5 before:content-['|'] before:text-slate-300 before:mr-1.5"><GraduationCap className="w-4 h-4 text-slate-400" /> {athlete.education}</li>}
                  {athlete.affiliation && <li className="inline-flex items-center gap-1.5 before:content-['|'] before:text-slate-300 before:mr-1.5"><Building2 className="w-4 h-4 text-slate-400" /> {athlete.affiliation} 소속</li>}
                  {athlete.region && <li className="inline-flex items-center gap-1.5 before:content-['|'] before:text-slate-300 before:mr-1.5"><MapPin className="w-4 h-4 text-slate-400" /> 활동지역 {athlete.region}</li>}
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:mt-5">
                <HeroStat
                  icon={<Flame className="w-5 h-5 text-emerald-600" />}
                  label="팬온도"
                  value={tempScore != null ? `${tempScore.toFixed(1)}℃` : null}
                  delta={tempDelta}
                  deltaUnit=""
                  pct={tempScore != null ? Math.min(100, tempScore) : null}
                  spark={tempSpark}
                  note={FAN_TEMP_NOTE}
                />
                <HeroStat
                  icon={<Trophy className="w-5 h-5 text-emerald-600" />}
                  label="최근 5경기 평균 순위"
                  shortLabel="평균 순위"
                  value={avgRank != null ? `${Math.round(avgRank)}위` : null}
                  delta={rankDelta}
                  deltaUnit=""
                  pct={avgRank != null ? Math.max(8, 100 - avgRank * 2) : null}
                  spark={rankSpark}
                  emptyLabel="성적 확인 필요"
                />
                <HeroStat
                  icon={<BarChart3 className="w-5 h-5 text-emerald-600" />}
                  label="SPONPIK INDEX"
                  shortLabel="인덱스"
                  value={index != null ? String(Math.round(index)) : null}
                  delta={null}
                  pct={index != null ? Math.min(100, index) : null}
                  spark={null}
                />
              </div>
            </div>

            {/* 우측: 공유/관심 · INDEX 레이더 */}
            <div className="space-y-3">
              <div className="hidden lg:grid grid-cols-2 gap-2 print:hidden">
                <button onClick={onShare} className="h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-[13.5px] font-bold text-slate-700 hover:border-slate-400">
                  {copied ? <><Check className="w-4 h-4 text-emerald-600" /> 복사됨</> : <><Share2 className="w-4 h-4" /> 공유하기</>}
                </button>
                <button onClick={onFavorite} className={`h-11 inline-flex items-center justify-center gap-1.5 rounded-xl text-[13.5px] font-bold ${fav ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                  <Heart className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} /> {fav ? '관심선수 등록됨' : '관심선수'}
                </button>
              </div>
              <div className="hidden lg:block"><IndexCard axes={axes} /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 탭 ═══ */}
      <nav aria-label="선수 프로필 구간" className="max-w-[1180px] mx-auto px-4 sm:px-6 mt-5 print:hidden">
        <ul role="tablist" className="flex gap-1 sm:gap-2 overflow-x-auto border-b border-slate-200">
          {TABS.map((t) => {
            const on = tab === t.key;
            return (
              <li key={t.key} className="shrink-0">
                <button
                  role="tab"
                  aria-selected={on}
                  onClick={() => setTab(t.key)}
                  className={`h-11 px-3 sm:px-5 text-[13.5px] sm:text-[15px] font-bold border-b-[3px] -mb-px whitespace-nowrap transition-colors ${on ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                  {t.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ═══ 요약 ═══ */}
      {tab === 'summary' && (
        <section className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-5 grid gap-4 lg:grid-cols-3">
          {/* 모바일: 인덱스 레이더는 탭 아래 요약 첫 칸 (시안) */}
          <div className="lg:hidden"><IndexCard axes={axes} /></div>
          {/* 선수 소개 */}
          <div>
            <h2 className="text-[17px] font-extrabold">선수 소개</h2>
            <p className="mt-2 text-[13.5px] text-slate-600 leading-relaxed break-keep">
              {athlete.bio || '등록된 소개가 없습니다.'}
            </p>
            <dl className="mt-3 rounded-2xl border border-slate-200 divide-y divide-slate-100">
              <InfoRow icon={<Cake className="w-3.5 h-3.5" />} k="생년월일" v={birthLabel} />
              <InfoRow icon={<Ruler className="w-3.5 h-3.5" />} k="신장" v={athlete.height ? `${athlete.height}cm` : null} />
              <InfoRow icon={<Building2 className="w-3.5 h-3.5" />} k="소속" v={athlete.affiliation} />
              <InfoRow icon={<GraduationCap className="w-3.5 h-3.5" />} k="학력" v={athlete.education} />
              <InfoRow icon={<BadgeCheck className="w-3.5 h-3.5" />} k="회원구분" v={athlete.tourQualification || athlete.tour} />
              <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} k="활동지역" v={athlete.region} />
              <InfoRow icon={<Activity className="w-3.5 h-3.5" />} k="주요활동" v={activityLabels.length ? activityLabels.join(' · ') : null} />
              <InfoRow icon={<AtSign className="w-3.5 h-3.5" />} k="SNS" v={insta ? <a href={`https://instagram.com/${insta}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-slate-800 hover:text-pink-600"><Instagram className="w-3.5 h-3.5 text-pink-500" /> @{insta}</a> : null} />
            </dl>
          </div>

          {/* 주요 대회 성과 */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-extrabold">주요 대회 성과</h2>
              <button onClick={() => setTab('results')} className="h-8 px-3 rounded-lg border border-slate-200 text-[12.5px] font-bold text-slate-600 hover:border-slate-400">더보기</button>
            </div>
            {careerList.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-slate-200 p-5 text-center text-[13px] text-slate-500 break-keep">등록된 대회 성과가 아직 없습니다.<span className="block mt-1 text-[12px]">확인되지 않은 정보는 표시하지 않습니다.</span></p>
            ) : (
              <ul className="mt-3 space-y-2">
                {careerList.slice(0, 6).map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13.5px] text-slate-700 leading-snug break-keep">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" /> {h}
                  </li>
                ))}
              </ul>
            )}
            {roi?.matchAnalysis && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniStat label="시즌 최고" value={roi.matchAnalysis.seasonBestRank != null ? `${roi.matchAnalysis.seasonBestRank}위` : null} />
                <MiniStat label="TOP 10" value={roi.matchAnalysis.seasonTop10Count != null ? `${roi.matchAnalysis.seasonTop10Count}회` : null} />
                <MiniStat label="시즌 출전" value={roi.matchAnalysis.seasonTotalEvents != null ? `${roi.matchAnalysis.seasonTotalEvents}회` : null} />
              </div>
            )}
          </div>

          {/* 주요 활동 */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-extrabold">주요 활동</h2>
              <button onClick={() => setTab('activity')} className="h-8 px-3 rounded-lg border border-slate-200 text-[12.5px] font-bold text-slate-600 hover:border-slate-400">더보기</button>
            </div>
            {!hasActivityData ? (
              <p className="mt-3 rounded-2xl border border-dashed border-slate-200 p-5 text-center text-[13px] text-slate-500 break-keep">등록된 활동 정보가 아직 없습니다.</p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <ActivityTile icon={<Flag className="w-5 h-5" />} label="대회 출전" on={!!(act.tour1 || act.tour2 || act.gtour)} />
                <ActivityTile icon={<Camera className="w-5 h-5" />} label="SNS 콘텐츠" on={!!(act.sns || act.youtube)} />
                <ActivityTile icon={<Presentation className="w-5 h-5" />} label="레슨 활동" on={!!act.lesson} />
                <ActivityTile icon={<PartyPopper className="w-5 h-5" />} label="프로암 / 행사" on={!!act.proAm} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══ 대회 성과 ═══ */}
      {tab === 'results' && (
        <section className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[17px] font-extrabold inline-flex items-center gap-2">
                <Trophy className="w-5 h-5 text-emerald-500" /> 경기결과 / 분석
              </h2>
              {eventResults.length > 0 && eventResults[0].sourceUpdatedAt && (
                <span className="text-[12.5px] text-slate-500">업데이트: {new Date(eventResults[0].sourceUpdatedAt).toLocaleDateString('ko-KR')}</span>
              )}
            </div>

            {roi?.matchAnalysis && (
              <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
                  <div className="text-[12.5px] text-slate-500">최근 3개 대회 평균순위</div>
                  <div className="text-lg font-extrabold text-emerald-700">{roi.matchAnalysis.recentAvgRank != null ? `${roi.matchAnalysis.recentAvgRank}위` : '-'}</div>
                </div>
                <div className="bg-sky-50 rounded-lg p-2.5 text-center">
                  <div className="text-[12.5px] text-slate-500">시즌 누적 성적</div>
                  <div className="text-lg font-extrabold text-sky-700">{roi.matchAnalysis.seasonAvgRank != null ? `평균 ${roi.matchAnalysis.seasonAvgRank}위` : '-'}</div>
                  <div className="text-[11.5px] text-slate-500">출전 {roi.matchAnalysis.seasonTotalEvents}회</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-2.5 text-center">
                  <div className="text-[12.5px] text-slate-500">시즌 최고</div>
                  <div className="text-lg font-extrabold text-amber-700">{roi.matchAnalysis.seasonBestRank != null ? `${roi.matchAnalysis.seasonBestRank}위` : '-'}</div>
                  <div className="text-[11.5px] text-slate-500">TOP3 {roi.matchAnalysis.seasonTop3Count}회</div>
                </div>
                <div className="bg-violet-50 rounded-lg p-2.5 text-center">
                  <div className="text-[12.5px] text-slate-500">TOP 10 진입</div>
                  <div className="text-lg font-extrabold text-violet-700">{roi.matchAnalysis.seasonTop10Count}회</div>
                  <div className="text-[11.5px] text-slate-500">시즌 누적</div>
                </div>
              </div>
            )}

            {roi?.matchAnalysis?.recentTrend?.length >= 2 && (
              <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12.5px] font-bold text-slate-700">📈 최근 대회 추이</span>
                  <span className="text-[11.5px] text-slate-500">최근 5개 (낮을수록 좋음)</span>
                </div>
                <div className="flex items-end justify-between gap-2 h-16">
                  {roi.matchAnalysis.recentTrend.map((t: any, i: number) => {
                    const rank = t.rank || 99;
                    const heightPct = Math.max(10, Math.min(100, 100 - (rank - 1) * 2));
                    const color = rank <= 3 ? 'bg-amber-500' : rank <= 10 ? 'bg-emerald-500' : rank <= 30 ? 'bg-sky-500' : 'bg-slate-400';
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${t.eventName} · ${t.rank}위`}>
                        <div className="text-[12px] font-bold text-slate-600">{rank}위</div>
                        <div className={`w-full ${color} rounded-t`} style={{ height: `${heightPct}%`, minHeight: '4px' }} />
                        <div className="text-[11px] text-slate-500 truncate max-w-full">{t.eventDate ? new Date(t.eventDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }) : '-'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {careerList.length > 0 && (
              <div className="mb-4">
                <h3 className="text-[13.5px] font-extrabold text-slate-700 mb-2">주요 이력</h3>
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                  {careerList.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-slate-700 break-keep"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" /> {h}</li>
                  ))}
                </ul>
              </div>
            )}

            {eventResults.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500 bg-slate-50 rounded-lg">📡 최신 경기 정보 준비 중</div>
            ) : (
              <EventResultsByYear results={eventResults} fallbackTour={athlete.tour} />
            )}

            {roi?.operations?.upcomingList?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-2 inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-500" /> 향후 대회 일정 ({roi.operations.upcomingList.length})
                </h3>
                <div className="space-y-1.5">
                  {roi.operations.upcomingList.map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-sky-50/50 text-xs">
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold truncate">{e.name}</span>
                        {e.category && <span className="ml-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">{e.category}</span>}
                      </div>
                      <div className="text-[12.5px] text-slate-500 ml-2 whitespace-nowrap">{new Date(e.dateStart).toLocaleDateString('ko-KR')}{e.venue ? ` · ${e.venue}` : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 최근 참가 · 다음 예정 */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-base font-extrabold mb-3 inline-flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-500" /> 최근 참가 대회</h2>
              {recentEvents.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-500">최근 대회 정보가 없습니다.</div>
              ) : (
                <div className="space-y-2">
                  {recentEvents.slice(0, 3).map((e: any) => {
                    const matched = eventResults.find((r: any) => r.eventName && e.name && (r.eventName === e.name || r.eventName.includes(e.name) || e.name.includes(r.eventName)));
                    return (
                      <div key={e.id} className="py-2 border-b border-slate-100 last:border-b-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold truncate">{e.name}</div>
                            <div className="text-[12.5px] text-slate-500">{e.tour} · {e.dateStart ? new Date(e.dateStart).toLocaleDateString('ko-KR') : '-'}</div>
                          </div>
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${e.status === 'LIVE' ? 'bg-rose-100 text-rose-700' : e.status === 'UPCOMING' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{e.status}</span>
                        </div>
                        {matched ? (
                          <div className="mt-1.5 flex items-center gap-2 text-[12px]">
                            {matched.rank != null && <span className={`font-extrabold ${matched.rank <= 3 ? 'text-amber-600' : matched.rank <= 10 ? 'text-emerald-600' : 'text-slate-700'}`}>🏆 {matched.rank}위</span>}
                            {matched.score && <span className="text-slate-500 font-mono">{matched.score}</span>}
                          </div>
                        ) : e.status === 'COMPLETED' ? (
                          <div className="mt-1.5 text-[12.5px] text-slate-500">📡 성적 수집 준비 중</div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-base font-extrabold mb-3 inline-flex items-center gap-2"><Calendar className="w-4 h-4 text-sky-500" /> 다음 참가 예정 대회</h2>
              {(() => {
                const upcoming = recentEvents.filter((e: any) => e.status === 'UPCOMING' && new Date(e.dateStart) >= new Date());
                const next = upcoming[0] || roi?.athletePerformance?.nextEvent || roi?.operations?.nextEvent;
                if (!next) return <div className="text-center py-6 text-sm text-slate-500">예정된 대회가 없습니다.</div>;
                return (
                  <div className="space-y-2">
                    <div className="text-sm font-extrabold">{next.name}</div>
                    <div className="text-xs text-slate-600 inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{next.dateStart ? new Date(next.dateStart).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</div>
                    {next.venue && <div className="text-xs text-slate-600 inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{next.venue}</div>}
                    {next.tour && <div><span className="inline-block text-[12.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{next.tour}</span></div>}
                  </div>
                );
              })()}
            </div>
          </div>
        </section>
      )}

      {/* ═══ 활동 ═══ */}
      {tab === 'activity' && (
        <section className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-[17px] font-extrabold mb-3">현재 활동 분야</h2>
            {!hasActivityData ? (
              <p className="text-[13px] text-slate-500">등록된 활동 정보가 아직 없습니다.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {Object.entries(ACTIVITY_LABELS).map(([k, label]) => {
                  const on = !!act[k];
                  return (
                    <div key={k} className={`rounded-xl border p-2.5 text-center ${on ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-slate-50 opacity-70'}`}>
                      <div className="text-[12.5px] font-bold text-slate-800 leading-tight mb-1 break-keep">{label}</div>
                      <div className={`text-[11.5px] font-extrabold ${on ? 'text-emerald-600' : 'text-slate-500'}`}>{on ? '활동 중' : '준비 중'}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-[17px] font-extrabold mb-3">SNS &amp; 콘텐츠 채널</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              <a
                href={insta ? `https://instagram.com/${insta}` : undefined} target="_blank" rel="noreferrer"
                className={`flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 ${insta ? 'hover:border-pink-200 hover:bg-pink-50/40' : 'opacity-60 cursor-default'}`}
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  <span className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-400 via-pink-500 to-violet-500 text-white flex items-center justify-center shrink-0"><Instagram className="w-4 h-4" /></span>
                  <span className="text-[13px] font-bold text-slate-800 truncate">인스타그램{insta ? <span className="text-slate-500 font-semibold"> @{insta}</span> : null}</span>
                </span>
                <span className="text-[12.5px] font-bold text-slate-500 whitespace-nowrap">{sns.instagramFollowers ? `팔로워 ${sns.instagramFollowers}` : '미등록'}</span>
              </a>
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-200">
                <span className="inline-flex items-center gap-2 min-w-0">
                  <span className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0"><Youtube className="w-4 h-4" /></span>
                  <span className="text-[13px] font-bold text-slate-800 truncate">{sns.youtubeChannel || '유튜브'}</span>
                </span>
                <span className="text-[12.5px] font-bold text-slate-500 whitespace-nowrap">{sns.youtubeSubs ? `구독자 ${sns.youtubeSubs}` : '미등록'}</span>
              </div>
            </div>
          </div>

          <div className="-mx-4 sm:-mx-6"><AthleteFanPanel athleteId={athlete.id} name={athlete.name} /></div>

          <div data-section="roi">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[17px] font-extrabold inline-flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-500" /> 콘텐츠 · ROI 대시보드</h2>
              {roi?.meta && <span className="text-[12.5px] text-slate-500">수집률 {roi.meta.collectionProgress.collected}/{roi.meta.collectionProgress.total}</span>}
            </div>
            <RoiDashboard roi={roi} youtube={youtube} mentions={mentions} viewMode={roiViewMode} onViewModeChange={setRoiViewMode} isAuthenticated={isAuthenticated} onLoginClick={() => navigate('/login')} />
          </div>
        </section>
      )}

      {/* ═══ 후원 가능 슬롯 ═══ */}
      {tab === 'slots' && (<>
        <UnifiedPurchase
          athlete={athlete}
          slotInstances={orderedSlots}
          inventorySlots={inventorySlots}
          inventoryLoading={inventoryLoading}
          isAuthenticated={isAuthenticated}
          userRole={user?.role}
          onLogin={() => navigate('/login')}
        />
        {auctionSlots.length > 0 && (
          <section data-section="slots" className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <h2 className="text-xl font-extrabold text-slate-900 mb-1 inline-flex items-center gap-2">
              <Gavel className="w-5 h-5 text-emerald-500" /> 진행 중인 경매
              <span className="text-sm font-semibold text-slate-500">({auctionSlots.length}개)</span>
            </h2>
            <p className="text-sm text-slate-500 mb-4 break-keep">바로 구매·협의 슬롯은 위 “{athlete.name}'s 스폰서십 슬롯”에서 확인하실 수 있습니다.</p>
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
              <div className="space-y-2 lg:max-h-[520px] lg:overflow-y-auto lg:pr-1">
                {auctionSlots.map((s, i) => (
                  <SlotCard key={s.id} slot={s} selected={s.id === selectedSlotId} index={i + 1} onClick={() => setSelectedSlotId(s.id)} />
                ))}
              </div>
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
            <LegalNotice className="mt-4" />
          </section>
        )}
      </>)}

      {/* ═══ 브랜드 협업 이력 ═══ */}
      {tab === 'brands' && (
        <section className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-[17px] font-extrabold mb-3">협업 브랜드</h2>
            {sponsors.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-slate-500 break-keep">등록된 협업 브랜드 정보가 없습니다.<span className="block mt-1 text-[12px]">확인되지 않은 정보는 표시하지 않습니다.</span></p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sponsors.map((s: any, i: number) => (
                  <span key={i} className="text-[13px] bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full font-semibold">{typeof s === 'string' ? s : s.name || s.brand || ''}</span>
                ))}
              </div>
            )}
            {Array.isArray(athlete.blockedCategories) && athlete.blockedCategories.length > 0 && (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-3 text-[12.5px] text-rose-700 break-keep">
                <Info className="w-4 h-4 shrink-0 mt-0.5" /> 후원 불가 업종: {athlete.blockedCategories.join(' · ')}
              </p>
            )}
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-base font-extrabold mb-3 inline-flex items-center gap-2"><Gavel className="w-4 h-4 text-emerald-500" /> 슬롯 현황</h2>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="전체 슬롯" value={dash(orderedSlots.length)} />
              <Stat label="진행 중" value={String(orderedSlots.filter((s) => s.status === 'OPEN' || s.status === 'IN_AUCTION').length)} />
              <Stat label="낙찰" value={String(orderedSlots.filter((s) => s.status === 'SOLD').length)} />
              <Stat label="등록" value={athlete.createdAt ? new Date(athlete.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' }) : '-'} />
            </div>
            <button onClick={() => setTab('slots')} className="mt-3 w-full h-10 rounded-xl border border-emerald-200 text-[13px] font-bold text-emerald-700 hover:bg-emerald-50">후원 가능 슬롯 보기</button>
          </div>
        </section>
      )}

      {/* ═══ 하단 액션 ═══ */}
      <section className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8 print:hidden">
        <div className="grid sm:grid-cols-3 gap-2.5">
          <button onClick={onShare} className="h-14 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-[14px] font-bold text-slate-800 hover:border-slate-400">
            {copied ? <><Check className="w-4 h-4 text-emerald-600" /> 링크 복사됨</> : <><Share2 className="w-4 h-4" /> 전체 프로필 공유하기</>}
          </button>
          <button onClick={onPdf} className="h-14 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-[14px] font-bold text-slate-800 hover:border-slate-400">
            <Download className="w-4 h-4" /> 전체 프로필 다운로드 (PDF)
          </button>
          <Link to={pickTo} className="h-14 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-white text-[15px] font-extrabold hover:bg-emerald-700">
            이 선수 PICK <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 모바일 고정 바 (후원 가능 슬롯 탭은 구매 바가 따로 있다) */}
      {tab !== 'slots' && (
        <div className="lg:hidden fixed bottom-14 inset-x-0 z-40 bg-white border-t border-slate-200 px-4 py-2.5 grid grid-cols-[1fr_1.4fr] gap-2 print:hidden">
          <button onClick={onFavorite} className={`h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border text-[13.5px] font-bold ${fav ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-700'}`}>
            <Heart className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} /> 관심선수
          </button>
          <Link to={pickTo} className="h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[14px] font-extrabold">
            이 선수 PICK <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
 * 히어로 지표 카드 — 라벨 · 값+변화 · 진행바 · 미니 추이 (모두 실측이 있을 때만)
 * ════════════════════════════════════════════════════════════════ */
function HeroStat({ icon, label, shortLabel, value, delta, deltaUnit = '', pct, spark, note, emptyLabel = '집계 중' }: {
  icon: React.ReactNode; label: string; shortLabel?: string; value: string | null; delta: number | null; deltaUnit?: string;
  pct: number | null; spark: number[] | null; note?: string; emptyLabel?: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-2.5 sm:p-3.5 min-w-0" title={note}>
      <p className="text-[11.5px] sm:text-[12.5px] font-bold text-slate-600 truncate">
        <span className="sm:hidden">{shortLabel || label}</span><span className="hidden sm:inline">{label}</span>
      </p>
      <div className="mt-1 flex items-center gap-1 sm:gap-1.5 min-w-0">
        <span className="shrink-0 hidden sm:inline-flex">{icon}</span>
        {value != null
          ? <span className="text-[20px] sm:text-[24px] font-extrabold text-slate-900 tabular-nums leading-none truncate">{value}</span>
          : <span className="text-[12.5px] font-bold text-slate-500">{emptyLabel}</span>}
        {delta != null && delta !== 0 && (
          <span className={`ml-auto shrink-0 text-[11px] sm:text-[12px] font-extrabold tabular-nums ${delta > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {delta > 0 ? '▲' : '▼'}{Math.abs(delta)}{deltaUnit}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          {pct != null && <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(4, Math.min(100, pct))}%` }} />}
        </div>
        {spark && spark.length >= 2 && <Sparkline data={spark} />}
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const w = 44, h = 16;
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / span) * (h - 2) - 1}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0 hidden sm:block" aria-hidden>
      <polyline points={pts} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function InfoRow({ icon, k, v }: { icon: React.ReactNode; k: string; v: React.ReactNode | null | undefined }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
      <dt className="w-[84px] shrink-0 inline-flex items-center gap-1.5 text-slate-500"><span className="text-slate-400">{icon}</span>{k}</dt>
      <dd className="min-w-0 font-semibold text-slate-800 break-keep">{v ?? <span className="text-slate-400 font-medium">—</span>}</dd>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl bg-[#f4fbf7] border border-emerald-100 px-3 py-2.5 text-center">
      <p className="text-[11.5px] text-slate-500">{label}</p>
      <p className="mt-0.5 text-[15px] font-extrabold text-emerald-700 tabular-nums">{value ?? <span className="text-[12px] text-slate-500 font-bold">집계 중</span>}</p>
    </div>
  );
}

/** 주요 활동 타일 — 활동 사진 자료가 들어오기 전까지 아이콘 타일로 둔다 */
function ActivityTile({ icon, label, on }: { icon: React.ReactNode; label: string; on: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-3 ${on ? 'border-emerald-100 bg-[#f4fbf7]' : 'border-slate-200 bg-slate-50 opacity-70'}`}>
      <span className={`w-11 h-11 rounded-xl inline-flex items-center justify-center ${on ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{icon}</span>
      <div>
        <p className="text-[13.5px] font-extrabold text-slate-800">{label}</p>
        <p className={`text-[11.5px] font-bold ${on ? 'text-emerald-600' : 'text-slate-500'}`}>{on ? '활동 중' : '준비 중'}</p>
      </div>
    </div>
  );
}

function IndexCard({ axes }: { axes: { label: string; value: number | null }[] }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4">
      <p className="text-[13.5px] font-extrabold inline-flex items-center gap-1.5">
        SPONPIK INDEX
        <Info className="w-3.5 h-3.5 text-slate-400" aria-label="경기력·팬반응·콘텐츠성·브랜드 적합도·활동성 5축. 측정된 축만 표시합니다." />
      </p>
      <Radar axes={axes} />
      {axes.every((x) => x.value == null) && <p className="text-center text-[12.5px] text-slate-500">지수 집계 중</p>}
    </div>
  );
}

/** 5축 레이더 — 측정된 축만 그리고, 없으면 축 이름만 둔다 */
function Radar({ axes }: { axes: { label: string; value: number | null }[] }) {
  const size = 230, c = size / 2, r = 76;
  const pt = (i: number, rr: number) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length;
    return [c + rr * Math.cos(ang), c + rr * Math.sin(ang)];
  };
  const ring = (rr: number) => axes.map((_, i) => pt(i, rr).join(',')).join(' ');
  const measured = axes.some((x) => x.value != null);
  const poly = axes.map((x, i) => pt(i, ((x.value ?? 0) / 100) * r).join(',')).join(' ');
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[250px] mx-auto mt-1" role="img" aria-label="스폰픽 인덱스 5축">
      {[0.25, 0.5, 0.75, 1].map((k) => <polygon key={k} points={ring(r * k)} fill="none" stroke="#e2e8f0" strokeWidth="1" />)}
      {axes.map((_, i) => { const [x, y] = pt(i, r); return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />; })}
      {measured && <polygon points={poly} fill="rgba(16,185,129,0.25)" stroke="#10b981" strokeWidth="2" />}
      {measured && axes.map((x, i) => { if (x.value == null) return null; const [px, py] = pt(i, (x.value / 100) * r); return <circle key={i} cx={px} cy={py} r="3.5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />; })}
      {axes.map((x, i) => { const [lx, ly] = pt(i, r + 24); return <text key={x.label} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill="#334155">{x.label}</text>; })}
    </svg>
  );
}

/** 좌측 슬롯 카드 — 클릭 시 우측 호가창 변경 */
function SlotCard({ slot, selected, index, onClick }: { slot: any; selected: boolean; index: number; onClick: () => void }) {
  const auction = slot.auction;
  const isLive = auction?.status === 'LIVE';
  const isOpen = slot.status === 'OPEN' || slot.status === 'IN_AUCTION';
  const isDirectBuy = !!slot.enableDirectBuy && slot.directBuyPrice != null;
  const isInquiry = slot.saleMode === 'INQUIRY' || (!slot.enableAuction && !slot.enableDirectBuy);
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
        <span className="text-[12.5px] font-bold text-slate-500">#{index}</span>
        {isLive && <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded animate-pulse">LIVE</span>}
        {!auction && isDirectBuy && <span className="text-[9px] font-extrabold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">바로 구매</span>}
        {!auction && isInquiry && <span className="text-[9px] font-extrabold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">협의</span>}
        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{slot.status}</span>
      </div>
      {/* docx 4: slot_name 우선, 없으면 SlotTemplate.name fallback */}
      <div className="text-sm font-extrabold text-slate-900">{dash(slot.slotName || tpl.name || tpl.code)}</div>
      <div className="text-[12.5px] text-slate-500 mb-2">{dash(tpl.bodyPart)}{tpl.grade && ` · ${fmtGrade(tpl.grade)}등급`}</div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">{auction ? '현재가' : isDirectBuy ? '바로 구매가' : isInquiry ? '후원 조건' : '기준가'}</span>
        <span className={`font-bold ${auction ? 'text-emerald-600' : isInquiry ? 'text-violet-600' : 'text-sky-600'}`}>
          {isInquiry && !auction ? '협의' : dashKRW(auction?.currentPrice ?? (isDirectBuy ? slot.directBuyPrice : slot.reservePrice))}
        </span>
      </div>
    </button>
  );
}

/** 우측 호가창 + 입찰 내역 + 입찰 영역 (3-3 + 3-4) */
function SlotAuctionPanel({ slot, athleteName, isAuthenticated, userRole, onLoginRedirect, onPlaced }: any) {
  const auction = slot.auction;
  const tpl = slot.slotTemplate || {};
  const navigate = useNavigate();

  // 판매 방식: AUCTION 경매 / DIRECT 바로 구매 / INQUIRY 스폰픽 협의(카카오 상담)
  const isInquiry = slot.saleMode === 'INQUIRY' || (!slot.enableAuction && !slot.enableDirectBuy);
  const isDirectBuy = !!slot.enableDirectBuy && slot.directBuyPrice != null;
  const openInquiry = () => {
    const channelId = (import.meta.env.VITE_KAKAO_CHANNEL_ID as string) || '_xmpxknX';
    const slotLabel = `${athleteName} · ${slot.slotName || tpl.name || tpl.code}`;
    if (channelId) {
      window.open(`https://pf.kakao.com/${channelId}/chat`, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = `mailto:support@sponpik.com?subject=${encodeURIComponent(`[후원 문의] ${slotLabel}`)}`;
    }
  };
  const isSold = slot.status === 'SOLD' || slot.status === 'RESERVED';
  const [buyError, setBuyError] = useState('');
  const buyNowMut = useMutation({
    mutationFn: () => api.buySlotNow(slot.id),
    onSuccess: (res: any) => {
      onPlaced?.();
      const contractId = res?.data?.id;
      if (contractId) navigate(`/contracts/${contractId}`);
    },
    onError: (e: any) => {
      const err = e?.response?.data?.error;
      setBuyError((typeof err === 'object' ? err?.message : err) || '바로 구매에 실패했습니다');
    },
  });
  const handleBuyNow = () => {
    if (!isAuthenticated) return onLoginRedirect();
    if (userRole !== 'BRAND') { setBuyError('바로 구매는 브랜드 계정만 가능합니다.'); return; }
    if (!confirm(`${dashKRW(slot.directBuyPrice)}에 바로 구매하시겠습니까?\n구매 시 계약이 생성되며 선수 서명 후 확정됩니다.`)) return;
    setBuyError('');
    buyNowMut.mutate();
  };

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
            <div className="text-[12.5px] text-slate-500">{dash(tpl.bodyPart)}{tpl.grade && ` · ${fmtGrade(tpl.grade)}등급`}</div>
          </div>
          {auction?.status === 'LIVE' && <span className="text-[12.5px] font-extrabold text-rose-600 bg-rose-50 px-2 py-1 rounded animate-pulse">● LIVE</span>}
        </div>

        {!auction ? (
          isInquiry ? (
            /* 협의 문의 슬롯 — 가격 비공개, 스폰픽 상담으로 확정 */
            <div>
              <div className="bg-violet-50 rounded-xl p-4 mb-3">
                <div className="text-[12.5px] font-bold text-violet-700 mb-1">스폰픽 협의 후원</div>
                <div className="text-lg font-extrabold text-violet-700">가격 협의</div>
                <div className="text-[12px] text-slate-600 mt-1 leading-relaxed">
                  이 슬롯은 후원 가능 상태로만 공개되어 있습니다. 상담을 신청하시면 스폰픽이 노출 조건·기간·금액을 협의해 후원을 확정해 드립니다.
                </div>
              </div>
              <button
                onClick={openInquiry}
                className="w-full h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-extrabold shadow-md transition-colors inline-flex items-center justify-center gap-1.5"
              >
                💬 스폰픽 상담 문의
              </button>
              <div className="text-[12.5px] text-slate-500 text-center mt-2">카카오톡 채널로 연결됩니다</div>
            </div>
          ) : isDirectBuy ? (
            /* 바로 구매 슬롯 (경매 없이 고정가 판매) */
            <div>
              <div className="bg-sky-50 rounded-xl p-4 mb-3">
                <div className="text-[12.5px] font-bold text-sky-700 mb-1">바로 구매가</div>
                <div className="text-2xl font-extrabold text-sky-600">{dashKRW(slot.directBuyPrice)}</div>
                <div className="text-[12.5px] text-slate-500 mt-1">경매 없이 바로 구매하며, 결제 후 계약이 생성됩니다.</div>
              </div>
              {isSold ? (
                <div className="text-center py-3 bg-slate-100 rounded-xl text-sm font-bold text-slate-500">
                  {slot.status === 'SOLD' ? '판매 완료된 슬롯입니다' : '구매 진행 중인 슬롯입니다'}
                </div>
              ) : (
                <>
                  <button
                    onClick={handleBuyNow}
                    disabled={buyNowMut.isPending}
                    className="w-full h-11 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-extrabold shadow-md transition-colors disabled:opacity-50"
                  >
                    {buyNowMut.isPending ? '처리 중...' : '🛒 바로 구매'}
                  </button>
                  {buyError && <div className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded mt-2">{buyError}</div>}
                  {!isAuthenticated && (
                    <div className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded mt-2">
                      브랜드 계정으로 로그인 후 구매할 수 있습니다.{' '}
                      <button onClick={onLoginRedirect} className="font-bold underline">로그인하기</button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* 경매 미생성 + 바로 구매도 아닌 슬롯 */
            <div className="text-center py-8 bg-slate-50 rounded-xl">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-sm text-slate-500">아직 판매가 시작되지 않은 슬롯입니다.</div>
            </div>
          )
        ) : (
          <>
            {/* 현재가 + 카운트다운 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-emerald-50 rounded-xl p-3">
                <div className="text-[12.5px] font-bold text-emerald-700 mb-1">현재가</div>
                <div className="text-2xl font-extrabold text-emerald-600">{dashKRW(currentPrice)}</div>
              </div>
              <div className={`rounded-xl p-3 ${isEnded ? 'bg-slate-100' : remainingMs && remainingMs < 60000 ? 'bg-rose-50' : 'bg-slate-50'}`}>
                <div className="text-[12.5px] font-bold text-slate-700 mb-1 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 남은 시간
                </div>
                <div className={`text-xl font-extrabold tabular-nums ${isEnded ? 'text-slate-500' : remainingMs && remainingMs < 60000 ? 'text-rose-600' : 'text-slate-900'}`}>{remainingText}</div>
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
                <div className="font-bold text-[12px]">{dash(auction.status)}</div>
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
          <Users className="w-4 h-4 text-slate-500" /> 최근 입찰 내역
        </h3>
        {bids.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-500">아직 입찰 내역이 없습니다.</div>
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
                  <div className="text-[9px] text-slate-500">{b.createdAt ? formatRelativeTime(b.createdAt) : '-'}</div>
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
        <div className="text-[12px] font-extrabold text-emerald-700 inline-flex items-center gap-1">
          📊 호가 리스트 (다음 5단계)
        </div>
        <div className="text-[12.5px] text-slate-500">
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
            <div className="text-[12px] font-extrabold text-slate-900 group-hover:text-emerald-700 truncate">
              ₩{t.amount.toLocaleString()}
            </div>
            <div className="text-[8px] text-slate-500">+₩{t.delta.toLocaleString()}</div>
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
  isAuthenticated = false,
  onLoginClick,
}: {
  roi: any;
  youtube?: any;
  mentions?: any;
  viewMode?: 'BASIC' | 'EXTENDED';
  onViewModeChange?: (m: 'BASIC' | 'EXTENDED') => void;
  isAuthenticated?: boolean;
  onLoginClick?: () => void;
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
    return <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500">ROI 지표 로딩 중...</div>;
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
    slate: 'from-slate-100 to-slate-50 text-slate-500 border-slate-200',
  };

  const statusBadgeClass = sum.statusBadge === 'OFFICIAL' ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : sum.statusBadge === 'PRELIMINARY' ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-slate-100 text-slate-600 border-slate-200';

  const isExtended = viewMode === 'EXTENDED';

  return (
    <div className="space-y-4">
      {/* === B. 종합 광고효과 요약 영역 === */}
      <div className={`border-2 rounded-2xl p-5 bg-gradient-to-br ${gradeBgs[gradeColor]}`}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[12px] font-bold opacity-70">📊 SPONPIK Ad Impact Score</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-current/10">
                {isExtended ? '확장형' : '기본형'}
              </span>
            </div>
            <div className="text-[12.5px] opacity-60">
              {isExtended ? '광고효과 + 유입 + 전환 종합 점수' : '미디어 · 콘텐츠 · 팬덤 · 선수성과 기준 산정'}
            </div>
          </div>
          <span
            className={`text-[12.5px] font-bold px-2 py-1 rounded-full border cursor-help ${statusBadgeClass}`}
            title={
              '점수 상태 매핑 (docx §11):\n' +
              '· 공식 산정: 데이터 수집률 70% 이상\n' +
              '· 예비 산정: 40~69%\n' +
              '· 산정중: 40% 미만 (등급 보수적 처리)'
            }
          >
            {sum.statusLabel || '-'}
          </span>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-5xl font-black tabular-nums leading-none">
              {score != null ? score.toFixed(1) : '-'}
              {score != null && <span className="text-xl font-bold opacity-70 ml-1">/ 100</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[12.5px] font-bold opacity-70 mb-0.5">등급</div>
            <div className="text-4xl font-black leading-none">{grade ?? '-'}</div>
          </div>
        </div>
        {/* B-2 보조 정보 — 최근 업데이트 + 최근 성과 2개만 (데이터 수집률/신뢰도 제거) */}
        <div className="mt-4 pt-3 border-t border-current/10 grid grid-cols-2 gap-2 text-[12.5px]">
          <AuxStat
            label="최근 업데이트"
            hint="점수 갱신 시각"
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
          <AuxStat
            label="최근 성과"
            hint="대회명 / 순위"
            value={sum.latestPerformance?.eventName && sum.latestPerformance?.rank
              ? `${sum.latestPerformance.eventName} / ${sum.latestPerformance.rank}위`
              : sum.latestPerformance?.rank
              ? `${sum.latestPerformance.rank}위`
              : '-'}
          />
        </div>
        {/* 뷰 토글 */}
        <div className="mt-3 flex items-center justify-end gap-1 text-[12.5px]">
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

      {/* === C. 핵심 성과 카드 영역 (기본형 4종) === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
        {/* C-1. 미디어노출지수 — docx §6 C-1 '데이터 없을 때 상태 문구: 데이터 수집 전' */}
        <RoiCard
          title="📺 미디어노출지수"
          color="rose"
          score={roi.mediaExposure?.score}
          subtitle="방송/중계/외부노출 기준"
          purpose="선수가 실제 방송·중계·기사·하이라이트 등에서 얼마나 노출되었는지 보여주는 핵심 지표"
          emptyLabel="데이터 수집 전"
          showMetrics={isAuthenticated}
          onLoginClick={onLoginClick}
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
          showMetrics={isAuthenticated}
          onLoginClick={onLoginClick}
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
          showMetrics={isAuthenticated}
          onLoginClick={onLoginClick}
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
          showMetrics={isAuthenticated}
          onLoginClick={onLoginClick}
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

      {/* === D. 확장형 추가 카드 (중장기 계약 브랜드 전용) === */}
      {isExtended && (
        <div className="text-[12px] font-bold text-amber-600 inline-flex items-center gap-1.5 pt-1">
          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">확장 전용</span>
          <span className="text-slate-500">랜딩 유입 + 구매/전환/ROI</span>
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
            showMetrics={isAuthenticated}
            onLoginClick={onLoginClick}
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
            showMetrics={isAuthenticated}
            onLoginClick={onLoginClick}
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
        <button
          onClick={() => setViewMode('EXTENDED')}
          className="w-full bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-200 rounded-xl p-3 text-[12px] text-slate-500 transition-colors text-left"
        >
          🔒 랜딩 유입·구매/전환/ROI 카드는 중장기 계약 브랜드 전용 — <span className="font-bold text-emerald-600">확장형 미리보기 →</span>
        </button>
      )}
    </div>
  );
}

/**
 * G. 점수 산정 기준 + 데이터 출처 (docx §10, §13)
 * - 페이지 최하단 (F 경기결과 이후)에 별도 섹션으로 배치
 * - 사용자 요청으로 페이지에서 숨김 처리됨 (underscore prefix 로 미사용 표시)
 * - 향후 다시 필요 시 export 또는 호출 부분 추가하면 즉시 복구 가능
 */
// @ts-ignore — 의도적으로 미사용 (나중 복구용 보존)
function _ScoringAndDataSources({ roi, viewMode }: { roi: any; viewMode: 'BASIC' | 'EXTENDED' }) {
  if (!roi) return null;
  const isExtended = viewMode === 'EXTENDED';
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
      {/* docx §10 G. '점수 산정 기준 안내' 정확 영역명 + G-3 '데이터 출처' */}
      <h2 className="text-xl font-extrabold text-slate-900 mb-4 inline-flex items-center gap-2">
        <Trophy className="w-5 h-5 text-emerald-500" />
        점수 산정 기준
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <h3 className="text-sm font-extrabold text-slate-900 mb-2">📐 {isExtended ? '확장형' : '기본형'} 점수 산정 기준</h3>
          <div className="space-y-1.5 text-[12px]">
            {(isExtended ? roi.scoringRules?.extended : roi.scoringRules?.basic)?.map((r: any) => (
              <div key={r.axis} className="flex items-center justify-between">
                <span className="text-slate-600">{r.axis}</span>
                <span className="font-bold text-slate-900">{r.weight}%</span>
              </div>
            ))}
          </div>
          <p className="text-[12.5px] text-slate-500 mt-3">
            {isExtended
              ? '중장기 계약 브랜드에 한해 확장 성과지표가 제공됩니다.'
              : '대회별 기본 입찰 및 직접 구매형 스폰서십에 제공되는 기본 광고효과 지표입니다. 랜딩 유입 및 구매전환 데이터는 중장기 계약 브랜드 전용 리포트에서 제공됩니다.'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          {/* docx §10 G-3 정확 카드명 '데이터 출처 카드' */}
          <h3 className="text-sm font-extrabold text-slate-900 mb-2">📦 데이터 출처 카드</h3>
          <div className="space-y-1.5 text-[12px]">
            {roi.dataSources?.map((s: any) => (
              <div key={s.code} className="flex items-center justify-between">
                <span className="text-slate-600">{s.name}</span>
                <span className={`text-[12.5px] font-bold px-1.5 py-0.5 rounded ${
                  s.status === 'OK' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {s.status === 'OK' ? '연결됨' : '미수집'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}

/** ROI 카드 — 영역 점수 + 지표 목록 */
function RoiCard({
  title, color, score, subtitle, purpose, metrics, extendedBadge, error, emptyLabel,
  showMetrics = true,
  onLoginClick,
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
  showMetrics?: boolean;  // 비로그인 시 세부 지표 숨김 (영역 점수만 표시)
  onLoginClick?: () => void;
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
      {/* 목적은 ? 호버 툴팁으로만 노출 (본문에서는 제거) — 가독성 우선 */}
      {subtitle && <p className="text-[12.5px] text-slate-500 mb-2">{subtitle}</p>}
      <div className="flex items-baseline gap-2 mb-3 pb-2 border-b border-current/10">
        <span className="text-[12.5px] text-slate-500">영역 점수</span>
        <span className={`text-2xl font-black tabular-nums ${score == null ? 'text-slate-500' : c.scoreText}`}>
          {score != null ? score.toFixed(1) : '-'}
        </span>
        {/* docx §4 B-1 형식 '00 / 100' (공백 포함) - B-1 메인 카드와 통일 */}
        {score != null && <span className="text-[12.5px] text-slate-500">/ 100</span>}
        {score == null && (
          <span className="text-[9px] text-slate-500 italic ml-auto">📡 {emptyLabel || '수집 준비 중'}</span>
        )}
      </div>
      {showMetrics ? (
        <>
          <div className="space-y-1.5">
            {metrics.map((m) => {
              // docx 11. 상태값 처리 — 미수집 항목은 "-" 대신 의미있는 라벨 (옵션)
              const isEmpty = m.value === '-' || m.value === '' || m.value == null;
              return (
                <div key={m.label} className="flex items-center justify-between gap-2">
                  <span className="text-[12px] text-slate-500">{m.label}</span>
                  <span className={`text-xs font-bold ${isEmpty ? 'text-slate-500' : 'text-slate-900'} ${m.truncate ? 'truncate max-w-[140px]' : ''}`}>
                    {m.value}
                  </span>
                </div>
              );
            })}
          </div>
          {/* 모든 지표 미수집 시 docx §11 '수집 준비 중' (또는 카드별 명시 라벨, 예: C-1 '데이터 수집 전') */}
          {metrics.every(m => m.value === '-' || !m.value) && (
            <div className="mt-3 pt-2 border-t border-current/10 text-[12.5px] text-center text-slate-500">
              📡 {emptyLabel || '수집 준비 중'}
            </div>
          )}
        </>
      ) : (
        // 비로그인 상태 — 영역 점수만 노출 + 로그인 CTA
        <button
          type="button"
          onClick={onLoginClick}
          className="w-full text-center py-3 px-2 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-dashed border-slate-200 hover:border-emerald-300 text-[12px] text-slate-500 hover:text-emerald-700 transition-colors"
        >
          🔒 세부 지표 {metrics.length}개 항목은 <span className="font-bold">로그인 후</span> 확인 가능
        </button>
      )}
    </div>
  );
}

/** 보조 정보 (수집률/신뢰도/업데이트/최근성과) */
function AuxStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="text-center" title={hint || undefined}>
      <div className="opacity-60 mb-0.5">{label}</div>
      <div className="font-bold text-[12px] truncate">{value}</div>
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
            {year}년 <span className="text-[12.5px] text-slate-500 font-normal">({items.length}개)</span>
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
                    <div className="text-base text-slate-500">-</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">{r.eventName}</div>
                  <div className="text-[12.5px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
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
                  {r.summary && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 italic">{r.summary}</p>
                  )}
                </div>
                {r.score && (
                  <div className="text-right">
                    <div className="text-[12.5px] text-slate-500">스코어</div>
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
