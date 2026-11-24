export const Star = ({ on = true }: { on?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    className={`ico star ${on ? '' : 'off'}`}
    aria-hidden="true"
  >
    <path
      d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5l-5.9 3.2 1.2-6.6L2.5 9.5l6.6-.9z"
      fill="#ffb81c"
      stroke="#d98a00"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

export const Flame = () => (
  <svg viewBox="0 0 24 24" className="ico" aria-hidden="true">
    <path
      d="M12 2c1 4 5 5.500 5 11a5 5 0 0 1-10 0c0-2 1-3.500 2-4.500 0 2 1 3 2 3 0-3-1-5 1-9.500z"
      fill="#ff4500"
    />
    <path
      d="M12 12c1 1.500 2 2.300 2 4a2 2 0 0 1-4 0c0-1.500 1-2.300 2-4z"
      fill="#ffd166"
    />
  </svg>
);

export const Paw = () => (
  <svg
    viewBox="0 0 24 24"
    className="ico"
    aria-hidden="true"
    fill="currentColor"
  >
    <ellipse cx="12" cy="16" rx="5" ry="4" />
    <circle cx="5.500" cy="10.500" r="2.200" />
    <circle cx="9.500" cy="6.500" r="2.200" />
    <circle cx="14.500" cy="6.500" r="2.200" />
    <circle cx="18.500" cy="10.500" r="2.200" />
  </svg>
);
