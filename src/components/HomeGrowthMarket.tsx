/**
 * 메인 "프로 × 브랜드 성장마켓" 섹션
 *
 * 큐레이션된 팬스토어를 보여주고 전체보기로 /growth-market 으로 보낸다.
 * 상품·가격은 미니스토어 실데이터가 있을 때만 노출한다 (임의 수치 금지 — 개편 LEG-06).
 */
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { FAN_STORES } from '../data/growthMarket';
import { StoreCard } from '../pages/GrowthMarket';

export default function HomeGrowthMarket() {
  const results = useQueries({
    queries: FAN_STORES.map((s) => ({
      queryKey: ['mini-store', s.slug],
      queryFn: () => api.getPublicMiniStore(s.slug!),
      enabled: !!s.slug,
      staleTime: 60_000,
    })),
  });
  const productsOf = (i: number): any[] => (results[i]?.data as any)?.data?.products || [];

  if (FAN_STORES.length === 0) return null;

  return (
    /* 폭은 히어로·다른 섹션과 동일하게 px-5(바깥) → max-w-7xl(안쪽) */
    <section className="px-5 pt-2 pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-3 mb-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 inline-flex items-center gap-2">
            <span className="text-emerald-500">*</span> 프로 <span className="text-slate-400">×</span> 브랜드 성장마켓
          </h2>
          <Link to="/growth-market" className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700">
            전체보기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <p className="text-sm text-slate-500 mb-5 break-keep">
          후원으로 연결된 프로와 브랜드가 팬과 함께 성장하는 특별한 마켓
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FAN_STORES.slice(0, 3).map((s, i) => (
            <StoreCard key={s.athleteName + s.brandName} store={s} products={productsOf(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
