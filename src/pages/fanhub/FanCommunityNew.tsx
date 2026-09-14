/**
 * F05 선수 팬커뮤니티 (핸드오프 §18.1 · §10)
 * 선수 소식과 팬 응원을 한 타임라인에 두되, 무엇이 공식 글인지 구분해서 보여준다.
 * 팬레터는 목록에서 본문을 노출하지 않는다 (작성자·선수만 열람).
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Heart, MessageCircle, Mail, Send, PenLine, Search,
  Lightbulb, Thermometer, ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  Card, Chip, AthleteAvatar, TempBar, EmptyState, Notice, Skeleton, nf,
} from '../../components/fanhub/FanKit';

const TABS = [
  { key: 'ALL', label: '전체' },
  { key: 'NOTICE', label: '선수 소식' },
  { key: 'CHEER', label: '팬 응원' },
  { key: 'MATCH_TALK', label: '경기 이야기' },
];

const TYPE_META: Record<string, { label: string; tone: 'emerald' | 'slate' | 'rose' | 'sky' | 'amber' }> = {
  NOTICE: { label: '선수 소식', tone: 'emerald' },
  CHEER: { label: '팬 응원', tone: 'slate' },
  LETTER: { label: '팬레터', tone: 'rose' },
  MATCH_TALK: { label: '경기 이야기', tone: 'sky' },
  BRAND: { label: '브랜드 추천', tone: 'amber' },
};

const ago = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  if (m < 1440) return `${Math.floor(m / 60)}시간 전`;
  return `${Math.floor(m / 1440)}일 전`;
};

export default function FanCommunityNew() {
  const { athleteId } = useParams();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') || 'ALL';

  const [athletes, setAthletes] = useState<any[]>([]);
  const [board, setBoard] = useState<any>(null);
  const [temp, setTemp] = useState<any>(null);
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentDraft, setCommentDraft] = useState('');

  useEffect(() => {
    api.getCommunityAthletes({})
      .then((r: any) => {
        const list = r?.data?.athletes || [];
        setAthletes(list);
        if (!athleteId && list[0]) nav(`/fan/community/${list[0].id}`, { replace: true });
      })
      .catch(() => setAthletes([]))
      .finally(() => setLoading(false));
  }, [athleteId, nav]);

  const load = useCallback(async () => {
    if (!athleteId) return;
    const [b, t]: any[] = await Promise.all([
      api.getCommunityPosts(athleteId, tab).catch(() => null),
      api.getFanTemperature(athleteId).catch(() => null),
    ]);
    setBoard(b?.data || null);
    setTemp(t?.data || null);
  }, [athleteId, tab]);
  useEffect(() => { load(); }, [load]);

  const needLogin = (e: any) => {
    if (e?.response?.status === 401) {
      nav(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return true;
    }
    return false;
  };

  const post = async () => {
    if (!draft.trim() || !athleteId) return;
    setPosting(true); setErr(null);
    try {
      await api.createCommunityPost(athleteId, { type: 'CHEER', content: draft.trim() });
      setDraft('');
      await load();
    } catch (e: any) {
      if (needLogin(e)) return;
      setErr(e?.response?.data?.error?.message || '등록하지 못했습니다');
    } finally { setPosting(false); }
  };

  const like = async (postId: string) => {
    try { await api.likeCommunityPost(postId); await load(); }
    catch (e: any) { needLogin(e); }
  };

  const toggleComments = async (postId: string) => {
    if (openComments === postId) { setOpenComments(null); return; }
    setOpenComments(postId);
    setComments([]);
    const r: any = await api.getCommunityComments(postId).catch(() => null);
    setComments(r?.data?.comments || []);
  };

  const addComment = async (postId: string) => {
    if (!commentDraft.trim()) return;
    try {
      await api.addCommunityComment(postId, commentDraft.trim());
      setCommentDraft('');
      const r: any = await api.getCommunityComments(postId).catch(() => null);
      setComments(r?.data?.comments || []);
      await load();
    } catch (e: any) { needLogin(e); }
  };

  const a = board?.athlete;
  const filtered = q.trim() ? athletes.filter((x) => x.name.includes(q.trim())) : athletes;

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-10 space-y-3"><Skeleton className="h-[120px]" /><Skeleton className="h-[300px]" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Link to="/fan" className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-500 hover:text-slate-700 mb-5">
        <ArrowLeft className="w-4 h-4" /> 팬 참여
      </Link>

      {/* 선수 선택 */}
      <div className="mb-5">
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-300" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="선수 이름으로 커뮤니티 찾기"
            className="w-full h-11 pl-10 pr-3 rounded-2xl border border-slate-200 bg-white text-[14px] placeholder:text-slate-300 focus:outline-none focus:border-slate-400" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {filtered.map((x) => (
            <Link key={x.id} to={`/fan/community/${x.id}`}
              className={`shrink-0 flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full border transition ${
                x.id === athleteId ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}>
              <AthleteAvatar athlete={x} size={26} />
              <span className="text-[13px] font-semibold whitespace-nowrap">{x.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {a && (
        <>
          {/* 선수 헤더 */}
          <Card className="p-5 mb-4">
            <div className="flex items-center gap-3.5 mb-4">
              <AthleteAvatar athlete={a} size={52} />
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-bold text-slate-900">{a.name}</p>
                <p className="text-[12px] text-slate-500">{[a.tour, a.region].filter(Boolean).join(' · ') || '선수'}</p>
              </div>
              <Link to={`/athletes/${a.id}`} className="text-[12px] font-bold text-slate-500 hover:text-slate-900 inline-flex items-center">
                선수 정보 <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {temp && (
              <Link to={`/fan/temperature/${a.id}`} className="block pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <Thermometer className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[12px] font-semibold text-slate-500">팬온도</span>
                  <span className="ml-auto text-[12px] text-slate-500">자세히 보기</span>
                </div>
                <TempBar score={temp.score} tier={temp.tier?.label} lowSample={temp.lowSample} />
              </Link>
            )}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Link to={`/fan/letter/${a.id}`}
                className="h-11 rounded-2xl bg-slate-100 text-slate-700 text-[13px] font-bold flex items-center justify-center gap-1.5 hover:bg-slate-200 transition">
                <Mail className="w-4 h-4" /> 응원 편지
              </Link>
              <Link to={`/fan/brand-suggest/${a.id}`}
                className="h-11 rounded-2xl bg-slate-900 text-white text-[13px] font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800 transition">
                <Lightbulb className="w-4 h-4" /> 브랜드 추천
              </Link>
            </div>
          </Card>

          {/* 글쓰기 */}
          <Card className="p-4 mb-4">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <PenLine className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1">
                <textarea value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
                  placeholder={`${a.name} 선수에게 응원을 남겨보세요`} rows={draft ? 3 : 1}
                  className="w-full text-[14px] text-slate-700 placeholder:text-slate-300 border-0 resize-none focus:outline-none leading-relaxed" />
                {draft && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <span className="text-[12px] text-slate-500 tabular-nums">{draft.length}/1,000</span>
                    <button onClick={post} disabled={posting || !draft.trim()}
                      className="h-9 px-4 rounded-xl bg-slate-900 text-white text-[13px] font-bold disabled:bg-slate-200 disabled:text-slate-400 hover:bg-slate-800 transition inline-flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" /> {posting ? '등록 중…' : '응원 남기기'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {err && <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600">{err}</div>}

          {/* 탭 */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setSp(t.key === 'ALL' ? {} : { tab: t.key })}
                className={`shrink-0 h-8 px-3.5 rounded-full text-[12px] font-semibold transition border ${
                  tab === t.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* 타임라인 */}
          {board?.posts?.length ? (
            <div className="space-y-2.5">
              {board.posts.map((p: any) => {
                const meta = TYPE_META[p.type] || TYPE_META.CHEER;
                const isNotice = p.type === 'NOTICE';
                return (
                  <Card key={p.id} className={`p-4 ${isNotice ? 'border-emerald-200 bg-emerald-50/30' : ''}`}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Chip size="xs" tone={meta.tone}>{meta.label}</Chip>
                      <span className="text-[12px] font-semibold text-slate-600">{p.authorName}</span>
                      <span className="text-[12px] text-slate-300">·</span>
                      <span className="text-[12px] text-slate-500">{ago(p.createdAt)}</span>
                      {p.isPrivate && <Chip size="xs">비공개</Chip>}
                    </div>
                    <p className="text-[14px] text-slate-700 leading-relaxed whitespace-pre-line">{p.content}</p>
                    {p.imageUrl && (
                      <img src={p.imageUrl} alt="" className="mt-3 rounded-2xl w-full object-cover max-h-72" />
                    )}
                    <div className="flex items-center gap-4 mt-3.5 pt-3 border-t border-slate-100">
                      <button onClick={() => like(p.id)}
                        className={`inline-flex items-center gap-1.5 text-[12px] font-semibold transition ${
                          p.likedByMe ? 'text-rose-500' : 'text-slate-500 hover:text-slate-600'
                        }`}>
                        <Heart className={`w-4 h-4 ${p.likedByMe ? 'fill-rose-500' : ''}`} /> {nf(p.likeCount)}
                      </button>
                      <button onClick={() => toggleComments(p.id)}
                        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-600 transition">
                        <MessageCircle className="w-4 h-4" /> {nf(p.commentCount)}
                      </button>
                    </div>

                    {openComments === p.id && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="space-y-2.5 mb-3">
                          {comments.length ? comments.map((c: any) => (
                            <div key={c.id} className="flex gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-slate-100 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[12px]">
                                  <b className="text-slate-700">{c.authorName}</b>
                                  <span className="text-slate-300 mx-1.5">·</span>
                                  <span className="text-slate-500">{ago(c.createdAt)}</span>
                                </p>
                                <p className="text-[13px] text-slate-600 mt-0.5 leading-relaxed">{c.content}</p>
                              </div>
                            </div>
                          )) : (
                            <p className="text-[12px] text-slate-500 text-center py-2">첫 댓글을 남겨보세요</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addComment(p.id)}
                            placeholder="댓글 남기기"
                            className="flex-1 h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-100 text-[13px] placeholder:text-slate-300 focus:outline-none focus:border-slate-300" />
                          <button onClick={() => addComment(p.id)}
                            className="h-10 px-4 rounded-xl bg-slate-900 text-white text-[13px] font-bold hover:bg-slate-800 transition">
                            등록
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={<MessageCircle className="w-5 h-5" />} title="아직 글이 없습니다"
              desc={'첫 응원을 남기면 선수에게 전달됩니다.'} />
          )}

          <div className="mt-8">
            <Notice title="커뮤니티 이용 안내" items={[
              '비방·개인정보·광고성 글은 신고 시 즉시 숨김 처리되며 운영팀이 확인합니다.',
              '팬레터는 작성자와 선수만 볼 수 있고, 목록에서는 본문이 표시되지 않습니다.',
              '동일 내용을 반복해서 올리면 팬온도와 포인트에 반영되지 않습니다.',
            ]} />
          </div>
        </>
      )}
    </div>
  );
}
