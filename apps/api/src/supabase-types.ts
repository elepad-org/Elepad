export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string
          condition: Json
          createdAt: string
          description: string
          gameType: Database["public"]["Enums"]["game_type"]
          icon: string | null
          id: string
          points: number
          title: string
        }
        Insert: {
          code: string
          condition: Json
          createdAt?: string
          description: string
          gameType: Database["public"]["Enums"]["game_type"]
          icon?: string | null
          id?: string
          points?: number
          title: string
        }
        Update: {
          code?: string
          condition?: Json
          createdAt?: string
          description?: string
          gameType?: Database["public"]["Enums"]["game_type"]
          icon?: string | null
          id?: string
          points?: number
          title?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          assignedTo: string | null
          completed: boolean
          createdAt: string
          createdBy: string
          description: string | null
          endsAt: string | null
          frequencyId: string | null
          google_event_id: string | null
          google_sync_status: string | null
          id: string
          startsAt: string
          title: string
          updatedAt: string
        }
        Insert: {
          assignedTo?: string | null
          completed?: boolean
          createdAt?: string
          createdBy: string
          description?: string | null
          endsAt?: string | null
          frequencyId?: string | null
          google_event_id?: string | null
          google_sync_status?: string | null
          id?: string
          startsAt: string
          title: string
          updatedAt?: string
        }
        Update: {
          assignedTo?: string | null
          completed?: boolean
          createdAt?: string
          createdBy?: string
          description?: string | null
          endsAt?: string | null
          frequencyId?: string | null
          google_event_id?: string | null
          google_sync_status?: string | null
          id?: string
          startsAt?: string
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_assignedTo_fkey"
            columns: ["assignedTo"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_frequencyId_fkey"
            columns: ["frequencyId"]
            isOneToOne: false
            referencedRelation: "frequencies"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_completions: {
        Row: {
          activityId: string
          completedDate: string
          createdAt: string
          id: string
          updatedAt: string
          userId: string
        }
        Insert: {
          activityId: string
          completedDate: string
          createdAt?: string
          id?: string
          updatedAt?: string
          userId: string
        }
        Update: {
          activityId?: string
          completedDate?: string
          createdAt?: string
          id?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_completions_activityid_fkey"
            columns: ["activityId"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_completions_userid_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attempts: {
        Row: {
          durationMs: number | null
          finishedAt: string | null
          id: string
          isFocusGame: boolean | null
          logicPuzzleId: string | null
          memoryPuzzleId: string | null
          meta: Json | null
          moves: number | null
          score: number | null
          startedAt: string
          success: boolean | null
          sudokuPuzzleId: string | null
          userId: string
        }
        Insert: {
          durationMs?: number | null
          finishedAt?: string | null
          id?: string
          isFocusGame?: boolean | null
          logicPuzzleId?: string | null
          memoryPuzzleId?: string | null
          meta?: Json | null
          moves?: number | null
          score?: number | null
          startedAt?: string
          success?: boolean | null
          sudokuPuzzleId?: string | null
          userId: string
        }
        Update: {
          durationMs?: number | null
          finishedAt?: string | null
          id?: string
          isFocusGame?: boolean | null
          logicPuzzleId?: string | null
          memoryPuzzleId?: string | null
          meta?: Json | null
          moves?: number | null
          score?: number | null
          startedAt?: string
          success?: boolean | null
          sudokuPuzzleId?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempts_logicPuzzleId_fkey"
            columns: ["logicPuzzleId"]
            isOneToOne: false
            referencedRelation: "logicGames"
            referencedColumns: ["puzzleId"]
          },
          {
            foreignKeyName: "attempts_memoryPuzzleId_fkey"
            columns: ["memoryPuzzleId"]
            isOneToOne: false
            referencedRelation: "memoryGames"
            referencedColumns: ["puzzleId"]
          },
          {
            foreignKeyName: "attempts_sudokuPuzzleId_fkey"
            columns: ["sudokuPuzzleId"]
            isOneToOne: false
            referencedRelation: "sudokuGames"
            referencedColumns: ["puzzleId"]
          },
          {
            foreignKeyName: "attempts_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      familyGroups: {
        Row: {
          code: string | null
          createdAt: string
          expiresAt: string | null
          id: string
          name: string
          ownerUserId: string
        }
        Insert: {
          code?: string | null
          createdAt?: string
          expiresAt?: string | null
          id?: string
          name: string
          ownerUserId: string
        }
        Update: {
          code?: string | null
          createdAt?: string
          expiresAt?: string | null
          id?: string
          name?: string
          ownerUserId?: string
        }
        Relationships: [
          {
            foreignKeyName: "familyGroups_ownerUserId_fkey"
            columns: ["ownerUserId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      frequencies: {
        Row: {
          id: string
          label: string
          rrule: string | null
        }
        Insert: {
          id?: string
          label: string
          rrule?: string | null
        }
        Update: {
          id?: string
          label?: string
          rrule?: string | null
        }
        Relationships: []
      }
      logicGames: {
        Row: {
          cols: number
          puzzleId: string
          rows: number
          solution: number[] | null
          startState: number[]
        }
        Insert: {
          cols: number
          puzzleId: string
          rows: number
          solution?: number[] | null
          startState: number[]
        }
        Update: {
          cols?: number
          puzzleId?: string
          rows?: number
          solution?: number[] | null
          startState?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "logicGames_puzzleId_fkey"
            columns: ["puzzleId"]
            isOneToOne: true
            referencedRelation: "puzzles"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          bookId: string
          caption: string | null
          createdAt: string
          createdBy: string
          groupId: string
          id: string
          mediaUrl: string | null
          mimeType: string | null
          title: string | null
        }
        Insert: {
          bookId: string
          caption?: string | null
          createdAt?: string
          createdBy: string
          groupId: string
          id?: string
          mediaUrl?: string | null
          mimeType?: string | null
          title?: string | null
        }
        Update: {
          bookId?: string
          caption?: string | null
          createdAt?: string
          createdBy?: string
          groupId?: string
          id?: string
          mediaUrl?: string | null
          mimeType?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memories_bookId_fkey"
            columns: ["bookId"]
            isOneToOne: false
            referencedRelation: "memoriesBooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_groupId_fkey"
            columns: ["groupId"]
            isOneToOne: false
            referencedRelation: "familyGroups"
            referencedColumns: ["id"]
          },
        ]
      }
      memoriesAlbumPages: {
        Row: {
          albumId: string
          createdAt: string
          description: string | null
          id: string
          imageUrl: string
          memoryId: string
          order: number
          title: string | null
          updatedAt: string | null
        }
        Insert: {
          albumId: string
          createdAt?: string
          description?: string | null
          id?: string
          imageUrl: string
          memoryId: string
          order: number
          title?: string | null
          updatedAt?: string | null
        }
        Update: {
          albumId?: string
          createdAt?: string
          description?: string | null
          id?: string
          imageUrl?: string
          memoryId?: string
          order?: number
          title?: string | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memoriesAlbumPage_albumId_fkey"
            columns: ["albumId"]
            isOneToOne: false
            referencedRelation: "memoriesAlbums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memoriesAlbumPage_memoryId_fkey"
            columns: ["memoryId"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
        ]
      }
      memoriesAlbums: {
        Row: {
          createdAt: string
          createdBy: string
          description: string
          groupId: string
          id: string
          status: Database["public"]["Enums"]["album_status"]
          title: string
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string
          createdBy: string
          description: string
          groupId: string
          id?: string
          status: Database["public"]["Enums"]["album_status"]
          title: string
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string
          createdBy?: string
          description?: string
          groupId?: string
          id?: string
          status?: Database["public"]["Enums"]["album_status"]
          title?: string
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memoriesAlbum_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memoriesAlbum_groupId_fkey"
            columns: ["groupId"]
            isOneToOne: false
            referencedRelation: "familyGroups"
            referencedColumns: ["id"]
          },
        ]
      }
      memoriesBooks: {
        Row: {
          color: string | null
          createdAt: string
          description: string | null
          groupId: string
          id: string
          title: string | null
          updatedAt: string
        }
        Insert: {
          color?: string | null
          createdAt?: string
          description?: string | null
          groupId: string
          id?: string
          title?: string | null
          updatedAt?: string
        }
        Update: {
          color?: string | null
          createdAt?: string
          description?: string | null
          groupId?: string
          id?: string
          title?: string | null
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "memoriesBooks_groupId_fkey"
            columns: ["groupId"]
            isOneToOne: false
            referencedRelation: "familyGroups"
            referencedColumns: ["id"]
          },
        ]
      }
      memoryGames: {
        Row: {
          cols: number
          layout: number[]
          puzzleId: string
          rows: number
          symbols: string[]
        }
        Insert: {
          cols: number
          layout: number[]
          puzzleId: string
          rows: number
          symbols: string[]
        }
        Update: {
          cols?: number
          layout?: number[]
          puzzleId?: string
          rows?: number
          symbols?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "memoryGames_puzzleId_fkey"
            columns: ["puzzleId"]
            isOneToOne: true
            referencedRelation: "puzzles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentions: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          mentioned_user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          mentioned_user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          mentioned_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentions_mentioned_user_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          entity_id: string
          entity_type: string
          event_type: string
          id: string
          read: boolean
          title: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          event_type: string
          id?: string
          read?: boolean
          title?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: string
          read?: boolean
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      puzzles: {
        Row: {
          createdAt: string
          difficulty: number | null
          gameName: string | null
          gameType: Database["public"]["Enums"]["game_type"]
          id: string
          title: string | null
        }
        Insert: {
          createdAt?: string
          difficulty?: number | null
          gameName?: string | null
          gameType?: Database["public"]["Enums"]["game_type"]
          id?: string
          title?: string | null
        }
        Update: {
          createdAt?: string
          difficulty?: number | null
          gameName?: string | null
          gameType?: Database["public"]["Enums"]["game_type"]
          id?: string
          title?: string | null
        }
        Relationships: []
      }
      streak_history: {
        Row: {
          createdAt: string
          id: string
          playedDate: string
          userId: string
        }
        Insert: {
          createdAt?: string
          id?: string
          playedDate: string
          userId: string
        }
        Update: {
          createdAt?: string
          id?: string
          playedDate?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "streak_history_userid_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sudokuGames: {
        Row: {
          cols: number
          given: Json | null
          puzzleId: string
          rows: number
          solution: Json | null
        }
        Insert: {
          cols: number
          given?: Json | null
          puzzleId: string
          rows: number
          solution?: Json | null
        }
        Update: {
          cols?: number
          given?: Json | null
          puzzleId?: string
          rows?: number
          solution?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sudokuGames_puzzleId_fkey"
            columns: ["puzzleId"]
            isOneToOne: true
            referencedRelation: "puzzles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievementId: string
          id: string
          unlockedAt: string
          userId: string
        }
        Insert: {
          achievementId: string
          id?: string
          unlockedAt?: string
          userId: string
        }
        Update: {
          achievementId?: string
          id?: string
          unlockedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievementid_fkey"
            columns: ["achievementId"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_userid_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_google_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          refresh_token: string
          scope: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          refresh_token: string
          scope: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          refresh_token?: string
          scope?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          createdAt: string
          currentStreak: number
          id: string
          lastPlayedDate: string | null
          longestStreak: number
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          currentStreak?: number
          id?: string
          lastPlayedDate?: string | null
          longestStreak?: number
          updatedAt?: string
          userId: string
        }
        Update: {
          createdAt?: string
          currentStreak?: number
          id?: string
          lastPlayedDate?: string | null
          longestStreak?: number
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_userid_fkey"
            columns: ["userId"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatarUrl: string | null
          createdAt: string
          displayName: string
          elder: boolean
          email: string
          google_calendar_enabled: boolean | null
          google_calendar_id: string | null
          groupId: string | null
          id: string
          updatedAt: string
        }
        Insert: {
          avatarUrl?: string | null
          createdAt?: string
          displayName?: string
          elder?: boolean
          email: string
          google_calendar_enabled?: boolean | null
          google_calendar_id?: string | null
          groupId?: string | null
          id: string
          updatedAt?: string
        }
        Update: {
          avatarUrl?: string | null
          createdAt?: string
          displayName?: string
          elder?: boolean
          email?: string
          google_calendar_enabled?: boolean | null
          google_calendar_id?: string | null
          groupId?: string | null
          id?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_group_fk"
            columns: ["groupId"]
            isOneToOne: false
            referencedRelation: "familyGroups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_google_tokens: {
        Args: { p_user_id: string }
        Returns: {
          access_token: string
          expires_at: string
          refresh_token: string
          scope: string
        }[]
      }
      store_google_tokens: {
        Args: {
          p_access_token: string
          p_expires_at: string
          p_refresh_token: string
          p_scope: string
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      album_status: "processing" | "ready" | "error"
      game_type: "memory" | "logic" | "attention" | "reaction"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      album_status: ["processing", "ready", "error"],
      game_type: ["memory", "logic", "attention", "reaction"],
    },
  },
} as const
