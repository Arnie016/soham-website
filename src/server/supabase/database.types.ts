export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      sk_documents: {
        Row: {
          created_at: string;
          filename: string;
          id: string;
          mime: string;
          project_id: string;
          size: number;
          storage_path: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          filename: string;
          id: string;
          mime: string;
          project_id: string;
          size: number;
          storage_path: string;
          title: string;
        };
        Update: {
          created_at?: string;
          filename?: string;
          id?: string;
          mime?: string;
          project_id?: string;
          size?: number;
          storage_path?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sk_documents_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "sk_projects";
            referencedColumns: ["id"];
          },
        ];
      };
      sk_email_notifications: {
        Row: {
          attempts: number;
          inquiry_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          attempts?: number;
          inquiry_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          attempts?: number;
          inquiry_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sk_email_notifications_inquiry_id_fkey";
            columns: ["inquiry_id"];
            isOneToOne: true;
            referencedRelation: "sk_enquiries";
            referencedColumns: ["id"];
          },
        ];
      };
      sk_enquiries: {
        Row: {
          budget: string;
          client_type: string;
          consent_at: string;
          created_at: string;
          email: string;
          id: string;
          location: string;
          message: string;
          name: string;
          phone: string;
          request_key: string;
          service: string;
          status: string;
        };
        Insert: {
          budget?: string;
          client_type: string;
          consent_at?: string;
          created_at?: string;
          email: string;
          id?: string;
          location: string;
          message: string;
          name: string;
          phone?: string;
          request_key: string;
          service: string;
          status?: string;
        };
        Update: {
          budget?: string;
          client_type?: string;
          consent_at?: string;
          created_at?: string;
          email?: string;
          id?: string;
          location?: string;
          message?: string;
          name?: string;
          phone?: string;
          request_key?: string;
          service?: string;
          status?: string;
        };
        Relationships: [];
      };
      sk_profiles: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          name: string;
          role: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
          name: string;
          role?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          role?: string;
        };
        Relationships: [];
      };
      sk_projects: {
        Row: {
          client_id: string;
          created_at: string;
          id: string;
          location: string;
          next_step: string;
          service: string;
          stage: string;
          summary: string;
          title: string;
          version: number;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          id: string;
          location: string;
          next_step: string;
          service: string;
          stage?: string;
          summary: string;
          title: string;
          version?: number;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          id?: string;
          location?: string;
          next_step?: string;
          service?: string;
          stage?: string;
          summary?: string;
          title?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sk_projects_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "sk_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      sk_rate_limits: {
        Row: {
          count: number;
          key: string;
          reset_at: number;
        };
        Insert: {
          count: number;
          key: string;
          reset_at: number;
        };
        Update: {
          count?: number;
          key?: string;
          reset_at?: number;
        };
        Relationships: [];
      };
      sk_updates: {
        Row: {
          author_id: string;
          author_name: string;
          body: string;
          created_at: string;
          id: string;
          kind: string;
          project_id: string;
          role: string;
        };
        Insert: {
          author_id: string;
          author_name?: string;
          body: string;
          created_at?: string;
          id: string;
          kind?: string;
          project_id: string;
          role?: string;
        };
        Update: {
          author_id?: string;
          author_name?: string;
          body?: string;
          created_at?: string;
          id?: string;
          kind?: string;
          project_id?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sk_updates_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "sk_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sk_updates_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "sk_projects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      sk_claim_notification: {
        Args: { p_id: string; p_retry?: boolean };
        Returns: boolean;
      };
      sk_consume_rate_limit: {
        Args: { p_key: string; p_now: number; p_window: number };
        Returns: {
          count: number;
          reset_at: number;
        }[];
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

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
