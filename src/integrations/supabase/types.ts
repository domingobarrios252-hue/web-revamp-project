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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ad_banners: {
        Row: {
          active: boolean
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          link_url: string | null
          name: string
          placement: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          link_url?: string | null
          name: string
          placement?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          link_url?: string | null
          name?: string
          placement?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      clubs: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          region_id: string | null
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          region_id?: string | null
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          region_id?: string | null
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clubs_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          categories: string[]
          cover_url: string | null
          created_at: string
          description: string | null
          end_date: string | null
          facebook_url: string | null
          gallery: string[]
          id: string
          instagram_url: string | null
          location: string | null
          name: string
          organizer: string | null
          published: boolean
          region_id: string | null
          registration_url: string | null
          scope: string
          slug: string
          sort_order: number
          start_date: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          categories?: string[]
          cover_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          facebook_url?: string | null
          gallery?: string[]
          id?: string
          instagram_url?: string | null
          location?: string | null
          name: string
          organizer?: string | null
          published?: boolean
          region_id?: string | null
          registration_url?: string | null
          scope?: string
          slug: string
          sort_order?: number
          start_date: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          categories?: string[]
          cover_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          facebook_url?: string | null
          gallery?: string[]
          id?: string
          instagram_url?: string | null
          location?: string | null
          name?: string
          organizer?: string | null
          published?: boolean
          region_id?: string | null
          registration_url?: string | null
          scope?: string
          slug?: string
          sort_order?: number
          start_date?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          content: string | null
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          interview_date: string
          interviewee_bio: string | null
          interviewee_name: string
          photos: Json
          published: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          interview_date: string
          interviewee_bio?: string | null
          interviewee_name: string
          photos?: Json
          published?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          interview_date?: string
          interviewee_bio?: string | null
          interviewee_name?: string
          photos?: Json
          published?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      magazines: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          edition_date: string
          id: string
          issue_number: string | null
          pdf_url: string | null
          published: boolean
          read_url: string | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          edition_date: string
          id?: string
          issue_number?: string | null
          pdf_url?: string | null
          published?: boolean
          read_url?: string | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          edition_date?: string
          id?: string
          issue_number?: string | null
          pdf_url?: string | null
          published?: boolean
          read_url?: string | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      mvp_awards: {
        Row: {
          category_age: string | null
          club: string | null
          created_at: string
          full_name: string
          gender: Database["public"]["Enums"]["mvp_gender"]
          id: string
          merit: string | null
          photo_url: string | null
          position: number
          published: boolean
          region: string | null
          season_id: string
          tier: Database["public"]["Enums"]["mvp_tier"]
          updated_at: string
        }
        Insert: {
          category_age?: string | null
          club?: string | null
          created_at?: string
          full_name: string
          gender: Database["public"]["Enums"]["mvp_gender"]
          id?: string
          merit?: string | null
          photo_url?: string | null
          position: number
          published?: boolean
          region?: string | null
          season_id: string
          tier: Database["public"]["Enums"]["mvp_tier"]
          updated_at?: string
        }
        Update: {
          category_age?: string | null
          club?: string | null
          created_at?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["mvp_gender"]
          id?: string
          merit?: string | null
          photo_url?: string | null
          position?: number
          published?: boolean
          region?: string | null
          season_id?: string
          tier?: Database["public"]["Enums"]["mvp_tier"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mvp_awards_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "mvp_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      mvp_seasons: {
        Row: {
          created_at: string
          id: string
          is_current: boolean
          label: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_current?: boolean
          label: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          is_current?: boolean
          label?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      news: {
        Row: {
          author: string
          category_id: string | null
          content: string | null
          created_at: string
          created_by: string | null
          excerpt: string | null
          featured: boolean
          id: string
          image_url: string | null
          legacy_tag: string | null
          published: boolean
          published_at: string
          read_minutes: number | null
          slug: string
          title: string
          updated_at: string
          views_count: number
          writer_id: string | null
        }
        Insert: {
          author?: string
          category_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          legacy_tag?: string | null
          published?: boolean
          published_at?: string
          read_minutes?: number | null
          slug: string
          title: string
          updated_at?: string
          views_count?: number
          writer_id?: string | null
        }
        Update: {
          author?: string
          category_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          legacy_tag?: string | null
          published?: boolean
          published_at?: string
          read_minutes?: number | null
          slug?: string
          title?: string
          updated_at?: string
          views_count?: number
          writer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "news_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_writer_id_fkey"
            columns: ["writer_id"]
            isOneToOne: false
            referencedRelation: "writers"
            referencedColumns: ["id"]
          },
        ]
      }
      news_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          region_code: string | null
          scope: Database["public"]["Enums"]["news_scope"]
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          region_code?: string | null
          scope?: Database["public"]["Enums"]["news_scope"]
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          region_code?: string | null
          scope?: Database["public"]["Enums"]["news_scope"]
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      news_views: {
        Row: {
          id: string
          news_id: string
          viewed_at: string
          visitor_hash: string
        }
        Insert: {
          id?: string
          news_id: string
          viewed_at?: string
          visitor_hash: string
        }
        Update: {
          id?: string
          news_id?: string
          viewed_at?: string
          visitor_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_views_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          code: string
          created_at: string
          flag_url: string | null
          id: string
          name: string
          scope: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          flag_url?: string | null
          id?: string
          name: string
          scope?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          flag_url?: string | null
          id?: string
          name?: string
          scope?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      skaters: {
        Row: {
          active: boolean
          bio: string | null
          birth_year: number | null
          category: string | null
          club_id: string | null
          created_at: string
          full_name: string
          gender: string | null
          id: string
          personal_records: Json
          photo_url: string | null
          region_id: string | null
          slug: string
          total_points: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          bio?: string | null
          birth_year?: number | null
          category?: string | null
          club_id?: string | null
          created_at?: string
          full_name: string
          gender?: string | null
          id?: string
          personal_records?: Json
          photo_url?: string | null
          region_id?: string | null
          slug: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          bio?: string | null
          birth_year?: number | null
          category?: string | null
          club_id?: string | null
          created_at?: string
          full_name?: string
          gender?: string | null
          id?: string
          personal_records?: Json
          photo_url?: string | null
          region_id?: string | null
          slug?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skaters_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skaters_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          published: boolean
          slug: string
          sort_order: number
          tier: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          published?: boolean
          slug: string
          sort_order?: number
          tier?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          published?: boolean
          slug?: string
          sort_order?: number
          tier?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string | null
          created_at: string
          full_name: string
          id: string
          photo_url: string | null
          published: boolean
          role: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          full_name: string
          id?: string
          photo_url?: string | null
          published?: boolean
          role: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          photo_url?: string | null
          published?: boolean
          role?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ticker_items: {
        Row: {
          active: boolean
          created_at: string
          id: string
          link_url: string | null
          sort_order: number
          text: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          link_url?: string | null
          sort_order?: number
          text: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          link_url?: string | null
          sort_order?: number
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      tv_broadcasts: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          platform: string
          published: boolean
          scheduled_at: string
          sort_order: number
          stream_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          platform?: string
          published?: boolean
          scheduled_at: string
          sort_order?: number
          stream_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          platform?: string
          published?: boolean
          scheduled_at?: string
          sort_order?: number
          stream_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tv_highlights: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          duration: string | null
          featured: boolean
          id: string
          published: boolean
          sort_order: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          featured?: boolean
          id?: string
          published?: boolean
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          featured?: boolean
          id?: string
          published?: boolean
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      tv_settings: {
        Row: {
          id: string
          live_ends_at: string | null
          live_starts_at: string | null
          live_stream_url: string | null
          live_subtitle: string | null
          live_title: string
          next_event_at: string | null
          next_event_title: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          live_ends_at?: string | null
          live_starts_at?: string | null
          live_stream_url?: string | null
          live_subtitle?: string | null
          live_title?: string
          next_event_at?: string | null
          next_event_title?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          live_ends_at?: string | null
          live_starts_at?: string | null
          live_stream_url?: string | null
          live_subtitle?: string | null
          live_title?: string
          next_event_at?: string | null
          next_event_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      writers: {
        Row: {
          bio: string | null
          created_at: string
          full_name: string
          id: string
          photo_url: string | null
          published: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          full_name: string
          id?: string
          photo_url?: string | null
          published?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          photo_url?: string | null
          published?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      register_news_view: {
        Args: { _news_id: string; _visitor_hash: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
      mvp_gender: "masculino" | "femenino"
      mvp_tier: "elite" | "estrella" | "promesa"
      news_scope: "General" | "Nacional" | "Internacional"
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
      app_role: ["admin", "editor", "user"],
      mvp_gender: ["masculino", "femenino"],
      mvp_tier: ["elite", "estrella", "promesa"],
      news_scope: ["General", "Nacional", "Internacional"],
    },
  },
} as const
