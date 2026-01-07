export type ColorName =
  | "Rojo"
  | "Azul"
  | "Amarillo"
  | "Verde"
  | "Blanco"
  | "Negro";

export const COLORS_MAP: Record<ColorName, string> = {
  Rojo: "#E53935",
  Azul: "#1E88E5",
  Amarillo: "#FBC02D",
  Verde: "#43A047",
  Blanco: "#FFFFFF",
  Negro: "#000000",
};

export interface Prompt {
  word: ColorName; // el color que se "lee"
  fillColor: string; //codigo del color de relleno
}

export interface Validator {
  isCorrect(prompt: Prompt, selection: ColorName): boolean;
}

export class TextValueValidator implements Validator {
  isCorrect(prompt: Prompt, selection: ColorName) {
    return selection === prompt.word;
  }
}

export class AttentionGameCore {
  private colors: ColorName[];
  private validator: Validator;
  private _currentPrompt: Prompt | null = null;
  private roundsPlayed = 0;
  private lastResult: boolean | null = null;

  constructor(validator: Validator = new TextValueValidator()) {
    this.colors = Object.keys(COLORS_MAP) as ColorName[];
    this.validator = validator;
  }

  get currentPrompt() {
    return this._currentPrompt;
  }

  get result() {
    return this.lastResult;
  }

  // Genera un nuevo prompt aleatorio
  startRound() {
    const word = this.colors[Math.floor(Math.random() * this.colors.length)];
    const fillChoice =
      this.colors[Math.floor(Math.random() * this.colors.length)];
    const fillColor = COLORS_MAP[fillChoice];
    this._currentPrompt = { word, fillColor };
    this.lastResult = null;
  }

  // Maneja la selección del usuario y devuelve si fue correcto
  handleSelection(selection: ColorName) {
    if (!this._currentPrompt) return false;
    const correct = this.validator.isCorrect(this._currentPrompt, selection);
    this.lastResult = correct;
    this.roundsPlayed += 1;
    return correct;
  }

  // Preparar para siguiente ronda (mantiene estado)
  next() {
    this._currentPrompt = null;
  }

  reset() {
    this._currentPrompt = null;
    this.roundsPlayed = 0;
    this.lastResult = null;
  }
}
