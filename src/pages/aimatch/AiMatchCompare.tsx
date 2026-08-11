/**
 * 추천 선수 비교 (/ai-match/:requestId/compare?ids=a,b,c) · 핸드오프 v1.0 §6.3
 *
 * 최대 3명 동일 지표 비교 카드 + 하단 상세 비교 테이블.
 * 지표는 추천 스냅샷의 실데이터만 쓴다.
 */
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import Breadcrumb from '../../components/Breadcrumb';
import { useAuth } from '../../hooks/useAuth';
import { AiMatchBrandGate } from './AiMatch';
import { CONFIDENCE_LABEL, METHOD_LABEL, useAiMatchRequest } from './AiMatchResults';

export default function AiMatchCompare() {
  const { isAuthenticated, user } = useAuth();
  if (!(isAuthenticated && (user as any)?.role === 'BRAND')) return <AiMatchBrandGate />;
  return <AiMatchCompareInner />;
}

function AiMatchCompareInner() {
  const { requestId } = useParams();
  const [searchParams] = useSearchParams();
  const { data, isLoading } = useAiMatchRequest(requestId);

  const ids = (searchParams.get('ids') || '').split(',').filter(Boolean);
  const recs: any[] = data?.recommendations || [];
  const selected = (ids.length ? recs.filter((r) => ids.includes(r.athleteId)) : recs).slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5">
        <Breadcrumb className="mb-0" />
      </div>

      <section className="px-5 sm:px-8 pt-2 pb-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
              추천 선수 <span className="text-emerald-600">비교 · 상세 제안</span>
            </h1>
            <p className="text-sm text-slate-500">추천 선수별 강점과 지표를 비교하고 가장 적합한 후원안을 선택하세요.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[12px] font-bold">
            <Sparkles className="w-3.5 h-3.5" /> AI 분석 기반 추천 결과
          </span>
        </div>
      </section>

      {isLoading ? (
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 text-center">
          <div className="w-10 h-10 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin mx-auto" />
        </div>
      ) : selected.length === 0 ? (
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 text-center text-sm text-slate-500">
          비교할 추천 결과가 없습니다. <Link to="/ai-match" className="font-bold text-emerald-700">새로 추천받기 ›</Link>
        </div>
      ) : (
        <section className="px-5 sm:px-8 pb-16">
          <div className="max-w-7xl mx-auto">
            {/* 비교 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {selected.map((r, i) => (
                <div key={r.athleteId} className="relative rounded-2xl border border-slate-200 p-4 flex flex-col">
                  <span className="absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full bg-slate-900 text-white text-[13px] font-black flex items-center justify-center tabular-nums shadow">{i + 1}</span>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-[96px] aspect-[4/5] rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      {r.profileImageUrl && <img src={r.profileImageUrl} alt={r.name} className="w-full h-full object-cover object-top" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[16px] font-extrabold text-slate-900">{r.name} 프로</div>
                      <div className="text-[11px] text-slate-400 mb-2">{r.tour} 🇰🇷</div>
                      <div className="grid grid-cols-3 gap-1 text-center">
                        <div>
                          <div className="text-[9px] text-slate-400">적합도</div>
                          <div className="text-[15px] font-black text-emerald-700 tabular-nums">{r.matchScore}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-400">슬롯</div>
                          <div className="text-[15px] font-black text-slate-900 tabular-nums">{r.metrics?.availableSlots}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-400">팬 관심</div>
                          <div className="text-[15px] font-black text-slate-900 tabular-nums">{r.metrics?.favoriteCount ?? 0}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 추천 슬롯 */}
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-[11px] font-bold text-slate-400 w-16 shrink-0 pt-0.5">추천 슬롯</span>
                    <div className="flex flex-wrap gap-1">
                      {(r.package?.slots || []).map((s: any) => (
                        <span key={s.code} className="px-1.5 py-0.5 rounded-md border border-slate-200 text-[10px] font-bold text-slate-600">{s.name}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-[11px] font-bold text-slate-400 w-16 shrink-0 pt-0.5">계약 방식</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      {METHOD_LABEL[r.package?.method]}{r.package?.sns ? ' + SNS 연계' : ''}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 mb-4">
                    <span className="text-[11px] font-bold text-slate-400 w-16 shrink-0 pt-0.5">신뢰도</span>
                    <span className="text-[11px] font-bold text-slate-700">{CONFIDENCE_LABEL[r.confidence]}</span>
                  </div>

                  <div className="mt-auto rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-slate-400">추천 예산</div>
                      <div className="text-[16px] font-black text-slate-900 tabular-nums">₩{r.package?.priceConfirmed?.toLocaleString()}~</div>
                    </div>
                    <Link
                      to={`/ai-match/${requestId}/proposal/${r.athleteId}`}
                      className="h-9 px-3.5 inline-flex items-center rounded-lg border border-emerald-600 text-emerald-700 text-[12px] font-bold hover:bg-emerald-50"
                    >
                      이 선수 선택
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* 상세 비교 테이블 */}
            <div className="rounded-2xl border border-slate-200 overflow-x-auto mb-6">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-slate-50 text-left text-slate-400">
                    <th className="px-4 py-3 font-bold w-32">항목</th>
                    {selected.map((r) => (
                      <th key={r.athleteId} className="px-4 py-3 font-extrabold text-slate-900">{r.name} 프로</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <CompareRow label="매칭 점수" cells={selected.map((r) => `${r.matchScore}점`)} strongFirst />
                  <CompareRow label="추천 방식" cells={selected.map((r) => METHOD_LABEL[r.package?.method] || '-')} />
                  <CompareRow label="추천 예산" cells={selected.map((r) => `₩${r.package?.priceConfirmed?.toLocaleString()}~`)} />
                  <CompareRow label="추천 슬롯" cells={selected.map((r) => (r.package?.slots || []).map((s: any) => s.name).join(' + ') || '-')} />
                  <CompareRow label="SNS 팔로워" cells={selected.map((r) => (r.metrics?.followers ? `${r.metrics.followers.toLocaleString()}명` : '데이터 준비 중'))} />
                  <CompareRow label="팬 관심 등록" cells={selected.map((r) => `${r.metrics?.favoriteCount ?? 0}명`)} />
                  <CompareRow label="최근 12개월 성적" cells={selected.map((r) => `${r.metrics?.resultCount12m ?? 0}건`)} />
                  <CompareRow label="팬스토어" cells={selected.map((r) => (r.metrics?.growthMarketBrands?.length ? r.metrics.growthMarketBrands.join(' · ') : '—'))} />
                  <CompareRow label="데이터 신뢰도" cells={selected.map((r) => CONFIDENCE_LABEL[r.confidence] || '-')} />
                </tbody>
              </table>
            </div>

            {/* 선택 팁 */}
            <div className="rounded-2xl bg-amber-50/70 border border-amber-100 px-5 py-4 flex items-start gap-3">
              <span className="text-lg">💡</span>
              <div className="text-[12px] text-slate-600 break-keep leading-relaxed">
                <b>선택 팁</b> — 브랜드 노출이 목표라면 매칭 점수가 가장 높은 선수를, 예산 효율을 원하시면 최저 슬롯가가 낮은 선수를 추천드려요.
                카드의 <b>이 선수 선택</b>을 누르면 제안서 화면으로 이동합니다.
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function CompareRow({ label, cells, strongFirst = false }: { label: string; cells: string[]; strongFirst?: boolean }) {
  const max = strongFirst ? Math.max(...cells.map((c) => parseInt(c) || 0)) : null;
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-2.5 text-slate-400 font-bold">{label}</td>
      {cells.map((c, i) => {
        const best = strongFirst && parseInt(c) === max;
        return (
          <td key={i} className={`px-4 py-2.5 ${best ? 'font-black text-emerald-700' : 'font-bold text-slate-700'}`}>
            {best && <Check className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />}{c}
          </td>
        );
      })}
    </tr>
  );
}
