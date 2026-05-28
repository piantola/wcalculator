import type { PlateSlot } from "@/lib/types";
import { computeBarbellLayout } from "@/lib/barbellLayout";

interface BarbellDiagramProps {
  plates: PlateSlot[];
  barWeight: 15 | 20;
}

export default function BarbellDiagram({ plates, barWeight }: BarbellDiagramProps) {
  void barWeight;
  const layout = computeBarbellLayout(plates);
  const {
    viewBoxWidth,
    viewBoxHeight,
    barY,
    barHeight,
    barCenterX,
    barCenterWidth,
    collarWidth,
    sleeveWidth,
  } = layout;

  const sleeveLeft = barCenterX - barCenterWidth / 2 - collarWidth - sleeveWidth;
  const collarLeft = barCenterX - barCenterWidth / 2 - collarWidth;
  const collarRight = barCenterX + barCenterWidth / 2;
  const sleeveRight = barCenterX + barCenterWidth / 2 + collarWidth;

  const kgGradIds = new Set(
    layout.plates.filter((p) => p.isKg).map((p) => p.plateId)
  );

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        width="100%"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        aria-label="Diagrama da barra com anilhas"
        role="img"
        style={{ display: "block", minWidth: "280px" }}
      >
        <defs>
          {[...kgGradIds].map((id) => (
            <linearGradient
              key={id}
              id={`grad-${id}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#111111" />
            </linearGradient>
          ))}
          <linearGradient id="grad-bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8c8c8" />
            <stop offset="50%" stopColor="#e8e8e8" />
            <stop offset="100%" stopColor="#a0a0a0" />
          </linearGradient>
          <linearGradient id="grad-collar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#888" />
            <stop offset="50%" stopColor="#aaa" />
            <stop offset="100%" stopColor="#666" />
          </linearGradient>
        </defs>

        {/* Sleeves (outer bar ends) */}
        <rect
          x={sleeveLeft}
          y={barY + barHeight * 0.2}
          width={sleeveWidth}
          height={barHeight * 0.6}
          rx={2}
          fill="url(#grad-bar)"
        />
        <rect
          x={sleeveRight}
          y={barY + barHeight * 0.2}
          width={sleeveWidth}
          height={barHeight * 0.6}
          rx={2}
          fill="url(#grad-bar)"
        />

        {/* Center bar */}
        <rect
          x={barCenterX - barCenterWidth / 2}
          y={barY}
          width={barCenterWidth}
          height={barHeight}
          rx={3}
          fill="url(#grad-bar)"
        />

        {/* Collars */}
        <rect
          x={collarLeft}
          y={barY - 2}
          width={collarWidth}
          height={barHeight + 4}
          rx={2}
          fill="url(#grad-collar)"
        />
        <rect
          x={collarRight}
          y={barY - 2}
          width={collarWidth}
          height={barHeight + 4}
          rx={2}
          fill="url(#grad-collar)"
        />

        {/* Plates */}
        {layout.plates.map((p) => {
          const fill = p.isKg ? `url(#grad-${p.plateId})` : p.plateColor;
          const stroke = p.isKg ? "#b0b8c1" : p.isWhite ? "#555555" : "none";
          const strokeWidth = p.isKg ? 2 : p.isWhite ? 1 : 0;
          const rx = 3;
          const labelX = p.x + p.width / 2;
          const labelY = p.y + p.height / 2;

          return (
            <g key={`${p.side}-${p.index}`}>
              <rect
                x={p.x}
                y={p.y}
                width={p.width}
                height={p.height}
                rx={rx}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
              />
              {p.side === "left" && p.width >= 14 && (
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={p.width >= 18 ? 9 : 7}
                  fontWeight="700"
                  fontFamily="var(--font-barlow-condensed), system-ui"
                  fill={p.labelColor}
                  transform={`rotate(-90, ${labelX}, ${labelY})`}
                >
                  {p.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Empty bar hint */}
        {layout.plates.length === 0 && (
          <text
            x={barCenterX}
            y={barY + barHeight / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fontFamily="var(--font-barlow-condensed), system-ui"
            fill="#444"
            letterSpacing="0.08em"
          >
            informe o peso para ver as anilhas
          </text>
        )}
      </svg>
    </div>
  );
}
