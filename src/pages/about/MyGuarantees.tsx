/**
 * IU06 내 성과보장 현황 `/about/my-guarantees` — 시안 2026-09-17 (리디자인/10 · 34)
 *
 *  요약 4(적용 계약 · 측정 중 · 결과 확정 · 사용 가능 보완지원 확인하기)
 *  → 계약 카드: 브랜드 × 선수 · 상태 칩 · 계약 기간(남은 기간) · 계약 상세 보기 · 3점 타임라인(계약 체결 → 측정 실행 중 → 결과 확정)
 *     → KPI 달성 현황 카드(목표 · 잠정 실적 · 달성률 · 데이터 출처 · 다음 검증 예정일) → 잠정 실적 고지
 *  우: 성과보장 정책 요약(정책 버전 · 계약 효력일 · 보장 방식 · 보완지원 기준 · 형태 · 이의제기 기간) · 정책 전문 보기
 *  하단: 최종 리포트 보기 · 이의제기 안내. 미수집은 0이 아니라 "집계 중".
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck2, LineChart, Award, Wallet, Info, ChevronRight, Scale, FileText, Check, Tv, Hash, Heart, BarChart3, Eye, MousePointerClick,
} from 'lucide-react';
import { api } from '../../services/api';
import AboutShell, { Tag, StateNotice, Skeleton, nf, ymd } from '../../components/about/AboutShell';

const KPI_ICON = (label: string) => {
  const s = label.toLowerCase();
  if (/방송|중계|tv/.test(s)) return Tv;
  if (/sns|게시|참여/.test(s)) return Hash;
  if (/영상|조회/.test(s)) return Eye;
  if (/팬|반응/.test(s)) return Heart;
  if (/방문|클릭/.test(s)) return MousePointerClick;
  return BarChart3;
};
const monthsLeft = (end?: string | null) => {
  if (!end) return null;
  const m = Math.ceil((new Date(end).getTime() - Date.now()) / (30 * 86400_000));
  return m > 0 ? `${m}개월 남음` : '측정 종료';
};

export default function MyGuarantees() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [policy, setPolicy] = useState<any>(null);

  useEffect(() => {
    api.getMyGuarantees().then((r) => setData(r.data)).catch((e) => setError(e?.response?.data?.error?.message || '현황을 불러오지 못했습니다')).finally(() => setLoading(false));
    api.getGuaranteePolicyPublic().then((r) => setPolicy(r.data?.policy ?? null)).catch(() => null);
  }, []);

  const first = data?.snapshots?.[0];
  const usable = data?.remedySummary;

  return (
    <AboutShell current="guarantee" crumb={[{ label: '성과보장 프로그램', to: '/about/performance-guarantee' }, { label: '내 성과보장 현황' }]}
      title="내 성과보장 현황" desc="브랜드의 성과보장 계약 현황과 KPI 달성도를 확인하세요.">
      <div className="max-w-[1280px] mx-auto px-5 pb-20">
        {loading ? (
          <div className="mt-8 space-y-4"><Skeleton className="h-[110px] rounded-3xl" /><Skeleton className="h-[360px] rounded-3xl" /></div>
        ) : error ? (
          <div className="mt-10"><StateNotice kind="restricted" title="확인할 수 없습니다" desc={error} action={<Link to="/login?returnUrl=/about/my-guarantees" className="inline-flex h-11 px-5 rounded-2xl bg-slate-900 text-white text-[14px] font-bold items-center">브랜드 로그인</Link>} /></div>
        ) : (
          <>
            {/* 요약 4 */}
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: FileCheck2, label: '적용 계약', value: data.counts.applied, unit: '' },
                { icon: LineChart, label: '측정 중', value: data.counts.measuring, unit: '', accent: true },
                { icon: Award, label: '결과 확정', value: data.counts.finalized, unit: '' },
              ].map((k) => { const I = k.icon; return (
                <div key={k.label} className={`rounded-3xl border bg-white p-5 flex items-center gap-4 ${k.accent ? 'border-emerald-400 ring-1 ring-emerald-100' : 'border-slate-200'}`}>
                  <span className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><I className="w-6 h-6" /></span>
                  <div><p className="text-[13px] font-semibold text-slate-600">{k.label}</p><p className="mt-0.5 text-[30px] font-black text-slate-900 tabular-nums leading-none">{nf(k.value)}</p></div>
                </div>
              ); })}
              <a href="#remedy" className="rounded-3xl border border-slate-200 bg-white p-5 flex items-center gap-4 hover:border-emerald-300">
                <span className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Wallet className="w-6 h-6" /></span>
                <div><p className="text-[13px] font-semibold text-slate-600">사용 가능 보완지원</p><p className="mt-0.5 text-[20px] font-black text-emerald-700 inline-flex items-center gap-1">{usable.usableCount > 0 ? `${nf(usable.usableAmount)}원` : '확인하기'} <ChevronRight className="w-4 h-4" /></p></div>
              </a>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
              <div className="space-y-4">
                {data.snapshots.length ? data.snapshots.map((s: any) => {
                  const finalized = !!s.finalizedAt;
                  const measuring = ['ACTIVE', 'MEASURING', 'DATA_PENDING'].includes(s.status);
                  const nodes = [
                    { label: '계약 체결', date: ymd(s.createdAt ?? s.measureStart), done: true },
                    { label: measuring ? '측정 실행 중' : finalized ? '측정 완료' : '측정 예정', date: `${ymd(s.measureStart)} ~ ${ymd(s.measureEnd)}`, done: true, current: measuring },
                    { label: '결과 확정', date: finalized ? ymd(s.finalizedAt) : `${ymd(s.measureEnd)} 이후 (예정)`, done: finalized, current: finalized },
                  ];
                  return (
                    <section key={s.id} className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-[20px] font-extrabold text-slate-900">{s.brandName} <span className="text-slate-300 mx-0.5">×</span> {s.athleteName} 프로</h2>
                        <span className={`px-2.5 py-1 rounded-md text-[11.5px] font-extrabold uppercase ${s.statusTone === 'emerald' ? 'bg-emerald-600 text-white' : s.statusTone === 'rose' ? 'bg-rose-500 text-white' : 'bg-sky-600 text-white'}`}>{s.status}</span>
                        {s.provisional && <Tag tone="amber">잠정 데이터</Tag>}
                        <Link to="/contracts" className="ml-auto h-9 px-3.5 rounded-lg border border-slate-200 text-[12.5px] font-bold text-slate-700 inline-flex items-center gap-1 hover:border-slate-400">계약 상세 보기 <ChevronRight className="w-3.5 h-3.5" /></Link>
                      </div>
                      <p className="mt-1.5 text-[12.5px] text-slate-500 tabular-nums">계약 기간 <b className="text-slate-700">{ymd(s.measureStart)} ~ {ymd(s.measureEnd)}</b>{monthsLeft(s.measureEnd) && <span className="ml-2 text-emerald-700 font-bold">({monthsLeft(s.measureEnd)})</span>}</p>

                      {/* 3점 타임라인 */}
                      <ol className="mt-5 relative grid grid-cols-3">
                        <span aria-hidden className="absolute left-[16%] right-[16%] top-[9px] h-[3px] bg-slate-200 rounded-full" />
                        <span aria-hidden className="absolute left-[16%] top-[9px] h-[3px] bg-emerald-600 rounded-full" style={{ width: finalized ? '68%' : measuring ? '34%' : '0%' }} />
                        {nodes.map((n) => (
                          <li key={n.label} className="relative text-center">
                            <span className={`mx-auto w-5 h-5 rounded-full flex items-center justify-center border-2 ${n.done ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300'} ${n.current ? 'ring-4 ring-emerald-100' : ''}`}>{n.done && !n.current && <Check className="w-3 h-3" strokeWidth={3} />}</span>
                            <p className={`mt-2 text-[12.5px] font-bold ${n.current ? 'text-emerald-700' : 'text-slate-700'}`}>{n.label}</p>
                            <p className="text-[11px] text-slate-500 tabular-nums">{n.date}</p>
                          </li>
                        ))}
                      </ol>

                      {/* KPI */}
                      <p className="mt-6 text-[14px] font-extrabold text-slate-900 mb-3">KPI 달성 현황</p>
                      {s.observations.length ? (
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                          {s.observations.map((o: any) => { const I = KPI_ICON(o.label); const rate = o.achievementRate; return (
                            <div key={o.metricCode} className="rounded-2xl border border-slate-200 p-4">
                              <div className="flex items-center gap-2 mb-3"><span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><I className="w-4 h-4" /></span><p className="text-[13.5px] font-bold text-slate-800 truncate">{o.label}</p>{!o.required && <Tag>보조</Tag>}<Info className="w-3.5 h-3.5 text-slate-300 ml-auto" /></div>
                              <div className="grid grid-cols-3 gap-2">
                                <div><p className="text-[11.5px] text-slate-500">목표</p><p className="text-[15px] font-bold text-slate-700 tabular-nums">{nf(o.target)}{o.unit}</p></div>
                                <div><p className="text-[11.5px] text-slate-500">{o.provisional ? '잠정 실적' : '실적'}</p><p className={`text-[15px] font-bold tabular-nums ${o.actual === null ? 'text-sky-600' : 'text-slate-900'}`}>{o.actual === null ? '집계 중' : `${nf(o.actual)}${o.unit}`}</p></div>
                                <div><p className="text-[11.5px] text-slate-500">달성률</p><p className={`text-[17px] font-black tabular-nums ${rate === null ? 'text-slate-300' : rate >= 100 ? 'text-emerald-600' : 'text-emerald-700'}`}>{rate === null ? '-' : `${rate}%`}</p></div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11.5px]">
                                <div><p className="text-slate-500">데이터 출처</p><p className="font-bold text-slate-700 truncate">{o.sourceName ?? '미등록'}</p></div>
                                <div><p className="text-slate-500">다음 검증 예정일</p><p className="font-bold text-slate-700 tabular-nums">{o.nextCheckAt ? ymd(o.nextCheckAt) : '—'}</p></div>
                              </div>
                            </div>
                          ); })}
                        </div>
                      ) : <StateNotice kind="empty" title="등록된 KPI가 없습니다" />}
                      {(s.provisional || s.hasPending) && (
                        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 flex items-start gap-2.5"><Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" /><p className="text-[12.5px] text-slate-600 leading-relaxed break-keep">잠정 실적은 검증 전 데이터로, 최종 확정 시 변경될 수 있습니다.{s.hasPending && ' 일부 지표는 아직 데이터를 수집하는 중입니다.'}</p></div>
                      )}

                      {/* 보완지원 · 이의제기 */}
                      {(s.remedies?.length > 0 || finalized) && (
                        <div id="remedy" className="mt-4 flex flex-wrap items-center gap-2">
                          {s.remedies?.map((g: any) => (
                            <span key={g.id} className="rounded-xl border border-violet-200 bg-violet-50/60 px-3.5 py-2 text-[12.5px] inline-flex items-center gap-2"><span className="font-mono text-slate-500">{g.code}</span><Tag tone={g.status === 'ISSUED' ? 'violet' : 'slate'}>{g.statusLabel}</Tag><b className="text-violet-700 tabular-nums">{nf(g.remainAmount)}원</b>{g.validTo && <span className="text-slate-500 tabular-nums">{ymd(g.validTo)}까지</span>}</span>
                          ))}
                          {finalized && <Link to={`/about/my-guarantees/${s.id}/appeal`} className="ml-auto h-10 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 inline-flex items-center gap-1.5 hover:border-slate-400"><Scale className="w-4 h-4" /> 이의제기 · 보완지원</Link>}
                        </div>
                      )}
                    </section>
                  );
                }) : (
                  <StateNotice kind="empty" title="성과보장이 적용된 계약이 없습니다" desc={data.emptyGuide} action={<Link to="/sponsor/available?guarantee=1" className="inline-flex h-11 px-5 rounded-2xl bg-slate-900 text-white text-[14px] font-bold items-center">적용 상품 보기</Link>} />
                )}
              </div>

              {/* 정책 요약 */}
              <aside className="rounded-3xl border border-slate-200 bg-white p-5 lg:sticky lg:top-20">
                <p className="text-[16px] font-extrabold text-slate-900 mb-3">성과보장 정책 요약</p>
                <dl className="divide-y divide-slate-100 text-[13px]">
                  {[
                    { l: '적용 정책 버전', v: first?.policyVersion ?? policy?.version ?? '—', accent: true },
                    { l: '계약 효력일', v: first ? ymd(first.createdAt ?? first.measureStart) : '—' },
                    { l: '보장 방식', v: first ? `KPI ${first.judgeModeLabel}` : policy ? `KPI ${policy.judgeMode === 'ALL' ? '모든 필수 충족' : policy.judgeMode === 'ANY' ? '하나 충족' : '가중 합산'}` : '—' },
                    { l: '보완지원 기준', v: '개별 KPI 기준 미달 시' },
                    { l: '보완지원 형태', v: '차기 후원 지원 (현금 아님)' },
                    { l: '이의제기 기간', v: `결과 확정일로부터 ${first?.appealWindowDays ?? policy?.appealWindowDays ?? '—'}일` },
                  ].map((r) => (
                    <div key={r.l} className="flex items-start justify-between gap-3 py-3"><dt className="text-slate-500 shrink-0">{r.l}</dt><dd className={`font-bold text-right ${r.accent ? 'text-emerald-700' : 'text-slate-800'}`}>{r.v}</dd></div>
                  ))}
                </dl>
                <Link to="/about/performance-guarantee" className="mt-3 h-11 w-full rounded-xl border border-slate-200 text-[13px] font-bold text-slate-700 inline-flex items-center justify-center gap-1.5 hover:border-slate-400"><FileText className="w-4 h-4" /> 정책 전문 보기 <ChevronRight className="w-3.5 h-3.5" /></Link>
              </aside>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {first?.finalizedAt
                ? <Link to={`/about/my-guarantees/${first.id}/appeal`} className="h-12 px-6 rounded-xl bg-emerald-700 text-white text-[14.5px] font-extrabold inline-flex items-center gap-2 hover:bg-emerald-800"><FileText className="w-4 h-4" /> 최종 리포트 보기</Link>
                : <span className="h-12 px-6 rounded-xl bg-slate-100 text-slate-400 text-[14.5px] font-extrabold inline-flex items-center gap-2 cursor-not-allowed" title="측정이 끝나고 결과가 확정되면 제공됩니다"><FileText className="w-4 h-4" /> 최종 리포트 보기 <span className="text-[11px]">(확정 후)</span></span>}
              <Link to="/about/performance-guarantee#faq" className="h-12 px-6 rounded-xl border border-emerald-300 text-emerald-700 text-[14.5px] font-bold inline-flex items-center gap-2 hover:bg-emerald-50"><Scale className="w-4 h-4" /> 이의제기 안내</Link>
            </div>
            <p className="mt-5 text-center text-[12.5px] text-slate-500">{usable.notice}</p>
          </>
        )}
      </div>
    </AboutShell>
  );
}
