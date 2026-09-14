/**
 * 직접 PICK — Build `/sponsor/direct/build/:athleteId`
 * UI/UX 통합 가이드 v1.0 §6.3 · 통합 핸드오프 v2.1 §3 (canonical route: /build 하나, /configure 없음)
 *
 *  좌: 도식 Front/Back + hotspot + 텍스트 위치 목록 (같은 inventory state)
 *  우: 선택 슬롯 · 온라인 상품 · 기간 · 판매유형 · 시작일 · 추가활동 · 사용범위 · 예상금액
 *  고정 CTA 1개: 선택 n개 · 공급가 · VAT · 총액 · [견적함에 담기]
 *
 *  금액은 서버 quote가 단일 진실원천이다. 화면은 응답만 표시한다 (S2 §5.6).
 *  슬롯 상태는 색상만이 아니라 텍스트+아이콘으로 표시한다 (§6.3).
 *  소재(로고·카피)는 승인 요청 단계에서 받는다 (DirectRequest).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, Check, ChevronRight, Info, Loader2, Minus, Plus, Search, X,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import DirectStepBar, { SLOT_STATUS } from '../../components/direct/DirectStepBar';
import { api } from '../../services/api';

/** 도식 좌표는 정면 기준으로만 측정되어 있다 — 후면은 목록으로 고른다 */
const FIGURE = '/slots/figure-front.png';
const DRAFT_KEY = 'sponpik.direct.build';

type Line = {
  key: string;
  kind: 'OFFLINE_SLOT' | 'ONLINE_PRODUCT';
  slotCode?: string;
  offerCode?: string;
  quote: any | null;
  error?: string | null;
};

