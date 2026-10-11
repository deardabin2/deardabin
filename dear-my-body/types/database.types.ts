export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      articles: {
        Row: {
          body: string;
          category: string;
          created_at: string;
          id: string;
          is_published: boolean;
          sort_order: number;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          body?: string;
          category: string;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          sort_order?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          category?: string;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          sort_order?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      behavior_checks: {
        Row: {
          behavior_goal_id: string;
          created_at: string;
          daily_log_id: string;
          id: string;
          updated_at: string;
          value: number;
        };
        ComputedFields: never;
        Insert: {
          behavior_goal_id: string;
          created_at?: string;
          daily_log_id: string;
          id?: string;
          updated_at?: string;
          value: number;
        };
        Update: {
          behavior_goal_id?: string;
          created_at?: string;
          daily_log_id?: string;
          id?: string;
          updated_at?: string;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "behavior_checks_behavior_goal_id_fkey";
            columns: ["behavior_goal_id"];
            isOneToOne: false;
            referencedRelation: "behavior_goals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "behavior_checks_daily_log_id_fkey";
            columns: ["daily_log_id"];
            isOneToOne: false;
            referencedRelation: "daily_logs";
            referencedColumns: ["id"];
          },
        ];
      };
      behavior_goals: {
        Row: {
          archived_at: string | null;
          created_at: string;
          goal_id: string;
          id: string;
          kind: string;
          sort_order: number;
          target_value: number | null;
          title: string;
          unit: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          goal_id: string;
          id?: string;
          kind: string;
          sort_order?: number;
          target_value?: number | null;
          title: string;
          unit?: string | null;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          goal_id?: string;
          id?: string;
          kind?: string;
          sort_order?: number;
          target_value?: number | null;
          title?: string;
          unit?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "behavior_goals_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "goals";
            referencedColumns: ["id"];
          },
        ];
      };
      coach_comments: {
        Row: {
          body: string;
          coach_id: string | null;
          created_at: string;
          daily_log_id: string;
          id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          body: string;
          coach_id?: string | null;
          created_at?: string;
          daily_log_id: string;
          id?: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          coach_id?: string | null;
          created_at?: string;
          daily_log_id?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coach_comments_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coach_comments_daily_log_id_fkey";
            columns: ["daily_log_id"];
            isOneToOne: false;
            referencedRelation: "daily_logs";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_logs: {
        Row: {
          created_at: string;
          digestion: number | null;
          energy: number | null;
          exercise_note: string | null;
          hunger: number | null;
          id: string;
          log_date: string;
          mood: number | null;
          note: string | null;
          sleep_hours: number | null;
          steps: number | null;
          updated_at: string;
          user_id: string;
          water_ml: number | null;
          weight: number | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          digestion?: number | null;
          energy?: number | null;
          exercise_note?: string | null;
          hunger?: number | null;
          id?: string;
          log_date: string;
          mood?: number | null;
          note?: string | null;
          sleep_hours?: number | null;
          steps?: number | null;
          updated_at?: string;
          user_id: string;
          water_ml?: number | null;
          weight?: number | null;
        };
        Update: {
          created_at?: string;
          digestion?: number | null;
          energy?: number | null;
          exercise_note?: string | null;
          hunger?: number | null;
          id?: string;
          log_date?: string;
          mood?: number | null;
          note?: string | null;
          sleep_hours?: number | null;
          steps?: number | null;
          updated_at?: string;
          user_id?: string;
          water_ml?: number | null;
          weight?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "daily_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      goals: {
        Row: {
          created_at: string;
          end_date: string;
          id: string;
          motivation: string;
          start_date: string;
          start_weight: number | null;
          status: string;
          target_weight: number | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          end_date: string;
          id?: string;
          motivation?: string;
          start_date: string;
          start_weight?: number | null;
          status?: string;
          target_weight?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          end_date?: string;
          id?: string;
          motivation?: string;
          start_date?: string;
          start_weight?: number | null;
          status?: string;
          target_weight?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ingredients: {
        Row: {
          benefits: string;
          category: string;
          caution: string;
          created_at: string;
          how_to_use: string;
          id: string;
          image_path: string | null;
          is_published: boolean;
          name: string;
          summary: string;
          tags: string[];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          benefits?: string;
          category: string;
          caution?: string;
          created_at?: string;
          how_to_use?: string;
          id?: string;
          image_path?: string | null;
          is_published?: boolean;
          name: string;
          summary?: string;
          tags?: string[];
          updated_at?: string;
        };
        Update: {
          benefits?: string;
          category?: string;
          caution?: string;
          created_at?: string;
          how_to_use?: string;
          id?: string;
          image_path?: string | null;
          is_published?: boolean;
          name?: string;
          summary?: string;
          tags?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      meals: {
        Row: {
          created_at: string;
          daily_log_id: string;
          description: string;
          eaten_at: string | null;
          id: string;
          meal_type: string;
          photo_path: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          daily_log_id: string;
          description?: string;
          eaten_at?: string | null;
          id?: string;
          meal_type: string;
          photo_path?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          daily_log_id?: string;
          description?: string;
          eaten_at?: string | null;
          id?: string;
          meal_type?: string;
          photo_path?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meals_daily_log_id_fkey";
            columns: ["daily_log_id"];
            isOneToOne: false;
            referencedRelation: "daily_logs";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
          role: string;
          sensitive_consent_at: string | null;
          sensitive_consent_version: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          display_name?: string;
          id: string;
          role?: string;
          sensitive_consent_at?: string | null;
          sensitive_consent_version?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          id?: string;
          role?: string;
          sensitive_consent_at?: string | null;
          sensitive_consent_version?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      recipe_ingredients: {
        Row: {
          created_at: string;
          ingredient_id: string;
          recipe_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          ingredient_id: string;
          recipe_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          ingredient_id?: string;
          recipe_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey";
            columns: ["ingredient_id"];
            isOneToOne: false;
            referencedRelation: "ingredients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
        ];
      };
      recipes: {
        Row: {
          cook_minutes: number | null;
          created_at: string;
          id: string;
          image_path: string | null;
          ingredients: NonNullable<Json>;
          is_published: boolean;
          nutrition_note: string;
          servings: number;
          steps: NonNullable<Json>;
          summary: string;
          tags: string[];
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          cook_minutes?: number | null;
          created_at?: string;
          id?: string;
          image_path?: string | null;
          ingredients?: NonNullable<Json>;
          is_published?: boolean;
          nutrition_note?: string;
          servings?: number;
          steps?: NonNullable<Json>;
          summary?: string;
          tags?: string[];
          title: string;
          updated_at?: string;
        };
        Update: {
          cook_minutes?: number | null;
          created_at?: string;
          id?: string;
          image_path?: string | null;
          ingredients?: NonNullable<Json>;
          is_published?: boolean;
          nutrition_note?: string;
          servings?: number;
          steps?: NonNullable<Json>;
          summary?: string;
          tags?: string[];
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_health_consent: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_coach: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
