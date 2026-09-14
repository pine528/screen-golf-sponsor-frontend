/**
 * 공통 상태 화면 — UI/UX 통합 가이드 v1.0 §17.2 · 통합 핸드오프 v2.1 §20
 *
 *  loading    skeleton + CTA disabled, 3초 초과 시 안내·재시도
 *  empty      왜 비어 있는지 + 다음 행동
 *  error      문제 + trace_id + 재시도/문의
 *  restricted 비공개 범주 + 이유 + 해결 경로(로그인/검증/권한)
 *  expired    종료 + 대안
 *  stale      기준일 + 갱신 필요 (구매·결제 차단)
 *  conflict   이전/현재 + 원인 + 대안
 *
 *  상태·오류는 색상만으로 구분하지 않는다 (아이콘 + 텍스트).
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, Clock, Inbox, Loader2, Lock, RefreshCw, ShieldAlert, XCircle,
} from 'lucide-react';

/** v2.1 §20.1 표준 오류 코드 → 사용자 문구 + 권장 행동 */
export const STANDARD_ERROR: Record<string, { title: string; hint: string }> = {
  SOLD_OUT: { title: '재고가 소진되었습니다', hint: '재오픈 알림을 받거나 유사 상품을 확인하세요' },
  RESOURCE_CONFLICT: { title: '다른 구성과 충돌합니다', hint: '충돌 항목을 바꾸거나 대안을 선택하세요' },
  PRICE_CHANGED: { title: '가격이 변경되었습니다', hint: '이전 → 현재 금액을 확인하고 다시 동의해 주세요' },
  APPROVAL_EXPIRED: { title: '승인 유효기간이 지났습니다', hint: '재승인을 요청하거나 일반 승인으로 진행하세요' },
  OPTION_INVALID: { title: '선택할 수 없는 옵션입니다', hint: '허용된 옵션으로 되돌렸습니다' },
  RIGHTS_CONFLICT: { title: '요청한 사용권을 제공할 수 없습니다', hint: '권리 범위를 줄이거나 상담을 요청하세요' },
  CART_GROUP_MISMATCH: { title: '함께 결제할 수 없는 주문군입니다', hint: '주문군별로 나누어 진행하세요' },
  DATA_STALE: { title: '판매 정보 확인이 필요합니다', hint: '운영 확인 후 구매가 다시 열립니다' },
  STALE_RECOMMENDATION: { title: '추천이 오래되었습니다', hint: '추천을 갱신하면 최신 재고·가격으로 다시 계산합니다' },
  PAYMENT_PENDING: { title: '결제를 확인하는 중입니다', hint: '잠시 후 다시 확인해 주세요' },
  UNAUTHORIZED: { title: '로그인이 필요합니다', hint: '로그인 후 하던 작업으로 돌아옵니다' },
  FORBIDDEN: { title: '권한이 없는 화면입니다', hint: '브랜드·선수 계정 검증 후 이용할 수 있습니다' },
};

/** Axios 오류 → {code, message, traceId, status} */
export function readError(e: any) {
  const status: number | undefined = e?.response?.status;
  const body = e?.response?.data;
  const code: string | undefined = body?.error?.code || body?.code || (status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : undefined);
  const std = code ? STANDARD_ERROR[code] : undefined;
  return {
    status,
    code,
    title: std?.title || body?.error?.message || body?.message || (status ? `요청을 처리하지 못했습니다 (${status})` : '네트워크에 연결할 수 없습니다'),
    hint: std?.hint || (status ? undefined : '연결을 확인한 뒤 다시 시도해 주세요'),
    traceId: body?.traceId || body?.error?.traceId || e?.response?.headers?.['x-trace-id'] || e?.response?.headers?.['x-request-id'],
  };
}

/** 3초 넘게 로딩이면 true — 안내·재시도 노출용 */
export function useSlowLoading(loading: boolean, ms = 3000) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!loading) { setSlow(false); return; }
    const t = setTimeout(() => setSlow(true), ms);
    return () => clearTimeout(t);
  }, [loading, ms]);
  return slow;
}

function Frame({ icon, tone, title, desc, children }: {
  icon: ReactNode; tone: string; title: string; desc?: ReactNode; children?: ReactNode;
}) {
  return (
    <div role="status" className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
      <span className={`w-12 h-12 rounded-2xl inline-flex items-center justify-center ${tone}`}>{icon}</span>
      <p className="mt-4 text-[15px] font-bold text-slate-800 break-keep">{title}</p>
      {desc && <div className="mt-1.5 text-[13.5px] text-slate-500 break-keep leading-relaxed">{desc}</div>}
      {children && <div className="mt-5 flex flex-wrap gap-2 justify-center">{children}</div>}
    </div>
  );
}

export function Btn({ to, onClick, children, primary }: { to?: string; onClick?: () => void; children: ReactNode; primary?: boolean }) {
  const cls = `inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-[13px] font-bold ${
    primary ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'border border-slate-200 text-slate-700 hover:border-slate-400'
  }`;
  return to ? <Link to={to} className={cls}>{children}</Link> : <button onClick={onClick} className={cls}>{children}</button>;
}

