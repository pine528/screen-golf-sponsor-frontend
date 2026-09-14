/**
 * 선수 상세 · 팬 탭 — 팬온도 요약 + 응원 진입 (UI 가이드 §10.2 · §11)
 * 숫자만 크게 보여주지 않고 30일 변화·기여 원인·고정 문구를 함께 둔다. 개인 팬 데이터는 없다.
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, MessageCircle, Thermometer, TrendingUp, Vote } from 'lucide-react';
import { api } from '../../services/api';
import { FAN_TEMP_NOTE } from '../fanhub/FanKit';
import { LoadingState } from '../ui/StateView';

export default function AthleteFanPanel({ athleteId, name }: { athleteId: string; name: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['fan-temperature', athleteId],
    queryFn: () => api.getFanTemperature(athleteId),
    enabled: !!athleteId,
    retry: 0,
  });
  const t: any = data?.data || null;
  const score = t?.score != null && t.score > 0 && !t.lowSample ? Number(t.score) : null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-[17px] font-extrabold text-slate-900 inline-flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-orange-500" /> 팬온도
          </h2>
          <p className="mt-1 text-[13px] text-slate-500 break-keep">{FAN_TEMP_NOTE}</p>
          {isLoading ? (
            <LoadingState label="팬 활동을 집계하는 중…" className="py-10" />
          ) : (
            <div className="mt-4 grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-[12.5px] text-slate-500">최근 30일 팬온도</p>
                <p className="mt-1 text-[24px] font-extrabold text-slate-900 tabular-nums">
                  {score != null ? `${score.toFixed(1)}℃` : <span className="text-[14px] font-bold text-slate-500">집계 중</span>}
                </p>
                {t?.tier?.label && score != null && <p className="text-[12.5px] text-slate-600">{t.tier.meaning || t.tier.label}</p>}
                {t?.lowSample && <p className="text-[12.5px] text-slate-500 break-keep">참여 팬 {t.sampleSize ?? 0}명 · 30명 이상 모이면 공개됩니다</p>}
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-[12.5px] text-slate-500 inline-flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> 지난주 대비</p>
                <p className="mt-1 text-[24px] font-extrabold text-slate-900 tabular-nums">
                  {t?.weeklyDelta != null && score != null ? `${t.weeklyDelta > 0 ? '+' : ''}${Number(t.weeklyDelta).toFixed(1)}℃` : <span className="text-[14px] font-bold text-slate-500">집계 중</span>}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-[12.5px] text-slate-500">온도를 올린 활동</p>
                {t?.risingFactors?.length ? (
                  <ul className="mt-1.5 space-y-1">
                    {t.risingFactors.slice(0, 3).map((f: any, i: number) => (
                      <li key={i} className="text-[13px] text-slate-700 flex justify-between gap-2">
                        <span className="truncate">{f.label}</span><span className="font-bold tabular-nums shrink-0">+{f.count}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="mt-1 text-[14px] font-bold text-slate-500">집계 중</p>}
              </div>
            </div>
          )}
          <Link to={`/fan/temperature/${athleteId}`} className="mt-4 inline-flex items-center gap-1 text-[13px] font-bold text-emerald-700 hover:text-emerald-800">
            팬온도 구성 · 추세 보기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-[15px] font-extrabold text-slate-900">{name} 선수 응원하기</h2>
          <p className="mt-1 text-[13px] text-slate-500 break-keep">응원 기록은 팬온도가 되어 브랜드에게 선수를 소개합니다. 참여한 만큼 팬포인트로 돌아옵니다.</p>
          <div className="mt-4 space-y-2">
            {[
              { icon: MessageCircle, label: '선수 커뮤니티', desc: '응원글 · 선수 공식글', to: `/fan/community/${athleteId}`, primary: true },
              { icon: Vote, label: 'Fan VOTE', desc: '진행 중인 투표 참여', to: '/fan/vote' },
              { icon: Heart, label: '관심 선수 등록', desc: '팬온도 변화 알림', to: '/fan/contributions' },
            ].map((x) => {
              const I = x.icon;
              return (
                <Link key={x.label} to={x.to} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 border transition-colors ${x.primary ? 'bg-rose-500 border-rose-500 text-white hover:bg-rose-600' : 'border-slate-200 hover:border-slate-400'}`}>
                  <I className="w-4 h-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-bold">{x.label}</span>
                    <span className={`block text-[12px] ${x.primary ? 'text-rose-100' : 'text-slate-500'}`}>{x.desc}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0 opacity-70" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
