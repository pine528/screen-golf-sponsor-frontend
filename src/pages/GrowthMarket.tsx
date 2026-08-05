/**
 * 성장마켓 (/growth-market)
 *
 * 프로와 후원 브랜드가 팬을 대상으로 함께 운영하는 스토어를 모아 보여준다.
 * 스토어 목록은 큐레이션(`data/growthMarket.ts`), 상품은 미니스토어 API 실데이터가
 * 우선이고 등록 전이면 시안 기준 전시용 상품을 보여준다 (구매 동선 없음).
 *
 * 레이아웃은 사용자 제공 시안 기준:
 *  - 히어로: 좌 카피 + 혜택 칩 5개 / 우 선수 3명 + 브랜드 로고 버블 + × 구분
 *  - 팬스토어 카드: [선수 사진 | 브랜드 로고 크게 + 설명 + CTA | 상품 썸네일]
 *  - 인기 상품 미리보기: 할인율·정가 취소선·판매가
 */
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { ArrowRight, Box, CalendarClock, CreditCard, Percent, ShoppingCart, Store, Ticket } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import Breadcrumb from '../components/Breadcrumb';
import { api } from '../services/api';
import { FAN_STORES, HOW_TO_USE, type FanStore } from '../data/growthMarket';

const BENEFITS = [
  { icon: Ticket, title: '할인코드', desc: '전용 할인 제공' },
  { icon: Percent, title: '팬포인트', desc: '사용 가능' },
  { icon: CreditCard, title: 'SPON Pay', desc: '일반결제도 가능' },
  { icon: CalendarClock, title: '기간 한정 혜택', desc: '놓치지 마세요' },
  { icon: Box, title: '선수 AR 이미지', desc: '확인 가능' },
];

const STEP_ICONS = [Store, Ticket, CreditCard];

/** 스토어별 상품 — API 실상품이 있으면 그것, 없으면 시안 기준 전시용(curated) */
export function useStoreProducts() {
  const results = useQueries({
    queries: FAN_STORES.map((s) => ({
      queryKey: ['mini-store', s.slug],
      queryFn: () => api.getPublicMiniStore(s.slug!),
      enabled: !!s.slug,
      staleTime: 60_000,
    })),
  });
  return (i: number): any[] => {
    const real = (results[i]?.data as any)?.data?.products || [];
    if (real.length > 0) return real;
    return FAN_STORES[i].displayProducts.map((p, j) => ({ ...p, id: `display-${i}-${j}`, curated: true }));
  };
}

