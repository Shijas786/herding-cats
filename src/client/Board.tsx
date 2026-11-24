import type { CSSProperties, ReactNode } from 'react';
import type { Room } from '../shared/game';
import { Bed, Furniture } from './art';

const FUR = [
  { coat: '#f29a3f', dark: '#c96f1c', belly: '#ffe3c2' },
  { coat: '#8d99ae', dark: '#5f6b80', belly: '#e6eaf2' },
  { coat: '#3b3640', dark: '#1f1c23', belly: '#6b6472' },
  { coat: '#f3e1c0', dark: '#c9a875', belly: '#fff8ea' },
];

export const Cat = ({ index, asleep }: { index: number; asleep: boolean }) => {
  const fur = FUR[index % FUR.length] ?? {
    coat: '#f29a3f',
    dark: '#c96f1c',
    belly: '#ffe3c2',
  };
  const ink = index % FUR.length === 2 ? '#f6e9a8' : '#2b2118';
  return (
    <svg viewBox="0 0 100 100" className="cat-svg" aria-hidden="true">
      <path
        d="M18 40 L14 8 L42 26 Z"
        fill={fur.coat}
        stroke={fur.dark}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M82 40 L86 8 L58 26 Z"
        fill={fur.coat}
        stroke={fur.dark}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M22 30 L20 16 L33 25 Z" fill="#f7a8b8" />
      <path d="M78 30 L80 16 L67 25 Z" fill="#f7a8b8" />
      <ellipse
        cx="50"
        cy="56"
        rx="38"
        ry="33"
        fill={fur.coat}
        stroke={fur.dark}
        strokeWidth="3"
      />
      <ellipse cx="50" cy="68" rx="18" ry="13" fill={fur.belly} />
      <path
        d="M42 24 L46 36 M50 22 L50 35 M58 24 L54 36"
        stroke={fur.dark}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {asleep ? (
        <>
          <path
            d="M28 52 Q35 58 42 52"
            stroke={ink}
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M58 52 Q65 58 72 52"
            stroke={ink}
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : (
        <g className="eyes" style={{ animationDelay: `${index * 1.3}s` }}>
          <ellipse cx="35" cy="52" rx="6" ry="7.5" fill={ink} />
          <ellipse cx="65" cy="52" rx="6" ry="7.5" fill={ink} />
          <circle cx="37" cy="49" r="2" fill="#fff" />
          <circle cx="67" cy="49" r="2" fill="#fff" />
        </g>
      )}
      <path d="M46 62 L54 62 L50 67 Z" fill="#e8798c" />
      <path
        d="M50 67 Q46 74 41 70 M50 67 Q54 74 59 70"
        stroke={ink}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M30 64 L10 60 M30 68 L11 71 M70 64 L90 60 M70 68 L89 71"
        stroke={fur.dark}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

const place = (room: Room, pos: number): CSSProperties => ({
  width: `${100 / room.w}%`,
  height: `${100 / room.h}%`,
  transform: `translate(${(pos % room.w) * 100}%, ${Math.floor(pos / room.w) * 100}%)`,
});

type BoardProps = {
  room: Room;
  cats: readonly number[];
  /** Where the cats were before the last tilt, to animate only the ones that moved. */
  prev?: readonly number[] | undefined;
  lastDir?: string | null | undefined;
  onCell?: (cell: number) => void;
  children?: ReactNode;
  shake?: string | null;
};

export const Board = ({
  room,
  cats,
  prev,
  lastDir,
  onCell,
  children,
  shake,
}: BoardProps) => {
  const cushions = new Set(room.cushions);
  const cells = Array.from({ length: room.w * room.h }, (_, i) => i);
  return (
    <div
      className={`board ${shake ? `bump-${shake}` : ''}`}
      style={{ aspectRatio: `${room.w} / ${room.h}` }}
    >
      <div
        className="tiles"
        style={{ gridTemplateColumns: `repeat(${room.w}, 1fr)` }}
      >
        {cells.map((i) => {
          const dark = ((i % room.w) + Math.floor(i / room.w)) % 2 === 1;
          return onCell ? (
            <button
              key={i}
              className={`tile ${dark ? 'dark' : ''}`}
              onClick={() => onCell(i)}
              aria-label={`Tile ${i + 1}`}
            />
          ) : (
            <div key={i} className={`tile ${dark ? 'dark' : ''}`} />
          );
        })}
      </div>
      {room.cushions.map((c) => (
        <div key={`c${c}`} className="piece" style={place(room, c)}>
          <Bed />
        </div>
      ))}
      {room.walls.map((c) => (
        <div key={`w${c}`} className="piece" style={place(room, c)}>
          <Furniture cell={c} />
        </div>
      ))}
      {cats.map((c, i) => {
        const asleep = cushions.has(c);
        const moved = prev !== undefined && prev[i] !== c;
        return (
          <div key={`k${i}`} className="piece cat" style={place(room, c)}>
            <div
              key={moved ? `${prev[i]}-${c}` : 'still'}
              className={`cat-inner ${asleep ? 'asleep' : ''} ${moved && lastDir ? `go-${lastDir}` : ''}`}
            >
              <Cat index={i} asleep={asleep} />
            </div>
            {asleep && <span className="zzz">z</span>}
          </div>
        );
      })}
      {children}
    </div>
  );
};
