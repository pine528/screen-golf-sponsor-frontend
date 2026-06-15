import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Clock,
  Menu,
  X,
  Users,
  Zap,
  Timer,
  ChevronRight,
  ChevronLeft,
  Shield,
  BarChart3,
  Vote,
  Search,
  Gavel,
  FileCheck,
  Upload,
  Diamond,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { formatTimeRemaining } from '../utils';
import { ServiceAnnouncementModal } from '../components/ServiceAnnouncementModal';

/* ── Intersection Observer counter ── */
function useCounter(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start: number, raf: number;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setCount(Math.floor(p * end));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, started]);

  return { count, ref };
}

/* ── Scroll-reveal hook ── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ════════════════════════════════════════════════════════ */
/*                      HOME COMPONENT                     */
/* ════════════════════════════════════════════════════════ */
export function Home() {
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  /* ── Data ── */
  const { data: activeVotes } = useQuery({
    queryKey: ['home-votes'],
    queryFn: async () => {
      const r = await api.getVotes({ status: 'OPEN', pageSize: 4 });
      return (r.data || []).map((v: any) => ({
        id: v.id,
        title: v.title,
        creatorRole: v.creatorRole as string,
        participants: v._count?.participations ?? 0,
        endAt: v.closeAt,
        rewardBudgetEp: v.rewardBudgetEp,
      })).sort((a: any, b: any) => +new Date(a.endAt) - +new Date(b.endAt));
    },
    staleTime: 60_000,
  });

  const { data: liveAuctions } = useQuery({
    queryKey: ['home-auctions'],
    queryFn: async () => {
      const r = await api.getAuctions({ status: 'LIVE', pageSize: 8 });
      return (r.data || []).map((a: any) => ({
        id: a.id,
        slot: a.slotInstance?.slotTemplate?.code || 'SLOT',
        slotName: a.slotInstance?.slotTemplate?.nameKr || a.slotInstance?.slotTemplate?.name || '',
        bodyPart: a.slotInstance?.slotTemplate?.bodyPart || '',
        player: a.slotInstance?.athlete?.name || '선수',
        playerImage: a.slotInstance?.athlete?.profileImageUrl || '',
        price: a.currentPrice || a.slotInstance?.reservePrice || 0,
        endAt: a.endAt,
        bids: a._count?.bids ?? 0,
      }));
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const c1 = useCounter(1250);
  const c2 = useCounter(3400);
  const c3 = useCounter(180);

  const r1 = useReveal();
  const r2 = useReveal();
  const r3 = useReveal();
  const r4 = useReveal();

  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = useCallback((dir: 'left' | 'right') => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  }, []);

  const bodyPartLabel = (bp: string) => {
    const map: Record<string, string> = {
      CAP_FRONT: '모자 정면', CAP_SIDE_R: '모자 우측', CAP_SIDE_L: '모자 좌측', CAP_BACK: '모자 뒷면',
      CHEST_CENTER: '상의 중앙', CHEST_L: '상의 좌측', CHEST_R: '상의 우측',
      COLLAR_L: '카라 좌측', COLLAR_R: '카라 우측',
      SLEEVE_L: '소매 좌측', SLEEVE_R: '소매 우측',
      SHOULDER_L: '어깨 좌측', SHOULDER_R: '어깨 우측',
      WAIST_BACK: '허리 뒷면', PANTS_SIDE: '바지 측면',
    };
    return map[bp] || bp;
  };

  const navLinks = [
    { to: '/auctions', label: '경매' },
    { to: '/votes', label: '투표' },
    { to: '/athletes', label: '선수' },
    { to: '/how-it-works', label: '이용방법' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* SPONPIK 서비스 오픈 안내 모달 (홈 진입 시 자동 표시) */}
      <ServiceAnnouncementModal />

      {/* ════════════════════════ NAV ════════════════════════ */}
      <nav className="fixed inset-x-0 top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo-48.png" alt="" className="w-8 h-8 rounded-xl" />
            <span className="text-lg font-extrabold tracking-tight text-slate-900">SPONPIK</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} className="px-3.5 py-2 text-[13px] font-medium rounded-lg transition-colors text-slate-500 hover:text-slate-900 hover:bg-slate-50">
                {l.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link to="/dashboard" className="px-3.5 py-2 text-[13px] font-medium rounded-lg transition-colors text-slate-500 hover:text-slate-900 hover:bg-slate-50">
                마이페이지
              </Link>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2">
            {isAuthenticated ? (
              <Link to="/dashboard" className="h-9 px-5 inline-flex items-center gap-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors">
                시작하기
              </Link>
            ) : (
              <>
                <Link to="/login" className="h-9 px-4 inline-flex items-center rounded-lg text-slate-600 text-sm font-medium hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  로그인
                </Link>
                <Link to="/register" className="h-9 px-5 inline-flex items-center rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors">
                  시작하기
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg text-slate-500">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-5 pb-4 pt-2 space-y-1">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg">{l.label}</Link>
            ))}
            {isAuthenticated && (
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg">마이페이지</Link>
            )}
            <div className="pt-3 mt-2 border-t border-slate-100 flex gap-2">
              {isAuthenticated ? (
                <Link to="/dashboard" className="flex-1 h-10 inline-flex items-center justify-center rounded-lg bg-emerald-500 text-white text-sm font-semibold" onClick={() => setMobileOpen(false)}>시작하기</Link>
              ) : (
                <>
                  <Link to="/login" className="flex-1 h-10 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold" onClick={() => setMobileOpen(false)}>로그인</Link>
                  <Link to="/register" className="flex-1 h-10 inline-flex items-center justify-center rounded-lg bg-emerald-500 text-white text-sm font-semibold" onClick={() => setMobileOpen(false)}>시작하기</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ════════════════════════ HERO ════════════════════════ */}
      <section className="relative pt-32 sm:pt-36 pb-24 sm:pb-28 px-5 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
        {/* 소프트 블롭 (장식 점 제거) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 right-0 w-72 h-72 rounded-full bg-emerald-200/30 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto relative">
          {/* Top badge */}
          <div className="mb-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              KPGA · KLPGA 남녀 프로골프 선수
            </span>
          </div>

          <div className="grid lg:grid-cols-[1fr_auto_340px] gap-6 lg:gap-8 items-center">
            {/* Left - Text */}
            <div className="relative z-10">
              {/* 모바일 골퍼 누끼 (우측, lg에서는 중앙 이미지 사용) */}
              <img
                src="/golfers/bae-jinri-hero.png"
                alt="배진리 프로 — SPONPIK Founder No.1"
                className="lg:hidden absolute -right-3 top-0 w-[44%] max-w-[220px] object-contain pointer-events-none select-none"
                style={{ filter: 'drop-shadow(0 12px 22px rgba(15,23,42,0.10))' }}
              />

              <h1 className="text-[26px] sm:text-4xl lg:text-[42px] font-black tracking-tight lg:tracking-wide text-slate-900 leading-[1.32] lg:leading-tight mb-0 lg:mb-12 space-y-1 lg:space-y-4 max-w-[56%] lg:max-w-none">
                <div>티샷의 순간<span className="hidden lg:inline">,</span></div>
                <div>수백만의 시선이</div>
                <div><span className="text-emerald-500">당신의 브랜드</span>를<br className="lg:hidden" /> 주목합니다.</div>
              </h1>

              {/* 모바일 파운더 라벨 */}
              <div className="lg:hidden mt-7 max-w-[56%]">
                <p className="text-[10px] font-extrabold tracking-[0.12em] text-slate-400">
                  <span className="text-emerald-500">SPONPIK</span> FOUNDER PRO NO1
                </p>
                <p className="mt-1.5 text-[22px] font-black text-slate-900 leading-none">
                  배진리 <span className="text-sm font-bold text-slate-400">프로</span>
                </p>
                <p className="mt-1.5 text-[19px] text-slate-300 italic -rotate-3 origin-left" style={{ fontFamily: "'Snell Roundhand','Brush Script MT','Segoe Script',cursive" }}>
                  Bae Jinri
                </p>
              </div>

              {/* 데스크톱 설명 문구 */}
              <p className="hidden lg:block text-base sm:text-lg text-slate-500 leading-relaxed mb-12 max-w-lg">
                필드와 스크린 위, 가장 돋보이는 순간. 경기 내내 시선이 머무는 프로 골퍼의 최적화된 광고 슬롯을 실시간 경매로 낙찰받으세요.
              </p>

              <div className="flex flex-wrap gap-2.5 sm:gap-3 mt-10 lg:mt-0 mb-10 lg:mb-14">
                <Link to={isAuthenticated ? '/dashboard' : '/register'}
                  className="h-11 px-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                  무료로 시작하기 <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/auctions"
                  className="h-11 px-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">
                  경매 둘러보기
                </Link>
                <Link to="/athletes"
                  className="h-11 px-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">
                  선수 둘러보기
                </Link>
              </div>

              {/* Stats */}
              <div ref={c1.ref} className="flex gap-8 sm:gap-10">
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900">{c1.count.toLocaleString()}<span className="text-emerald-500">+</span></p>
                  <p className="text-xs text-slate-400 mt-0.5">등록 선수</p>
                </div>
                <div ref={c2.ref}>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900">{c2.count.toLocaleString()}<span className="text-emerald-500">+</span></p>
                  <p className="text-xs text-slate-400 mt-0.5">성사된 계약</p>
                </div>
                <div ref={c3.ref}>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900">{c3.count.toLocaleString()}<span className="text-emerald-500">+</span></p>
                  <p className="text-xs text-slate-400 mt-0.5">파트너 브랜드</p>
                </div>
              </div>
            </div>

            {/* Center - Hero Model Image (배진리 프로 — 누끼 PNG, 좌측하단 텍스트 포함) */}
            <div className="hidden lg:flex relative justify-center items-end z-[5] -ml-16 -mt-12">
              {/* Soft glow behind model */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="relative">
                <img
                  src="/golfers/bae-jinri-cutout.png"
                  alt="배진리 프로 — SPONPIK Founder No.1"
                  className="relative h-[600px] w-auto object-contain object-bottom"
                />
                {/* 하단 페이드 효과 — 우측(발) 영역만, 좌측 텍스트/사인 영역은 제외 */}
                <div
                  className="absolute bottom-0 right-0 h-32 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/80 to-transparent pointer-events-none"
                  style={{ left: '33%' }}
                />
              </div>
            </div>

            {/* Right - Hot Auction Card (실데이터 바인딩, docx 2-1) */}
            <HeroLiveAuctionCard hot={liveAuctions && liveAuctions.length > 0 ? liveAuctions[0] : null} />
          </div>
        </div>
      </section>

      {/* ════════════════════════ 진행중인 스폰서십 슬롯 (캐러셀) ════════════════════════ */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <span className="text-emerald-500">*</span> 진행중인 스폰서십 슬롯
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => scrollCarousel('left')} className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50 transition-colors text-slate-400">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => scrollCarousel('right')} className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50 transition-colors text-slate-400">
                <ChevronRight className="w-4 h-4" />
              </button>
              <Link to="/auctions" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 transition-colors ml-2">
                전체보기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {(() => {
            // SPONPIK 론칭 docx 2-1: 프론트 하드코딩 값 사용 지양
            // → MOCK_GOLFERS 제거, 실데이터(liveAuctions)만 사용. 빈 경우 명시적 empty state.
            const displayItems = liveAuctions && liveAuctions.length > 0 ? liveAuctions : null;
            const items = displayItems;

            if (!items || items.length === 0) {
              return (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-700 mb-1">현재 진행 중인 슬롯이 없습니다</h3>
                  <p className="text-sm text-slate-500 mb-4">새로운 스폰서십 슬롯이 등록되면 여기에 표시됩니다.</p>
                  <Link to="/athletes" className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700">
                    선수 둘러보기 <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            }

            return items && items.length > 0 ? (
              <div ref={carouselRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 scrollbar-hide -mx-5 px-5">
                {items.map((a: any) => {
                  const isReal = true;
                  const linkTo = `/auctions/${a.id}`;
                  return (
                    <Link key={a.id} to={linkTo} className="flex-shrink-0 w-[200px] sm:w-[220px] snap-start group cursor-pointer">
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
                        {/* Player photo */}
                        <div className="relative h-52 sm:h-56 overflow-hidden bg-slate-100">
                          {a.playerImage ? (
                            <img src={a.playerImage} alt={a.player} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100">
                              <div className="text-center">
                                <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                <p className="text-[10px] text-slate-400">{a.player}</p>
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                          <div className="absolute top-3 left-3">
                            <span className="text-[10px] font-bold tracking-wide text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                              {a.slot}
                            </span>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-4">
                          <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors truncate mb-0.5">{a.player}</p>
                          <p className="text-[10px] text-slate-400 mb-2">{bodyPartLabel(a.bodyPart)}</p>
                          <div className="mb-3">
                            <p className="text-[10px] text-slate-400 mb-0.5">현재 1위 입찰가</p>
                            <p className="text-base font-black text-slate-900">₩{(a.price || 0).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-rose-500 font-bold text-xs">
                              <Timer className="w-3.5 h-3.5" />
                              <span className="font-mono">{isReal ? formatTimeRemaining(a.endAt) : a.timeLeft}</span>
                            </div>
                            {a.bids > 0 && (
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{a.bids}건</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : null;
          })()}
        </div>
      </section>

      {/* ════════════════════════ 진행 중인 투표 ════════════════════════ */}
      <section className="py-12 sm:py-16 px-5 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <span className="text-emerald-500">*</span> 진행 중인 투표
            </h2>
            <Link to="/votes" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 transition-colors">
              전체보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {activeVotes && activeVotes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeVotes.slice(0, 4).map((v: any) => (
                <Link key={v.id} to={`/votes/${v.id}`} className="group">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
                    <p className="text-sm font-bold text-slate-900 mb-3 truncate">{v.title}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{v.participants}명</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTimeRemaining(v.endAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">현재 진행 중인 투표가 없습니다</p>
              <p className="text-slate-400 text-sm mt-1">곧 새로운 투표가 시작됩니다</p>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════ 왜 SPONPIK인가요? ════════════════════════ */}
      <section ref={r1.ref} className={`py-16 sm:py-24 px-5 bg-white transition-all duration-700 ${r1.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-3">왜 SPONPIK인가요?</h2>
            <p className="text-slate-500 text-sm sm:text-base">스크린골프 스폰서십 시장을 위해 설계된 올인원 플랫폼</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Zap className="w-5 h-5" />, color: 'text-emerald-600 bg-emerald-100', title: '실시간 경매', desc: '등록된 입찰과 자동 연장으로 공정한 가격 발견' },
              { icon: <Shield className="w-5 h-5" />, color: 'text-sky-600 bg-sky-100', title: '안전한 계약', desc: '에스크로 시스템과 KYC 검증으로 안전한 거래 보장' },
              { icon: <BarChart3 className="w-5 h-5" />, color: 'text-violet-600 bg-violet-100', title: 'AI ROI 분석', desc: 'AI 기반 로고 노출 분석과 실시간 ROI 리포트' },
              { icon: <Vote className="w-5 h-5" />, color: 'text-pink-600 bg-pink-100', title: '팬 투표', desc: '경기 예측 투표에 참여하고 포인트를 획득하세요' },
            ].map((f) => (
              <div key={f.title} className="text-center">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mx-auto mb-4`}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ 간단한 4단계 ════════════════════════ */}
      <section ref={r2.ref} className={`py-16 sm:py-24 px-5 bg-slate-50 transition-all duration-700 ${r2.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-3">간단한 4단계</h2>
            <p className="text-slate-500 text-sm sm:text-base">누구나 쉽게 시작할 수 있습니다</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', icon: <Search className="w-5 h-5" />, title: '슬롯 탐색', desc: '관심있는 선수와 이벤트의 광고 슬롯을 탐색하세요' },
              { step: '02', icon: <Gavel className="w-5 h-5" />, title: '입찰 참여', desc: '원하는 슬롯에 원하는 가격으로 쉽게 입찰 참여' },
              { step: '03', icon: <FileCheck className="w-5 h-5" />, title: '계약 체결', desc: '낙찰 후 전자서명으로 계약을 체결하세요' },
              { step: '04', icon: <Upload className="w-5 h-5" />, title: '소재 등록', desc: '광고 소재를 업로드하고 노출을 확인하세요' },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-2xl border border-slate-200 p-6 text-center hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{s.step}</span>
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto my-4 text-slate-600">
                  {s.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ 누구를 위한 서비스인가요? ════════════════════════ */}
      <section ref={r3.ref} className={`py-16 sm:py-24 px-5 bg-white transition-all duration-700 ${r3.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-3">누구를 위한 서비스인가요?</h2>
            <p className="text-slate-500 text-sm sm:text-base">각 역할에 최적화된 경험을 제공합니다</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: '브랜드 · 광고주',
                desc: '합리적 예산으로 프로스포츠 노출시키세요',
                items: ['원하는 예산과 시간에 맞춰 입찰', '실시간 경쟁 입찰/시간', 'AI ROI 리포트 제공'],
                link: { to: isAuthenticated ? '/dashboard' : '/register', label: '브랜드로 시작' },
                accent: 'emerald',
              },
              {
                title: '선수 · 매니지먼트',
                desc: '투명한 수익을 창출하세요',
                items: ['슬롯별 가능한 자원 설정 공유', '계약 조건 결정 및 승인', 'D+7 정상입금 보장'],
                link: { to: isAuthenticated ? '/dashboard' : '/register', label: '선수등록 시작' },
                accent: 'sky',
              },
              {
                title: '팬 · 일반회원',
                desc: '투표하고 응원하고 즐기세요',
                items: ['경기 결과 예측 투표', '매주 참여에 포인트 획득', '시즌 랭킹 및 보상'],
                link: { to: '/fan', label: '팬으로 참여' },
                accent: 'pink',
                highlighted: true,
              },
            ].map((card) => (
              <div key={card.title}
                className={`rounded-2xl border p-6 transition-all duration-300 hover:shadow-lg ${
                  card.highlighted
                    ? 'border-pink-200 bg-pink-50/50 hover:border-pink-300'
                    : 'border-slate-200 bg-white hover:border-emerald-300'
                }`}
              >
                <h3 className="text-lg font-bold text-slate-900 mb-1">{card.title}</h3>
                <p className="text-sm text-slate-500 mb-5">{card.desc}</p>
                <ul className="space-y-2.5 mb-6">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <Diamond className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to={card.link.to}
                  className={`text-sm font-semibold inline-flex items-center gap-1 transition-colors ${
                    card.accent === 'pink' ? 'text-pink-600 hover:text-pink-700' :
                    card.accent === 'sky' ? 'text-sky-600 hover:text-sky-700' :
                    'text-emerald-600 hover:text-emerald-700'
                  }`}
                >
                  {card.link.label} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════ CTA BANNER ════════════════════════ */}
      <section ref={r4.ref} className={`py-12 sm:py-16 px-5 transition-all duration-700 ${r4.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl px-8 sm:px-16 py-12 sm:py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">스폰서십의 새로운 기준</h2>
          <p className="text-emerald-100 text-sm sm:text-base mb-8">스크린골프 프로선수와 함께하는 마이크로 스폰서십 플랫폼</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to={isAuthenticated ? '/dashboard' : '/register'}
              className="h-11 px-6 inline-flex items-center gap-2 rounded-xl bg-white text-emerald-700 text-sm font-semibold hover:bg-emerald-50 transition-colors">
              지금 시작하기 <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login"
              className="h-11 px-6 inline-flex items-center gap-2 rounded-xl border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition-colors">
              로그인
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════ FOOTER ════════════════════════ */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-5 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo-48.png" alt="" className="w-7 h-7 rounded-lg" />
                <span className="text-sm font-extrabold text-slate-900">SPONPIK</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">스크린골프 프로선수<br />마이크로 스폰서 마켓플레이스</p>
            </div>
            {[
              { title: '서비스', links: [{ to: '/auctions', t: '경매 참여' }, { to: '/inventory', t: '슬롯 탐색' }, { to: '/votes', t: '투표 참여' }] },
              { title: '지원', links: [{ to: '/guide', t: '이용가이드' }, { to: '/faq', t: 'FAQ' }, { to: '/contact', t: '고객센터' }] },
              { title: '법적 고지', links: [{ to: '/terms', t: '이용약관' }, { to: '/privacy', t: '개인정보처리방침' }] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.to}><Link to={l.to} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">{l.t}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
            &copy; 2026 SPONPIK. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Hero LIVE 경매 카드 — docx 2-1: 실데이터 바인딩 (하드코딩 제거)
 * - hot: liveAuctions 응답의 첫 항목 (가장 임박한 LIVE 경매)
 * - 데이터 없을 때: "LIVE 경매 준비 중" 안내 (- 처리, docx 2-2)
 */
function HeroLiveAuctionCard({ hot }: { hot: any | null }) {
  if (!hot) {
    return (
      <div className="relative z-10">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-300/30 overflow-hidden p-8 text-center">
          <Zap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 mb-1">LIVE 경매 준비 중</h3>
          <p className="text-sm text-slate-500 mb-4">곧 새로운 경매가 시작됩니다.</p>
          <Link to="/auctions" className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700">
            전체 경매 보기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const tour = hot.slot || '-';
  const playerName = hot.player || '-';
  // bodyPart 한글 라벨 (Home 내 동일 매핑 일치)
  const partLabels: Record<string, string> = {
    CAP_FRONT: '모자 정면', CAP_SIDE_R: '모자 우측', CAP_SIDE_L: '모자 좌측', CAP_BACK: '모자 뒷면',
    CHEST_CENTER: '상의 중앙', CHEST_L: '상의 좌측', CHEST_R: '상의 우측',
    COLLAR_L: '카라 좌측', COLLAR_R: '카라 우측',
    SLEEVE_L: '소매 좌측', SLEEVE_R: '소매 우측',
    SHOULDER_L: '어깨 좌측', SHOULDER_R: '어깨 우측',
    WAIST_BACK: '허리 뒷면', PANTS_SIDE: '바지 측면',
  };
  const slotName = hot.slotName || partLabels[hot.bodyPart] || hot.bodyPart || '-';
  const price = hot.price || 0;
  const bids = hot.bids ?? 0;

  return (
    <div className="relative z-10">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-300/30 overflow-hidden">
        {/* LIVE badge */}
        <div className="px-5 pt-5 pb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
            <Zap className="w-3 h-3 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-700">LIVE 경매</span>
          </span>
        </div>

        {/* Title — 실데이터 */}
        <div className="px-5 pb-4">
          <h3 className="text-lg font-black text-slate-900 leading-snug mb-1">
            [{tour}] {playerName} - {slotName}
          </h3>
        </div>

        {/* Current bid — 실데이터 */}
        <div className="px-5 pb-3">
          <p className="text-xs text-slate-400 mb-0.5">현재 1위 입찰가</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {price > 0 ? `₩${Number(price).toLocaleString()}` : '-'}
          </p>
        </div>

        {/* Time remaining — 실데이터 (endAt 기반) */}
        <div className="px-5 pb-4">
          <p className="text-xs text-slate-400 mb-0.5">남은 시간</p>
          <p className="text-xl font-mono font-bold text-slate-700 tracking-widest">
            {hot.endAt ? formatTimeRemaining(hot.endAt) : '-'}
          </p>
        </div>

        {/* CTA → 실 경매 상세 */}
        <div className="px-5 pb-4">
          <Link
            to={`/auctions/${hot.id}`}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
          >
            입찰 참여하기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Bottom stats — 실데이터 (관심 등록은 미수집이므로 -) */}
        <div className="px-5 pb-5 flex items-center justify-center gap-8 text-center">
          <div>
            <p className="text-xs text-slate-400">입찰 참여</p>
            <p className="text-base font-black text-slate-900">{bids > 0 ? `${bids}건` : '-'}</p>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div>
            <p className="text-xs text-slate-400">관심 등록</p>
            <p className="text-base font-black text-slate-900">-</p>
          </div>
        </div>
      </div>
    </div>
  );
}
