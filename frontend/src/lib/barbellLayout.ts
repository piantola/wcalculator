import type { PlateSlot } from "./types";

export interface PlateRect {
  x: number;
  y: number;
  width: number;
  height: number;
  plateId: string;
  plateColor: string;
  labelColor: string;
  label: string;
  isKg: boolean;
  isWhite: boolean;
  side: "left" | "right";
  index: number;
}

export interface BarbellLayout {
  viewBoxWidth: number;
  viewBoxHeight: number;
  barY: number;
  barHeight: number;
  barCenterX: number;
  barCenterWidth: number;
  collarWidth: number;
  sleeveWidth: number;
  plates: PlateRect[];
}

const PLATE_HEIGHT: Record<string, number> = {
  "45lb": 90,
  "35lb": 84,
  "25lb": 76,
  "10kg": 90,
  "15lb": 64,
  "5kg": 70,
  "10lb": 56,
  "2.5kg": 50,
  "1.25kg": 44,
};

const PLATE_THICKNESS: Record<string, number> = {
  "45lb": 22,
  "35lb": 18,
  "25lb": 14,
  "10kg": 20,
  "15lb": 10,
  "5kg": 14,
  "10lb": 8,
  "2.5kg": 8,
  "1.25kg": 6,
};

const VIEW_HEIGHT = 200;
const BAR_HEIGHT = 18;
const BAR_Y = (VIEW_HEIGHT - BAR_HEIGHT) / 2;
const CENTER_WIDTH = 180;
const COLLAR_WIDTH = 12;
const SLEEVE_WIDTH = 40;
const SIDE_GAP = 4;

export function computeBarbellLayout(plates: PlateSlot[]): BarbellLayout {
  const expandedLeft: Array<{ plateId: string; plateColor: string; labelColor: string; label: string; isKg: boolean; isWhite: boolean; thickness: number; height: number }> = [];

  for (const { plate, count } of plates) {
    for (let i = 0; i < count; i++) {
      expandedLeft.push({
        plateId: plate.id,
        plateColor: plate.color,
        labelColor: plate.labelColor,
        label: plate.label,
        isKg: plate.unit === "kg",
        isWhite: plate.id === "10lb",
        thickness: PLATE_THICKNESS[plate.id] ?? 10,
        height: PLATE_HEIGHT[plate.id] ?? 60,
      });
    }
  }

  const totalPlateWidth = expandedLeft.reduce((s, p) => s + p.thickness + SIDE_GAP, 0);
  const halfWidth = Math.max(
    CENTER_WIDTH / 2 + COLLAR_WIDTH + SLEEVE_WIDTH + totalPlateWidth + 20,
    220
  );
  const viewBoxWidth = halfWidth * 2;

  const centerX = viewBoxWidth / 2;
  const sleeveLeftStart = centerX - CENTER_WIDTH / 2 - COLLAR_WIDTH - SLEEVE_WIDTH;
  const sleeveRightStart = centerX + CENTER_WIDTH / 2 + COLLAR_WIDTH;

  const rects: PlateRect[] = [];
  let cursorLeft = sleeveLeftStart;
  let cursorRight = sleeveRightStart + SLEEVE_WIDTH;

  for (let i = 0; i < expandedLeft.length; i++) {
    const p = expandedLeft[i];
    const plateY = BAR_Y + BAR_HEIGHT / 2 - p.height / 2;

    rects.push({
      x: cursorLeft - p.thickness,
      y: plateY,
      width: p.thickness,
      height: p.height,
      plateId: p.plateId,
      plateColor: p.plateColor,
      labelColor: p.labelColor,
      label: p.label,
      isKg: p.isKg,
      isWhite: p.isWhite,
      side: "left",
      index: i,
    });

    rects.push({
      x: cursorRight,
      y: plateY,
      width: p.thickness,
      height: p.height,
      plateId: p.plateId,
      plateColor: p.plateColor,
      labelColor: p.labelColor,
      label: p.label,
      isKg: p.isKg,
      isWhite: p.isWhite,
      side: "right",
      index: i,
    });

    cursorLeft -= p.thickness + SIDE_GAP;
    cursorRight += p.thickness + SIDE_GAP;
  }

  return {
    viewBoxWidth,
    viewBoxHeight: VIEW_HEIGHT,
    barY: BAR_Y,
    barHeight: BAR_HEIGHT,
    barCenterX: centerX,
    barCenterWidth: CENTER_WIDTH,
    collarWidth: COLLAR_WIDTH,
    sleeveWidth: SLEEVE_WIDTH,
    plates: rects,
  };
}
