/**
 * 팬 참여 — 팬 VOTE (리디자인 v2.0 시안 img_07)
 *
 * 진행 중인 투표와 "참여가 무엇으로 이어지는지"를 한 화면에서 보여준다.
 * 팬온도·포인트 수치는 서버 정책표(`/fan-engage/rules`)와 원장 값만 쓴다 (LEG-06).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3, ChevronRight, Coins, Loader2, Thermometer, Trophy, Users, Vote as VoteIcon,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';

const isClosed = (closeAt: string) => new Date(closeAt).getTime() <= Date.now();

/** 남은 기간 라벨 — 마감된 건은 '마감됨' 하나만 쓴다 */
const dday = (closeAt: string) => {
  const diff = new Date(closeAt).getTime() - Date.now();
  if (diff <= 0) return '마감됨';
  const d = Math.floor(diff / 86400000);
  if (d >= 1) return `마감 D-${d}`;
  return `마감 ${Math.floor(diff / 3600000)}시간 전`;
};

/** 선택지는 문자열 배열 또는 {id,label} 배열로 들어온다 */
const optionLabel = (o: any) => (typeof o === 'string' ? o : o?.label || o?.id || '');

export default function FanVote() {
  const [votes, setVotes] = useState<any[]>([]);
  const [rules, setRules] = useState<any>(null);
  const [temp, setTemp] = useState<any>(null);
  const [focusAthlete, setFocusAthlete] = useState<any>(null);
  const [suggest, setSuggest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [v, r, l]: any[] = await Promise.all([
          api.getVotes({ status: 'OPEN', page: 1, pageSize: 12 }),
          api.getFanEngageRules(),
          api.getCommunityAthletes({ limit: 1 }),
        ]);
        setVotes(v?.data || []);
        setRules(r?.data || null);

        /* 대표 선수 — 진행 중 투표의 대상 선수를 우선하고, 없으면 팬온도 1위 */
        const list = v?.data || [];
        const withPlayer = list.find((x: any) => x?.target?.playerId);
        const athleteId = withPlayer?.target?.playerId || l?.data?.athletes?.[0]?.id;
        if (athleteId) {
          const [t, b, a]: any[] = await Promise.all([
            api.getFanTemperature(athleteId),
            api.getBrandSuggestions(athleteId),
            api.getPickAthlete(athleteId).catch(() => null),
          ]);
          setTemp(t?.data || null);
          setSuggest(b?.data || null);
          setFocusAthlete({
            id: athleteId,
            linked: !!withPlayer,
            ...(a?.data?.athlete || l?.data?.athletes?.[0] || {}),
          });
        }
      } finally { setLoading(false); }
    })();
  }, []);

  /* 마감 전 투표를 앞에 세운다 — 마감된 건은 참여할 수 없다 */
  const ordered = useMemo(
    () => [...votes].sort((a, b) => Number(isClosed(a.closeAt)) - Number(isClosed(b.closeAt))),
    [votes],
  );
  const [featured, ...rest] = ordered;
  const voteRule = useMemo(() => (rules?.rules || []).find((r: any) => r.source === 'VOTE'), [rules]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16">
      <PublicHeader />

      <div className="max-w-[1400px] mx-auto px-5 pt-6">
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[12.5px]">
          <Link to="/" className="text-slate-400 hover:text-slate-600">홈</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-400">팬 참여</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-emerald-700">팬 VOTE</span>
        </nav>

        <div className="mt-4 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-5 items-start">
          <div>
            <h1 className="text-[26px] sm:text-[34px] font-black tracking-tight break-keep">
              한 표가 선수의 다음 기회를 만듭니다
            </h1>
            <p className="mt-2.5 text-[13.5px] text-slate-500 break-keep">
              예측과 응원이 팬온도 · 팬포인트 · 선수 추천지수에 함께 반영됩니다.
            </p>
          </div>

          {/* 팬온도 카드 */}
          {temp && focusAthlete && (
            <div className="rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
              <span className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <Thermometer className="w-6 h-6 text-emerald-600" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] text-slate-500">
                  {focusAthlete.linked ? `${focusAthlete.name} 프로의 팬온도` : `팬온도 1위 · ${focusAthlete.name} 프로`}
                </p>
                <p className="mt-0.5 flex items-baseline gap-2">
                  <span className="text-[30px] font-black text-emerald-600 tabular-nums">{temp.celsius.toFixed(1)}</span>
                  <span className="text-[15px] font-bold text-emerald-600">℃</span>
                  {!!temp.weeklyDelta && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11.5px] font-bold">
                      이번 주 +{temp.weeklyDelta.toFixed(1)}℃
                    </span>
                  )}
                </p>
                <p className="mt-1 text-[11.5px] text-slate-400">
                  응원한 팬 {temp.fanCount}명 · 원장에 기록된 활동만 반영합니다
                </p>
              </div>
              <Link to={`/fan/community/${focusAthlete.id}`} className="shrink-0 text-slate-300 hover:text-emerald-600" aria-label="커뮤니티로">
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>

        <div className="mt-6 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-5 items-start">
          {/* 좌: 투표 */}
          <div className="space-y-4">
            {!featured ? (
              <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
                <VoteIcon className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="mt-3 text-[14px] font-bold text-slate-600">진행 중인 투표가 없습니다</p>
                <p className="mt-1 text-[12.5px] text-slate-400">새 투표가 열리면 여기에서 바로 참여할 수 있어요.</p>
                <Link to="/votes" className="mt-5 inline-flex h-11 px-5 items-center rounded-xl border border-slate-200 text-sm font-bold text-slate-600">
                  지난 투표 보기
                </Link>
              </div>
            ) : (
              <article className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-[11.5px] font-black ${
                    isClosed(featured.closeAt) ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {isClosed(featured.closeAt) ? '집계 중' : '진행 중'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11.5px] font-black">{dday(featured.closeAt)}</span>
                </div>
                <h2 className="mt-3.5 text-[20px] sm:text-[23px] font-black leading-snug break-keep">{featured.title}</h2>
                {featured.description && (
                  <p className="mt-1.5 text-[13px] text-slate-500 break-keep">{featured.description}</p>
                )}

                <div className="mt-4 grid sm:grid-cols-2 gap-2">
                  {(featured.options || []).slice(0, 4).map((o: any, i: number) => (
                    <Link
                      key={optionLabel(o) || i}
                      to={`/votes/${featured.id}`}
                      className="h-12 inline-flex items-center gap-2 px-4 rounded-xl border border-slate-200 text-[14px] font-bold text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
                    >
                      <span className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                      {optionLabel(o)}
                    </Link>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500">
                    <Users className="w-4 h-4 text-slate-400" /> {(featured._count?.participations ?? 0).toLocaleString()}명 참여
                  </span>
                  {voteRule && (
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500">
                      <Coins className="w-4 h-4 text-slate-400" /> 참여 +{voteRule.points}P
                    </span>
                  )}
                  <Link
                    to={`/votes/${featured.id}`}
                    className="ml-auto h-11 px-6 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700"
                  >
                    {isClosed(featured.closeAt) ? '결과 보기' : '투표하기'} <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            )}

            {rest.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {rest.slice(0, 4).map((v: any) => (
                  <Link
                    key={v.id}
                    to={`/votes/${v.id}`}
                    className="rounded-2xl border border-slate-200 p-4 hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                        isClosed(v.closeAt) ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isClosed(v.closeAt) ? '집계 중' : '진행 중'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold">{dday(v.closeAt)}</span>
                    </div>
                    <p className="mt-2.5 text-[14px] font-extrabold leading-snug break-keep line-clamp-2">{v.title}</p>
                    <p className="mt-2.5 flex items-center gap-3 text-[11.5px] text-slate-400">
                      <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {(v._count?.participations ?? 0).toLocaleString()}명</span>
                      {voteRule && <span className="inline-flex items-center gap-1"><Coins className="w-3.5 h-3.5" /> +{voteRule.points}P</span>}
                    </p>
                  </Link>
                ))}
              </div>
            )}

            <Link to="/votes" className="w-full h-12 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-[13.5px] font-bold text-slate-600 hover:bg-slate-50">
              전체 투표 보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 우: 반영 안내 + 브랜드 추천 */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="text-center text-[15px] font-extrabold">투표하면 이렇게 반영돼요</h2>
              <ol className="mt-4 space-y-2.5">
                {[
                  { icon: Coins, title: '팬포인트', value: voteRule ? `+${voteRule.points}P` : '적립' },
                  { icon: Thermometer, title: '투표 대상 선수의 팬온도', value: voteRule ? `+${voteRule.celsius}℃ 상승` : '상승' },
                  { icon: BarChart3, title: '브랜드 추천지수', value: '반영' },
                ].map((s, i) => (
                  <li key={s.title} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3.5">
                    <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 text-[12px] font-black flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <s.icon className="w-4 h-4 text-emerald-600" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12.5px] text-slate-500">{s.title}</span>
                      <span className="block text-[14px] font-extrabold">{s.value}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-[11px] text-slate-400 break-keep text-center">
                팬온도는 활동 원장에 기록된 값만 합산합니다.
              </p>
            </div>

            {focusAthlete && (
              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-[14px] font-extrabold">팬이 찾은 어울리는 브랜드</p>
                {suggest?.summary?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {suggest.summary.slice(0, 6).map((s: any) => (
                      <span key={s.category} className="px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-600">
                        {s.category} {s.total}표
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[12.5px] text-slate-400 break-keep">아직 모인 추천이 없어요. 첫 추천을 남겨보세요.</p>
                )}
                <p className="mt-3 text-[11.5px] text-slate-400 break-keep">
                  팬 추천은 검토 후 선수의 브랜드 적합도에 반영됩니다.
                </p>
                <Link
                  to={`/fan/community/${focusAthlete.id}`}
                  className="mt-3 w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold hover:bg-emerald-700"
                >
                  브랜드 추천하기 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </aside>
        </div>

        {/* 시즌 리워드 */}
        <Link
          to="/ranking"
          className="mt-6 rounded-2xl border border-slate-200 px-5 py-4 flex items-center gap-3 hover:border-emerald-300 transition-colors"
        >
          <span className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
            <Trophy className="w-4 h-4 text-white" />
          </span>
          <p className="text-[13.5px] font-bold break-keep">
            올해의 응원 기록이 쌓이면 팬 랭킹과 시즌 리워드 후보에 함께 올라갑니다.
          </p>
          <span className="ml-auto inline-flex items-center gap-1 text-[13px] font-bold text-emerald-700 shrink-0">
            팬 랭킹 보기 <ChevronRight className="w-4 h-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}
