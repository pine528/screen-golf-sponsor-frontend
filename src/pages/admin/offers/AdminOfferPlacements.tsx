/**
 * A07 진열 배치관리 (핸드오프 v1.0 §8.2·§8.3, 시안 img_13)
 *
 * 좌: 진열 대상 상품 / 중앙: 섹션별 슬롯 / 우: 노출 규칙
 * 상품 판매기간을 벗어난 배치는 서버가 막는다 (PLACEMENT_INVALID).
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, Loader2, Pin, Plus, RotateCcw, Search, Trash2, X,
} from 'lucide-react';
import { api } from '../../../services/api';
import { BADGE_STYLE, OFFER_STATUS } from '../../../components/offer/OfferCard';

const SURFACES = [
  { code: 'SPONSOR_LANDING', label: '후원하기 랜딩' },
  { code: 'AVAILABLE_LIST', label: '전체 목록' },
  { code: 'MAIN', label: '메인' },
];

const SECTION_LABEL: Record<string, string> = {
  READY_NOW: '바로 시작 가능한 후원',
  CLOSING_SOON: '곧 마감되는 기회',
  NEW: '새롭게 열린 상품',
  LOW_BUDGET: '월 30만원 이하',
  EVENT: '대회별 후원',
  ONLINE_ONLY: '온라인 전용',
  LOCAL: '지역과 함께 성장',
  AUCTION: '현재 진행 경매',
};

const SLOTS_PER_SECTION = 5;

export default function AdminOfferPlacements() {
  const navigate = useNavigate();
  const [surface, setSurface] = useState('SPONSOR_LANDING');
  const [placements, setPlacements] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<any>(null); // 우측 규칙 편집 대상
  const [target, setTarget] = useState<{ section: string; rank: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, l]: any[] = await Promise.all([
        api.listOfferPlacements(surface),
        api.listAdminOffers({ status: 'PUBLISHED', limit: 50 }),
      ]);
      setPlacements(p?.data?.placements || []);
      setCandidates(l?.data?.offers || []);
    } catch (e: any) {
      if ([401, 403].includes(e?.response?.status)) navigate('/login?returnUrl=/admin/offers/placements');
    } finally { setLoading(false); }
  }, [surface, navigate]);
  useEffect(() => { load(); }, [load]);

  const assign = async (offerId: string, sectionKey: string, rank: number) => {
    setBusy(true);
    setErr(null);
    try {
      await api.upsertOfferPlacement({ offerId, surface, sectionKey, rank, status: 'ACTIVE' });
      await load();
      setTarget(null);
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '배치하지 못했습니다');
    } finally { setBusy(false); }
  };

  const update = async (patch: any) => {
    if (!picked) return;
    setBusy(true);
    setErr(null);
    try {
      await api.upsertOfferPlacement({ ...picked, ...patch, surface });
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '저장하지 못했습니다');
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await api.removeOfferPlacement(id);
      if (picked?.id === id) setPicked(null);
      await load();
    } finally { setBusy(false); }
  };

  const sections = Object.keys(SECTION_LABEL).slice(0, 3);
  const filtered = candidates.filter((c) => !q.trim() || c.title.includes(q.trim()) || c.code.includes(q.trim()));

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-[1600px] mx-auto px-5 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/admin/offers" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" /> 상품 목록
          </Link>
          <div>
            <p className="text-[12px] font-bold text-slate-400">A07 진열 배치관리</p>
            <h1 className="text-[20px] font-black">홈 화면과 주요 영역의 후원 상품 진열 위치를 관리합니다.</h1>
          </div>
          <div className="ml-auto inline-flex rounded-xl border border-slate-200 bg-white p-1">
            {SURFACES.map((s) => (
              <button key={s.code} onClick={() => { setSurface(s.code); setPicked(null); }}
                className={`h-9 px-4 rounded-lg text-[12.5px] font-bold ${surface === s.code ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {err && (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-[12.5px] font-bold text-rose-700 break-keep">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {err}
          </p>
        )}

        {loading ? (
          <div className="py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
        ) : (
          <div className="mt-5 grid xl:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(0,320px)] gap-4 items-start">
            {/* 좌: 진열 대상 */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[13.5px] font-extrabold">진열 대상</h2>
                <button onClick={load} aria-label="새로고침" className="text-slate-400 hover:text-slate-700">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">발행된 후원 상품 {candidates.length}건</p>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-300" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="상품명, 코드 검색"
                  className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 text-[12.5px] focus:outline-none focus:border-emerald-400" />
              </div>

              <ul className="mt-3 space-y-2 max-h-[560px] overflow-y-auto">
                {filtered.map((o) => {
                  const placed = placements.some((p) => p.offerId === o.id);
                  return (
                    <li key={o.id}>
                      <button
                        onClick={() => target ? assign(o.id, target.section, target.rank) : null}
                        disabled={!target || busy}
                        className={`w-full rounded-xl border p-3 text-left transition-colors ${
                          target ? 'border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer' : 'border-slate-200 cursor-default'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {(o.preApproved ? ['즉시구매'] : ['선수확인']).map((b) => (
                            <span key={b} className={`px-1.5 py-0.5 rounded text-[10px] font-black ${BADGE_STYLE[b]}`}>{b}</span>
                          ))}
                          {placed && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold">배치됨</span>}
                          {o.daysLeft != null && o.daysLeft <= 14 && (
                            <span className="ml-auto text-[10.5px] font-black text-rose-600">D-{o.daysLeft}</span>
                          )}
                        </span>
                        <span className="mt-1.5 block text-[12.5px] font-extrabold break-keep">{o.title}</span>
                        <span className="mt-0.5 block text-[11px] text-slate-400">
                          {o.athletes[0]?.name ?? '—'} · {o.supplyAmount.toLocaleString()}원
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {target && (
                <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[11.5px] font-bold text-emerald-700 break-keep">
                  {SECTION_LABEL[target.section]} {target.rank}번 슬롯에 넣을 상품을 선택하세요.
                  <button onClick={() => setTarget(null)} className="ml-2 underline">취소</button>
                </p>
              )}
            </div>

            {/* 중앙: 섹션 슬롯 */}
            <div className="space-y-4">
              {sections.map((key) => {
                const items = placements.filter((p) => p.sectionKey === key).sort((a, b) => a.rank - b.rank);
                return (
                  <div key={key} className="rounded-2xl bg-white border border-slate-200 p-5">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[13.5px] font-extrabold">
                        {SURFACES.find((s) => s.code === surface)?.label} &gt; {SECTION_LABEL[key]}
                      </h3>
                      <span className="ml-auto text-[11.5px] text-slate-400">{items.length} / {SLOTS_PER_SECTION}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                      {Array.from({ length: SLOTS_PER_SECTION }, (_, i) => i + 1).map((rank) => {
                        const p = items[rank - 1];
                        const isTarget = target?.section === key && target?.rank === rank;
                        return p ? (
                          <button
                            key={rank}
                            onClick={() => setPicked(p)}
                            className={`rounded-xl border p-3 text-left transition-colors ${
                              picked?.id === p.id ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-emerald-300'
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              <span className="text-[11px] font-black text-slate-400">{rank}</span>
                              {p.pinned && <Pin className="w-3 h-3 text-emerald-600" />}
                              {p.isSponsored && <span className="px-1 py-0.5 rounded bg-amber-100 text-amber-700 text-[9px] font-black">광고</span>}
                              <button
                                onClick={(e) => { e.stopPropagation(); remove(p.id); }}
                                aria-label="배치 해제"
                                className="ml-auto text-slate-300 hover:text-rose-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                            <span className="mt-1.5 block text-[11.5px] font-bold break-keep line-clamp-2">{p.offer.title}</span>
                            <span className="mt-1 block text-[10px] text-slate-400">
                              {OFFER_STATUS[p.offer.displayStatus]?.label}
                            </span>
                          </button>
                        ) : (
                          <button
                            key={rank}
                            onClick={() => setTarget(isTarget ? null : { section: key, rank })}
                            className={`rounded-xl border-2 border-dashed p-3 min-h-[86px] flex flex-col items-center justify-center gap-1 transition-colors ${
                              isTarget ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span className="text-[11px] font-black text-slate-300">{rank}</span>
                            <Plus className={`w-4 h-4 ${isTarget ? 'text-emerald-600' : 'text-slate-300'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <p className="text-[11.5px] text-slate-400">
                빈 슬롯을 누른 뒤 왼쪽에서 상품을 선택하면 배치됩니다. 배치된 슬롯을 누르면 오른쪽에서 노출 규칙을 설정할 수 있습니다.
              </p>
            </div>

            {/* 우: 노출 규칙 */}
            <aside className="xl:sticky xl:top-6 rounded-2xl bg-white border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-extrabold">노출 규칙 설정</h2>
                {picked && (
                  <button onClick={() => setPicked(null)} aria-label="닫기" className="text-slate-300 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!picked ? (
                <p className="py-16 text-center text-[12.5px] text-slate-400 break-keep">
                  배치된 슬롯을 선택하면<br />노출 규칙을 설정할 수 있습니다.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl bg-slate-50 p-3.5">
                    <p className="text-[11px] text-slate-400">적용 위치</p>
                    <p className="mt-0.5 text-[12.5px] font-bold break-keep">
                      {SURFACES.find((s) => s.code === surface)?.label} &gt; {SECTION_LABEL[picked.sectionKey]} &gt; {picked.rank}번
                    </p>
                    <p className="mt-1.5 text-[12px] text-slate-600 break-keep">{picked.offer.title}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-[12px] font-bold text-slate-500">노출 시작</span>
                      <input type="date" defaultValue={picked.activeFrom ? String(picked.activeFrom).slice(0, 10) : ''}
                        onBlur={(e) => update({ activeFrom: e.target.value || null })}
                        className="mt-1.5 w-full h-10 px-3 rounded-lg border border-slate-200 text-[12.5px]" />
                    </label>
                    <label className="block">
                      <span className="text-[12px] font-bold text-slate-500">노출 종료</span>
                      <input type="date" defaultValue={picked.activeTo ? String(picked.activeTo).slice(0, 10) : ''}
                        onBlur={(e) => update({ activeTo: e.target.value || null })}
                        className="mt-1.5 w-full h-10 px-3 rounded-lg border border-slate-200 text-[12.5px]" />
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400">상품 판매 종료일 이후로는 설정할 수 없습니다.</p>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-[12px] font-bold text-slate-500">우선순위</span>
                      <input type="number" defaultValue={picked.rank}
                        onBlur={(e) => update({ rank: Number(e.target.value) })}
                        className="mt-1.5 w-full h-10 px-3 rounded-lg border border-slate-200 text-[12.5px]" />
                      <span className="mt-1 block text-[10.5px] text-slate-400">숫자가 낮을수록 먼저 노출됩니다.</span>
                    </label>
                    <label className="block">
                      <span className="text-[12px] font-bold text-slate-500">노출 상한 (1일)</span>
                      <input type="number" defaultValue={picked.dailyCap ?? ''} placeholder="제한 없음"
                        onBlur={(e) => update({ dailyCap: e.target.value ? Number(e.target.value) : null })}
                        className="mt-1.5 w-full h-10 px-3 rounded-lg border border-slate-200 text-[12.5px]" />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-[12px] font-bold text-slate-500">배지 표시</span>
                    <input defaultValue={picked.badge ?? ''} placeholder="예) 바로 시작"
                      onBlur={(e) => update({ badge: e.target.value || null })}
                      className="mt-1.5 w-full h-10 px-3 rounded-lg border border-slate-200 text-[12.5px]" />
                  </label>

                  <label className="block">
                    <span className="text-[12px] font-bold text-slate-500">배치 사유</span>
                    <input defaultValue={picked.reason ?? ''} placeholder="운영 / 제휴 / 자동규칙"
                      onBlur={(e) => update({ reason: e.target.value || null })}
                      className="mt-1.5 w-full h-10 px-3 rounded-lg border border-slate-200 text-[12.5px]" />
                  </label>

                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={picked.pinned} onChange={(e) => update({ pinned: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                      <span className="text-[12.5px] font-bold">상단 고정</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={picked.isSponsored} onChange={(e) => update({ isSponsored: e.target.checked })} className="w-4 h-4 accent-amber-600" />
                      <span className="text-[12.5px] font-bold">유료 · 제휴 우선노출</span>
                    </label>
                    {picked.isSponsored && (
                      <p className="text-[11px] text-amber-700 break-keep">
                        브랜드 화면에 광고성 표시가 함께 노출됩니다.
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => remove(picked.id)}
                    disabled={busy}
                    className="w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 text-rose-600 text-[13px] font-bold hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" /> 배치 해제
                  </button>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
