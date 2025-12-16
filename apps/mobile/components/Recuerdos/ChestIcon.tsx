import React from "react";
import Svg, { Circle, G, Line, Path, Rect } from "react-native-svg";

type Props = {
  width?: number;
  height?: number;
};

export default function ChestIcon({ width, height }: Props) {
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
        fill="#CD9965"
      />

      {/* Vetas madera */}
      <Line x1={20} y1={90} x2={380} y2={90} stroke="#A67C52" strokeWidth={2} />
      <Line
        x1={20}
        y1={140}
        x2={380}
        y2={140}
        stroke="#A67C52"
        strokeWidth={2}
      />
      <Line
        x1={20}
        y1={190}
        x2={380}
        y2={190}
        stroke="#A67C52"
        strokeWidth={2}
      />
      <Line
        x1={20}
        y1={240}
        x2={380}
        y2={240}
        stroke="#A67C52"
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
