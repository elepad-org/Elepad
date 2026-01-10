import { z } from "@hono/zod-openapi";

// Enum para los tipos de juego (categorías)
export const GameTypeEnum = z
  .enum(["memory", "logic", "attention", "reaction"])
  .openapi("GameType");
export type GameType = z.infer<typeof GameTypeEnum>;

// Schema para el puzzle base
export const PuzzleSchema = z
  .object({
    id: z.uuid(),
    gameType: GameTypeEnum,
    gameName: z.string().nullable(),
    title: z.string().nullable(),
    difficulty: z.number().int().nullable(),
    createdAt: z.string().datetime(),
  })
  .openapi("Puzzle");

export type Puzzle = z.infer<typeof PuzzleSchema>;

// Schema para Memory Game con detalles completos
export const MemoryGameSchema = z
  .object({
    puzzleId: z.uuid(),
    rows: z.number().int(),
    cols: z.number().int(),
    symbols: z.array(z.string()),
    layout: z.array(z.number().int()),
  })
  .openapi("MemoryGame");

export type MemoryGame = z.infer<typeof MemoryGameSchema>;

// Schema para Logic Game (Lights Out, NET, etc.)
export const LogicGameSchema = z
  .object({
    puzzleId: z.uuid(),
    rows: z.number().int(),
    cols: z.number().int(),
    startState: z.array(z.union([z.number().int(), z.boolean()])),
    solution: z
      .array(z.union([z.number().int(), z.boolean()]))
      .nullable()
      .optional(), // Estado ganador/solución
  })
  .openapi("LogicGame");

export type LogicGame = z.infer<typeof LogicGameSchema>;

// Schema para Sudoku Game
export const SudokuGameSchema = z
  .object({
    puzzleId: z.uuid(),
    rows: z.number().int(),
    cols: z.number().int(),
    given: z.array(z.array(z.number().int())), // Matriz de números iniciales
    solution: z.array(z.array(z.number().int())), // Matriz de números iniciales
  })
  .openapi("SudokuGame");

export type SudokuGame = z.infer<typeof SudokuGameSchema>;

// Schema simple para respuestas de creación de puzzles (para OpenAPI)
export const PuzzleCreatedResponseSchema = z
  .object({
    puzzle: PuzzleSchema,
  })
  .openapi("PuzzleCreatedResponse");

// Schemas individuales sin .openapi() para evitar recursión
const PuzzleBaseSchema = z.object({
  id: z.string().uuid(),
  gameType: GameTypeEnum,
  gameName: z.string().nullable(),
  title: z.string().nullable(),
  difficulty: z.number().int().nullable(),
  createdAt: z.string().datetime(),
});

const MemoryGameBaseSchema = z.object({
  puzzleId: z.string().uuid(),
  rows: z.number().int(),
  cols: z.number().int(),
  symbols: z.array(z.string()),
  layout: z.array(z.number().int()),
});

const LogicGameBaseSchema = z.object({
  puzzleId: z.string().uuid(),
  rows: z.number().int(),
  cols: z.number().int(),
  startState: z.array(z.union([z.number().int(), z.boolean()])),
  solution: z.array(z.union([z.number().int(), z.boolean()])).nullable().optional(),
});

const SudokuGameBaseSchema = z.object({
  puzzleId: z.string().uuid(),
  rows: z.number().int(),
  cols: z.number().int(),
  given: z.array(z.array(z.number().int())),
  solution: z.array(z.array(z.number().int())),
});

// Schema combinado simple sin .openapi() para evitar "Type instantiation is excessively deep"
export const PuzzleWithDetailsSchema = z.object({
  puzzle: PuzzleBaseSchema,
  memoryGame: MemoryGameBaseSchema.nullable(),
  logicGame: LogicGameBaseSchema.nullable(),
  sudokuGame: SudokuGameBaseSchema.nullable(),
});

export type PuzzleWithDetails = z.infer<typeof PuzzleWithDetailsSchema>;

// Schema para crear un nuevo puzzle de memoria
export const NewMemoryPuzzleSchema = z
  .object({
    title: z.string().optional(),
    difficulty: z.number().int().min(1).max(5).optional(),
    rows: z.number().int().min(2).max(6).default(4),
    cols: z.number().int().min(2).max(6).default(6),
  })
  .openapi("NewMemoryPuzzle");

export type NewMemoryPuzzle = z.infer<typeof NewMemoryPuzzleSchema>;

// Schema para crear un nuevo puzzle de NET
export const NewNetPuzzleSchema = z
  .object({
    title: z.string().optional(),
    difficulty: z.number().int().min(1).max(5).optional(),
    gridSize: z.number().int().min(3).max(7).default(5),
  })
  .openapi("NewNetPuzzle");

export type NewNetPuzzle = z.infer<typeof NewNetPuzzleSchema>;

// Schema para crear un nuevo puzzle de focus
export const NewFocusPuzzleSchema = z
  .object({
    rounds: z.number().int().min(1).max(100).optional().default(10),
  })
  .openapi("NewFocusPuzzle");

export type NewFocusPuzzle = z.infer<typeof NewFocusPuzzleSchema>;

// Schema para crear un nuevo puzzle de Sudoku
export const NewSudokuPuzzleSchema = z
  .object({
    title: z.string().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional().default("easy"),
  })
  .openapi("NewSudokuPuzzle");

export type NewSudokuPuzzle = z.infer<typeof NewSudokuPuzzleSchema>;

// Schema para listar juegos disponibles (agrupados por tipo)
export const GameListItemSchema = z
  .object({
    gameType: GameTypeEnum,
    gameName: z.string(),
    displayName: z.string(),
    description: z.string(),
    icon: z.string(),
    isAvailable: z.boolean(),
    comingSoon: z.boolean().optional(),
  })
  .openapi("GameListItem");

export type GameListItem = z.infer<typeof GameListItemSchema>;
