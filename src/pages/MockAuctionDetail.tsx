import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Timer,
  Heart,
  BarChart3,
  Eye,
  Trophy,
  Tv,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAuctionSocket } from '../hooks/useSocket';
import { api } from '../services/api';
import { formatTimeRemaining, getBodyPartLabel } from '../utils';

/* ── Mock golfer data (fallback) ── */
const MOCK_GOLFERS: Record<string, {
  player: string; bodyPart: string; slot: string; price: number;
  timeLeft: string; bids: number; image: string; instagram: string;
  height: string; birth: string; proSince: string; location: string;
  career: string[];
}> = {
  'an-yein': { player: '안예인 프로', bodyPart: '모자 중앙', slot: 'KLPGA', price: 5000000, timeLeft: '2시간 남음', bids: 12, image: '/hero-model.png', instagram: '@yenisfree', height: '176cm', birth: '1998.05.03', proSince: '2018 KLPGA 정회원', location: '경기도 성남시', career: ['2026 SBSGOLF 골프클리닉', '2023~2025 다수 방송출연', '2024 미인큐 방송 진행', '2023 다수 유튜브채널 방송촬영', '2023 도레미파 방송진행', '2022 슈퍼루키지 방송진행', '2018 KLPGA 점프투어 4차전 3위', '2015 JGAA PHOENIX METRO JUNIOR CHAMPIONSHIP 우승', '2015 JGAA NEW YEAR SHOOTOUT 우승'] },
  m1: { player: '김주연 프로', bodyPart: '모자 정면', slot: 'KLPGA', price: 5000000, timeLeft: '2시간 남음', bids: 12, image: '/golfers/kim-juyeon.jpg', instagram: '@joo__yeon2__', height: '165cm', birth: '1996.12.03', proSince: '2016 KLPGA 정회원', location: '서울 광진구', career: ['2025 한국브리지협회 골프&브리지 어프로치 강의', '2025 인스파이어카지노 중국VIP 중국어 강의 및 행사진행', '2023-2026 팀테일러메이드 소속', '2024 LG에너지 솔루션 임직원대상 입문골프 강의', '2023 공치는 명훈이, 세븐의 골프7래 등 유튜브 다수 출연', '2022 SBSGOLF SG더매치 출연', '2022 GOLF&PBA 펀펀매치 출연', '2018 한국골프대학교 CEO과정 강의', '2018 한국골프대학교 졸업', '2016 그랜드 삼대인 점프투어 5위', '2015 킹스데일 점프투어 6위', '2013 MBC 영동배 2위'] },
  m2: { player: '채지은 프로', bodyPart: '상의 좌측', slot: 'KLPGA', price: 3500000, timeLeft: '5시간 남음', bids: 8, image: '/golfers/chae-jieun.jpg', instagram: '@chaejji_pro', height: '165cm', birth: '1993.09.08', proSince: '2012 KLPGA 정회원', location: '경기도 용인시', career: ['2025 한국브리지협회 골프&브리지 숏게임 강의', '2022 유튜브 골린이 아카데미 골랑골랑 출연', '2022 SBSGOLF SG골프 더매치 챔피언십 4차전 우승', '2021 유튜브 허경환의 잘생긴 골프TV 출연', '2015 KLPGA 정규투어 활동', '2015 KLPGA 드림투어 19차전 준우승', '2014 KLPGA 드림투어 14차전 우승', '2014 KLPGA 드림투어 15차전 준우승', '2014 KLPGA 드림투어 19차전 준우승'] },
  m3: { player: '공미정 프로', bodyPart: '어깨 우측', slot: 'KLPGA', price: 4200000, timeLeft: '3시간 남음', bids: 15, image: '/golfers/gong-mijeong.jpg', instagram: '@mijeong_x3x', height: '170cm', birth: '1997.10.27', proSince: '2016 KLPGA 정회원', location: '서울 강남구', career: ['2024-2026 핑골프 소속', '2023 테일러메이드 소속프로', '2018-2020 KPGA 정규투어 활동', '2020 KLPGA BC카드 한경레이디스컵 9위', '제42회 KLPGA 챔피언십 7위', '2016 국가대표 상비군', '2015 KB금융그룹배 여자아마 선수권대회 우승', '2015 제96회 전국체전 단체전 금메달', '2015 영동대학교 총장배 MBC주니어 골프대회 우승'] },
  m4: { player: '전승민 프로', bodyPart: '소매 좌측', slot: 'KLPGA', price: 2800000, timeLeft: '1일 남음', bids: 6, image: '/golfers/jeon-seungmin.jpg', instagram: '@j_min2mini', height: '168cm', birth: '1994.04.29', proSince: '2012 KLPGA 준회원', location: '경기도 하남시', career: ['2026 르꼬끄골프 앰버서더', '2025 HONMA CHINA 광고촬영', '2022 SBS GOLF 로테이션 게임 출연', '2021 SBS GOLF 골프에 반하다 출연', '2021 SBS GOLF 로테이션 게임 출연', '2020 와이디 퇴근길 골프 클래스', '2018-2020 와이드앵글 소속', '2019-2020 스릭슨클럽 계약', '2012-2021 KLPGA 점프투어', '2007-2011 부산시합 개인 및 단체 다수 입상', '아쿠쉬네트코리아 소속 (FJ, Titleist)'] },
  m5: { player: '권민경 프로', bodyPart: '모자 우측', slot: 'KLPGA', price: 3000000, timeLeft: '8시간 남음', bids: 9, image: '/golfers/kwon-minkyung.jpg', instagram: '', height: '165cm', birth: '1990.06.30', proSince: '2009 KLPGA 정회원', location: '서울 용산구', career: ['2024 UDR멤버스 광고촬영 완료', '2023 덴올tv 라이브커머스 촬영', '2018-2020 JTBC GOLF 생방송 라이브레슨 70 출연', '2018 골프다이제스트 스윙라이크잭 시즌3 출연', '2018 코오롱 FNC 잭니클라우스 골프웨어 소속 프로 활동', '2017 팀테일러메이드 소속', '2016-2018 SBS GOLF 아유레디, 끝까지간다, 플러스팁 출연', '2016-2018 SBS GOLF 골프아카데미 출연', '2016-2018 잭니클라우스 본사 교육 이수', '2014 필라테스 지도자 자격증', '2009-2012 KLPGA 드림투어 출전'] },
  m6: { player: '김도은 프로', bodyPart: '카라 우측', slot: 'LPGA', price: 1500000, timeLeft: '12시간 남음', bids: 4, image: '/golfers/kim-doeun.jpg', instagram: '@doeundl', height: '166cm', birth: '1999.05.25', proSince: 'LPGA T&CP CLASS A', location: '서울 강남구', career: ['LPGA Professionals', '용인대학교 골프학과 졸업', '연세대학교 스포츠응용산업학과 석사과정 재학', '2011 서울특별시 협회장배 개인전 우승', '2013 주니어골프컵 우승', '2018 대학골프연맹 회장배 단체전 우승', '2023 LPGA Girls golf 수료', '2023 SS키즈앤 주니어 청담 골프강사'] },
  m7: { player: '김현명 프로', bodyPart: '상의 좌측', slot: 'KLPGA', price: 6000000, timeLeft: '30분 남음', bids: 23, image: '/golfers/kim-hyunmyung.jpg', instagram: '@hyunmyung_85', height: '164cm', birth: '1985.09.06', proSince: '2003 KLPGA 정회원', location: '경기도 수원시', career: ['2019 JTBC GOLF 미녀삼총사 2 출연', '2018-2019 JTBC GOLF 맘스터치 레전드 빅매치 4, 5 MC', '2018 JTBC GOLF 미녀삼총사 1 출연', '2018 제4회 벤제프클럽 챔피언십 MC', '2016-2017 gswing(지스윙) 광고모델', '2016 경성대학교 평생교육원 강의', '2014 JTBC GOLF 그녀들의 유쾌한레슨, 브런치 타임 출연', '2014 강원관광대학교 겸임교수', '2004-2009 KLPGA 정규투어 활동', '2002-2003 국가대표'] },
  m8: { player: '남우리 프로', bodyPart: '어깨 좌측', slot: 'KLPGA', price: 3800000, timeLeft: '4시간 남음', bids: 11, image: '/golfers/nam-woori.jpg', instagram: '@woori_golf', height: '164cm', birth: '1992.01.07', proSince: '2009 KLPGA 정회원', location: '서울 강남구', career: ['2025 퍼시픽링스 코리아 PLK라운지 골프 행사 MC', '2024 Golf&PBA SG골프 오사카 매치 출연', '2019 JEEP 전시장 담당 프로', '2018-2019 JTBC SG골프 더매치 출연', '2016-2022 미디어 방송 및 개인레슨, 필드레슨, 기업 프로암 행사 활동', '2011-2012 한화골프단 소속프로 활동', '2011 KLPGA 정규투어 활동', '2009 KLPGA 점프투어 1차전 우승', '2009 KLPGA 점프투어 3차전 3위', '2006 SBS박카스 시도대항전 개인전, 단체전 우승'] },
  m9: { player: '노아영 프로', bodyPart: '소매 우측', slot: 'KLPGA', price: 2200000, timeLeft: '6시간 남음', bids: 7, image: '/golfers/no-ayoung.jpg', instagram: '@aaaaa._.yoi', height: '162cm', birth: '1999.07.18', proSince: '2018 KLPGA 정회원', location: '경기도 용인시', career: ['2024 SBSGOLF SGGOLF더매치 출연 3승', '2024 SGGOLF 펀펀매치 시즌6 출연', '2024 유튜브 공치는 명훈이 출연', '2018 KLPGA 그랜드-삼대인 점프투어 2차 우승', '2016 가누다배 전국 골프대회 여고부 우승', '2016 경기도 꿈나무 골프대회 고등부 우승', '2014 한국골프대학 전국 중고골프대회 우승', '2014 수원시장배 골프대회 우승'] },
  m10: { player: '서하경 프로', bodyPart: '허리 뒷면', slot: 'KLPGA', price: 4500000, timeLeft: '2일 남음', bids: 5, image: '/golfers/seo-hakyung.jpg', instagram: '@katie_seo', height: '166cm', birth: '1993.08.27', proSince: '2013 KLPGA 정회원', location: '서울 강남구', career: ['2023 SBS 골프아카데미 동계특집 출연', '2022 SBS SG더매치 출연', '2022 SBS 포켓레슨 출연', '2021 필사꾼3 출연', '2021 골프앤스포츠채널 라이브레슨 골프', '2015-2017 KLPGA 정규투어 활동', '2015 대방건설 소속 프로 활동', '2013 KLPGA 점프투어 11차전 우승'] },
  m11: { player: '석지우 프로', bodyPart: '모자 뒷면', slot: 'KLPGA', price: 2500000, timeLeft: '10시간 남음', bids: 3, image: '/golfers/seok-jiwoo.jpg', instagram: '@iamsukjiwoo', height: '168cm', birth: '1992.07.26', proSince: '2014 KLPGA 정회원', location: '경기도 수원시', career: ['2025-2026 에코골프 앰버서더', '2019-2021 넥시드 골프단', '2020 KLPGA WEST OCEAN CC 드림투어 15차전 29위', '2020-2021 와이드앵글 골프웨어 협찬', '2020 KLPGA 무안CC 올포유 드림투어 시드 순위전 예선 C조 5위', '2016 한국경제신문 골프 레슨 부분 모델', '2014-2019 NICE 골프행사 및 골프강의', '2014 KLPGA 신안배 점프투어 10차전 우승', '2010 KLPGA 아마추어 회장배 5위'] },
};