/** loading — skeleton 대신 쓰는 최소 형태. 3초 초과 시 안내 + 재시도 */
export function LoadingState({ label = '불러오는 중…', slow, onRetry, className = '' }: {
  label?: string; slow?: boolean; onRetry?: () => void; className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={`py-20 text-center ${className}`}>
      <Loader2 className="w-7 h-7 text-emerald-500 animate-spin mx-auto" />
      <p className="mt-3 text-[13.5px] text-slate-500">{label}</p>
      {slow && (
        <div className="mt-3">
          <p className="text-[13px] text-slate-500">평소보다 오래 걸리고 있습니다.</p>
          {onRetry && (
            <button onClick={onRetry} className="mt-2 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-slate-200 text-[13px] font-bold text-slate-700">
              <RefreshCw className="w-3.5 h-3.5" /> 다시 시도
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** empty — 이유 + 다음 행동 */
export function EmptyState({ title, desc, children }: { title: string; desc?: ReactNode; children?: ReactNode }) {
  return <Frame icon={<Inbox className="w-5 h-5" />} tone="bg-white text-slate-500 border border-slate-200" title={title} desc={desc}>{children}</Frame>;
}

/** error — 문제 + trace_id + 재시도/문의 */
export function ErrorState({ error, title, onRetry, contactTo = '/contact', children }: {
  error?: any; title?: string; onRetry?: () => void; contactTo?: string; children?: ReactNode;
}) {
  const e = readError(error);
  return (
    <Frame icon={<XCircle className="w-5 h-5" />} tone="bg-rose-50 text-rose-600"
      title={title || e.title}
      desc={<>
        {e.hint && <span className="block">{e.hint}</span>}
        {e.traceId && <span className="block mt-1 text-[12px] text-slate-400 tabular-nums">문의 시 참조번호 {e.traceId}</span>}
      </>}>
      {onRetry && <Btn onClick={onRetry} primary><RefreshCw className="w-3.5 h-3.5" /> 다시 시도</Btn>}
      <Btn to={contactTo}>문의하기</Btn>
      {children}
    </Frame>
  );
}

/** restricted — 비공개 범주 + 이유 + 해결 경로 (CTA를 숨기지 않는다) */
export function RestrictedState({ reason, loginReturn, children }: { reason: string; loginReturn?: string; children?: ReactNode }) {
  const returnUrl = loginReturn ?? (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');
  return (
    <Frame icon={<Lock className="w-5 h-5" />} tone="bg-amber-50 text-amber-600" title="지금은 볼 수 없는 정보입니다" desc={reason}>
      <Btn to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} primary>로그인 후 이어서 <ArrowRight className="w-3.5 h-3.5" /></Btn>
      {children}
    </Frame>
  );
}

/** expired — 종료 + 대안 */
export function ExpiredState({ title = '종료된 항목입니다', desc, children }: { title?: string; desc?: ReactNode; children?: ReactNode }) {
  return <Frame icon={<Clock className="w-5 h-5" />} tone="bg-slate-100 text-slate-500" title={title} desc={desc}>{children}</Frame>;
}

/** stale — 기준일 + 갱신 필요 */
export function StaleState({ asOf, desc = '핵심 판매 정보가 오래되어 구매를 잠시 막았습니다. 운영 확인 후 다시 열립니다.', onRefresh, children }: {
  asOf?: string | null; desc?: string; onRefresh?: () => void; children?: ReactNode;
}) {
  return (
    <Frame icon={<ShieldAlert className="w-5 h-5" />} tone="bg-amber-50 text-amber-600" title="정보 갱신이 필요합니다"
      desc={<>{asOf && <span className="block">기준일 {new Date(asOf).toLocaleDateString('ko-KR')}</span>}<span className="block">{desc}</span></>}>
      {onRefresh && <Btn onClick={onRefresh} primary><RefreshCw className="w-3.5 h-3.5" /> 다시 확인</Btn>}
      {children}
    </Frame>
  );
}

/** conflict — 이전/현재 + 원인 + 대안 */
export function ConflictState({ reason, before, after, children }: {
  reason: string; before?: string; after?: string; children?: ReactNode;
}) {
  return (
    <Frame icon={<AlertTriangle className="w-5 h-5" />} tone="bg-rose-50 text-rose-600" title="변경된 조건이 있습니다" desc={reason}>
      {(before || after) && (
        <div className="w-full max-w-sm mx-auto rounded-xl bg-white border border-slate-200 px-4 py-3 text-[13px] flex items-center justify-between gap-3 tabular-nums">
          <span className="text-slate-500 line-through">{before ?? '-'}</span>
          <ArrowRight className="w-4 h-4 text-slate-300" />
          <span className="font-extrabold text-slate-900">{after ?? '-'}</span>
        </div>
      )}
      {children}
    </Frame>
  );
}
