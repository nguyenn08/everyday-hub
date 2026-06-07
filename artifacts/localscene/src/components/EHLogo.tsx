export function EHLogo({ size = 32 }: { size?: number }) {
  const scale = size / 64;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size * (60 / 64)}
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="ehPinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <path
        d="M32 4C20.954 4 12 12.954 12 24c0 15 20 36 20 36s20-21 20-36C52 12.954 43.046 4 32 4z"
        fill="url(#ehPinGrad)"
      />
      <circle cx="32" cy="24" r="13" fill="white" opacity="0.18" />
      <text
        x="32"
        y="29"
        fontFamily="Arial Black, Arial, sans-serif"
        fontSize="12"
        fontWeight="900"
        fill="white"
        textAnchor="middle"
        letterSpacing="0.5"
      >
        EH
      </text>
    </svg>
  );
}
