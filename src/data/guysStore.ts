/**
 * the GUYS 팬스토어 (염돈웅 프로 × the GUYS) — 큐레이션 카탈로그
 *
 * 사용자 제공 시안 기준의 전시용 카탈로그. 운영 DB 미등록 상태이므로
 * 구매/장바구니는 "오픈 준비 중"으로 안내한다. 시안에 없는 수치는 지어내지 않는다.
 * id는 브레드크럼이 ID로 인식하도록 16자 이상 (Breadcrumb.isIdSegment).
 */

export interface GuysProduct {
  id: string;
  name: string;
  /** 스토어 메인 표시가 */
  price: number;
  /** 정가 (취소선) — 시안에 표기된 것만 */
  listPrice?: number;
  /** 상세의 팬 할인가 — 시안 표기 기준. 없으면 price 그대로 */
  fanPrice?: number;
  /** NEW 뱃지 (할인 뱃지 대신) */
  isNew?: boolean;
  /** 한정판 뱃지 */
  limited?: boolean;
  sizes?: string[];
  description: string;
  hashtags: string[];
  /** 패키지 구성 등 부가 설명 */
  bullets?: string[];
}

export const GUYS_STORE = {
  path: '/fan-store/the-guys',
  athleteName: '염돈웅',
  athleteTitle: 'KPGA 투어 프로',
  athletePhoto: '/growth-market/youm-donwoong.jpg',
  brandName: 'the GUYS',
  brandLogo: '/brands/the-guys.png',
  tagline: '컨템포러리 남성 패션 브랜드 the GUYS와 염돈웅 프로가 함께하는 스페셜 컬렉션을 팬 여러분께 선보입니다.',
  quote: '"필드 위에서의 집중과 일상에서의 편안함을 동시에." — 염돈웅 프로',
  fanCode: 'THEGUYS10',
  fanDiscountPct: 10,
  /** 구매 적립률 (시안: 예상 적립 1%) */
  earnRate: 0.01,
  /** 선수 응원 적립 (시안: 구매 금액의 3%가 선수에게 적립) */
  athleteEarnPct: 3,
  milestones: [
    { date: '5월 30일', label: '협업 완료' },
    { date: '8월 8일', label: '메이저 협업 예정' },
  ],
  /** AR 이미지팩 — 실제 파일이 있는 포맷만 다운로드 활성화 */
  arPack: [
    { key: 'square', label: '정사각형 이미지', dim: '1080 × 1080px', format: 'JPG', file: '/growth-market/ar/youm-donwoong-square-1080.jpg' },
    { key: 'story', label: '스토리용 9:16', dim: '1080 × 1920px', format: 'JPG', file: '/growth-market/ar/youm-donwoong-story-1080x1920.jpg' },
    { key: 'wallpaper', label: '월페이퍼 (16:9)', dim: '1920 × 1080px', format: 'JPG', file: '/growth-market/ar/youm-donwoong-wallpaper-1920x1080.jpg' },
    { key: 'png', label: '배경 제거 PNG', dim: '1080 × 1080px', format: 'PNG', file: null },
    { key: 'motion', label: '모션 클립 (MP4)', dim: '1080 × 1920px', format: 'MP4', file: null },
  ] as { key: string; label: string; dim: string; format: string; file: string | null }[],
};

const APPAREL_SIZES = ['S', 'M', 'L', 'XL'];

export const GUYS_PRODUCTS: GuysProduct[] = [
  {
    id: 'guys-collab-polo-white',
    name: 'the GUYS × 염돈웅 프로 콜라보 폴로 셔츠 (화이트)',
    price: 79000,
    fanPrice: 67150,
    isNew: true,
    sizes: APPAREL_SIZES,
    description:
      'the GUYS와 염돈웅 프로의 아이덴티티를 담아낸 콜라보 폴로 셔츠입니다. 흡습속건 기능성 원단과 메쉬 패널로 쾌적한 착용감을 제공하며, 필드와 일상 어디서나 세련된 스타일을 완성합니다.',
    hashtags: ['#theGUYS', '#염돈웅프로', '#콜라보', '#폴로셔츠', '#기능성'],
  },
  {
    id: 'guys-cooling-tee-black',
    name: '쿨링 퍼포먼스 티셔츠 (블랙)',
    price: 39000,
    listPrice: 43000,
    sizes: APPAREL_SIZES,
    description: '쿨링 기능성 원단으로 라운드 내내 쾌적한 퍼포먼스 티셔츠입니다.',
    hashtags: ['#theGUYS', '#퍼포먼스', '#티셔츠'],
  },
  {
    id: 'guys-performance-slacks',
    name: '퍼포먼스 슬랙스 (차콜)',
    price: 89000,
    isNew: true,
    sizes: APPAREL_SIZES,
    description: '스윙을 방해하지 않는 4방향 스트레치 퍼포먼스 슬랙스입니다.',
    hashtags: ['#theGUYS', '#슬랙스', '#스트레치'],
  },
  {
    id: 'guys-logo-cap-black',
    name: 'the GUYS 로고 캡 (블랙)',
    price: 39000,
    listPrice: 43000,
    description: 'the GUYS 시그니처 로고를 담은 데일리 캡입니다.',
    hashtags: ['#theGUYS', '#로고캡'],
  },
  {
    id: 'guys-linen-setup-beige',
    name: '린넨 셋업 (라이트 베이지)',
    price: 89000,
    listPrice: 105000,
    sizes: APPAREL_SIZES,
    description: '시원한 린넨 혼방 소재의 셋업으로 여름 라운드룩을 완성합니다.',
    hashtags: ['#theGUYS', '#린넨', '#셋업'],
  },
  {
    id: 'guys-88-major-package',
    name: 'the GUYS 8.8 메이저 협업 패키지',
    price: 129000,
    listPrice: 162000,
    limited: true,
    description:
      '염돈웅 프로와 the GUYS의 8.8 메이저 협업을 기념한 한정 패키지입니다. 화이트 폴로 셔츠, 블랙 로고 캡, 포토카드 3종, 스페셜 스티커로 구성되었습니다. 팬들을 위한 특별 제작 패키지로 소장 가치를 높였습니다.',
    hashtags: ['#더가이즈', '#염돈웅프로', '#팬스토어', '#한정패키지'],
    bullets: ['화이트 폴로 셔츠 + 블랙 로고 캡', '포토카드 3종 + 스페셜 스티커', '협업 패키지 전용 포토카드 증정'],
  },
];

export const findGuysProduct = (id?: string) => GUYS_PRODUCTS.find((p) => p.id === id);
