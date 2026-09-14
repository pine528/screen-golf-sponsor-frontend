/**
 * 선수 상세 상단 4축 Snapshot + 탭 — UI/UX 통합 가이드 v1.0 §10.2
 *
 * 한 선수의 "경기 가치 + 브랜드 후원 가치 + 팬 가치 + 콘텐츠 가치"가 한 화면에서 연결되어 보이게 한다.
 * 브랜드에게는 후원 CTA를, 팬에게는 응원 CTA를 강조한다. 측정되지 않은 값은 "집계 중" (LEG-06).
 * 팬온도는 실력 점수가 아니라 최근 팬 활동 신호라는 설명을 항상 붙인다 (§11.4 고정 문구).
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Heart, Info, Share2, Trophy } from 'lucide-react';
import { api } from '../../services/api';
import { FAN_TEMP_NOTE } from '../fanhub/FanKit';

export type AthleteTab = 'profile' | 'games' | 'sponsor' | 'fan' | 'content';
const TABS: { key: AthleteTab; label: string; desc: string }[] = [
  { key: 'profile', label: '프로필', desc: '기본 정보 · 운영 현황' },
  { key: 'games', label: '경기', desc: '경기 결과 · 추이 · 일정' },
  { key: 'sponsor', label: '후원', desc: '슬롯 · 경매 · 구매' },
  { key: 'fan', label: '팬', desc: '팬온도 · 응원' },
  { key: 'content', label: '콘텐츠', desc: 'SNS · 유튜브 · ROI' },
];

export default function AthleteSnapshot({
  athlete, eventResults, slotInstances, social, youtube, userRole, tab, onTab,
}: {
  athlete: any; eventResults: any[]; slotInstances: any[]; social: Record<string, string>; youtube: any; userRole?: string;
  tab: AthleteTab; onTab: (t: AthleteTab) => void;
}) {
  const id = athlete.id as string;
  const { data: tempResp } = useQuery({
    queryKey: ['fan-temperature', id],
    queryFn: () => api.getFanTemperature(id),
    enabled: !!id,
    retry: 0,
  });
  const temp: any = tempResp?.data || null;

  /* 경기 — 최근 5경기 평균 순위·TOP10 (실측 없으면 집계 중) */
  const recent = [...(eventResults || [])]
    .filter((r) => r.rank != null)
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
    .slice(0, 5);
  const avgRank = recent.length ? Math.round(recent.reduce((s, r) => s + Number(r.rank), 0) / recent.length) : null;
  const top10 = recent.length ? recent.filter((r) => Number(r.rank) <= 10).length : null;

  /* 브랜드 — 모집 중 슬롯 · 협업 브랜드 */
  const open = (slotInstances || []).filter((s) => s.status === 'OPEN' || s.status === 'IN_AUCTION').length;
  const sponsors = Array.isArray(athlete.primarySponsors) ? athlete.primarySponsors.length : 0;

  /* 콘텐츠 — SNS 채널 수 · 유튜브 구독자(수집된 경우만) */
  const channels = Object.values(social || {}).filter(Boolean).length;
  const subs: number | null = youtube?.channel?.subscriberCount ?? youtube?.subscriberCount ?? null;

  const isFan = userRole === 'FAN';

  const cards = [
    {
      key: 'games', icon: Trophy, tone: 'bg-sky-50 text-sky-600', title: '경기',
      rows: [
        { k: '최근 5경기', v: avgRank != null ? `평균 ${avgRank}위` : null },
        { k: 'TOP10', v: top10 != null ? `${top10}회` : null },
      ],
      cta: { label: '경기 상세', onClick: () => onTab('games') },
    },
    {
      key: 'brand', icon: BarChart3, tone: 'bg-emerald-50 text-emerald-600', title: '브랜드',
      rows: [
        { k: '모집 중 슬롯', v: `${open}개` },
        { k: '협업 브랜드', v: sponsors ? `${sponsors}곳` : '아직 없음' },
      ],
      cta: { label: '이 선수 후원하기', to: `/sponsor/direct/build/${id}`, primary: !isFan },
    },
    {
      key: 'fan', icon: Heart, tone: 'bg-rose-50 text-rose-500', title: '팬',
      rows: [
        { k: '팬온도', v: temp?.score != null && temp.score > 0 ? `${Number(temp.score).toFixed(1)}℃` : null, note: FAN_TEMP_NOTE },
        { k: '표본', v: temp?.sampleSize != null ? `최근 30일 ${temp.sampleSize}건` : null },
      ],
      cta: { label: '응원하기', onClick: () => onTab('fan'), primary: isFan },
    },
    {
      key: 'content', icon: Share2, tone: 'bg-violet-50 text-violet-600', title: '콘텐츠',
      rows: [
        { k: 'SNS 채널', v: channels ? `${channels}개` : '미등록' },
        { k: '유튜브 구독', v: subs != null ? `${subs >= 10000 ? `${(subs / 10000).toFixed(1)}만` : subs.toLocaleString()}` : null },
      ],
      cta: { label: '콘텐츠 보기', onClick: () => onTab('content') },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      {/* 4축 Snapshot */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => {
          const I = c.icon;
          return (
            <section key={c.key} className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col">
              <div className="flex items-center gap-2">
                <span className={`w-8 h-8 rounded-lg inline-flex items-center justify-center ${c.tone}`}><I className="w-4 h-4" /></span>
                <h2 className="text-[14px] font-extrabold text-slate-900">{c.title}</h2>
              </div>
              <dl className="mt-3 space-y-1.5 flex-1">
                {c.rows.map((r) => (
                  <div key={r.k} className="flex items-baseline justify-between gap-2 text-[13px]">
                    <dt className="text-slate-500 inline-flex items-center gap-1">
                      {r.k}
                      {'note' in r && r.note && <Info className="w-3.5 h-3.5 text-slate-400" aria-label={r.note} />}
                    </dt>
                    <dd className="font-bold text-slate-900 tabular-nums text-right">
                      {r.v ?? <span className="text-slate-500 font-semibold">집계 중</span>}
                    </dd>
                  </div>
                ))}
              </dl>
              {'to' in c.cta && c.cta.to ? (
                <Link
                  to={c.cta.to}
                  className={`mt-3 h-10 inline-flex items-center justify-center gap-1 rounded-xl text-[13px] font-bold transition-colors ${
                    c.cta.primary ? (c.key === 'fan' ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-emerald-600 text-white hover:bg-emerald-700')
                      : 'border border-slate-200 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {c.cta.label} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <button
                  onClick={'onClick' in c.cta ? c.cta.onClick : undefined}
                  className={`mt-3 h-10 inline-flex items-center justify-center gap-1 rounded-xl text-[13px] font-bold transition-colors ${
                    'primary' in c.cta && c.cta.primary ? 'bg-rose-500 text-white hover:bg-rose-600' : 'border border-slate-200 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {c.cta.label} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </section>
          );
        })}
      </div>
      <p className="mt-2 text-[12.5px] text-slate-500 flex items-start gap-1.5 break-keep">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {FAN_TEMP_NOTE}
      </p>

      {/* 탭 — 한 탭에 모든 데이터를 몰아넣지 않는다 (§10.2) */}
      <nav aria-label="선수 상세 구간" className="mt-4 sticky top-16 z-20 bg-slate-50/95 backdrop-blur -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 border-b border-slate-200">
        <ul role="tablist" className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const on = tab === t.key;
            return (
              <li key={t.key} className="shrink-0">
                <button
                  role="tab"
                  aria-selected={on}
                  onClick={() => onTab(t.key)}
                  title={t.desc}
                  className={`h-10 px-4 rounded-full text-[13.5px] font-bold transition-colors ${on ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-white hover:text-emerald-700'}`}
                >
                  {t.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
