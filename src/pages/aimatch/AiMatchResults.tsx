/**
 * AI 추천 결과 (/ai-match/:requestId) · 핸드오프 v1.0 §6.2
 *
 * 조건 요약 바 + TOP 3 추천 카드(적합도 게이지·이유·실데이터 지표·비교 추가)
 * + 추천 후원 방식 3종 + AI 매칭 인사이트 + 한눈에 비교 테이블.
 * 예상 성과류 수치는 지어내지 않는다 — 실데이터(팔로워·관심·슬롯·가격)만 표기.
 */
import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Check,
  Gavel,
  Lightbulb,
  Pencil,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import Breadcrumb from '../../components/Breadcrumb';
import { api } from '../../services/api';
import { BRAND_TYPES, GOALS, METHODS, labelOf } from './AiMatch';

export const METHOD_LABEL: Record<string, string> = {
  AUCTION: '라이브 경매',
  DIRECT: '직접 구매',
  MONTHLY: '월간 계약',
  YEARLY: '연간 계약',
  AI_RECOMMEND: 'AI 추천',
};
export const CONFIDENCE_LABEL: Record<string, string> = { HIGH: '높음', MEDIUM: '보통', LOW: '수집 중' };

export function useAiMatchRequest(requestId?: string) {
  const location = useLocation();
  const preloaded = (location.state as any)?.result;
  const q = useQuery({
    queryKey: ['ai-match', requestId],
    queryFn: () => api.aiMatchGet(requestId!),
    enabled: !!requestId && !preloaded,
    staleTime: 5 * 60_000,
  });
  return { data: preloaded || (q.data as any)?.data, isLoading: !preloaded && q.isLoading, isError: q.isError };
}

/** 원형 적합도 게이지 */
export function ScoreGauge({ score, size = 72 }: { score: number; size?: number }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth="7" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#059669" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * c} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black text-slate-900 tabular-nums" style={{ fontSize: size / 3.4 }}>{score}</span>
        <span className="text-[8px] font-bold text-slate-400">매칭 적합도</span>
      </div>
    </div>
  );
}

