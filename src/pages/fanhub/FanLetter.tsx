/**
 * F06 응원 보내기 `/fan/letter/:athleteId` — 시안 2026-09-15 (리디자인/9 · 17)
 *
 *  좌: "{선수}에게 응원 보내기" → 공개 응원글 | 비공개 응원편지 토글 → 제목(필수 0/50) · 응원 내용(필수 50~500) · 사진 첨부(선택, 드래그/클릭)
 *     → 공개 범위 안내 → 작성 가이드 동의(필수)
 *  우: 이번 달 보낸 응원편지 n/2 · 실시간 자동 검토(AutoMod) 안내 · 응원 예시 · 미리보기(실시간)
 *  하단: 개별 답장 비보장 고지 + [응원 보내기]
 *  발송 후: 완료 / 검토 대기 화면.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle, BadgeCheck, CheckCircle2, ChevronDown, ChevronUp, Globe, Heart, ImagePlus, Loader2, Lock, Mail, MessageCircle,
  Send, ShieldCheck, X,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { AthleteAvatar, Skeleton } from '../../components/fanhub/FanKit';
import { FanPage, Container, FanCrumb, BackButton, Panel, fmtDate } from '../../components/fanhub/FanShell';

const MIN = 50;
const MAX = 500;
const TITLE_MAX = 50;
const GUIDE = [
  '연락처·계좌·SNS 아이디 등 개인 연락 수단을 요청하거나 남기지 않습니다.',
  '선수와 다른 팬에 대한 욕설·비방·성희롱 등 악의적인 표현을 쓰지 않습니다.',
  '공개 응원글은 선수 커뮤니티에 함께 게시되며, 운영 정책에 따라 일부 표현이 수정·숨김될 수 있습니다.',
  '선수의 개별 답장은 보장되지 않으며, 선수는 월 1회 감사 메시지로 마음을 전할 수 있습니다.',
];

export default function FanLetter() {
  const { athleteId = '' } = useParams();
  const nav = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [athlete, setAthlete] = useState<any>(null);
  const [quota, setQuota] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [agree, setAgree] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      api.getFanTemperature(athleteId).then((r) => setAthlete(r.data?.athlete)).catch(() => null),
      isAuthenticated ? api.getLetterQuota().then((r) => setQuota(r.data)).catch(() => setQuota(null)) : Promise.resolve(),
    ]).finally(() => setLoading(false));
  }, [athleteId, isAuthenticated]);

  const loginTo = `/login?returnUrl=${encodeURIComponent(`/fan/letter/${athleteId}`)}`;

  const onFile = async (f?: File | null) => {
    if (!f) return;
    if (!/^image\/(jpeg|png|jpg)$/.test(f.type)) { setError('JPG, PNG 파일만 첨부할 수 있습니다'); return; }
    if (f.size > 5 * 1024 * 1024) { setError('5MB 이하 사진만 첨부할 수 있습니다'); return; }
    setUploading(true); setError(null);
    try { const r: any = await api.uploadFile(f, 'asset'); setImageUrl(r?.data?.fileUrl || null); }
    catch (e: any) { setError(e?.response?.data?.error?.message || '사진을 올리지 못했습니다'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const send = async () => {
    if (!isAuthenticated) { nav(loginTo); return; }
    setSending(true); setError(null);
    try {
      const r = await api.sendFanLetter(athleteId, { title: title.trim(), content: content.trim(), isPublic, imageUrl: imageUrl || undefined });
      setResult(r.data);
      window.scrollTo({ top: 0 });
    } catch (e: any) {
      if (e?.response?.status === 401) { nav(loginTo); return; }
      setError(e?.response?.data?.error?.message || '편지를 보내지 못했습니다');
    } finally { setSending(false); }
  };

  const crumbs = [{ label: '팬 참여', to: '/fan' }, { label: athlete ? `${athlete.name} 프로 커뮤니티` : '선수 커뮤니티', to: athlete ? `/fan/community/${athlete.id}` : '/fan/community' }, { label: '응원 보내기' }];

  if (loading) {
    return <FanPage><Container className="pt-5 space-y-4"><Skeleton className="h-8 w-60" /><Skeleton className="h-[420px] rounded-3xl" /></Container></FanPage>;
  }

  /* ── 발송 완료 ── */
  if (result) {
    const pending = result.moderation?.status === 'PENDING';
    return (
      <FanPage>
        <Container className="pt-5">
          <FanCrumb items={crumbs} />
          <div className="mt-8 max-w-xl mx-auto text-center">
            <span className={`mx-auto w-16 h-16 rounded-3xl inline-flex items-center justify-center ${pending ? 'bg-amber-50' : 'bg-emerald-50'}`}>
              {pending ? <AlertCircle className="w-7 h-7 text-amber-500" /> : <CheckCircle2 className="w-7 h-7 text-emerald-500" />}
            </span>
            <h1 className="mt-5 text-[24px] font-extrabold tracking-[-0.02em]">{pending ? '응원이 검토 대기 중입니다' : '응원을 보냈습니다'}</h1>
            <p className="mt-3 text-[14px] text-slate-600 leading-relaxed whitespace-pre-line break-keep">
              {pending
                ? `${result.moderation.note}\n운영팀 확인 후 전달되며, 검토 중에는 팬온도와 포인트에 반영되지 않습니다.`
                : `${athlete?.name || '선수'} 프로에게 따뜻한 마음이 전달됐습니다.\n${isPublic ? '공개 응원글은 선수 커뮤니티에도 함께 게시됩니다.' : '비공개 응원편지는 선수만 확인할 수 있습니다.'}`}
            </p>
            {!pending && result.point?.earned > 0 && (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2 text-[13px] font-bold text-emerald-700">팬포인트 +{result.point.earned}P 적립 예정</p>
            )}
            <p className="mt-4 text-[12.5px] text-slate-500">이번 달 남은 응원편지 {result.remaining}통</p>
            <div className="mt-8 flex flex-wrap gap-2 justify-center">
              <Link to={`/fan/community/${athleteId}`} className="h-11 px-5 rounded-xl bg-emerald-600 text-white text-[14px] font-bold inline-flex items-center hover:bg-emerald-700">커뮤니티로 돌아가기</Link>
              <Link to={`/fan/temperature/${athleteId}`} className="h-11 px-5 rounded-xl border border-slate-200 bg-white text-slate-700 text-[14px] font-bold inline-flex items-center hover:border-slate-400">팬온도 보기</Link>
              <Link to="/fan/activity" className="h-11 px-5 rounded-xl border border-slate-200 bg-white text-slate-700 text-[14px] font-bold inline-flex items-center hover:border-slate-400">내 팬활동</Link>
            </div>
          </div>
        </Container>
      </FanPage>
    );
  }

  const len = content.trim().length;
  const exhausted = !!quota && quota.remaining <= 0;
  const valid = title.trim().length > 0 && len >= MIN && len <= MAX && agree && !exhausted && !uploading;
  const nickname = (user as any)?.nickname || (user as any)?.name || '팬';

  return (
    <FanPage>
      <Container className="pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <BackButton to={`/fan/community/${athleteId}`} />
          <FanCrumb items={crumbs} />
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start">
          {/* ── 작성 ── */}
          <div className="min-w-0">
            <h1 className="text-[26px] sm:text-[34px] font-extrabold tracking-[-0.03em] leading-tight inline-flex items-center gap-2 break-keep">
              {athlete ? `${athlete.name} 프로에게 응원 보내기` : '응원 보내기'} <Heart className="w-6 h-6 text-rose-500 fill-current" />
            </h1>
            <p className="mt-1.5 text-[14.5px] text-slate-600 break-keep">따뜻한 응원의 마음이 선수에게 큰 힘이 됩니다.</p>

            {/* 공개 / 비공개 */}
            <div className="mt-5 grid grid-cols-2 gap-2 max-w-md">
              {[
                { v: true, icon: Globe, label: '공개 응원글' },
                { v: false, icon: Lock, label: '비공개 응원편지' },
              ].map((o) => { const I = o.icon; const on = isPublic === o.v; return (
                <button key={String(o.v)} type="button" onClick={() => setIsPublic(o.v)} aria-pressed={on} disabled={exhausted}
                  className={`h-12 rounded-full border-2 text-[14px] font-bold inline-flex items-center justify-center gap-2 transition ${on ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'}`}>
                  <I className="w-4 h-4" /> {o.label}
                </button>
              ); })}
            </div>

            {!isAuthenticated && (
              <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3.5 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[13px] text-amber-700 break-keep">응원을 보내려면 로그인이 필요합니다. <Link to={loginTo} className="font-bold underline">로그인하기</Link></p>
              </div>
            )}
            {exhausted && (
              <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3.5 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[13px] text-amber-700 break-keep">이번 달 응원편지 {quota.limit}통을 모두 보냈습니다. 다음 달 1일에 다시 보낼 수 있어요.</p>
              </div>
            )}

            <Panel className="mt-4 space-y-5">
              <div>
                <div className="flex items-center justify-between"><label className="text-[13.5px] font-bold">제목 <span className="text-slate-400 font-medium">(필수)</span></label><span className="text-[12px] text-slate-500 tabular-nums">{title.length}/{TITLE_MAX}</span></div>
                <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))} disabled={exhausted}
                  placeholder={`제목을 입력해주세요 (최대 ${TITLE_MAX}자)`}
                  className="mt-2 w-full h-12 px-4 rounded-xl border border-slate-200 text-[14px] placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 disabled:bg-slate-50" />
              </div>
              <div>
                <div className="flex items-center justify-between"><label className="text-[13.5px] font-bold">응원 내용 <span className="text-slate-400 font-medium">(필수)</span></label><span className={`text-[12px] tabular-nums ${len > MAX ? 'text-rose-500' : len >= MIN ? 'text-emerald-600' : 'text-slate-500'}`}>{len}/{MAX}</span></div>
                <textarea value={content} onChange={(e) => setContent(e.target.value.slice(0, MAX))} disabled={exhausted} rows={7}
                  placeholder={`따뜻한 응원의 메시지를 적어주세요 (${MIN}~${MAX}자)`}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-[14px] leading-relaxed placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 resize-y disabled:bg-slate-50" />
                <p className="mt-1.5 text-[12px] text-slate-500">{MIN}자 이상 {MAX}자 이하로 작성해주세요.</p>
              </div>
              <div>
                <label className="text-[13.5px] font-bold">사진 첨부 <span className="text-slate-400 font-medium">(선택)</span></label>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                {imageUrl ? (
                  <div className="mt-2 relative inline-block">
                    <img src={imageUrl} alt="첨부 사진" className="h-32 rounded-xl border border-slate-200 object-cover" />
                    <button type="button" onClick={() => setImageUrl(null)} aria-label="사진 제거" className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-slate-900 text-white inline-flex items-center justify-center"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button type="button" disabled={exhausted || uploading}
                    onClick={() => (isAuthenticated ? fileRef.current?.click() : nav(loginTo))}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); onFile(e.dataTransfer.files?.[0]); }}
                    className={`mt-2 w-full rounded-xl border-2 border-dashed px-4 py-5 flex items-center gap-4 text-left transition ${dragging ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50/60 hover:border-slate-400'}`}>
                    <span className="w-11 h-11 rounded-xl bg-white border border-slate-200 inline-flex items-center justify-center text-slate-500 shrink-0">{uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}</span>
                    <span><span className="block text-[13.5px] font-bold text-slate-700">{uploading ? '사진을 올리는 중…' : '사진을 드래그하거나 클릭하여 첨부하세요'}</span><span className="block mt-0.5 text-[12px] text-slate-500">JPG, PNG 파일만 가능 (최대 5MB)</span></span>
                  </button>
                )}
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-[12.5px] text-slate-600 inline-flex items-center gap-2 w-full break-keep">
                {isPublic ? <Globe className="w-4 h-4 text-emerald-600 shrink-0" /> : <Lock className="w-4 h-4 text-slate-500 shrink-0" />}
                {isPublic ? <>공개 응원글은 <b>{athlete?.name || '선수'} 프로 커뮤니티</b>와 스폰픽 내에서 공개됩니다.</> : <>비공개 응원편지는 <b>{athlete?.name || '선수'} 프로</b>만 확인할 수 있습니다.</>}
              </div>
            </Panel>

            {/* 동의 */}
            <Panel className="mt-3 !p-4">
              <div className="flex items-center gap-3">
                <input id="agree" type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} disabled={exhausted} className="w-5 h-5 accent-emerald-600" />
                <label htmlFor="agree" className="text-[13.5px] flex-1 break-keep">응원 메시지 <button type="button" onClick={() => setGuideOpen((v) => !v)} className="font-bold text-emerald-700 underline underline-offset-2">작성 가이드 및 유의사항</button>에 동의합니다. <span className="text-slate-400">(필수)</span></label>
                <button type="button" onClick={() => setGuideOpen((v) => !v)} aria-label="가이드 펼치기" className="text-slate-500">{guideOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
              </div>
              {guideOpen && <ul className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">{GUIDE.map((g) => <li key={g} className="flex gap-2 text-[12.5px] text-slate-600 break-keep"><span className="w-1 h-1 rounded-full bg-slate-400 mt-2 shrink-0" />{g}</li>)}</ul>}
            </Panel>

            {error && <p className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-[13px] font-bold text-rose-600 break-keep">{error}</p>}
          </div>

          {/* ── 사이드 ── */}
          <aside className="space-y-3">
            <Panel className="!py-3.5 flex items-center justify-between gap-3">
              <p className="text-[13.5px] font-bold inline-flex items-center gap-2"><Mail className="w-4 h-4 text-slate-500" /> 이번 달 보낸 응원편지</p>
              <p className="text-[15px] font-black tabular-nums">{quota ? <><span className="text-emerald-700">{quota.sent}</span> <span className="text-slate-400 font-bold">/ {quota.limit} 통</span></> : <span className="text-[12.5px] text-slate-500 font-bold">월 2통</span>}</p>
            </Panel>
            <Panel className="border-emerald-100 bg-emerald-50/40">
              <p className="text-[14px] font-extrabold text-emerald-800 inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> 실시간 자동 검토 (AutoMod) 안내</p>
              <ul className="mt-3 space-y-2.5">
                {['전화번호, 주소, 계좌번호, 이메일, SNS 등 연락처 요청/공유는 금지되어 있습니다.', '선수에 대한 욕설, 비방, 성희롱 등 모든 형태의 악의적인 표현은 금지되어 있습니다.'].map((t) => (
                  <li key={t} className="flex gap-2 text-[12.5px] text-slate-700 break-keep"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-px" />{t}</li>
                ))}
              </ul>
              <p className="mt-4 text-[13px] font-extrabold text-emerald-800 inline-flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> 응원 예시</p>
              <div className="mt-2 rounded-xl bg-white/80 border border-emerald-100 px-4 py-3 text-[12.5px] text-slate-700 leading-relaxed break-keep">항상 최선을 다하는 모습이 멋져요!<br />앞으로의 경기도 항상 응원하겠습니다. 💗</div>
            </Panel>
            <Panel className="border-rose-100 bg-rose-50/30">
              <p className="text-[14px] font-extrabold text-rose-600 inline-flex items-center gap-1.5"><Heart className="w-4 h-4" /> 미리보기</p>
              <div className="mt-3 rounded-2xl bg-white border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <AthleteAvatar athlete={athlete} size={44} />
                  <div className="min-w-0">
                    <p className="text-[14px] font-extrabold inline-flex items-center gap-1">{athlete?.name || '선수'} 프로 <BadgeCheck className="w-4 h-4 text-emerald-500" /></p>
                    <p className="text-[12px] text-slate-500">{isPublic ? '공개 응원글' : '비공개 응원편지'} · {fmtDate(new Date())} · {nickname}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[15px] font-extrabold break-keep">{title.trim() || <span className="text-slate-300">제목이 여기에 표시됩니다</span>}</p>
                  <p className="mt-1.5 text-[13px] text-slate-700 leading-relaxed whitespace-pre-line break-keep">{content.trim() || <span className="text-slate-300">응원 내용이 여기에 표시됩니다</span>}</p>
                  {imageUrl && <img src={imageUrl} alt="" className="mt-2 w-full max-h-40 object-cover rounded-xl border border-slate-100" />}
                </div>
              </div>
              <p className="mt-2 text-[11.5px] text-slate-500">※ 실제 게시 시 일부 표현이 수정될 수 있습니다.</p>
            </Panel>
          </aside>
        </div>

        {/* ── 하단 고지 + 보내기 ── */}
        <div className="mt-5 rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4">
          <span className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 inline-flex items-center justify-center shrink-0"><Heart className="w-5 h-5 fill-current" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-extrabold">개별 답장은 보장되지 않습니다.</p>
            <p className="text-[12.5px] text-slate-600 break-keep">선수는 준비된 시간에 모든 팬들에게 감사의 마음을 담아 <b>월 1회 감사 메시지</b>를 전할 수 있습니다.</p>
          </div>
          <button type="button" onClick={send} disabled={!valid || sending}
            className="h-13 py-3.5 px-8 md:w-[360px] rounded-xl bg-emerald-600 text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400">
            <Send className="w-4 h-4" /> {sending ? '보내는 중…' : isAuthenticated ? '응원 보내기' : '로그인하고 응원 보내기'}
          </button>
        </div>
      </Container>
    </FanPage>
  );
}
