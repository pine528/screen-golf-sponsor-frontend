import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Hexagon,
  Zap,
  Shield,
  ArrowRight,
  Trophy,
  Target,
  BarChart3,
  Clock,
  CheckCircle2,
  Activity,
  Sparkles,
  ChevronDown,
  LayoutDashboard,
  Menu,
  X,
  Vote,
  Star,
  Gavel,
  Users,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { formatTimeRemaining } from '../utils';

// Animated counter hook
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

// Live auction interface
interface LiveAuction {
  id: string;
  slot: string;
  player: string;
  price: number;
  endAt: string;
  bidCount: number;
}

// 팬 투표 개설자 역할 라벨
const CREATOR_ROLE_LABELS: Record<string, { label: string; color: string }> = {
  FAN: { label: '팬 투표', color: 'bg-pink-100 text-pink-700' },
  ATHLETE: { label: '선수 투표', color: 'bg-blue-100 text-blue-700' },
  BRAND: { label: '브랜드 투표', color: 'bg-orange-100 text-orange-700' },
  ADMIN: { label: '관리자 투표', color: 'bg-slate-100 text-slate-700' },
};

export function Home() {
  const { isAuthenticated } = useAuth();
  const [currentAuction, setCurrentAuction] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 활성 투표 조회 (리워드풀 기반)
  const { data: activeVotes } = useQuery({
    queryKey: ['home-active-votes'],
    queryFn: async () => {
      const res = await api.getVotes({ status: 'OPEN', pageSize: 4 });
      return (res.data || []).map((v: any) => ({
        id: v.id,
        title: v.title,
        type: 'vote' as const,
        participantCount: v._count?.participations ?? 0,
        endAt: v.closeAt,
        rewardBudgetEp: v.rewardBudgetEp,
      })).sort(
        (a: any, b: any) => new Date(a.endAt).getTime() - new Date(b.endAt).getTime()
      );
    },
    staleTime: 60000,
  });

  // 실시간 경매 조회
  const { data: liveAuctions } = useQuery({
    queryKey: ['home-live-auctions'],
    queryFn: async () => {
      const res = await api.getAuctions({ status: 'LIVE', pageSize: 4 });
      return (res.data || []).map((a: any) => ({
        id: a.id,
        slot: a.slotInstance?.slotTemplate?.code || 'SLOT',
        player: a.slotInstance?.athlete?.name || '선수',
        price: a.currentPrice || a.slotInstance?.reservePrice || 0,
        endAt: a.endAt,
        bidCount: a._count?.bids ?? 0,
      })) as LiveAuction[];
    },
    staleTime: 30000,
    refetchInterval: 30000, // 30초마다 갱신
  });

  const stats = [
    { label: '등록 선수', value: useCounter(1250), suffix: '+' },
    { label: '성사된 계약', value: useCounter(3400), suffix: '+' },
    { label: '파트너 브랜드', value: useCounter(180), suffix: '+' },
    { label: '월 거래액', value: useCounter(25), suffix: '억+' },
  ];

  const features = [
    {
      icon: Zap,
      title: '실시간 경매',
      description: '프록시 입찰 시스템으로 공정하고 투명한 경매를 경험하세요',
      color: 'emerald',
    },
    {
      icon: Shield,
      title: '안전한 계약',
      description: '에스크로 시스템과 KYC 검증으로 안전한 거래를 보장합니다',
      color: 'sky',
    },
    {
      icon: Clock,
      title: '스나이핑 방지',
      description: '자동 연장 시스템으로 마지막 순간 입찰도 공정하게',
      color: 'violet',
    },
    {
      icon: BarChart3,
      title: '데이터 분석',
      description: '상세한 노출 분석과 ROI 측정으로 효과를 극대화하세요',
      color: 'amber',
    },
  ];

  const howItWorks = [
    { step: '01', title: '슬롯 탐색', desc: '원하는 선수와 이벤트의 광고 슬롯을 탐색' },
    { step: '02', title: '입찰 참여', desc: '최대 금액 입력으로 자동 경쟁 시스템' },
    { step: '03', title: '계약 체결', desc: '낙찰 후 전자서명으로 계약 완료' },
    { step: '04', title: '소재 등록', desc: '광고 소재 업로드 및 검수 진행' },
  ];

  useEffect(() => {
    const auctionInterval = setInterval(() => {
      setCurrentAuction((prev) => (liveAuctions && liveAuctions.length > 0) ? (prev + 1) % liveAuctions.length : 0);
    }, 3000);

    const featureInterval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => {
      clearInterval(auctionInterval);
      clearInterval(featureInterval);
    };
  }, [liveAuctions]);

  return (
    <div className="min-h-screen bg-white">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-emerald-500/3 to-teal-500/3 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all">
                  <Hexagon className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <span className="text-lg sm:text-xl font-bold text-slate-900">SPONPIK</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">기능</Link>
              <Link to="/how-it-works" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">이용방법</Link>
              <Link to="/for-who" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">대상</Link>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden sm:flex items-center gap-3">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="btn btn-primary inline-flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  대시보드
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                  >
                    로그인
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary"
                  >
                    시작하기
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="sm:hidden pt-4 pb-2 border-t border-slate-200 mt-3">
              <div className="flex flex-col gap-2">
                <Link
                  to="/features"
                  className="px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  기능
                </Link>
                <Link
                  to="/how-it-works"
                  className="px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  이용방법
                </Link>
                <Link
                  to="/for-who"
                  className="px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  대상
                </Link>
                <div className="border-t border-slate-200 mt-2 pt-2 flex gap-2">
                  {isAuthenticated ? (
                    <Link
                      to="/dashboard"
                      className="btn btn-primary flex-1 inline-flex items-center justify-center gap-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      대시보드
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="btn btn-secondary flex-1"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        로그인
                      </Link>
                      <Link
                        to="/register"
                        className="btn btn-primary flex-1"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        시작하기
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center lg:min-h-[70vh]">
            {/* Left Content */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-emerald-100 text-emerald-700 text-xs sm:text-sm font-medium mb-6 sm:mb-8 border border-emerald-200">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>GTOUR · WGTOUR 공식 파트너</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black leading-[1.1] mb-4 sm:mb-6">
                <span className="text-slate-900">프로선수</span>
                <br />
                <span className="gradient-text">스폰서십의</span>
                <br />
                <span className="text-slate-900">새로운 방식</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-6 sm:mb-10 max-w-lg">
                실시간 경매 시스템으로 스크린골프 프로선수의 광고 슬롯을
                투명하고 공정하게 거래하세요
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="btn btn-primary text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 inline-flex items-center justify-center gap-2 group"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    대시보드로 이동
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    className="btn btn-primary text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 inline-flex items-center justify-center gap-2 group"
                  >
                    지금 시작하기
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
                <Link
                  to="/auctions"
                  className="btn btn-secondary text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 inline-flex items-center justify-center gap-2"
                >
                  <Gavel className="w-4 h-4" />
                  경매 둘러보기
                </Link>
                <Link
                  to="/inventory"
                  className="btn btn-secondary text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 inline-flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  선수 둘러보기
                </Link>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 sm:gap-10 mt-8 sm:mt-14 pt-6 sm:pt-10 border-t border-slate-200">
                {stats.slice(0, 3).map((stat, i) => (
                  <div key={i}>
                    <div className="text-xl sm:text-3xl font-bold text-slate-900">
                      {stat.value.toLocaleString()}{stat.suffix}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Live Auction Card */}
            <div className="relative mt-8 lg:mt-0">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl blur-2xl" />
              <div className="relative card p-4 sm:p-8">
                <div className="flex items-center justify-between mb-4 sm:mb-8">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-slate-900 font-semibold text-sm sm:text-base">실시간 경매</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">LIVE</span>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {(!liveAuctions || liveAuctions.length === 0) ? (
                    <div className="text-center py-8 text-slate-500">
                      <Gavel className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">현재 진행 중인 경매가 없습니다</p>
                      <Link to="/auctions" className="text-emerald-600 text-sm hover:underline mt-2 inline-block">
                        경매 목록 보기 →
                      </Link>
                    </div>
                  ) : (
                    liveAuctions.map((auction, i) => (
                      <Link
                        to={`/auctions/${auction.id}`}
                        key={auction.id}
                        className={`relative block p-3 sm:p-4 rounded-xl transition-all duration-500 ${
                          i === currentAuction
                            ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/30'
                            : 'bg-slate-50 border border-transparent hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-4">
                            <div className={`w-12 h-10 sm:w-14 sm:h-12 px-1 rounded-xl flex items-center justify-center overflow-hidden ${
                              i === currentAuction
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                                : 'bg-slate-200'
                            }`}>
                              <span className={`text-[8px] sm:text-[10px] font-bold truncate ${i === currentAuction ? 'text-white' : 'text-slate-600'}`}>{auction.slot}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-sm sm:text-base">{auction.player} 프로</p>
                              <p className="text-xs sm:text-sm text-slate-500">{auction.bidCount > 0 ? `${auction.bidCount}건 입찰` : '입찰 대기'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900 text-sm sm:text-base">₩{auction.price.toLocaleString()}</p>
                            <p className="text-xs sm:text-sm font-medium text-emerald-600">
                              {formatTimeRemaining(auction.endAt)}
                            </p>
                          </div>
                        </div>
                        {auction.bidCount > 0 && i === currentAuction && (
                          <div className="absolute -top-1 -right-1">
                            <span className="flex h-4 w-4 sm:h-5 sm:w-5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 sm:h-5 sm:w-5 bg-emerald-500 items-center justify-center">
                                <Zap className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                              </span>
                            </span>
                          </div>
                        )}
                      </Link>
                    ))
                  )}
                </div>

                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200 flex items-center justify-between">
                  <Link to="/auctions" className="text-slate-500 text-xs sm:text-sm hover:text-emerald-600">
                    전체 경매 보기 →
                  </Link>
                  {liveAuctions && liveAuctions.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg sm:text-xl font-bold text-slate-900">
                        {formatTimeRemaining(liveAuctions[0].endAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="hidden sm:flex justify-center mt-10">
            <a href="#features" className="flex flex-col items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors">
              <span className="text-xs">스크롤</span>
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {/* Active Votes Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-violet-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-violet-100 text-violet-600 text-sm font-medium mb-4 sm:mb-6">
              LIVE VOTES
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
              <span className="gradient-text">진행 중인 투표</span>에 참여하세요
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              예측에 성공하면 포인트를 획득할 수 있습니다
            </p>
          </div>

          {activeVotes && activeVotes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {activeVotes.map((vote: any) => (
                <Link
                  key={vote.id}
                  to={`/votes/${vote.id}`}
                  className="card p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/30 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      vote.type === 'admin'
                        ? 'bg-sky-100 text-sky-700'
                        : CREATOR_ROLE_LABELS[vote.creatorRole]?.color || 'bg-violet-100 text-violet-700'
                    }`}>
                      {vote.type === 'admin'
                        ? '관리자 투표'
                        : CREATOR_ROLE_LABELS[vote.creatorRole]?.label || '팬 투표'}
                    </span>
                    <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 group-hover:text-violet-600 transition-colors line-clamp-2">
                    {vote.title}
                  </h3>

                  <p className="text-sm text-slate-500 mb-4">
                    {vote.questionType || (vote.prizePool ? `상금 ${Number(vote.prizePool).toLocaleString()}P` : '투표')}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-1 text-slate-500 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{vote.participantCount}명</span>
                    </div>
                    <div className="flex items-center gap-1 text-red-600 text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      <span>{formatTimeRemaining(vote.endAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-violet-100 rounded-2xl flex items-center justify-center">
                <Vote className="w-8 h-8 sm:w-10 sm:h-10 text-violet-400" />
              </div>
              <p className="text-slate-500 text-sm sm:text-base mb-2">현재 진행 중인 투표가 없습니다</p>
              <p className="text-slate-400 text-xs sm:text-sm">곧 새로운 투표가 시작됩니다!</p>
            </div>
          )}

          <div className="text-center mt-8 sm:mt-10">
            <Link
              to="/votes"
              className="btn btn-secondary inline-flex items-center gap-2"
            >
              <Vote className="w-4 h-4" />
              모든 투표 보기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-slate-200 text-slate-600 text-sm font-medium mb-4 sm:mb-6">
              FEATURES
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
              왜 <span className="gradient-text">SPONPIK</span>인가요?
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              스크린골프 스폰서십 시장을 혁신하는 핵심 기능들
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              const bgColorMap: Record<string, string> = {
                emerald: 'bg-emerald-100 text-emerald-600',
                sky: 'bg-sky-100 text-sky-600',
                violet: 'bg-violet-100 text-violet-600',
                amber: 'bg-amber-100 text-amber-600',
              };

              return (
                <div
                  key={i}
                  className={`card p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 ${
                    activeFeature === i ? 'ring-2 ring-emerald-500/50' : ''
                  }`}
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${bgColorMap[feature.color]} flex items-center justify-center mb-4 sm:mb-5`}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-slate-200 text-slate-600 text-sm font-medium mb-4 sm:mb-6">
              HOW IT WORKS
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
              간단한 <span className="gradient-text">4단계</span> 프로세스
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              누구나 쉽게 시작할 수 있습니다
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent -translate-y-1/2" />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
              {howItWorks.map((item, i) => (
                <div key={i} className="relative text-center group">
                  <div className="relative inline-flex mb-4 sm:mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:border-emerald-500/50 transition-colors">
                      <span className="text-xl sm:text-2xl font-black gradient-text">{item.step}</span>
                    </div>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Slots Section */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-slate-200 text-slate-600 text-sm font-medium mb-4 sm:mb-6">
              AD SLOTS
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
              <span className="gradient-text">Top 6</span> 프리미엄 슬롯
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              방송 노출이 가장 높은 프리미엄 광고 위치
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {[
              { code: 'CHEST_L', name: '가슴 좌측', part: 'Chest Left', price: '200만~', hot: true },
              { code: 'CHEST_R', name: '가슴 우측', part: 'Chest Right', price: '200만~', hot: true },
              { code: 'SLEEVE_R', name: '소매 우측', part: 'Sleeve Right', price: '80만~', hot: false },
              { code: 'SLEEVE_L', name: '소매 좌측', part: 'Sleeve Left', price: '80만~', hot: false },
              { code: 'CAP_FRONT', name: '모자 정면', part: 'Cap Front', price: '250만~', hot: true },
              { code: 'CAP_BACK', name: '모자 후면', part: 'Cap Back', price: '35만~', hot: false },
            ].map((slot) => (
              <div
                key={slot.code}
                className="group card p-4 sm:p-6 hover:border-emerald-500/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:border-emerald-500/50 transition-colors">
                    <span className="text-xs sm:text-sm font-bold text-emerald-600">{slot.code}</span>
                  </div>
                  {slot.hot && (
                    <span className="badge badge-warning text-[10px] sm:text-xs">
                      <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                      인기
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-xl font-bold text-slate-900 mb-1">{slot.name}</h3>
                <p className="text-slate-500 text-xs sm:text-sm mb-3 sm:mb-4">{slot.part}</p>
                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-200">
                  <span className="text-[10px] sm:text-xs text-slate-500">시작가</span>
                  <span className="font-bold text-emerald-600 text-sm sm:text-base">₩{slot.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Who Section */}
      <section id="for-who" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-4">
              누구를 위한 서비스인가요?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {/* For Brands */}
            <div className="card p-5 sm:p-8">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-sky-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 sm:w-7 sm:h-7 text-sky-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">브랜드 · 광고주</h3>
              </div>
              <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6 leading-relaxed">
                스크린골프 방송 시청자에게 효과적으로 브랜드를 노출하세요
              </p>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {[
                  '원하는 예산 내 자동 입찰',
                  '실시간 경쟁 모니터링',
                  '성과 리포트 제공',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="btn btn-secondary inline-flex items-center gap-2 text-sm sm:text-base w-full justify-center">
                브랜드로 시작
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* For Athletes */}
            <div className="card p-5 sm:p-8">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">선수 · 매니지먼트</h3>
              </div>
              <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6 leading-relaxed">
                추가 수익을 창출하고 팬들에게 더 가까이 다가가세요
              </p>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {[
                  '슬롯별 가용성 직접 설정',
                  '계약 조건 검토 및 승인',
                  'D+7 영업일 내 정산',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="btn btn-primary inline-flex items-center gap-2 text-sm sm:text-base w-full justify-center">
                선수로 시작
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* For Fans */}
            <div className="card p-5 sm:p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Vote className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">팬 · 일반회원</h3>
              </div>
              <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6 leading-relaxed">
                투표에 참여하고 포인트를 획득하세요
              </p>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {[
                  '경기 결과 예측 투표',
                  '퀴즈 참여로 포인트 적립',
                  '선수 랭킹 확인',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 sm:gap-3">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/fan/register" className="btn bg-amber-500 text-white hover:bg-amber-600 inline-flex items-center gap-2 text-sm sm:text-base w-full justify-center">
                팬으로 참여
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-3xl blur-3xl" />
            <div className="relative card p-8 sm:p-12 text-center bg-gradient-to-br from-emerald-500 to-teal-500 border-0">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                스폰서십의 새로운 기준
              </h2>
              <p className="text-emerald-100 text-base sm:text-lg mb-6 sm:mb-8 max-w-xl mx-auto">
                스크린골프 프로선수와 함께하는 마이크로 스폰서십
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-all shadow-lg hover:-translate-y-0.5"
                  >
                    <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
                    대시보드로 이동
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-all shadow-lg hover:-translate-y-0.5"
                    >
                      지금 시작하기
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
                    >
                      로그인
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Hexagon className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-base sm:text-lg font-bold text-slate-900">SPONPIK</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                스크린골프 프로선수 마이크로 스폰서 마켓플레이스
              </p>
            </div>
            <div>
              <h4 className="text-slate-900 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">서비스</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-500">
                <li><Link to="/auctions" className="hover:text-slate-900 transition-colors">경매 참여</Link></li>
                <li><Link to="/inventory" className="hover:text-slate-900 transition-colors">슬롯 탐색</Link></li>
                <li><Link to="/contracts" className="hover:text-slate-900 transition-colors">계약 관리</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-900 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">지원</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-500">
                <li><Link to="/guide" className="hover:text-slate-900 transition-colors">이용가이드</Link></li>
                <li><Link to="/faq" className="hover:text-slate-900 transition-colors">자주 묻는 질문</Link></li>
                <li><Link to="/contact" className="hover:text-slate-900 transition-colors">고객센터</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-900 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">법적 고지</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-500">
                <li><Link to="/terms" className="hover:text-slate-900 transition-colors">이용약관</Link></li>
                <li><Link to="/privacy" className="hover:text-slate-900 transition-colors">개인정보처리방침</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 sm:pt-8 border-t border-slate-200 text-center text-slate-500 text-xs sm:text-sm">
            <p>&copy; 2026 SPONPIK. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
