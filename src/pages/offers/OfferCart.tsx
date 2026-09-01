/**
 * 지금 가능한 후원 — 보관함 · 장바구니 (핸드오프 v1.0 §6, 시안 img_05)
 *
 * 한 화면에 함께 보이되 "한꺼번에 결제"는 호환되는 주문군만 허용한다 (§6.2).
 * 상단에서 지금 결제 가능 / 승인 후 결제 / 협의 중 금액을 분리한다.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Bookmark, ChevronDown, ChevronRight, Info,
  Loader2, Package, ShoppingCart, Trash2,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { BADGE_STYLE } from '../../components/offer/OfferCard';
import { api } from '../../services/api';

const GROUP_STYLE: Record<string, { letter: string; cls: string; chip: string }> = {
  A_IMMEDIATE: { letter: 'A', cls: 'bg-emerald-500 text-white', chip: 'text-emerald-700' },
  B_APPROVAL: { letter: 'B', cls: 'bg-amber-500 text-white', chip: 'text-amber-700' },
  C_NEGOTIATION: { letter: 'C', cls: 'bg-violet-500 text-white', chip: 'text-violet-700' },
  D_AUCTION: { letter: 'D', cls: 'bg-indigo-500 text-white', chip: 'text-indigo-700' },
  E_SUBSCRIPTION: { letter: 'E', cls: 'bg-sky-500 text-white', chip: 'text-sky-700' },
};

const ISSUE_LABEL: Record<string, string> = {
  SOLD_OUT: '재고 소진', OFFER_EXPIRED: '판매 종료', PRICE_CHANGED: '가격 변경',
  DATA_STALE: '정보 확인 필요', OPTION_INVALID: '옵션 확인 필요', RESOURCE_CONFLICT: '구성 충돌',
};

export default function OfferCart() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'CART' | 'SAVED'>('CART');
  const [cart, setCart] = useState<any>(null);
  const [saved, setSaved] = useState<any[]>([]);
  const [checked, setChecked] = useState<string[]>([]);
  const [open, setOpen] = useState<string[]>(['A_IMMEDIATE', 'B_APPROVAL', 'C_NEGOTIATION']);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [c, s]: any[] = await Promise.all([api.getOfferCart(), api.getSavedOffers()]);
      setCart(c?.data || null);
      setSaved(s?.data?.saved || []);
      /* 즉시결제 가능 항목을 기본 선택한다 */
      const payable = (c?.data?.lines || []).filter((l: any) => l.group === 'A_IMMEDIATE' && !l.issue).map((l: any) => l.id);
      setChecked(payable);
    } catch (e: any) {
      if ([401, 403].includes(e?.response?.status)) { navigate(`/login?returnUrl=${encodeURIComponent('/sponsor/cart')}`); return; }
      setErr(e?.response?.data?.error?.message || '장바구니를 불러오지 못했습니다');
    } finally { setLoading(false); }
  }, [navigate]);
  useEffect(() => { load(); }, [load]);

  const remove = async (itemId: string, keep: boolean) => {
    setBusy(true);
    try {
      const r: any = await api.removeOfferCartItem(itemId, keep);
      setCart(r?.data);
      setChecked((prev) => prev.filter((x) => x !== itemId));
      if (keep) { const s: any = await api.getSavedOffers(); setSaved(s?.data?.saved || []); }
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '삭제하지 못했습니다');
    } finally { setBusy(false); }
  };

  const moveToCart = async (offerId: string) => {
    setBusy(true);
    setErr(null);
    try {
      const r: any = await api.addOfferToCart({ offerId });
      setCart(r?.data);
      const s: any = await api.getSavedOffers();
      setSaved(s?.data?.saved || []);
      setTab('CART');
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '장바구니로 옮기지 못했습니다');
    } finally { setBusy(false); }
  };

  const unsave = async (offerId: string) => {
    const r: any = await api.unsaveOffer(offerId);
    setSaved(r?.data?.saved || []);
  };

  /* 선택은 한 주문군 안에서만 (§6.2) */
  const selectedGroup = useMemo(() => {
    const lines = (cart?.lines || []).filter((l: any) => checked.includes(l.id));
    const gs = new Set(lines.map((l: any) => l.group));
    return gs.size === 1 ? [...gs][0] as string : null;
  }, [cart, checked]);

  const selectedTotal = useMemo(
    () => (cart?.lines || []).filter((l: any) => checked.includes(l.id)).reduce((s: number, l: any) => s + (l.currentAmount ?? 0), 0),
    [cart, checked],
  );

  const toggle = (line: any) => {
    setErr(null);
    setChecked((prev) => {
      if (prev.includes(line.id)) return prev.filter((x) => x !== line.id);
      const cur = (cart?.lines || []).filter((l: any) => prev.includes(l.id));
      /* 다른 주문군을 고르면 이전 선택을 비운다 — 함께 결제할 수 없기 때문 */
      if (cur.length && cur[0].group !== line.group) return [line.id];
      return [...prev, line.id];
    });
  };

  const checkout = async () => {
    if (!checked.length) return;
    setBusy(true);
    setErr(null);
    try {
      const r: any = await api.checkoutOfferCart(checked);
      navigate(`/sponsor/available/orders/${r.data.applicationId}`);
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '주문을 만들지 못했습니다');
      await load();
    } finally { setBusy(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
      </div>
    );
  }

  const groups = (cart?.groups || []).filter((g: any) => g.count > 0);
  const s = cart?.summary;
  const payableGroup = selectedGroup === 'A_IMMEDIATE';

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16">
      <PublicHeader />

      <div className="max-w-[1400px] mx-auto px-5 pt-6">
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[12.5px]">
          <Link to="/" className="text-slate-400 hover:text-slate-600">홈</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-emerald-700">보관함 · 장바구니</span>
        </nav>

        <h1 className="mt-4 text-[26px] sm:text-[32px] font-black tracking-tight">담아둔 후원상품</h1>
        <p className="mt-2 text-[13.5px] text-slate-500">상품의 처리 방식에 따라 주문이 구분됩니다.</p>

        <div className="mt-5 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-5 items-start">
          <div>
            {/* 탭 */}
            <div className="flex flex-wrap items-center gap-2">
              {([['SAVED', '보관함', saved.length], ['CART', '장바구니', cart?.lines?.length ?? 0]] as const).map(([k, label, n]) => (
                <button
                  key={k}
                  onClick={() => setTab(k as any)}
                  aria-pressed={tab === k}
                  className={`h-11 px-5 rounded-xl text-[13.5px] font-bold inline-flex items-center gap-2 transition-colors ${
                    tab === k ? 'border-2 border-emerald-500 bg-emerald-50/60 text-emerald-700' : 'border border-slate-200 text-slate-600'
                  }`}
                >
                  {k === 'SAVED' ? <Bookmark className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                  {label} <span className="font-black">{n as number}</span>
                </button>
              ))}
            </div>

            {err && (
              <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-[12.5px] font-bold text-rose-700 break-keep">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {err}
              </p>
            )}

            {/* 장바구니 — 주문군별 */}
            {tab === 'CART' && (
              groups.length === 0 ? (
                <Empty
                  icon={ShoppingCart}
                  title="장바구니가 비어 있습니다"
                  desc="지금 가능한 후원에서 상품을 담아보세요."
                  to="/sponsor/available"
                  cta="상품 둘러보기"
                />
              ) : (
                <div className="mt-4 space-y-3">
                  {groups.map((g: any) => {
                    const gs = GROUP_STYLE[g.key];
                    const isOpen = open.includes(g.key);
                    return (
                      <section key={g.key} className="rounded-2xl border border-slate-200 overflow-hidden">
                        <button
                          onClick={() => setOpen((p) => (isOpen ? p.filter((x) => x !== g.key) : [...p, g.key]))}
                          aria-expanded={isOpen}
                          className="w-full px-5 py-3.5 flex items-center gap-3 text-left bg-slate-50/60 hover:bg-slate-50"
                        >
                          <span className={`w-6 h-6 rounded-md text-[12px] font-black flex items-center justify-center shrink-0 ${gs.cls}`}>
                            {gs.letter}
                          </span>
                          <span className="text-[13.5px] font-extrabold">{g.label}</span>
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11.5px] text-slate-400">
                            <Info className="w-3.5 h-3.5" /> {g.desc}
                          </span>
                          <span className={`ml-auto px-2.5 py-1 rounded-lg border text-[11.5px] font-bold shrink-0 ${gs.chip} border-current/20`}>
                            {g.count}개 상품
                          </span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isOpen && (
                          <ul className="divide-y divide-slate-100">
                            {g.items.map((l: any) => (
                              <li key={l.id} className={`p-4 flex flex-wrap items-center gap-x-4 gap-y-3 ${l.issue ? 'bg-rose-50/40' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={checked.includes(l.id)}
                                  onChange={() => toggle(l)}
                                  disabled={!!l.issue || !g.payable}
                                  aria-label={`${l.offer.title} 선택`}
                                  className="w-4 h-4 accent-emerald-600 shrink-0 disabled:opacity-30"
                                />
                                <span className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                  {l.offer.heroImageUrl && <img src={l.offer.heroImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <Link to={`/sponsor/available/${l.offer.id}`} className="text-[14px] font-extrabold hover:text-emerald-700 break-keep">
                                    {l.offer.title}
                                  </Link>
                                  <p className="mt-0.5 text-[11.5px] text-slate-400">
                                    {(l.offer.athletes || []).map((a: any) => a.athlete.name).join(' · ')}
                                    {l.offer.athletes?.[0]?.athlete?.tour && ` | ${l.offer.athletes[0].athlete.tour}`}
                                  </p>
                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                    {(l.offer.badges || []).slice(0, 2).map((b: string) => (
                                      <span key={b} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${BADGE_STYLE[b] || 'bg-slate-100 text-slate-600'}`}>{b}</span>
                                    ))}
                                  </div>
                                </div>
                                <div className="hidden md:block min-w-0 max-w-[200px]">
                                  <p className="text-[11px] text-slate-400">구성</p>
                                  <p className="text-[12px] break-keep line-clamp-2">
                                    {(l.offer.components || []).map((c: any) => c.label).join(', ') || '—'}
                                  </p>
                                </div>
                                <div className="hidden sm:block">
                                  <p className="text-[11px] text-slate-400">기간</p>
                                  <p className="text-[12px] font-bold">
                                    {l.offer.executionFrom
                                      ? `${new Date(l.offer.executionFrom).toLocaleDateString('ko-KR')} ~ ${new Date(l.offer.executionTo).toLocaleDateString('ko-KR')}`
                                      : l.offer.months > 1 ? `${l.offer.months}개월` : '대회 1회'}
                                  </p>
                                </div>
                                <p className="ml-auto text-[15px] font-black tabular-nums shrink-0">
                                  {l.offer.priceType === 'SUBSCRIPTION'
                                    ? `월 ${l.offer.monthlyAmount.toLocaleString()}원`
                                    : `${(l.currentAmount ?? l.quotedAmount).toLocaleString()}원`}
                                  {l.quantity > 1 && <span className="ml-1 text-[11px] font-bold text-slate-400">×{l.quantity}</span>}
                                </p>
                                <div className="flex gap-1.5 shrink-0">
                                  <button onClick={() => remove(l.id, false)} disabled={busy} aria-label="삭제"
                                    className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-200">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => remove(l.id, true)} disabled={busy} aria-label="보관함으로 이동"
                                    className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200">
                                    <Bookmark className="w-4 h-4" />
                                  </button>
                                </div>

                                {l.issue && (
                                  <p className="w-full flex items-start gap-1.5 text-[12px] font-bold text-rose-700 break-keep">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                    {ISSUE_LABEL[l.issue.code] || l.issue.code} — {l.issue.message}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    );
                  })}

                  <p className="text-[11.5px] text-slate-400 break-keep">
                    ※ 각 그룹의 상품은 함께 주문 · 결제할 수 없습니다.
                  </p>
                </div>
              )
            )}

            {/* 보관함 */}
            {tab === 'SAVED' && (
              saved.length === 0 ? (
                <Empty
                  icon={Bookmark}
                  title="보관함이 비어 있습니다"
                  desc="관심 있는 상품을 보관해두고 나중에 비교해보세요."
                  to="/sponsor/available"
                  cta="상품 둘러보기"
                />
              ) : (
                <ul className="mt-4 space-y-2">
                  {saved.map((sv: any) => (
                    <li key={sv.id} className="rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
                      <span className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        {sv.offer.heroImageUrl && <img src={sv.offer.heroImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link to={`/sponsor/available/${sv.offer.id}`} className="text-[14px] font-extrabold hover:text-emerald-700 break-keep">
                          {sv.offer.title}
                        </Link>
                        <p className="mt-0.5 text-[11.5px] text-slate-400">
                          {(sv.offer.athletes || []).map((a: any) => a.athlete.name).join(' · ')}
                        </p>
                      </div>
                      <p className="text-[15px] font-black tabular-nums">
                        {sv.offer.priceType === 'NEGOTIABLE' ? '협의' : `${sv.offer.supplyAmount.toLocaleString()}원`}
                      </p>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => unsave(sv.offer.id)} aria-label="보관 해제"
                          className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveToCart(sv.offer.id)}
                          disabled={busy || !sv.offer.allowedActions?.includes('ADD')}
                          className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-[12.5px] font-bold disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          장바구니로
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>

          {/* 우: 주문 요약 */}
          <aside className="lg:sticky lg:top-24 rounded-2xl border border-slate-200 p-5">
            <h2 className="flex items-center gap-2 text-[15px] font-extrabold">
              주문 요약
              <span className="text-[11.5px] font-normal text-slate-400">(같은 주문군만 함께 결제)</span>
            </h2>

            <p className="mt-3 text-[12.5px] text-slate-500">
              선택 상품 <b className="text-slate-900">{checked.length}개</b>
              {selectedGroup && <span className={`ml-1.5 font-bold ${GROUP_STYLE[selectedGroup].chip}`}>· {(cart?.groups || []).find((g: any) => g.key === selectedGroup)?.label}</span>}
            </p>

            <dl className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-[13px]">
              <div className="flex justify-between"><dt className="text-slate-500">선택 금액</dt><dd className="font-bold tabular-nums">{selectedTotal.toLocaleString()}원</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">부가세 (10%)</dt><dd className="font-bold tabular-nums">{Math.round(selectedTotal * 0.1).toLocaleString()}원</dd></div>
            </dl>
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-baseline justify-between">
              <span className="text-[13px] font-bold">총 결제 금액</span>
              <span className="text-[22px] font-black text-emerald-600 tabular-nums">
                {Math.round(selectedTotal * 1.1).toLocaleString()}원
              </span>
            </div>

            {/* 금액 분리 (§6.2) */}
            <dl className="mt-4 rounded-xl bg-slate-50 p-3.5 space-y-2 text-[12.5px]">
              <div className="flex justify-between"><dt className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 지금 결제 가능</dt><dd className="font-bold tabular-nums">{(s?.payableAmount ?? 0).toLocaleString()}원</dd></div>
              <div className="flex justify-between"><dt className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> 승인 후 결제</dt><dd className="font-bold tabular-nums">{(s?.approvalAmount ?? 0).toLocaleString()}원</dd></div>
              <div className="flex justify-between"><dt className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" /> 협의 중</dt><dd className="font-bold tabular-nums">{(s?.negotiationAmount ?? 0).toLocaleString()}원</dd></div>
              {(s?.subscriptionAmount ?? 0) > 0 && (
                <div className="flex justify-between"><dt className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500" /> 월 구독</dt><dd className="font-bold tabular-nums">{s.subscriptionAmount.toLocaleString()}원</dd></div>
              )}
            </dl>

            <button
              onClick={checkout}
              disabled={busy || !checked.length}
              className="mt-4 w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-[14.5px] font-bold hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400"
            >
              {busy ? '처리 중…'
                : !checked.length ? '상품을 선택하세요'
                : payableGroup ? '지금 결제 가능한 상품 구매'
                : '선수 승인 요청하기'}
            </button>

            <ul className="mt-4 rounded-xl bg-sky-50/70 p-3.5 space-y-1.5 text-[11.5px] text-slate-600">
              <li className="font-bold text-slate-700 inline-flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> 안내사항</li>
              <li>• 즉시결제 가능 상품만 함께 결제할 수 있습니다.</li>
              <li>• 승인 필요·조건 협의·경매 상품은 각 단계 완료 후 주문·결제가 가능합니다.</li>
              <li>• 결제 후 남은 상품은 보관함과 장바구니에 그대로 유지됩니다.</li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Empty({ icon: Icon, title, desc, to, cta }: {
  icon: any; title: string; desc: string; to: string; cta: string;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 py-16 text-center">
      <Icon className="w-10 h-10 text-slate-300 mx-auto" />
      <p className="mt-3 text-[14px] font-bold text-slate-600">{title}</p>
      <p className="mt-1 text-[12.5px] text-slate-400">{desc}</p>
      <Link to={to} className="mt-5 inline-flex h-11 px-5 items-center gap-1.5 rounded-xl bg-emerald-600 text-white text-sm font-bold">
        <Package className="w-4 h-4" /> {cta}
      </Link>
    </div>
  );
}
