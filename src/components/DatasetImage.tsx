import { assetUrl, CLASS_COLORS, type ResolvedCase } from "../data/testCases";
import { buildBoxes } from "../lib/boxes";

interface Props {
  tc: ResolvedCase;
  kind: "original" | "transformed";
  showBoxes?: boolean;
  className?: string;
}

export default function DatasetImage({ tc, kind, showBoxes = true, className }: Props) {
  const { width: W, height: H } = tc;
  const src = assetUrl(kind === "original" ? tc.image : tc.transformedImage);
  const boxes = showBoxes ? buildBoxes(tc, kind) : [];
  const fontSize = Math.round(W / 52);

  return (
    <div className={`relative ${className ?? ""}`}>
      <img src={src} alt={tc.caption} className="block w-full" loading="lazy" />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        {kind === "transformed" && tc.occluder && (
          <g>
            <rect
              x={tc.occluder[0]}
              y={tc.occluder[1]}
              width={tc.occluder[2] - tc.occluder[0]}
              height={tc.occluder[3] - tc.occluder[1]}
              fill="#0b1020"
              opacity={0.35}
              stroke="#f87171"
              strokeDasharray="6 4"
              strokeWidth={2}
            />
          </g>
        )}

        {boxes.map((b, i) => {
          const [x1, y1, x2, y2] = b.bbox;
          const color = b.weak ? "#f87171" : CLASS_COLORS[b.label] ?? "#e2e8f0";
          const text = `${b.label} ${b.conf.toFixed(2)}`;
          const labelW = (text.length + 1) * fontSize * 0.6;
          const lx = Math.max(0, Math.min(x1, W - labelW));
          const stagger = (i % 3) * (fontSize + 4);
          const ly = Math.max(0, y1 - fontSize - 6 - stagger);
          return (
            <g key={i}>
              <rect
                x={x1}
                y={y1}
                width={Math.max(2, x2 - x1)}
                height={Math.max(2, y2 - y1)}
                fill="none"
                stroke={color}
                strokeWidth={b.weak ? 3 : 2}
                strokeDasharray={b.weak ? "7 4" : undefined}
              />
              {stagger > 0 && (
                <line x1={x1} y1={y1} x2={lx + 4} y2={ly + fontSize + 5} stroke={color} strokeWidth={1} opacity={0.5} />
              )}
              <rect x={lx} y={ly} width={labelW} height={fontSize + 5} fill={color} rx={2} />
              <text
                x={lx + 3}
                y={ly + fontSize}
                fontSize={fontSize}
                fontFamily="ui-monospace, monospace"
                fill="#0b1020"
                fontWeight={700}
              >
                {text}
              </text>
            </g>
          );
        })}

        {kind === "transformed" && tc.insertBox && (
          <g>
            <rect
              x={tc.insertBox[0]}
              y={tc.insertBox[1]}
              width={tc.insertBox[2] - tc.insertBox[0]}
              height={tc.insertBox[3] - tc.insertBox[1]}
              fill="none"
              stroke="#5b9dff"
              strokeDasharray="4 3"
              strokeWidth={2}
            />
            <rect
              x={tc.insertBox[0]}
              y={Math.max(0, tc.insertBox[1] - fontSize - 6)}
              width={fontSize * 5.4}
              height={fontSize + 5}
              fill="#5b9dff"
            />
            <text
              x={tc.insertBox[0] + 3}
              y={Math.max(fontSize, tc.insertBox[1] - 4)}
              fontSize={fontSize}
              fontFamily="ui-monospace, monospace"
              fill="#0b1020"
              fontWeight={600}
            >
              inserted
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
