export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      app_config: {
        Row: {
          key: string;
          updated_at: string;
          value: string;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value: string;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: string;
        };
        Relationships: [];
      };
      billing_plan_mappings: {
        Row: {
          billing_plan_code: string;
          created_at: string;
          currency_code: string;
          environment: string;
          id: string;
          metadata: Json;
          provider: string;
          provider_plan_id: string;
          updated_at: string;
        };
        Insert: {
          billing_plan_code: string;
          created_at?: string;
          currency_code: string;
          environment?: string;
          id?: string;
          metadata?: Json;
          provider: string;
          provider_plan_id: string;
          updated_at?: string;
        };
        Update: {
          billing_plan_code?: string;
          created_at?: string;
          currency_code?: string;
          environment?: string;
          id?: string;
          metadata?: Json;
          provider?: string;
          provider_plan_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          author: string;
          body: string;
          created_at: string;
          excerpt: string;
          id: string;
          published: boolean;
          slug: string;
          tags: string[];
          title: string;
          updated_at: string;
        };
        Insert: {
          author?: string;
          body?: string;
          created_at?: string;
          excerpt?: string;
          id?: string;
          published?: boolean;
          slug: string;
          tags?: string[];
          title: string;
          updated_at?: string;
        };
        Update: {
          author?: string;
          body?: string;
          created_at?: string;
          excerpt?: string;
          id?: string;
          published?: boolean;
          slug?: string;
          tags?: string[];
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      curriculum_mappings: {
        Row: {
          nptel_course: string | null;
          nptel_module: string | null;
          sppu_course: string | null;
          sppu_module: string | null;
          topic_slug: string;
          updated_at: string;
          year_semester: string | null;
        };
        Insert: {
          nptel_course?: string | null;
          nptel_module?: string | null;
          sppu_course?: string | null;
          sppu_module?: string | null;
          topic_slug: string;
          updated_at?: string;
          year_semester?: string | null;
        };
        Update: {
          nptel_course?: string | null;
          nptel_module?: string | null;
          sppu_course?: string | null;
          sppu_module?: string | null;
          topic_slug?: string;
          updated_at?: string;
          year_semester?: string | null;
        };
        Relationships: [];
      };
      practice_problems: {
        Row: {
          constraints: Json;
          contract_version: string | null;
          created_at: string;
          curriculum_node_id: string | null;
          examples: Json;
          function_signature: Json | null;
          generation_status: string;
          hidden_test_themes: Json;
          hint_ladder: Json;
          id: string;
          language: string;
          mastery_band: string | null;
          objective: string | null;
          planning_context: Json;
          prompt: string;
          prerequisite_tags: Json;
          starter_code: string | null;
          statement: string | null;
          success_criteria: Json;
          title: string;
          topic_slug: string | null;
          topic_tags: Json;
          user_id: string;
          visible_tests: Json;
        };
        Insert: {
          constraints?: Json;
          contract_version?: string | null;
          created_at?: string;
          curriculum_node_id?: string | null;
          examples?: Json;
          function_signature?: Json | null;
          generation_status?: string;
          hidden_test_themes?: Json;
          hint_ladder?: Json;
          id?: string;
          language?: string;
          mastery_band?: string | null;
          objective?: string | null;
          planning_context?: Json;
          prompt: string;
          prerequisite_tags?: Json;
          starter_code?: string | null;
          statement?: string | null;
          success_criteria?: Json;
          title: string;
          topic_slug?: string | null;
          topic_tags?: Json;
          user_id: string;
          visible_tests?: Json;
        };
        Update: {
          constraints?: Json;
          contract_version?: string | null;
          created_at?: string;
          curriculum_node_id?: string | null;
          examples?: Json;
          function_signature?: Json | null;
          generation_status?: string;
          hidden_test_themes?: Json;
          hint_ladder?: Json;
          id?: string;
          language?: string;
          mastery_band?: string | null;
          objective?: string | null;
          planning_context?: Json;
          prompt?: string;
          prerequisite_tags?: Json;
          starter_code?: string | null;
          statement?: string | null;
          success_criteria?: Json;
          title?: string;
          topic_slug?: string | null;
          topic_tags?: Json;
          user_id?: string;
          visible_tests?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "practice_problems_topic_slug_fkey";
            columns: ["topic_slug"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["slug"];
          },
        ];
      };
      practice_attempts: {
        Row: {
          code: string | null;
          completed_at: string | null;
          correctness_score: number;
          created_at: string;
          hidden_tests_passed: number | null;
          hidden_tests_total: number | null;
          hint_count: number;
          id: string;
          language: string;
          practice_problem_id: string;
          review_quality_score: number | null;
          speed_seconds: number | null;
          started_at: string;
          status: string;
          user_id: string;
          visible_tests_passed: number;
          visible_tests_total: number;
        };
        Insert: {
          code?: string | null;
          completed_at?: string | null;
          correctness_score?: number;
          created_at?: string;
          hidden_tests_passed?: number | null;
          hidden_tests_total?: number | null;
          hint_count?: number;
          id?: string;
          language: string;
          practice_problem_id: string;
          review_quality_score?: number | null;
          speed_seconds?: number | null;
          started_at?: string;
          status?: string;
          user_id: string;
          visible_tests_passed?: number;
          visible_tests_total?: number;
        };
        Update: {
          code?: string | null;
          completed_at?: string | null;
          correctness_score?: number;
          created_at?: string;
          hidden_tests_passed?: number | null;
          hidden_tests_total?: number | null;
          hint_count?: number;
          id?: string;
          language?: string;
          practice_problem_id?: string;
          review_quality_score?: number | null;
          speed_seconds?: number | null;
          started_at?: string;
          status?: string;
          user_id?: string;
          visible_tests_passed?: number;
          visible_tests_total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "practice_attempts_practice_problem_id_fkey";
            columns: ["practice_problem_id"];
            isOneToOne: false;
            referencedRelation: "practice_problems";
            referencedColumns: ["id"];
          },
        ];
      };
      practice_events: {
        Row: {
          created_at: string;
          curriculum_node_id: string | null;
          event_type: string;
          id: string;
          mastery_band: string | null;
          payload: Json;
          practice_attempt_id: string | null;
          practice_problem_id: string | null;
          topic_slug: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          curriculum_node_id?: string | null;
          event_type: string;
          id?: string;
          mastery_band?: string | null;
          payload?: Json;
          practice_attempt_id?: string | null;
          practice_problem_id?: string | null;
          topic_slug?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          curriculum_node_id?: string | null;
          event_type?: string;
          id?: string;
          mastery_band?: string | null;
          payload?: Json;
          practice_attempt_id?: string | null;
          practice_problem_id?: string | null;
          topic_slug?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "practice_events_practice_attempt_id_fkey";
            columns: ["practice_attempt_id"];
            isOneToOne: false;
            referencedRelation: "practice_attempts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "practice_events_practice_problem_id_fkey";
            columns: ["practice_problem_id"];
            isOneToOne: false;
            referencedRelation: "practice_problems";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "practice_events_topic_slug_fkey";
            columns: ["topic_slug"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["slug"];
          },
        ];
      };
      practice_problem_hidden_tests: {
        Row: {
          created_at: string;
          hidden_tests: Json;
          id: string;
          practice_problem_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          hidden_tests?: Json;
          id?: string;
          practice_problem_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          hidden_tests?: Json;
          id?: string;
          practice_problem_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "practice_problem_hidden_tests_practice_problem_id_fkey";
            columns: ["practice_problem_id"];
            isOneToOne: true;
            referencedRelation: "practice_problems";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      progress: {
        Row: {
          attempts: number;
          difficulty: number | null;
          last_reviewed: string;
          mastery: number;
          next_review_date: string | null;
          retrievability: number | null;
          stability: number | null;
          topic_slug: string;
          user_id: string;
        };
        Insert: {
          attempts?: number;
          difficulty?: number | null;
          last_reviewed?: string;
          mastery?: number;
          next_review_date?: string | null;
          retrievability?: number | null;
          stability?: number | null;
          topic_slug: string;
          user_id: string;
        };
        Update: {
          attempts?: number;
          difficulty?: number | null;
          last_reviewed?: string;
          mastery?: number;
          next_review_date?: string | null;
          retrievability?: number | null;
          stability?: number | null;
          topic_slug?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "progress_topic_slug_fkey";
            columns: ["topic_slug"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["slug"];
          },
        ];
      };
      research_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          payload: Json | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          payload?: Json | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          payload?: Json | null;
          user_id?: string;
        };
        Relationships: [];
      };
      review_issues: {
        Row: {
          concept_slug: string | null;
          explanation: string;
          fix_hint: string | null;
          id: string;
          line: number | null;
          severity: string;
          submission_id: string;
          title: string;
          user_id: string;
        };
        Insert: {
          concept_slug?: string | null;
          explanation: string;
          fix_hint?: string | null;
          id?: string;
          line?: number | null;
          severity?: string;
          submission_id: string;
          title: string;
          user_id: string;
        };
        Update: {
          concept_slug?: string | null;
          explanation?: string;
          fix_hint?: string | null;
          id?: string;
          line?: number | null;
          severity?: string;
          submission_id?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_issues_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          },
        ];
      };
      submissions: {
        Row: {
          code: string;
          concepts: string[];
          created_at: string;
          id: string;
          language: string;
          summary: string | null;
          user_id: string;
        };
        Insert: {
          code: string;
          concepts?: string[];
          created_at?: string;
          id?: string;
          language: string;
          summary?: string | null;
          user_id: string;
        };
        Update: {
          code?: string;
          concepts?: string[];
          created_at?: string;
          id?: string;
          language?: string;
          summary?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          billing_plan_code: string | null;
          cancel_at_period_end: boolean | null;
          created_at: string | null;
          currency_code: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          environment: string;
          external_status_updated_at: string | null;
          id: string;
          metadata: Json;
          paddle_customer_id: string | null;
          paddle_subscription_id: string | null;
          price_id: string;
          product_id: string;
          provider: string;
          provider_customer_id: string | null;
          provider_plan_id: string | null;
          provider_subscription_id: string | null;
          status: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          billing_plan_code?: string | null;
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          currency_code?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          environment?: string;
          external_status_updated_at?: string | null;
          id?: string;
          metadata?: Json;
          paddle_customer_id?: string | null;
          paddle_subscription_id?: string | null;
          price_id: string;
          product_id: string;
          provider?: string;
          provider_customer_id?: string | null;
          provider_plan_id?: string | null;
          provider_subscription_id?: string | null;
          status?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          billing_plan_code?: string | null;
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          currency_code?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          environment?: string;
          external_status_updated_at?: string | null;
          id?: string;
          metadata?: Json;
          paddle_customer_id?: string | null;
          paddle_subscription_id?: string | null;
          price_id?: string;
          product_id?: string;
          provider?: string;
          provider_customer_id?: string | null;
          provider_plan_id?: string | null;
          provider_subscription_id?: string | null;
          status?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      topics: {
        Row: {
          category: string;
          common_patterns: Json | null;
          description: string | null;
          maang_frequency: string | null;
          name: string;
          operations: Json | null;
          overview: string | null;
          prerequisites: Json | null;
          slug: string;
          when_to_avoid: string | null;
          when_to_use: string | null;
        };
        Insert: {
          category: string;
          common_patterns?: Json | null;
          description?: string | null;
          maang_frequency?: string | null;
          name: string;
          operations?: Json | null;
          overview?: string | null;
          prerequisites?: Json | null;
          slug: string;
          when_to_avoid?: string | null;
          when_to_use?: string | null;
        };
        Update: {
          category?: string;
          common_patterns?: Json | null;
          description?: string | null;
          maang_frequency?: string | null;
          name?: string;
          operations?: Json | null;
          overview?: string | null;
          prerequisites?: Json | null;
          slug?: string;
          when_to_avoid?: string | null;
          when_to_use?: string | null;
        };
        Relationships: [];
      };
      usage_counters: {
        Row: {
          count: number;
          kind: string;
          period_key: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          count?: number;
          kind: string;
          period_key: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          count?: number;
          kind?: string;
          period_key?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_consent: {
        Row: {
          consent_given: boolean;
          consent_version: string;
          consented_at: string;
          user_id: string;
        };
        Insert: {
          consent_given?: boolean;
          consent_version?: string;
          consented_at?: string;
          user_id: string;
        };
        Update: {
          consent_given?: boolean;
          consent_version?: string;
          consented_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      webhook_events: {
        Row: {
          created_at: string;
          environment: string | null;
          event_id: string;
          event_type: string;
          id: number;
          processed_at: string | null;
          processing_error: string | null;
          provider: string;
          raw_payload: string | null;
        };
        Insert: {
          created_at?: string;
          environment?: string | null;
          event_id: string;
          event_type: string;
          id?: number;
          processed_at?: string | null;
          processing_error?: string | null;
          provider?: string;
          raw_payload?: string | null;
        };
        Update: {
          created_at?: string;
          environment?: string | null;
          event_id?: string;
          event_type?: string;
          id?: number;
          processed_at?: string | null;
          processing_error?: string | null;
          provider?: string;
          raw_payload?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      consume_quota: {
        Args: {
          p_kind: string;
          p_limit: number;
          p_period_key: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      get_usage: {
        Args: { p_kind: string; p_period_key: string; p_user_id: string };
        Returns: number;
      };
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string };
        Returns: boolean;
      };
      has_role: {
        Args: { p_role: string; p_user_id: string };
        Returns: boolean;
      };
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
    Enums: {},
  },
} as const;
