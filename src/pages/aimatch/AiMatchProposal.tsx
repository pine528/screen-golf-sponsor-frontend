/**
 * AI 추천 제안서 · 상담 연결 (/ai-match/:requestId/proposal/:athleteId) · 핸드오프 v1.0 §6.4
 *
 * 좌: 브랜드 맞춤 추천안 + 최종 추천 조합(계약 개요/제공 내역) + 예산 배분 + 추가 추천 옵션
 * 우: 진행 준비 완료 패널 + 제안서 인쇄 + 상담 요청(→문의) + 바로 계약 시작(→선수 상세 구매)
 *
 * 예상 성과 수치는 지어내지 않는다 — 실데이터 지표와 '협의 시 확정' 표기만 사용.
 */
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Box,
  Check,
  CheckCircle2,
  Instagram,
  MessageCircle,
  Printer,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  Zap,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import Breadcrumb from '../../components/Breadcrumb';
import { BRAND_TYPES, GOALS, METHODS, labelOf } from './AiMatch';
import { CONFIDENCE_LABEL, METHOD_LABEL, ScoreGauge, useAiMatchRequest } from './AiMatchResults';

export default function AiMatchProposal() {
  const { requestId, athleteId } = useParams();
  const { data, isLoading } = useAiMatchRequest(requestId);

  if (isLoading) {
    return (
      <Shell title="상세 제안">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 text-center">
          <div className="w-10 h-10 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin mx-auto" />
        </div>
      </Shell>
    );
  }
  if (!data) return <Navigate to="/ai-match" replace />;

  const recs: any[] = data.recommendations || [];
  const rec = recs.find((r) => r.athleteId === athleteId);
  if (!rec) return <Navigate to={`/ai-match/${requestId}`} replace />;

  const input = data.input;
  const pkg = rec.package || {};
  const others = recs.filter((r) => r.athleteId !== athleteId).slice(0, 3);
  const alloc = pkg.allocation || { slot: 0.6, sns: 0.2, growthMarket: 0.1, ops: 0.1 };

  const deliverables: string[] = [
    ...(pkg.slots || []).map((s: any) => `${METHOD_LABEL[pkg.method] || '후원'} — ${s.name} 슬롯 (${s.price.toLocaleString()}원)`),
    ...(pkg.sns ? [`전용 SNS 콘텐츠 ${pkg.sns.feedPosts}건 + 스토리 ${pkg.sns.storyPosts}건 (인스타그램)`] : []),
    ...(pkg.growthMarket ? [`성장마켓 팬스토어 연계 (${pkg.growthMarket.brands.join(' · ')})`] : []),
    '브랜드 로고 노출 (스폰픽 선수 페이지)',
    '이행 증빙 리포트 제공',
  ];

  const consultHref = `/contact?subject=${encodeURIComponent(`[AI 매칭] ${rec.name} 프로 후원 상담 요청 (요청번호 ${String(requestId).slice(0, 8)})`)}`;

  return (
    <Shell title={`${rec.name} 프로 제안`}>
      {/* 헤더 */}
      <section className="px-5 sm:px-8 pt-2 pb-6 print:hidden">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 inline-flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-500" /> AI 추천 <span className="text-emerald-600">제안서 · 상담 연결</span>
          </h1>
          <p className="text-sm text-slate-500">추천 결과를 바탕으로 바로 제안서를 확인하고 후원 진행을 시작할 수 있어요.</p>
        </div>
      </section>

      <section className="px-5 sm:px-8 pb-16" id="proposal-print">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] gap-5 items-start">
          {/* 좌측 */}
          <div className="space-y-5 min-w-0">
            {/* 브랜드 맞춤 추천안 + 최종 조합 */}
            <div className="rounded-2xl border border-slate-200 p-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,38%)_minmax(0,1fr)] gap-6">
                <div>
                  <h2 className="text-[15px] font-extrabold text-slate-900 mb-4">브랜드 맞춤 추천안</h2>
                  <dl className="space-y-2.5 text-[12px]">
                    <Row label="브랜드 유형" value={labelOf(BRAND_TYPES, input?.brandType)} />
                    <Row label="목표" value={(input?.goals || []).map((g: string) => labelOf(GOALS, g)).join(' · ')} />
                    <Row label="예산" value={`${Math.round(input.budget.min / 10000)}~${Math.round(input.budget.max / 10000)}만원`} />
                    <Row label="추천 선수" value={`${rec.name} 프로`} />
                    <Row label="추천 방식" value={`${METHOD_LABEL[pkg.method]}${pkg.sns ? ' + SNS' : ''}${pkg.growthMarket ? ' + 팬스토어 연계' : ''}`} />
                    <Row label="선호 방식" value={labelOf(METHODS, input?.preferredMethod)} />
                  </dl>
                  <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3">
                    <div className="text-[11px] font-bold text-slate-500 mb-1">추천 사유</div>
                    <ul className="space-y-1">
                      {(rec.reasons || []).map((r: any) => (
                        <li key={r.code} className="text-[11px] text-slate-600 break-keep leading-relaxed flex items-start gap-1.5">
                          <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" /> {r.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold mb-2">
                    ♥ 최종 추천 조합
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mb-4 break-keep">
                    {rec.name} 프로 · {METHOD_LABEL[pkg.method]}
                    {pkg.sns ? ` + SNS ${pkg.sns.feedPosts + pkg.sns.storyPosts}건` : ''}
                    {pkg.growthMarket ? ' + 팬스토어 연계' : ''}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <div className="text-[12px] font-extrabold text-slate-900 mb-2">계약 개요</div>
                      <ul className="space-y-1.5 text-[12px] text-slate-600">
                        <li>· 계약 기간 — {pkg.duration}</li>
                        <li>· 후원 방식 — {METHOD_LABEL[pkg.method]}</li>
                        <li>· 슬롯 — {(pkg.slots || []).map((s: any) => s.name).join(', ')}</li>
                        {pkg.sns && <li>· SNS 콘텐츠 — {pkg.sns.feedPosts + pkg.sns.storyPosts}건 (인스타그램)</li>}
                        {pkg.growthMarket && <li>· 팬스토어 — {pkg.growthMarket.brands.join(' · ')} 연계</li>}
                        {pkg.guarantee50 && <li>· 성과보장 옵션 — {pkg.guarantee50.note}</li>}
                      </ul>
                    </div>
                    <div>
                      <div className="text-[12px] font-extrabold text-slate-900 mb-2">제공 내역</div>
                      <ul className="space-y-1.5">
                        {deliverables.map((d) => (
                          <li key={d} className="flex items-start gap-1.5 text-[12px] text-slate-600 break-keep">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="mt-4 text-[11px] text-slate-400 break-keep">
                    ⓘ 위 내용은 추천 기반 제안으로, 협의 후 세부 조건이 조정될 수 있습니다.
                    {pkg.priceNote && ` ${pkg.priceNote}.`}
                  </p>
                </div>
              </div>
            </div>

            {/* 예산 배분 + 실데이터 지표 */}
            <div className="rounded-2xl border border-slate-200 p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-[14px] font-extrabold text-slate-900 mb-4">권장 예산 배분 <span className="text-[11px] font-bold text-slate-400">(목적 기준)</span></h3>
                <div className="flex items-center gap-5">
                  <div
                    className="w-32 h-32 rounded-full shrink-0"
                    style={{
                      background: `conic-gradient(#059669 0 ${alloc.slot * 360}deg, #34D399 ${alloc.slot * 360}deg ${(alloc.slot + alloc.sns) * 360}deg, #A7F3D0 ${(alloc.slot + alloc.sns) * 360}deg ${(alloc.slot + alloc.sns + alloc.growthMarket) * 360}deg, #E2E8F0 ${(alloc.slot + alloc.sns + alloc.growthMarket) * 360}deg 360deg)`,
                    }}
                  >
                    <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(circle at center, white 52%, transparent 53%)' }}>
                      <div className="text-center">
                        <div className="text-[9px] text-slate-400">확정 슬롯가</div>
                        <div className="text-[13px] font-black text-slate-900 tabular-nums">₩{pkg.priceConfirmed?.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-[12px]">
                    <AllocRow color="#059669" label="슬롯 후원" pct={alloc.slot} />
                    <AllocRow color="#34D399" label="SNS 콘텐츠" pct={alloc.sns} />
                    <AllocRow color="#A7F3D0" label="성장마켓 연계" pct={alloc.growthMarket} />
                    <AllocRow color="#E2E8F0" label="기타 운영" pct={alloc.ops} />
                  </ul>
                </div>
              </div>
              <div>
                <h3 className="text-[14px] font-extrabold text-slate-900 mb-4">선수 실측 지표 <span className="text-[11px] font-bold text-slate-400">(기준일 {data.dataAsOf ? new Date(data.dataAsOf).toLocaleDateString('ko-KR') : '-'})</span></h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <MetricTile icon={Instagram} label="SNS 팔로워" value={rec.metrics?.followers ? `${rec.metrics.followers.toLocaleString()}명` : '수집 중'} />
                  <MetricTile icon={Users} label="팬 관심 등록" value={`${rec.metrics?.favoriteCount ?? 0}명`} />
                  <MetricTile icon={Box} label="가용 슬롯" value={`${rec.metrics?.availableSlots}개`} />
                  <MetricTile icon={Store} label="팬스토어" value={rec.metrics?.growthMarketBrands?.length ? `${rec.metrics.growthMarketBrands.length}개 운영` : '—'} />
                </div>
                <p className="mt-3 text-[10px] text-slate-400 break-keep">
                  ※ SPONPIK은 확인된 실데이터만 표기합니다. '수집 중' 지표는 매칭 신뢰도({CONFIDENCE_LABEL[rec.confidence]})에 반영되어 있습니다.
                </p>
              </div>
            </div>

            {/* 추가 추천 옵션 */}
            {others.length > 0 && (
              <div className="rounded-2xl border border-slate-200 p-5 print:hidden">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[14px] font-extrabold text-slate-900">추가 추천 옵션</h3>
                  <Link to={`/ai-match/${requestId}`} className="text-[12px] font-bold text-slate-400 hover:text-slate-700">전체 보기 ›</Link>
                </div>
                <div className="space-y-2">
                  {others.map((o) => (
                    <div key={o.athleteId} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5">
                      <span className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 shrink-0">
                        {o.profileImageUrl && <img src={o.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-bold text-slate-900">
                          {o.name} 프로 <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-black">{o.matchScore}점</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {METHOD_LABEL[o.package?.method]} · ₩{o.package?.priceConfirmed?.toLocaleString()}~
                        </div>
                      </div>
                      <Link
                        to={`/ai-match/${requestId}/proposal/${o.athleteId}`}
                        className="shrink-0 h-8 px-3 inline-flex items-center rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                      >
                        선택
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 우측 — 진행 준비 완료 */}
          <div className="lg:sticky lg:top-20 space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/60 to-white p-5">
              <h2 className="text-[15px] font-extrabold text-slate-900 mb-4 inline-flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-600" /> 진행 준비 완료
              </h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 aspect-square rounded-full overflow-hidden bg-slate-100 shrink-0">
                  {rec.profileImageUrl && <img src={rec.profileImageUrl} alt={rec.name} className="w-full h-full object-cover object-top" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-extrabold text-slate-900">{rec.name} 프로</div>
                  <div className="text-[11px] text-slate-400">{rec.tour}</div>
                </div>
                <ScoreGauge score={rec.matchScore} size={56} />
              </div>

              <ul className="space-y-2 mb-4">
                {[
                  ['추천 선수 확정', `${rec.name} 프로`],
                  ['후원 방식 선택', METHOD_LABEL[pkg.method]],
                  ['예산 확정', `${Math.round(input.budget.min / 10000)}~${Math.round(input.budget.max / 10000)}만원`],
                  ['구성 확인', `슬롯 ${pkg.slots?.length || 0}개${pkg.sns ? ' + SNS' : ''}${pkg.growthMarket ? ' + 팬스토어' : ''}`],
                ].map(([t, v]) => (
                  <li key={t as string} className="flex items-center gap-2 text-[12px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-slate-500">{t}</span>
                    <span className="ml-auto font-bold text-slate-800 text-right break-keep">{v}</span>
                  </li>
                ))}
              </ul>

              <div className="rounded-xl bg-white border border-slate-100 px-4 py-3 mb-4">
                <div className="text-[11px] text-slate-400 mb-0.5">확정 슬롯 후원가 (VAT 별도)</div>
                <div className="text-[22px] font-black text-slate-900 tabular-nums">₩{pkg.priceConfirmed?.toLocaleString()}~</div>
                {pkg.priceNote && <div className="text-[10px] text-slate-400 break-keep mt-0.5">{pkg.priceNote}</div>}
              </div>

              <button
                onClick={() => window.print()}
                className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 hover:bg-slate-50 mb-2 print:hidden"
              >
                <Printer className="w-4 h-4" /> 제안서 인쇄 / PDF 저장
              </button>
              <Link
                to={consultHref}
                className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600 text-emerald-700 text-[13px] font-bold hover:bg-emerald-50 mb-2 print:hidden"
              >
                <MessageCircle className="w-4 h-4" /> 브랜드 상담 요청
              </Link>
              <Link
                to={`/athletes/${rec.athleteId}${pkg.slots?.[0] ? `?slot=${pkg.slots[0].code}#slots` : ''}`}
                className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 print:hidden"
              >
                <Zap className="w-4 h-4" /> 바로 계약 시작 <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-center text-[10px] text-slate-400 mt-2 print:hidden">선수 상세의 통합 구매 화면으로 연결됩니다</p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3.5 flex items-start gap-2.5 print:hidden">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 break-keep leading-relaxed">
                결제는 SPONPIK 에스크로로 보호되며, 계약 이행 증빙 리포트가 제공됩니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="print:hidden"><PublicHeader /></div>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5 print:hidden">
        <Breadcrumb className="mb-0" title={title} />
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="w-20 shrink-0 text-slate-400">{label}</dt>
      <dd className="font-bold text-slate-800 break-keep">{value}</dd>
    </div>
  );
}

function AllocRow({ color, label, pct }: { color: string; label: string; pct: number }) {
  return (
    <li className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
      <span className="text-slate-600">{label}</span>
      <span className="ml-auto font-bold text-slate-800 tabular-nums">{Math.round(pct * 100)}%</span>
    </li>
  );
}

function MetricTile({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="text-[14px] font-black text-slate-900 tabular-nums break-keep">{value}</div>
    </div>
  );
}
