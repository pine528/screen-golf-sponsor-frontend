/**
 * 호이베이커리 팬스토어 (배진리 프로 × 호이베이커리) — 큐레이션 카탈로그
 *
 * 사용자 제공 시안 기준의 전시용 카탈로그. 운영 DB 미등록 상태이므로
 * 구매/장바구니는 "오픈 준비 중"으로 안내한다. 시안에 없는 수치는 지어내지 않는다.
 * id는 브레드크럼이 ID로 인식하도록 16자 이상 (Breadcrumb.isIdSegment).
 */

export type HoiShipping = '상온 배송' | '냉장 배송' | '냉동 배송';

export interface HoiProduct {
  id: string;
  name: string;
  price: number;
  listPrice: number;
  category: string;
  shipping: HoiShipping;
  description: string;
  hashtags: string[];
}

export const HOI_STORE = {
  path: '/fan-store/hoi-bakery',
  athleteName: '배진리',
  athleteTitle: 'KLPGA 투어 프로',
  athletePhoto: '/growth-market/bae-jinri.jpg',
  brandName: '호이베이커리',
  brandLogo: '/brands/hoi-bakery-wordmark.png',
  tagline: '"좋은 기운을 굽는 빵집", 호이베이커리와 배진리 프로가 함께 만든 콜라보 제품과 팬 전용 베이커리 세트!',
  fanCode: 'HOIFAN10',
  fanDiscountPct: 10,
  /** 구매 적립률 (시안: 구매 적립 1%) */
  earnRate: 0.01,
  shippingFee: 3500,
  freeShippingOver: 35000,
  /** 시안 표기 AR 링크 */
  arLinks: ['https://sponpik.com/ar/jinri_bae/ar1', 'https://sponpik.com/ar/jinri_bae/ar2'],
  arPack: [
    { key: 'square', label: '정사각형', dim: '1080×1080', file: '/growth-market/ar/bae-jinri-square-1080.jpg' },
    { key: 'portrait', label: '세로', dim: '1080×1350', file: '/growth-market/ar/bae-jinri-portrait-1080x1350.jpg' },
    { key: 'landscape', label: '가로', dim: '1200×675', file: '/growth-market/ar/bae-jinri-landscape-1200x675.jpg' },
  ],
};

export const HOI_PRODUCTS: HoiProduct[] = [
  {
    id: 'hoi-signature-baked-12',
    name: '호이 시그니처 구움과자 선물세트 12구',
    price: 32400,
    listPrice: 36000,
    category: '구움과자',
    shipping: '상온 배송',
    description:
      '호이베이커리의 인기 구움과자 12종을 정성스럽게 담은 선물세트입니다. 마들렌, 휘낭시에, 쿠키까지 다양한 맛과 식감을 한 번에 즐기실 수 있어 소중한 분께 마음을 전하기 좋은 세트입니다.',
    hashtags: ['#구움과자세트', '#선물세트', '#호이베이커리', '#배진리프로', '#팬스토어'],
  },
  {
    id: 'hoi-butter-cookie-tin',
    name: '버터쿠키 틴',
    price: 16720,
    listPrice: 19000,
    category: '쿠키',
    shipping: '상온 배송',
    description: '진한 버터 풍미의 수제 쿠키를 틴 케이스에 담았습니다. 선물로도, 곁에 두고 즐기기에도 좋습니다.',
    hashtags: ['#버터쿠키', '#쿠키틴', '#호이베이커리'],
  },
  {
    id: 'hoi-financier-madeleine',
    name: '피낭시에 & 마들렌 세트',
    price: 23400,
    listPrice: 26000,
    category: '구움과자',
    shipping: '상온 배송',
    description: '갓 구운 피낭시에와 마들렌을 함께 담은 호이베이커리의 대표 구움과자 세트입니다.',
    hashtags: ['#피낭시에', '#마들렌', '#구움과자'],
  },
  {
    id: 'hoi-mini-favor-box-6',
    name: '답례품 미니 박스 (6입)',
    price: 13800,
    listPrice: 15000,
    category: '답례품',
    shipping: '상온 배송',
    description: '작지만 정성 가득한 답례품 미니 박스입니다. 감사의 마음을 전하기 좋은 구성입니다.',
    hashtags: ['#답례품', '#미니박스', '#호이베이커리'],
  },
  {
    id: 'hoi-frozen-saltbread-set',
    name: '냉동 소금빵 홈베이크 세트',
    price: 15300,
    listPrice: 18000,
    category: '냉동 홈베이크',
    shipping: '냉동 배송',
    description: '집에서 갓 구운 맛 그대로. 오븐에 데우기만 하면 완성되는 냉동 소금빵 홈베이크 세트입니다.',
    hashtags: ['#소금빵', '#홈베이크', '#냉동배송'],
  },
  {
    id: 'hoi-dripbag-cookie-set',
    name: '드립백 커피 & 쿠키 세트',
    price: 18900,
    listPrice: 21000,
    category: '선물세트',
    shipping: '상온 배송',
    description: '드립백 커피와 수제 쿠키를 함께 담아 티타임을 완성하는 세트입니다.',
    hashtags: ['#드립백', '#커피', '#쿠키세트'],
  },
  {
    id: 'hoi-basque-cheesecake-mini',
    name: '바스크 치즈케이크 미니',
    price: 14500,
    listPrice: 15800,
    category: '케이크',
    shipping: '냉장 배송',
    description: '진한 치즈 풍미의 바스크 치즈케이크를 미니 사이즈로 즐겨보세요.',
    hashtags: ['#바스크치즈케이크', '#디저트'],
  },
  {
    id: 'hoi-jam-scone-set',
    name: '수제 잼 & 스콘 세트',
    price: 19800,
    listPrice: 22000,
    category: '선물세트',
    shipping: '상온 배송',
    description: '수제 잼과 담백한 스콘을 함께 담은 브런치 세트입니다.',
    hashtags: ['#수제잼', '#스콘', '#브런치'],
  },
];

export const findHoiProduct = (id?: string) => HOI_PRODUCTS.find((p) => p.id === id);
