import { OpenAPIHono, z } from "@hono/zod-openapi";
import { PuzzleService } from "./service";
import {
  PuzzleSchema,
  GameListItemSchema,
  GameTypeEnum,
  MemoryPuzzleCreatedSchema,
  LogicPuzzleCreatedSchema,
  FocusPuzzleCreatedSchema,
  //SudokuPuzzleCreatedSchema,
  NewMemoryPuzzleSchema,
  NewNetPuzzleSchema,
  NewFocusPuzzleSchema,
  NewSudokuPuzzleSchema,
} from "./schema";
import { openApiErrorResponse } from "@/utils/api-error";

export const puzzlesApp = new OpenAPIHono();

declare module "hono" {
  interface ContextVariableMap {
    puzzleService: PuzzleService;
  }
}

puzzlesApp.use("/games/*", async (c, next) => {
  const puzzleService = new PuzzleService(c.var.supabase);
  c.set("puzzleService", puzzleService);
  await next();
});

puzzlesApp.use("/puzzles/*", async (c, next) => {
  const puzzleService = new PuzzleService(c.var.supabase);
  c.set("puzzleService", puzzleService);
  await next();
});

// Listar todos los juegos disponibles
puzzlesApp.openapi(
  {
    method: "get",
    path: "/games",
    tags: ["games"],
    responses: {
      200: {
        description: "Lista de juegos disponibles",
        content: {
          "application/json": { schema: z.array(GameListItemSchema) },
        },
      },
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const games = await c.var.puzzleService.listAvailableGames();
    return c.json(games, 200);
  }
);

// Obtener detalles de un juego específico
puzzlesApp.openapi(
  {
    method: "get",
    path: "/games/{gameName}",
    tags: ["games"],
    request: {
      params: z.object({ gameName: z.string() }),
    },
    responses: {
      200: {
        description: "Detalles del juego",
        content: { "application/json": { schema: GameListItemSchema } },
      },
      404: openApiErrorResponse("Juego no encontrado"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { gameName } = c.req.valid("param");
    const game = await c.var.puzzleService.getGameDetails(gameName);
    return c.json(game, 200);
  }
);

// Obtener un puzzle por ID con detalles
puzzlesApp.get("/puzzles/:puzzleId", async (c) => {
  const puzzleId = c.req.param("puzzleId");
  const puzzle = await c.var.puzzleService.getPuzzleById(puzzleId);
  return c.json(puzzle, 200);
});

// Crear un nuevo puzzle de memoria
puzzlesApp.openapi(
  {
    method: "post",
    path: "/puzzles/memory",
    tags: ["puzzles"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: NewMemoryPuzzleSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: "Puzzle de memoria creado",
        content: { "application/json": { schema: MemoryPuzzleCreatedSchema } },
      },
      400: openApiErrorResponse("Datos inválidos"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    try {
      console.log("🎮 POST /puzzles/memory - Request received");
      const body = c.req.valid("json");
      console.log("📦 Request body:", body);

      const puzzle = await c.var.puzzleService.createMemoryPuzzle(body);
      console.log("✅ Puzzle created successfully:", puzzle.puzzle.id);

      return c.json(puzzle, 201);
    } catch (error) {
      console.error("❌ Error creating puzzle:", error);
      throw error;
    }
  }
);

// Crear un nuevo puzzle de Sudoku
puzzlesApp.openapi(
  {
    method: "post",
    path: "/puzzles/sudoku",
    tags: ["puzzles"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: NewSudokuPuzzleSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: "Puzzle de Sudoku creado",
        content: {
          "application/json": {
            schema: z.any(),
          },
        },
      },
      400: openApiErrorResponse("Datos inválidos"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    try {
      console.log("🔢 POST /puzzles/sudoku - Request received");
      const body = c.req.valid("json");
      console.log("📦 Request body:", body);

      const puzzle = await c.var.puzzleService.createSudokuPuzzle(body);
      console.log("✅ Sudoku Puzzle created successfully:", puzzle.puzzle.id);

      return c.json(puzzle, 201);
    } catch (error) {
      console.error("❌ Error creating sudoku puzzle:", error);
      throw error;
    }
  }
);

// Crear un nuevo puzzle de NET
puzzlesApp.openapi(
  {
    method: "post",
    path: "/puzzles/net",
    tags: ["puzzles"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: NewNetPuzzleSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: "Puzzle de NET creado",
        content: { "application/json": { schema: LogicPuzzleCreatedSchema } },
      },
      400: openApiErrorResponse("Datos inválidos"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    try {
      console.log("🌐 POST /puzzles/net - Request received");
      const body = c.req.valid("json");
      console.log("📦 Request body:", body);

      const puzzle = await c.var.puzzleService.createNetPuzzle(body);
      console.log("✅ NET Puzzle created successfully:", puzzle.puzzle.id);

      return c.json(puzzle, 201);
    } catch (error) {
      console.error("❌ Error creating NET puzzle:", error);
      throw error;
    }
  }
);

// Crear un nuevo puzzle de focus
puzzlesApp.openapi(
  {
    method: "post",
    path: "/puzzles/focus",
    tags: ["puzzles"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: NewFocusPuzzleSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        description: "Puzzle de atención creado",
        content: { "application/json": { schema: FocusPuzzleCreatedSchema } },
      },
      400: openApiErrorResponse("Datos inválidos"),
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    try {
      console.log("🎯 POST /puzzles/focus - Request received");
      const body = c.req.valid("json");
      console.log("📦 Request body:", body);

      const puzzle = await c.var.puzzleService.createFocusPuzzle(body);
      console.log("✅ Focus Puzzle created successfully:", puzzle.puzzle.id);

      return c.json(puzzle, 201);
    } catch (error) {
      console.error("❌ Error creating focus puzzle:", error);
      throw error;
    }
  }
);

// Listar puzzles recientes de un tipo
puzzlesApp.openapi(
  {
    method: "get",
    path: "/puzzles/recent/{gameType}",
    tags: ["puzzles"],
    request: {
      params: z.object({ gameType: GameTypeEnum }),
      query: z.object({
        limit: z.coerce.number().int().min(1).max(50).optional().default(10),
      }),
    },
    responses: {
      200: {
        description: "Lista de puzzles recientes",
        content: { "application/json": { schema: z.array(PuzzleSchema) } },
      },
      500: openApiErrorResponse("Error interno del servidor"),
    },
  },
  async (c) => {
    const { gameType } = c.req.valid("param");
    const { limit } = c.req.valid("query");
    const puzzles = await c.var.puzzleService.listRecentPuzzles(
      gameType,
      limit
    );
    return c.json(puzzles, 200);
  }
);
