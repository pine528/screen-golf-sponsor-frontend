/**
 * 팬 참여 — 선수 커뮤니티 (리디자인 v2.0 시안 img_06)
 *
 * 응원 글 · 팬레터 · 브랜드 추천이 팬온도로 이어진다.
 * 팬온도와 구성은 서버 원장 값을 그대로 쓴다 (LEG-06 — 추정치 표시 금지).
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Bookmark, ChevronRight, Heart, Loader2, Mail, MessageCircle,
  PenLine, Search, Send, Thermometer,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  NOTICE: { label: '선수 소식', cls: 'text-emerald-600' },
  CHEER: { label: '팬 응원', cls: 'text-slate-500' },
  LETTER: { label: '팬레터', cls: 'text-rose-500' },
  MATCH_TALK: { label: '경기 이야기', cls: 'text-sky-600' },
  BRAND: { label: '브랜드 추천', cls: 'text-amber-600' },
};

const ago = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  if (m < 1440) return `${Math.floor(m / 60)}시간 전`;
  return `${Math.floor(m / 1440)}일 전`;
};

export default function FanCommunity() {
  const { athleteId } = useParams();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') || 'ALL';

  const [rules, setRules] = useState<any>(null);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [board, setBoard] = useState<any>(null);
  const [temp, setTemp] = useState<any>(null);
  const [suggest, setSuggest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [mode, setMode] = useState<'CHEER' | 'LETTER'>('CHEER');
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [category, setCategory] = useState('');
  const [brandName, setBrandName] = useState('');
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  /* 선수 목록 — 커뮤니티 대상 선택 */
  useEffect(() => {
    (async () => {
      const [r, l]: any[] = await Promise.all([
        api.getFanEngageRules(),
        api.getCommunityAthletes({}),
      ]);
      setRules(r?.data || null);
      const list = l?.data?.athletes || [];
      setAthletes(list);
      if (!athleteId && list[0]) navigate(`/fan/community/${list[0].id}`, { replace: true });
      setLoading(false);
    })();
  }, [athleteId, navigate]);

  const loadBoard = useCallback(async () => {
    if (!athleteId) return;
    const [b, t, s]: any[] = await Promise.all([
      api.getCommunityPosts(athleteId, tab),
      api.getEngageTemperature(athleteId),
      api.getBrandSuggestions(athleteId),
    ]);
    setBoard(b?.data || null);
    setTemp(t?.data || null);
    setSuggest(s?.data || null);
  }, [athleteId, tab]);
  useEffect(() => { loadBoard(); }, [loadBoard]);

  const needLogin = (e: any) => {
    if (e?.response?.status === 401) {
      navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return true;
    }
    return false;
  };

  const submitPost = async () => {
    if (!draft.trim()) return;
    setPosting(true); setErr(null); setMsg(null);
    try {
      const r: any = await api.createCommunityPost(athleteId!, { type: mode, content: draft.trim() });
      setDraft('');
      setMsg(r?.data?.awarded
        ? `${mode === 'LETTER' ? '팬레터를 보냈어요' : '응원 글을 남겼어요'} · 팬온도 +${
            (mode === 'LETTER' ? rules?.rules?.find((x: any) => x.source === 'LETTER')?.celsius : rules?.rules?.find((x: any) => x.source === 'COMMUNITY')?.celsius) ?? 0
          }℃`
        : '등록했어요');
      await loadBoard();
    } catch (e: any) {
      if (needLogin(e)) return;
      setErr(e?.response?.data?.error?.message || '등록하지 못했습니다');
    } finally { setPosting(false); }
  };

  const like = async (postId: string) => {
    try {
      await api.likeCommunityPost(postId);
      await loadBoard();
    } catch (e: any) { needLogin(e); }
  };

  const submitSuggest = async () => {
    if (!category) { setErr('카테고리를 선택해주세요'); return; }
    setErr(null); setMsg(null);
    try {
      const r: any = await api.suggestBrand(athleteId!, { category, brandName, reason });
      setBrandName(''); setReason(''); setCategory('');
      setMsg(r?.data?.awarded ? '추천 고맙습니다 · 팬온도 +0.1℃ · 팬포인트 +10P' : '추천이 접수되었어요');
      await loadBoard();
    } catch (e: any) {
      if (needLogin(e)) return;
      setErr(e?.response?.data?.error?.message || '추천을 보내지 못했습니다');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
      </div>
    );
  }

  const a = board?.athlete;
  const filteredAthletes = q.trim() ? athletes.filter((x) => x.name.includes(q.trim())) : athletes;

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16">
      <PublicHeader />

      {/* 히어로 */}
      <section className="bg-gradient-to-b from-[#f2faf5] to-white border-b border-slate-100 px-5 pt-6 pb-7">
        <div className="max-w-[1400px] mx-auto">
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[12.5px] mb-4">
            <Link to="/" className="text-slate-500 hover:text-slate-600">홈</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-500">팬 참여</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-emerald-700">선수 커뮤니티</span>
          </nav>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h1 className="text-[26px] sm:text-[34px] font-black tracking-tight break-keep">
                응원이 모여 선수의 가능성이 됩니다
              </h1>
              <p className="mt-2.5 text-[13.5px] text-slate-500 break-keep">
                편지와 대화, 브랜드 추천이 팬온도와 선수의 다음 후원기회로 이어집니다.
              </p>
            </div>
            <div className="relative w-full lg:w-[340px]">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-300" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="선수 이름으로 커뮤니티 찾기"
                className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-[13.5px] focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 선수 스트립 */}
      <section className="max-w-[1400px] mx-auto px-5 pt-5">
        <div className="flex items-center gap-3">
          <p className="text-[12.5px] font-bold text-slate-500 shrink-0">선수 선택</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filteredAthletes.map((x) => {
              const on = x.id === athleteId;
              return (
                <Link
                  key={x.id}
                  to={`/fan/community/${x.id}`}
                  className={`shrink-0 flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-2xl border transition-colors ${
                    on ? 'border-emerald-500 bg-emerald-50/60' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0">
                    {x.profileImageUrl && <img src={x.profileImageUrl} alt="" loading="lazy" className="w-full h-full object-cover object-top" />}
                  </span>
                  <span>
                    <span className="block text-[13.5px] font-extrabold whitespace-nowrap">{x.name} 프로</span>
                    <span className="block text-[12px] text-slate-500 inline-flex items-center gap-1">
                      <Thermometer className="w-3 h-3" /> {x.celsius.toFixed(1)}℃
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-5 pt-5 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-5 items-start">
        {/* 좌: 보드 */}
        <div className="rounded-2xl border border-slate-200 p-5">
          {!a ? (
            <div className="py-16 text-center"><Loader2 className="w-7 h-7 text-emerald-500 animate-spin mx-auto" /></div>
          ) : (
          <>
          <h2 className="text-[17px] font-black">{a.name} 프로 커뮤니티</h2>

          <div className="mt-3 flex gap-1 border-b border-slate-100 overflow-x-auto">
            {(rules?.tabs || []).map((t: any) => (
              <button
                key={t.key}
                onClick={() => setSp({ tab: t.key })}
                className={`px-3.5 py-2.5 text-[13px] font-bold border-b-2 whitespace-nowrap transition-colors ${
                  tab === t.key ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 작성 */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {([['CHEER', '응원 글', PenLine], ['LETTER', '팬레터 보내기', Mail]] as const).map(([k, label, Icon]) => (
              <button
                key={k}
                onClick={() => setMode(k)}
                className={`h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border text-[13.5px] font-bold transition-colors ${
                  mode === k ? 'border-emerald-500 bg-emerald-50/60 text-emerald-700' : 'border-slate-200 text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
              rows={2}
              placeholder={mode === 'LETTER' ? `${a?.name} 프로에게만 전해지는 편지를 써보세요` : `${a?.name} 프로에게 마음을 전해보세요`}
              className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:border-emerald-400 resize-none"
            />
            <button
              onClick={submitPost}
              disabled={posting || !draft.trim()}
              className="w-12 shrink-0 rounded-xl bg-emerald-600 text-white flex items-center justify-center disabled:opacity-40"
              aria-label="등록"
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          {mode === 'LETTER' && (
            <p className="mt-1.5 text-[12.5px] text-slate-500">팬레터는 선수와 나만 볼 수 있어요.</p>
          )}
          {msg && <p className="mt-2 text-[12.5px] font-bold text-emerald-700">{msg}</p>}
          {err && <p className="mt-2 text-[12.5px] font-bold text-rose-600">{err}</p>}

          {/* 글 목록 */}
          <div className="mt-5 space-y-3">
            {!board?.posts?.length ? (
              <p className="py-12 text-center text-[13px] text-slate-500 break-keep">
                아직 글이 없어요. 첫 응원을 남겨보세요.
              </p>
            ) : board.posts.map((p: any) => {
              const badge = TYPE_BADGE[p.type] || TYPE_BADGE.CHEER;
              return (
                <article key={p.id} className={`rounded-xl border p-4 ${p.isPrivate ? 'border-rose-100 bg-rose-50/30' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 shrink-0">
                      {p.authorRole === 'ATHLETE' && a?.profileImageUrl
                        ? <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />
                        : <span className="w-full h-full flex items-center justify-center text-[12px] font-bold text-slate-500">팬</span>}
                    </span>
                    <p className="text-[13px] font-extrabold">{p.authorName}</p>
                    <span className={`text-[12.5px] font-bold ${badge.cls}`}>{badge.label}</span>
                    <span className="ml-auto text-[12.5px] text-slate-500">{ago(p.createdAt)}</span>
                  </div>
                  {p.imageUrl && (
                    <img src={p.imageUrl} alt="" loading="lazy" className="mt-3 rounded-lg max-h-64 object-cover" />
                  )}
                  <p className="mt-2.5 text-[13.5px] text-slate-700 leading-relaxed whitespace-pre-line break-keep">{p.content}</p>
                  <div className="mt-3 flex items-center gap-4">
                    <button
                      onClick={() => like(p.id)}
                      className={`inline-flex items-center gap-1.5 text-[12.5px] font-bold ${p.likedByMe ? 'text-rose-500' : 'text-slate-500 hover:text-slate-600'}`}
                    >
                      <Heart className={`w-4 h-4 ${p.likedByMe ? 'fill-current' : ''}`} /> {p.likeCount}
                    </button>
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500">
                      <MessageCircle className="w-4 h-4" /> {p.commentCount}
                    </span>
                    {p.isPrivate && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[12.5px] font-bold text-rose-500">
                        <Bookmark className="w-3.5 h-3.5" /> 선수와 나만 열람
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* 브랜드 추천 */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <h3 className="text-[15px] font-extrabold">이 선수와 어울리는 브랜드를 아시나요?</h3>
            <p className="mt-1 text-[12.5px] text-slate-500">추천은 검토 후 선수의 브랜드 적합도에 반영됩니다.</p>
            <div className="mt-3 grid sm:grid-cols-[minmax(0,180px)_minmax(0,180px)_minmax(0,1fr)_auto] gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 px-3 text-[13.5px] focus:outline-none focus:border-emerald-400"
              >
                <option value="">카테고리 선택</option>
                {(rules?.categories || []).map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="브랜드명 (선택)"
                className="h-11 rounded-xl border border-slate-200 px-3.5 text-[13.5px] focus:outline-none focus:border-emerald-400"
              />
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="추천 이유를 한 줄로 적어주세요"
                className="h-11 rounded-xl border border-slate-200 px-3.5 text-[13.5px] focus:outline-none focus:border-emerald-400"
              />
              <button
                onClick={submitSuggest}
                className="h-11 px-5 rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold hover:bg-emerald-700 whitespace-nowrap"
              >
                브랜드 추천하기
              </button>
            </div>

            {suggest?.summary?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {suggest.summary.map((s: any) => (
                  <span key={s.category} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[12.5px] font-bold">
                    {s.category} {s.total}표{s.accepted > 0 && ` · 반영 ${s.accepted}`}
                  </span>
                ))}
              </div>
            )}
          </div>
          </>
          )}
        </div>

        {/* 우: 팬온도 패널 */}
        <aside className="lg:sticky lg:top-24 space-y-4">
          <div className={`rounded-2xl border border-slate-200 p-5 ${a ? '' : 'opacity-0 pointer-events-none'}`}>
            <div className="flex items-center gap-3">
              <span className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 shrink-0">
                {a?.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
              </span>
              <div>
                <p className="text-[17px] font-black">{a?.name} 프로</p>
                <p className="text-[12px] text-slate-500">{[a?.tour, a?.region].filter(Boolean).join(' · ')}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-[13px]">
              <span className="text-slate-500">팬 {temp?.fanCount ?? 0}명</span>
              <span className="inline-flex items-center gap-1.5 font-black">
                <Thermometer className="w-4 h-4 text-emerald-600" /> 팬온도 {(temp?.celsius ?? 0).toFixed(1)}℃
              </span>
            </div>
            {!!temp?.weeklyDelta && (
              <p className="mt-1.5 inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[12.5px] font-bold">
                이번 주 +{temp.weeklyDelta.toFixed(1)}℃
              </p>
            )}

            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className="text-[12.5px] font-extrabold">팬온도는 이렇게 만들어져요</p>
              {(temp?.breakdown || []).every((b: any) => b.share === 0) ? (
                <p className="mt-2 text-[12px] text-slate-500 break-keep">
                  아직 기록된 활동이 없어요. 첫 응원이 팬온도의 시작이 됩니다.
                </p>
              ) : (
                <ul className="mt-2.5 space-y-2">
                  {(temp?.breakdown || []).filter((b: any) => b.share > 0).map((b: any) => (
                    <li key={b.source} className="flex items-center gap-2.5">
                      <span className="text-[12px] text-slate-600 w-[112px] shrink-0">{b.label}</span>
                      <span className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <span className="block h-full bg-emerald-500" style={{ width: `${b.share}%` }} />
                      </span>
                      <span className="text-[12px] font-bold tabular-nums w-9 text-right">{b.share}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {temp?.mine && temp.mine.celsius > 0 && (
              <p className="mt-3 text-[12.5px] text-slate-600">
                내 기여 <b className="text-emerald-600">+{temp.mine.celsius.toFixed(1)}℃</b>
                {temp.mine.rankPercent != null && <> · 팬 랭킹 상위 <b>{temp.mine.rankPercent}%</b></>}
              </p>
            )}

            <div className="mt-4 divide-y divide-slate-100">
              {[
                { label: '선수 프로필', to: `/athletes/${athleteId}` },
                { label: '이 선수 후원하기', to: `/sponsor/direct/build/${athleteId}` },
                { label: '팬스토어', to: '/fan/store' },
              ].map((l) => (
                <Link key={l.label} to={l.to} className="flex items-center justify-between py-3 text-[13px] font-bold hover:text-emerald-700">
                  {l.label} <ChevronRight className="w-4 h-4 text-slate-300" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-[12.5px] font-extrabold">활동하면 이렇게 쌓여요</p>
            <ul className="mt-2.5 space-y-2">
              {(rules?.rules || []).map((r: any) => (
                <li key={r.source} className="flex items-center justify-between text-[12.5px]">
                  <span className="text-slate-600">{r.label}</span>
                  <span className="font-bold text-emerald-700">
                    +{r.celsius}℃{r.points > 0 && ` · +${r.points}P`}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12px] text-slate-500 break-keep">
              팬스토어 구매는 구매금액의 1%가 팬포인트로 적립됩니다.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
