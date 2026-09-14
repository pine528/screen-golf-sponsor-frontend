/**
 * 직접 선택 PICK 4단계 — 조건 구성 (핸드오프 v1.0 §5.4, 시안 img_02)
 *
 * 기간·판매유형·시작일·추가활동·사용권·소재를 정하고 견적함에 담는다.
 * 금액은 서버 quote가 단일 진실원천이며, 화면 합계는 그 응답만 표시한다 (§5.6).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, Bookmark, Check, ChevronRight, Info, Loader2, Minus, Plus,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import DirectStepBar from '../../components/direct/DirectStepBar';
import { api } from '../../services/api';

const DRAFT_KEY = 'sponpik.direct.configure';

type Line = {
  key: string;
  kind: 'OFFLINE_SLOT' | 'ONLINE_PRODUCT';
  slotCode?: string;
  offerCode?: string;
  quote: any | null;
  error?: string | null;
};

export default function DirectConfigure() {
  const { athleteId } = useParams();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const slotCode = sp.get('slot');
  const offerCodes = useMemo(() => (sp.get('offers') || '').split(',').filter(Boolean), [sp]);

  const [options, setOptions] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  /* 공통 조건 — 항목마다 다르게 두면 화면이 복잡해진다 (§1.4 한 화면 하나의 결정) */
  const [durationCode, setDurationCode] = useState('SINGLE_EVENT');
  const [saleMode, setSaleMode] = useState('BUY_NOW');
  const [startDate, setStartDate] = useState('');
  const [addOns, setAddOns] = useState<Record<string, number>>({});
  const [scopes, setScopes] = useState<string[]>(['ONLINE']);
  const [logoName, setLogoName] = useState('');
  const [campaignCopy, setCampaignCopy] = useState('');
  const [landingUrl, setLandingUrl] = useState('');
  const [assetLater, setAssetLater] = useState(true);
  const [note, setNote] = useState('');

  useEffect(() => {
    (async () => {
      const [o, p]: any[] = await Promise.all([api.getPickOptions(), api.getQuickProfile(athleteId!)]);
      setOptions(o?.data || null);
      setProfile(p?.data || null);
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
          const d = JSON.parse(raw);
          if (d.athleteId === athleteId) {
            setDurationCode(d.durationCode || 'SINGLE_EVENT');
            setSaleMode(d.saleMode || 'BUY_NOW');
            setStartDate(d.startDate || '');
            setAddOns(d.addOns || {});
            setScopes(d.scopes || ['ONLINE']);
            setNote(d.note || '');
          }
        }
      } catch { /* 저장값이 깨졌으면 기본값으로 시작한다 */ }
      setLoading(false);
    })();
  }, [athleteId]);

  const auctionBlocked = useMemo(
    () => (options?.auctionBlockedDurations || []).includes(durationCode),
    [options, durationCode],
  );
  useEffect(() => { if (auctionBlocked && saleMode === 'AUCTION') setSaleMode('BUY_NOW'); }, [auctionBlocked, saleMode]);

  const addOnList = useMemo(
    () => Object.entries(addOns).filter(([, c]) => c > 0).map(([code, count]) => ({ code, count })),
    [addOns],
  );

  /* 서버 견적 — 항목마다 1회 */
  const refresh = useCallback(async () => {
    if (!athleteId) return;
    const specs: Line[] = [
      ...(slotCode ? [{ key: `slot:${slotCode}`, kind: 'OFFLINE_SLOT' as const, slotCode, quote: null }] : []),
      ...offerCodes.map((c) => ({ key: `offer:${c}`, kind: 'ONLINE_PRODUCT' as const, offerCode: c, quote: null })),
    ];
    setBusy(true);
    setErr(null);
    const results = await Promise.all(specs.map(async (spec) => {
      try {
        const r: any = await api.getDirectPickQuote({
          athleteId,
          kind: spec.kind,
          slotCode: spec.slotCode,
          offerCode: spec.offerCode,
          durationCode,
          startDate: startDate || undefined,
          saleMode,
          /* 추가 활동은 착장 슬롯에만 붙인다 */
          addOns: spec.kind === 'OFFLINE_SLOT' ? addOnList : [],
          scopes,
        });
        return { ...spec, quote: r?.data ?? null };
      } catch (e: any) {
        return { ...spec, quote: null, error: e?.response?.data?.error?.message || '견적을 계산하지 못했습니다' };
      }
    }));
    setLines(results);
    setBusy(false);
  }, [athleteId, slotCode, offerCodes, durationCode, startDate, saleMode, addOnList, scopes]);

  useEffect(() => { if (!loading) refresh(); }, [loading, refresh]);

  const supply = lines.reduce((s, l) => s + (l.quote?.subtotal ?? 0), 0);
  const addOnAmount = lines.reduce((s, l) => s + (l.quote?.addOnAmount ?? 0), 0);
  const vat = Math.round(supply * 0.1);
  /* 서버가 제거한 사용 범위 — 온라인 전용 상품 때문에 빠진 것이 있으면 알린다 (§12.3) */
  const droppedScopes = useMemo(() => {
    const allowed = new Set(lines.flatMap((l) => l.quote?.scopes ?? []));
    return scopes.filter((s) => !allowed.has(s));
  }, [lines, scopes]);
  const hasOnlineOnly = lines.some((l) => l.kind === 'ONLINE_PRODUCT');

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ athleteId, slotCode, offerCodes, durationCode, saleMode, startDate, addOns, scopes, note }));
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
          athleteId,
          kind: l.kind,
          slotCode: l.slotCode,
          offerCode: l.offerCode,
          durationCode,
          startDate: startDate || undefined,
          saleMode,
          addOns: l.kind === 'OFFLINE_SLOT' ? addOnList : [],
          scopes,
        }, `${draftId}:${l.key}`).catch((e: any) => {
          /* 이미 담긴 항목은 건너뛴다 */
          if (e?.response?.status !== 409) throw e;
        });
      }
      localStorage.removeItem(DRAFT_KEY);
      navigate(`/sponsor/direct/cart?draft=${draftId}`);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) { navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`); return; }
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

  if (!slotCode && offerCodes.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="max-w-lg mx-auto px-5 py-24 text-center">
          <p className="text-[15px] font-bold">후원할 상품을 먼저 선택해주세요</p>
          <Link to={`/sponsor/direct/build/${athleteId}`} className="mt-5 inline-flex h-11 px-5 items-center rounded-xl bg-emerald-600 text-white text-sm font-bold">
            상품 PICK으로 이동
          </Link>
        </div>
      </div>
    );
  }

  const a = profile?.athlete;

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16">
      <PublicHeader />
      <DirectStepBar
        current={4}
        crumbs={[{ label: a?.name ? `${a.name} 프로` : '선수', to: `/sponsor/direct/build/${athleteId}` }, { label: '조건 구성' }]}
        backTo={`/sponsor/direct/build/${athleteId}?slot=${slotCode ?? ''}`}
        backLabel="상품 PICK으로"
        onSaveDraft={saveDraft}
      />

      <div className="max-w-[1400px] mx-auto px-5 pt-6">
        <h1 className="text-center text-[24px] sm:text-[30px] font-black tracking-tight">선택한 후원 조건을 구성하세요</h1>
        <p className="mt-2 text-center text-[13px] text-slate-500">기간 · 구매유형 · 추가 활동과 사용 범위를 확인하세요.</p>

        <div className="mt-6 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-5 items-start">
          <div className="rounded-2xl border border-slate-200 p-5">
            {/* 선택 상품 */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <span className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 shrink-0">
                {a?.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
              </span>
              <div className="min-w-0">
                <p className="text-[16px] font-extrabold">{a?.name} <span className="text-[12px] font-bold text-slate-500">프로</span></p>
                <p className="text-[12px] text-slate-500 truncate">
                  {lines.map((l) => l.quote?.slotName).filter(Boolean).join(' · ') || '상품 확인 중'}
                </p>
              </div>
              <Link
                to={`/sponsor/direct/build/${athleteId}?slot=${slotCode ?? ''}`}
                className="ml-auto shrink-0 h-9 px-3.5 inline-flex items-center rounded-lg border border-slate-200 text-[12.5px] font-bold text-slate-600 hover:bg-slate-50"
              >
                상품 변경
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              <Row n={1} title="후원 기간" required>
                <div className="flex flex-wrap gap-2">
                  {options.durations.map((d: any) => (
                    <Chip key={d.code} on={durationCode === d.code} onClick={() => setDurationCode(d.code)} title={d.note || undefined}>
                      {d.label}
                    </Chip>
                  ))}
                </div>
              </Row>

              <Row n={2} title="구매 유형" required>
                <div className="flex flex-wrap gap-2">
                  {options.saleModes.map((m: any) => {
                    const blocked = m.code === 'AUCTION' && auctionBlocked;
                    return (
                      <Chip
                        key={m.code}
                        on={saleMode === m.code}
                        disabled={blocked}
                        onClick={() => !blocked && setSaleMode(m.code)}
                        title={blocked ? '6개월 이상 장기 상품은 경매로 판매하지 않습니다' : m.desc}
                      >
                        {m.label}
                      </Chip>
                    );
                  })}
                </div>
                {auctionBlocked && <p className="mt-2 text-[12.5px] text-slate-500">6개월 이상 장기 상품은 경매로 판매하지 않습니다.</p>}
              </Row>

              <Row n={3} title="시작일" required>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="date"
                    value={startDate}
                    min={new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10)}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-11 px-3.5 rounded-xl border border-slate-200 text-[13.5px] focus:outline-none focus:border-emerald-400"
                  />
                  <span className="text-[12px] text-slate-500">패치 제작 리드타임을 고려해 7일 이후부터 선택할 수 있습니다.</span>
                </div>
              </Row>

              <Row n={4} title="추가 활동" hint={'선택하지 않아도\n기본 후원으로\n진행할 수 있습니다.'}>
                {slotCode ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {options.addOns.map((o: any) => {
                      const count = addOns[o.code] || 0;
                      return (
                        <div key={o.code} className={`rounded-xl border p-3 ${count > 0 ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200'}`}>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={count > 0}
                              onChange={(e) => setAddOns({ ...addOns, [o.code]: e.target.checked ? 1 : 0 })}
                              className="w-4 h-4 accent-emerald-600 shrink-0"
                              aria-label={o.label}
                            />
                            <span className="text-[12.5px] font-bold truncate">{o.label}</span>
                            <span className="ml-auto text-[12.5px] font-extrabold text-emerald-600 shrink-0">
                              +{o.price.toLocaleString()}
                            </span>
                          </div>
                          {count > 0 && (
                            <div className="mt-2 flex items-center justify-center gap-3">
                              <button
                                onClick={() => setAddOns({ ...addOns, [o.code]: Math.max(1, count - 1) })}
                                aria-label={`${o.label} 수량 감소`}
                                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center"
                              ><Minus className="w-3.5 h-3.5" /></button>
                              <span className="text-[13px] font-black tabular-nums w-6 text-center">{count}</span>
                              <button
                                onClick={() => setAddOns({ ...addOns, [o.code]: Math.min(o.max, count + 1) })}
                                aria-label={`${o.label} 수량 증가`}
                                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center"
                              ><Plus className="w-3.5 h-3.5" /></button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[12.5px] text-slate-500 break-keep">
                    온라인 전용 상품만 선택하셨습니다. 추가 활동은 착장 슬롯을 함께 담을 때 구성할 수 있습니다.
                  </p>
                )}
              </Row>

              <Row n={5} title="사용 범위" required>
                <div className="flex flex-wrap gap-2">
                  {options.scopes.map((s: any) => {
                    const on = scopes.includes(s.code);
                    const dropped = droppedScopes.includes(s.code);
                    return (
                      <button
                        key={s.code}
                        onClick={() => setScopes(on ? scopes.filter((x) => x !== s.code) : [...scopes, s.code])}
                        className={`h-11 px-4 rounded-xl border text-[13px] font-bold inline-flex items-center gap-1.5 transition-colors ${
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
                  <p className="mt-2 flex items-start gap-1.5 text-[12.5px] text-amber-700 break-keep">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    선택한 상품이 제공하지 않는 범위는 견적에서 제외됩니다.
                  </p>
                )}
              </Row>

              <Row n={6} title="소재 제출" required>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[12px] font-bold text-slate-500">로고 파일</span>
                    <input
                      value={logoName}
                      onChange={(e) => setLogoName(e.target.value)}
                      placeholder="파일명 또는 전달 방법"
                      className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-emerald-400"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[12px] font-bold text-slate-500">캠페인 카피 <span className="font-normal text-slate-500">(선택)</span></span>
                    <input
                      value={campaignCopy}
                      onChange={(e) => setCampaignCopy(e.target.value)}
                      placeholder="예) 한계를 넘어, 함께 성장하다"
                      className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-emerald-400"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[12px] font-bold text-slate-500">랜딩 페이지 URL <span className="font-normal text-slate-500">(선택)</span></span>
                    <input
                      value={landingUrl}
                      onChange={(e) => setLandingUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-emerald-400"
                    />
                  </label>
                  <div>
                    <span className="text-[12px] font-bold text-slate-500">제출 시점</span>
                    <div className="mt-1.5 flex gap-4 h-11 items-center">
                      {[[false, '지금 제출'], [true, '나중에 제출']].map(([v, label]) => (
                        <label key={String(v)} className="inline-flex items-center gap-1.5 text-[13px] cursor-pointer">
                          <input
                            type="radio"
                            checked={assetLater === v}
                            onChange={() => setAssetLater(v as boolean)}
                            className="w-4 h-4 accent-emerald-600"
                          />
                          {label as string}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <label className="mt-3 block">
                  <span className="text-[12px] font-bold text-slate-500">선수에게 전달할 요청사항 <span className="font-normal text-slate-500">(선택)</span></span>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 300))}
                    rows={2}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-emerald-400 resize-none"
                  />
                </label>
              </Row>
            </div>

            {hasOnlineOnly && (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-[12.5px] text-amber-800 break-keep">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <b>온라인 전용 상품은 오프라인 대회에서 사용할 수 없습니다.</b><br />
                  선택한 온라인 상품은 대회 현장 노출에 제한이 있습니다.
                </span>
              </p>
            )}
          </div>

          {/* 우: 구성 요약 */}
          <aside className="lg:sticky lg:top-24 rounded-2xl border border-slate-200 p-5">
            <h2 className="text-[15px] font-extrabold">구성 요약</h2>

            <div className="mt-4 space-y-2.5">
              {lines.map((l) => (
                <div key={l.key} className="flex items-start justify-between gap-3 text-[13px]">
                  <span className="min-w-0">
                    <span className="block font-bold truncate">{l.quote?.slotName || (l.slotCode ?? l.offerCode)}</span>
                    <span className="block text-[12px] text-slate-500">
                      {l.kind === 'ONLINE_PRODUCT' ? '온라인 전용' : '착장'} · {l.quote?.duration?.label ?? '-'}
                      {/* 라벨에 개월이 없는 기간(대회 1회·30일)만 환산 개월을 덧붙인다 */}
                      {l.quote?.duration && !l.quote.duration.label.includes('개월') && l.quote.duration.months > 1
                        && ` (${l.quote.duration.months}개월 환산)`}
                    </span>
                    {l.error && <span className="block text-[12px] font-bold text-rose-600">{l.error}</span>}
                    {l.quote?.status === 'NEEDS_CONFIRMATION' && (
                      <span className="block text-[12px] font-bold text-amber-600">선수 확인 필요</span>
                    )}
                  </span>
                  <span className="font-bold tabular-nums shrink-0">
                    {l.quote ? `${l.quote.subtotal.toLocaleString()}원` : '-'}
                  </span>
                </div>
              ))}
            </div>

            <dl className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-[13px]">
              <div className="flex justify-between"><dt className="text-slate-500">추가 활동</dt><dd className="font-bold tabular-nums">{addOnAmount.toLocaleString()}원</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">공급가 합계</dt><dd className="font-bold tabular-nums">{supply.toLocaleString()}원</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">부가가치세 (10%)</dt><dd className="font-bold tabular-nums">{vat.toLocaleString()}원</dd></div>
            </dl>

            <div className="mt-4 pt-4 border-t border-slate-200 flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-bold">예상 합계</span>
              <span className="text-[22px] font-black text-emerald-600 tabular-nums">
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : `${(supply + vat).toLocaleString()}원`}
              </span>
            </div>
            <p className="mt-1 text-right text-[12px] text-slate-500">{options.pricingRule} · VAT 포함</p>

            {err && <p className="mt-3 text-[12.5px] font-bold text-rose-600 break-keep">{err}</p>}

            <button
              onClick={addToCart}
              disabled={busy || lines.every((l) => !l.quote)}
              className="mt-4 w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-[14.5px] font-bold hover:bg-emerald-700 disabled:opacity-40"
            >
              견적함에 담기 <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={saveDraft}
              className="mt-2 w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50"
            >
              <Bookmark className="w-4 h-4" /> {saved ? '저장했습니다' : '임시저장'}
            </button>

            <p className="mt-3 flex items-start gap-1.5 text-[12.5px] text-slate-500 break-keep">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              견적함에 담아도 승인 요청 전까지 선수에게는 노출되지 않습니다.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Row({ n, title, hint, required, children }: {
  n: number; title: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-100 p-4 grid sm:grid-cols-[132px_minmax(0,1fr)] gap-3 sm:gap-4 items-start">
      <div className="flex items-start gap-2">
        <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[12px] font-black flex items-center justify-center shrink-0">{n}</span>
        <div>
          <p className="text-[13.5px] font-extrabold">
            {title}
            {required && <span className="ml-1 text-[12.5px] font-bold text-rose-500 align-top">필수</span>}
          </p>
          {hint && <p className="mt-1 text-[12px] text-slate-500 whitespace-pre-line break-keep">{hint}</p>}
        </div>
      </div>
      <div>{children}</div>
    </section>
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
      className={`h-11 px-5 rounded-xl text-[13.5px] font-bold transition-colors ${
        disabled ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
          : on ? 'bg-emerald-500 text-white'
          : 'border border-slate-200 text-slate-600 hover:border-emerald-300'
      }`}
    >
      {children}
    </button>
  );
}
