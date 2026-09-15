/**
 * 공통 QuickProfile — 선수 메뉴 핸드오프 v1.0 §8.1 (시안 2026-09-14 선수정보 레이어)
 *
 * Search / Match / Compare / Favorites / 직접 PICK 어디서든 "선수정보"는 이 컴포넌트를 쓴다 (화면별 복제 금지).
 * Header(사진·이름·칩·하트) → Top Metrics(팬온도·SPONPIK 인덱스·최근 5경기 평균 순위)
 * → Tabs(요약/대회 성과/활동/후원 가능 슬롯/브랜드 협업 이력) → Bottom CTA(전체 프로필 보기 / 이 선수 PICK)
 * 모바일은 하단 시트(fullscreen). ESC·바깥 클릭으로 닫힘, 닫히면 호출 화면 상태는 그대로.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Heart, Info, Loader2, Trophy, X } from 'lucide-react';
import { api } from '../../services/api';
import { FAN_TEMP_NOTE } from '../fanhub/FanKit';
import { ErrorState } from '../ui/StateView';
import { ACTIVITY_LABELS } from './AthleteCard';

const TABS = ['요약', '대회 성과', '활동', '후원 가능 슬롯', '브랜드 협업 이력'] as const;

export default function QuickProfile({ athleteId, fav, onFav, onClose, onPick }: {
  athleteId: string; fav: boolean; onFav: () => void; onClose: () => void; onPick: (id: string) => void;
}) {
  const [data, setData] = useState<any>(null);
  const [roi, setRoi] = useState<any>(null);
  const [err, setErr] = useState<any>(null);
  const [tab, setTab] = useState<string>(TABS[0]);

  const load = () => {
    setErr(null);
    api.getQuickProfile(athleteId).then((r: any) => setData(r?.data || null)).catch((e) => setErr(e));
    api.getPublicAthleteRoiDashboard(athleteId).then((r: any) => setRoi(r?.data || null)).catch(() => setRoi(null));
  };
  useEffect(() => { setData(null); setRoi(null); setTab(TABS[0]); load(); }, [athleteId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const temp = data?.fanTemp > 0 ? Number(data.fanTemp) : null;
  const index: number | null = roi?.summary?.basicScore ?? roi?.summary?.score ?? null;
  const axes = [
    { label: '경기력', value: roi?.athletePerformance?.score ?? null },
    { label: '팬반응', value: roi?.fandom?.score ?? null },
    { label: '콘텐츠성', value: roi?.contentEngagement?.score ?? null },
    { label: '브랜드 적합도', value: roi?.mediaExposure?.score ?? null },
    { label: '활동성', value: roi?.activity?.score ?? (activities.length ? Math.min(100, activities.length * 20) : null) },
  ];

  const profileLine = a ? [
    a.debutYear ? `${a.debutYear}년 프로입회` : null,
    a.tourQualification || null,
    a.affiliation ? `${a.affiliation} 소속` : null,
    a.region ? `활동지역 ${a.region}` : null,
  ].filter(Boolean).join(' · ') : '';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/45 p-0 sm:p-6" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label="선수정보"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-[760px] max-h-[94vh] sm:max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6"
      >
        {err ? (
          <ErrorState error={err} title="선수 정보를 불러오지 못했습니다" onRetry={load} />
        ) : !data ? (
          <div className="py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
        ) : (
          <>
            <div className="grid sm:grid-cols-[200px_minmax(0,1fr)] gap-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-[4/4.4] sm:aspect-auto sm:h-[220px]">
                {a.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                {a.isRecommended && <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[11px] font-extrabold">추천 선수</span>}
              </div>
              <div className="min-w-0">
                <div className="flex items-start gap-2">
                  <p className="text-[24px] sm:text-[28px] font-extrabold leading-tight">{a.name} <span className="text-[15px] font-bold text-emerald-600">프로</span></p>
                  <button onClick={onFav} aria-pressed={fav} aria-label="관심 선수" className={`mt-1 w-9 h-9 rounded-full inline-flex items-center justify-center ${fav ? 'text-rose-500' : 'text-emerald-500 hover:text-rose-400'}`}>
                    <Heart className={`w-5 h-5 ${fav ? 'fill-current' : ''}`} />
                  </button>
                  <button onClick={onClose} aria-label="닫기" className="ml-auto shrink-0 w-9 h-9 rounded-full inline-flex items-center justify-center text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[a.tour, a.tourQualification, a.region?.split(' ')[0]].filter(Boolean).map((t: string) => (
                    <span key={t} className="px-2.5 py-1 rounded-full border border-slate-200 bg-white text-[12px] font-bold text-slate-700">{t}</span>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Stat icon={<Flame className="w-4 h-4 text-emerald-600" />} label="팬온도" value={temp !== null ? `${temp.toFixed(1)}℃` : null} pct={temp !== null ? Math.min(100, temp) : null} note={FAN_TEMP_NOTE} />
                  <Stat icon={<Trophy className="w-4 h-4 text-emerald-600" />} label="스폰픽 인덱스" value={index != null ? String(Math.round(index)) : null} pct={index != null ? Math.min(100, index) : null} />
                  <Stat icon={<Trophy className="w-4 h-4 text-emerald-600" />} label="최근 5경기 평균 순위" value={data.recentAvgRank != null ? `평균 ${data.recentAvgRank}위` : null} pct={data.recentAvgRank != null ? Math.max(8, 100 - data.recentAvgRank * 2) : null} />
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-1 border-b border-slate-100 overflow-x-auto" role="tablist">
              {TABS.map((t) => (
                <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-3.5 py-2.5 text-[13.5px] font-bold border-b-2 whitespace-nowrap transition-colors ${tab === t ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t}</button>
              ))}
            </div>

            <div className="mt-4 min-h-[220px]">
              {tab === '요약' && (
                <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-3">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-[14px] font-extrabold inline-flex items-center gap-1.5">스폰픽 인덱스 요약 <Info className="w-3.5 h-3.5 text-slate-400" aria-label="경기력·팬반응·콘텐츠성·브랜드 적합도·활동성 5축. 측정된 축만 표시합니다." /></p>
                    <Radar axes={axes} />
                    {axes.every((x) => x.value == null) && <p className="text-center text-[12.5px] text-slate-500">지수 집계 중</p>}
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-[14px] font-extrabold">프로필 요약</p>
                    <p className="mt-2 text-[13px] text-slate-600 leading-relaxed break-keep">{profileLine || a.bio || '등록된 소개가 없습니다.'}</p>
                    <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Field k="신장" v={a.height ? `${a.height}cm` : null} />
                      <Field k="프로입회" v={a.debutYear ? String(a.debutYear) : null} />
                      <Field k="활동지역" v={a.region?.split(' ')[0] || null} />
                      <Field k="소속" v={a.affiliation || null} />
                    </dl>
                    {(a.highlights as string[] | null)?.length ? (
                      <ul className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                        {(a.highlights as string[]).slice(0, 4).map((h) => (
                          <li key={h} className="flex items-start gap-2 text-[12.5px] text-slate-700 break-keep">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" /> {h}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              )}

              {tab === '대회 성과' && (
                data.allResults?.length ? (
                  <table className="w-full text-[13px]">
                    <thead><tr className="text-slate-500 text-left border-b border-slate-100"><th className="py-2 font-bold">대회명</th><th className="py-2 font-bold w-24">일자</th><th className="py-2 font-bold w-16 text-right">순위</th></tr></thead>
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
                    {activities.map((t) => <span key={t} className="px-3.5 py-2 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-700">{t}</span>)}
                  </div>
                ) : <Empty text="등록된 활동 정보가 아직 없습니다" />
              )}

              {tab === '후원 가능 슬롯' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[13px] font-extrabold mb-2">착장 슬롯 {data.slotOpen}/{data.slotTotal}</p>
                    {data.availableSlots?.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {data.availableSlots.map((s: any) => (
                          <span key={s.code} className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[12.5px] font-bold">{s.name} {(s.price / 10000).toLocaleString()}만원</span>
                        ))}
                      </div>
                    ) : <Empty text="현재 선택 가능한 착장 슬롯이 없습니다" />}
                  </div>
                  {data.offers?.length > 0 && (
                    <div>
                      <p className="text-[13px] font-extrabold mb-2">온라인 상품</p>
                      <div className="flex flex-wrap gap-1.5">
                        {data.offers.map((o: any) => <span key={o.code} className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-[12.5px] font-bold">{o.name} {(o.price / 10000).toLocaleString()}만원/월</span>)}
                      </div>
                    </div>
                  )}
                  <Link to={`/sponsor/direct/build/${a.id}`} className="inline-flex items-center gap-1 text-[13px] font-bold text-emerald-700 hover:underline">후원 슬롯 자세히 보기 <ArrowRight className="w-3.5 h-3.5" /></Link>
                </div>
              )}

              {tab === '브랜드 협업 이력' && (
                <div className="space-y-3">
                  {data.primarySponsors ? (
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(data.primarySponsors) ? data.primarySponsors : Object.values(data.primarySponsors)).map((b: any, i: number) => (
                        <span key={i} className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-[12.5px] font-bold">{typeof b === 'string' ? b : b?.name || '—'}</span>
                      ))}
                    </div>
                  ) : <Empty text="등록된 협업 브랜드 정보가 없습니다" />}
                  {data.blockedCategories?.length > 0 && (
                    <p className="flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-3 text-[12.5px] text-rose-700 break-keep">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" /> 후원 불가 업종: {data.blockedCategories.join(' · ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-2 pt-4 border-t border-slate-100">
              <Link to={`/athletes/${a.id}`} className="h-12 inline-flex items-center justify-center rounded-xl border-2 border-emerald-600 text-[14px] font-bold text-emerald-700 hover:bg-emerald-50">전체 프로필 보기</Link>
              <button onClick={() => onPick(a.id)} className="h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700">이 선수 PICK <ArrowRight className="w-4 h-4" /></button>
            </div>
            <p className="mt-2 text-right text-[11.5px] text-slate-500">{data.verifiedAt ? `${new Date(data.verifiedAt).toLocaleDateString('ko-KR')} 기준` : ''}</p>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, pct, note }: { icon: React.ReactNode; label: string; value: string | null; pct: number | null; note?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3" title={note}>
      <p className="text-[12px] text-slate-500 truncate">{label}</p>
      <p className="mt-1 inline-flex items-center gap-1.5 text-[18px] font-extrabold text-emerald-700 tabular-nums">
        {icon} {value ?? <span className="text-[13px] font-bold text-slate-500">집계 중</span>}
      </p>
      <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        {pct != null && <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />}
      </div>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string | null }) {
  return (
    <div>
      <dt className="text-[11.5px] text-slate-500">{k}</dt>
      <dd className="mt-0.5 text-[13px] font-bold break-keep">{v ?? <span className="text-slate-500 font-semibold">—</span>}</dd>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="py-8 text-center text-[13px] text-slate-500 break-keep">
      {text}
      <span className="block mt-1 text-[12px]">확인되지 않은 정보는 표시하지 않습니다.</span>
    </p>
  );
}

/** 5축 레이더 — 측정된 축만 그리고, 없으면 축 이름만 둔다. 값 텍스트 대체는 aria-label로 제공 (§13) */
export function Radar({ axes, size = 220, showValues = false }: { axes: { label: string; value: number | null }[]; size?: number; showValues?: boolean }) {
  const c = size / 2, r = size * 0.355;
  const pt = (i: number, rr: number) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length;
    return [c + rr * Math.cos(ang), c + rr * Math.sin(ang)];
  };
  const ring = (rr: number) => axes.map((_, i) => pt(i, rr).join(',')).join(' ');
  const measured = axes.some((x) => x.value != null);
  const poly = axes.map((x, i) => pt(i, ((x.value ?? 0) / 100) * r).join(',')).join(' ');
  const label = axes.map((x) => `${x.label} ${x.value != null ? Math.round(x.value) : '집계 중'}`).join(', ');
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[240px] mx-auto mt-1" role="img" aria-label={`스폰픽 인덱스 5축: ${label}`}>
      {[0.25, 0.5, 0.75, 1].map((k) => <polygon key={k} points={ring(r * k)} fill="none" stroke="#e2e8f0" strokeWidth="1" />)}
      {axes.map((_, i) => { const [x, y] = pt(i, r); return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />; })}
      {measured && <polygon points={poly} fill="rgba(16,185,129,0.25)" stroke="#10b981" strokeWidth="2" />}
      {measured && axes.map((x, i) => { if (x.value == null) return null; const [px, py] = pt(i, (x.value / 100) * r); return <circle key={i} cx={px} cy={py} r="3.5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />; })}
      {axes.map((x, i) => { const [lx, ly] = pt(i, r + 22); return <text key={x.label} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill="#334155">{x.label}{showValues && x.value != null ? ` ${Math.round(x.value)}` : ''}</text>; })}
    </svg>
  );
}