function generateMockBids(basePrice: number) {
  const bids = [];
  for (let i = 7; i >= 0; i--) {
    bids.push({ price: basePrice - (i * 100000), bidder: `user${Math.floor(Math.random() * 900) + 100}`, time: `${i * 3 + 1}분 전` });
  }
  return bids;
}

function generateOrderBook(basePrice: number) {
  const asks = [];
  const bidsBook = [];
  for (let i = 0; i < 8; i++) {
    asks.push({ price: basePrice + ((i + 1) * 100000), qty: Math.floor(Math.random() * 30) + 5, total: Math.floor(Math.random() * 15000) + 3000 });
    bidsBook.push({ price: basePrice - (i * 100000), qty: Math.floor(Math.random() * 25) + 3, total: Math.floor(Math.random() * 12000) + 2000 });
  }
  return { asks: asks.reverse(), bids: bidsBook };
}

export default function MockAuctionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const isMockId = id?.startsWith('m') && !id.includes('-');

  // ── Real data fetch (for non-mock IDs or when real auction exists) ──
  const { data: realAuction } = useQuery({
    queryKey: ['auction', id],
    queryFn: async () => {
      if (isMockId) return null;
      const r = await api.getAuction(id!);
      return r.data;
    },
    enabled: !!id && !isMockId,
    staleTime: 3_000,
    refetchInterval: 3_000,
  });

  // ── Other auctions by same athlete ──
  const athleteId = realAuction?.slotInstance?.athlete?.id;
  const { data: otherAuctions } = useQuery({
    queryKey: ['athlete-auctions', athleteId],
    queryFn: async () => {
      const r = await api.getAuctions({ athleteId, pageSize: 5 });
      return (r.data || []).filter((a: any) => a.id !== id);
    },
    enabled: !!athleteId,
    staleTime: 30_000,
  });

  // ── WebSocket real-time ──
  const handleBidPlaced = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['auction', id] });
  }, [queryClient, id]);

  const handleAuctionExtended = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['auction', id] });
  }, [queryClient, id]);

  const handleAuctionStatus = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['auction', id] });
  }, [queryClient, id]);

  const { isConnected, viewerCount } = useAuctionSocket(
    isMockId ? undefined : id,
    {
      onBidPlaced: handleBidPlaced,
      onAuctionExtended: handleAuctionExtended,
      onAuctionStatus: handleAuctionStatus,
    }
  );

  // ── Bid mutation ──
  const bidMutation = useMutation({
    mutationFn: async (maxBid: number) => {
      const auctionId = isMockId ? id! : id!;
      return api.placeBid(auctionId, maxBid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction', id] });
      setShowBidSuccess(true);
      setTimeout(() => setShowBidSuccess(false), 3000);
      setBidInput('');
    },
  });

  // ── Derive display data ──
  const golferMock = MOCK_GOLFERS[id || ''] || MOCK_GOLFERS.m1;
  const isReal = !!realAuction;

  const displayData = isReal ? {
    player: realAuction.slotInstance?.athlete?.name || '선수',
    bodyPart: getBodyPartLabel(realAuction.slotInstance?.slotTemplate?.bodyPart || ''),
    slot: realAuction.slotInstance?.slotTemplate?.code || 'SLOT',
    price: realAuction.currentPrice || realAuction.slotInstance?.reservePrice || 0,
    image: realAuction.slotInstance?.athlete?.profileImageUrl || golferMock.image,
    endAt: realAuction.endAt,
    status: realAuction.status,
    bidCount: realAuction._count?.bids ?? realAuction.bids?.length ?? 0,
    bids: (realAuction.bids || []).map((b: any) => ({
      price: b.currentProxy || b.maxBid,
      bidder: b.brand?.companyName || `brand${b.brandId?.slice(0, 4)}`,
      time: formatTimeRemaining(b.createdAt),
    })),
    height: golferMock.height,
    birth: golferMock.birth,
    proSince: golferMock.proSince,
    location: golferMock.location,
    instagram: golferMock.instagram,
    career: golferMock.career,
  } : {
    player: golferMock.player,
    bodyPart: golferMock.bodyPart,
    slot: golferMock.slot,
    price: golferMock.price,
    image: golferMock.image,
    endAt: null as string | null,
    status: 'LIVE',
    bidCount: golferMock.bids,
    bids: generateMockBids(golferMock.price),
    height: golferMock.height,
    birth: golferMock.birth,
    proSince: golferMock.proSince,
    location: golferMock.location,
    instagram: golferMock.instagram,
    career: golferMock.career,
  };

  const orderBook = generateOrderBook(displayData.price);

  // ── State ──
  const [bidInput, setBidInput] = useState('');
  const [showBidSuccess, setShowBidSuccess] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState('');

  // ── Countdown timer ──
  useEffect(() => {
    if (isReal && displayData.endAt) {
      const iv = setInterval(() => {
        const diff = Math.max(0, Math.floor((new Date(displayData.endAt!).getTime() - Date.now()) / 1000));
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      }, 1000);
      return () => clearInterval(iv);
    } else {
      const match = golferMock.timeLeft.match(/(\d+)/);
      if (!match) return;
      let secs = parseInt(match[1]) * (golferMock.timeLeft.includes('일') ? 86400 : golferMock.timeLeft.includes('시간') ? 3600 : 60);
      const iv = setInterval(() => {
        secs = Math.max(0, secs - 1);
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        setCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      }, 1000);
      return () => clearInterval(iv);
    }
  }, [isReal, displayData.endAt, golferMock.timeLeft]);

  // ── Bid handler ──
  const handleBid = () => {
    setBidError(null);
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'BRAND' && user?.role !== 'ADMIN') {
      setBidError('브랜드 계정만 입찰할 수 있습니다.');
      return;
    }
    const amount = Number(bidInput);
    if (!amount || amount <= 0) {
      setBidError('입찰 금액을 입력해주세요.');
      return;
    }
    if (amount < displayData.price) {
      setBidError(`현재가(₩${displayData.price.toLocaleString()}) 이상이어야 합니다.`);
      return;
    }

    if (isReal) {
      bidMutation.mutate(amount);
    } else {
      // Mock mode: simulate success
      setShowBidSuccess(true);
      setTimeout(() => setShowBidSuccess(false), 3000);
      setBidInput('');
    }
  };

  // ── Other auctions display data ──
  const otherAuctionsList = otherAuctions && otherAuctions.length > 0
    ? otherAuctions.map((a: any) => ({
        id: a.id,
        part: getBodyPartLabel(a.slotInstance?.slotTemplate?.bodyPart || ''),
        price: a.currentPrice || 0,
        status: a.status,
        time: a.status === 'LIVE' ? formatTimeRemaining(a.endAt) : a.status,
      }))
    : [
        { id: null, part: '상의 우측', price: 3200000, status: 'LIVE', time: '5시간' },
        { id: null, part: '어깨 좌측', price: 1800000, status: 'LIVE', time: '1일' },
        { id: null, part: '모자 뒷면', price: 900000, status: '예정', time: '3일 후' },
      ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo-48.png" alt="" className="w-7 h-7 rounded-lg" />
              <span className="text-base font-extrabold text-slate-900">SPONPIK</span>
            </Link>
            <span className="text-slate-200">|</span>
            <Link to="/" className="text-sm text-slate-400 hover:text-slate-900 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> 돌아가기
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {/* Real-time indicator */}
            {!isMockId && (
              <div className="flex items-center gap-1.5 text-[10px]">
                {isConnected ? (
                  <><Wifi className="w-3 h-3 text-emerald-500" /><span className="text-emerald-600">{viewerCount}명 시청</span></>
                ) : (
                  <><WifiOff className="w-3 h-3 text-slate-400" /><span className="text-slate-400">오프라인</span></>
                )}
              </div>
            )}
            {isAuthenticated ? (
              <Link to="/dashboard" className="h-8 px-4 inline-flex items-center rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600">대시보드</Link>
            ) : (
              <>
                <Link to="/login" className="text-sm text-slate-500 hover:text-slate-900">로그인</Link>
                <Link to="/register" className="h-8 px-4 inline-flex items-center rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600">시작하기</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero: Player + Auction Info */}
      <section className="max-w-7xl mx-auto px-5 pt-6 pb-8">
        <div className="grid lg:grid-cols-[1fr_360px] gap-5">

          {/* Left column */}
          <div className="flex flex-col gap-3">
          {/* Player image */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-square max-h-[480px]">
            <img src={displayData.image} alt={displayData.player} className="w-full h-full object-cover object-top" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="inline-block bg-white/80 backdrop-blur-md rounded-xl px-5 py-4 shadow-lg">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">{displayData.slot}</span>
                  <span className="text-[10px] text-slate-500">{displayData.bodyPart}</span>
                  {displayData.status === 'LIVE' && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded animate-pulse">LIVE</span>}
                </div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 mb-1">
                  {displayData.player} 스폰서십 슬롯
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{displayData.height}</span>
                  <span>·</span>
                  <span>{displayData.proSince}</span>
                  <span>·</span>
                  <span>{displayData.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Other auctions by this player */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mt-3">
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">{displayData.player}의 다른 슬롯</span>
              <Link to="/auctions" className="text-[10px] text-emerald-600 font-semibold hover:text-emerald-700">전체보기</Link>
            </div>
            <div className="p-2 space-y-1.5">
              {otherAuctionsList.map((item: any, i: number) => (
                <div
                  key={i}
                  onClick={() => item.id && navigate(`/auctions/${item.id}`)}
                  className="flex items-center justify-between px-2.5 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'LIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className="text-xs text-slate-700 font-medium">{item.part}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-900">₩{item.price.toLocaleString()}</span>
                    <span className={`text-[10px] ${item.status === 'LIVE' ? 'text-emerald-600' : 'text-slate-400'}`}>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>

          {/* Right: Bid Dashboard */}
          <div className="flex flex-col gap-3">
            {/* Order book */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">호가(Price)</span>
                <div className="flex gap-3 text-[10px]">
                  <span className="text-slate-400">잔량</span>
                  <span className="text-slate-400">(Total)</span>
                </div>
              </div>
              <div className="max-h-[130px] overflow-y-auto">
                {orderBook.asks.map((a, i) => (
                  <div key={`a${i}`} className="flex items-center justify-between px-4 py-1 text-xs hover:bg-slate-50">
                    <span className="text-sky-600 font-mono">₩{a.price.toLocaleString()}</span>
                    <div className="flex gap-4">
                      <span className="text-slate-400 w-8 text-right">{a.qty}</span>
                      <span className="text-slate-300 w-12 text-right">{a.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-2 bg-emerald-50 border-y border-emerald-200">
                  <span className="text-emerald-600 font-mono font-bold text-sm">₩{displayData.price.toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">현재가</span>
                </div>
                {orderBook.bids.map((b, i) => (
                  <div key={`b${i}`} className="flex items-center justify-between px-4 py-1 text-xs hover:bg-slate-50">
                    <span className="text-rose-500 font-mono">₩{b.price.toLocaleString()}</span>
                    <div className="flex gap-4">
                      <span className="text-slate-400 w-8 text-right">{b.qty}</span>
                      <span className="text-slate-300 w-12 text-right">{b.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bid Action */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">입찰 작성</span>
                <div className="flex items-center gap-1.5 text-rose-500 text-xs font-bold">
                  <Timer className="w-3.5 h-3.5" />
                  <span className="font-mono">{countdown || (isReal ? formatTimeRemaining(displayData.endAt) : golferMock.timeLeft)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-2">
                <button onClick={() => setBidInput(String(displayData.price + 500000))} className="h-8 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">+50만 P</button>
                <button onClick={() => setBidInput(String(displayData.price + 1000000))} className="h-8 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">+100만 P</button>
                <button onClick={() => setBidInput('')} className="h-8 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-400 hover:bg-slate-50 transition-colors">직접 입력</button>
              </div>

              <input
                type="text"
                value={bidInput ? `₩${Number(bidInput).toLocaleString()}` : ''}
                onChange={(e) => { setBidInput(e.target.value.replace(/[^0-9]/g, '')); setBidError(null); }}
                placeholder="직접 입력"
                className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 mb-2"
              />

              <button
                onClick={handleBid}
                disabled={bidMutation.isPending}
                className="w-full h-10 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {bidMutation.isPending ? '입찰 처리 중...' : isAuthenticated ? '입찰 참여하기' : '로그인 후 입찰하기'}
              </button>

              {bidError && (
                <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium">
                  {bidError}
                </div>
              )}
              {(bidMutation.error as any)?.response?.data?.message && (
                <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium">
                  {(bidMutation.error as any).response.data.message}
                </div>
              )}
              {showBidSuccess && (
                <div className="mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs text-center font-medium">
                  {isReal ? '입찰이 성공적으로 등록되었습니다!' : '입찰이 성공적으로 등록되었습니다! (데모)'}
                </div>
              )}
            </div>

            {/* Recent bids */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">최근 입찰 내역</span>
                <span className="text-[10px] text-slate-400">{displayData.bidCount}건</span>
              </div>
              <div className="max-h-[100px] overflow-y-auto">
                {displayData.bids.slice(0, 8).map((b: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-4 py-1.5 text-xs hover:bg-slate-50">
                    <span className="text-slate-400">{b.bidder}</span>
                    <span className="text-slate-900 font-mono font-semibold">₩{b.price.toLocaleString()}</span>
                    <span className="text-slate-400">{b.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auction Detail - Data Dashboard */}
      <section className="max-w-7xl mx-auto px-5 pb-10">
        <h2 className="text-base font-extrabold text-slate-900 mb-4">Auction Detail</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 미디어 가치 */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Tv className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">미디어 가치</h3>
                <p className="text-[10px] text-slate-400">최근 3개월 평균 TV 노출 시간</p>
              </div>
            </div>
            <p className="text-xl font-black text-emerald-600 mb-3">경기당 평균 25분</p>
            <p className="text-[10px] text-slate-400 mb-3">하이라이트 방송 도달률</p>
            <div className="flex items-end gap-1.5 h-16">
              {[60, 80, 45, 90, 70].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-emerald-400 rounded-t" style={{ height: `${h}%` }} />
                  <span className="text-[8px] text-slate-400">{['1일', '2일', '3일', '4일', '10일'][i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 팬덤 파워 */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-pink-100 flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-pink-600" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">팬덤 파워</h3>
                <p className="text-[10px] text-slate-400">선수 개인 SNS 인게이지먼트 지수</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: '좋아요', pct: 85, color: 'bg-pink-500' },
                { label: '댓글', pct: 65, color: 'bg-violet-500' },
                { label: '공유', pct: 45, color: 'bg-sky-500' },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-slate-500">{m.label}</span>
                    <span className="text-slate-900 font-semibold">{m.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-1.5 ${m.color} rounded-full`} style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 타깃 시청자 */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center">
                <Eye className="w-3.5 h-3.5 text-sky-600" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">타깃 시청자</h3>
                <p className="text-[10px] text-slate-400">인구통계학적 데이터</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 100 100" className="w-20 h-20 flex-shrink-0">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12"
                  strokeDasharray={`${0.6 * 251.3} ${251.3}`} strokeDashoffset="0"
                  className="origin-center -rotate-90" strokeLinecap="round" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="12"
                  strokeDasharray={`${0.2 * 251.3} ${251.3}`} strokeDashoffset={`${-0.6 * 251.3}`}
                  className="origin-center -rotate-90" strokeLinecap="round" />
                <text x="50" y="47" textAnchor="middle" className="fill-slate-900 text-xs font-black">2030</text>
                <text x="50" y="58" textAnchor="middle" className="fill-slate-400 text-[7px]">60% 남성</text>
              </svg>
              <div className="space-y-2">
                {[
                  { color: 'bg-emerald-500', label: '남성 60%' },
                  { color: 'bg-blue-500', label: '여성 20%' },
                  { color: 'bg-slate-300', label: '성별무응답 20%' },
                ].map((d) => (
                  <div key={d.label} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${d.color}`} />
                    <span className="text-[10px] text-slate-500">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 팬 VOTE */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">팬 VOTE</h3>
                <p className="text-[10px] text-slate-400">이 위치에 가장 잘 어울리는 브랜드는?</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { brand: 'A-Brand (예: 골프웨어)', pct: 48, color: 'bg-sky-500' },
                { brand: 'B-Brand (예: 테크)', pct: 28, color: 'bg-violet-500' },
                { brand: 'C-Brand (예: 자동차)', pct: 17, color: 'bg-amber-500' },
              ].map((v) => (
                <div key={v.brand}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-slate-500">{v.brand}</span>
                    <span className="text-slate-900 font-bold">{v.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-1.5 ${v.color} rounded-full`} style={{ width: `${v.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 응원 및 펀딩 랭킹 */}
        <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">응원 및 펀딩 랭킹</h3>
                <p className="text-[10px] text-slate-400">실시간 크라우드펀딩 형태로 참여한 팬들의 기여도 랭킹</p>
              </div>
            </div>
            <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold">
              <Trophy className="w-3 h-3" /> 명예의 전당
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              { rank: 1, name: '골프매니아', medal: '🥇' },
              { rank: 2, name: '이보미 프로 화이팅!', medal: '🥈' },
              { rank: 3, name: '최강이보미', medal: '🥉' },
              { rank: 4, name: '이보미 프로 화이팅', medal: '' },
              { rank: 5, name: '우리가 함께 스폰픽!', medal: '' },
            ].map((r) => (
              <div key={r.rank} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <span className="text-sm w-6 text-center">
                  {r.medal || <span className="text-[10px] text-slate-400 font-bold">{r.rank}</span>}
                </span>
                <span className="text-xs text-slate-700 flex-1">{r.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Player Info */}
      <section className="max-w-7xl mx-auto px-5 pb-16">
        <h2 className="text-base font-extrabold text-slate-900 mb-4">선수 프로필</h2>
        <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-5">
            <img src={displayData.image} alt={displayData.player} className="w-16 h-16 rounded-xl object-cover" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900 mb-1">{displayData.player}</h3>
              <div className="flex flex-wrap gap-2 text-xs text-slate-400 mb-3">
                <span>{displayData.slot}</span>
                <span>{displayData.height}</span>
                <span>{displayData.birth}</span>
                <span>{displayData.location}</span>
                {displayData.instagram && <span className="text-emerald-600 font-medium">{displayData.instagram}</span>}
              </div>
              <div className="space-y-1">
                {displayData.career.map((c: string, i: number) => (
                  <p key={i} className="text-xs text-slate-500">· {c}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
