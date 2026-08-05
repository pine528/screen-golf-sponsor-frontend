/**
 * OREX 팬스토어 (염돈웅 프로 × OREX) — 큐레이션 카탈로그
 *
 * 사용자 제공 시안 기준의 전시용 카탈로그다. 아직 운영 DB에 등록된 상품이
 * 아니므로 실제 구매/장바구니 동선은 붙이지 않고 "오픈 준비 중"으로 안내한다.
 * 시안에 없는 수치(정가 등)는 지어내지 않고 비워 둔다.
 *
 * id는 브레드크럼이 ID 조각으로 인식하도록 16자 이상으로 만든다 (Breadcrumb.isIdSegment).
 */

export interface OrexProduct {
  id: string;
  name: string;
  price: number;
  /** 정가 — 시안에 표기된 것만. 없으면 취소선/할인율 미표시 */
  listPrice?: number;
  /** 입수 (1개당 가격 계산용) */
  unitCount: number;
  category: '알카라인 건전지' | '코인/리튬 전지';
  size: 'AA' | 'AAA' | 'C/D' | '9V' | '코인';
  /** 상세 설명 불릿 */
  bullets: string[];
  /** 상품 정보 - 구성 */
  composition: string;
}

export const OREX_STORE = {
  path: '/fan-store/orex',
  athleteName: '염돈웅',
  athleteTitle: 'KPGA 투어 프로',
  athletePhoto: '/growth-market/youm-donwoong.jpg',
  brandName: 'OREX',
  brandLogo: '/brands/orex.png',
  description: '강력한 에너지처럼 응원하는 퍼포먼스, OREX와 염돈웅 프로가 함께합니다.',
  fanCode: 'OREXFAN10',
  fanDiscountPct: 10,
  /** 구매 시 최대 적립률 (시안 수치 기준 5%) */
  earnRate: 0.05,
  shippingFee: 3000,
  freeShippingOver: 30000,
  arLinks: ['https://photoar.elgrim.kr/ar/oebwq9h3', 'https://photoar.elgrim.kr/ar/6sdtafzp'],
};

const COMMON_BULLETS = [
  '고성능 알카라인으로 강력하고 오래가는 파워',
  '다양한 전자기기에 안정적인 성능 제공',
  '누액 방지 설계로 안전하게 사용 가능',
];

export const OREX_PRODUCTS: OrexProduct[] = [
  {
    id: 'orex-alkaline-aa-2p',
    name: '오렉스 슈퍼플러스 알카라인 건전지 AA (2입)',
    price: 3900,
    listPrice: 4390,
    unitCount: 2,
    category: '알카라인 건전지',
    size: 'AA',
    bullets: COMMON_BULLETS,
    composition: 'AA 건전지 2입 (1.5V)',
  },
  {
    id: 'orex-alkaline-aaa-18p',
    name: '오렉스 슈퍼플러스 알카라인 건전지 AAA (18입)',
    price: 17400,
    listPrice: 20000,
    unitCount: 18,
    category: '알카라인 건전지',
    size: 'AAA',
    bullets: [...COMMON_BULLETS, '18입 대용량 구성으로 가성비 UP'],
    composition: 'AAA 건전지 18입 (1.5V)',
  },
  {
    id: 'orex-alkaline-aaa-8p',
    name: '오렉스 슈퍼플러스 알카라인 건전지 AAA (8입)',
    price: 10500,
    listPrice: 11900,
    unitCount: 8,
    category: '알카라인 건전지',
    size: 'AAA',
    bullets: COMMON_BULLETS,
    composition: 'AAA 건전지 8입 (1.5V)',
  },
  {
    id: 'orex-alkaline-aa-16p',
    name: '오렉스 슈퍼플러스 알카라인 건전지 AA (16입)',
    price: 15900,
    unitCount: 16,
    category: '알카라인 건전지',
    size: 'AA',
    bullets: [...COMMON_BULLETS, '16입 대용량 구성으로 가성비 UP'],
    composition: 'AA 건전지 16입 (1.5V)',
  },
  {
    id: 'orex-alkaline-c-4p',
    name: '오렉스 슈퍼플러스 알카라인 건전지 C (4입)',
    price: 7900,
    unitCount: 4,
    category: '알카라인 건전지',
    size: 'C/D',
    bullets: COMMON_BULLETS,
    composition: 'C 건전지 4입 (1.5V)',
  },
  {
    id: 'orex-alkaline-d-2p',
    name: '오렉스 슈퍼플러스 알카라인 건전지 D (2입)',
    price: 7600,
    unitCount: 2,
    category: '알카라인 건전지',
    size: 'C/D',
    bullets: COMMON_BULLETS,
    composition: 'D 건전지 2입 (1.5V)',
  },
  {
    id: 'orex-lithium-cr2032-5p',
    name: '오렉스 리튬 코인전지 CR2032 (5입)',
    price: 5300,
    unitCount: 5,
    category: '코인/리튬 전지',
    size: '코인',
    bullets: ['안정적인 3V 리튬 전원', '리모컨·체중계·차키 등 소형기기용', '낱개 블리스터 포장으로 보관 편리'],
    composition: 'CR2032 리튬 코인전지 5입 (3V)',
  },
  {
    id: 'orex-alkaline-9v-1p',
    name: '오렉스 슈퍼플러스 알카라인 9V 건전지 (1입)',
    price: 4900,
    unitCount: 1,
    category: '알카라인 건전지',
    size: '9V',
    bullets: COMMON_BULLETS,
    composition: '9V 건전지 1입',
  },
];

export const findOrexProduct = (id?: string) => OREX_PRODUCTS.find((p) => p.id === id);

/** 시안 표기 "내일(목) 도착 예정" — 내일 요일을 실제 날짜로 계산 */
export function tomorrowLabel() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `내일(${'일월화수목금토'[d.getDay()]})`;
}
