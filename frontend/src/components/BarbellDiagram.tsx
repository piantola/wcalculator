import type { PlateSlot, PlateDefinition } from "@/lib/types";

interface BarbellDiagramProps {
  plates: PlateSlot[];
  barWeight: 15 | 20;
}

const PLATE_H: Record<string, number> = {
  "45lb": 90, "35lb": 84, "25lb": 76, "10kg": 90,
  "15lb": 64, "5kg": 70,  "10lb": 56, "2.5kg": 50, "1.25kg": 44,
};
const PLATE_W: Record<string, number> = {
  "45lb": 24, "35lb": 20, "25lb": 16, "10kg": 22,
  "15lb": 12, "5kg": 16,  "10lb": 10, "2.5kg": 9,  "1.25kg": 7,
};

const VIEW_H   = 200;
const CY       = VIEW_H / 2;
const BAR_H    = 16;
const COLLAR_H = BAR_H + 14;
const COLLAR_W = 14;
const SLEEVE   = 93;
const CAP_W    = 10;
const CAP_H    = BAR_H + 6;
const GAP      = 3;
const PAD_L    = 24;
const PAD_R    = 16;

export default function BarbellDiagram({ plates, barWeight }: BarbellDiagramProps) {
  void barWeight;

  // Expand: heaviest first (innermost, right), lightest last (outermost, left)
  const expanded: PlateDefinition[] = [];
  for (const { plate, count } of plates) {
    for (let i = 0; i < count; i++) expanded.push(plate);
  }

  const totalPlateW = expanded.reduce((s, p) => s + (PLATE_W[p.id] ?? 10) + GAP, 0);
  const vbW = PAD_L + CAP_W + GAP + totalPlateW + COLLAR_W + SLEEVE + PAD_R;

  // Collar X: right end of the plate stack
  const collarX = PAD_L + CAP_W + GAP + totalPlateW;
  const barY    = CY - BAR_H / 2;

  // Place each plate from collar going LEFT (heaviest at collarX, lightest at outer end)
  const rects: Array<{ x: number; plate: PlateDefinition }> = [];
  let cur = collarX;
  for (const plate of expanded) {
    cur -= PLATE_W[plate.id] ?? 10;
    rects.push({ x: cur, plate });
    cur -= GAP;
  }

  const kgIds = new Set(expanded.filter((p) => p.unit === "kg").map((p) => p.id));

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        width="100%"
        viewBox={`0 0 ${vbW} ${VIEW_H}`}
        aria-label="Diagrama da barra com anilhas"
        role="img"
        style={{ display: "block", minWidth: "260px" }}
      >
        <defs>
          <linearGradient id="hb-bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#c8c8c8" />
            <stop offset="45%"  stopColor="#ebebeb" />
            <stop offset="100%" stopColor="#9a9a9a" />
          </linearGradient>
          <linearGradient id="hb-collar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#7a7a7a" />
            <stop offset="50%"  stopColor="#aaaaaa" />
            <stop offset="100%" stopColor="#606060" />
          </linearGradient>
          {[...kgIds].map((id) => (
            <linearGradient key={id} id={`hb-kg-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#111111" />
            </linearGradient>
          ))}
        </defs>

        {/* Sleeve / bar extending right */}
        <rect
          x={collarX + COLLAR_W}
          y={barY}
          width={SLEEVE}
          height={BAR_H}
          rx={4}
          fill="url(#hb-bar)"
        />

        {/* Collar */}
        <rect
          x={collarX}
          y={CY - COLLAR_H / 2}
          width={COLLAR_W}
          height={COLLAR_H}
          rx={3}
          fill="url(#hb-collar)"
        />

        {/* Plates */}
        {rects.map(({ x, plate }, i) => {
          const w      = PLATE_W[plate.id] ?? 10;
          const h      = PLATE_H[plate.id] ?? 60;
          const y      = CY - h / 2;
          const isKg   = plate.unit === "kg";
          const isWht  = plate.id === "10lb";
          const fill   = isKg ? `url(#hb-kg-${plate.id})` : plate.color;
          const stroke = isKg ? "#b0b8c1" : isWht ? "#555555" : "none";
          const lx     = x + w / 2;
          const ly     = y + h / 2;

          return (
            <g key={i}>
              <rect
                x={x} y={y} width={w} height={h}
                rx={3}
                fill={fill}
                stroke={stroke}
                strokeWidth={isKg || isWht ? 2 : 0}
              />
              {w >= 12 && (
                <text
                  x={lx} y={ly}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={w >= 20 ? 10 : w >= 14 ? 9 : 7}
                  fontWeight="700"
                  fontFamily="var(--font-barlow-condensed), system-ui"
                  fill={plate.labelColor}
                  transform={`rotate(-90,${lx},${ly})`}
                >
                  {plate.label}
                </text>
              )}
            </g>
          );
        })}

        {/* End cap */}
        <rect
          x={PAD_L}
          y={CY - CAP_H / 2}
          width={CAP_W}
          height={CAP_H}
          rx={3}
          fill="url(#hb-collar)"
        />

      </svg>
    </div>
  );
}
