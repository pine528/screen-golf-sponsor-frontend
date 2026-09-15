/**
 * F05 선수 커뮤니티 `/fan/community/:athleteId` — 시안 2026-09-15 (Desktop · Mobile)
 *
 *  히어로 → 검색 + 선수 칩 슬라이더(좌우 화살표) → 선수 카드(사진·필기체 이름·이력 한 줄·팬온도·참여 팬/최근 응원/시즌 TOP10
 *  ·응원 편지 쓰기/브랜드 추천하기/선수 정보 보기/팬스토어 보기) → 글쓰기(사진·이모지·태그) → 탭(전체/선수 소식/팬 응원/경기 이야기/사진·영상)
 *  → 타임라인(공지 강조·좋아요·댓글·게시글/사용자 신고·숨기기) / 우측: 커뮤니티 이용 안내 · 이번 주 Fan VOTE · 팬 온도에 함께해 주신 분들
 *  · 팬온도는 이렇게 만들어져요 · 오늘의 인기 반응 · 이번 주 응원 랭킹 · SPONPIK 배너. (리디자인/9 · 09 · 16 반영)
 *  값은 실데이터만(참여 팬 수·최근 30일 응원 수·시즌 TOP10·좋아요·이번 주 활동 건수). 팬레터는 목록에 본문을 노출하지 않는다.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  BadgeCheck, ChevronLeft, ChevronRight, Flame, Hash, Heart, ImagePlus, Lightbulb, Loader2, Mail, MessageCircle,
  MoreHorizontal, Search, Send, ShoppingBag, Smile, Trophy, UserRound, Users, X,
  EyeOff, Flag, ShieldCheck, Thermometer, UserX, Vote,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { AthleteAvatar, Skeleton, nf, FAN_TEMP_NOTE } from '../../components/fanhub/FanKit';

const TABS = [
  { key: 'ALL', label: '전체' }, { key: 'NOTICE', label: '선수 소식' }, { key: 'CHEER', label: '팬 응원' },
  { key: 'MATCH_TALK', label: '경기 이야기' }, { key: 'MEDIA', label: '사진 · 영상' },
];
const TYPE_META: Record<string, { label: string; cls: string }> = {
  NOTICE: { label: '선수 소식', cls: 'bg-emerald-600 text-white' },
  CHEER: { label: '팬 응원', cls: 'bg-rose-50 text-rose-600' },
  LETTER: { label: '팬레터', cls: 'bg-violet-50 text-violet-600' },
  MATCH_TALK: { label: '경기 이야기', cls: 'bg-sky-50 text-sky-700' },
  BRAND: { label: '브랜드 추천', cls: 'bg-amber-50 text-amber-700' },
};
const EMOJIS = ['💚', '🔥', '👏', '💪', '⛳', '🏆', '😊', '🙌'];
const NOTICE_ITEMS = [
  '선수와 팬이 함께 만드는 따뜻한 공간이에요.', '존중하는 표현과 매너를 지켜주세요.', '선수 비방, 욕설, 허위사실 유포는 금지돼요.',
  '광고 및 홍보성 글은 등록할 수 없어요.', '신고된 게시글은 운영진이 확인 후 조치해요.',
];
const HIDDEN_KEY = 'sponpik.community.hidden';
const readHidden = (): string[] => { try { return JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]'); } catch { return []; } };

const ago = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  if (m < 1440) return `${Math.floor(m / 60)}시간 전`;
  return `${Math.floor(m / 1440)}일 전`;
};

export default function FanCommunityNew() {
  const { athleteId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') || 'ALL';

  const [athletes, setAthletes] = useState<any[]>([]);
  const [board, setBoard] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  /* 글쓰기 */
  const [draft, setDraft] = useState('');
  const [postType, setPostType] = useState<'CHEER' | 'MATCH_TALK'>('CHEER');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  /* 댓글 */
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentDraft, setCommentDraft] = useState('');

  const chipRef = useRef<HTMLDivElement>(null);

  /* 이번 주 Fan VOTE · 신고 · 숨기기 (시안 16) */
  const [weekVote, setWeekVote] = useState<any>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [hidden, setHidden] = useState<string[]>(readHidden);
  const [report, setReport] = useState<{ targetType: 'POST' | 'USER'; targetId: string; label: string } | null>(null);
  const [reasons, setReasons] = useState<any[]>([]);
  const [reportReason, setReportReason] = useState('');
  const [reportDetail, setReportDetail] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const [reportDone, setReportDone] = useState<string | null>(null);

  useEffect(() => {
    api.getCommunityAthletes({ limit: 40 }).then((r: any) => {
      const list = r?.data?.athletes || [];
      setAthletes(list);
      if (!athleteId && list[0]) navigate(`/fan/community/${list[0].id}`, { replace: true });
    }).catch(() => setAthletes([]));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    if (!athleteId) return;
    setLoading(true); setErr(null);
    const [b, s, v]: any[] = await Promise.all([
      api.getCommunityPosts(athleteId, tab === 'MEDIA' ? 'ALL' : tab).catch(() => null),
      api.getCommunitySummary(athleteId).catch(() => null),
      api.listFanVotes({ tab: 'OPEN', athleteId, sort: 'CLOSING', limit: 1 }).catch(() => null),
    ]);
    setBoard(b?.data ?? null); setSummary(s?.data ?? null); setWeekVote(v?.data?.items?.[0] ?? v?.data?.votes?.[0] ?? null);
    setLoading(false);
  }, [athleteId, tab]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { chipRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' }); }, [athleteId, athletes]);

  const requireLogin = () => { navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`); };

  const onFile = async (f?: File | null) => {
    if (!f) return;
    if (!/^image\//.test(f.type)) { setErr('이미지 파일만 올릴 수 있습니다'); return; }
    if (f.size > 10 * 1024 * 1024) { setErr('10MB 이하 이미지만 올릴 수 있습니다'); return; }
    setUploading(true); setErr(null);
    try { const r: any = await api.uploadFile(f, 'asset'); setImageUrl(r?.data?.fileUrl || null); }
    catch (e: any) { setErr(e?.response?.data?.error?.message || '사진을 올리지 못했습니다'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };
  const insert = (text: string) => {
    const el = textRef.current;
    if (!el) { setDraft((d) => d + text); return; }
    const s = el.selectionStart ?? draft.length, e = el.selectionEnd ?? draft.length;
    const next = draft.slice(0, s) + text + draft.slice(e);
    setDraft(next.slice(0, 1000));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + text.length, s + text.length); });
  };
  const post = async () => {
    if (!isAuthenticated) return requireLogin();
    if (!athleteId || !draft.trim()) return;
    setPosting(true); setErr(null);
    try {
      await api.createCommunityPost(athleteId, { type: postType, content: draft.trim(), imageUrl: imageUrl || undefined });
      setDraft(''); setImageUrl(null); setEmojiOpen(false);
      await load();
    } catch (e: any) { setErr(e?.response?.data?.error?.message || '등록하지 못했습니다'); } finally { setPosting(false); }
  };
  const like = async (postId: string) => {
    if (!isAuthenticated) return requireLogin();
    try { await api.likeCommunityPost(postId); await load(); } catch (e: any) { setErr(e?.response?.data?.error?.message || '실패했습니다'); }
  };
  const toggleComments = async (postId: string) => {
    if (openComments === postId) { setOpenComments(null); return; }
    setOpenComments(postId); setCommentDraft('');
    const r: any = await api.getCommunityComments(postId).catch(() => null);
    setComments(r?.data?.comments || []);
  };
  const addComment = async (postId: string) => {
    if (!isAuthenticated) return requireLogin();
    if (!commentDraft.trim()) return;
    try {
      await api.addCommunityComment(postId, commentDraft.trim());
      setCommentDraft('');
      const r: any = await api.getCommunityComments(postId).catch(() => null);
      setComments(r?.data?.comments || []);
      await load();
    } catch (e: any) { setErr(e?.response?.data?.error?.message || '댓글을 남기지 못했습니다'); }
  };

  const hidePost = (id: string) => {
    const next = [...new Set([...hidden, id])];
    setHidden(next); setMenuFor(null);
    try { localStorage.setItem(HIDDEN_KEY, JSON.stringify(next)); } catch { /* noop */ }
  };
  const openReport = async (targetType: 'POST' | 'USER', targetId: string, label: string) => {
    setMenuFor(null);
    if (!isAuthenticated) return requireLogin();
    setReport({ targetType, targetId, label }); setReportReason(''); setReportDetail(''); setReportDone(null);
    if (!reasons.length) { const r: any = await api.getFanReportReasons().catch(() => null); setReasons(r?.data?.reasons || []); }
  };
  const sendReport = async () => {
    if (!report || !reportReason) return;
    setReportBusy(true);
    try {
      const r: any = await api.reportFanContent({ targetType: report.targetType, targetId: report.targetId, reason: reportReason, detail: reportDetail || undefined });
      setReportDone(r?.data?.duplicate ? '이미 접수된 신고입니다. 운영진이 확인 중이에요.' : `신고가 접수됐습니다 (접수번호 ${r?.data?.code}). 운영진이 확인 후 조치합니다.`);
      if (report.targetType === 'POST') hidePost(report.targetId);
    } catch (e: any) { setErr(e?.response?.data?.error?.message || '신고를 접수하지 못했습니다'); setReport(null); }
    finally { setReportBusy(false); }
  };

  const a = summary?.athlete || board?.athlete;
  const st = summary?.stats;
  const temp = summary?.temperature;
  const filteredChips = q.trim() ? athletes.filter((x) => x.name.includes(q.trim())) : athletes;
  const posts: any[] = (board?.posts || []).filter((p: any) => (tab === 'MEDIA' ? !!p.imageUrl : true) && !hidden.includes(p.id));
  const scrollChips = (dir: number) => chipRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  const myInitial = ((user as any)?.nickname || (user as any)?.name || user?.email || '팬').slice(0, 1);

  return (
    <div className="min-h-screen bg-[#f3faf6] text-slate-900 pb-16">
      <PublicHeader />

      {/* ── 히어로 ── */}
      <section className="relative overflow-hidden bg-[#ecf8f1]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute right-[-120px] top-[-160px] w-[520px] h-[520px] rounded-full bg-emerald-200/50 blur-3xl" />
          <p className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:block text-right text-[15px] font-extrabold tracking-[0.22em] leading-[1.7] text-emerald-800/50 select-none">SPORTS<br />CONNECTS<br /><span className="border-b-2 border-emerald-500/60">US</span></p>
        </div>
        <div className="max-w-[1180px] mx-auto px-5 pt-5 pb-7 relative">
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[13px]">
            <Link to="/" className="text-slate-500 hover:text-slate-700">홈</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link to="/fan" className="text-slate-500 hover:text-slate-700">팬 참여</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-emerald-700">선수 커뮤니티</span>
          </nav>
          <h1 className="mt-4 text-[28px] sm:text-[36px] font-extrabold tracking-[-0.03em] leading-tight">선수 커뮤니티</h1>
          <p className="mt-1.5 text-[14px] text-slate-600 break-keep">좋아하는 선수를 더 가까이, 함께 응원하는 특별한 공간입니다.</p>
        </div>
      </section>

      <div className="max-w-[1180px] mx-auto px-5 -mt-3 relative grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-4 items-start">
        {/* ── 본문 ── */}
        <div className="min-w-0 space-y-3">
          {/* 검색 */}
          <label className="flex items-center gap-2 h-12 px-4 rounded-2xl bg-white border border-slate-200 shadow-sm focus-within:border-emerald-400">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="선수 이름으로 커뮤니티 찾기" className="flex-1 min-w-0 text-[14px] outline-none bg-transparent placeholder:text-slate-400" />
            {q && <button onClick={() => setQ('')} aria-label="지우기" className="text-slate-400"><X className="w-4 h-4" /></button>}
          </label>

          {/* 선수 칩 슬라이더 */}
          <div className="relative">
            <button onClick={() => scrollChips(-1)} aria-label="이전 선수" className="hidden sm:inline-flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow items-center justify-center text-slate-600"><ChevronLeft className="w-4 h-4" /></button>
            <div ref={chipRef} className="flex gap-2 overflow-x-auto sm:px-10 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
              {filteredChips.map((x) => {
                const on = x.id === athleteId;
                return (
                  <Link key={x.id} to={`/fan/community/${x.id}${sp.get('tab') ? `?tab=${sp.get('tab')}` : ''}`} data-active={on}
                    className={`shrink-0 flex items-center gap-2 pl-1.5 pr-4 h-12 rounded-full border-2 transition ${on ? 'border-emerald-500 bg-white shadow-[0_6px_16px_-8px_rgba(16,185,129,0.6)]' : 'border-slate-200 bg-white hover:border-emerald-300'}`}>
                    <span className={`rounded-full ${on ? 'ring-2 ring-emerald-500 ring-offset-1' : ''}`}><AthleteAvatar athlete={x} size={34} /></span>
                    <span className={`text-[13.5px] font-bold whitespace-nowrap ${on ? 'text-emerald-700' : 'text-slate-800'}`}>{x.name}</span>
                  </Link>
                );
              })}
              {filteredChips.length === 0 && <p className="text-[13px] text-slate-500 px-2 py-3">검색 결과가 없습니다</p>}
            </div>
            <button onClick={() => scrollChips(1)} aria-label="다음 선수" className="hidden sm:inline-flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow items-center justify-center text-slate-600"><ChevronRight className="w-4 h-4" /></button>
          </div>

          {loading && !a ? (
            <><Skeleton className="h-[300px] rounded-3xl" /><Skeleton className="h-[110px] rounded-2xl" /></>
          ) : a && (
            <>
              {/* ── 선수 카드 ── */}
              <section className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-[0_14px_40px_-24px_rgba(15,23,42,0.25)]">
                <div className="grid sm:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)]">
                  <div className="relative aspect-[4/3] sm:aspect-auto sm:min-h-[320px] bg-gradient-to-br from-emerald-100 to-emerald-50 overflow-hidden">
                    {a.profileImageUrl ? <img src={a.profileImageUrl} alt={a.name} className="w-full h-full object-cover object-top" /> : <span className="w-full h-full flex items-center justify-center text-6xl font-extrabold text-emerald-300">{a.name.slice(0, 1)}</span>}
                    <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-900/60 to-transparent" />
                    <div className="absolute left-4 right-4 bottom-4">
                      {a.quote && <p className="text-[12.5px] font-semibold text-white/90 leading-snug break-keep drop-shadow">“{a.quote}”</p>}
                      <p className="mt-1.5 text-[22px] font-extrabold tracking-[-0.02em] text-white leading-none drop-shadow">{a.name} <span className="text-[13px] font-bold text-emerald-200 align-middle">PRO</span></p>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6 flex flex-col gap-5">
                    <div className="flex flex-col md:flex-row md:items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {a.tour && <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11.5px] font-extrabold">{a.tour}</span>}
                          {a.region && <span className="text-[12.5px] text-slate-500">{a.region}</span>}
                        </div>
                        <p className="mt-1.5 text-[24px] sm:text-[28px] font-extrabold tracking-[-0.02em] inline-flex items-center gap-1.5">{a.name} 프로 {a.isRecommended && <BadgeCheck className="w-5 h-5 text-emerald-500" aria-label="추천 선수" />}</p>
                        <p className="text-[13px] text-slate-500 break-keep">꾸준함이 만드는 더 큰 오늘, {a.name} 프로를 함께 응원해주세요!</p>
                      </div>
                      <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 md:w-[210px] shrink-0" title={FAN_TEMP_NOTE}>
                        <p className="text-[11.5px] font-bold text-slate-600">팬온도</p>
                        <p className="mt-0.5 inline-flex items-center gap-1.5 text-[26px] font-black text-emerald-700 tabular-nums leading-none"><Flame className="w-5 h-5 text-orange-500" />{temp && !temp.lowSample && temp.score > 0 ? `${Number(temp.score).toFixed(1)}°` : <span className="text-[14px] font-bold text-slate-500">집계 중</span>}</p>
                        <p className="mt-1 text-[11.5px] text-slate-600 break-keep">{temp && !temp.lowSample && temp.score > 0 ? (temp.tier?.meaning || temp.tier?.label || '지금도 뜨거운 응원이 이어지고 있어요!') : '팬 30명 이상 참여하면 공개됩니다'}</p>
                      </div>
                    </div>
                    <dl className="my-auto grid grid-cols-3 divide-x divide-slate-100 rounded-2xl bg-slate-50 px-2 py-4">
                      {[
                        { icon: Users, k: '참여 팬 수', v: st ? nf(st.fanCount) : '—' },
                        { icon: Heart, k: '최근 응원 수', v: st ? nf(st.recentCheers) : '—', hint: '30일' },
                        { icon: Trophy, k: '이번 시즌 TOP 10', v: st ? String(st.seasonTop10) : '—' },
                      ].map((x) => { const I = x.icon; return (
                        <div key={x.k} className="px-2 text-center">
                          <dd className="inline-flex items-center gap-1 text-[16px] sm:text-[18px] font-extrabold tabular-nums"><I className="w-4 h-4 text-slate-400" />{x.v}</dd>
                          <dt className="text-[11px] text-slate-500">{x.k}</dt>
                        </div>
                      ); })}
                    </dl>
                    <div className="mt-auto grid grid-cols-2 lg:grid-cols-3 gap-2">
                      <Link to={`/fan/letter/${a.id}`} className="h-11 rounded-xl bg-emerald-600 text-white text-[13px] font-bold inline-flex items-center justify-center gap-1.5 hover:bg-emerald-700"><Mail className="w-4 h-4" /> 응원 편지 쓰기</Link>
                      <Link to={`/fan/brand-suggest/${a.id}`} className="h-11 rounded-xl bg-slate-900 text-white text-[13px] font-bold inline-flex items-center justify-center gap-1.5 hover:bg-slate-800"><Lightbulb className="w-4 h-4" /> 브랜드 추천하기</Link>
                      <Link to={`/athletes/${a.id}`} className="h-11 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 inline-flex items-center justify-center gap-1.5 hover:border-slate-400"><UserRound className="w-4 h-4" /> 선수 정보 보기</Link>
                    </div>
                    <div className="-mt-3 text-right"><Link to="/fan/store" className="inline-flex items-center gap-1 text-[12.5px] font-bold text-emerald-700 hover:underline"><ShoppingBag className="w-3.5 h-3.5" /> 팬스토어 보기 <ChevronRight className="w-3.5 h-3.5" /></Link></div>
                  </div>
                </div>
              </section>

              {/* ── 글쓰기 ── */}
              <section className="rounded-2xl bg-white border border-slate-200 p-4">
                <div className="flex gap-3">
                  <span className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 font-extrabold inline-flex items-center justify-center shrink-0">{myInitial}</span>
                  <div className="min-w-0 flex-1">
                    <textarea ref={textRef} value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 1000))} onFocus={() => !isAuthenticated && requireLogin()}
                      placeholder={`${a.name} 선수에게 응원을 남겨보세요!`} rows={draft ? 3 : 1}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[14px] placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 resize-none leading-relaxed" />
                    {imageUrl && (
                      <div className="mt-2 relative inline-block">
                        <img src={imageUrl} alt="첨부 이미지" className="h-24 rounded-xl border border-slate-200 object-cover" />
                        <button onClick={() => setImageUrl(null)} aria-label="사진 제거" className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 text-white inline-flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                    {emojiOpen && (
                      <div className="mt-2 flex flex-wrap gap-1">{EMOJIS.map((e) => <button key={e} onClick={() => insert(e)} className="w-9 h-9 rounded-lg hover:bg-slate-100 text-[18px]">{e}</button>)}</div>
                    )}
                    <div className="mt-2 flex items-center gap-1 flex-wrap">
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                      <button onClick={() => (isAuthenticated ? fileRef.current?.click() : requireLogin())} disabled={uploading} className="h-9 px-2.5 rounded-lg text-[12.5px] font-bold text-slate-600 hover:bg-slate-100 inline-flex items-center gap-1.5">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />} 사진</button>
                      <button onClick={() => setEmojiOpen((v) => !v)} className="h-9 px-2.5 rounded-lg text-[12.5px] font-bold text-slate-600 hover:bg-slate-100 inline-flex items-center gap-1.5"><Smile className="w-4 h-4" /> 이모지</button>
                      <button onClick={() => insert('#')} className="h-9 px-2.5 rounded-lg text-[12.5px] font-bold text-slate-600 hover:bg-slate-100 inline-flex items-center gap-1.5"><Hash className="w-4 h-4" /> 태그</button>
                      <select value={postType} onChange={(e) => setPostType(e.target.value as any)} className="h-9 px-2 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-600 bg-white">
                        <option value="CHEER">팬 응원</option><option value="MATCH_TALK">경기 이야기</option>
                      </select>
                      <span className="ml-auto text-[11.5px] text-slate-400 tabular-nums">{draft.length}/1,000</span>
                      <button onClick={post} disabled={posting || !draft.trim()} className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-[13px] font-bold inline-flex items-center gap-1.5 hover:bg-emerald-700 disabled:opacity-40"><Send className="w-3.5 h-3.5" /> {posting ? '등록 중…' : '게시하기'}</button>
                    </div>
                  </div>
                </div>
              </section>
              {err && <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-[13px] font-bold text-rose-600 break-keep">{err}</p>}

              {/* ── 탭 ── */}
              <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {TABS.map((t) => (
                  <button key={t.key} onClick={() => setSp(t.key === 'ALL' ? {} : { tab: t.key })} aria-pressed={tab === t.key}
                    className={`shrink-0 h-10 px-4 rounded-full text-[13px] font-bold border transition ${tab === t.key ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'}`}>{t.label}</button>
                ))}
              </div>

              {/* ── 타임라인 ── */}
              {loading ? (
                <div className="space-y-2.5">{[0, 1].map((i) => <Skeleton key={i} className="h-[120px] rounded-2xl" />)}</div>
              ) : posts.length ? (
                <ul className="space-y-2.5">
                  {posts.map((p: any) => {
                    const meta = TYPE_META[p.type] || TYPE_META.CHEER;
                    const notice = p.type === 'NOTICE';
                    return (
                      <li key={p.id} className={`relative rounded-2xl border p-4 ${notice ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}>
                        {notice && <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-extrabold inline-flex items-center gap-1"><Trophy className="w-3 h-3" /> 공지</span>}
                        <div className="flex items-start gap-3">
                          <span className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0 inline-flex items-center justify-center text-[13px] font-extrabold text-slate-600">
                            {notice && a.profileImageUrl ? <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" /> : p.authorName.slice(0, 1)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-[13.5px] font-extrabold">{p.authorName}{notice ? ' 프로' : ''}</span>
                              <span className="text-[12px] text-slate-500">{ago(p.createdAt)}</span>
                              {!notice && <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${meta.cls}`}>{meta.label}</span>}
                              {p.isPrivate && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-bold text-slate-500">비공개</span>}
                              {!notice && (
                                <span className="ml-auto relative">
                                  <button type="button" aria-label="더보기" aria-expanded={menuFor === p.id} onClick={() => setMenuFor(menuFor === p.id ? null : p.id)} className="w-7 h-7 rounded-full text-slate-400 hover:bg-slate-100 inline-flex items-center justify-center"><MoreHorizontal className="w-4 h-4" /></button>
                                  {menuFor === p.id && (
                                    <span role="menu" className="absolute right-0 top-8 z-20 w-40 rounded-xl bg-white border border-slate-200 shadow-[0_12px_30px_-12px_rgba(15,23,42,0.35)] py-1.5 text-[13px]">
                                      <button type="button" role="menuitem" onClick={() => openReport('POST', p.id, p.content)} className="w-full px-3.5 py-2 text-left inline-flex items-center gap-2 text-rose-600 hover:bg-slate-50"><Flag className="w-4 h-4" /> 게시글 신고</button>
                                      {p.authorUserId && !p.isMine && <button type="button" role="menuitem" onClick={() => openReport('USER', p.authorUserId, p.authorName)} className="w-full px-3.5 py-2 text-left inline-flex items-center gap-2 text-slate-700 hover:bg-slate-50"><UserX className="w-4 h-4" /> 사용자 신고</button>}
                                      <button type="button" role="menuitem" onClick={() => hidePost(p.id)} className="w-full px-3.5 py-2 text-left inline-flex items-center gap-2 text-slate-700 hover:bg-slate-50"><EyeOff className="w-4 h-4" /> 숨기기</button>
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                            <div className="mt-1.5 flex gap-3">
                              <p className={`flex-1 text-[14px] leading-relaxed whitespace-pre-line break-keep ${notice ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>{p.content}</p>
                              {p.imageUrl && <a href={p.imageUrl} target="_blank" rel="noreferrer" className="shrink-0"><img src={p.imageUrl} alt="" className="w-24 h-24 sm:w-32 sm:h-24 rounded-xl object-cover border border-slate-100" /></a>}
                            </div>
                            <div className="mt-3 flex items-center gap-4">
                              <button onClick={() => like(p.id)} className={`inline-flex items-center gap-1.5 text-[12.5px] font-bold ${p.likedByMe ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}><Heart className={`w-4 h-4 ${p.likedByMe ? 'fill-current' : ''}`} /> {nf(p.likeCount)}</button>
                              <button onClick={() => toggleComments(p.id)} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-slate-500 hover:text-slate-800"><MessageCircle className="w-4 h-4" /> {nf(p.commentCount)}</button>
                            </div>
                            {openComments === p.id && (
                              <div className="mt-3 pt-3 border-t border-slate-100">
                                <div className="space-y-2.5 mb-3">
                                  {comments.length ? comments.map((c: any) => (
                                    <div key={c.id} className="flex gap-2.5">
                                      <span className="w-6 h-6 rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 inline-flex items-center justify-center shrink-0">{c.authorName.slice(0, 1)}</span>
                                      <div className="min-w-0">
                                        <p className="text-[12px]"><b className="text-slate-700">{c.authorName}</b><span className="text-slate-300 mx-1.5">·</span><span className="text-slate-500">{ago(c.createdAt)}</span></p>
                                        <p className="text-[13px] text-slate-600 mt-0.5 leading-relaxed break-keep">{c.content}</p>
                                      </div>
                                    </div>
                                  )) : <p className="text-[12px] text-slate-500 text-center py-2">첫 댓글을 남겨보세요</p>}
                                </div>
                                <div className="flex gap-2">
                                  <input value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment(p.id)} placeholder="댓글 남기기" className="flex-1 h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-100 text-[13px] placeholder:text-slate-400 focus:outline-none focus:border-emerald-300" />
                                  <button onClick={() => addComment(p.id)} className="h-10 px-4 rounded-xl bg-slate-900 text-white text-[13px] font-bold">등록</button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="rounded-2xl bg-white border border-dashed border-slate-200 py-12 text-center">
                  <span className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 inline-flex items-center justify-center"><MessageCircle className="w-6 h-6" /></span>
                  <p className="mt-3 text-[15px] font-extrabold">{tab === 'MEDIA' ? '사진·영상 글이 아직 없습니다' : '아직 글이 없습니다'}</p>
                  <p className="mt-1 text-[13px] text-slate-500">첫 응원을 남기면 선수에게 전달됩니다.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── 사이드바 ── */}
        <aside className="space-y-3 lg:sticky lg:top-20">
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-[14px] font-extrabold inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /> 커뮤니티 이용 안내</p>
            <ul className="mt-2 space-y-1.5">{NOTICE_ITEMS.map((t) => <li key={t} className="flex items-start gap-1.5 text-[12.5px] text-slate-600 break-keep"><span className="w-1 h-1 rounded-full bg-slate-400 mt-2 shrink-0" />{t}</li>)}</ul>
            <Link to="/fan" className="mt-2 inline-flex items-center gap-0.5 text-[12px] font-bold text-slate-600 hover:text-slate-900">자세히 보기 <ChevronRight className="w-3.5 h-3.5" /></Link>
          </div>
          {a && (
            <div className="rounded-2xl bg-white border border-slate-200 p-4">
              <p className="text-[12px] font-bold text-slate-600 inline-flex items-center gap-1.5"><span className={`px-1.5 py-0.5 rounded text-[10.5px] font-extrabold ${weekVote ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{weekVote ? '진행중' : '예정'}</span> 이번 주 Fan VOTE</p>
              {weekVote ? (
                <>
                  <div className="mt-2 flex items-start gap-3">
                    <p className="flex-1 text-[14px] font-extrabold leading-snug break-keep">{weekVote.title}</p>
                    <span className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center justify-center shrink-0"><Vote className="w-6 h-6" /></span>
                  </div>
                  <p className="mt-1.5 text-[11.5px] text-slate-500">마감 {new Date(weekVote.closeAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {nf(weekVote.participants ?? 0)}명 참여{weekVote.voted ? ' · 참여함' : ''}</p>
                  <Link to={`/fan/vote/${weekVote.id}`} className="mt-3 inline-flex h-9 px-4 rounded-lg border border-emerald-600 text-emerald-700 text-[12.5px] font-bold items-center hover:bg-emerald-50">{weekVote.voted ? '내 선택 보기' : '투표하기'}</Link>
                </>
              ) : (
                <>
                  <p className="mt-2 text-[13px] text-slate-600 break-keep">{a.name} 프로의 진행 중인 투표가 없습니다. 팬이 직접 투표를 만들 수 있어요.</p>
                  <Link to="/fan/vote/create" className="mt-3 inline-flex h-9 px-4 rounded-lg border border-slate-200 text-slate-700 text-[12.5px] font-bold items-center hover:border-slate-400">투표 만들기</Link>
                </>
              )}
            </div>
          )}
          {st && (
            <div className="rounded-2xl bg-rose-50/60 border border-rose-100 p-4">
              <p className="text-[14px] font-extrabold text-rose-600">팬 온도에 함께해 주신 분들</p>
              <p className="text-[11.5px] text-slate-600">따뜻한 응원이 모여 선수에게 큰 힘이 됩니다.</p>
              <dl className="mt-3 grid grid-cols-3 gap-1 text-center">
                {[
                  { icon: Users, k: '응원 참여', v: `${nf(st.fanCount)}명` },
                  { icon: MessageCircle, k: '응원 메시지', v: `${nf((st.recentCheers ?? 0) + (st.recentLetters ?? 0))}건`, hint: '30일' },
                  { icon: Thermometer, k: '이번 주 상승', v: temp && !temp.lowSample && temp.weeklyDelta != null ? `${temp.weeklyDelta > 0 ? '+' : ''}${Number(temp.weeklyDelta).toFixed(1)}°C` : '집계 중' },
                ].map((x) => { const I = x.icon; return (
                  <div key={x.k}>
                    <I className="w-4 h-4 mx-auto text-rose-400" />
                    <dt className="mt-1 text-[10.5px] text-slate-500">{x.k}</dt>
                    <dd className="text-[14px] font-black tabular-nums text-slate-800">{x.v}</dd>
                  </div>
                ); })}
              </dl>
              <p className="mt-2.5 text-[10.5px] text-slate-500 break-keep">※ 금액이 아닌 응원 참여와 활동을 기준으로 집계됩니다.</p>
            </div>
          )}
          {a && temp?.components?.length > 0 && (
            <div className="rounded-2xl bg-white border border-slate-200 p-4">
              <p className="text-[14px] font-extrabold inline-flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-500" /> 팬온도는 이렇게 만들어져요</p>
              <ul className="mt-2.5 space-y-1.5">
                {temp.components.map((c: any) => (
                  <li key={c.key} className="flex items-center gap-2 text-[12px]"><span className="w-24 shrink-0 text-slate-600 truncate">{c.label}</span><span className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden"><span className="block h-full rounded-full bg-emerald-600" style={{ width: `${c.weight}%` }} /></span><span className="w-8 text-right font-bold tabular-nums">{c.weight}%</span></li>
                ))}
              </ul>
              <Link to={`/fan/temperature/${a.id}`} className="mt-2.5 inline-flex items-center gap-0.5 text-[12px] font-bold text-emerald-700 hover:underline">팬온도 자세히 보기 <ChevronRight className="w-3.5 h-3.5" /></Link>
            </div>
          )}
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-[14px] font-extrabold inline-flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-500" /> 오늘의 인기 반응</p>
            {summary?.topPosts?.length ? (
              <ol className="mt-2.5 space-y-2">
                {summary.topPosts.map((p: any, i: number) => (
                  <li key={p.id} className="flex items-center gap-2.5 text-[12.5px]">
                    <span className={`w-5 h-5 rounded-full text-[11px] font-extrabold inline-flex items-center justify-center shrink-0 ${i < 3 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{i + 1}</span>
                    <span className="flex-1 truncate text-slate-700">{p.content}</span>
                    <span className="shrink-0 inline-flex items-center gap-0.5 text-slate-500 tabular-nums"><Heart className="w-3 h-3" /> {nf(p.likeCount)}</span>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-2 text-[12.5px] text-slate-500">최근 30일 반응이 아직 없습니다.</p>}
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-[14px] font-extrabold inline-flex items-center gap-1.5"><Trophy className="w-4 h-4 text-amber-500" /> 이번 주 응원 랭킹</p>
            {summary?.weeklyFans?.length ? (
              <ol className="mt-2.5 space-y-2">
                {summary.weeklyFans.map((f: any) => (
                  <li key={f.rank} className="flex items-center gap-2.5 text-[12.5px]">
                    <span className={`w-5 h-5 rounded-full text-[11px] font-extrabold inline-flex items-center justify-center shrink-0 ${f.rank <= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{f.rank}</span>
                    <span className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 shrink-0 inline-flex items-center justify-center text-[11px] font-bold text-slate-600">{f.avatarUrl ? <img src={f.avatarUrl} alt="" className="w-full h-full object-cover" /> : f.nickname.slice(0, 1)}</span>
                    <span className="flex-1 truncate font-bold text-slate-800">{f.nickname}</span>
                    <span className="shrink-0 text-slate-500 tabular-nums">활동 {f.activities}건</span>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-2 text-[12.5px] text-slate-500">이번 주 응원 활동이 아직 없습니다.</p>}
          </div>
          <Link to="/fan" className="relative block overflow-hidden rounded-2xl bg-[#0a1411] text-white p-5 hover:bg-[#0e1a16]">
            <div aria-hidden className="pointer-events-none absolute inset-0"><div className="absolute right-[-40%] bottom-[-60%] w-[120%] h-[120%] rounded-full bg-emerald-500/20 blur-3xl" /></div>
            <p className="relative text-[11px] font-extrabold tracking-[0.2em] text-emerald-300">SPONPIK</p>
            <p className="relative mt-2 text-[17px] font-extrabold leading-snug break-keep">응원하는 마음이<br />선수의 오늘을 만듭니다.</p>
            <p className="relative mt-2 text-[12px] text-white/70 break-keep">커뮤니티의 응원과 참여는 팬온도 상승과 팬포인트로 연결되어 선수에게 더 큰 기회가 됩니다.</p>
            <span className="relative mt-3 inline-flex h-9 px-3.5 items-center gap-1 rounded-full bg-white text-slate-900 text-[12.5px] font-bold">SPONPIK가 만드는 변화 <ChevronRight className="w-3.5 h-3.5" /></span>
            <p aria-hidden className="absolute right-4 bottom-3 text-[9px] font-extrabold tracking-[0.2em] text-white/30">GOOD FANS BETTER SPORTS</p>
          </Link>
        </aside>
      </div>

      {/* ── 신고 모달 ── */}
      {report && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 px-4" onClick={() => setReport(null)}>
          <div role="dialog" aria-modal className="w-full max-w-md rounded-3xl bg-white p-6 mb-4 sm:mb-0 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <span className="w-11 h-11 rounded-full bg-rose-50 text-rose-500 inline-flex items-center justify-center shrink-0"><Flag className="w-5 h-5" /></span>
              <div className="min-w-0 flex-1"><h2 className="text-[17px] font-extrabold">{report.targetType === 'POST' ? '게시글 신고' : '사용자 신고'}</h2><p className="text-[12px] text-slate-500 truncate">{report.label}</p></div>
              <button type="button" onClick={() => setReport(null)} aria-label="닫기" className="w-8 h-8 rounded-full text-slate-400 hover:bg-slate-100 inline-flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            {reportDone ? (
              <>
                <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800 break-keep">{reportDone}</p>
                <button type="button" onClick={() => setReport(null)} className="mt-4 w-full h-11 rounded-xl bg-slate-900 text-white text-[14px] font-bold">닫기</button>
              </>
            ) : (
              <>
                <p className="mt-4 text-[13px] font-bold">신고 사유</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {reasons.map((r: any) => <button key={r.code} type="button" onClick={() => setReportReason(r.code)} aria-pressed={reportReason === r.code} className={`h-10 rounded-xl border text-[13px] font-bold ${reportReason === r.code ? 'border-rose-400 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-700 hover:border-slate-400'}`}>{r.label}</button>)}
                </div>
                <textarea value={reportDetail} onChange={(e) => setReportDetail(e.target.value.slice(0, 500))} rows={3} placeholder="상세 내용 (선택)" className="mt-3 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] placeholder:text-slate-400 focus:outline-none focus:border-rose-300 resize-none" />
                <p className="mt-2 text-[11.5px] text-slate-500 break-keep">신고자는 익명으로 처리되며, 허위 신고가 반복되면 이용이 제한될 수 있습니다.</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setReport(null)} className="h-11 rounded-xl border border-slate-200 text-slate-700 text-[14px] font-bold">취소</button>
                  <button type="button" onClick={sendReport} disabled={!reportReason || reportBusy} className="h-11 rounded-xl bg-rose-500 text-white text-[14px] font-extrabold hover:bg-rose-600 disabled:bg-slate-200 disabled:text-slate-400">{reportBusy ? '접수 중…' : '신고 접수'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
