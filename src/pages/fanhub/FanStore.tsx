/**
 * 팬 참여 — 팬스토어 (리디자인 v2.0 시안 img_05)
 *
 * 선수 × 브랜드 협업 스토어와 팬 혜택을 모아 보여준다.
 * 가격·혜택은 등록된 스토어 데이터만 쓰고, 없는 값은 표시하지 않는다 (LEG-06).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, ChevronRight, CreditCard, Coins, Percent, ShoppingBag, Thermometer,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { FAN_STORES, HOW_TO_USE } from '../../data/growthMarket';
import { api } from '../../services/api';

const PERKS = [
  { icon: Percent, label: '팬 할인' },
  { icon: Coins, label: '팬포인트 적립' },
  { icon: CreditCard, label: 'SPON Pay 결제' },
  { icon: Box, label: '선수 AR' },
];

export default function FanStore() {
  const [brand, setBrand] = useState<string>('ALL');
  const [rules, setRules] = useState<any>(null);
  const [temps, setTemps] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const r: any = await api.getFanEngageRules().catch(() => null);
      setRules(r?.data || null);

      /* 스토어에 연결된 선수의 팬온도만 읽는다 */
      const ids = [...new Set(FAN_STORES.map((s) => s.athleteId).filter(Boolean))] as string[];
      const results = await Promise.all(
        ids.map((id) => api.getEngageTemperature(id).then((x: any) => [id, x?.data?.celsius ?? null]).catch(() => [id, null])),
      );
      setTemps(Object.fromEntries(results.filter(([, v]) => v != null) as [string, number][]));
    })();
  }, []);

  const brands = useMemo(() => ['ALL', ...new Set(FAN_STORES.map((s) => s.brandName))], []);
  const stores = brand === 'ALL' ? FAN_STORES : FAN_STORES.filter((s) => s.brandName === brand);
  const [hero, ...others] = stores;
  const storeRule = (rules?.rules || []).find((r: any) => r.source === 'STORE');

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16">
      <PublicHeader />

      <div className="max-w-[1400px] mx-auto px-5 pt-6">
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[12.5px]">
          <Link to="/" className="text-slate-500 hover:text-slate-600">홈</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-500">팬 참여</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-emerald-700">팬스토어</span>
        </nav>

        {/* 히어로 */}
        <div className="mt-5 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] gap-6 items-center">
          <div>
            <h1 className="text-[27px] sm:text-[36px] font-black tracking-tight leading-[1.25] break-keep">
              팬의 선택과 파트너의 구독이<br />
              선수의 <span className="text-emerald-600">성장으로 이어집니다</span>
            </h1>
            <p className="mt-3 text-[13.5px] text-slate-500 break-keep">
              팬이 추천한 브랜드와 디지털 파트너 상품을 만나보세요.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <a
                href="#stores"
                className="h-12 px-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700"
              >
                팬스토어 둘러보기 <ChevronRight className="w-4 h-4" />
              </a>
              <Link
                to="/fan/community"
                className="h-12 px-6 inline-flex items-center gap-2 rounded-xl border border-emerald-600 text-emerald-700 text-[14px] font-bold hover:bg-emerald-50"
              >
                브랜드 추천하기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="mt-5 inline-flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 px-5 py-3">
              {PERKS.map((p) => (
                <span key={p.label} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-slate-600">
                  <p.icon className="w-4 h-4 text-emerald-600" /> {p.label}
                </span>
              ))}
            </div>
          </div>

          {hero && (
            <div className="rounded-2xl overflow-hidden bg-slate-100 aspect-[16/10]">
              <img src={hero.heroImage} alt={hero.athleteName} className="w-full h-full object-cover object-top" />
            </div>
          )}
        </div>

        {/* 브랜드 필터 */}
        <div id="stores" className="mt-8 flex flex-wrap gap-2">
          {brands.map((b) => (
            <button
              key={b}
              onClick={() => setBrand(b)}
              className={`h-10 px-4 rounded-xl text-[12.5px] font-bold transition-colors ${
                brand === b ? 'bg-emerald-500 text-white' : 'border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {b === 'ALL' ? '전체' : b}
            </button>
          ))}
        </div>

        {/* 대표 스토어 */}
        {hero && (
          <article className="mt-4 rounded-2xl border border-slate-200 overflow-hidden grid md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
            <div className="bg-slate-100 min-h-[200px]">
              <img src={hero.heroImage} alt={hero.athleteName} className="w-full h-full object-cover object-top" />
            </div>
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-[19px] sm:text-[22px] font-black">
                  {hero.athleteName} <span className="text-slate-300">×</span> {hero.brandName}
                </h2>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[12.5px] font-black">공식 협업 스토어</span>
              </div>
              <p className="mt-2 text-[13px] text-slate-500 break-keep">{hero.description}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {hero.benefit && (
                  <Stat label="팬 혜택" value={hero.benefit} />
                )}
                {storeRule && (
                  <Stat label="팬포인트 적립" value="구매금액 1%" />
                )}
                {hero.athleteId && temps[hero.athleteId] != null && (
                  <Stat label={`${hero.athleteName} 팬온도`} value={`${temps[hero.athleteId].toFixed(1)}℃`} icon={Thermometer} />
                )}
              </div>

              <div className="mt-4 grid sm:grid-cols-3 gap-2">
                {hero.displayProducts.slice(0, 3).map((p) => (
                  <ProductChip key={p.name} product={p} />
                ))}
              </div>

              {hero.storePath && (
                <Link
                  to={hero.storePath}
                  className="mt-4 h-12 px-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700"
                >
                  <ShoppingBag className="w-4 h-4" /> {hero.brandName} 스토어 가기
                </Link>
              )}
            </div>
          </article>
        )}

        {/* 나머지 스토어 */}
        {others.length > 0 && (
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {others.map((s) => (
              <article key={`${s.athleteName}-${s.brandName}`} className="rounded-2xl border border-slate-200 overflow-hidden hover:border-emerald-300 transition-colors">
                <div className="aspect-[16/10] bg-slate-100">
                  <img src={s.heroImage} alt={s.athleteName} loading="lazy" className="w-full h-full object-cover object-top" />
                </div>
                <div className="p-4">
                  <p className="text-[15px] font-extrabold">{s.athleteName} <span className="text-slate-300">×</span> {s.brandName}</p>
                  <p className="mt-1 text-[12px] text-slate-500 break-keep line-clamp-2">{s.description}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {s.benefit && <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[12px] font-bold">{s.benefit}</span>}
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[12px] font-bold">팬포인트 1%</span>
                    {s.athleteId && temps[s.athleteId] != null && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[12px] font-bold">
                        팬온도 {temps[s.athleteId].toFixed(1)}℃
                      </span>
                    )}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {s.displayProducts.slice(0, 2).map((p) => (
                      <div key={p.name} className="flex items-center justify-between gap-2 text-[12px]">
                        <span className="truncate text-slate-600">{p.name}</span>
                        <span className="font-extrabold shrink-0">{p.price.toLocaleString()}원</span>
                      </div>
                    ))}
                  </div>
                  {s.storePath ? (
                    <Link to={s.storePath} className="mt-3.5 h-11 w-full inline-flex items-center justify-center rounded-xl border border-emerald-600 text-emerald-700 text-[13px] font-bold hover:bg-emerald-50">
                      스토어 가기
                    </Link>
                  ) : (
                    <p className="mt-3.5 h-11 w-full inline-flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 text-[13px] font-bold">
                      준비 중
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* 디지털 파트너 연결 */}
        <div className="mt-6 rounded-2xl bg-emerald-50/60 border border-emerald-100 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-[15px] font-extrabold">팬스토어는 디지털 파트너 구독으로 이어집니다</p>
            <p className="mt-1 text-[12.5px] text-slate-500 break-keep">
              브랜드의 월 구독료가 선수와 브랜드의 지속 가능한 협업과 선수의 성장을 지원합니다.
              경기복 부착은 포함되지 않습니다.
            </p>
          </div>
          <Link
            to="/digital-partner"
            className="shrink-0 h-11 px-5 inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-white text-emerald-700 text-[13.5px] font-bold hover:bg-emerald-50"
          >
            파트너 범위 보기 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 이용 흐름 */}
        <div className="mt-4 rounded-2xl border border-slate-200 p-5 grid sm:grid-cols-3 gap-5">
          {HOW_TO_USE.map((h, i) => (
            <div key={h.title} className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-emerald-500 text-white text-[12px] font-black flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <div>
                <p className="text-[13.5px] font-extrabold">{h.title}</p>
                <p className="mt-0.5 text-[12px] text-slate-500 break-keep">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <span className="rounded-xl border border-slate-200 px-4 py-2.5">
      <span className="block text-[12px] text-slate-500">{label}</span>
      <span className="mt-0.5 block text-[14px] font-black text-emerald-600 inline-flex items-center gap-1">
        {Icon && <Icon className="w-3.5 h-3.5" />} {value}
      </span>
    </span>
  );
}

function ProductChip({ product }: { product: { name: string; price: number; listPrice: number; href?: string } }) {
  const inner = (
    <>
      <span className="block text-[12px] text-slate-600 line-clamp-2 min-h-[32px] break-keep">{product.name}</span>
      <span className="mt-1.5 block text-[14px] font-black">{product.price.toLocaleString()}원</span>
      {product.listPrice > product.price && (
        <span className="block text-[12px] text-slate-500 line-through">{product.listPrice.toLocaleString()}원</span>
      )}
    </>
  );
  return product.href ? (
    <Link to={product.href} className="rounded-xl border border-slate-200 p-3 hover:border-emerald-300 transition-colors">{inner}</Link>
  ) : (
    <div className="rounded-xl border border-slate-200 p-3">{inner}</div>
  );
}
