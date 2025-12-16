import React from "react";
import Svg, { Circle, G, Line, Path, Rect } from "react-native-svg";

type Props = {
  width?: number;
  height?: number;
  color?: string;
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function parseHexColor(input: string) {
  const hex = input.trim();
  const match = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex);
  if (!match) return null;

  const raw = match[1];
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return { r, g, b };
}

function toHex({ r, g, b }: { r: number; g: number; b: number }) {
  const hh = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hh(Math.round(r))}${hh(Math.round(g))}${hh(Math.round(b))}`;
}

function mix(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number
) {
  const tt = clamp01(t);
  return {
    r: a.r + (b.r - a.r) * tt,
    g: a.g + (b.g - a.g) * tt,
    b: a.b + (b.b - a.b) * tt,
  };
}

export default function ChestIcon({ width, height, color }: Props) {
  const base = color ? parseHexColor(color) : null;
  const defaultWood = parseHexColor("#CD9965");
  const defaultGrain = parseHexColor("#A67C52");

  const woodFill =
    base && defaultWood
      ? toHex(mix(base, { r: 255, g: 255, b: 255 }, 0.35))
      : "#CD9965";
  const grainStroke =
    base && defaultGrain
      ? toHex(mix(base, { r: 0, g: 0, b: 0 }, 0.25))
      : "#A67C52";

  return (
    <Svg
      width={width ?? "100%"}
      height={height ?? "100%"}
      viewBox="0 0 400 320"
      fill="none"
      accessibilityRole="image"
    >
      {/* Patas */}
      <Rect x={40} y={290} width={40} height={30} fill="#4E342E" />
      <Rect x={320} y={290} width={40} height={30} fill="#4E342E" />

      {/* Cuerpo madera */}
      <Path
        d="M20,40 h360 a20,20 0 0 1 20,20 v230 a0,0 0 0 1 0,0 h-400 a0,0 0 0 1 0,0 v-230 a20,20 0 0 1 20,-20 z"
        fill={woodFill}
      />

      {/* Vetas madera */}
      <Line
        x1={20}
        y1={90}
        x2={380}
        y2={90}
        stroke={grainStroke}
        strokeWidth={2}
      />
      <Line
        x1={20}
        y1={140}
        x2={380}
        y2={140}
        stroke={grainStroke}
        strokeWidth={2}
      />
      <Line
        x1={20}
        y1={190}
        x2={380}
        y2={190}
        stroke={grainStroke}
        strokeWidth={2}
      />
      <Line
        x1={20}
        y1={240}
        x2={380}
        y2={240}
        stroke={grainStroke}
        strokeWidth={2}
      />

      {/* Correas */}
      <Rect x={50} y={40} width={40} height={250} fill="#4E342E" />
      <Rect x={310} y={40} width={40} height={250} fill="#4E342E" />
      <Rect x={20} y={100} width={360} height={30} fill="#4E342E" />
      <Rect x={20} y={270} width={360} height={20} fill="#4E342E" />

      {/* Remaches */}
      <G>
        <Circle cx={70} cy={60} r={3} fill="#6D4C41" />
        <Circle cx={70} cy={115} r={3} fill="#6D4C41" />
        <Circle cx={70} cy={160} r={3} fill="#6D4C41" />
        <Circle cx={70} cy={210} r={3} fill="#6D4C41" />
        <Circle cx={70} cy={280} r={3} fill="#6D4C41" />

        <Circle cx={330} cy={60} r={3} fill="#6D4C41" />
        <Circle cx={330} cy={115} r={3} fill="#6D4C41" />
        <Circle cx={330} cy={160} r={3} fill="#6D4C41" />
        <Circle cx={330} cy={210} r={3} fill="#6D4C41" />
        <Circle cx={330} cy={280} r={3} fill="#6D4C41" />

        <Circle cx={120} cy={115} r={3} fill="#6D4C41" />
        <Circle cx={170} cy={115} r={3} fill="#6D4C41" />
        <Circle cx={230} cy={115} r={3} fill="#6D4C41" />
        <Circle cx={280} cy={115} r={3} fill="#6D4C41" />

        <Circle cx={120} cy={280} r={3} fill="#6D4C41" />
        <Circle cx={170} cy={280} r={3} fill="#6D4C41" />
        <Circle cx={230} cy={280} r={3} fill="#6D4C41" />
        <Circle cx={280} cy={280} r={3} fill="#6D4C41" />
      </G>

      {/* Placa del candado */}
      <Rect x={180} y={80} width={40} height={60} fill="#4E342E" />

      {/* Arco */}
      <Path
        d="M190,160 v-15 a10,10 0 0 1 20,0 v15"
        stroke="#3E2723"
        strokeWidth={6}
        fill="none"
      />

      {/* Cuerpo candado */}
      <Path
        d="M185,160 h30 v25 a10,10 0 0 1 -10,10 h-10 a10,10 0 0 1 -10,-10 z"
        fill="#5D4037"
      />

      {/* Ranura */}
      <Path
        d="M200,172 v10"
        stroke="#281A16"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Svg>
  );
}