export default function AiMatchResults() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useAiMatchRequest(requestId);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  const recs: any[] = data?.recommendations || [];
  const top3 = recs.slice(0, 3);
  const input = data?.input;

  const toggleCompare = (id: string) => {
    const next = new Set(compareIds);
    if (next.has(id)) next.delete(id);
    else if (next.size < 3) next.add(id);
    setCompareIds(next);
  };

  const insights = useMemo(() => {
    const out: { title: string; desc: string }[] = [];
    if (top3[0]) out.push({ title: '브랜드 목표 기준 적합도 높음', desc: `선택하신 목표에 최적화된 선수를 우선 추천했어요. 1위 ${top3[0].name} 프로의 적합도는 ${top3[0].matchScore}점입니다.` });
    const withSns = top3.filter((r) => r.metrics?.followers);
    if (withSns.length) out.push({ title: 'SNS 지표 반영', desc: `${withSns.map((r) => r.name).join('·')} 프로는 실제 SNS 팔로워 데이터가 확인된 선수입니다.` });
    const withStore = top3.filter((r) => r.metrics?.growthMarketBrands?.length);
    if (withStore.length) out.push({ title: '팬스토어 연계 가능', desc: `${withStore.map((r) => r.name).join('·')} 프로는 성장마켓 팬스토어를 운영 중이라 판매 연계에 유리해요.` });
    return out;
  }, [top3]);

  if (isLoading) {
    return (
      <Shell>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-24 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-700">최적 조합을 분석 중입니다…</p>
        </div>
      </Shell>
    );
  }
  if (isError || !data) {
    return (
      <Shell>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-24 text-center">
          <p className="text-sm text-slate-500 mb-4">추천 결과를 불러오지 못했습니다.</p>
          <Link to="/ai-match" className="inline-flex h-10 px-5 items-center rounded-xl bg-emerald-600 text-white text-sm font-bold">다시 시도하기</Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* 헤더 + 조건 요약 바 */}
      <section className="px-5 sm:px-8 pt-2 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center"><Sparkles className="w-5 h-5" /></span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">AI <span className="text-emerald-600">추천 결과</span></h1>
          </div>
          <p className="text-sm text-slate-500 mb-4">브랜드 목표와 예산에 맞춰 가장 적합한 선수와 후원 방식을 추천했어요.</p>

          <div className="rounded-2xl border border-slate-200 px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Cond label="브랜드 유형" value={labelOf(BRAND_TYPES, input?.brandType)} />
            <Cond label="목적" value={(input?.goals || []).map((g: string) => labelOf(GOALS, g)).join(' · ')} />
            <Cond label="방식" value={labelOf(METHODS, input?.preferredMethod)} />
            <Cond label="예산" value={input ? `${Math.round(input.budget.min / 10000)}~${Math.round(input.budget.max / 10000)}만원` : '-'} />
            <button
              onClick={() => navigate('/ai-match')}
              className="ml-auto inline-flex items-center gap-1 px-3 h-8 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50"
            >
              <Pencil className="w-3 h-3" /> 조건 수정
            </button>
          </div>

          {/* 선호선수 미포함 사유 (§3.3) */}
          {(data.excludedPreferred || []).length > 0 && (
            <div className="mt-3 rounded-xl bg-amber-50/70 border border-amber-100 px-4 py-2.5 text-[12px] text-slate-600">
              {data.excludedPreferred.map((e: any) => (
                <div key={e.athleteId}>선호 선수 <b>{e.name}</b> 프로는 추천에서 제외됐어요 — {e.reason}.</div>
              ))}
            </div>
          )}
        </div>
      </section>

      {recs.length === 0 ? (
        <section className="px-5 sm:px-8 pb-16">
          <div className="max-w-7xl mx-auto rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center">
            <p className="text-sm font-bold text-slate-700 mb-1">현재 조건에 맞는 선수가 없습니다.</p>
            <p className="text-[12px] text-slate-500 mb-5">예산 범위를 넓히거나 선호 방식을 'AI 추천에 맡기기'로 바꿔보세요.</p>
            <Link to="/ai-match" className="inline-flex h-10 px-5 items-center rounded-xl bg-emerald-600 text-white text-sm font-bold">조건 완화하기</Link>
          </div>
        </section>
      ) : (
        <>
          {/* TOP 3 + 인사이트 */}
          <section className="px-5 sm:px-8 pb-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,280px)] gap-5 items-start">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 mb-4">
                  <span className="underline decoration-emerald-400 decoration-2 underline-offset-4">TOP {top3.length}</span> 추천 선수
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {top3.map((r, i) => (
                    <div key={r.athleteId} className="relative rounded-2xl border border-slate-200 bg-white p-4 flex flex-col hover:border-emerald-300 transition-colors">
                      <span className="absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full bg-emerald-600 text-white text-[13px] font-black flex items-center justify-center tabular-nums shadow">{i + 1}</span>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-[88px] aspect-[4/5] rounded-xl overflow-hidden bg-slate-100 shrink-0">
                          {r.profileImageUrl && <img src={r.profileImageUrl} alt={r.name} className="w-full h-full object-cover object-top" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[15px] font-extrabold text-slate-900 mb-0.5">{r.name} 프로</div>
                          <div className="text-[11px] text-slate-400 mb-2">{r.tour}</div>
                          <div className="flex flex-wrap gap-1">
                            {r.roleLabel && (
                              <span className="inline-flex px-2 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold">{r.roleLabel}</span>
                            )}
                            <span className="inline-flex px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                              {METHOD_LABEL[r.package?.method] || r.package?.method}
                            </span>
                          </div>
                        </div>
                        <ScoreGauge score={r.matchScore} size={64} />
                      </div>

                      <ul className="space-y-1 mb-3">
                        {(r.reasons || []).map((rs: any) => (
                          <li key={rs.code} className="flex items-start gap-1.5 text-[11px] text-slate-600 break-keep">
                            <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" /> {rs.text}
                          </li>
                        ))}
                      </ul>

                      <dl className="text-[11px] space-y-1 mb-3 mt-auto">
                        <MetricRow label="추천 예산" value={`${r.package?.priceConfirmed?.toLocaleString()}원~`} strong />
                        <MetricRow label="가용 슬롯" value={`${r.metrics?.availableSlots}개`} />
                        <MetricRow label="SNS 팔로워" value={r.metrics?.followers ? `${r.metrics.followers.toLocaleString()}명` : '데이터 준비 중'} />
                        <MetricRow label="팬 관심 등록" value={`${r.metrics?.favoriteCount ?? 0}명`} />
                        <MetricRow
                          label="데이터 신뢰도"
                          value={`${CONFIDENCE_LABEL[r.confidence] || r.confidence}${typeof r.confidenceValue === 'number' ? ` ${Math.round(r.confidenceValue * 100)}%` : ''}`}
                        />
                      </dl>

                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          to={`/ai-match/${requestId}/proposal/${r.athleteId}`}
                          className="h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50"
                        >
                          상세 보기
                        </Link>
                        <button
                          onClick={() => toggleCompare(r.athleteId)}
                          className={`h-9 inline-flex items-center justify-center gap-1 rounded-lg text-[12px] font-bold ${
                            compareIds.has(r.athleteId) ? 'bg-emerald-600 text-white' : 'border border-emerald-600 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {compareIds.has(r.athleteId) ? <><Check className="w-3.5 h-3.5" /> 담김</> : '비교 추가 +'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 추천 후원 방식 */}
                <h2 className="text-lg font-extrabold text-slate-900 mt-8 mb-4">추천 후원 방식</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MethodCard icon={Gavel} title="라이브 경매 추천" desc="경쟁 입찰을 통해 최적의 조건으로 선수와 계약할 수 있어요." cta="라이브 경매 보러가기" to="/auctions" solid />
                  <MethodCard icon={ShoppingBag} title="직접 구매 추천" desc="선수와 직접 합의하며 빠르고 안정적인 계약이 가능해요." cta="스폰서십 슬롯 보기" to="/slots" />
                  <MethodCard icon={Store} title="팬스토어 연계 추천" desc="선수 팬스토어와 연계해 제품 공동판매와 브랜드 경험을 확장할 수 있어요." cta="성장마켓 보기" to="/growth-market" />
                </div>
              </div>

              {/* 인사이트 사이드바 */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-[14px] font-extrabold text-slate-900 mb-3">AI 매칭 인사이트</h3>
                  <div className="space-y-3.5">
                    {insights.map((it) => (
                      <div key={it.title} className="flex items-start gap-2.5">
                        <span className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                          <Lightbulb className="w-4 h-4 text-emerald-600" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[12px] font-bold text-slate-900 break-keep">{it.title}</div>
                          <p className="text-[11px] text-slate-500 break-keep leading-relaxed">{it.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {top3[0] && (
                  <div className="rounded-2xl border border-slate-200 p-5 text-center">
                    <h3 className="text-[14px] font-extrabold text-slate-900 mb-3 text-left">목표 적합도</h3>
                    <div className="inline-block"><ScoreGauge score={top3[0].matchScore} size={116} /></div>
                    <div className="mt-3 rounded-xl bg-emerald-50/70 border border-emerald-100 px-3 py-2.5 text-left flex items-start gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-slate-600 break-keep">
                        <b>TIP</b> 조건을 세부 조정하면 더 정확한 매칭 결과를 확인할 수 있어요.
                        <button onClick={() => navigate('/ai-match')} className="block mt-1 font-bold text-emerald-700">조건 수정하기 ›</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 조사 소스 상태 (SIE §15.2 — 미연동 소스 정직 표기) */}
                {data.sourceStatus && (
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <h3 className="text-[13px] font-extrabold text-slate-900 mb-2.5">조사 소스</h3>
                    <ul className="space-y-1.5 text-[11px]">
                      <SourceRow label="SPONPIK 선수·슬롯·계약 데이터" ok />
                      <SourceRow label="SPONPIK 팬·대회 성적 데이터" ok />
                      <SourceRow label="뉴스·YouTube 공개 자료" ok={false} note="연동 예정" />
                      <SourceRow label="Instagram 선수 계정 연동" ok={false} note="선수 동의 시" />
                    </ul>
                  </div>
                )}
                <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-[10px] text-slate-400 break-keep">
                  기준일 {data.dataAsOf ? new Date(data.dataAsOf).toLocaleDateString('ko-KR') : '-'} · 규칙 {data.ruleVersion} · 후보 {data.candidateCount}명 중 상위 추천
                </div>
              </div>
            </div>
          </section>

          {/* 한눈에 비교 */}
          <section className="px-5 sm:px-8 pb-16">
            <div className="max-w-7xl mx-auto rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between">
                <h2 className="text-[15px] font-extrabold text-slate-900">
                  <span className="underline decoration-emerald-400 decoration-2 underline-offset-4">추천 선수</span> 한눈에 비교
                </h2>
                <button
                  onClick={() => compareIds.size >= 2 && navigate(`/ai-match/${requestId}/compare?ids=${[...compareIds].join(',')}`)}
                  disabled={compareIds.size < 2}
                  className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[12px] font-bold ${
                    compareIds.size >= 2 ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> 선택 비교 ({compareIds.size}/3) <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-left">
                      <th className="px-5 py-2.5 font-bold">선수</th>
                      <th className="px-3 py-2.5 font-bold">적합도</th>
                      <th className="px-3 py-2.5 font-bold">가용 슬롯</th>
                      <th className="px-3 py-2.5 font-bold">최저 슬롯가</th>
                      <th className="px-3 py-2.5 font-bold">SNS 팔로워</th>
                      <th className="px-3 py-2.5 font-bold">팬 관심</th>
                      <th className="px-3 py-2.5 font-bold">추천 방식</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recs.slice(0, 5).map((r) => (
                      <tr key={r.athleteId} className="border-t border-slate-100">
                        <td className="px-5 py-2.5">
                          <Link to={`/ai-match/${requestId}/proposal/${r.athleteId}`} className="inline-flex items-center gap-2 font-bold text-slate-900 hover:text-emerald-700">
                            <span className="w-7 h-7 rounded-full overflow-hidden bg-slate-100">
                              {r.profileImageUrl && <img src={r.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                            </span>
                            {r.name} 프로
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 font-black text-emerald-700 tabular-nums">{r.matchScore}%</td>
                        <td className="px-3 py-2.5 tabular-nums">{r.metrics?.availableSlots}개</td>
                        <td className="px-3 py-2.5 tabular-nums">{r.metrics?.minSlotPrice?.toLocaleString()}원</td>
                        <td className="px-3 py-2.5 tabular-nums">{r.metrics?.followers ? r.metrics.followers.toLocaleString() : '—'}</td>
                        <td className="px-3 py-2.5 tabular-nums">{r.metrics?.favoriteCount ?? 0}</td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold whitespace-nowrap">
                            {METHOD_LABEL[r.package?.method] || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5">
        <Breadcrumb className="mb-0" title="추천 결과" />
      </div>
      {children}
    </div>
  );
}

function Cond({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px]">
      <span className="text-slate-400">{label} :</span>
      <span className="font-bold text-emerald-700">{value}</span>
    </span>
  );
}

function SourceRow({ label, ok, note }: { label: string; ok: boolean; note?: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ok ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      <span className={ok ? 'text-slate-600' : 'text-slate-400'}>{label}</span>
      {note && <span className="ml-auto text-[10px] text-slate-300">{note}</span>}
    </li>
  );
}

function MetricRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className={`tabular-nums ${strong ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>{value}</dd>
    </div>
  );
}

function MethodCard({ icon: Icon, title, desc, cta, to, solid = false }: { icon: any; title: string; desc: string; cta: string; to: string; solid?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5 flex flex-col">
      <span className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-emerald-600" />
      </span>
      <div className="text-[14px] font-extrabold text-slate-900 mb-1">{title}</div>
      <p className="text-[12px] text-slate-500 break-keep leading-relaxed mb-4">{desc}</p>
      <Link
        to={to}
        className={`mt-auto h-10 inline-flex items-center justify-center rounded-xl text-[13px] font-bold ${
          solid ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'border border-emerald-600 text-emerald-700 hover:bg-emerald-50'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
