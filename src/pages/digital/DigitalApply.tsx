/**
 * 디지털 파트너 — 플랜 선택 + 브랜드 정보 (핸드오프 v1.0 §5.4, 시안 img_10)
 *
 * 우측에 구독 신청 요약(선수·플랜·월액·총 계약금액·다음 결제일)과
 * "경기복·대회 현장 사용 불가"를 항상 표시한다 (UX-02·UX-06).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Ban, Check, ChevronRight, Info, Upload,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';

const STEPS = ['선수 선택', '상품 선택', '브랜드 승인', '계약 · 결제'];

const CATEGORIES = ['뷰티/화장품', '패션/의류', '식품/음료', '건강/헬스', 'IT/전자제품', '생활/리빙', '기타'];
const REGIONS = ['서울', '경기·인천', '충청', '전라', '경상', '강원', '제주', '전국'];
const SCOPES = [
  { key: 'WEB_SNS', label: '홈페이지 · SNS' },
  { key: 'FANSTORE', label: '팬스토어' },
  { key: 'STORE_POP', label: '등록매장 POP' },
];

export default function DigitalApply() {
  const { athleteId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [planCode, setPlanCode] = useState<string>('GROW');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const [homepage, setHomepage] = useState('');
  const [storeCount, setStoreCount] = useState('');
  const [scopes, setScopes] = useState<string[]>(['WEB_SNS', 'FANSTORE', 'STORE_POP']);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r: any = await api.getDigitalAthlete(athleteId!);
      setData(r?.data);
      const grow = r?.data?.plans?.find((p: any) => p.code === 'GROW' && p.remaining > 0);
      const first = r?.data?.plans?.find((p: any) => p.remaining > 0);
      setPlanCode((grow || first)?.code || 'GROW');
    } catch {
      setErr('선수 정보를 불러오지 못했습니다');
    }
  }, [athleteId]);
  useEffect(() => { load(); }, [load]);

  const plan = useMemo(() => data?.plans?.find((p: any) => p.code === planCode), [data, planCode]);

  const submit = async () => {
    if (!plan) return;
    setSubmitting(true);
    setErr(null);
    try {
      const r: any = await api.applyDigitalPartner({
        athleteId, planCode, category, region, homepage,
        storeCount: storeCount ? Number(storeCount) : undefined,
        scopes,
      });
      navigate(`/digital-partner/applications/${r.data.id}`);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) { navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`); return; }
      setErr(status === 403 ? '브랜드 계정으로 로그인하면 신청할 수 있어요.' : e?.response?.data?.error?.message || '신청에 실패했습니다');
    } finally { setSubmitting(false); }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="py-24 text-center">
          {err ? <p className="text-[15px] font-bold">{err}</p>
            : <div className="w-10 h-10 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin mx-auto" />}
        </div>
      </div>
    );
  }

  const a = data.athlete;
  const nextBilling = new Date();
  nextBilling.setMonth(nextBilling.getMonth() + 1);

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16">
      <PublicHeader />

      <div className="max-w-7xl mx-auto px-5 pt-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[12.5px]">
            <Link to="/" className="text-slate-500 hover:text-slate-600">홈</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link to="/digital-partner" className="text-slate-500 hover:text-slate-600">디지털 파트너 월 구독</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-emerald-700">상품 선택</span>
          </nav>
          <ol className="flex items-center gap-1.5 overflow-x-auto">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-1.5 shrink-0">
                <span className={`w-6 h-6 rounded-full text-[12px] font-black flex items-center justify-center ${
                  i === 0 ? 'bg-emerald-100 text-emerald-700' : i === 1 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>{i === 0 ? <Check className="w-3 h-3" /> : i + 1}</span>
                <span className={`text-[12px] font-bold ${i === 1 ? 'text-emerald-700' : 'text-slate-500'}`}>{s}</span>
                {i < STEPS.length - 1 && <span className="w-5 h-px bg-slate-200 mx-1" />}
              </li>
            ))}
          </ol>
        </div>

        <Link to="/digital-partner/athletes" className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-700 hover:text-emerald-800">
          <ArrowLeft className="w-4 h-4" /> 선수 선택으로 돌아가기
        </Link>

        <h1 className="mt-3 text-[24px] sm:text-[30px] font-black tracking-tight">브랜드에 맞는 구독상품을 선택하세요</h1>
        <p className="mt-2 text-[13.5px] text-slate-500">모든 상품은 12개월 약정이며 경기복 · 대회 현장 부착은 포함되지 않습니다.</p>

        <div className="mt-7 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] gap-5 items-start">
          <div className="space-y-4">
            {/* 플랜 3종 */}
            <div className="grid sm:grid-cols-3 gap-4">
              {data.plans.map((p: any) => {
                const on = planCode === p.code;
                const sold = p.remaining <= 0 || !p.isOpen;
                return (
                  <div
                    key={p.code}
                    className={`relative rounded-2xl border p-5 flex flex-col ${
                      on ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'
                    } ${sold ? 'opacity-50' : ''}`}
                  >
                    {p.code === 'GROW' && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[12.5px] font-black tracking-wide">
                        RECOMMENDED
                      </span>
                    )}
                    <h2 className="text-center text-[16px] font-black tracking-wide">{p.name}</h2>
                    <p className="mt-2 text-center text-[19px] font-black text-emerald-600">월 {p.monthlyPrice.toLocaleString()}원</p>
                    <ul className="mt-4 space-y-2 flex-1">
                      {(p.benefits || []).map((b: string) => (
                        <li key={b} className="flex items-start gap-1.5 text-[12.5px] text-slate-600">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> {b}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 pt-3 border-t border-slate-100 text-[12px] text-slate-500 text-center">
                      연간 총액 {p.annualTotal.toLocaleString()}원 · {p.termMonths}개월 약정
                    </p>
                    <p className="mt-1 text-[12px] text-center text-slate-500">
                      잔여 {p.remaining}/{p.capacity}
                    </p>
                    <button
                      onClick={() => !sold && setPlanCode(p.code)}
                      disabled={sold}
                      className={`mt-3 h-11 w-full inline-flex items-center justify-center gap-1.5 rounded-xl text-[13.5px] font-bold transition-colors ${
                        sold ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                          : on ? 'bg-emerald-600 text-white' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {sold ? '모집 마감' : on ? <>선택됨 <Check className="w-4 h-4" /></> : '선택하기'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 브랜드 기본정보 */}
            <div className="rounded-2xl border border-slate-200 p-5 sm:p-6">
              <h2 className="text-[15px] font-extrabold mb-4">브랜드 기본정보</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <label className="block">
                  <span className="text-[12px] font-bold text-slate-500">업종</span>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1.5 w-full h-11 rounded-xl border border-slate-200 px-3 text-[13.5px] focus:outline-none focus:border-emerald-400">
                    <option value="">업종을 선택하세요</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[12px] font-bold text-slate-500">활동지역</span>
                  <select value={region} onChange={(e) => setRegion(e.target.value)} className="mt-1.5 w-full h-11 rounded-xl border border-slate-200 px-3 text-[13.5px] focus:outline-none focus:border-emerald-400">
                    <option value="">활동지역을 선택하세요</option>
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[12px] font-bold text-slate-500">홈페이지 <span className="font-normal text-slate-500">(선택)</span></span>
                  <input value={homepage} onChange={(e) => setHomepage(e.target.value)} placeholder="https://" className="mt-1.5 w-full h-11 rounded-xl border border-slate-200 px-3 text-[13.5px] focus:outline-none focus:border-emerald-400" />
                </label>
                <label className="block">
                  <span className="text-[12px] font-bold text-slate-500">등록매장 수</span>
                  <input value={storeCount} onChange={(e) => setStoreCount(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="예) 25" className="mt-1.5 w-full h-11 rounded-xl border border-slate-200 px-3 text-[13.5px] focus:outline-none focus:border-emerald-400" />
                </label>
              </div>

              <div className="mt-5 grid sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)] gap-5">
                <div>
                  <span className="text-[12px] font-bold text-slate-500">로고 파일 <span className="font-normal text-slate-500">(선택)</span></span>
                  <div className="mt-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-5 text-center">
                    <Upload className="w-5 h-5 text-slate-500 mx-auto" />
                    <p className="mt-1.5 text-[12px] font-bold text-slate-500">파일 선택 또는 드래그</p>
                    <p className="text-[12.5px] text-slate-500">PNG, JPG · 2MB 이하</p>
                    <p className="mt-1.5 text-[12.5px] text-slate-500">승인 후 업로드 안내를 보내드립니다</p>
                  </div>
                </div>
                <div>
                  <span className="text-[12px] font-bold text-slate-500">사용 희망범위 <span className="font-normal text-slate-500">(중복 선택 가능)</span></span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SCOPES.map((s) => {
                      const on = scopes.includes(s.key);
                      return (
                        <button
                          key={s.key}
                          onClick={() => setScopes(on ? scopes.filter((x) => x !== s.key) : [...scopes, s.key])}
                          className={`px-3.5 py-2 rounded-lg border text-[12.5px] font-bold inline-flex items-center gap-1.5 transition-colors ${
                            on ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          {on && <Check className="w-3.5 h-3.5" />} {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <p className="mt-5 flex items-center gap-1.5 pt-4 border-t border-slate-100 text-[12.5px] text-slate-500">
                <Info className="w-3.5 h-3.5" /> 선수 승인 후 소재 제작과 사용이 가능합니다.
              </p>
            </div>
          </div>

          {/* 우: 신청 요약 */}
          <aside className="lg:sticky lg:top-24 rounded-2xl border border-slate-200 p-5">
            <h2 className="text-[15px] font-extrabold mb-4">구독 신청 요약</h2>
            <div className="flex items-center gap-3">
              <span className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 shrink-0">
                {a.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-extrabold">{a.name} <span className="text-[12px] font-bold text-slate-500">프로</span></p>
                <p className="text-[12.5px] text-slate-500">{[a.tour, a.region].filter(Boolean).join(' · ')}</p>
              </div>
            </div>

            <dl className="mt-5 space-y-2.5 text-[13px]">
              <div className="flex justify-between"><dt className="text-slate-500">선택 상품</dt><dd className="font-extrabold">{plan?.name || '-'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">월 구독료</dt><dd className="font-bold tabular-nums">{plan ? `${plan.monthlyPrice.toLocaleString()}원` : '-'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">약정 기간</dt><dd className="font-bold">{plan?.termMonths || 12}개월</dd></div>
            </dl>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-bold">총 계약금액</span>
                <span className="text-[20px] font-black text-emerald-600 tabular-nums">{plan ? plan.annualTotal.toLocaleString() : '-'}원</span>
              </div>
              <p className="mt-1 text-right text-[12px] text-slate-500">VAT 별도</p>
              <div className="mt-2 flex justify-between text-[12px]">
                <span className="text-slate-500">다음 결제 예정일</span>
                <span className="font-bold">{nextBilling.toLocaleDateString('ko-KR')}</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-rose-50 border border-rose-100 px-3.5 py-3 flex items-start gap-2">
              <Ban className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[12.5px] font-extrabold text-rose-700">경기복 · 대회 현장 사용 불가</p>
                <p className="mt-0.5 text-[12.5px] text-rose-600/90 break-keep">본 상품은 경기복 · 대회 현장 부착이 포함되지 않습니다.</p>
              </div>
            </div>

            {err && <p className="mt-3 text-[12.5px] font-bold text-rose-600 break-keep">{err}</p>}

            <button
              onClick={submit}
              disabled={submitting || !plan}
              className="mt-4 w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-[14.5px] font-bold hover:bg-emerald-700 disabled:opacity-40 transition-colors"
            >
              {submitting ? '신청 중…' : <>선수 승인 요청하기 <ChevronRight className="w-4 h-4" /></>}
            </button>
            <p className="mt-2 text-center text-[12px] text-slate-500">신청은 결제가 아니며, 선수 승인 후 계약·결제합니다.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
