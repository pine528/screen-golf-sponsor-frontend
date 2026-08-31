/**
 * 직접 PICK 2단계 — 후원 위치 선택 (리디자인 v2.0 시안 img_13)
 *
 * 도식에서 부위를 고르거나 아래 목록에서 슬롯을 고른다.
 * 상태·가격은 서버 인벤토리 값을 그대로 쓴다 (임의 표기 금지, LEG-06).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronRight, Loader2, Search } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import SlotDiagram, { STATUS_META } from '../../components/purchase/SlotDiagram';
import { api } from '../../services/api';

const STEPS = ['선수 선택', '슬롯 선택', '후원 구성', '확인 · 결제'];

/** 부위 필터 — 도식 좌표가 앞면 기준이라 등·모자 후면은 목록에서만 고른다 */
const PART_TABS = [
  { key: 'ALL', label: '전체' },
  { key: 'CAP', label: '모자', match: (c: string) => c.startsWith('CAP') },
  { key: 'COLLAR', label: '카라', match: (c: string) => c.startsWith('COLLAR') },
  { key: 'CHEST', label: '상의', match: (c: string) => c.startsWith('CHEST') },
  { key: 'SLEEVE', label: '소매', match: (c: string) => c.startsWith('SLEEVE') },
  { key: 'SHOULDER', label: '어깨', match: (c: string) => c.startsWith('SHOULDER_LINE') },
  { key: 'BACK', label: '등', match: (c: string) => c.startsWith('BACK') || c === 'CAP_BACK' },
  { key: 'PANTS', label: '하의', match: (c: string) => c.startsWith('PANTS') },
];

