/** 시즌 장식용 8각 별 (북극성 / 크리스마스 별을 단순화한 라인 마크) */
export function StarMark({
  className,
  strokeWidth = 1,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 1.5 13.6 10.4 22.5 12 13.6 13.6 12 22.5 10.4 13.6 1.5 12 10.4 10.4Z" />
      <path
        d="M12 6.2 12.9 11.1 17.8 12 12.9 12.9 12 17.8 11.1 12.9 6.2 12 11.1 11.1Z"
        opacity=".55"
        transform="rotate(45 12 12)"
      />
    </svg>
  );
}
