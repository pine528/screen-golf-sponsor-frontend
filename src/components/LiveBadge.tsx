/**
 * 라이브 진행 중임을 나타내는 공용 뱃지.
 * 메뉴·페이지 제목 등 '라이브 경매' 문구 옆에 붙여 표기를 통일한다.
 */
export default function LiveBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[10px] font-extrabold leading-none tracking-wide ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
      LIVE
    </span>
  );
}
