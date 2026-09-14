/**
 * 지금 가능한 후원 — 상품 상세 (핸드오프 v1.0 §5, 시안 img_06)
 *
 * 정보 위계: Hero → 구성 → 적합 브랜드 → 선수 → 제공 내용 → 예상성과
 *          → 사용권 → 실행 일정 → 가격 → 하단 고정 CTA (§5.1)
 * 예상성과는 확정 노출이나 구매 보장으로 표현하지 않는다 (§5.2 금지).
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, Ban, Bookmark, CheckCircle2, ChevronRight,
  FileText, Gauge, Info, Loader2, Minus, Package, Plus, ShieldCheck, Thermometer, X,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { BADGE_STYLE, OFFER_STATUS, metricRange, approvalHint } from '../../components/offer/OfferCard';
import { api } from '../../services/api';

const TABS = ['상품개요', '선수정보', '성과예측', '계약조건'] as const;

const CONFIDENCE_LABEL: Record<string, { label: string; cls: string }> = {
  HIGH: { label: '높음', cls: 'text-emerald-600' },
  MEDIUM: { label: '보통', cls: 'text-amber-600' },
  LIMITED: { label: '제한적', cls: 'text-slate-500' },
};

const COMPONENT_LABEL: Record<string, string> = {
  ATHLETE: '선수', SLOT: '착장 위치', CONTENT: '콘텐츠', ONLINE_ASSET: '온라인 자산',
  VISIT: '방문', MARKET: '마켓', REPORT: '리포트', GUARANTEE: '성과보장',
};

export default function OfferDetail() {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<any>(null);
  const [quote, setQuote] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<string>(TABS[0]);
  const [qty, setQty] = useState(1);
  const [opts, setOpts] = useState<Record<string, any>>({});
  const [startDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [showAthlete, setShowAthlete] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r: any = await api.getAvailableOffer(offerId!);
      setOffer(r?.data || null);
      api.getSavedOffers()
        .then((s: any) => setSaved((s?.data?.saved || []).some((x: any) => x.offer.id === r?.data?.id)))
        .catch(() => null);
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '상품을 불러오지 못했습니다');
    } finally { setLoading(false); }
  }, [offerId]);
  useEffect(() => { load(); }, [load]);

  /* 옵션·수량이 바뀌면 서버 견적을 다시 받는다 (§5.6 서버 권위) */
  const refreshQuote = useCallback(async () => {
    if (!offer) return;
    try {
      const r: any = await api.quoteAvailableOffer(offer.id, {
        quantity: qty, options: opts, startDate: startDate || undefined,
      });
      setQuote(r?.data || null);
      setErr(null);
    } catch (e: any) {
      setQuote(null);
      setErr(e?.response?.data?.error?.message || '금액을 계산하지 못했습니다');
    }
  }, [offer, qty, opts, startDate]);
  useEffect(() => { refreshQuote(); }, [refreshQuote]);

  const needLogin = (e: any) => {
    if ([401, 403].includes(e?.response?.status)) {
      navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return true;
    }
    return false;
  };

  const toggleSave = async () => {
    try {
      if (saved) { await api.unsaveOffer(offer.id); setSaved(false); }
      else { await api.saveOffer(offer.id); setSaved(true); flash('보관함에 담았습니다'); }
    } catch (e) { needLogin(e); }
  };

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2200); };

  const addCart = async (goCart: boolean) => {
    setBusy(true);
    try {
      await api.addOfferToCart({ offerId: offer.id, quantity: qty, options: opts, startDate: startDate || undefined });
      if (goCart) navigate('/sponsor/cart');
      else { setSaved(false); flash('장바구니에 담았습니다'); }
    } catch (e: any) {
      if (needLogin(e)) return;
      setErr(e?.response?.data?.error?.message || '담지 못했습니다');
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
  if (!offer) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="max-w-lg mx-auto px-5 py-24 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <p className="mt-4 text-[15px] font-bold">{err || '상품을 찾을 수 없습니다'}</p>
          <Link to="/sponsor/available" className="mt-5 inline-flex h-11 px-5 items-center rounded-xl bg-emerald-600 text-white text-sm font-bold">
            목록으로
          </Link>
        </div>
      </div>
    );
  }

  const perf = offer.expectedPerformance;
  const conf = perf?.confidence ? CONFIDENCE_LABEL[perf.confidence] : null;
  const hint = approvalHint(offer);
  const canBuy = offer.allowedActions?.includes('BUY');
  const canAdd = offer.allowedActions?.includes('ADD');
  const soldOut = offer.displayStatus === 'SOLD_OUT';
  const st = OFFER_STATUS[offer.displayStatus] || OFFER_STATUS.PUBLISHED;

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-28 lg:pb-16">
      <PublicHeader />

      <div className="max-w-[1400px] mx-auto px-5 pt-5">
        <div className="flex items-center justify-between gap-3">
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[12.5px] min-w-0">
            <Link to="/" className="text-slate-500 hover:text-slate-600 shrink-0">홈</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <Link to="/sponsor" className="text-slate-500 hover:text-slate-600 shrink-0">후원하기</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <Link to="/sponsor/available" className="text-slate-500 hover:text-slate-600 shrink-0">지금 가능한 후원</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="font-bold text-emerald-700 truncate">상품 상세</span>
          </nav>
          <Link to="/sponsor/available" className="shrink-0 text-[12.5px] font-bold text-slate-500 hover:text-slate-800">← 목록으로</Link>
        </div>

        <div className="mt-4 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-5 items-start">
          <div className="space-y-4">
            {/* 1. Hero */}
            <div className="grid sm:grid-cols-[minmax(0,300px)_minmax(0,1fr)] gap-5">
              <div className="rounded-2xl overflow-hidden bg-slate-100 aspect-[4/3]">
                {offer.heroImageUrl && <img src={offer.heroImageUrl} alt={offer.title} className="w-full h-full object-cover object-top" />}
              </div>
              <div>
                {offer.subtitle && <p className="text-[12.5px] font-bold text-emerald-600">{offer.subtitle}</p>}
                <h1 className="mt-1 text-[24px] sm:text-[30px] font-black tracking-tight break-keep">{offer.title}</h1>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {(offer.badges || []).map((b: string) => (
                    <span key={b} className={`px-2 py-0.5 rounded-md text-[12px] font-black ${BADGE_STYLE[b] || 'bg-slate-100 text-slate-600'}`}>{b}</span>
                  ))}
                  <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold ${st.cls}`}>{st.label}</span>
                </div>
                <p className="mt-3.5 text-[24px] font-black text-emerald-600">
                  {offer.priceType === 'NEGOTIABLE' ? '가격 협의'
                    : offer.priceType === 'SUBSCRIPTION' ? `월 ${offer.monthlyAmount.toLocaleString()}원`
                    : `${offer.supplyAmount.toLocaleString()}원`}
                  <span className="ml-1.5 text-[12px] font-bold text-slate-500">(VAT 별도)</span>
                </p>

                {/* 예상성과 요약 */}
                {perf && (
                  <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                    <p className="text-[12.5px] font-extrabold">
                      예상 노출 및 성과
                      {perf.dataAsOf && <span className="ml-1.5 font-normal text-slate-500">({new Date(perf.dataAsOf).toLocaleDateString('ko-KR')} 데이터 기준)</span>}
                    </p>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(perf.metrics || []).slice(0, 2).map((m: any) => (
                        <Stat key={m.metric} label={m.metric} value={metricRange(m)} sub={m.unit} accent />
                      ))}
                      <Stat label="신뢰도" value={conf?.label ?? '—'} valueCls={conf?.cls} />
                      <Stat label="성과 보장" value={perf.guaranteed ? '있음' : '아님'} valueCls={perf.guaranteed ? 'text-emerald-600' : 'text-rose-600'} sub={perf.guaranteed ? undefined : '성과는 변동될 수 있음'} />
                    </div>
                    <p className="mt-3 text-[12px] text-slate-500 break-keep">* {perf.disclaimer}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 탭 */}
            <div className="rounded-2xl border border-slate-200">
              <div className="flex gap-1 border-b border-slate-100 px-4 overflow-x-auto">
                {TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-3.5 py-3 text-[13.5px] font-bold border-b-2 whitespace-nowrap transition-colors ${
                      tab === t ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {tab === '상품개요' && (
                  <div className="grid md:grid-cols-3 gap-5">
                    <Panel icon={Package} title="상품 구성">
                      <ul className="space-y-2.5">
                        {(offer.components || []).map((c: any) => (
                          <li key={c.id}>
                            <p className="text-[12.5px] font-bold">{c.label}{c.quantity > 1 && ` ${c.quantity}회`}</p>
                            <p className="text-[12px] text-slate-500">{COMPONENT_LABEL[c.componentType] || c.componentType}{c.note ? ` · ${c.note}` : ''}</p>
                          </li>
                        ))}
                      </ul>
                    </Panel>
                    <Panel icon={ShieldCheck} title="이런 브랜드에 추천해요">
                      {(offer.categories || []).length ? (
                        <ul className="space-y-1.5">
                          {offer.categories.map((c: string) => (
                            <li key={c} className="flex items-center gap-1.5 text-[12.5px] text-slate-600">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {c}
                            </li>
                          ))}
                        </ul>
                      ) : <Empty text="등록된 추천 업종이 없습니다" />}
                      {(offer.purposes || []).length > 0 && (
                        <p className="mt-3 pt-3 border-t border-slate-100 text-[12.5px] text-slate-500">
                          목적: {offer.purposes.join(' · ')}
                        </p>
                      )}
                    </Panel>
                    <Panel icon={FileText} title="제공 산출물">
                      <ul className="space-y-2">
                        {(offer.components || []).filter((c: any) => ['REPORT', 'CONTENT', 'ONLINE_ASSET'].includes(c.componentType)).map((c: any) => (
                          <li key={c.id} className="text-[12.5px] text-slate-600">{c.label}</li>
                        ))}
                        <li className="text-[12.5px] text-slate-600">노출 리포트 (요약 PDF)</li>
                      </ul>
                      <p className="mt-3 pt-3 border-t border-slate-100 text-[12.5px] text-slate-500 break-keep">
                        노출 채널: {(offer.channels || []).join(' · ') || '—'}
                      </p>
                    </Panel>
                  </div>
                )}

                {tab === '선수정보' && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(offer.athletes || []).map((a: any) => (
                      <button
                        key={a.athleteId}
                        onClick={() => setShowAthlete(a.athleteId)}
                        className="rounded-xl border border-slate-200 p-4 text-left hover:border-emerald-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0">
                            {a.athlete.profileImageUrl && <img src={a.athlete.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[14px] font-extrabold truncate">{a.athlete.name} <span className="text-[12px] font-bold text-slate-500">프로</span></p>
                            <p className="text-[12.5px] text-slate-500 truncate">{[a.athlete.tour, a.athlete.region].filter(Boolean).join(' · ')}</p>
                          </div>
                        </div>
                        <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-slate-500">
                          <Thermometer className="w-3.5 h-3.5 text-emerald-600" /> 팬온도 {(a.athlete.fanTemp ?? 0).toFixed(1)}℃
                          <span className="ml-auto inline-flex items-center gap-1 text-[12.5px] font-bold text-emerald-700">
                            퀵프로필 <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {tab === '성과예측' && (
                  perf ? (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(perf.metrics || []).map((m: any) => (
                          <div key={m.metric} className="rounded-xl border border-slate-200 p-4">
                            <p className="text-[12.5px] text-slate-500">{m.metric}</p>
                            <p className="mt-1 text-[20px] font-black text-emerald-600">{metricRange(m)}<span className="ml-1 text-[12px] text-slate-500">{m.unit}</span></p>
                            {m.basis && <p className="mt-1.5 text-[12px] text-slate-500 break-keep">근거: {m.basis}</p>}
                          </div>
                        ))}
                      </div>
                      <dl className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-[12.5px]">
                        <div><dt className="text-slate-500">측정 기준</dt><dd className="mt-0.5 font-bold break-keep">{perf.methodology || '—'}</dd></div>
                        <div><dt className="text-slate-500">산식 버전</dt><dd className="mt-0.5 font-bold">{perf.methodVersion || '—'}</dd></div>
                        <div><dt className="text-slate-500">기준일</dt><dd className="mt-0.5 font-bold">{perf.dataAsOf ? new Date(perf.dataAsOf).toLocaleDateString('ko-KR') : '—'}</dd></div>
                        <div><dt className="text-slate-500">신뢰도</dt><dd className={`mt-0.5 font-bold ${conf?.cls}`}>{conf?.label ?? '—'}</dd></div>
                      </dl>
                      <p className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-[12px] text-amber-800 break-keep">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          <b>{perf.disclaimer}</b><br />
                          대회 취소·컷 탈락·플랫폼 알고리즘 변화·소재 품질에 따라 결과가 달라질 수 있습니다.
                        </span>
                      </p>
                    </div>
                  ) : <Empty text="등록된 예상성과 정보가 없습니다" />
                )}

                {tab === '계약조건' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[13px] font-extrabold mb-2">사용 권리와 제한</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          ['대회 착장', offer.offlineUse], ['온라인 이미지', offer.onlineUse],
                          ['매장 인쇄물', offer.printUse], ['2차 활용', offer.secondaryUse],
                        ].map(([label, on]) => (
                          <span key={label as string} className={`px-3 py-1.5 rounded-lg text-[12.5px] font-bold ${on ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500 line-through'}`}>
                            {label as string} {on ? '가능' : '불가'}
                          </span>
                        ))}
                        <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[12.5px] font-bold">지역 {offer.territory}</span>
                      </div>
                      {offer.rightsNote && <p className="mt-2.5 text-[12px] text-slate-500 break-keep">{offer.rightsNote}</p>}
                      {!offer.offlineUse && (
                        <p className="mt-2.5 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-100 px-3.5 py-3 text-[12px] text-rose-700 break-keep">
                          <Ban className="w-4 h-4 shrink-0 mt-0.5" />
                          온라인 전용 상품입니다. 대회 현장·오프라인 매체에는 사용하실 수 없습니다.
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-[13px] font-extrabold mb-2">실행 일정</p>
                      <ol className="space-y-2">
                        {(offer.executionSteps || []).map((s: any, i: number) => (
                          <li key={s.key} className="flex items-center gap-3 text-[12.5px]">
                            <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 text-[12px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                            <span className="font-bold">{s.label}</span>
                            <span className="ml-auto text-slate-500">{s.at ? new Date(s.at).toLocaleDateString('ko-KR') : '일정 협의'}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {(offer.restrictions as string[])?.length > 0 && (
                      <div>
                        <p className="text-[13px] font-extrabold mb-2">유의사항</p>
                        <ul className="space-y-1.5">
                          {(offer.restrictions as string[]).map((r) => (
                            <li key={r} className="flex items-start gap-2 text-[12.5px] text-slate-600 break-keep">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mt-1.5" /> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <p className="text-center text-[12.5px] text-slate-500 break-keep">
              본 상품은 스포츠마케팅 계약의 초안입니다. 구매 확정 시 선수 측과의 정식 계약 체결이 진행되며,
              계약 체결 전 「계약조건」 탭의 내용을 반드시 확인해 주세요.
            </p>
          </div>

          {/* 우: 구매 박스 */}
          <aside className="lg:sticky lg:top-24 rounded-2xl border border-slate-200 p-5">
            <h2 className="text-[15px] font-extrabold">상품 구매</h2>

            <dl className="mt-4 space-y-2.5 text-[13px]">
              <Row k="상품명" v={offer.title} />
              <Row k="선수" v={(offer.athletes || []).map((a: any) => a.athlete.name).join(' · ') || '—'} />
              <Row k="구성" v={(offer.components || []).map((c: any) => c.label).join(' + ') || '—'} />
              <Row k="기간" v={offer.months > 1 ? `${offer.months}개월` : offer.durationCode === 'SINGLE_EVENT' ? '대회 1회' : '30일'} />
            </dl>

            {/* 옵션 */}
            {(offer.options || []).length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                {offer.options.map((o: any) => (
                  <div key={o.code}>
                    <p className="text-[12px] font-bold text-slate-500">
                      {o.label}{o.required && <span className="ml-1 text-rose-500">*</span>}
                    </p>
                    {o.kind === 'ADD_ON' && (
                      <label className="mt-1.5 flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!opts[o.code]}
                          onChange={(e) => setOpts({ ...opts, [o.code]: e.target.checked })}
                          className="w-4 h-4 accent-emerald-600"
                        />
                        <span className="text-[12.5px]">추가 (+{o.addPrice.toLocaleString()}원)</span>
                      </label>
                    )}
                    {o.kind === 'SELECT_ONE' && (
                      <select
                        value={opts[o.code] ?? ''}
                        onChange={(e) => setOpts({ ...opts, [o.code]: e.target.value || undefined })}
                        className="mt-1.5 w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-emerald-400"
                      >
                        <option value="">선택 안 함</option>
                        {((o.choices as any[]) || []).map((c: any) => (
                          <option key={c.value} value={c.value}>
                            {c.label}{c.addPrice ? ` (+${c.addPrice.toLocaleString()}원)` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                    {o.kind === 'QUANTITY' && (
                      <input
                        type="number"
                        min={o.minQty ?? 1}
                        max={o.maxQty ?? 99}
                        value={opts[o.code] ?? o.minQty ?? 1}
                        onChange={(e) => setOpts({ ...opts, [o.code]: Number(e.target.value) })}
                        className="mt-1.5 w-full h-10 px-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-emerald-400"
                      />
                    )}
                    {o.kind === 'BRAND_INPUT' && (
                      <p className="mt-1 text-[12.5px] text-slate-500">구매 후 입력합니다</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 수량 */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[13px] font-bold">수량</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="수량 감소" className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-[15px] font-black tabular-nums w-6 text-center">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(offer.availableQty ?? 99, qty + 1))}
                  disabled={offer.availableQty != null && qty >= offer.availableQty}
                  aria-label="수량 증가"
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="mt-1.5 flex items-center justify-between text-[12px]">
              <span className="text-slate-500">구매 가능 수량</span>
              <span className={`font-bold ${(offer.availableQty ?? 99) <= 3 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {offer.availableQty == null ? '제한 없음' : `${offer.availableQty}개 남음`}
              </span>
            </p>

            <div className="mt-4 pt-4 border-t border-slate-200 flex items-baseline justify-between">
              <span className="text-[13px] font-bold">총 금액</span>
              <span className="text-[22px] font-black text-emerald-600 tabular-nums">
                {quote ? `${quote.supplyAmount.toLocaleString()}원` : '-'}
              </span>
            </div>
            <p className="mt-0.5 text-right text-[12px] text-slate-500">
              VAT 별도 {quote ? `· 포함 ${quote.totalAmount.toLocaleString()}원` : ''}
            </p>

            {err && <p className="mt-3 text-[12.5px] font-bold text-rose-600 break-keep">{err}</p>}
            {msg && <p role="status" aria-live="polite" className="mt-3 text-[12.5px] font-bold text-emerald-700">{msg}</p>}

            <p className={`mt-3 flex items-start gap-1.5 text-[12px] break-keep ${
              hint.tone === 'ok' ? 'text-emerald-700' : hint.tone === 'warn' ? 'text-amber-700' : 'text-slate-500'
            }`}>
              {hint.tone === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
              {hint.label}
            </p>

            <div className="mt-3 space-y-2">
              <button
                onClick={toggleSave}
                className={`w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border text-[13.5px] font-bold transition-colors ${
                  saved ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} /> {saved ? '보관함에 있음' : '보관함 담기'}
              </button>
              {soldOut ? (
                <button className="w-full h-12 rounded-xl bg-slate-100 text-slate-500 text-[14px] font-bold" disabled>
                  재고가 소진되었습니다
                </button>
              ) : canAdd ? (
                <button
                  onClick={() => addCart(canBuy)}
                  disabled={busy || !quote}
                  className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-[14.5px] font-bold hover:bg-emerald-700 disabled:opacity-40"
                >
                  {busy ? '처리 중…' : canBuy ? '바로 구매' : '승인 요청하기'}
                </button>
              ) : offer.allowedActions?.includes('NEGOTIATE') ? (
                <Link
                  to={`/contact?subject=${encodeURIComponent(`[상담] ${offer.title}`)}`}
                  className="w-full h-12 inline-flex items-center justify-center rounded-xl bg-emerald-600 text-white text-[14.5px] font-bold"
                >
                  상담 요청
                </Link>
              ) : offer.allowedActions?.includes('AUCTION') ? (
                <Link to="/auctions" className="w-full h-12 inline-flex items-center justify-center rounded-xl bg-indigo-600 text-white text-[14.5px] font-bold">
                  경매 참여
                </Link>
              ) : (
                <button className="w-full h-12 rounded-xl bg-slate-100 text-slate-500 text-[14px] font-bold" disabled>
                  현재 구매할 수 없습니다
                </button>
              )}
            </div>

            <ul className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-[12.5px] text-slate-500">
              {[
                '성과는 보장되지 않으며, 데이터는 변동될 수 있습니다.',
                '환불 및 취소는 계약조건에 따릅니다.',
                '세금계산서는 결제 완료 후 발행됩니다.',
              ].map((t) => (
                <li key={t} className="flex items-start gap-1.5 break-keep">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" /> {t}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>

      {/* 모바일 하단 고정 CTA (§5.1 10번) */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-white border-t border-slate-200 px-5 py-3 flex items-center gap-3">
        <div className="min-w-0">
          <p className="text-[12px] text-slate-500">총 금액</p>
          <p className="text-[17px] font-black text-emerald-600 tabular-nums">{quote ? `${quote.supplyAmount.toLocaleString()}원` : '-'}</p>
        </div>
        <button onClick={toggleSave} aria-label="보관함" className="w-11 h-11 shrink-0 rounded-xl border border-slate-200 flex items-center justify-center">
          <Bookmark className={`w-4 h-4 ${saved ? 'fill-emerald-600 text-emerald-600' : 'text-slate-500'}`} />
        </button>
        <button
          onClick={() => addCart(canBuy)}
          disabled={busy || soldOut || !canAdd}
          className="flex-1 h-11 rounded-xl bg-emerald-600 text-white text-[14px] font-bold disabled:bg-slate-100 disabled:text-slate-400"
        >
          {soldOut ? '품절' : canBuy ? '바로 구매' : '승인 요청'}
        </button>
      </div>

      {showAthlete && <AthleteQuickLayer athleteId={showAthlete} onClose={() => setShowAthlete(null)} />}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500 shrink-0">{k}</dt>
      <dd className="font-bold text-right break-keep">{v}</dd>
    </div>
  );
}

function Stat({ label, value, sub, accent, valueCls }: {
  label: string; value: string; sub?: string; accent?: boolean; valueCls?: string;
}) {
  return (
    <div>
      <p className="text-[12px] text-slate-500">{label}</p>
      <p className={`mt-0.5 text-[16px] font-black ${valueCls || (accent ? 'text-emerald-600' : '')}`}>{value}</p>
      {sub && <p className="text-[12.5px] text-slate-500">{sub}</p>}
    </div>
  );
}

function Panel({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <p className="flex items-center gap-2 text-[13px] font-extrabold mb-3">
        <Icon className="w-4 h-4 text-emerald-600" /> {title}
      </p>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-[12.5px] text-slate-500">{text}</p>;
}

/** 선수 퀵프로필 레이어 (§5.1 4번, 시안 img_09) */
function AthleteQuickLayer({ athleteId, onClose }: { athleteId: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.getQuickProfile(athleteId).then((r: any) => setData(r?.data || null)).catch(() => setData(null));
  }, [athleteId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const a = data?.athlete;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-6" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label="선수 퀵프로필"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6"
      >
        {!data ? (
          <div className="py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] font-extrabold text-slate-500">프로 퀵 프로필</p>
              <button onClick={onClose} aria-label="닫기" className="text-slate-300 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="mt-4 flex items-start gap-4">
              <span className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 shrink-0">
                {a.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[20px] font-black">{a.name} <span className="text-[13px] font-bold text-slate-500">프로</span></p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[a.tour, a.tourQualification, a.region].filter(Boolean).map((t: string) => (
                    <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[12px] font-bold">{t}</span>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-6">
                  <div>
                    <p className="text-[12px] text-slate-500 inline-flex items-center gap-1"><Thermometer className="w-3 h-3" /> 팬 온도</p>
                    <p className="text-[20px] font-black text-emerald-600">{data.fanTemp.toFixed(1)}<span className="text-[12px]">℃</span></p>
                  </div>
                  <div>
                    <p className="text-[12px] text-slate-500 inline-flex items-center gap-1"><Gauge className="w-3 h-3" /> 최근 5경기</p>
                    <p className="text-[20px] font-black">{data.recentAvgRank != null ? `${data.recentAvgRank}위` : '수집 중'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[12.5px] font-extrabold mb-2">최근 대회 성적</p>
                {data.allResults.length ? (
                  <ul className="space-y-1.5">
                    {data.allResults.slice(0, 5).map((r: any, i: number) => (
                      <li key={i} className="flex items-center justify-between gap-3 text-[12.5px]">
                        <span className="text-slate-600 truncate">{r.eventName}</span>
                        <span className="font-extrabold shrink-0">{r.rank != null ? `${r.rank}위` : '—'}</span>
                      </li>
                    ))}
                  </ul>
                ) : <Empty text="등록된 성적이 없습니다" />}
              </div>
              <div>
                <p className="text-[12.5px] font-extrabold mb-2">후원 가능</p>
                <p className="text-[12.5px] text-slate-600">착장 슬롯 {data.slotOpen}/{data.slotTotal}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data.availableSlots.slice(0, 6).map((s: any) => (
                    <span key={s.code} className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[12.5px] font-bold">{s.name}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-2 pt-4 border-t border-slate-100">
              <Link to={`/athletes/${a.id}`} className="h-12 inline-flex items-center justify-center rounded-xl border border-slate-200 text-[13.5px] font-bold text-slate-700 hover:bg-slate-50">
                전체 프로필 보기
              </Link>
              <button onClick={onClose} className="h-12 inline-flex items-center justify-center rounded-xl bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700">
                이 상품으로 돌아가기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
