export function ToolBILogo() {
  return (
    <svg width="112" height="30" viewBox="0 0 112 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tbi-a1" x1="3" y1="28" x2="13" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#48CAE4" />
          <stop offset="100%" stopColor="#0096C7" />
        </linearGradient>
        <linearGradient id="tbi-a2" x1="8" y1="28" x2="18" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0096C7" />
          <stop offset="100%" stopColor="#0077B6" />
        </linearGradient>
        <linearGradient id="tbi-a3" x1="13" y1="28" x2="23" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0077B6" />
          <stop offset="100%" stopColor="#023E8A" />
        </linearGradient>
        <linearGradient id="tbi-txt" x1="68" y1="0" x2="96" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0077B6" />
          <stop offset="100%" stopColor="#023E8A" />
        </linearGradient>
      </defs>

      <path d="M1,28 L5,28 L15,6 L18,6 L13,0 L8,6 L11,6 Z" fill="url(#tbi-a1)" opacity="0.5" />
      <path d="M6,28 L10,28 L20,6 L23,6 L18,0 L13,6 L16,6 Z" fill="url(#tbi-a2)" opacity="0.75" />
      <path d="M11,28 L15,28 L25,6 L28,6 L23,0 L18,6 L21,6 Z" fill="url(#tbi-a3)" />

      <text
        x="34"
        y="22"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif"
        fontSize="16"
        fontWeight="700"
        letterSpacing="-0.4"
      >
        <tspan fill="#1C1C1E">Tool</tspan>
        <tspan fill="url(#tbi-txt)" fontWeight="800">BI</tspan>
      </text>
    </svg>
  )
}
