/**
 * F16 나의 SPONPIK 팬활동 `/fan/activity` — 시안 2026-09-15 (리디자인/9 · 27)
 *
 *  좌 사이드 내비(내 팬활동 · VOTE 참여 내역 · 응원한 선수 · 커뮤니티 내 활동 · 내 포인트 · 팬스토어 주문/방문 · 브랜드 추천 내역 · 연말 광고 이벤트)
 *  본문: 내가 응원하는 선수 · VOTE 참여 내역(횟수·최근 참여·다음 VOTE) · 커뮤니티 활동(게시글·응원 편지) · 보유 포인트(적립 예정)
 *       팬스토어(주문=브랜드 확정 회신 · 방문) · 브랜드 추천(추천 · 브랜드 전달) · 연말 광고 이벤트(조건 충족 n/3)
 *       최근 활동 타임라인 · 빠른 활동 4 · 브랜드 추천 현황 · 개인정보 관리
 *  우: 선수별 알림 설정(미구축 → 비활성 안내) · 주문/방문 지원(고객센터)
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, ArrowLeft, Bell, BellOff, ChevronRight, Coins, Gift, Heart, HelpCircle, Home, Lightbulb, Mail, Megaphone, MessageSquare,
  Settings, ShieldCheck, ShoppingBag, Vote, Wallet,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { AthleteAvatar, Skeleton, nf } from '../../components/fanhub/FanKit';
import { FanPage, Container, FanCrumb, Panel, fmtDate, fmtDateTime } from '../../components/fanhub/FanShell';

const NAV = [
  { key: 'top', icon: Home, label: '내 팬활동' }, { key: 'vote', icon: Vote, label: 'VOTE 참여 내역' }, { key: 'athletes', icon: Heart, label: '응원한 선수' },
  { key: 'community', icon: MessageSquare, label: '커뮤니티 내 활동' }, { key: 'points', icon: Coins, label: '내 포인트' }, { key: 'store', icon: ShoppingBag, label: '팬스토어 주문/방문' },
  { key: 'suggest', icon: Megaphone, label: '브랜드 추천 내역' }, { key: 'campaign', icon: Gift, label: '연말 광고 이벤트' },
];
const SUGGEST_STATUS: Record<string, { label: string; cls: string }> = {
  RECEIVED: { label: '접수', cls: 'bg-slate-100 text-slate-600' }, REVIEWING: { label: '검토 중', cls: 'bg-sky-50 text-sky-700' }, DELIVERED: { label: '브랜드 전달', cls: 'bg-emerald-50 text-emerald-700' },
  INTERESTED: { label: '브랜드 관심', cls: 'bg-amber-50 text-amber-700' }, ADOPTED: { label: '채택', cls: 'bg-emerald-600 text-white' }, ACCEPTED: { label: '채택', cls: 'bg-emerald-600 text-white' },
  HOLD: { label: '보류', cls: 'bg-slate-100 text-slate-500' }, CLOSED: { label: '종료', cls: 'bg-slate-100 text-slate-500' }, PENDING: { label: '접수', cls: 'bg-slate-100 text-slate-600' }, REJECTED: { label: '종료', cls: 'bg-slate-100 text-slate-500' },
};
const TL_ICON: Record<string, any> = { 'VOTE 참여': Vote, '응원 편지': Mail, '브랜드 추천': Megaphone, '팬스토어 활동': ShoppingBag, '커뮤니티 활동': MessageSquare, '관심선수 등록': Heart };

export default function FanActivity() {
  const { isAuthenticated, user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState('top');

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    api.getMyFanActivity().then((r) => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [isAuthenticated]);

  const go = (key: string) => { setActive(key); document.getElementById(`sec-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const s = data?.summary;
  const name = (user as any)?.nickname || (user as any)?.name || '팬';
  const campaign = data?.campaign;
  const met = campaign ? [campaign.diversity, campaign.continuity, campaign.letter].filter((m: any) => m.have >= m.need).length : 0;
  const favorites: any[] = data?.favorites?.length ? data.favorites : (data?.contributions || []).map((c: any) => c.athlete);

  const Head = ({ title, to, label = '전체 보기' }: { title: string; to?: string; label?: string }) => (
    <div className="flex items-center justify-between gap-2"><p className="text-[14.5px] font-extrabold">{title}</p>{to && <Link to={to} className="text-[12px] font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-0.5">{label} <ChevronRight className="w-3.5 h-3.5" /></Link>}</div>
  );

  return (
    <FanPage>
      <Container className="pt-5">
        <div className="grid grid-cols-1 lg:grid-cols-[210px_minmax(0,1fr)] gap-5 items-start">
          {/* ── 좌 내비 ── */}
          <aside className="lg:sticky lg:top-20 space-y-3">
            <Link to="/fan" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-600 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /> 팬 참여 홈으로</Link>
            <nav className="flex lg:flex-col gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {NAV.map((n) => { const I = n.icon; const on = active === n.key; return (
                <button key={n.key} type="button" onClick={() => go(n.key)} className={`shrink-0 h-11 px-3.5 rounded-xl text-[13px] font-bold inline-flex items-center gap-2.5 text-left whitespace-nowrap ${on ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-white'}`}><I className="w-4 h-4" /> {n.label}</button>
              ); })}
            </nav>
            <div className="hidden lg:block rounded-2xl bg-white border border-slate-200 p-4 text-center">
              <Heart className="w-8 h-8 text-rose-300 mx-auto fill-current" />
              <p className="mt-2 text-[12.5px] text-slate-600 break-keep">팬의 작은 행동이<br />선수의 큰 도약이 됩니다.</p>
              <Link to="/fan" className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-emerald-700">SPONPIK 팬 참여 가이드 <ChevronRight className="w-3.5 h-3.5" /></Link>
            </div>
          </aside>

          <div className="min-w-0">
            <FanCrumb items={[{ label: '팬 참여', to: '/fan' }, { label: '내 팬활동' }]} />
            <div id="sec-top" className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div><h1 className="text-[28px] sm:text-[34px] font-extrabold tracking-[-0.03em] leading-tight">나의 SPONPIK 팬활동 <Heart className="inline w-6 h-6 text-rose-400 fill-current" /></h1><p className="mt-1 text-[13.5px] text-slate-600 break-keep">팬활동을 한눈에 확인하고, 선수와 함께 더 큰 응원을 만들어가요.</p></div>
              <Link to="/fan" className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-[12.5px] font-bold text-slate-700 inline-flex items-center gap-1.5 hover:border-slate-400"><HelpCircle className="w-4 h-4" /> 활동 가이드</Link>
            </div>

            {!isAuthenticated ? (
              <Panel className="mt-5 max-w-lg text-center py-10"><p className="text-[16px] font-extrabold">로그인하면 내 팬활동을 한눈에 볼 수 있어요</p><Link to={`/login?returnUrl=${encodeURIComponent('/fan/activity')}`} className="mt-5 inline-flex h-11 px-6 rounded-xl bg-emerald-600 text-white text-[14px] font-bold items-center">로그인하기</Link></Panel>
            ) : loading ? (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[200px] rounded-2xl" />)}</div>
            ) : !data ? (
              <Panel className="mt-5 text-center py-10 text-slate-500">팬활동을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</Panel>
            ) : (
              <div className="mt-5 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_230px] gap-4 items-start">
                <div className="min-w-0 space-y-3">
                  {/* 1행 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-3">
                    <Panel className="!p-4"><div id="sec-athletes" />
                      <Head title="내가 응원하는 선수" to="/athletes/favorites" label="관리" />
                      {favorites.length ? (
                        <ul className="mt-3 space-y-2.5">{favorites.slice(0, 3).map((a: any) => <li key={a.id} className="flex items-center gap-2.5"><AthleteAvatar athlete={a} size={34} /><div className="min-w-0 flex-1"><p className="text-[13px] font-extrabold truncate">{a.name} 프로</p><p className="text-[11px] text-slate-500">{a.tour || (a.sportType === 'GOLF' || !a.sportType ? '골프' : a.sportType)}</p></div><Heart className="w-4 h-4 text-rose-400 fill-current shrink-0" /></li>)}</ul>
                      ) : <p className="mt-3 text-[12.5px] text-slate-500 break-keep">아직 응원하는 선수가 없어요.</p>}
                      <Link to={favorites.length ? '/athletes/favorites' : '/athletes'} className="mt-3 h-9 w-full rounded-lg border border-slate-200 text-[12px] font-bold text-slate-700 inline-flex items-center justify-center hover:border-slate-400">{favorites.length ? '전체 선수 보기' : '선수 찾기'}</Link>
                    </Panel>
                    <Panel className="!p-4"><div id="sec-vote" />
                      <Head title="VOTE 참여 내역" to="/fan/vote?tab=MINE" />
                      <p className="mt-2 text-[26px] font-black tabular-nums leading-none">{nf(s.votes)}<span className="text-[13px] font-bold text-slate-500 ml-0.5">회</span></p>
                      <dl className="mt-3 space-y-1.5 text-[12px]">
                        <div className="flex justify-between gap-2"><dt className="text-slate-500">최근 참여</dt><dd className="font-bold tabular-nums">{s.lastVoteAt ? fmtDate(s.lastVoteAt) : '—'}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-slate-500">다음 VOTE</dt><dd className="font-bold tabular-nums text-right">{data.nextVote ? <Link to={`/fan/vote/${data.nextVote.id}`} className="text-emerald-700 hover:underline">{fmtDate(data.nextVote.closeAt)} 마감</Link> : '진행 중인 VOTE 없음'}</dd></div>
                      </dl>
                      <span aria-hidden className="mt-2 block text-right"><Vote className="inline w-8 h-8 text-emerald-200" /></span>
                    </Panel>
                    <Panel className="!p-4"><div id="sec-community" />
                      <Head title="커뮤니티 활동" to="/fan/community" />
                      <dl className="mt-3 space-y-2 text-[13px]">
                        <div className="flex justify-between gap-2"><dt className="text-slate-600">게시글</dt><dd className="font-black tabular-nums text-[18px] leading-none">{nf(s.posts)}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-slate-600">응원 편지</dt><dd className="font-black tabular-nums text-[18px] leading-none">{nf(s.letters)}</dd></div>
                      </dl>
                      <span aria-hidden className="mt-3 block text-right"><MessageSquare className="inline w-8 h-8 text-emerald-200" /></span>
                    </Panel>
                    <Panel className="!p-4"><div id="sec-points" />
                      <Head title="보유 포인트" to="/fan/points/ledger" label="내역 보기" />
                      <p className="mt-2 text-[26px] font-black tabular-nums leading-none text-emerald-700">{nf(s.balance)}<span className="text-[13px] font-bold ml-0.5">P</span></p>
                      <p className="mt-2 text-[12px] text-slate-500">적립 예정 <b className="text-emerald-700 tabular-nums">+{nf(s.pending)}P</b></p>
                      {data.points?.badge && <p className="mt-1 text-[11.5px] text-slate-500">배지 <b className="text-slate-700">{data.points.badge.label}</b>{data.points.nextBadge ? ` · 다음까지 ${nf(data.points.nextBadge.remaining)}P` : ''}</p>}
                      <span aria-hidden className="mt-2 block text-right"><Wallet className="inline w-8 h-8 text-amber-200" /></span>
                    </Panel>
                  </div>

                  {/* 2행 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Panel className="!p-4"><div id="sec-store" />
                      <Head title="팬스토어" to="/fan/store" />
                      <dl className="mt-3 space-y-2 text-[13px]">
                        <div className="flex justify-between gap-2"><dt className="text-slate-600">주문 <span className="text-[10.5px] text-slate-400">(브랜드 확정)</span></dt><dd className="font-black tabular-nums text-[18px] leading-none">{nf(s.storePurchases)}<span className="text-[11px] font-bold text-slate-500 ml-0.5">건</span></dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-slate-600">방문</dt><dd className="font-black tabular-nums text-[18px] leading-none">{nf(s.storeVisits)}<span className="text-[11px] font-bold text-slate-500 ml-0.5">회</span></dd></div>
                      </dl>
                      <span aria-hidden className="mt-3 block text-right"><ShoppingBag className="inline w-8 h-8 text-emerald-200" /></span>
                    </Panel>
                    <Panel className="!p-4"><div id="sec-suggest" />
                      <Head title="브랜드 추천" to={favorites[0] ? `/fan/brand-suggest/${favorites[0].id}` : '/fan/community'} label="전체 보기" />
                      <dl className="mt-3 space-y-2 text-[13px]">
                        <div className="flex justify-between gap-2"><dt className="text-slate-600">추천</dt><dd className="font-black tabular-nums text-[18px] leading-none">{nf(s.suggestions)}<span className="text-[11px] font-bold text-slate-500 ml-0.5">건</span></dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-slate-600">브랜드 전달</dt><dd className="font-black tabular-nums text-[18px] leading-none">{nf(s.suggestionsDelivered)}<span className="text-[11px] font-bold text-slate-500 ml-0.5">건</span></dd></div>
                      </dl>
                      <span aria-hidden className="mt-3 block text-right"><Megaphone className="inline w-8 h-8 text-emerald-200" /></span>
                    </Panel>
                    <Panel className="!p-4"><div id="sec-campaign" />
                      <Head title="연말 광고 이벤트" to="/fan/campaign" />
                      {campaign ? (
                        <>
                          <p className="mt-2 text-[12px] text-slate-600">참여 조건 충족</p>
                          <p className="text-[26px] font-black tabular-nums leading-none text-emerald-700">{met}<span className="text-[13px] text-slate-500 font-bold"> / 3</span></p>
                          <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${(met / 3) * 100}%` }} /></div>
                          <p className="mt-1.5 text-[11px] text-slate-500">활동 다양성 {campaign.diversity.have}/{campaign.diversity.need} · 지속성 {campaign.continuity.have}/{campaign.continuity.need}주 · 편지 {campaign.letter.have}/{campaign.letter.need}</p>
                        </>
                      ) : <p className="mt-3 text-[12.5px] text-slate-500 break-keep">응원 활동을 시작하면 참여 자격 현황이 표시됩니다.</p>}
                    </Panel>
                  </div>

                  {/* 3행: 타임라인 + 빠른 활동/추천 현황 */}
                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3">
                    <Panel>
                      <Head title="최근 활동 타임라인" to="/fan/points/ledger" label="전체 보기" />
                      {data.timeline?.length ? (
                        <ul className="mt-3 divide-y divide-slate-100">
                          {data.timeline.map((t: any) => { const I = TL_ICON[t.label] || Activity; return (
                            <li key={t.id} className="py-2.5 grid grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-cols-[auto_120px_minmax(0,1fr)_auto_auto] items-center gap-3 text-[12.5px]">
                              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 inline-flex items-center justify-center"><I className="w-4 h-4" /></span>
                              <span className="font-bold text-slate-800 hidden sm:block">{t.label}</span>
                              <span className="text-slate-700 truncate">{t.athlete?.name ? `${t.athlete.name} 프로 · ` : ''}{t.label}</span>
                              <span className="text-slate-500 tabular-nums text-[11.5px] hidden sm:block">{fmtDateTime(t.at)}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${t.validity === 'VALID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{t.validity === 'VALID' ? '완료' : '검토 중'}</span>
                            </li>
                          ); })}
                        </ul>
                      ) : <p className="mt-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 py-8 text-center text-[13px] text-slate-500">아직 활동 기록이 없습니다. 투표나 커뮤니티 응원으로 첫 활동을 남겨보세요.</p>}
                      <Link to="/fan/points/ledger" className="mt-3 h-10 w-full rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-700 inline-flex items-center justify-center hover:border-slate-400">더 다양한 활동 내역 보기</Link>
                    </Panel>
                    <div className="space-y-3">
                      <Panel>
                        <p className="text-[14.5px] font-extrabold">빠른 활동</p>
                        <div className="mt-3 grid grid-cols-4 gap-2">
                          {[{ icon: Vote, l: 'VOTE 참여', to: '/fan/vote' }, { icon: Heart, l: '응원 보내기', to: favorites[0] ? `/fan/letter/${favorites[0].id}` : '/fan/community' }, { icon: Megaphone, l: '브랜드 추천', to: favorites[0] ? `/fan/brand-suggest/${favorites[0].id}` : '/fan/community' }, { icon: ShoppingBag, l: '팬스토어', to: '/fan/store' }].map((q) => { const I = q.icon; return (
                            <Link key={q.l} to={q.to} className="rounded-xl border border-slate-200 bg-white py-3 flex flex-col items-center gap-1.5 hover:border-emerald-400"><span className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 inline-flex items-center justify-center"><I className="w-4 h-4" /></span><span className="text-[11px] font-bold text-slate-700">{q.l}</span></Link>
                          ); })}
                        </div>
                      </Panel>
                      <Panel>
                        <div className="flex items-center justify-between gap-2"><p className="text-[14.5px] font-extrabold">선택한 브랜드 추천 현황</p>{data.suggestions?.[0] && <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${(SUGGEST_STATUS[data.suggestions[0].status] || SUGGEST_STATUS.RECEIVED).cls}`}>{(SUGGEST_STATUS[data.suggestions[0].status] || SUGGEST_STATUS.RECEIVED).label}</span>}</div>
                        {data.suggestions?.length ? (
                          <>
                            <p className="mt-2 text-[14px] font-extrabold">{data.suggestions[0].brandName || data.suggestions[0].category}</p>
                            <p className="text-[11.5px] text-slate-500">추천일 {fmtDate(data.suggestions[0].createdAt)} · {data.suggestions[0].athlete?.name} 프로</p>
                            {data.suggestions.length > 1 && <ul className="mt-2 divide-y divide-slate-100">{data.suggestions.slice(1, 4).map((sg: any) => { const st = SUGGEST_STATUS[sg.status] || SUGGEST_STATUS.RECEIVED; return <li key={sg.id} className="py-1.5 flex items-center gap-2 text-[12px]"><span className="flex-1 truncate font-bold text-slate-700">{sg.brandName || sg.category}</span><span className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold ${st.cls}`}>{st.label}</span></li>; })}</ul>}
                            <Link to={`/fan/brand-suggest/${data.suggestions[0].athlete?.id || ''}`} className="mt-3 h-9 w-full rounded-lg border border-slate-200 text-[12px] font-bold text-slate-700 inline-flex items-center justify-center hover:border-slate-400">추천 내역 보기</Link>
                          </>
                        ) : <p className="mt-2 text-[12.5px] text-slate-500 break-keep">아직 추천한 브랜드가 없어요. <Link to="/fan/community" className="font-bold text-emerald-700">선수 커뮤니티</Link>에서 추천할 수 있습니다.</p>}
                      </Panel>
                    </div>
                  </div>

                  {/* 개인정보 관리 */}
                  <Panel className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="min-w-0 flex-1"><p className="text-[14px] font-extrabold inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-700" /> 개인정보 관리</p><p className="text-[12px] text-slate-500 break-keep">개인정보는 안전하게 보호되며, 언제든지 관리할 수 있습니다.</p></div>
                    <div className="flex flex-wrap gap-2">
                      <Link to="/contact" className="h-9 px-3.5 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-700 inline-flex items-center hover:border-slate-400">개인정보 다운로드 요청</Link>
                      <Link to="/contact" className="h-9 px-3.5 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-700 inline-flex items-center hover:border-slate-400">개인정보 삭제 요청</Link>
                      <Link to="/fan/badges" className="h-9 px-3.5 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-700 inline-flex items-center gap-1 hover:border-slate-400"><Settings className="w-3.5 h-3.5" /> 계정 관리</Link>
                    </div>
                  </Panel>
                </div>

                {/* ── 우 ── */}
                <aside className="space-y-3">
                  <Panel className="!p-4">
                    <p className="text-[14px] font-extrabold inline-flex items-center gap-1">선수별 알림 설정 <HelpCircle className="w-3.5 h-3.5 text-slate-400" /></p>
                    {favorites.length ? (
                      <ul className="mt-3 space-y-2">
                        {favorites.slice(0, 3).map((a: any) => (
                          <li key={a.id} className="rounded-xl border border-slate-200 p-3">
                            <div className="flex items-center gap-2"><AthleteAvatar athlete={a} size={30} /><div className="min-w-0 flex-1"><p className="text-[12.5px] font-extrabold truncate">{a.name} 프로</p><p className="text-[10.5px] text-slate-500">{a.tour || '골프'}</p></div></div>
                            <div className="mt-2 grid grid-cols-4 gap-1 opacity-50">{['VOTE', '공지', '이벤트', '스토어'].map((k) => <span key={k} className="flex flex-col items-center gap-0.5 text-[10px] text-slate-500"><BellOff className="w-3.5 h-3.5" />{k}</span>)}</div>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="mt-2 text-[12px] text-slate-500 break-keep">응원하는 선수를 등록하면 알림을 설정할 수 있어요.</p>}
                    <button type="button" disabled className="mt-3 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 text-[12px] font-bold text-slate-400 inline-flex items-center justify-center gap-1 cursor-not-allowed"><Bell className="w-3.5 h-3.5" /> 알림 설정 관리 <span className="px-1.5 rounded bg-slate-200 text-slate-500 text-[10px]">준비 중</span></button>
                  </Panel>
                  <Panel className="!p-4">
                    <p className="text-[14px] font-extrabold">주문/방문 지원</p>
                    <p className="mt-1 text-[12px] text-slate-500 break-keep">팬스토어 주문, 배송, 교환/환불은 브랜드 스토어에서 처리되며 문의는 고객센터로 연결됩니다.</p>
                    <Link to="/contact" className="mt-3 h-9 w-full rounded-lg border border-slate-200 text-[12px] font-bold text-slate-700 inline-flex items-center justify-center gap-1 hover:border-slate-400">고객센터 바로가기 <ChevronRight className="w-3.5 h-3.5" /></Link>
                  </Panel>
                  <Link to="/fan/community" className="block rounded-2xl bg-[#0a1411] text-white p-4 hover:bg-[#0e1a16]"><p className="text-[11px] font-extrabold tracking-[0.2em] text-emerald-300 inline-flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5" /> TIP</p><p className="mt-1.5 text-[13.5px] font-extrabold break-keep">{name}님, 오늘의 응원 한 줄이 팬온도를 올려요</p><p className="mt-1 text-[11.5px] text-white/70 break-keep">커뮤니티 응원은 24시간 뒤 확정되어 포인트로 적립됩니다.</p></Link>
                </aside>
              </div>
            )}
          </div>
        </div>
      </Container>
    </FanPage>
  );
}
