/**
 * F15 연말 응원광고 캠페인 (핸드오프 §9.3)
 * 구매액이 아니라 활동 다양성·지속성·편지·공익미션으로 심사한다는 점과
 * "집행이 보장되지 않는다"는 고지를 화면에서 숨기지 않는다.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Megaphone, Check, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import {
  FanHeader, Card, Chip, AthleteAvatar, Notice, EmptyState, Skeleton,
} from '../../components/fanhub/FanKit';

export default function FanCampaign() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFanAdCampaign()
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-10 space-y-4"><Skeleton className="h-[200px]" /><Skeleton className="h-[280px]" /></div>;
  }

  const c = data?.campaign;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Link to="/fan" className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-400 hover:text-slate-700 mb-5">
        <ArrowLeft className="w-4 h-4" /> 팬 참여
      </Link>

      {c ? (
        <div className="relative overflow-hidden rounded-[28px] bg-slate-900 px-6 py-8 mb-5">
          <div className="absolute -right-12 -top-16 w-60 h-60 rounded-full blur-3xl opacity-35"
            style={{ background: 'radial-gradient(circle, #7C5CFF 0%, #F2415B 60%, transparent 75%)' }} />
          <div className="relative">
            <Megaphone className="w-6 h-6 text-white/70 mb-4" />
            <h1 className="text-[26px] font-extrabold text-white leading-tight tracking-[-0.02em]">{c.title}</h1>
            {c.description && <p className="mt-3 text-[14px] text-white/60 leading-relaxed">{c.description}</p>}
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-white/60" />
              <span className="text-[12px] font-semibold text-white/80">
                {new Date(c.startAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                {' – '}
                {new Date(c.endAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <FanHeader eyebrow="YEAR-END CAMPAIGN" title="연말 응원광고"
            desc="한 해 동안 함께한 팬들의 이름으로 선수를 응원하는 캠페인입니다." />
          <EmptyState icon={<Megaphone className="w-5 h-5" />} title="진행 중인 캠페인이 없습니다"
            desc={'캠페인이 열리면 팬 참여 홈에서 안내해드립니다.\n그동안의 활동은 그대로 기여도에 쌓입니다.'} />
        </>
      )}

      {/* 심사 기준 */}
      <section className="mb-6 mt-6">
        <h2 className="text-[15px] font-bold text-slate-900 mb-1">어떻게 선정하나요</h2>
        <p className="text-[13px] text-slate-400 mb-3.5">구매 금액은 심사 항목에 포함되지 않습니다.</p>
        <Card className="p-5">
          <div className="space-y-4">
            {data?.criteria?.map((cr: any) => (
              <div key={cr.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[14px] font-bold text-slate-800">{cr.label}</span>
                  <span className="text-[13px] font-extrabold text-slate-900 tabular-nums">{cr.weight}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-1.5">
                  <div className="h-full rounded-full bg-slate-900" style={{ width: `${cr.weight}%` }} />
                </div>
                <p className="text-[12px] text-slate-400">{cr.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* 내 자격 */}
      {data?.mine && (
        <section className="mb-6">
          <h2 className="text-[15px] font-bold text-slate-900 mb-3">내 참여 자격</h2>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              {data.mine.met
                ? <Chip tone="emerald"><Check className="w-3 h-3" />조건 충족</Chip>
                : <Chip>조건 진행 중</Chip>}
            </div>
            <div className="space-y-2.5">
              {[
                { label: '4개 활동 영역 참여', ...data.mine.diversity },
                { label: '최근 4주 연속 활동', ...data.mine.continuity },
                { label: '응원 편지 작성', ...data.mine.letter },
              ].map((m: any) => (
                <div key={m.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] text-slate-600">{m.label}</span>
                    <span className="text-[12px] font-bold text-slate-500 tabular-nums">{m.have}/{m.need}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${m.have >= m.need ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      style={{ width: `${Math.min(100, (m.have / m.need) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <Link to="/fan/contributions" className="mt-4 block text-center text-[12px] font-bold text-slate-500 hover:text-slate-900">
              내 팬 기여도 자세히 보기
            </Link>
          </Card>
        </section>
      )}

      {/* 후보 현황 */}
      {data?.candidates?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[15px] font-bold text-slate-900 mb-1">응원이 활발한 선수</h2>
          <p className="text-[13px] text-slate-400 mb-3.5">심사 기준으로 환산한 현재 현황이며, 최종 선정 결과가 아닙니다.</p>
          <div className="space-y-2">
            {data.candidates.map((cand: any) => (
              <Card key={cand.athlete.id} as="link" to={`/fan/temperature/${cand.athlete.id}`} className="p-4">
                <div className="flex items-center gap-3.5">
                  <AthleteAvatar athlete={cand.athlete} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold text-slate-900">{cand.athlete.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {Object.entries(cand.marks).map(([k, v]) => (
                        <span key={k} className="text-[11px] text-slate-400 bg-slate-50 rounded-full px-2 py-0.5">
                          {({ activity: '활동', continuity: '지속', letter: '편지', mission: '미션' } as any)[k]} {String(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[18px] font-extrabold text-slate-900 tabular-nums leading-none">{cand.index}</p>
                    <p className="text-[11px] text-slate-400 mt-1">/ 100</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {data?.notices && <Notice title="캠페인 고지" items={data.notices} />}
    </div>
  );
}
