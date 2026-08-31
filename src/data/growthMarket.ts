/**
 * 성장마켓 — 프로 × 브랜드 팬스토어 큐레이션
 *
 * 선수와 후원 브랜드가 함께 만든 팬 대상 스토어 목록이다.
 * 선수 사진은 원본 그대로 쓴다 (패치 합성 없음 — 사용자 지시).
 *
 * 상품은 미니스토어 API 실데이터가 있으면 그것을 쓰고, 등록 전이면
 * 아래 큐레이션 목록(사용자 제공 시안 기준)을 전시용으로 보여준다.
 * 전시용 상품은 구매 동선을 붙이지 않는다.
 */
export interface DisplayProduct {
  name: string;
  /** 정가 */
  listPrice: number;
  /** 판매가 */
  price: number;
  imageUrl?: string;
  /** 상세 페이지 경로 (있을 때만 링크) */
  href?: string;
}

export interface FanStore {
  /** 미니스토어 slug — 있으면 스토어로 연결, 없으면 준비중으로 표시 */
  slug?: string;
  /** 큐레이션 스토어 경로 — slug보다 우선 (예: /fan-store/orex) */
  storePath?: string;
  athleteName: string;
  /** 선수 상세로 연결할 id (있을 때) */
  athleteId?: string;
  brandName: string;
  /** 브랜드 로고 (원본) */
  brandLogo: string;
  /** 선수 원본 사진 */
  heroImage: string;
  /** 카드 설명 */
  description: string;
  /** 팬 혜택 배지 */
  benefit?: string;
  /** 전시용 상품 (시안 기준) — API 상품이 등록되면 그쪽이 우선 */
  displayProducts: DisplayProduct[];
}

export const FAN_STORES: FanStore[] = [
  {
    athleteName: '염돈웅',
    athleteId: 'ef6ad802-35e9-401c-bdc6-801d5d5fb546',
    brandName: 'OREX',
    brandLogo: '/brands/orex.png',
    heroImage: '/growth-market/youm-donwoong.jpg',
    description: '강력한 에너지처럼 응원하는 퍼포먼스. OREX와 염돈웅 프로가 함께합니다.',
    benefit: '10% 팬 할인',
    storePath: '/fan-store/orex',
    displayProducts: [
      { name: '오렉스 슈퍼플러스 알카라인 건전지 AA (2입)', listPrice: 4390, price: 3900, href: '/fan-store/orex/orex-alkaline-aa-2p' },
      { name: '오렉스 슈퍼플러스 알카라인 건전지 AAA (18입)', listPrice: 20000, price: 17400, href: '/fan-store/orex/orex-alkaline-aaa-18p' },
      { name: '오렉스 슈퍼플러스 알카라인 건전지 AAA (8입)', listPrice: 11900, price: 10500, href: '/fan-store/orex/orex-alkaline-aaa-8p' },
    ],
  },
  {
    athleteName: '염돈웅',
    athleteId: 'ef6ad802-35e9-401c-bdc6-801d5d5fb546',
    brandName: 'the GUYS',
    brandLogo: '/brands/the-guys.png',
    heroImage: '/growth-market/youm-donwoong.jpg',
    description: '진정한 스타일을 완성하는 골프웨어. 염돈웅 프로가 함께하는 the GUYS.',
    benefit: '10% 팬 할인',
    storePath: '/fan-store/the-guys',
    displayProducts: [
      { name: 'the GUYS × 염돈웅 프로 콜라보 폴로 셔츠 (화이트)', listPrice: 79000, price: 67150, href: '/fan-store/the-guys/guys-collab-polo-white' },
      { name: '쿨링 퍼포먼스 티셔츠 (블랙)', listPrice: 43000, price: 39000, href: '/fan-store/the-guys/guys-cooling-tee-black' },
      { name: 'the GUYS 로고 캡 (블랙)', listPrice: 43000, price: 39000, href: '/fan-store/the-guys/guys-logo-cap-black' },
    ],
  },
  {
    athleteName: '배진리',
    athleteId: '754e9c27-22aa-4d99-973f-1840619cb953',
    brandName: '호이베이커리',
    /* 원본은 정사각 간판 사진이라 로고 자리에서 글자가 뭉갠다. 가로형 워드마크를 쓴다 */
    brandLogo: '/brands/hoi-bakery-wordmark.png',
    heroImage: '/growth-market/bae-jinri.jpg',
    description: '좋은 기운을 굽는 빵집, 호이베이커리와 배진리 프로가 함께 만든 콜라보 제품과 팬 전용 베이커리 세트.',
    benefit: '10% 팬 할인',
    storePath: '/fan-store/hoi-bakery',
    displayProducts: [
      { name: '호이 시그니처 구움과자 선물세트 12구', listPrice: 36000, price: 32400, href: '/fan-store/hoi-bakery/hoi-signature-baked-12' },
      { name: '버터쿠키 틴', listPrice: 19000, price: 16720, href: '/fan-store/hoi-bakery/hoi-butter-cookie-tin' },
      { name: '피낭시에 & 마들렌 세트', listPrice: 26000, price: 23400, href: '/fan-store/hoi-bakery/hoi-financier-madeleine' },
    ],
  },
];

/** 성장마켓 이용 흐름 — 화면 하단 안내 */
export const HOW_TO_USE = [
  { title: '스토어 입장', desc: '원하는 선수 × 브랜드 팬스토어를 선택하세요.' },
  { title: '코드 받기 / 상품 선택', desc: '전용 할인코드를 받고 다양한 상품을 선택하세요.' },
  { title: '결제 및 혜택 적용', desc: 'SPON Pay 또는 일반결제로 결제하고 할인 혜택과 팬포인트를 적용 받으세요.' },
];
