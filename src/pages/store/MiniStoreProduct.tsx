/**
 * STO-02: 상품 상세 / 장바구니
 *
 * Refs: wireframe_spec.docx > STO-02
 * - 상품 이미지/이름/가격/할인적용가/수량
 * - 장바구니 Drawer (담기 시 add_to_cart 이벤트)
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useFunnelTracking } from '../../hooks/useFunnelTracking';
import { Plus, Minus, ShoppingCart, ArrowLeft, X } from 'lucide-react';

const CART_KEY = 'sponpik_cart';

export default function MiniStoreProduct() {
  const { slug, productId } = useParams<{ slug: string; productId: string }>();
  const navigate = useNavigate();
  const { trackEvent } = useFunnelTracking();
  const [qty, setQty] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: resp } = useQuery({
    queryKey: ['public-mini-store', slug],
    queryFn: () => api.getPublicMiniStore(slug!),
    enabled: !!slug,
  });
  const store = resp?.data;
  const product = store?.products?.find((p: any) => p.id === productId);

  useEffect(() => {
    if (store && product) {
      trackEvent('product-view', {
        campaign_id: store.campaignId,
        brand_id: store.brandId,
        product_id: product.id,
      });
    }
  }, [store, product]);

  if (!store || !product) return <div className="min-h-screen flex items-center justify-center">상품을 찾을 수 없습니다</div>;

  const finalPrice = Number(product.discountPrice || product.price);

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const existing = cart.find((c: any) => c.productId === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ productId: product.id, qty, name: product.name, price: finalPrice, slug });
    }
    localStorage.setItem(CART_KEY, JSON.stringify(cart));

    trackEvent('add-to-cart', {
      campaign_id: store.campaignId,
      brand_id: store.brandId,
      product_id: product.id,
      quantity: qty,
    });
    setDrawerOpen(true);
  };

  const cartItems = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  const cartTotal = cartItems.reduce((sum: number, c: any) => sum + c.price * c.qty, 0);

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-3xl mx-auto">
        <div className="p-4">
          <Link to={`/store/${slug}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-4 h-4" /> 스토어로
          </Link>
        </div>

        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full aspect-square object-cover" />
        ) : (
          <div className="w-full aspect-square bg-slate-100 flex items-center justify-center text-slate-400">No Image</div>
        )}

        <div className="p-5">
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">{product.name}</h1>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-2xl font-extrabold text-emerald-600">₩{finalPrice.toLocaleString()}</span>
            {product.discountPrice && (
              <span className="text-base text-slate-400 line-through">₩{Number(product.price).toLocaleString()}</span>
            )}
          </div>
          {product.description && (
            <p className="text-sm text-slate-600 leading-relaxed mb-6">{product.description}</p>
          )}

          {/* 수량 선택 */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-semibold text-slate-700">수량</span>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:bg-slate-50"><Minus className="w-3 h-3" /></button>
              <span className="px-4 py-2 text-sm font-semibold">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="p-2 hover:bg-slate-50"><Plus className="w-3 h-3" /></button>
            </div>
            <span className="text-xs text-slate-400">재고 {product.stock}</span>
          </div>

          {/* 혜택 */}
          {store.benefitBadge && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-2 rounded mb-4">
              ⚡ {store.benefitBadge}
            </div>
          )}

          {/* 리뷰 (mock) */}
          <div className="mt-6 mb-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">⭐ 고객 리뷰</h3>
            <div className="space-y-3">
              {[
                { author: '김**', stars: 5, text: '품질이 정말 좋아요. 선수 추천 코드 적용까지 완벽!' },
                { author: '박**', stars: 5, text: '배송도 빠르고 디자인도 만족스러워요.' },
                { author: '이**', stars: 4, text: '가격 대비 우수합니다. 재구매 의사 있음.' },
              ].map((r, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">{r.author}</span>
                    <span className="text-xs text-amber-500">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>
                  </div>
                  <p className="text-sm text-slate-600">{r.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 관련 상품 */}
          {store.products && store.products.length > 1 && (
            <div className="mt-6 mb-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3">🛍️ 함께 보면 좋은 상품</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {store.products.filter((p: any) => p.id !== productId).slice(0, 3).map((p: any) => (
                  <Link key={p.id} to={`/store/${slug}/product/${p.id}`} className="block bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-emerald-300">
                    {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full aspect-square object-cover" /> : <div className="w-full aspect-square bg-slate-100" />}
                    <div className="p-2">
                      <div className="text-xs font-semibold truncate">{p.name}</div>
                      <div className="text-xs text-emerald-600 font-bold">₩{Number(p.discountPrice || p.price).toLocaleString()}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 shadow-2xl z-30">
        <div className="max-w-3xl mx-auto flex gap-2">
          <button
            onClick={addToCart}
            disabled={product.soldOut}
            className="flex-1 bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-bold py-3 rounded-xl"
          >
            장바구니
          </button>
          <button
            onClick={() => { addToCart(); navigate(`/store/${slug}/checkout`); }}
            disabled={product.soldOut}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-3 rounded-xl"
          >
            바로 구매
          </button>
        </div>
      </div>

      {/* 장바구니 Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full sm:max-w-md bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-base font-bold inline-flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" /> 장바구니
              </h3>
              <button onClick={() => setDrawerOpen(false)} className="p-1 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 160px)' }}>
              {cartItems.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="text-sm font-semibold">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.qty}개 × ₩{c.price.toLocaleString()}</div>
                  </div>
                  <div className="text-sm font-bold">₩{(c.price * c.qty).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200">
              <div className="flex justify-between mb-3">
                <span className="text-sm">예상 결제금액</span>
                <span className="text-lg font-extrabold">₩{cartTotal.toLocaleString()}</span>
              </div>
              <button
                onClick={() => navigate(`/store/${slug}/checkout`)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl"
              >
                결제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