export default function DirectBuild() {
  const { athleteId } = useParams();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  const [profile, setProfile] = useState<any>(null);
  const [offers, setOffers] = useState<any>(null);
  const [options, setOptions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'FRONT' | 'BACK'>('FRONT');
  const [slotCode, setSlotCode] = useState<string | null>(sp.get('slot'));
  const [offerCodes, setOfferCodes] = useState<string[]>((sp.get('offers') || '').split(',').filter(Boolean));
  const [q, setQ] = useState('');

  /* 공통 조건 — 항목마다 다르게 두면 화면이 복잡해진다 */
  const [durationCode, setDurationCode] = useState('SINGLE_EVENT');
  const [saleMode, setSaleMode] = useState('BUY_NOW');
  const [startDate, setStartDate] = useState('');
  const [addOns, setAddOns] = useState<Record<string, number>>({});
  const [scopes, setScopes] = useState<string[]>(['ONLINE']);

  const [lines, setLines] = useState<Line[]>([]);
  const [quoting, setQuoting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, o, opt]: any[] = await Promise.all([
        api.getQuickProfile(athleteId!),
        api.getAthleteOffers(athleteId!),
        api.getPickOptions(),
      ]);
      setProfile(p?.data || null);
      setOffers(o?.data || null);
      setOptions(opt?.data || null);
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
          const d = JSON.parse(raw);
          if (d.athleteId === athleteId) {
            if (!sp.get('slot') && d.slotCode) setSlotCode(d.slotCode);
            if (!sp.get('offers') && d.offerCodes?.length) setOfferCodes(d.offerCodes);
            setDurationCode(d.durationCode || 'SINGLE_EVENT');
            setSaleMode(d.saleMode || 'BUY_NOW');
            setStartDate(d.startDate || '');
            setAddOns(d.addOns || {});
            setScopes(d.scopes || ['ONLINE']);
          }
        }
      } catch { /* 저장값이 깨졌으면 기본값 */ }
    } finally { setLoading(false); }
  }, [athleteId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  const slots: any[] = offers?.slots || [];
  const selectedSlot = useMemo(() => slots.find((s) => s.code === slotCode) || null, [slots, slotCode]);
  useEffect(() => {
    if (!loading && slotCode && !slots.some((s) => s.code === slotCode)) setSlotCode(null);
  }, [loading, slotCode, slots]);

  /* 등·후면 위치를 고르면 도식을 자동 전환한다 */
  useEffect(() => {
    if (selectedSlot && selectedSlot.view !== view) setView(selectedSlot.view);
  }, [selectedSlot]); // eslint-disable-line react-hooks/exhaustive-deps

  /* 선택을 주소에 유지 — 새로고침·공유·로그인 복귀 시 복원 */
  useEffect(() => {
    const next: Record<string, string> = {};
    if (slotCode) next.slot = slotCode;
    if (offerCodes.length) next.offers = offerCodes.join(',');
    setSp(next, { replace: true });
  }, [slotCode, offerCodes]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickSlot = (s: any) => {
    if (!SLOT_STATUS[s.status] || !s.selectable) return;
    setSlotCode(s.code === slotCode ? null : s.code);
  };

  const visibleList = useMemo(() => (q.trim() ? slots.filter((s) => s.name.includes(q.trim())) : slots), [slots, q]);
  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const s of visibleList) map.set(s.groupLabel, [...(map.get(s.groupLabel) || []), s]);
    return [...map.entries()];
  }, [visibleList]);

  const auctionBlocked = useMemo(() => (options?.auctionBlockedDurations || []).includes(durationCode), [options, durationCode]);
  useEffect(() => { if (auctionBlocked && saleMode === 'AUCTION') setSaleMode('BUY_NOW'); }, [auctionBlocked, saleMode]);

  const addOnList = useMemo(
    () => Object.entries(addOns).filter(([, c]) => c > 0).map(([code, count]) => ({ code, count })),
    [addOns],
  );

  /* 서버 견적 — 선택·조건이 바뀔 때마다 항목별 1회 */
  const refresh = useCallback(async () => {
    if (!athleteId || loading) return;
    const specs: Line[] = [
      ...(selectedSlot ? [{ key: `slot:${selectedSlot.code}`, kind: 'OFFLINE_SLOT' as const, slotCode: selectedSlot.code, quote: null }] : []),
      ...offerCodes.map((c) => ({ key: `offer:${c}`, kind: 'ONLINE_PRODUCT' as const, offerCode: c, quote: null })),
    ];
    if (!specs.length) { setLines([]); return; }
    setQuoting(true);
    const results = await Promise.all(specs.map(async (spec) => {
      try {
        const r: any = await api.getDirectPickQuote({
          athleteId, kind: spec.kind, slotCode: spec.slotCode, offerCode: spec.offerCode,
          durationCode, startDate: startDate || undefined, saleMode,
          addOns: spec.kind === 'OFFLINE_SLOT' ? addOnList : [],
          scopes,
        });
        return { ...spec, quote: r?.data ?? null };
      } catch (e: any) {
        return { ...spec, quote: null, error: e?.response?.data?.error?.message || '견적을 계산하지 못했습니다' };
      }
    }));
    setLines(results);
    setQuoting(false);
  }, [athleteId, loading, selectedSlot, offerCodes, durationCode, startDate, saleMode, addOnList, scopes]);
  useEffect(() => {
    const t = setTimeout(refresh, 250);
    return () => clearTimeout(t);
  }, [refresh]);

  const count = (selectedSlot ? 1 : 0) + offerCodes.length;
  const supply = lines.reduce((s, l) => s + (l.quote?.subtotal ?? 0), 0);
  const addOnAmount = lines.reduce((s, l) => s + (l.quote?.addOnAmount ?? 0), 0);
  const vat = Math.round(supply * 0.1);
  const droppedScopes = useMemo(() => {
    const quoted = lines.filter((l) => l.quote);
    const allowed = new Set(quoted.flatMap((l) => l.quote.scopes ?? []));
    return quoted.length ? scopes.filter((s) => !allowed.has(s)) : [];
  }, [lines, scopes]);
  const hasOnlineOnly = offerCodes.length > 0;

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ athleteId, slotCode, offerCodes, durationCode, saleMode, startDate, addOns, scopes }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addToCart = async () => {
    setBusy(true);
    setErr(null);
    try {
      const d: any = await api.openDirectDraft();
      const draftId = d.data.id;
      for (const l of lines) {
        if (!l.quote) continue;
        await api.addDirectItem(draftId, {
          athleteId, kind: l.kind, slotCode: l.slotCode, offerCode: l.offerCode,
          durationCode, startDate: startDate || undefined, saleMode,
          addOns: l.kind === 'OFFLINE_SLOT' ? addOnList : [], scopes,
        }, `${draftId}:${l.key}`).catch((e: any) => { if (e?.response?.status !== 409) throw e; });
      }
      localStorage.removeItem(DRAFT_KEY);
      navigate(`/sponsor/direct/cart?draft=${draftId}`);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) {
        saveDraft();
        navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }
      setErr(status === 403 ? '브랜드 계정으로 로그인하면 견적함에 담을 수 있어요.' : e?.response?.data?.error?.message || '견적함에 담지 못했습니다');
    } finally { setBusy(false); }
  };

  if (loading || !options) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
      </div>
    );
  }

  const a = profile?.athlete;
  const placed = slots.filter((s) => s.view === view && s.x != null && s.y != null);
  const canAdd = count > 0 && !quoting && lines.some((l) => l.quote);

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-32 lg:pb-16">
      <PublicHeader />
      <DirectStepBar
        current={3}
        crumbs={[{ label: a?.name ? `${a.name} 프로` : '선수', to: `/athletes/${athleteId}` }, { label: '후원 위치 · 구성' }]}
        backTo="/sponsor/direct/athletes"
        backLabel="선수 다시 선택"
        onSaveDraft={saveDraft}
      />

      <div className="max-w-[1280px] mx-auto px-5 pt-5">
        {/* 선택한 선수 — 한 줄 요약 */}
        <div className="rounded-2xl border border-slate-200 px-4 py-3 flex items-center gap-3">
          <span className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
            {a?.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-extrabold truncate">{a?.name} <span className="text-[12px] font-bold text-slate-500">프로</span>
              <span className="ml-2 text-[12.5px] font-semibold text-slate-500">{[a?.tour, a?.region].filter(Boolean).join(' · ')}</span>
            </p>
            <p className="mt-0.5 text-[12.5px] text-slate-600">
              판매 슬롯 <b>{profile.slotOpen}/{profile.slotTotal}</b>
              <span className="mx-1.5 text-slate-300">|</span>
              팬온도 <b>{profile.fanTemp > 0 ? `${profile.fanTemp.toFixed(1)}℃` : '집계 중'}</b>
              <span className="mx-1.5 text-slate-300">|</span>
              최근 성적 <b>{profile.recentAvgRank != null ? `평균 ${profile.recentAvgRank}위` : '확인 필요'}</b>
            </p>
          </div>
          <Link to={`/athletes/${athleteId}`} className="shrink-0 text-[12.5px] font-bold text-slate-600 hover:text-emerald-700 inline-flex items-center gap-0.5">
            전체 프로필 <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-5 pt-4 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] gap-5 items-start">
        {/* ── 좌: 위치 선택 ── */}
        <div>
          <h1 className="text-[24px] sm:text-[30px] font-extrabold tracking-[-0.02em] break-keep">
            어디에 후원하시겠어요?
          </h1>
          <p className="mt-2 text-[14px] text-slate-600 break-keep">
            도식이나 목록에서 위치 하나를 고르세요. 오른쪽에서 온라인 상품을 더하고 기간·판매 방식을 정하면 금액이 바로 계산됩니다.
          </p>

          <div className="mt-4 rounded-2xl bg-slate-50/70 border border-slate-100 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1" role="group" aria-label="도식 방향">
                {(['FRONT', 'BACK'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    aria-pressed={view === v}
                    className={`h-9 px-4 rounded-lg text-[13px] font-bold transition-colors ${view === v ? 'bg-emerald-500 text-white' : 'text-slate-600'}`}
                  >
                    {v === 'FRONT' ? '정면' : '후면'}
                    <span className="ml-1 text-[12px] opacity-70">{offers.viewCounts[v]}</span>
                  </button>
                ))}
              </div>
              {selectedSlot && (
                <p className="text-[12.5px] font-bold text-emerald-700">
                  선택: {selectedSlot.name} · {selectedSlot.view === 'FRONT' ? '정면' : '후면'}
                </p>
              )}
            </div>

            {view === 'FRONT' ? (
              <div className="mt-4 relative w-full max-w-[380px] mx-auto aspect-[3/4] rounded-2xl bg-white border border-slate-200 overflow-hidden">
                <svg viewBox="0 0 75 100" className="w-full h-full" role="img" aria-label="선수 착장 슬롯 도식">
                  <image href={FIGURE} x="0" y="0" width="75" height="100" preserveAspectRatio="xMidYMid meet" />
                  {placed.map((s) => {
                    const meta = SLOT_STATUS[s.status] || SLOT_STATUS.EXPIRED;
                    const on = s.code === slotCode;
                    return (
                      <g
                        key={s.code}
                        role="button"
                        tabIndex={0}
                        aria-label={`${s.name} ${meta.label} ${s.price.toLocaleString()}원`}
                        aria-pressed={on}
                        onClick={() => pickSlot(s)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickSlot(s); } }}
                        className={s.selectable ? 'cursor-pointer' : 'cursor-not-allowed'}
                      >
                        {on && <circle cx={s.x * 0.75} cy={s.y} r="3.2" fill={meta.fill} opacity="0.22" />}
                        <circle cx={s.x * 0.75} cy={s.y} r={on ? 1.9 : 1.4} fill={meta.fill} stroke="#fff" strokeWidth="0.5" />
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-white border border-dashed border-slate-300 py-10 px-5 text-center">
                <p className="text-[13.5px] font-bold text-slate-600">후면 도식 이미지는 준비 중입니다</p>
                <p className="mt-1 text-[12.5px] text-slate-500 break-keep">후면 위치는 아래 <b>등</b> 목록에서 동일하게 선택할 수 있습니다.</p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {['AVAILABLE', 'NEEDS_CONFIRMATION', 'HOLD', 'RESERVED', 'SOLD', 'AUCTION', 'BLOCKED', 'EXPIRED'].map((k) => (
                <span key={k} className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-600">
                  <span className={`w-2 h-2 rounded-full ${SLOT_STATUS[k].dot}`} />
                  <span aria-hidden className="text-[12.5px]">{SLOT_STATUS[k].icon}</span>
                  {SLOT_STATUS[k].label}
                </span>
              ))}
            </div>
            <p className="mt-2 text-center text-[12px] text-slate-500">
              슬롯명의 좌·우는 선수가 착용한 기준입니다 (정면에서 보면 좌우가 바뀝니다)
            </p>
          </div>

          {/* 위치별 슬롯 목록 — 도식과 같은 상태 */}
          <div className="mt-4 rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-[14.5px] font-extrabold">위치별 슬롯 목록</h2>
              <div className="relative w-[200px]">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="슬롯 검색"
                  className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
            {grouped.length === 0 ? (
              <p className="py-8 text-center text-[13.5px] font-bold text-slate-600">판매 중인 슬롯이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {grouped.map(([label, list]) => (
                  <div key={label} className="grid grid-cols-[54px_minmax(0,1fr)] gap-3 items-start">
                    <p className="text-[13px] font-extrabold text-slate-600 pt-2.5">{label}</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {list.map((s: any) => {
                        const meta = SLOT_STATUS[s.status] || SLOT_STATUS.EXPIRED;
                        const on = s.code === slotCode;
                        return (
                          <button
                            key={s.code}
                            onClick={() => pickSlot(s)}
                            disabled={!s.selectable}
                            aria-pressed={on}
                            className={`rounded-xl border p-3 text-left transition-colors ${
                              on ? 'border-emerald-500 bg-emerald-50/60'
                                : s.selectable ? 'border-slate-200 hover:border-emerald-300'
                                : 'border-slate-100 bg-slate-50/60 cursor-not-allowed'
                            }`}
                          >
                            <span className={`block text-[13px] font-bold ${s.selectable ? '' : 'text-slate-500'}`}>{s.name}</span>
                            <span className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[12.5px] font-bold ${meta.chip}`}>
                              <span aria-hidden>{meta.icon}</span> {meta.label}
                            </span>
                            <span className={`mt-1.5 block text-[13.5px] font-black text-right tabular-nums ${s.selectable ? '' : 'text-slate-500'}`}>
                              {(s.price / 10000).toLocaleString()}만원
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 우: 구성 패널 ── */}
        <aside className="lg:sticky lg:top-20 rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {/* 선택 */}
          <div className="p-5">
            <h2 className="flex items-center gap-2 text-[15px] font-extrabold">
              선택한 항목
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[12.5px] font-black flex items-center justify-center">{count}</span>
            </h2>
            <div className="mt-3">
              <p className="text-[12.5px] font-bold text-slate-500">후원 위치</p>
              {selectedSlot ? (
                <div className="mt-1.5 rounded-xl border border-emerald-500 bg-emerald-50/40 px-3.5 py-3 flex items-center gap-2">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-extrabold truncate">{selectedSlot.name}</span>
                    <span className={`mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[12.5px] font-bold ${SLOT_STATUS[selectedSlot.status].chip}`}>
                      {SLOT_STATUS[selectedSlot.status].label}
                    </span>
                  </span>
                  <span className="text-[14px] font-black tabular-nums shrink-0">{(selectedSlot.price / 10000).toLocaleString()}만원</span>
                  <button onClick={() => setSlotCode(null)} aria-label="위치 선택 해제" className="shrink-0 text-slate-500 hover:text-slate-700"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <p className="mt-1.5 rounded-xl border border-dashed border-slate-200 py-4 text-center text-[13px] text-slate-500">
                  도식이나 목록에서 위치를 선택하세요
                </p>
              )}
            </div>

            <div className="mt-4">
              <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-slate-500">
                온라인 상품 <span className="font-normal">(여러 개 가능)</span>
              </p>
              <div className="mt-1.5 space-y-1.5">
                {(offers?.offers || []).map((o: any) => {
                  const on = offerCodes.includes(o.code);
                  return (
                    <label key={o.code} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${on ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => setOfferCodes(on ? offerCodes.filter((c) => c !== o.code) : [...offerCodes, o.code])}
                        className="w-4 h-4 accent-emerald-600 shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-bold truncate">{o.name}</span>
                        {o.description && <span className="block text-[12.5px] text-slate-500 truncate">{o.description}</span>}
                      </span>
                      <span className="text-[13px] font-extrabold shrink-0 tabular-nums">{(o.price / 10000).toLocaleString()}만원</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 조건 — 항목이 있을 때만 */}
          {count > 0 && (
            <div className="p-5 space-y-4">
              <Field title="후원 기간">
                <div className="flex flex-wrap gap-1.5">
                  {options.durations.map((d: any) => (
                    <Chip key={d.code} on={durationCode === d.code} onClick={() => setDurationCode(d.code)} title={d.note || undefined}>{d.label}</Chip>
                  ))}
                </div>
              </Field>

              <Field title="판매 방식">
                <div className="flex flex-wrap gap-1.5">
                  {options.saleModes.map((m: any) => {
                    const blocked = m.code === 'AUCTION' && auctionBlocked;
                    return (
                      <Chip key={m.code} on={saleMode === m.code} disabled={blocked} onClick={() => !blocked && setSaleMode(m.code)}
                        title={blocked ? '6개월 이상 장기 상품은 경매로 판매하지 않습니다' : m.desc}>
                        {m.label}
                      </Chip>
                    );
                  })}
                </div>
                {auctionBlocked && <p className="mt-1.5 text-[12px] text-slate-500">6개월 이상 장기 상품은 경매로 판매하지 않습니다.</p>}
              </Field>

              <Field title="시작일" hint="패치 제작 리드타임을 고려해 7일 이후부터">
                <input
                  type="date"
                  value={startDate}
                  min={new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10)}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-11 w-full px-3.5 rounded-xl border border-slate-200 text-[13.5px] focus:outline-none focus:border-emerald-400"
                />
              </Field>

              {selectedSlot && (
                <Field title="추가 활동" hint="선택하지 않아도 기본 후원으로 진행됩니다">
                  <div className="space-y-1.5">
                    {options.addOns.map((o: any) => {
                      const c = addOns[o.code] || 0;
                      return (
                        <div key={o.code} className={`rounded-xl border px-3 py-2 flex items-center gap-2 ${c > 0 ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200'}`}>
                          <input type="checkbox" checked={c > 0} onChange={(e) => setAddOns({ ...addOns, [o.code]: e.target.checked ? 1 : 0 })} className="w-4 h-4 accent-emerald-600 shrink-0" aria-label={o.label} />
                          <span className="text-[13px] font-bold truncate flex-1">{o.label}</span>
                          {c > 0 && (
                            <span className="inline-flex items-center gap-1.5">
                              <button onClick={() => setAddOns({ ...addOns, [o.code]: Math.max(1, c - 1) })} aria-label={`${o.label} 수량 감소`} className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                              <span className="text-[13px] font-black tabular-nums w-5 text-center">{c}</span>
                              <button onClick={() => setAddOns({ ...addOns, [o.code]: Math.min(o.max, c + 1) })} aria-label={`${o.label} 수량 증가`} className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                            </span>
                          )}
                          <span className="text-[12.5px] font-extrabold text-emerald-600 shrink-0 tabular-nums">+{(o.price / 10000).toLocaleString()}만</span>
                        </div>
                      );
                    })}
                  </div>
                </Field>
              )}

              <Field title="사용 범위">
                <div className="flex flex-wrap gap-1.5">
                  {options.scopes.map((s: any) => {
                    const on = scopes.includes(s.code);
                    const dropped = droppedScopes.includes(s.code);
                    return (
                      <button
                        key={s.code}
                        onClick={() => setScopes(on ? scopes.filter((x) => x !== s.code) : [...scopes, s.code])}
                        aria-pressed={on}
                        className={`h-10 px-3.5 rounded-xl border text-[13px] font-bold inline-flex items-center gap-1.5 transition-colors ${
                          dropped ? 'border-amber-300 bg-amber-50 text-amber-700'
                            : on ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {on && !dropped && <Check className="w-3.5 h-3.5" />}
                        {dropped && <AlertTriangle className="w-3.5 h-3.5" />}
                        {s.label}
                      </button>
                    );
                  })}
                </div>
                {droppedScopes.length > 0 && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-[12.5px] text-amber-700 break-keep">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> 선택한 상품이 제공하지 않는 범위는 견적에서 제외됩니다.
                  </p>
                )}
                {hasOnlineOnly && (
                  <p className="mt-1.5 text-[12.5px] text-slate-500 break-keep">온라인 전용 상품은 대회 현장 노출에 쓸 수 없습니다.</p>
                )}
              </Field>
            </div>
          )}

          {/* 금액 — 서버 quote만 표시 */}
          <div className="p-5">
            {lines.map((l) => (l.error || l.quote?.status === 'NEEDS_CONFIRMATION') && (
              <p key={l.key} className={`mb-2 text-[12.5px] font-bold ${l.error ? 'text-rose-600' : 'text-amber-700'}`}>
                {l.quote?.slotName || l.slotCode || l.offerCode}: {l.error || '선수 확인이 필요한 항목입니다'}
              </p>
            ))}
            <dl className="space-y-1.5 text-[13px]">
              {addOnAmount > 0 && <div className="flex justify-between"><dt className="text-slate-500">추가 활동</dt><dd className="font-bold tabular-nums">{addOnAmount.toLocaleString()}원</dd></div>}
              <div className="flex justify-between"><dt className="text-slate-500">공급가</dt><dd className="font-bold tabular-nums">{count ? `${supply.toLocaleString()}원` : '-'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">부가가치세 (10%)</dt><dd className="font-bold tabular-nums">{count ? `${vat.toLocaleString()}원` : '-'}</dd></div>
            </dl>
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-baseline justify-between gap-3">
              <span className="text-[13.5px] font-bold">총액</span>
              <span className="text-[22px] font-black text-emerald-600 tabular-nums">
                {quoting ? <Loader2 className="w-5 h-5 animate-spin inline" /> : count ? `${(supply + vat).toLocaleString()}원` : '-'}
              </span>
            </div>
            <p className="mt-1 text-right text-[12px] text-slate-500">{options.pricingRule} · 담은 후 승인 요청 전 재검증</p>

            {err && <p className="mt-3 text-[12.5px] font-bold text-rose-600 break-keep">{err}</p>}

            <button
              onClick={addToCart}
              disabled={!canAdd || busy}
              className="mt-4 hidden lg:inline-flex w-full h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-[14.5px] font-bold hover:bg-emerald-700 disabled:opacity-40"
            >
              {busy ? '담는 중…' : <>견적함에 담기 <ArrowRight className="w-4 h-4" /></>}
            </button>
            <p className="mt-2 hidden lg:flex items-start gap-1.5 text-[12px] text-slate-500 break-keep">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {saved ? '임시저장했습니다.' : '견적함에 담아도 승인 요청 전까지 선수에게는 보이지 않습니다.'}
            </p>
          </div>
        </aside>
      </div>

      {/* 모바일 고정 CTA — 화면의 핵심 행동 1개 (UI 가이드 §6.3) */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-white border-t border-slate-200 px-5 py-3 flex items-center gap-3 shadow-[0_-8px_24px_-16px_rgba(15,23,42,0.25)]" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="min-w-0">
          <p className="text-[12px] text-slate-500">선택 {count}개 · VAT 포함</p>
          <p className="text-[17px] font-extrabold text-emerald-600 tabular-nums">
            {quoting ? '계산 중…' : count ? `${(supply + vat).toLocaleString()}원` : '-'}
          </p>
        </div>
        <button
          onClick={addToCart}
          disabled={!canAdd || busy}
          className="ml-auto h-12 px-5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[14px] font-bold disabled:opacity-40"
        >
          견적함에 담기 <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function Field({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[13px] font-extrabold text-slate-800">{title}{hint && <span className="ml-1.5 font-normal text-[12px] text-slate-500">{hint}</span>}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Chip({ on, disabled, onClick, title, children }: {
  on: boolean; disabled?: boolean; onClick: () => void; title?: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={on}
      className={`h-10 px-3.5 rounded-xl text-[13px] font-bold transition-colors ${
        disabled ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
          : on ? 'bg-emerald-500 text-white'
          : 'border border-slate-200 text-slate-600 hover:border-emerald-300'
      }`}
    >
      {children}
    </button>
  );
}
