interface OrbitLogoProps {
  variant?: 'full' | 'mark-only' | 'wordmark-only';
  size?: 'sm' | 'md' | 'lg';
  onDark?: boolean;
}

const sizes = {
  sm: { mark: 28, fontSize: 18, subtextSize: 10 },
  md: { mark: 40, fontSize: 26, subtextSize: 13 },
  lg: { mark: 56, fontSize: 36, subtextSize: 16 },
};

export default function OrbitLogo({
  variant = 'full',
  size = 'md',
  onDark = false,
}: OrbitLogoProps) {
  const { mark, fontSize, subtextSize } = sizes[size];
  const textColor = onDark ? '#ffffff' : '#1A4D23';
  const subtextColor = onDark ? '#a5c8a8' : '#2E7D3A';

  const LogoMark = () => (
    <svg
      width={mark}
      height={mark}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="sphere-fill" cx="36%" cy="32%" r="52%">
          <stop offset="0%" stopColor="#DC8A14" />
          <stop offset="100%" stopColor="#1A4D23" />
        </radialGradient>
        <radialGradient id="sphere-shine" cx="36%" cy="32%" r="52%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`clip-l-${size}`}>
          <rect x="0" y="0" width="50" height="100" />
        </clipPath>
        <clipPath id={`clip-r-${size}`}>
          <rect x="50" y="0" width="50" height="100" />
        </clipPath>
      </defs>
      {/* Back orbit halves */}
      <ellipse
        cx="50" cy="50" rx="46" ry="16"
        transform="rotate(45 50 50)"
        fill="none" stroke="#1A4D23" strokeWidth="4"
        clipPath={`url(#clip-l-${size})`} opacity="0.3"
      />
      <ellipse
        cx="50" cy="50" rx="46" ry="16"
        transform="rotate(135 50 50)"
        fill="none" stroke="#DC8A14" strokeWidth="4"
        clipPath={`url(#clip-r-${size})`} opacity="0.3"
      />
      {/* Sphere */}
      <circle cx="50" cy="50" r="14" fill="url(#sphere-fill)" />
      <circle cx="50" cy="50" r="14" fill="url(#sphere-shine)" />
      {/* Front orbit halves */}
      <ellipse
        cx="50" cy="50" rx="46" ry="16"
        transform="rotate(45 50 50)"
        fill="none" stroke="#1A4D23" strokeWidth="4"
        clipPath={`url(#clip-r-${size})`}
      />
      <ellipse
        cx="50" cy="50" rx="46" ry="16"
        transform="rotate(135 50 50)"
        fill="none" stroke="#DC8A14" strokeWidth="4"
        clipPath={`url(#clip-l-${size})`}
      />
    </svg>
  );

  if (variant === 'mark-only') {
    return <LogoMark />;
  }

  if (variant === 'wordmark-only') {
    return (
      <div style={{ lineHeight: 1 }}>
        <div
          style={{
            fontSize,
            fontWeight: 700,
            color: textColor,
            fontFamily: 'Arial, Helvetica, sans-serif',
            letterSpacing: '1px',
          }}
        >
          ORBIT
        </div>
        <div
          style={{
            fontSize: subtextSize,
            color: subtextColor,
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          by Oaklin
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2" style={{ lineHeight: 1 }}>
      <LogoMark />
      <div>
        <div
          style={{
            fontSize,
            fontWeight: 700,
            color: textColor,
            fontFamily: 'Arial, Helvetica, sans-serif',
            letterSpacing: '1px',
          }}
        >
          ORBIT
        </div>
        <div
          style={{
            fontSize: subtextSize,
            color: subtextColor,
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          by Oaklin
        </div>
      </div>
    </div>
  );
}
