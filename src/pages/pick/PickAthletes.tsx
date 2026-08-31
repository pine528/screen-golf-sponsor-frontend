/**
 * 직접 PICK 1단계 — 선수 선택 (리디자인 v2.0 시안 img_12)
 *
 * 왼쪽 선수 리스트 · 가운데 착장 도식 · 오른쪽 선수 상세 패널.
 * 지표는 실측된 값만 보여준다 (LEG-06). 미수집 항목은 표시하지 않는다.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Check, ChevronRight, Loader2, Monitor, Search, X,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import SlotDiagram from '../../components/purchase/SlotDiagram';
import { api } from '../../services/api';

const ACTIVITY_LABELS: Record<string, string> = {
  tour1: '1부 투어', tour2: '2부 투어', gtour: 'G투어', lesson: '레슨',
  proAm: '프로암', sns: 'SNS 콘텐츠', youtube: '유튜브', etc: '기타',
};

export default function PickAthletes() {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [panelLoading, setPanelLoading] = useState(false);
  const [limit, setLimit] = useState(12);

  useEffect(() => {
    (async () => {
      try {
        const r: any = await api.getPickAthletes({});
        const list = r?.data?.athletes || [];
        setAthletes(list);
        if (list[0]) setSelectedId(list[0].id);
      } finally { setLoading(false); }
    })();
  }, []);

  const loadPanel = useCallback(async (id: string) => {
    setPanelLoading(true);
    try {
      const [d, s]: any[] = await Promise.all([api.getPickAthlete(id), api.getPickSlots(id)]);
      setDetail(d?.data || null);
      setSlots(s?.data?.slots || []);
    } finally { setPanelLoading(false); }
  }, []);

  useEffect(() => { if (selectedId) loadPanel(selectedId); }, [selectedId, loadPanel]);

  const filtered = useMemo(
    () => (q.trim() ? athletes.filter((a) => `${a.name}${a.tour}${a.region || ''}`.includes(q.trim())) : athletes),
    [athletes, q],
  );

  const diagramSlots = useMemo(
    () => slots.map((s) => ({ id: s.code, code: s.code, name: s.name, x: s.x, y: s.y, status: s.status, price: s.price })),
    [slots],
  );

  const a = detail?.athlete;
  const activities: string[] = a?.activityFields
    ? Object.entries(a.activityFields).filter(([, v]) => v).map(([k]) => ACTIVITY_LABELS[k] || k)
    : [];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16">
      <PublicHeader />

      <div className="max-w-[1400px] mx-auto px-5 pt-6">
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[12.5px]">
          <Link to="/" className="text-slate-400 hover:text-slate-600">홈</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-400">후원하기</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-emerald-700">선수 · 후원슬롯 직접 PICK</span>
        </nav>

        <div className="mt-5 grid lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(0,400px)] gap-5 items-start">
          {/* 좌: 헤드라인 + 선수 리스트 */}
          <div>
            <h1 className="text-[26px] sm:text-[30px] font-black tracking-tight leading-[1.25] break-keep">
              원하는 선수와 후원위치를<br />직접 <span className="text-emerald-600">PICK</span>하세요
            </h1>
            <p className="mt-2.5 text-[13px] text-slate-500 break-keep">
              선수를 선택하고, 착장 위치와 후원방식을 한 화면에서 확인하세요.
            </p>

            <div className="mt-5 rounded-2xl border border-slate-200 p-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="선수명 · 투어 · 지역으로 검색"
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-[13.5px] focus:outline-none focus:border-emerald-400"
                />
              </div>

              {loading ? (
                <div className="py-12 text-center"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" /></div>
              ) : filtered.length === 0 ? (
                <p className="py-12 text-center text-[13px] font-bold text-slate-500">조건에 맞는 선수가 없습니다</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {filtered.slice(0, limit).map((x) => {
                    const on = x.id === selectedId;
                    return (
                      <li key={x.id}>
                        <button
                          onClick={() => setSelectedId(x.id)}
                          aria-pressed={on}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-colors ${
                            on ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                            {x.profileImageUrl && <img src={x.profileImageUrl} alt="" loading="lazy" className="w-full h-full object-cover object-top" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[15px] font-extrabold">{x.name}</span>
                            <span className="block text-[11.5px] text-slate-400">
                              {[x.tour, x.region].filter(Boolean).join(' · ')}
                            </span>
                            <span className="block text-[11.5px] text-slate-500 mt-0.5">
                              슬롯 {x.slotCount}개
                              {x.minSlotPrice != null && ` · 최저 ${(x.minSlotPrice / 10000).toLocaleString()}만원`}
                            </span>
                          </span>
                          {on && (
                            <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 text-white" />
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {filtered.length > limit && (
                <button
                  onClick={() => setLimit(limit + 12)}
                  className="mt-2 w-full h-11 inline-flex items-center justify-between px-4 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50"
                >
                  더 많은 선수 보기 <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 중: 착장 도식 */}
          <div className="rounded-2xl bg-slate-50/70 border border-slate-100 p-5">
            {panelLoading ? (
              <div className="py-24 text-center"><Loader2 className="w-7 h-7 text-emerald-500 animate-spin mx-auto" /></div>
            ) : diagramSlots.length === 0 ? (
              <p className="py-24 text-center text-[13px] font-bold text-slate-500">판매 중인 슬롯이 없습니다</p>
            ) : (
              <>
                <SlotDiagram
                  slots={diagramSlots}
                  selectedId={null}
                  onSelect={(s) => selectedId && navigate(`/sponsor/pick/${selectedId}/slots?slot=${s.code}`)}
                />
                <p className="mt-2 text-center text-[11.5px] text-slate-400">슬롯을 클릭해 상세 정보를 확인하세요</p>
              </>
            )}
          </div>

          {/* 우: 선수 상세 패널 */}
          <aside className="lg:sticky lg:top-24 rounded-2xl border border-slate-200 shadow-[0_18px_48px_-28px_rgba(15,23,42,0.28)] p-5">
            {!a ? (
              <div className="py-24 text-center"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" /></div>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <span className="w-24 h-28 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    {a.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[19px] font-black">{a.name}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold">{a.tour}</span>
                      {a.tourQualification && <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold">{a.tourQualification}</span>}
                      {a.region && <span className="text-[11.5px] text-slate-400">{a.region}</span>}
                    </div>
                    {detail.minSlotPrice != null && (
                      <p className="mt-2.5 text-[13px]">
                        <span className="text-slate-400">후원슬롯 </span>
                        <b>{detail.slotCount}개</b>
                        <span className="text-slate-400"> · 최저 </span>
                        <b className="text-emerald-600">{detail.minSlotPrice.toLocaleString()}원</b>
                      </p>
                    )}
                  </div>
                  <button onClick={() => setSelectedId(null)} aria-label="닫기" className="text-slate-300 hover:text-slate-500 lg:hidden">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {activities.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[11.5px] font-bold text-slate-400">주요 활동</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {activities.map((t) => (
                        <span key={t} className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11.5px] font-bold text-slate-600">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {(a.height || a.debutYear || a.region || a.affiliation) && (
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
                    {a.height && <div className="flex gap-2"><dt className="text-slate-400">신장</dt><dd className="font-bold">{a.height}cm</dd></div>}
                    {a.debutYear && <div className="flex gap-2"><dt className="text-slate-400">프로입회</dt><dd className="font-bold">{a.debutYear}</dd></div>}
                    {a.region && <div className="flex gap-2"><dt className="text-slate-400">활동지역</dt><dd className="font-bold">{a.region}</dd></div>}
                    {a.affiliation && <div className="flex gap-2 col-span-2"><dt className="text-slate-400 shrink-0">소속</dt><dd className="font-bold break-keep">{a.affiliation}</dd></div>}
                  </dl>
                )}

                {detail.recentResults?.length > 0 && (
                  <div className="mt-5">
                    <p className="text-[12.5px] font-extrabold">최근 대회성과</p>
                    <ul className="mt-2 space-y-1.5">
                      {detail.recentResults.map((r: any, i: number) => (
                        <li key={i} className="flex items-center gap-3 text-[12.5px]">
                          <span className="text-slate-500 truncate flex-1">{r.eventName}</span>
                          <span className="font-extrabold shrink-0">{r.rank != null ? `${r.rank}위` : '기록 없음'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {detail.digital && (
                  <div className="mt-5 rounded-xl bg-emerald-50/70 border border-emerald-100 p-4">
                    <p className="text-[10.5px] font-black tracking-wider text-emerald-600">DIGITAL PARTNER</p>
                    <p className="mt-1 text-[14px] font-extrabold">디지털 파트너 모집 중</p>
                    <p className="mt-1 text-[11.5px] text-slate-500 break-keep">
                      경기복 부착 없이 온라인 · 팬스토어 · 등록매장에서 1년간 함께하는 구독형 파트너십
                    </p>
                    <div className="mt-2.5 flex items-center justify-between gap-3">
                      <p className="text-[12.5px]">
                        {detail.digital.minMonthlyPrice != null && (
                          <><b className="text-emerald-700">월 {detail.digital.minMonthlyPrice.toLocaleString()}원</b>부터 · </>
                        )}
                        12개월 약정
                      </p>
                      <Link
                        to={`/digital-partner/athletes/${a.id}`}
                        className="shrink-0 h-9 px-3 inline-flex items-center gap-1 rounded-lg border border-emerald-600 text-emerald-700 text-[12px] font-bold hover:bg-emerald-50"
                      >
                        <Monitor className="w-3.5 h-3.5" /> 월 구독상품 보기
                      </Link>
                    </div>
                  </div>
                )}

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Link
                    to={`/athletes/${a.id}`}
                    className="h-11 inline-flex items-center justify-center rounded-xl border border-slate-200 text-[13px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    전체 프로필 보기
                  </Link>
                  <Link
                    to={`/sponsor/pick/${a.id}/slots`}
                    className="h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold hover:bg-emerald-700"
                  >
                    이 선수 PICK <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