export default function GrowthMarket() {
  const productsOf = useStoreProducts();
  const allProducts = FAN_STORES.flatMap((s, i) => productsOf(i).map((p) => ({ ...p, store: s })));

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5">
        <Breadcrumb className="mb-0" />
      </div>

      {/* ── 히어로 ── */}
      <section className="px-5 sm:px-8 pt-2 pb-10 bg-gradient-to-b from-emerald-50/50 to-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,52%)] gap-8 items-center pt-4">
          <div className="min-w-0">
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-emerald-600 text-emerald-700 bg-white text-xs font-bold mb-5">
              프로 × 브랜드 협업 스토어
            </span>
            <h1 className="text-[28px] sm:text-[40px] font-black tracking-tight text-slate-900 leading-[1.3] mb-4 break-keep">
              프로와 브랜드가 함께,
              <br />
              팬과 함께 <span className="text-emerald-600">성장하는 마켓</span>
            </h1>
            <p className="text-sm sm:text-[15px] text-slate-500 break-keep leading-relaxed mb-7">
              SPONPIK은 프로 선수와 스폰서 브랜드를 연결하여
              <br className="hidden sm:block" />
              팬만을 위한 특별한 상품, 혜택, AR 경험을 제공합니다.
            </p>

            <div className="flex flex-wrap gap-2">
              {BENEFITS.map((b) => (
                <div key={b.title} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <b.icon className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="leading-tight">
                    <div className="text-[11px] font-bold text-slate-900 whitespace-nowrap">{b.title}</div>
                    <div className="text-[10px] text-slate-400 whitespace-nowrap">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 선수 원본 사진 3명 + 브랜드 로고 버블, 사이 × 구분 (시안 구도) */}
          <div className="relative hidden sm:flex items-end justify-center pt-8">
            {FAN_STORES.map((s, i) => (
              <div key={s.brandName} className="relative flex items-end">
                {i > 0 && <span className="mx-1 mb-24 text-xl font-bold text-slate-300 select-none">×</span>}
                <div className="relative">
                  <div className="w-[140px] lg:w-[168px] aspect-[3/4] overflow-hidden rounded-xl">
                    <img
                      src={s.heroImage}
                      alt={`${s.athleteName} 프로 × ${s.brandName}`}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div
                    className={`absolute -top-6 ${i % 2 === 0 ? '-left-4' : '-right-4'} h-12 px-3.5 rounded-2xl bg-white shadow-lg border border-slate-100 flex items-center`}
                  >
                    <img src={s.brandLogo} alt={s.brandName} className="max-h-7 max-w-[88px] object-contain" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 팬스토어 ── */}
      <section className="px-5 sm:px-8 pb-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-4">지금 만나볼 팬스토어</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {FAN_STORES.map((s, i) => (
              <StoreCard key={s.athleteName + s.brandName} store={s} products={productsOf(i)} wide />
            ))}
          </div>
        </div>
      </section>

      {/* ── 인기 상품 ── */}
      {allProducts.length > 0 && (
        <section className="px-5 sm:px-8 pb-10">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-4">인기 상품 미리보기</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {allProducts.slice(0, 10).map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 이용 방법 ── */}
      <section className="px-5 sm:px-8 pb-16">
        <div className="max-w-7xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-extrabold text-slate-900 mb-6">이렇게 이용해요</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {HOW_TO_USE.map((h, i) => {
              const Icon = STEP_ICONS[i] || Store;
              return (
                <div key={h.title} className="flex items-center gap-4 flex-1">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center tabular-nums">
                        {i + 1}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900">{h.title}</div>
                      <p className="text-xs text-slate-500 break-keep leading-relaxed">{h.desc}</p>
                    </div>
                  </div>
                  {i < HOW_TO_USE.length - 1 && (
                    <ArrowRight className="hidden sm:block w-5 h-5 text-slate-300 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * 팬스토어 카드 — 시안 기준 두 가지 변형
 *  - wide(성장마켓 페이지): [선수 사진 | 이름 × 로고·설명·칩·CTA | 상품 썸네일 세로 2개]
 *  - 기본(메인 페이지): [텍스트(이름 ×·로고 크게·설명·칩·CTA) | 선수 사진] + 하단 상품 스트립 2개
 */
export function StoreCard({ store, products, wide = false }: { store: FanStore; products: any[]; wide?: boolean }) {
  const to = store.storePath || (store.slug ? `/store/brand/${store.slug}` : undefined);
  const cta = (
    <span
      className={`mt-auto inline-flex items-center justify-center gap-1 h-9 rounded-lg text-[13px] font-bold ${
        to ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
      }`}
    >
      {to ? '스토어 보기' : '오픈 준비 중'}
      {to && <ArrowRight className="w-4 h-4" />}
    </span>
  );

  const nameRow = (
    <div className="text-[13px] font-bold text-slate-700 mb-1.5">
      {store.athleteName} 프로 <span className="text-slate-300">×</span>
    </div>
  );

  const chips = (
    <div className="flex flex-wrap items-center gap-1.5 mb-3">
      {store.benefit && (
        <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold">{store.benefit}</span>
      )}
      <span className="px-2 py-1 rounded-md border border-slate-200 text-slate-500 text-[11px] font-bold">AR 보기</span>
    </div>
  );

  const body = wide ? (
    /* 성장마켓 페이지: 사진 좌 / 정보 중 / 상품 우 */
    /* flex-1: 내용이 적은 카드도 그리드가 맞춘 카드 높이를 꽉 채운다 (사진 아래 빈 공간 방지) */
    <div className="flex items-stretch min-h-[210px] flex-1">
      {/* 사진은 절대배치로 컬럼을 꽉 채운다 — flex stretch 안의 h-full은 브라우저에 따라 짧게 계산됨 */}
      <div className="relative w-[34%] max-w-[190px] shrink-0 bg-slate-50 overflow-hidden">
        <img
          src={store.heroImage}
          alt={`${store.athleteName} 프로 × ${store.brandName}`}
          className="absolute inset-0 w-full h-full object-cover object-top"
          loading="lazy"
        />
      </div>
      <div className="flex-1 min-w-0 p-4 flex flex-col">
        {nameRow}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <img src={store.brandLogo} alt={store.brandName} className="h-8 max-w-[130px] object-contain object-left" />
          <span className="text-[15px] font-extrabold text-slate-900 whitespace-nowrap">팬 스토어</span>
        </div>
        <p className="text-xs text-slate-500 break-keep leading-relaxed line-clamp-2 mb-2.5">{store.description}</p>
        {chips}
        {cta}
      </div>
      {products.length > 0 && (
        <div className="w-[84px] shrink-0 py-3 pr-3 flex flex-col gap-2 justify-center">
          {products.slice(0, 2).map((p: any) => (
            <ProductThumb key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  ) : (
    /* 메인 페이지: 텍스트 좌 / 사진 우, 하단 상품 스트립 */
    <>
      <div className="flex items-stretch flex-1">
        <div className="flex-1 min-w-0 p-5 flex flex-col">
          {nameRow}
          <img src={store.brandLogo} alt={store.brandName} className="h-10 max-w-[160px] object-contain object-left mb-3 self-start" />
          <p className="text-xs text-slate-500 break-keep leading-relaxed line-clamp-3 mb-3">{store.description}</p>
          {chips}
          {cta}
        </div>
        <div className="relative w-[42%] shrink-0 bg-slate-50 overflow-hidden">
          <img
            src={store.heroImage}
            alt={`${store.athleteName} 프로 × ${store.brandName}`}
            className="absolute inset-0 w-full h-full object-cover object-top"
            loading="lazy"
          />
        </div>
      </div>
      {products.length > 0 && (
        <div className="border-t border-slate-100 grid grid-cols-2 divide-x divide-slate-100">
          {products.slice(0, 2).map((p: any) => (
            <StripProduct key={p.id} product={p} />
          ))}
        </div>
      )}
    </>
  );

  const cls = 'flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all';
  return to ? (
    <Link to={to} className={`${cls} hover:border-emerald-300 hover:shadow-md`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function discountOf(product: any) {
  const price = Number(product.price ?? 0);
  const list = Number(product.listPrice ?? product.originalPrice ?? 0);
  return { price, list, off: list > price && list > 0 ? Math.round((1 - price / list) * 100) : 0 };
}

/** 카드 우측 세로 썸네일 (성장마켓 페이지) */
function ProductThumb({ product }: { product: any }) {
  const { off } = discountOf(product);
  return (
    <div className="relative aspect-square rounded-lg border border-slate-100 bg-slate-50 overflow-hidden">
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-1" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-1">
          <span className="text-[8px] leading-tight text-slate-400 text-center line-clamp-3 break-keep">{product.name}</span>
        </div>
      )}
      {off > 0 && (
        <span className="absolute top-0.5 left-0.5 px-1 py-0.5 rounded bg-rose-500 text-white text-[8px] font-black">{off}%</span>
      )}
    </div>
  );
}

/** 카드 하단 가로 스트립 상품 (메인 페이지) */
function StripProduct({ product }: { product: any }) {
  const { price, off } = discountOf(product);
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5 min-w-0">
      <div className="relative w-11 h-11 shrink-0 rounded-lg border border-slate-100 bg-slate-50 overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-0.5" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-slate-300" />
          </div>
        )}
        {off > 0 && (
          <span className="absolute top-0 left-0 px-1 rounded-br bg-rose-500 text-white text-[8px] font-black">{off}%</span>
        )}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-slate-600 truncate">{product.name}</div>
        <div className="text-[13px] font-black text-slate-900 tabular-nums">{price.toLocaleString()}원</div>
      </div>
    </div>
  );
}

/** 인기 상품 카드 — 전시용(curated) 상품은 구매 버튼 없이 가격만 보여준다 */
function ProductCard({ product }: { product: any }) {
  const { price, list, off } = discountOf(product);
  const purchasable = !product.curated && product.store?.slug;
  // 큐레이션 상품이라도 상세 경로(href)가 있으면 그쪽으로 연결한다
  const href = purchasable ? `/store/brand/${product.store.slug}/product/${product.id}` : product.href;
  const inner = (
    <>
      <div className="relative aspect-square bg-slate-50">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-2" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-3">
            <span className="text-[11px] text-slate-400 text-center break-keep leading-snug line-clamp-4">{product.name}</span>
          </div>
        )}
        {off > 0 && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-black">{off}%</span>
        )}
      </div>
      <div className="p-2.5">
        <div className="text-[11px] text-slate-600 line-clamp-2 min-h-[2rem] mb-1">{product.name}</div>
        <div className="flex items-baseline gap-1.5">
          {list > price && <span className="text-[10px] text-slate-400 line-through tabular-nums">{list.toLocaleString()}원</span>}
          <span className="text-sm font-black text-slate-900 tabular-nums">{price.toLocaleString()}원</span>
        </div>
        {purchasable && (
          <div className="mt-1.5 inline-flex items-center justify-center gap-1 w-full h-7 rounded-lg border border-emerald-200 text-emerald-700 text-[11px] font-bold">
            <ShoppingCart className="w-3 h-3" /> 구매하기
          </div>
        )}
      </div>
    </>
  );
  const cls = 'rounded-2xl border border-slate-200 bg-white overflow-hidden';
  return href ? (
    <Link to={href} className={`${cls} hover:border-emerald-300 transition-colors`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
