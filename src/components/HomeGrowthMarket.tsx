/**
 * 메인 "프로 × 브랜드 성장마켓" 섹션
 *
 * 큐레이션된 팬스토어를 보여주고 전체보기로 /growth-market 으로 보낸다.
 * 상품·가격은 미니스토어 실데이터가 있을 때만 노출한다 (임의 수치 금지 — 개편 LEG-06).
 */
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { FAN_STORES } from '../data/growthMarket';
import { StoreCard, useStoreProducts } from '../pages/GrowthMarket';

export default function HomeGrowthMarket() {
  const productsOf = useStoreProducts();
  if (FAN_STORES.length === 0) return null;

  return (
    /* 폭은 히어로·다른 섹션과 동일하게 px-5(바깥) → max-w-7xl(안쪽) */
    <section className="px-5 pt-2 pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-3 mb-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 inline-flex items-center gap-2">
            <span className="text-emerald-500">*</span> 프로 <span className="text-slate-400">×</span> 브랜드 성장마켓
          </h2>
          <Link
            to="/growth-market"
            className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            전체보기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <p className="text-sm text-slate-500 mb-5 break-keep">
          후원으로 연결된 프로와 브랜드가 팬과 함께 성장하는 특별한 마켓
        </p>

        {/* 모바일: 세로 스택 대신 가로 스와이프 (모바일 전면 개편 2026-08-11) */}
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory -mx-5 px-5 sm:mx-0 sm:px-0 pb-1 sm:pb-0">
          {FAN_STORES.slice(0, 3).map((s, i) => (
            <div key={s.athleteName + s.brandName} className="snap-start shrink-0 w-[82%] sm:w-auto sm:shrink">
              <StoreCard store={s} products={productsOf(i)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
