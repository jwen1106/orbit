interface CompletionDonutProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function CompletionDonut({
  percent,
  size = 112,
  strokeWidth = 10,
  label = 'Complete',
}: CompletionDonutProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const centre = size / 2;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={centre}
            cy={centre}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={centre}
            cy={centre}
            r={radius}
            fill="none"
            stroke="#1B4332"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-orbit-forest leading-none">{clamped}%</span>
          <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">{label}</span>
        </div>
      </div>
    </div>
  );
}
