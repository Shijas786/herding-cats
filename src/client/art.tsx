// Hand-drawn living-room pieces. One style everywhere: thick warm outlines, flat fills.
const LINE = '#4a2f1d';

const Box = () => (
  <svg viewBox="0 0 100 100" className="art" aria-hidden="true">
    <path
      d="M12 34 L50 22 L88 34 L88 82 L50 94 L12 82 Z"
      fill="#d9a066"
      stroke={LINE}
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <path
      d="M12 34 L50 46 L88 34 M50 46 L50 94"
      fill="none"
      stroke={LINE}
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <path d="M12 34 L50 46 L50 94 L12 82 Z" fill="#c48a52" />
    <path
      d="M12 34 L50 46 L88 34 M50 46 L50 94 M12 34 L12 82 L50 94"
      fill="none"
      stroke={LINE}
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <path
      d="M12 34 L4 20 L42 8 L50 22 M88 34 L96 20 L58 8 L50 22"
      fill="#e8b97e"
      stroke={LINE}
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <path
      d="M27 60 l10 3 v10 l-10 -3 z"
      fill="#f6e3c3"
      stroke={LINE}
      strokeWidth="2.500"
    />
  </svg>
);

const Plant = () => (
  <svg viewBox="0 0 100 100" className="art" aria-hidden="true">
    <path
      d="M50 58 C30 50 22 30 30 12 C44 22 50 36 50 58 Z"
      fill="#5fb36a"
      stroke={LINE}
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <path
      d="M50 58 C70 50 78 30 70 12 C56 22 50 36 50 58 Z"
      fill="#3f9a55"
      stroke={LINE}
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <path
      d="M50 60 C44 44 46 24 50 8 C54 24 56 44 50 60 Z"
      fill="#7ccf7f"
      stroke={LINE}
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <path
      d="M26 56 H74 L68 92 H32 Z"
      fill="#e2725b"
      stroke={LINE}
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <path
      d="M22 50 H78 V62 H22 Z"
      fill="#f08a6e"
      stroke={LINE}
      strokeWidth="4"
      strokeLinejoin="round"
    />
  </svg>
);

const Books = () => (
  <svg viewBox="0 0 100 100" className="art" aria-hidden="true">
    <rect
      x="10"
      y="10"
      width="80"
      height="82"
      rx="6"
      fill="#8a5a35"
      stroke={LINE}
      strokeWidth="4"
    />
    <rect x="17" y="17" width="66" height="31" fill="#5e3a20" />
    <rect x="17" y="55" width="66" height="30" fill="#5e3a20" />
    <rect
      x="20"
      y="22"
      width="9"
      height="26"
      fill="#e2557b"
      stroke={LINE}
      strokeWidth="2"
    />
    <rect
      x="29"
      y="26"
      width="8"
      height="22"
      fill="#f2c14e"
      stroke={LINE}
      strokeWidth="2"
    />
    <rect
      x="37"
      y="20"
      width="10"
      height="28"
      fill="#4f9dde"
      stroke={LINE}
      strokeWidth="2"
    />
    <rect
      x="47"
      y="24"
      width="8"
      height="24"
      fill="#7ccf7f"
      stroke={LINE}
      strokeWidth="2"
    />
    <path
      d="M60 48 L66 22 L76 24 L71 48 Z"
      fill="#f08a6e"
      stroke={LINE}
      strokeWidth="2"
    />
    <rect
      x="22"
      y="60"
      width="10"
      height="25"
      fill="#7ccf7f"
      stroke={LINE}
      strokeWidth="2"
    />
    <rect
      x="32"
      y="64"
      width="8"
      height="21"
      fill="#e2557b"
      stroke={LINE}
      strokeWidth="2"
    />
    <rect
      x="46"
      y="75"
      width="32"
      height="10"
      fill="#f2c14e"
      stroke={LINE}
      strokeWidth="2"
    />
    <rect
      x="49"
      y="66"
      width="26"
      height="9"
      fill="#4f9dde"
      stroke={LINE}
      strokeWidth="2"
    />
  </svg>
);

