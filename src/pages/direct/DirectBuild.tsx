/**
 * 직접 선택 PICK 3단계 — 상품 PICK (핸드오프 v1.0 §5.2·§5.3, 시안 img_01)
 *
 * 이 화면은 "어디에/무엇을" 하나만 결정한다. 기간·활동은 다음 단계다 (§5.3).
 * 등·후면 위치를 고르면 도식이 자동으로 후면으로 바뀌고 토글 상태를 표시한다 (§5.2).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChevronRight, Info, Loader2, Search } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import DirectStepBar, { SLOT_STATUS } from '../../components/direct/DirectStepBar';
import { api } from '../../services/api';

/** 도식 좌표는 정면 기준으로만 측정되어 있다 — 후면은 목록으로 고른다 */
const FIGURE = '/slots/figure-front.png';

export default function DirectBuild() {
  const { athleteId } = useParams();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  const [profile, setProfile] = useState<any>(null);
  const [offers, setOffers] = useState<any>(null);
  const [others, setOthers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'FRONT' | 'BACK'>('FRONT');
  const [slotCode, setSlotCode] = useState<string | null>(sp.get('slot'));
  const [offerCodes, setOfferCodes] = useState<string[]>([]);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, o, l]: any[] = await Promise.all([
        api.getQuickProfile(athleteId!),
        api.getAthleteOffers(athleteId!),
        api.getPickAthletes({ limit: 8 }),
      ]);
      setProfile(p?.data || null);
      setOffers(o?.data || null);
      setOthers((l?.data?.athletes || []).filter((x: any) => x.id !== athleteId));
    } finally { setLoading(false); }
  }, [athleteId]);
  useEffect(() => { load(); }, [load]);

  const slots: any[] = offers?.slots || [];
  const selectedSlot = useMemo(() => slots.find((s) => s.code === slotCode) || null, [slots, slotCode]);

  /* 등·후면 위치를 고르면 도식을 자동 전환한다 (§5.2) */
  useEffect(() => {
    if (selectedSlot && selectedSlot.view !== view) setView(selectedSlot.view);
  }, [selectedSlot]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickSlot = (s: any) => {
    if (!SLOT_STATUS[s.status] || !s.selectable) return;
    const next = s.code === slotCode ? null : s.code;
    setSlotCode(next);
    setSp(next ? { slot: next } : {}, { replace: true });
  };

  const visibleList = useMemo(() => {
    let list = slots;
    if (q.trim()) list = list.filter((s) => s.name.includes(q.trim()));
    return list;
  }, [slots, q]);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const s of visibleList) map.set(s.groupLabel, [...(map.get(s.groupLabel) || []), s]);
    return [...map.entries()];
  }, [visibleList]);

  const selectedOffers = useMemo(
    () => (offers?.offers || []).filter((o: any) => offerCodes.includes(o.code)),
    [offers, offerCodes],
  );
  const offerTotal = selectedOffers.reduce((s: number, o: any) => s + o.price, 0);
  const total = (selectedSlot?.price || 0) + offerTotal;
  const count = (selectedSlot ? 1 : 0) + selectedOffers.length;

  const next = () => {
    const params = new URLSearchParams();
    if (selectedSlot) params.set('slot', selectedSlot.code);
    if (offerCodes.length) params.set('offers', offerCodes.join(','));
    navigate(`/sponsor/direct/build/${athleteId}/configure?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
      </div>
    );
  }

  const a = profile?.athlete;
  const placed = slots.filter((s) => s.view === view && s.x != null && s.y != null);

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16">
      <PublicHeader />
      <DirectStepBar
        current={3}
        crumbs={[{ label: a?.name ? `${a.name} 프로` : '선수', to: `/athletes/${athleteId}` }, { label: '상품 PICK' }]}
        backTo="/sponsor/direct/athletes"
        backLabel="선수 다시 선택"
      />

      <div className="max-w-[1400px] mx-auto px-5 pt-5 grid lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,360px)] gap-5 items-start">
        {/* 좌: 선택한 선수 · 다른 선수 */}
        <aside>
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <span className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                {a?.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
              </span>
              <div className="min-w-0">
                <p className="text-[16px] font-extrabold">{a?.name} <span className="text-[11.5px] font-bold text-slate-400">프로</span></p>
                <p className="text-[11.5px] text-slate-400">{[a?.tour, a?.region].filter(Boolean).join(' · ')}</p>
                <span className="mt-1 inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10.5px] font-bold">
                  판매 슬롯 {profile.slotOpen}/{profile.slotTotal}
                </span>
              </div>
            </div>
            <dl className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[12px]">
              <div>
                <dt className="text-slate-400">팬온도</dt>
                <dd className="font-extrabold">{profile.fanTemp.toFixed(1)}℃</dd>
              </div>
              <div>
                <dt className="text-slate-400">최근 성적</dt>
                <dd className="font-extrabold">{profile.recentAvgRank != null ? `평균 ${profile.recentAvgRank}위` : '수집 중'}</dd>
              </div>
            </dl>
          </div>

          {others.length > 0 && (
            <div className="mt-4 rounded-2xl border border-slate-200 p-3">
              <p className="text-[12px] font-bold text-slate-400 mb-2">다른 선수</p>
              <ul className="space-y-2">
                {others.slice(0, 5).map((x) => (
                  <li key={x.id}>
                    <Link to={`/sponsor/direct/build/${x.id}`} className="flex items-center gap-3 p-2 rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors">
                      <span className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                        {x.profileImageUrl && <img src={x.profileImageUrl} alt="" loading="lazy" className="w-full h-full object-cover object-top" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-extrabold truncate">{x.name} 프로</span>
                        <span className="block text-[11px] text-slate-400 truncate">{x.tour}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/sponsor/direct/athletes" className="mt-2 h-10 w-full inline-flex items-center justify-between px-3 rounded-xl text-[12.5px] font-bold text-slate-600 hover:bg-slate-50">
                더 많은 선수 보기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </aside>

        {/* 중: 도식 + 슬롯 목록 */}
        <div>
          <h1 className="text-[24px] sm:text-[30px] font-black tracking-tight break-keep">
            후원할 위치와 상품을 <span className="text-emerald-600">PICK</span>하세요
          </h1>
          <p className="mt-2 text-[13px] text-slate-500 break-keep">
            먼저 원하는 위치나 온라인 상품을 선택하세요. 기간과 추가 활동은 다음 단계에서 정합니다.
          </p>

          <div className="mt-4 rounded-2xl bg-slate-50/70 border border-slate-100 p-5">
            {/* 정면/후면 토글 */}
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1" role="group" aria-label="도식 방향">
                {(['FRONT', 'BACK'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    aria-pressed={view === v}
                    className={`h-9 px-4 rounded-lg text-[12.5px] font-bold transition-colors ${
                      view === v ? 'bg-emerald-500 text-white' : 'text-slate-600'
                    }`}
                  >
                    {v === 'FRONT' ? '정면' : '후면'}
                    <span className="ml-1 text-[11px] opacity-70">{offers.viewCounts[v]}</span>
                  </button>
                ))}
              </div>
              {selectedSlot && (
                <p className="text-[12px] font-bold text-emerald-700">
                  선택: {selectedSlot.name} · {selectedSlot.view === 'FRONT' ? '정면' : '후면'}
                </p>
              )}
            </div>

            {/* 도식 — 정면 좌표만 실측되어 있다 */}
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
                <p className="text-[13px] font-bold text-slate-600">후면 도식 이미지는 준비 중입니다</p>
                <p className="mt-1 text-[12px] text-slate-400 break-keep">
                  후면 위치는 아래 <b>등</b> 목록에서 동일하게 선택할 수 있습니다.
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {['AVAILABLE', 'NEEDS_CONFIRMATION', 'HOLD', 'SOLD', 'AUCTION'].map((k) => (
                <span key={k} className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-500">
                  <span className={`w-2 h-2 rounded-full ${SLOT_STATUS[k].dot}`} />
                  <span aria-hidden className="text-[10px]">{SLOT_STATUS[k].icon}</span>
                  {SLOT_STATUS[k].label}
                </span>
              ))}
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              슬롯명의 좌·우는 선수가 착용한 기준입니다 (정면에서 보면 좌우가 바뀝니다)
            </p>
          </div>

          {/* 위치별 슬롯 목록 */}
          <div className="mt-4 rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-[14px] font-extrabold">위치별 슬롯 목록</h2>
              <div className="relative w-[200px]">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-300" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="슬롯 검색"
                  className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 text-[12.5px] focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
            {grouped.length === 0 ? (
              <p className="py-8 text-center text-[13px] font-bold text-slate-500">판매 중인 슬롯이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {grouped.map(([label, list]) => (
                  <div key={label} className="grid grid-cols-[54px_minmax(0,1fr)] gap-3 items-start">
                    <p className="text-[12.5px] font-extrabold text-slate-500 pt-2.5">{label}</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {list.map((s: any) => {
                        const meta = SLOT_STATUS[s.status] || SLOT_STATUS.EXPIRED;
                        const on = s.code === slotCode;
                        return (
                          <button
                            key={s.code}
                            onClick={() => pickSlot(s)}
                            disabled={!s.selectable}
                            className={`rounded-xl border p-3 text-left transition-colors ${
                              on ? 'border-emerald-500 bg-emerald-50/60'
                                : s.selectable ? 'border-slate-200 hover:border-emerald-300'
                                : 'border-slate-100 bg-slate-50/60 cursor-not-allowed'
                            }`}
                          >
                            <span className={`block text-[12.5px] font-bold ${s.selectable ? '' : 'text-slate-400'}`}>{s.name}</span>
                            <span className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-bold ${meta.chip}`}>
                              <span aria-hidden>{meta.icon}</span> {meta.label}
                            </span>
                            <span className={`mt-1.5 block text-[13px] font-black text-right ${s.selectable ? '' : 'text-slate-300'}`}>
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

        {/* 우: 선택 요약 */}
        <aside className="lg:sticky lg:top-24 rounded-2xl border border-slate-200 p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-extrabold">
            선택한 상품
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-black flex items-center justify-center">{count}</span>
          </h2>

          <div className="mt-4">
            <p className="text-[12px] font-bold text-slate-400">위치 상품</p>
            {selectedSlot ? (
              <div className="mt-2 rounded-xl border border-emerald-500 bg-emerald-50/40 p-3.5">
                <p className="text-[13.5px] font-extrabold">{selectedSlot.name}</p>
                <span className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-bold ${SLOT_STATUS[selectedSlot.status].chip}`}>
                  {SLOT_STATUS[selectedSlot.status].label}
                </span>
                <p className="mt-2 flex items-baseline justify-between">
                  <span className="text-[11.5px] text-slate-400">시작가</span>
                  <span className="text-[15px] font-black">{(selectedSlot.price / 10000).toLocaleString()}만원</span>
                </p>
                {selectedSlot.headline && <p className="mt-1.5 text-[11.5px] text-slate-500 break-keep">{selectedSlot.headline}</p>}
              </div>
            ) : (
              <p className="mt-2 rounded-xl border border-dashed border-slate-200 py-5 text-center text-[12.5px] text-slate-400">
                도식이나 목록에서 위치를 선택하세요
              </p>
            )}
          </div>

          <div className="mt-5">
            <p className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400">
              온라인 상품 <span className="font-normal">(다중 선택 가능)</span>
              <Info className="w-3.5 h-3.5" />
            </p>
            <div className="mt-2 space-y-2">
              {(offers?.offers || []).map((o: any) => {
                const on = offerCodes.includes(o.code);
                return (
                  <label
                    key={o.code}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer transition-colors ${
                      on ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => setOfferCodes(on ? offerCodes.filter((c) => c !== o.code) : [...offerCodes, o.code])}
                      className="w-4 h-4 accent-emerald-600 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-bold truncate">{o.name}</span>
                      {o.description && <span className="block text-[10.5px] text-slate-400 truncate">{o.description}</span>}
                    </span>
                    <span className="text-[12.5px] font-extrabold shrink-0">{(o.price / 10000).toLocaleString()}만원</span>
                  </label>
                );
              })}
            </div>
            {selectedOffers.length > 0 && (
              <p className="mt-2 flex justify-between text-[12.5px]">
                <span className="text-slate-500">온라인 상품 합계</span>
                <b>{offerTotal.toLocaleString()}원</b>
              </p>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200 flex items-baseline justify-between">
            <span className="text-[13px] font-bold">총 예상 금액</span>
            <span className="text-[20px] font-black text-emerald-600 tabular-nums">
              {total > 0 ? `${(total / 10000).toLocaleString()}만원` : '-'}
            </span>
          </div>
          <p className="mt-1 text-right text-[11px] text-slate-400">기간·추가 활동 적용 전 · VAT 별도</p>

          <button
            onClick={next}
            disabled={count === 0}
            className="mt-4 w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-[14.5px] font-bold hover:bg-emerald-700 disabled:opacity-40"
          >
            선택 완료 · 조건 구성 <ArrowRight className="w-4 h-4" />
          </button>
        </aside>
      </div>
    </div>
  );
}
