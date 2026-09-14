/**
 * 직접 선택 PICK 9단계 — 구매 완료 (핸드오프 v1.0 §10.4, 시안 img_09)
 *
 * 주문·계약 정보, 선수별 실행 일정, 지금 할 일을 한 화면에 둔다.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle, BarChart3, CheckCircle2, ChevronRight, FileText, Image,
  Loader2, Mail, Phone, User,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import DirectStepBar from '../../components/direct/DirectStepBar';
import { api } from '../../services/api';

const NEXT_STEPS = [
  { icon: FileText, title: '소재 최종 제출', desc: '로고, 문구 등 캠페인에 필요한 최종 소재를 제출해주세요.' },
  { icon: Image, title: '패치 · 온라인 이미지 제작', desc: '제출된 소재로 패치와 온라인 이미지를 제작합니다.' },
  { icon: User, title: '선수 확인 및 게시 · 출전', desc: '선수가 최종 확인 후 온·오프라인 노출 및 경기에 출전합니다.' },
  { icon: BarChart3, title: '성과 리포트', desc: '캠페인 결과와 성과 데이터를 정리하여 전달드립니다.' },
];

const TODO = [
  { title: '로고 원본 확인', desc: 'AI, PNG, SVG 등 원본 파일 형식 확인' },
  { title: '캠페인 문구 제출', desc: '선수 노출에 사용할 공식 문구 제출' },
  { title: '랜딩 URL 확인', desc: '온라인 노출을 위한 링크 최종 확인' },
  { title: '세금계산서 이메일 확인', desc: '세금계산서 수신 이메일 주소 확인' },
];

export default function DirectComplete() {
  const { applicationId } = useParams();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<number[]>([]);

  const load = useCallback(async () => {
    try {
      const r: any = await api.getApplication(applicationId!);
      setApp(r?.data || null);
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '주문 정보를 불러오지 못했습니다');
    } finally { setLoading(false); }
  }, [applicationId]);
  useEffect(() => { load(); }, [load]);

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

  const paid = app.status === 'ACTIVE';
  const items = (app.items || []).filter((i: any) => i.status === 'APPROVED');
  const orderNo = `SP-${new Date(app.paidAt || app.createdAt).toISOString().slice(0, 10).replace(/-/g, '')}-${String(app.id).slice(0, 4).toUpperCase()}`;
  const total = app.totalAmount + app.vatAmount;

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-16">
      <PublicHeader />
      <DirectStepBar current={9} crumbs={[{ label: '완료' }]} />

      <div className="max-w-[1400px] mx-auto px-5 pt-8">
        <div className="text-center">
          <span className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </span>
          <h1 className="mt-4 text-[26px] sm:text-[32px] font-black tracking-tight">
            후원 계약이 <span className="text-emerald-600">완료</span>되었습니다
          </h1>
          <p className="mt-2 text-[13.5px] text-slate-500">
            {paid ? '이제 선수별 실행 준비를 시작합니다.' : '결제 확인 후 실행 준비가 시작됩니다.'}
          </p>
        </div>

        {/* 주문 정보 */}
        <div className="mt-6 rounded-2xl bg-white border border-slate-200 px-6 py-5 grid sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
          <Info label="주문번호" value={orderNo} />
          <Info label="결제 금액" value={`${total.toLocaleString()}원`} accent />
          <Info label="계약일" value={new Date(app.paidAt || app.createdAt).toLocaleDateString('ko-KR')} />
        </div>

        {/* 다음 단계 */}
        <div className="mt-6">
          <h2 className="text-[15px] font-extrabold">앞으로의 진행 단계</h2>
          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {NEXT_STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl bg-white border border-slate-200 p-5">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <s.icon className="w-4 h-4 text-emerald-600" />
                  </span>
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[12px] font-black flex items-center justify-center">{i + 1}</span>
                </div>
                <p className="mt-3 text-[13.5px] font-extrabold">{s.title}</p>
                <p className="mt-1 text-[12.5px] text-slate-500 break-keep">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-5 items-start">
          {/* 선수별 실행 일정 */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <h2 className="text-[15px] font-extrabold">선수별 실행 일정</h2>
            <p className="mt-1 text-[12px] text-slate-500">선수별 준비 및 노출 일정을 확인하세요.</p>
            <ul className="mt-4 divide-y divide-slate-100">
              {items.map((i: any, idx: number) => (
                <li key={i.id} className="py-3.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 shrink-0">
                    {i.athlete?.profileImageUrl && <img src={i.athlete.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-extrabold">{i.athlete?.name} <span className="text-[12px] font-bold text-slate-500">프로</span></p>
                    <p className="text-[12.5px] text-slate-500">{i.athlete?.tour} · {i.slotName}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[12px] text-slate-500">다음 단계</p>
                    <p className="text-[12.5px] font-bold">{idx === 0 ? '소재 최종 제출' : idx === 1 ? '패치 제작' : '선수 확인'}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-1 rounded-md text-[12px] font-bold ${
                    idx === 0 ? 'bg-emerald-50 text-emerald-700' : idx === 1 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {idx === 0 ? '준비 중' : idx === 1 ? '대기 중' : '예정'}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 pt-3 border-t border-slate-100 text-[12.5px] text-slate-500 break-keep">
              정확한 일정은 패치 제작 리드타임과 대회 일정에 따라 선수별 안내로 확정됩니다.
            </p>
          </div>

          {/* 지금 할 일 · 문의 */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <h2 className="text-[15px] font-extrabold">지금 할 일</h2>
              <p className="mt-1 text-[12px] text-slate-500">아래 항목을 확인하고 준비해주세요.</p>
              <ul className="mt-3 space-y-2">
                {TODO.map((t, i) => {
                  const on = done.includes(i);
                  return (
                    <li key={t.title}>
                      <label className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 cursor-pointer hover:border-slate-200">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={(e) => setDone(e.target.checked ? [...done, i] : done.filter((x) => x !== i))}
                          className="w-4 h-4 accent-emerald-600 shrink-0 mt-0.5"
                        />
                        <span className="min-w-0">
                          <span className={`block text-[13px] font-bold ${on ? 'text-slate-500 line-through' : ''}`}>{t.title}</span>
                          <span className="block text-[12.5px] text-slate-500 break-keep">{t.desc}</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <h2 className="text-[15px] font-extrabold">도움이 필요하신가요?</h2>
              <p className="mt-1 text-[12px] text-slate-500">평일 09:00 ~ 18:00 (주말 및 공휴일 휴무)</p>
              <div className="mt-3 space-y-2">
                <a href="tel:02-6953-1987" className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 py-3 text-[13px] font-bold hover:bg-slate-50">
                  <Phone className="w-4 h-4 text-slate-500" /> 02-6953-1987
                </a>
                <a href="mailto:help@sponpik.com" className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 py-3 text-[13px] font-bold hover:bg-slate-50">
                  <Mail className="w-4 h-4 text-slate-500" /> help@sponpik.com
                </a>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            to="/dashboard"
            className="h-12 px-7 inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white text-[14.5px] font-bold hover:bg-emerald-700"
          >
            <BarChart3 className="w-4 h-4" /> 캠페인 대시보드로 이동
          </Link>
          <Link
            to={`/sponsor/applications/${app.id}`}
            className="h-12 px-7 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[14px] font-bold hover:bg-slate-50"
          >
            후원 내역 보기 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[12.5px] text-slate-500">{label}</p>
      <p className={`mt-1 text-[16px] font-black ${accent ? 'text-emerald-600' : ''}`}>{value}</p>
    </div>
  );
}
