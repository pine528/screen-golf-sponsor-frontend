/**
 * 지금 가능한 후원 — 주문 완료 · 실행 준비 (핸드오프 v1.0 §10.4, 시안 img_01)
 *
 * 승인이 남아 있으면 결제 전 단계로 안내하고, 결제가 끝났으면 실행 단계를 보여준다.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle, BarChart3, CheckCircle2, ChevronRight, Copy, CreditCard,
  FileSignature, Image, Loader2, Mail, Megaphone, Phone, Upload, User, Users,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';

/** 실행 진행 6단계 (§10.4) */
const STEPS = [
  { key: 'PAID', label: '결제 완료', icon: CreditCard },
  { key: 'ASSET', label: '소재 제출', icon: Upload },
  { key: 'REVIEW', label: '선수 검수', icon: User },
  { key: 'PATCH', label: '패치 적용', icon: Image },
  { key: 'POST', label: 'SNS 게시', icon: Megaphone },
  { key: 'REPORT', label: '성과 리포트', icon: BarChart3 },
];

export default function OfferOrderComplete() {
  const { applicationId } = useParams();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const r: any = await api.getApplication(applicationId!);
      setApp(r?.data || null);
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '주문 정보를 불러오지 못했습니다');
    } finally { setLoading(false); }
  }, [applicationId]);
  useEffect(() => { load(); }, [load]);

  const offers = useMemo(() => (app?.snapshot?.offers as any[]) || [], [app]);
  const paid = app?.status === 'ACTIVE';
  const approved = (app?.items || []).filter((i: any) => i.status === 'APPROVED').length;
  const totalItems = (app?.items || []).length;

  /* 결제 전이면 1단계(결제)에 머문다 */
  const currentStep = paid ? 2 : 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
      </div>
    );
  }
  if (!app) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="max-w-lg mx-auto px-5 py-24 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <p className="mt-4 text-[15px] font-bold">{err || '주문을 찾을 수 없습니다'}</p>
        </div>
      </div>
    );
  }

  const orderNo = `SP-${new Date(app.createdAt).toISOString().slice(0, 7).replace('-', '')}-${String(app.id).slice(0, 4).toUpperCase()}`;
  const dueAt = app.approvalDueAt ? new Date(app.approvalDueAt) : null;
  const daysLeft = dueAt ? Math.max(0, Math.ceil((dueAt.getTime() - Date.now()) / 86400_000)) : null;

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-16">
      <PublicHeader />

      <div className="max-w-[1400px] mx-auto px-5 pt-6">
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[12.5px]">
          <Link to="/" className="text-slate-500 hover:text-slate-600">홈</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link to="/sponsor/cart" className="text-slate-500 hover:text-slate-600">보관함 · 장바구니</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-emerald-700">{paid ? '주문 완료' : '주문 접수'}</span>
        </nav>

        <div className="mt-4 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-5 items-start">
          <div className="space-y-4">
            {/* 헤더 */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-6 sm:p-7 flex flex-wrap items-center gap-5">
              <span className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-[22px] sm:text-[27px] font-black tracking-tight break-keep">
                  {paid ? '후원 구매가 완료되었습니다!' : '주문이 접수되었습니다'}
                </h1>
                <p className="mt-1 text-[13px] text-slate-500 break-keep">
                  {paid ? '선수와 함께 멋진 성과를 만들어가세요.' : '선수 승인이 완료되면 결제로 이어집니다.'}
                </p>
              </div>
              <div className="rounded-xl bg-white border border-slate-200 px-4 py-3 shrink-0">
                <p className="text-[12px] text-slate-500">주문 번호</p>
                <p className="mt-0.5 text-[14px] font-black inline-flex items-center gap-1.5">
                  {orderNo}
                  <button
                    onClick={() => { navigator.clipboard?.writeText(orderNo); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                    aria-label="주문번호 복사"
                    className="text-slate-300 hover:text-slate-600"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </p>
                <p className="mt-1 text-[12px] text-slate-500">
                  {copied ? '복사했습니다' : new Date(app.createdAt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* 상품 요약 */}
            {offers.map((o: any) => (
              <div key={o.offerId} className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-wrap items-center gap-5">
                <span className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  {(app.items || [])[0]?.athlete?.profileImageUrl && (
                    <img src={app.items[0].athlete.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-extrabold break-keep">
                    {o.title}
                    {o.quantity > 1 && <span className="ml-2 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[12px] font-bold">×{o.quantity}</span>}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-slate-500">
                    {(app.items || []).map((i: any) => i.athlete?.name).filter(Boolean).join(' · ')}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-x-6 gap-y-2 text-[12px]">
                    <span>
                      <span className="text-slate-500">노출 영역 </span>
                      <b>{(o.components || []).map((c: any) => c.label).join(' + ') || '—'}</b>
                    </span>
                    <span>
                      <span className="text-slate-500">사용 범위 </span>
                      <b>{[o.rights?.offlineUse && '대회 착장', o.rights?.onlineUse && '온라인', o.rights?.printUse && '인쇄물'].filter(Boolean).join(' · ') || '—'}</b>
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[12px] text-slate-500">결제 금액</p>
                  <p className="text-[20px] font-black">{Math.round((o.supplyAmount || 0) * 1.1).toLocaleString()}원</p>
                  <p className="text-[12px] text-slate-500">(VAT 포함)</p>
                  <span className={`mt-1.5 inline-block px-2 py-0.5 rounded-md text-[12px] font-bold ${
                    paid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {paid ? '결제 완료' : '승인 대기'}
                  </span>
                </div>
              </div>
            ))}

            {/* 실행 진행 단계 */}
            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <h2 className="text-[15px] font-extrabold">후원 실행 진행 단계</h2>
              <ol className="mt-5 flex items-start gap-2 overflow-x-auto pb-2">
                {STEPS.map((s, i) => {
                  const n = i + 1;
                  const done = n < currentStep;
                  const active = n === currentStep;
                  return (
                    <li key={s.key} className="flex-1 min-w-[92px] text-center">
                      <div className="flex items-center">
                        <span className={`h-px flex-1 ${i === 0 ? 'opacity-0' : done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                        <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-2 ${
                          done ? 'bg-emerald-500 border-emerald-500 text-white'
                            : active ? 'bg-white border-emerald-500 text-emerald-600'
                            : 'bg-white border-slate-200 text-slate-300'
                        }`}>
                          {done ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-4.5 h-4.5" />}
                        </span>
                        <span className={`h-px flex-1 ${i === STEPS.length - 1 ? 'opacity-0' : done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                      </div>
                      <p className="mt-1.5 text-[12px] font-black text-slate-500">{n}</p>
                      <p className={`text-[12px] font-bold ${active ? 'text-emerald-700' : done ? 'text-slate-600' : 'text-slate-500'}`}>{s.label}</p>
                      <p className="mt-0.5 text-[12.5px] text-slate-500">{done ? '완료' : active ? '진행 중' : '예정'}</p>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-4 pt-4 border-t border-slate-100 text-center text-[12px] text-slate-500">
                각 단계가 완료되면 이메일과 알림으로 안내해 드립니다.
              </p>
            </div>

            {/* 액션 카드 */}
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: Upload, title: '로고 · 가이드 업로드', desc: '선수 유니폼 · SNS 노출용 로고 파일을 업로드하세요.', to: `/sponsor/applications/${app.id}` },
                { icon: Users, title: '담당자 지정', desc: '내부 담당자를 지정하여 업무를 효율적으로 관리하세요.', to: '/dashboard' },
                { icon: FileSignature, title: '계약서 다운로드', desc: '전자 서명된 계약서를 다운로드할 수 있습니다.', to: `/sponsor/applications/${app.id}` },
              ].map((c) => (
                <Link key={c.title} to={c.to} className="rounded-2xl bg-white border border-slate-200 p-4 flex items-start gap-3 hover:border-emerald-300 transition-colors">
                  <span className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <c.icon className="w-4 h-4 text-emerald-600" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-extrabold">{c.title}</span>
                    <span className="mt-0.5 block text-[12px] text-slate-500 break-keep">{c.desc}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <Link to={`/sponsor/applications/${app.id}`} className="h-12 px-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[14px] font-bold hover:bg-slate-50">
                주문 상세 보기 <ChevronRight className="w-4 h-4" />
              </Link>
              <Link to="/sponsor/available" className="h-12 px-6 inline-flex items-center gap-2 rounded-xl border border-emerald-600 text-emerald-700 text-[14px] font-bold hover:bg-emerald-50">
                다른 상품 보기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 우: 다음 작업 */}
          <aside className="lg:sticky lg:top-24 space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <h2 className="text-[15px] font-extrabold">다음으로 진행해야 할 작업</h2>

              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <p className="text-[12px] text-slate-500">현재 단계</p>
                <p className="mt-1 flex items-center gap-2 text-[14.5px] font-extrabold">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[12px] font-black flex items-center justify-center">
                    {currentStep}
                  </span>
                  {paid ? '브랜드 소재 제출' : '선수 승인 대기'}
                </p>
                {dueAt && (
                  <>
                    <p className="mt-3 text-[12px] text-slate-500">{paid ? '제출 기한' : '승인 기한'}</p>
                    <p className="mt-0.5 flex items-center gap-2">
                      <span className="text-[15px] font-black text-emerald-700">
                        {dueAt.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                      </span>
                      {daysLeft != null && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[12px] font-black">D-{daysLeft}</span>
                      )}
                    </p>
                  </>
                )}
                <p className="mt-3 text-[12.5px] text-slate-500 break-keep">
                  {paid
                    ? '기한 내 브랜드 소재를 제출해 주세요. 제출이 완료되어야 다음 단계로 진행됩니다.'
                    : `승인 현황 ${approved}/${totalItems}건. 모든 선수가 승인하면 계약과 결제로 이어집니다.`}
                </p>
              </div>

              <Link
                to={`/sponsor/applications/${app.id}`}
                className="mt-3 w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700"
              >
                <Upload className="w-4 h-4" /> {paid ? '브랜드 소재 업로드' : '승인 현황 보기'}
              </Link>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <p className="text-[13px] font-extrabold">궁금한 점이 있으신가요?</p>
              <p className="mt-1 text-[12px] text-slate-500">담당 매니저가 빠르게 도와드리겠습니다.</p>
              <div className="mt-3 space-y-2">
                <a href="tel:02-6953-1987" className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 py-3 text-[13px] font-bold hover:bg-slate-50">
                  <Phone className="w-4 h-4 text-slate-500" /> 02-6953-1987
                </a>
                <a href="mailto:help@sponpik.com" className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 py-3 text-[13px] font-bold hover:bg-slate-50">
                  <Mail className="w-4 h-4 text-slate-500" /> help@sponpik.com
                </a>
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-50/70 border border-emerald-100 p-5">
              <p className="text-[13.5px] font-extrabold break-keep">
                선수와의 성공적인 파트너십을<br />스폰픽이 함께 만들어가겠습니다
              </p>
              <p className="mt-1.5 text-[12px] text-slate-500">최고의 노출 효과로 보답하겠습니다.</p>
              <Link to="/dashboard" className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-700">
                캠페인 대시보드로 이동 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