const Yarn = () => (
  <svg viewBox="0 0 100 100" className="art" aria-hidden="true">
    <path
      d="M12 46 H88 L80 90 H20 Z"
      fill="#c9995f"
      stroke={LINE}
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <path
      d="M20 58 H80 M22 70 H78 M34 46 L38 90 M50 46 V90 M66 46 L62 90"
      stroke="#9c6f3c"
      strokeWidth="3"
    />
    <circle
      cx="36"
      cy="36"
      r="17"
      fill="#e2557b"
      stroke={LINE}
      strokeWidth="4"
    />
    <path
      d="M24 30 Q36 24 48 34 M22 40 Q36 32 50 44"
      stroke="#b83a5e"
      strokeWidth="3"
      fill="none"
    />
    <circle
      cx="64"
      cy="34"
      r="19"
      fill="#4f9dde"
      stroke={LINE}
      strokeWidth="4"
    />
    <path
      d="M50 28 Q64 20 78 30 M48 40 Q64 30 80 42 M56 20 Q60 36 54 48"
      stroke="#2f73ad"
      strokeWidth="3"
      fill="none"
    />
    <path d="M12 46 H88" stroke={LINE} strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const KINDS = [Box, Plant, Books, Yarn];

export const Furniture = ({ cell }: { cell: number }) => {
  const Kind = KINDS[(cell * 7 + 3) % KINDS.length] ?? Box;
  return <Kind />;
};

export const Bed = () => (
  <svg viewBox="0 0 100 100" className="art bed" aria-hidden="true">
    <ellipse
      cx="50"
      cy="56"
      rx="44"
      ry="36"
      fill="#c2406a"
      stroke={LINE}
      strokeWidth="4"
    />
    <ellipse
      cx="50"
      cy="52"
      rx="44"
      ry="34"
      fill="#e2557b"
      stroke={LINE}
      strokeWidth="4"
    />
    <ellipse
      cx="50"
      cy="56"
      rx="29"
      ry="21"
      fill="#ffd9e2"
      stroke={LINE}
      strokeWidth="3"
    />
    <path
      d="M14 44 q4 -4 8 0 M78 44 q4 -4 8 0 M46 22 q4 -4 8 0"
      stroke="#ffb3c6"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

export const Logo = ({ small = false }: { small?: boolean }) => (
  <div className={`logo ${small ? 'small' : ''}`} aria-label="Herding Cats">
    <span className="logo-top">Herding</span>
    <span className="logo-main">
      C
      <svg viewBox="0 0 100 100" className="logo-cat" aria-hidden="true">
        <path
          d="M16 44 L10 8 L42 26 Z M84 44 L90 8 L58 26 Z"
          fill="#f29a3f"
          stroke={LINE}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <ellipse
          cx="50"
          cy="58"
          rx="42"
          ry="36"
          fill="#f29a3f"
          stroke={LINE}
          strokeWidth="5"
        />
        <ellipse cx="34" cy="54" rx="6" ry="8" fill={LINE} />
        <ellipse cx="66" cy="54" rx="6" ry="8" fill={LINE} />
        <path d="M45 66 L55 66 L50 72 Z" fill="#e8798c" />
        <path
          d="M50 72 Q45 80 39 75 M50 72 Q55 80 61 75"
          stroke={LINE}
          strokeWidth="3.500"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      ts
    </span>
  </div>
);

const BITS = ['#ff4500', '#f2c14e', '#4f9dde', '#7ccf7f', '#e2557b'];

/** A burst of paw prints and confetti for a solved room. */
export const Confetti = () => (
  <div className="confetti" aria-hidden="true">
    {Array.from({ length: 28 }, (_, i) => (
      <i
        key={i}
        className={i % 4 === 0 ? 'paw' : ''}
        style={{
          left: `${(i * 37) % 100}%`,
          background: BITS[i % BITS.length],
          animationDelay: `${(i % 7) * 60}ms`,
          animationDuration: `${1100 + ((i * 53) % 700)}ms`,
        }}
      />
    ))}
  </div>
);
