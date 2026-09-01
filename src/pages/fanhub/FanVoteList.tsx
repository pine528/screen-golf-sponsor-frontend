/**
 * F02 Fan VOTE 목록 — 진행 / 종료 / 내 참여 (핸드오프 §5 · §18.1)
 */
import { useEffect, useMemo, useState } from 'react';
import { Vote, Users, Timer } from 'lucide-react';
import { api } from '../../services/api';
import {
  FanHeader, Card, Chip, AthleteAvatar, Countdown, EmptyState, Skeleton, Notice, nf,
} from '../../components/fanhub/FanKit';

const TABS = [
  { key: 'OPEN', label: '진행 중' },
  { key: 'CLOSED', label: '종료' },
  { key: 'MINE', label: '내 참여' },
];

export default function FanVoteList() {
  const [tab, setTab] = useState('OPEN');
  const [type, setType] = useState('ALL');
  const [sort, setSort] = useState('CLOSING');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.listFanVotes({ tab, type, sort, limit: 40 })
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [tab, type, sort]);

  const types = useMemo(
    () => [{ code: 'ALL', label: '전체' }, ...(data?.types || [])],
    [data?.types],
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <FanHeader eyebrow="FAN VOTE" title="팬 투표"
        desc="선수에 대한 의견과 예측을 남겨보세요. 참여할수록 팬온도와 팬포인트가 함께 쌓입니다." />

      {/* 탭 */}
      <div className="flex gap-1 p-1 rounded-2xl bg-slate-100 mb-4">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 h-10 rounded-xl text-[13px] font-bold transition ${
              tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t.label}
            {data?.counts?.[t.key] > 0 && (
              <span className={`ml-1.5 text-[11px] tabular-nums ${tab === t.key ? 'text-slate-400' : 'text-slate-400'}`}>
                {data.counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 유형 필터 + 정렬 */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
        {types.map((t: any) => (
          <button key={t.code} onClick={() => setType(t.code)}
            className={`shrink-0 h-8 px-3.5 rounded-full text-[12px] font-semibold transition border ${
              type === t.code
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}>
            {t.label}
          </button>
        ))}
        <div className="ml-auto shrink-0">
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="h-8 rounded-full border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-500 focus:outline-none focus:border-slate-400">
            <option value="CLOSING">마감 임박순</option>
            <option value="LATEST">최신순</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2.5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[104px]" />)}</div>
      ) : data?.votes?.length ? (
        <div className="space-y-2.5">
          {data.votes.map((v: any) => (
            <Card key={v.id} as="link" to={`/fan/vote/${v.id}`} className="p-4">
              <div className="flex items-start gap-3.5">
                {v.athlete ? <AthleteAvatar athlete={v.athlete} size={46} /> : (
                  <div className="w-[46px] h-[46px] rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                    <Vote className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <Chip size="xs" tone="violet">{v.typeLabel}</Chip>
                    <Countdown ms={v.remainMs} closed={v.closed} />
                    {v.voted && <Chip size="xs" tone="emerald">참여함</Chip>}
                  </div>
                  <p className="text-[15px] font-bold text-slate-900 leading-snug">{v.title}</p>
                  {v.description && (
                    <p className="text-[13px] text-slate-400 mt-1 line-clamp-1">{v.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2.5 text-[12px] text-slate-400">
                    {v.athlete && <span className="font-semibold text-slate-500">{v.athlete.name}</span>}
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3 h-3" />{nf(v.participants)}명
                    </span>
                    {!v.closed && (
                      <span className="inline-flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {new Date(v.closeAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 마감
                      </span>
                    )}
                  </div>
                </div>
                {!v.closed && !v.voted && (
                  <span className="shrink-0 text-[12px] font-bold text-emerald-600 bg-emerald-50 rounded-full px-2.5 py-1">
                    +{v.earnPoints}P
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<Vote className="w-5 h-5" />}
          title={tab === 'MINE' ? '참여한 투표가 없습니다' : '해당하는 투표가 없습니다'}
          desc={tab === 'MINE' ? '투표에 참여하면 이곳에서 결과를 다시 확인할 수 있습니다.' : '다른 탭이나 유형을 확인해보세요.'} />
      )}

      {data?.notice && (
        <div className="mt-8">
          <Notice title="참여 원칙" items={[data.notice]} />
        </div>
      )}
    </div>
  );
}
