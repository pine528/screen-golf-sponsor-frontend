/**
 * F07 팬온도 상세 (핸드오프 §6)
 * 숫자를 크게 보여주기보다 "무엇이 온도를 올렸는지"를 먼저 말한다 (§18.3).
 * 표본이 30 미만이면 점수를 숨기고 "데이터 축적 중"으로 표시한다.
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Info, Vote, MessageCircle, ShoppingBag, Users, Repeat, Reply } from 'lucide-react';
import { api } from '../../services/api';
import {
  Card, Chip, TempGauge, AthleteAvatar, Notice, Skeleton, tempColor, nf,
} from '../../components/fanhub/FanKit';

const SOURCE_COMP: Record<string, string> = {
  VOTE: 'vote', COMMUNITY: 'community', LETTER: 'community',
  STORE: 'store', BRAND_SUGGEST: 'store', FAVORITE: 'activeFans',
};

const COMP_ICON: Record<string, any> = {
  activeFans: Users, vote: Vote, community: MessageCircle,
  store: ShoppingBag, continuity: Repeat, athleteReply: Reply,
};

export default function FanTemperature() {
  const { athleteId = '' } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getFanTemperature(athleteId)
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [athleteId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-8 w-32" /><Skeleton className="h-[240px]" /><Skeleton className="h-[280px]" />
      </div>
    );
  }
  if (!data) {
    return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-slate-500">팬온도를 불러오지 못했습니다</div>;
  }

  const c = tempColor(data.tier?.label);
  const trend: any[] = data.history || [];
  const maxT = Math.max(...trend.map((t) => t.score), 1);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Link to="/fan" className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-400 hover:text-slate-700 mb-5">
        <ArrowLeft className="w-4 h-4" /> 팬 참여
      </Link>

      {/* 게이지 + 의미 */}
      <Card className={`px-6 pt-8 pb-6 mb-4 text-center ring-4 ${c.ring} border-transparent`}>
        {data.athlete && (
          <Link to={`/athletes/${data.athlete.id}`} className="inline-flex items-center gap-2.5 mb-5">
            <AthleteAvatar athlete={data.athlete} size={36} />
            <div className="text-left">
              <p className="text-[15px] font-bold text-slate-900">{data.athlete.name}</p>
              <p className="text-[12px] text-slate-400">{data.athlete.tour || data.athlete.sportType || '선수'}</p>
            </div>
          </Link>
        )}
        <div className="flex justify-center">
          <TempGauge score={data.score} tier={data.tier?.label} lowSample={data.lowSample} size={200} />
        </div>
        <p className="mt-3 text-[14px] font-semibold text-slate-600">{data.tier?.meaning || data.tier?.label}</p>

        {data.lowSample ? (
          <p className="mt-3 text-[13px] text-slate-400 leading-relaxed">
            최근 30일 참여 팬이 {nf(data.sampleSize)}명입니다.<br />
            30명 이상 모이면 팬온도가 공개됩니다.
          </p>
        ) : (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3.5 py-1.5">
            <TrendingUp className={`w-3.5 h-3.5 ${data.weeklyDelta >= 0 ? 'text-emerald-500' : 'text-slate-400'}`} />
            <span className="text-[12px] font-bold text-slate-600">
              {data.weeklyDelta === null || data.weeklyDelta === undefined
                ? '지난주 비교 집계 중'
                : `지난주 대비 ${data.weeklyDelta > 0 ? '+' : ''}${data.weeklyDelta.toFixed(1)}℃`}
            </span>
          </div>
        )}
      </Card>

      {/* 상승 요인 — 숫자보다 먼저 (§18.3) */}
      {data.risingFactors?.length > 0 && (
        <Card className="p-5 mb-4">
          <p className="text-[13px] font-bold text-slate-500 mb-3">최근 온도를 올린 활동</p>
          <div className="space-y-2.5">
            {data.risingFactors.map((f: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${c.from}22, ${c.to}22)` }}>
                  {(() => { const I = COMP_ICON[SOURCE_COMP[f.source]] || Vote; return <I className="w-3.5 h-3.5" style={{ color: c.to }} />; })()}
                </span>
                <p className="text-[13px] text-slate-600 flex-1">{f.label}</p>
                <span className="text-[12px] font-bold text-slate-400 tabular-nums">+{f.count}건</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 구성 요소 */}
      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-bold text-slate-500">팬온도 구성</p>
          <span className="text-[11px] text-slate-400">최근 30일 기준</span>
        </div>
        <div className="space-y-3.5">
          {(data.components || []).map((comp: any) => (
            <div key={comp.key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-semibold text-slate-700">{comp.label}</span>
                <span className="text-[12px] text-slate-400 tabular-nums">가중치 {comp.weight}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full transition-[width] duration-700"
                  style={{
                    width: `${Math.min(100, comp.score ?? 0)}%`,
                    background: `linear-gradient(90deg, ${c.from}, ${c.to})`,
                  }} />
              </div>
              {comp.desc && <p className="mt-1 text-[11px] text-slate-400">{comp.desc}</p>}
            </div>
          ))}
        </div>
      </Card>

      {/* 추세 */}
      {trend.length > 1 && (
        <Card className="p-5 mb-4">
          <p className="text-[13px] font-bold text-slate-500 mb-4">최근 추세</p>
          <div className="flex items-end gap-1.5 h-24">
            {trend.map((t, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full rounded-t-lg transition-[height] duration-700"
                  style={{
                    height: `${Math.max(4, (t.score / maxT) * 84)}px`,
                    background: i === trend.length - 1
                      ? `linear-gradient(180deg, ${c.from}, ${c.to})`
                      : '#E9EDF4',
                  }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[11px] text-slate-400">
            <span>{new Date(trend[0].date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}</span>
            <span>{new Date(trend[trend.length - 1].date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}</span>
          </div>
        </Card>
      )}

      {/* 내 기여 */}
      {data.mine && (
        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold text-slate-500">이 선수에 대한 내 기여</p>
            <Chip size="xs" tone="emerald">Lv.{data.mine.level}</Chip>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: '기여 점수', v: Math.round(data.mine.score) },
              { label: '활동 영역', v: data.mine.diversity },
              { label: '연속 주', v: data.mine.streakWeeks },
              { label: '레벨', v: data.mine.level },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-slate-50 py-3">
                <p className="text-[17px] font-extrabold text-slate-900 tabular-nums">{nf(s.v)}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <Link to="/fan/contributions" className="mt-3 block text-center text-[12px] font-bold text-slate-500 hover:text-slate-900">
            내 팬 기여도 전체보기
          </Link>
        </Card>
      )}

      {/* 산식 고지 */}
      <Notice title="팬온도는 이렇게 계산됩니다" items={[
        '최근 30일 팬 활동을 활동 팬 수·투표·커뮤니티·스토어·지속성·선수 응답 6개 항목으로 나눠 0~100으로 환산합니다.',
        '금액이 큰 응원보다 많은 팬이 꾸준히 참여하는 쪽에 더 큰 가중치를 둡니다.',
        '참여 팬이 30명 미만이면 왜곡을 막기 위해 점수를 공개하지 않습니다.',
        `산식 버전 ${data.formulaVersion || '—'} · 매일 새벽에 갱신됩니다.`,
      ]} />

      <div className="mt-4 flex items-center gap-2 justify-center">
        <Info className="w-3.5 h-3.5 text-slate-300" />
        <p className="text-[11px] text-slate-400">팬온도는 선수 간 순위를 매기기 위한 지표가 아닙니다.</p>
      </div>
    </div>
  );
}
