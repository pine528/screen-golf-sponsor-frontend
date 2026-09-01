/**
 * IU06 브랜드 로그인 — 내 성과보장 현황 (핸드오프 v1.0 §7.3 · §7.4)
 * 기준값·실적값·달성률·측정기간·출처·검증상태를 함께 보여준다.
 * 미수집은 0이 아니라 "집계 중"으로 표시한다.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck2, LineChart, Award, Wallet, Info, ChevronRight, Scale, FileText,
} from 'lucide-react';
import { api } from '../../services/api';
import AboutShell, { Tag, StateNotice, Skeleton, nf } from '../../components/about/AboutShell';

const TONE: Record<string, 'slate' | 'emerald' | 'sky' | 'amber' | 'rose' | 'violet'> = {
  slate: 'slate', emerald: 'emerald', sky: 'sky', amber: 'amber', rose: 'rose', violet: 'violet',
};

export default function MyGuarantees() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getMyGuarantees()
      .then((r) => setData(r.data))
      .catch((e) => setError(e?.response?.data?.error?.message || '현황을 불러오지 못했습니다'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AboutShell current="성과보장프로그램" title="내 성과보장 현황"
      desc="브랜드의 성과보장 계약 현황과 KPI 달성도를 확인하세요.">
      <div className="max-w-[1280px] mx-auto px-5 pb-20">
        {loading ? (
          <div className="mt-8 space-y-4"><Skeleton className="h-[110px] rounded-3xl" /><Skeleton className="h-[320px] rounded-3xl" /></div>
        ) : error ? (
          <div className="mt-10">
            <StateNotice kind="restricted" title="확인할 수 없습니다" desc={error}
              action={<Link to="/login?returnUrl=/about/my-guarantees" className="inline-flex h-11 px-5 rounded-2xl bg-slate-900 text-white text-[14px] font-bold items-center">브랜드 로그인</Link>} />
          </div>
        ) : (
          <>
            {/* 요약 */}
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: FileCheck2, label: '적용 계약', value: data.counts.applied, unit: '건' },
                { icon: LineChart, label: '측정 중', value: data.counts.measuring, unit: '건', accent: true },
                { icon: Award, label: '결과 확정', value: data.counts.finalized, unit: '건' },
              ].map((k) => {
                const I = k.icon;
                return (
                  <div key={k.label} className={`rounded-3xl border bg-white p-5 ${k.accent ? 'border-emerald-300' : 'border-slate-200'}`}>
                    <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                      <I className="w-[18px] h-[18px]" />
                    </span>
                    <p className="text-[12.5px] font-semibold text-slate-500">{k.label}</p>
                    <p className="mt-1 text-[26px] font-extrabold text-slate-900 tabular-nums leading-none">
                      {nf(k.value)}<span className="text-[13px] text-slate-400 ml-1">{k.unit}</span>
                    </p>
                  </div>
                );
              })}
              <div className="rounded-3xl border border-violet-200 bg-violet-50/50 p-5">
                <span className="w-10 h-10 rounded-2xl bg-white text-violet-600 flex items-center justify-center mb-3">
                  <Wallet className="w-[18px] h-[18px]" />
                </span>
                <p className="text-[12.5px] font-semibold text-slate-500">사용 가능 보완지원</p>
                <p className="mt-1 text-[20px] font-extrabold text-violet-700 tabular-nums leading-none">
                  {data.remedySummary.usableCount > 0 ? `${nf(data.remedySummary.usableAmount)}원` : '없음'}
                </p>
                <p className="mt-1.5 text-[11px] text-slate-400">{data.remedySummary.usableCount}건 보유</p>
              </div>
            </div>

            {/* 계약별 현황 */}
            {data.snapshots.length ? (
              <div className="mt-4 space-y-4">
                {data.snapshots.map((s: any) => (
                  <section key={s.id} className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center gap-3">
                      <h2 className="text-[18px] font-extrabold text-slate-900">
                        {s.brandName} <span className="text-slate-300 mx-0.5">×</span> {s.athleteName}
                      </h2>
                      <Tag tone={TONE[s.statusTone] ?? 'slate'}>{s.statusLabel}</Tag>
                      {s.provisional && <Tag tone="amber">잠정 데이터</Tag>}
                      <span className="ml-auto text-[12px] text-slate-400 tabular-nums">
                        측정 {s.measureStart ? new Date(s.measureStart).toLocaleDateString('ko-KR') : '—'}
                        {' ~ '}
                        {s.measureEnd ? new Date(s.measureEnd).toLocaleDateString('ko-KR') : '—'}
                      </span>
                    </div>

                    <div className="grid lg:grid-cols-[1fr_300px]">
                      {/* KPI */}
                      <div className="p-6">
                        <p className="text-[13px] font-bold text-slate-500 mb-3.5">KPI 달성 현황</p>
                        {s.observations.length ? (
                          <div className="grid sm:grid-cols-3 gap-3">
                            {s.observations.map((o: any) => (
                              <div key={o.metricCode} className="rounded-2xl border border-slate-200 p-4">
                                <div className="flex items-center gap-1.5 mb-3">
                                  <p className="text-[13px] font-bold text-slate-800 truncate">{o.label}</p>
                                  {!o.required && <Tag>보조</Tag>}
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                  <div>
                                    <p className="text-[10.5px] text-slate-400">목표</p>
                                    <p className="text-[14px] font-bold text-slate-700 tabular-nums">{nf(o.target)}{o.unit}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10.5px] text-slate-400">{o.provisional ? '잠정 실적' : '실적'}</p>
                                    <p className={`text-[14px] font-bold tabular-nums ${o.actual === null ? 'text-slate-300' : 'text-slate-900'}`}>
                                      {o.actual === null ? '집계 중' : `${nf(o.actual)}${o.unit}`}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10.5px] text-slate-400">달성률</p>
                                    <p className={`text-[14px] font-extrabold tabular-nums ${
                                      o.achievementRate === null ? 'text-slate-300'
                                        : o.achievementRate >= 100 ? 'text-emerald-600' : 'text-slate-700'
                                    }`}>
                                      {o.achievementRate === null ? '—' : `${o.achievementRate}%`}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-400">
                                  <span className="truncate">출처 {o.sourceName ?? '미등록'}</span>
                                  {o.nextCheckAt && (
                                    <span className="tabular-nums shrink-0 ml-2">
                                      다음 검증 {new Date(o.nextCheckAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <StateNotice kind="empty" title="등록된 KPI가 없습니다" />
                        )}

                        {s.provisional && (
                          <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <p className="text-[12px] text-slate-500 leading-relaxed">
                              잠정 실적은 검증 전 데이터로, 최종 확정 시 변경될 수 있습니다.
                              {s.hasPending && ' 일부 지표는 아직 데이터를 수집하는 중입니다.'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 정책 요약 */}
                      <aside className="p-6 lg:border-l border-slate-100 bg-slate-50/40">
                        <p className="text-[13px] font-bold text-slate-500 mb-3.5">성과보장 정책 요약</p>
                        <dl className="space-y-2.5 text-[12.5px]">
                          {[
                            { l: '적용 정책 버전', v: s.policyVersion },
                            { l: '판정 방식', v: s.judgeModeLabel },
                            { l: '보완지원 기준', v: '개별 KPI 기준 미달 시' },
                            { l: '보완지원 형태', v: '차기 후원 지원 (현금 아님)' },
                            { l: '이의제기 기간', v: `결과 확정일로부터 ${s.appealWindowDays}일` },
                          ].map((r) => (
                            <div key={r.l} className="flex items-start justify-between gap-3">
                              <dt className="text-slate-400 shrink-0">{r.l}</dt>
                              <dd className="font-semibold text-slate-800 text-right">{r.v}</dd>
                            </div>
                          ))}
                        </dl>

                        {s.remedies?.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                            <p className="text-[12px] font-bold text-slate-500">보완지원</p>
                            {s.remedies.map((g: any) => (
                              <div key={g.id} className="rounded-2xl bg-white border border-slate-200 px-3.5 py-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[11px] text-slate-400">{g.code}</span>
                                  <Tag tone={g.status === 'ISSUED' ? 'violet' : 'slate'}>{g.statusLabel}</Tag>
                                </div>
                                <p className="mt-1.5 text-[15px] font-extrabold text-violet-700 tabular-nums">
                                  {nf(g.remainAmount)}원
                                </p>
                                {g.validTo && (
                                  <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                                    {new Date(g.validTo).toLocaleDateString('ko-KR')}까지
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 space-y-2">
                          {s.finalizedAt && (
                            <Link to={`/about/my-guarantees/${s.id}/appeal`}
                              className="h-11 rounded-2xl border border-slate-200 bg-white text-[13.5px] font-bold text-slate-700 flex items-center justify-center gap-1.5 hover:border-slate-400 transition">
                              <Scale className="w-4 h-4" /> 이의제기 · 보완지원
                            </Link>
                          )}
                          <Link to="/about/performance-guarantee"
                            className="h-11 rounded-2xl text-[12.5px] font-bold text-slate-500 flex items-center justify-center gap-1 hover:text-slate-900">
                            <FileText className="w-3.5 h-3.5" /> 정책 전문 보기 <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </aside>
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <StateNotice kind="empty" title="성과보장이 적용된 계약이 없습니다"
                  desc={data.emptyGuide}
                  action={
                    <Link to="/sponsor/available" className="inline-flex h-11 px-5 rounded-2xl bg-slate-900 text-white text-[14px] font-bold items-center">
                      적용 상품 보기
                    </Link>
                  } />
              </div>
            )}

            <p className="mt-6 text-[11.5px] text-slate-400">{data.remedySummary.notice}</p>
          </>
        )}
      </div>
    </AboutShell>
  );
}