export default function PickSlots() {
  const { athleteId } = useParams();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const [detail, setDetail] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [others, setOthers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [part, setPart] = useState('ALL');
  const [q, setQ] = useState('');
  const [pickedCode, setPickedCode] = useState<string | null>(sp.get('slot'));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, s, l]: any[] = await Promise.all([
        api.getPickAthlete(athleteId!),
        api.getPickSlots(athleteId!),
        api.getPickAthletes({ limit: 12 }),
      ]);
      setDetail(d?.data || null);
      setSlots(s?.data?.slots || []);
      setOthers((l?.data?.athletes || []).filter((x: any) => x.id !== athleteId));
    } finally { setLoading(false); }
  }, [athleteId]);
  useEffect(() => { load(); }, [load]);

  const picked = useMemo(() => slots.find((s) => s.code === pickedCode) || null, [slots, pickedCode]);

  const visible = useMemo(() => {
    const tab = PART_TABS.find((t) => t.key === part);
    let list = slots;
    if (tab?.match) list = list.filter((s) => tab.match!(s.code));
    if (q.trim()) list = list.filter((s) => s.name.includes(q.trim()));
    return list;
  }, [slots, part, q]);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const s of visible) {
      const tab = PART_TABS.slice(1).find((t) => t.match!(s.code));
      const key = tab?.label || '기타';
      map.set(key, [...(map.get(key) || []), s]);
    }
    return [...map.entries()];
  }, [visible]);

  const diagramSlots = useMemo(
    () => slots.map((s) => ({ id: s.code, code: s.code, name: s.name, x: s.x, y: s.y, status: s.status, price: s.price })),
    [slots],
  );

  const a = detail?.athlete;
  const meta = picked ? STATUS_META[picked.status] || STATUS_META.UNAVAILABLE : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16">
      <PublicHeader />

      <div className="max-w-[1400px] mx-auto px-5 pt-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[12.5px]">
            <Link to="/" className="text-slate-400 hover:text-slate-600">홈</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link to="/sponsor/pick" className="text-slate-400 hover:text-slate-600">선수 · 후원슬롯 직접 PICK</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-emerald-700">슬롯 선택</span>
          </nav>
          <ol className="flex items-center gap-1.5 overflow-x-auto">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-1.5 shrink-0">
                <span className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center ${
                  i === 0 ? 'bg-emerald-100 text-emerald-700' : i === 1 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}>{i + 1}</span>
                <span className={`text-[12px] font-bold ${i === 1 ? 'text-emerald-700' : 'text-slate-400'}`}>{s}</span>
                {i < STEPS.length - 1 && <span className="w-5 h-px bg-slate-200 mx-1" />}
              </li>
            ))}
          </ol>
        </div>

        <Link to="/sponsor/pick" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-700 hover:text-emerald-800">
          <ArrowLeft className="w-4 h-4" /> 이전 단계
        </Link>

        <div className="mt-4 grid lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(0,360px)] gap-5 items-start">
          {/* 좌: 선택한 선수 + 다른 선수 */}
          <div>
            <h1 className="text-[26px] sm:text-[30px] font-black tracking-tight break-keep">
              후원할 위치를 <span className="text-emerald-600">PICK</span>하세요
            </h1>
            <p className="mt-2.5 text-[13px] text-slate-500 break-keep">부위를 선택하면 가능한 슬롯과 기본가격을 확인할 수 있습니다.</p>

            <div className="mt-5 rounded-2xl border border-slate-200 p-4">
              <p className="text-[12px] font-bold text-slate-400">선택한 선수</p>
              <div className="mt-2.5 flex items-center gap-3">
                <span className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                  {a?.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                </span>
                <div>
                  <p className="text-[15px] font-extrabold">{a?.name}</p>
                  <p className="text-[11.5px] text-slate-400">{[a?.tour, a?.region].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
              <Link to="/sponsor/pick" className="mt-3 w-full h-10 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50">
                <ArrowLeft className="w-4 h-4" /> 선수 다시 선택
              </Link>
            </div>

            {others.length > 0 && (
              <div className="mt-4 rounded-2xl border border-slate-200 p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
                  <input
                    readOnly
                    onClick={() => navigate('/sponsor/pick')}
                    placeholder="선수명 · 투어 · 지역으로 검색"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-[13.5px] cursor-pointer"
                  />
                </div>
                <ul className="mt-3 space-y-2">
                  {others.slice(0, 3).map((x) => (
                    <li key={x.id}>
                      <Link to={`/sponsor/pick/${x.id}/slots`} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors">
                        <span className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                          {x.profileImageUrl && <img src={x.profileImageUrl} alt="" loading="lazy" className="w-full h-full object-cover object-top" />}
                        </span>
                        <span>
                          <span className="block text-[14px] font-extrabold">{x.name}</span>
                          <span className="block text-[11.5px] text-slate-400">{[x.tour, x.region].filter(Boolean).join(' · ')}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link to="/sponsor/pick" className="mt-2 w-full h-10 inline-flex items-center justify-between px-4 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50">
                  더 많은 선수 보기 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* 중: 도식 + 부위 필터 + 슬롯 목록 */}
          <div className="rounded-2xl bg-slate-50/70 border border-slate-100 p-5">
            <SlotDiagram slots={diagramSlots} selectedId={pickedCode} onSelect={(s) => setPickedCode(s.code)} />

            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
              {PART_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setPart(t.key)}
                  className={`h-9 px-3.5 rounded-lg text-[12.5px] font-bold transition-colors ${
                    part === t.key ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-white border border-slate-200 p-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="슬롯 이름 검색"
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-emerald-400"
                />
              </div>
              {grouped.length === 0 ? (
                <p className="py-8 text-center text-[13px] font-bold text-slate-500">해당 부위에 판매 중인 슬롯이 없습니다</p>
              ) : (
                <div className="space-y-3">
                  {grouped.map(([label, list]) => (
                    <div key={label} className="grid grid-cols-[54px_minmax(0,1fr)] gap-3 items-start">
                      <p className="text-[12.5px] font-extrabold text-slate-500 pt-1.5">{label}</p>
                      <div className="flex flex-wrap gap-2">
                        {list.map((s: any) => {
                          const m = STATUS_META[s.status] || STATUS_META.UNAVAILABLE;
                          const on = s.code === pickedCode;
                          return (
                            <button
                              key={s.code}
                              onClick={() => m.selectable && setPickedCode(s.code)}
                              disabled={!m.selectable}
                              title={`${s.name} · ${m.label} · ${s.price.toLocaleString()}원`}
                              className={`h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border text-[12.5px] font-bold transition-colors ${
                                on ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                  : m.selectable ? 'border-slate-200 text-slate-600 hover:border-emerald-300'
                                  : 'border-slate-100 text-slate-300 cursor-not-allowed'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} /> {s.name}
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

          {/* 우: 선택한 슬롯 */}
          <aside className="lg:sticky lg:top-24 rounded-2xl border border-slate-200 p-5">
            <h2 className="text-[15px] font-extrabold">선택한 슬롯</h2>

            <div className="mt-4 flex items-center gap-3 pb-4 border-b border-slate-100">
              <span className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0">
                {a?.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
              </span>
              <div>
                <p className="text-[15px] font-extrabold">{a?.name}</p>
                <p className="text-[11.5px] text-slate-400">{[a?.tour, a?.region].filter(Boolean).join(' · ')}</p>
              </div>
            </div>

            {!picked ? (
              <p className="py-10 text-center text-[13px] text-slate-400 break-keep">
                도식이나 목록에서<br />후원할 위치를 선택하세요
              </p>
            ) : (
              <>
                <dl className="mt-4 space-y-3 text-[13px]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">선택한 위치</dt>
                    <dd className="font-extrabold text-right break-keep">{picked.name}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">상태</dt>
                    <dd className={`font-bold inline-flex items-center gap-1.5 ${meta!.text}`}>
                      <span className={`w-2 h-2 rounded-full ${meta!.dot}`} /> {meta!.label}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">기본가격</dt>
                    <dd className="text-[17px] font-black text-emerald-600 tabular-nums">{picked.price.toLocaleString()}원</dd>
                  </div>
                  {picked.headline && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500 shrink-0">노출 혜택</dt>
                      <dd className="font-bold text-right break-keep">{picked.headline}</dd>
                    </div>
                  )}
                </dl>

                {picked.copy && <p className="mt-3 text-[12px] text-slate-500 break-keep">{picked.copy}</p>}
                {picked.restrictionNote && (
                  <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[12px] text-rose-700 break-keep">{picked.restrictionNote}</p>
                )}

                <button
                  onClick={() => navigate(`/sponsor/pick/${athleteId}/configure?slot=${picked.code}`)}
                  disabled={!meta!.selectable}
                  className="mt-5 w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700 disabled:opacity-40"
                >
                  이 슬롯으로 후원 구성하기 <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPickedCode(null)}
                  className="mt-2 w-full h-11 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50"
                >
                  선택 취소
                </button>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
