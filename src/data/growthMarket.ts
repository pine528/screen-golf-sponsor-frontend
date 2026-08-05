/**
 * 성장마켓 — 프로 × 브랜드 팬스토어 큐레이션
 *
 * 선수와 후원 브랜드가 함께 만든 팬 대상 스토어 목록이다.
 * 이미지는 선수 원본 사진에 브랜드 패치만 가슴 위치에 합성한 것으로,
 * 사진 자체는 보정하지 않는다 (`tools/` 합성 스크립트 참고).
 *
 * 상품·가격은 여기 두지 않는다. 실제 상품은 미니스토어 API에서 받아오고,
 * 아직 등록 전이면 상품 영역을 비워 둔다 (임의 수치 노출 금지 — 개편 LEG-06).
 */
export interface FanStore {
  /** 미니스토어 slug — 있으면 스토어로 연결, 없으면 준비중으로 표시 */
  slug?: string;
  athleteName: string;
  /** 선수 상세로 연결할 id (있을 때) */
  athleteId?: string;
  brandName: string;
  /** 브랜드 로고 (원본) */
  brandLogo: string;
  /** 선수 원본 사진 + 가슴 브랜드 패치 합성본 */
  heroImage: string;
  /** 카드 설명 */
  description: string;
  /** 팬 혜택 배지 */
  benefit?: string;
}

export const FAN_STORES: FanStore[] = [
  {
    athleteName: '염돈웅',
    athleteId: 'ef6ad802-35e9-401c-bdc6-801d5d5fb546',
    brandName: 'OREX',
    brandLogo: '/brands/orex.png',
    heroImage: '/growth-market/youm-donwoong-orex.jpg',
    description: '강력한 에너지처럼 응원하는 퍼포먼스. OREX와 염돈웅 프로가 함께합니다.',
    benefit: '팬 전용 할인',
  },
  {
    athleteName: '염돈웅',
    athleteId: 'ef6ad802-35e9-401c-bdc6-801d5d5fb546',
    brandName: 'the GUYS',
    brandLogo: '/brands/the-guys.png',
    heroImage: '/growth-market/youm-donwoong-theguys.jpg',
    description: '진정한 스타일을 완성하는 골프웨어. 염돈웅 프로가 함께하는 the GUYS.',
    benefit: '팬 전용 할인',
  },
  {
    athleteName: '배진리',
    athleteId: '754e9c27-0000-0000-0000-000000000000',
    brandName: '호이베이커리',
    brandLogo: '/brands/hoi-bakery.png',
    heroImage: '/growth-market/bae-jinri-hoibakery.jpg',
    description: '좋은 기운을 굽는 빵집, 호이베이커리와 배진리 프로가 함께 만든 홀리데이 제품.',
    benefit: '팬 전용 할인',
  },
];

/** 성장마켓 이용 흐름 — 화면 하단 안내 */
export const HOW_TO_USE = [
  { title: '스토어 입장', desc: '원하는 선수 × 브랜드 팬스토어를 선택하세요.' },
  { title: '코드 받기 / 상품 선택', desc: '팬 전용 혜택을 확인하고 상품을 고릅니다.' },
  { title: '결제 및 혜택 적용', desc: '결제 시 팬 혜택과 포인트가 함께 적용됩니다.' },
];
