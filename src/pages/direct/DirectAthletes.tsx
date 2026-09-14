/**
 * 직접 선택 PICK 1·2단계 — 선수 탐색 + 퀵프로필 (핸드오프 v1.0 §3, 시안 img_10·img_00)
 *
 * 카드에는 판단에 필요한 핵심 신호만, 판단 정보는 퀵프로필, 원자료는 전체 프로필에 둔다 (§3.3 복잡도 제어).
 * 미수집 지표는 '정보 확인 필요'로 표기하고 0점으로 만들지 않는다 (§3.4 · LEG-06).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Check, Info, Loader2, Scale, Search, Thermometer, X,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { EmptyState, ErrorState, LoadingState, useSlowLoading } from '../../components/ui/StateView';
import DirectStepBar from '../../components/direct/DirectStepBar';
import { api } from '../../services/api';
import { FAN_TEMP_NOTE } from '../../components/fanhub/FanKit';

const SORTS = [
  { key: 'RECENT', label: '최근 활동순' },
  { key: 'FAN_TEMP', label: '팬온도순' },
  { key: 'PERFORMANCE', label: '성적순' },
  { key: 'PRICE', label: '가격 낮은순' },
  { key: 'NEW', label: '신규순' },
];

const CHIPS = [
  { key: 'ALL', label: '전체', patch: {} },
  { key: 'KLPGA', label: 'KLPGA', patch: { tour: 'KLPGA' } },
  { key: 'KPGA', label: 'KPGA', patch: { tour: 'KPGA' } },
  { key: 'SEOUL', label: '서울·경기', patch: { region: '서울' } },
  { key: 'BUDGET', label: '월 50만원 이하', patch: { maxMonthly: 500_000 } },
  { key: 'ONLINE', label: '온라인 전용', patch: { mode: 'ONLINE' } },
  { key: 'OFFLINE', label: '오프라인 슬롯', patch: { mode: 'OFFLINE' } },
];

const AVAILABILITY: Record<string, { label: string; cls: string }> = {
  OPEN: { label: '후원 가능', cls: 'bg-emerald-500 text-white' },
  PARTIAL: { label: '일부 가능', cls: 'bg-amber-500 text-white' },
  CLOSED: { label: '모집 마감', cls: 'bg-slate-400 text-white' },
};

export default function DirectAthletes() {
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<any>(null);
  const slow = useSlowLoading(loading);
  const [q, setQ] = useState('');
  const [chip, setChip] = useState('ALL');
  const [sort, setSort] = useState('RECENT');
  const [compare, setCompare] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr(null);
    try {
      const patch = CHIPS.find((c) => c.key === chip)?.patch || {};
      const r: any = await api.getPickAthletes({ q: q.trim() || undefined, sort, limit: 60, ...patch });
      setAthletes(r?.data?.athletes || []);
    } catch (e) {
      setLoadErr(e);
      setAthletes([]);
    } finally { setLoading(false); }
  }, [q, chip, sort]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const toggleCompare = (a: any) => {
    setCompare((prev) => prev.some((x) => x.id === a.id)
      ? prev.filter((x) => x.id !== a.id)
      : prev.length >= 3 ? prev : [...prev, a]);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-32">
      <PublicHeader />
      <DirectStepBar current={1} crumbs={[{ label: '선수 탐색' }]} backTo="/sponsor" backLabel="후원 방식 다시 선택" />

      <section className="max-w-[1400px] mx-auto px-5 pt-6">
        <h1 className="text-[27px] sm:text-[34px] font-extrabold tracking-[-0.02em] break-keep">
          어떤 선수를 후원하시겠어요?
        </h1>
        <p className="mt-2.5 text-[14.5px] text-slate-600 break-keep">
          카드에는 핵심 신호만 보여드립니다. 자세한 판단은 <b className="text-slate-800">선수 정보</b>에서, 원자료는 전체 프로필에서 확인하세요.
        </p>

        {/* 검색 · 필터 · 정렬 */}
        <div className="mt-5 rounded-2xl border border-slate-200 p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-300" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="선수명 · 투어 · 지역으로 검색"
                className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-[13.5px] focus:outline-none focus:border-emerald-400"
              />
            </div>
            <label className="shrink-0">
              <span className="sr-only">정렬 기준</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-11 px-3.5 rounded-xl border border-slate-200 text-[13px] font-bold focus:outline-none focus:border-emerald-400"
              >
                {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <button
                key={c.key}
                onClick={() => setChip(c.key)}
                className={`h-9 px-3.5 rounded-xl text-[12.5px] font-bold transition-colors ${
                  chip === c.key ? 'bg-emerald-500 text-white' : 'border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 text-[13.5px] font-bold text-slate-600">
          전체 선수 <b className="text-slate-900">{athletes.length}명</b>
          <span className="ml-2 font-normal text-slate-500">선택한 정렬 기준으로 나열됩니다</span>
        </p>

        {/* 카드 */}
        {loading ? (
          <LoadingState label="선수 목록을 불러오는 중…" slow={slow} onRetry={load} />
        ) : loadErr ? (
          <div className="mt-5"><ErrorState error={loadErr} onRetry={load} /></div>
        ) : athletes.length === 0 ? (
          <div className="mt-5">
            <EmptyState title="조건에 맞는 선수가 없습니다" desc="검색어·필터를 넓히거나, 목표와 예산으로 추천을 받아보세요.">
              <button onClick={() => { setQ(''); setChip('ALL'); }} className="h-10 px-4 inline-flex items-center rounded-xl border border-slate-200 text-[13px] font-bold text-slate-700">필터 초기화</button>
              <Link to="/sponsor/recommended" className="h-10 px-4 inline-flex items-center rounded-xl bg-emerald-600 text-white text-[13px] font-bold">추천 PICK 받기</Link>
            </EmptyState>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {athletes.map((a) => {
              const av = AVAILABILITY[a.availability] || AVAILABILITY.OPEN;
              const picked = compare.some((x) => x.id === a.id);
              const temp = typeof a.fanTemp === 'number' && a.fanTemp > 0 ? a.fanTemp : null;
              const traits: string[] = (a.modes || []).slice(0, 2);
              return (
                <article key={a.id} className={`rounded-3xl border overflow-hidden transition-all flex flex-col ${
                  picked ? 'border-emerald-400 shadow-[0_12px_32px_-14px_rgba(16,185,129,0.35)]' : 'border-slate-200 hover:border-emerald-300 hover:shadow-[0_12px_32px_-14px_rgba(15,23,42,0.16)]'
                }`}>
                  <button onClick={() => setOpenId(a.id)} className="relative aspect-[4/5] sm:aspect-[4/3] bg-slate-100 text-left w-full overflow-hidden shrink-0">
                    {a.profileImageUrl
                      ? <img src={a.profileImageUrl} alt={a.name} loading="lazy" className="w-full h-full object-cover object-top" />
                      : <span className="w-full h-full flex items-center justify-center text-[40px] font-extrabold text-slate-300">{a.name?.slice(0, 1)}</span>}
                    <span className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-[12px] font-extrabold ${av.cls}`}>{av.label}</span>
                  </button>

                  <div className="p-4 flex-1 flex flex-col">
                    <button onClick={() => setOpenId(a.id)} className="text-left min-w-0">
                      <p className="text-[16px] font-extrabold truncate">{a.name} <span className="text-[12px] font-bold text-slate-500">프로</span></p>
                      <p className="mt-0.5 text-[12.5px] text-slate-500 truncate">{[a.tour, a.region].filter(Boolean).join(' · ') || '선수'}</p>
                    </button>

                    {traits.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {traits.map((m) => (
                          <span key={m} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[12.5px] font-bold">{m}</span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-end justify-between gap-2">
                      <div>
                        <p className="text-[12px] text-slate-500" title={FAN_TEMP_NOTE}>팬온도</p>
                        <p className="mt-0.5 text-[14px] font-extrabold inline-flex items-center gap-1 tabular-nums">
                          <Thermometer className="w-3.5 h-3.5 text-emerald-600" />
                          {temp !== null ? `${temp.toFixed(1)}℃` : <span className="text-slate-500 font-bold">집계 중</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[12px] text-slate-500">시작가</p>
                        <p className="mt-0.5 text-[15px] font-extrabold text-emerald-600 tabular-nums">
                          {a.minPrice != null ? `${(a.minPrice / 10000).toLocaleString()}만원~` : '협의'}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/sponsor/direct/build/${a.id}`}
                      className="mt-3 h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold hover:bg-emerald-700"
                    >
                      이 선수 선택 <ArrowRight className="w-4 h-4" />
                    </Link>
                    <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => setOpenId(a.id)}
                        className="h-9 rounded-lg text-[12.5px] font-bold text-slate-600 hover:bg-slate-50"
                      >
                        선수 정보
                      </button>
                      <button
                        onClick={() => toggleCompare(a)}
                        disabled={!picked && compare.length >= 3}
                        className={`h-9 inline-flex items-center justify-center gap-1 rounded-lg text-[12.5px] font-bold transition-colors ${
                          picked ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 disabled:opacity-40'
                        }`}
                      >
                        {picked ? <><Check className="w-3.5 h-3.5" /> 비교 중</> : <><Scale className="w-3.5 h-3.5" /> 비교</>}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 비교 바 — 최대 3명 (§3.4) */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-white border-t border-slate-200 shadow-[0_-8px_24px_-16px_rgba(15,23,42,0.25)]">
        <div className="max-w-[1400px] mx-auto px-5 py-3 flex items-center gap-3 overflow-x-auto">
          <p className="text-[12.5px] font-bold text-slate-500 shrink-0">
            비교할 선수를 최대 3명까지 <b className="text-slate-900">{compare.length} / 3</b>
          </p>
          <div className="flex gap-2 shrink-0">
            {[0, 1, 2].map((i) => {
              const a = compare[i];
              return a ? (
                <span key={a.id} className="h-11 pl-2 pr-3 inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/60">
                  <span className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 shrink-0">
                    {a.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                  </span>
                  <span className="text-[12.5px] font-bold whitespace-nowrap">{a.name}</span>
                  <button onClick={() => toggleCompare(a)} aria-label={`${a.name} 비교 해제`} className="text-slate-500 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ) : (
                <span key={i} className="h-11 px-4 inline-flex items-center rounded-xl border border-dashed border-slate-200 text-[12px] text-slate-300 whitespace-nowrap">
                  선수 추가
                </span>
              );
            })}
          </div>
          <button
            onClick={() => setOpenId(compare[0]?.id ?? null)}
            disabled={compare.length < 2}
            className="ml-auto shrink-0 h-11 px-6 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold disabled:bg-emerald-100 disabled:text-emerald-400"
          >
            <Scale className="w-4 h-4" /> 선수 비교
          </button>
        </div>

        {compare.length >= 2 && (
          <div className="max-w-[1400px] mx-auto px-5 pb-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${compare.length}, minmax(0,1fr))` }}>
            {compare.map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-200 p-3">
                <p className="text-[13px] font-extrabold">{a.name} 프로</p>
                <dl className="mt-1.5 space-y-1 text-[12.5px]">
                  <Row k="시작가" v={a.minPrice != null ? `${(a.minPrice / 10000).toLocaleString()}만원` : '정보 확인 필요'} />
                  <Row k="가능 슬롯" v={`${a.slotOpen}/${a.slotTotal}`} />
                  <Row k="팬온도" v={a.fanTemp > 0 ? `${a.fanTemp.toFixed(1)}℃` : '집계 중'} />
                  <Row k="최근 성적" v={a.recentAvgRank != null ? `평균 ${a.recentAvgRank}위` : '정보 확인 필요'} />
                  <Row k="TOP10" v={a.recentResults.length ? `${a.top10Count}회` : '정보 확인 필요'} />
                </dl>
                <Link
                  to={`/sponsor/direct/build/${a.id}`}
                  className="mt-2 h-9 w-full inline-flex items-center justify-center rounded-lg bg-emerald-600 text-white text-[12px] font-bold"
                >
                  이 선수 PICK
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {openId && (
        <QuickProfile
          athleteId={openId}
          onClose={() => setOpenId(null)}
          onPick={(id) => navigate(`/sponsor/direct/build/${id}`)}
        />
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500 shrink-0">{k}</dt>
      <dd className={`font-bold text-right ${v === '정보 확인 필요' || v === '집계 중' ? 'text-slate-500' : ''}`}>{v}</dd>
    </div>
  );
}

/* ── 2단계: 퀵프로필 레이어 (§3.3) ─────────────────────── */

const TABS = ['요약', '대회 성과', '활동', '후원 가능', '브랜드 이력'] as const;

const ACTIVITY_LABELS: Record<string, string> = {
  tour1: '대회 출전', tour2: '2부 투어', gtour: 'G투어', lesson: '레슨',
  proAm: '프로암', sns: 'SNS 콘텐츠', youtube: '유튜브', etc: '기타',
};

function QuickProfile({ athleteId, onClose, onPick }: {
  athleteId: string; onClose: () => void; onPick: (id: string) => void;
}) {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<string>(TABS[0]);

  useEffect(() => {
    setData(null);
    api.getQuickProfile(athleteId).then((r: any) => setData(r?.data || null)).catch(() => setData(null));
  }, [athleteId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const a = data?.athlete;
  const activities: string[] = useMemo(() => (a?.activityFields
    ? Object.entries(a.activityFields).filter(([, v]) => v).map(([k]) => ACTIVITY_LABELS[k] || k)
    : []), [a]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="선수 퀵프로필"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[86vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6"
      >
        {!data ? (
          <div className="py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
        ) : (
          <>
            <div className="flex items-start gap-4">
              <span className="w-24 h-28 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                {a.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[20px] font-black">{a.name} <span className="text-[13px] font-bold text-slate-500">프로</span></p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[a.tour, a.tourQualification, a.region].filter(Boolean).map((t: string) => (
                    <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[12px] font-bold">{t}</span>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 rounded-xl border border-slate-200 p-3">
                  <Stat label="팬온도" value={data.fanTemp > 0 ? `${data.fanTemp.toFixed(1)}℃` : '집계 중'} />
                  <Stat label="최근 5경기" value={data.recentAvgRank != null ? `평균 ${data.recentAvgRank}위` : '수집 중'} />
                  <Stat label="시작가" value={data.minPrice != null ? `${(data.minPrice / 10000).toLocaleString()}만원` : '협의'} />
                </div>
                <p className="mt-1.5 text-right text-[12px] text-slate-500">
                  {new Date(data.verifiedAt).toLocaleDateString('ko-KR')} 기준
                </p>
              </div>
              <button onClick={onClose} aria-label="닫기" className="shrink-0 text-slate-300 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 flex gap-1 border-b border-slate-100 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3.5 py-2.5 text-[13px] font-bold border-b-2 whitespace-nowrap transition-colors ${
                    tab === t ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="mt-4 min-h-[180px]">
              {tab === '요약' && (
                <div className="space-y-4">
                  {a.bio && <p className="text-[13px] text-slate-600 leading-relaxed break-keep">{a.bio}</p>}
                  <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {a.height && <Field k="신장" v={`${a.height}cm`} />}
                    {a.debutYear && <Field k="프로입회" v={String(a.debutYear)} />}
                    {a.region && <Field k="활동지역" v={a.region} />}
                    {a.affiliation && <Field k="소속" v={a.affiliation} />}
                  </dl>
                  {(a.highlights as string[] | null)?.length ? (
                    <ul className="space-y-1.5">
                      {(a.highlights as string[]).slice(0, 4).map((h) => (
                        <li key={h} className="flex items-start gap-2 text-[12.5px] text-slate-600 break-keep">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" /> {h}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )}

              {tab === '대회 성과' && (
                data.allResults.length ? (
                  <table className="w-full text-[12.5px]">
                    <thead>
                      <tr className="text-slate-500 text-left border-b border-slate-100">
                        <th className="py-2 font-bold">대회명</th>
                        <th className="py-2 font-bold w-24">일자</th>
                        <th className="py-2 font-bold w-16 text-right">순위</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.allResults.map((r: any, i: number) => (
                        <tr key={i} className="border-b border-slate-50">
                          <td className="py-2 truncate">{r.eventName}</td>
                          <td className="py-2 text-slate-500">{new Date(r.eventDate).toLocaleDateString('ko-KR')}</td>
                          <td className="py-2 text-right font-extrabold">{r.rank != null ? `${r.rank}위` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <Empty text="등록된 대회 성과가 아직 없습니다" />
              )}

              {tab === '활동' && (
                activities.length ? (
                  <div className="flex flex-wrap gap-2">
                    {activities.map((t) => (
                      <span key={t} className="px-3.5 py-2 rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-600">{t}</span>
                    ))}
                  </div>
                ) : <Empty text="등록된 활동 정보가 아직 없습니다" />
              )}

              {tab === '후원 가능' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[12.5px] font-extrabold mb-2">착장 슬롯 {data.slotOpen}/{data.slotTotal}</p>
                    {data.availableSlots.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {data.availableSlots.map((s: any) => (
                          <span key={s.code} className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[12px] font-bold">
                            {s.name} {(s.price / 10000).toLocaleString()}만원
                          </span>
                        ))}
                      </div>
                    ) : <Empty text="현재 선택 가능한 착장 슬롯이 없습니다" />}
                  </div>
                  <div>
                    <p className="text-[12.5px] font-extrabold mb-2">온라인 상품</p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.offers.map((o: any) => (
                        <span key={o.code} className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[12px] font-bold">
                          {o.name} {(o.price / 10000).toLocaleString()}만원/월
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === '브랜드 이력' && (
                <div className="space-y-3">
                  {data.primarySponsors ? (
                    <div>
                      <p className="text-[12.5px] font-extrabold mb-2">현재 후원 브랜드</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(Array.isArray(data.primarySponsors) ? data.primarySponsors : Object.values(data.primarySponsors))
                          .map((b: any, i: number) => (
                            <span key={i} className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[12px] font-bold">
                              {typeof b === 'string' ? b : b?.name || '—'}
                            </span>
                          ))}
                      </div>
                    </div>
                  ) : <Empty text="등록된 후원 브랜드 정보가 없습니다" />}
                  {data.blockedCategories?.length > 0 && (
                    <p className="flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-3 text-[12px] text-rose-700 break-keep">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      후원 불가 업종: {data.blockedCategories.join(' · ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-2 pt-4 border-t border-slate-100">
              <Link
                to={`/athletes/${a.id}`}
                className="h-12 inline-flex items-center justify-center rounded-xl border border-slate-200 text-[13.5px] font-bold text-slate-700 hover:bg-slate-50"
              >
                전체 프로필 보기
              </Link>
              <button
                onClick={() => onPick(a.id)}
                className="h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700"
              >
                이 선수 PICK <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[12px] text-slate-500">{label}</p>
      <p className="mt-0.5 text-[15px] font-black text-emerald-600">{value}</p>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[12px] text-slate-500">{k}</dt>
      <dd className="mt-0.5 text-[12.5px] font-bold break-keep">{v}</dd>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="py-8 text-center text-[12.5px] text-slate-500 break-keep">
      {text}
      <span className="block mt-1 text-[12px]">확인되지 않은 정보는 표시하지 않습니다.</span>
    </p>
  );
}
