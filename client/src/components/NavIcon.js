const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export default function NavIcon({ name }) {
  const size = 20;
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
  };

  switch (name) {
    case 'dashboard':
      return (
        <svg {...common}>
          <path {...stroke} d="M3 11.5 12 4l9 7.5" />
          <path {...stroke} d="M5 10v10h14V10" />
        </svg>
      );
    case 'students':
      return (
        <svg {...common}>
          <path {...stroke} d="M16 19h5v-2a4 4 0 0 0-4-4h-1" />
          <circle {...stroke} cx="9" cy="8" r="3.5" />
          <path {...stroke} d="M3 19h7v-1.5a4 4 0 0 0-4-4H5" />
        </svg>
      );
    case 'collect':
      return (
        <svg {...common}>
          <rect {...stroke} x="2" y="5" width="20" height="14" rx="2" />
          <path {...stroke} d="M2 10h20" />
          <path {...stroke} d="M6 15h4" />
        </svg>
      );
    case 'vouchers':
      return (
        <svg {...common}>
          <path
            {...stroke}
            d="M8 3h8a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2z"
          />
          <path {...stroke} d="M9 8h6M9 12h4" />
        </svg>
      );
    case 'reports':
      return (
        <svg {...common}>
          <path {...stroke} d="M4 19V5a2 2 0 0 1 2-2h12v16" />
          <path {...stroke} d="M8 17v-4M12 17V9M16 17v-2" />
        </svg>
      );
    case 'staff':
      return (
        <svg {...common}>
          <path {...stroke} d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z" />
          <path {...stroke} d="M4 20a8 8 0 0 1 16 0" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle {...stroke} cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
