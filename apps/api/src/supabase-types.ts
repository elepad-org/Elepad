export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      activities: {
        Row: {
          completed: boolean;
          createdAt: string;
          createdBy: string;
          description: string | null;
          endsAt: string | null;
          frequencyId: string | null;
          id: string;
          startsAt: string;
          title: string;
          updatedAt: string;
        };
        Insert: {
          completed?: boolean;
          createdAt?: string;
          createdBy: string;
          description?: string | null;
          endsAt?: string | null;
          frequencyId?: string | null;
          id?: string;
          startsAt: string;
          title: string;
          updatedAt?: string;
        };
        Update: {
          completed?: boolean;
          createdAt?: string;
          createdBy?: string;
          description?: string | null;
          endsAt?: string | null;
          frequencyId?: string | null;
          id?: string;
          startsAt?: string;
          title?: string;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activities_createdBy_fkey";
            columns: ["createdBy"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_frequencyId_fkey";
            columns: ["frequencyId"];
            isOneToOne: false;
            referencedRelation: "frequencies";
            referencedColumns: ["id"];
          },
        ];
      };
      attempts: {
        Row: {
          durationMs: number | null;
          finishedAt: string | null;
          id: string;
          logicPuzzleId: string | null;
          memoryPuzzleId: string | null;
          meta: Json | null;
          moves: number | null;
          score: number | null;
          startedAt: string;
          success: boolean | null;
          sudokuPuzzleId: string | null;
          userId: string;
        };
        Insert: {
          durationMs?: number | null;
          finishedAt?: string | null;
          id?: string;
          logicPuzzleId?: string | null;
          memoryPuzzleId?: string | null;
          meta?: Json | null;
          moves?: number | null;
          score?: number | null;
          startedAt?: string;
          success?: boolean | null;
          sudokuPuzzleId?: string | null;
          userId: string;
        };
        Update: {
          durationMs?: number | null;
          finishedAt?: string | null;
          id?: string;
          logicPuzzleId?: string | null;
          memoryPuzzleId?: string | null;
          meta?: Json | null;
          moves?: number | null;
          score?: number | null;
          startedAt?: string;
          success?: boolean | null;
          sudokuPuzzleId?: string | null;
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attempts_logicPuzzleId_fkey";
            columns: ["logicPuzzleId"];
            isOneToOne: false;
            referencedRelation: "logicGames";
            referencedColumns: ["puzzleId"];
          },
          {
            foreignKeyName: "attempts_memoryPuzzleId_fkey";
            columns: ["memoryPuzzleId"];
            isOneToOne: false;
            referencedRelation: "memoryGames";
            referencedColumns: ["puzzleId"];
          },
          {
            foreignKeyName: "attempts_sudokuPuzzleId_fkey";
            columns: ["sudokuPuzzleId"];
            isOneToOne: false;
            referencedRelation: "sudokuGames";
            referencedColumns: ["puzzleId"];
          },
          {
            foreignKeyName: "attempts_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      familyGroups: {
        Row: {
          code: string | null;
          createdAt: string;
          expiresAt: string | null;
          id: string;
          name: string;
          ownerUserId: string;
        };
        Insert: {
          code?: string | null;
          createdAt?: string;
          expiresAt?: string | null;
          id?: string;
          name: string;
          ownerUserId: string;
        };
        Update: {
          code?: string | null;
          createdAt?: string;
          expiresAt?: string | null;
          id?: string;
          name?: string;
          ownerUserId?: string;
        };
        Relationships: [
          {
            foreignKeyName: "familyGroups_ownerUserId_fkey";
            columns: ["ownerUserId"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      frequencies: {
        Row: {
          id: string;
          label: string;
          rrule: string | null;
        };
        Insert: {
          id?: string;
          label: string;
          rrule?: string | null;
        };
        Update: {
          id?: string;
          label?: string;
          rrule?: string | null;
        };
        Relationships: [];
      };
      logicGames: {
        Row: {
          cols: number;
          puzzleId: string;
          rows: number;
          startState: boolean[];
        };
        Insert: {
          cols: number;
          puzzleId: string;
          rows: number;
          startState: boolean[];
        };
        Update: {
          cols?: number;
          puzzleId?: string;
          rows?: number;
          startState?: boolean[];
        };
        Relationships: [
          {
            foreignKeyName: "logicGames_puzzleId_fkey";
            columns: ["puzzleId"];
            isOneToOne: true;
            referencedRelation: "puzzles";
            referencedColumns: ["id"];
          },
        ];
      };
      memories: {
        Row: {
          bookId: string;
          caption: string | null;
          createdAt: string;
          createdBy: string;
          groupId: string;
          id: string;
          mediaUrl: string | null;
          mimeType: string | null;
          title: string | null;
        };
        Insert: {
          bookId: string;
          caption?: string | null;
          createdAt?: string;
          createdBy: string;
          groupId: string;
          id?: string;
          mediaUrl?: string | null;
          mimeType?: string | null;
          title?: string | null;
        };
        Update: {
          bookId?: string;
          caption?: string | null;
          createdAt?: string;
          createdBy?: string;
          groupId?: string;
          id?: string;
          mediaUrl?: string | null;
          mimeType?: string | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "memories_bookId_fkey";
            columns: ["bookId"];
            isOneToOne: false;
            referencedRelation: "memoriesBooks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memories_createdBy_fkey";
            columns: ["createdBy"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memories_groupId_fkey";
            columns: ["groupId"];
            isOneToOne: false;
            referencedRelation: "familyGroups";
            referencedColumns: ["id"];
          },
        ];
      };
      memoriesBooks: {
        Row: {
          createdAt: string;
          groupId: string;
          id: string;
          title: string | null;
        };
        Insert: {
          createdAt?: string;
          groupId: string;
          id?: string;
          title?: string | null;
        };
        Update: {
          createdAt?: string;
          groupId?: string;
          id?: string;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "memoriesBooks_groupId_fkey";
            columns: ["groupId"];
            isOneToOne: false;
            referencedRelation: "familyGroups";
            referencedColumns: ["id"];
          },
        ];
      };
      memoryGames: {
        Row: {
          cols: number;
          layout: number[];
          puzzleId: string;
          rows: number;
          symbols: string[];
        };
        Insert: {
          cols: number;
          layout: number[];
          puzzleId: string;
          rows: number;
          symbols: string[];
        };
        Update: {
          cols?: number;
          layout?: number[];
          puzzleId?: string;
          rows?: number;
          symbols?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "memoryGames_puzzleId_fkey";
            columns: ["puzzleId"];
            isOneToOne: true;
            referencedRelation: "puzzles";
            referencedColumns: ["id"];
          },
        ];
      };
      puzzles: {
        Row: {
          createdAt: string;
          difficulty: number | null;
          gameType: Database["public"]["Enums"]["game_type"];
          id: string;
          title: string | null;
        };
        Insert: {
          createdAt?: string;
          difficulty?: number | null;
          gameType: Database["public"]["Enums"]["game_type"];
          id?: string;
          title?: string | null;
        };
        Update: {
          createdAt?: string;
          difficulty?: number | null;
          gameType?: Database["public"]["Enums"]["game_type"];
          id?: string;
          title?: string | null;
        };
        Relationships: [];
      };
      sudokuGames: {
        Row: {
          cols: number;
          given: string;
          puzzleId: string;
          rows: number;
          solution: string;
        };
        Insert: {
          cols: number;
          given: string;
          puzzleId: string;
          rows: number;
          solution: string;
        };
        Update: {
          cols?: number;
          given?: string;
          puzzleId?: string;
          rows?: number;
          solution?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sudokuGames_puzzleId_fkey";
            columns: ["puzzleId"];
            isOneToOne: true;
            referencedRelation: "puzzles";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          avatarUrl: string | null;
          createdAt: string;
          displayName: string;
          email: string;
          groupId: string | null;
          id: string;
          updatedAt: string;
        };
        Insert: {
          avatarUrl?: string | null;
          createdAt?: string;
          displayName?: string;
          email: string;
          groupId?: string | null;
          id: string;
          updatedAt?: string;
        };
        Update: {
          avatarUrl?: string | null;
          createdAt?: string;
          displayName?: string;
          email?: string;
          groupId?: string | null;
          id?: string;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_group_fk";
            columns: ["groupId"];
            isOneToOne: false;
            referencedRelation: "familyGroups";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      game_type: "sudoku" | "memory" | "lightsout";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      game_type: ["sudoku", "memory", "lightsout"],
    },
  },
} as const;
