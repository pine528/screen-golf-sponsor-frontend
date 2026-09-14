/**
 * F08 내 팬 기여도 (핸드오프 §12 · §9.3)
 * 금액이 아니라 활동 다양성·지속성으로 산정한다는 점을 화면에서 분명히 한다.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Check, Megaphone } from 'lucide-react';
import { api } from '../../services/api';
import {
  FanHeader, Card, Chip, AthleteAvatar, EmptyState, Notice, Skeleton, nf,
} from '../../components/fanhub/FanKit';

const LEVEL_TONE: Record<number, 'slate' | 'sky' | 'violet'> = { 1: 'slate', 2: 'sky', 3: 'violet' };

function Meter({ label, have, need }: { label: string; have: number; need: number }) {
  const done = have >= need;
  return (
    <div className="flex items-center gap-2.5">
      <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
        done ? 'bg-emerald-500' : 'bg-slate-200'
      }`}>
        {done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
      </span>
      <span className={`text-[12px] flex-1 ${done ? 'text-slate-700 font-semibold' : 'text-slate-500'}`}>{label}</span>
      <span className="text-[12px] font-bold text-slate-500 tabular-nums">{have}/{need}</span>
    </div>
  );
}

export default function FanContributions() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyContributions()
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const list = data?.contributions || [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Link to="/fan" className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-500 hover:text-slate-700 mb-5">
        <ArrowLeft className="w-4 h-4" /> 팬 참여
      </Link>

      <FanHeader eyebrow="MY CONTRIBUTION" title="내 팬 기여도"
        desc="응원한 선수별로 그동안의 활동이 어떻게 쌓였는지 보여드립니다." />

      {loading ? (
        <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-[220px]" />)}</div>
      ) : list.length ? (
        <div className="space-y-3">
          {list.map((c: any) => (
            <Card key={c.athlete.id} className="p-5">
              <div className="flex items-center gap-3.5 mb-4">
                <AthleteAvatar athlete={c.athlete} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-bold text-slate-900">{c.athlete.name}</p>
                  <p className="text-[12px] text-slate-500">{c.athlete.tour || c.athlete.sportType || '선수'}</p>
                </div>
                <Chip tone={LEVEL_TONE[c.level] || 'slate'}>{c.levelLabel}</Chip>
              </div>

              {/* 활동 집계 */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: '투표', v: c.counts.vote },
                  { label: '커뮤니티', v: c.counts.post },
                  { label: '스토어', v: c.counts.store },
                  { label: '브랜드 추천', v: c.counts.recommend },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl bg-slate-50 py-3 text-center">
                    <p className="text-[18px] font-extrabold text-slate-900 tabular-nums leading-none">{nf(s.v)}</p>
                    <p className="text-[12px] text-slate-500 mt-1.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* 다양성 · 지속성 */}
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5 mb-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-semibold text-slate-600">활동 영역</span>
                    <span className="text-[12px] text-slate-500 tabular-nums">{c.diversity}/{c.diversityMax}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-slate-900 transition-[width] duration-700"
                      style={{ width: `${(c.diversity / c.diversityMax) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-semibold text-slate-600">최근 4주 중 활동</span>
                    <span className="text-[12px] text-slate-500 tabular-nums">{c.streakWeeks}/{c.streakMax}주</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-slate-900 transition-[width] duration-700"
                      style={{ width: `${(c.streakWeeks / c.streakMax) * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* 연말 캠페인 자격 */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-1.5 mb-3">
                  <Megaphone className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[12px] font-bold text-slate-500">연말 응원광고 참여 조건</span>
                  {c.campaign.met && <Chip size="xs" tone="emerald">충족</Chip>}
                </div>
                <div className="space-y-2">
                  <Meter label="4개 활동 영역 참여" have={c.campaign.diversity.have} need={c.campaign.diversity.need} />
                  <Meter label="최근 4주 연속 활동" have={c.campaign.continuity.have} need={c.campaign.continuity.need} />
                  <Meter label="응원 편지 작성" have={c.campaign.letter.have} need={c.campaign.letter.need} />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Link to={`/fan/temperature/${c.athlete.id}`}
                  className="flex-1 h-10 rounded-2xl bg-slate-100 text-slate-700 text-[13px] font-bold flex items-center justify-center hover:bg-slate-200 transition">
                  팬온도 보기
                </Link>
                <Link to={`/fan/letter/${c.athlete.id}`}
                  className="flex-1 h-10 rounded-2xl bg-slate-900 text-white text-[13px] font-bold flex items-center justify-center hover:bg-slate-800 transition">
                  응원 편지 쓰기
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Heart className="w-5 h-5" />} title="아직 기여 기록이 없습니다"
          desc={'투표하거나 커뮤니티에 응원을 남기면\n선수별 기여도가 이곳에 쌓입니다.'}
          action={
            <Link to="/fan/vote" className="inline-flex h-10 px-5 rounded-2xl bg-slate-900 text-white text-[13px] font-bold items-center hover:bg-slate-800 transition">
              투표 둘러보기
            </Link>
          } />
      )}

      {data?.notice && <div className="mt-6"><Notice items={[data.notice]} /></div>}
    </div>
  );
}
