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
      about_links: {
        Row: {
          active: boolean
          created_at: string
          icon: string
          id: string
          label: string
          link_type: string
          sort_order: number
          target: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string
          id?: string
          label: string
          link_type?: string
          sort_order?: number
          target: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string
          id?: string
          label?: string
          link_type?: string
          sort_order?: number
          target?: string
          updated_at?: string
        }
        Relationships: []
      }
      about_pages: {
        Row: {
          content: string
          created_at: string
          id: string
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
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
          address: string | null
          categories: string[]
          city: string | null
          coaches: Json
          country_code: string
          cover_url: string | null
          created_at: string
          description: string | null
          email: string | null
          facebook_url: string | null
          featured: boolean
          founded_year: number | null
          gallery: string[]
          history: string | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          name: string
          phone: string | null
          province: string | null
          published: boolean
          region_id: string | null
          school_type: string
          slug: string
          tiktok_url: string | null
          updated_at: string
          website: string | null
          youtube_url: string | null
        }
        Insert: {
          address?: string | null
          categories?: string[]
          city?: string | null
          coaches?: Json
          country_code?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          featured?: boolean
          founded_year?: number | null
          gallery?: string[]
          history?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          province?: string | null
          published?: boolean
          region_id?: string | null
          school_type?: string
          slug: string
          tiktok_url?: string | null
          updated_at?: string
          website?: string | null
          youtube_url?: string | null
        }
        Update: {
          address?: string | null
          categories?: string[]
          city?: string | null
          coaches?: Json
          country_code?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          featured?: boolean
          founded_year?: number | null
          gallery?: string[]
          history?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          province?: string | null
          published?: boolean
          region_id?: string | null
          school_type?: string
          slug?: string
          tiktok_url?: string | null
          updated_at?: string
          website?: string | null
          youtube_url?: string | null
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
      community_submission_logs: {
        Row: {
          action: string
          created_at: string
          details: Json
          id: string
          submission_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          id?: string
          submission_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          id?: string
          submission_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_submission_logs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "community_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      community_submissions: {
        Row: {
          admin_notes: string | null
          country_code: string
          created_at: string
          description: string
          email: string
          id: string
          image_urls: string[]
          links: string[]
          name: string
          news_id: string | null
          phone: string | null
          status: string
          submission_type: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          country_code?: string
          created_at?: string
          description: string
          email: string
          id?: string
          image_urls?: string[]
          links?: string[]
          name: string
          news_id?: string | null
          phone?: string | null
          status?: string
          submission_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          country_code?: string
          created_at?: string
          description?: string
          email?: string
          id?: string
          image_urls?: string[]
          links?: string[]
          name?: string
          news_id?: string | null
          phone?: string | null
          status?: string
          submission_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          accent_color_1: string | null
          accent_color_2: string | null
          accent_color_3: string | null
          active: boolean
          code: string
          created_at: string
          flag_url: string | null
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          accent_color_1?: string | null
          accent_color_2?: string | null
          accent_color_3?: string | null
          active?: boolean
          code: string
          created_at?: string
          flag_url?: string | null
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          accent_color_1?: string | null
          accent_color_2?: string | null
          accent_color_3?: string | null
          active?: boolean
          code?: string
          created_at?: string
          flag_url?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      country_hubs: {
        Row: {
          accent_color: string | null
          active: boolean
          active_sections: Json
          country_code: string
          created_at: string
          federation_name: string | null
          federation_url: string | null
          flag_url: string | null
          hero_image_url: string | null
          id: string
          name: string
          sort_order: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          active?: boolean
          active_sections?: Json
          country_code: string
          created_at?: string
          federation_name?: string | null
          federation_url?: string | null
          flag_url?: string | null
          hero_image_url?: string | null
          id?: string
          name: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          active?: boolean
          active_sections?: Json
          country_code?: string
          created_at?: string
          federation_name?: string | null
          federation_url?: string | null
          flag_url?: string | null
          hero_image_url?: string | null
          id?: string
          name?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      editor_countries: {
        Row: {
          country_code: string
          created_at: string
          user_id: string
        }
        Insert: {
          country_code: string
          created_at?: string
          user_id: string
        }
        Update: {
          country_code?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "editor_countries_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      event_clubs: {
        Row: {
          club_id: string
          created_at: string
          event_id: string
          role: string
        }
        Insert: {
          club_id: string
          created_at?: string
          event_id: string
          role?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          event_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_clubs_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_clubs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_federations: {
        Row: {
          created_at: string
          event_id: string
          federation_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          federation_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          federation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_federations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_federations_federation_id_fkey"
            columns: ["federation_id"]
            isOneToOne: false
            referencedRelation: "federations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_skaters: {
        Row: {
          created_at: string
          event_id: string
          skater_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          skater_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          skater_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_skaters_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_skaters_skater_id_fkey"
            columns: ["skater_id"]
            isOneToOne: false
            referencedRelation: "skaters"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_url: string | null
          categories: string[]
          city: string | null
          country_code: string
          cover_url: string | null
          created_at: string
          description: string | null
          end_date: string | null
          event_type: string | null
          facebook_url: string | null
          gallery: string[]
          id: string
          instagram_url: string | null
          is_featured: boolean
          live_center_enabled: boolean
          location: string | null
          logo_url: string | null
          name: string
          organizer: string | null
          published: boolean
          region_id: string | null
          registration_url: string | null
          scope: string
          season: string | null
          show_in_calendar: boolean
          show_in_home: boolean
          show_in_results: boolean
          slug: string
          sort_order: number
          start_date: string
          status: Database["public"]["Enums"]["live_center_status"]
          streaming_url: string | null
          updated_at: string
          venue: string | null
          website_url: string | null
        }
        Insert: {
          banner_url?: string | null
          categories?: string[]
          city?: string | null
          country_code?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          facebook_url?: string | null
          gallery?: string[]
          id?: string
          instagram_url?: string | null
          is_featured?: boolean
          live_center_enabled?: boolean
          location?: string | null
          logo_url?: string | null
          name: string
          organizer?: string | null
          published?: boolean
          region_id?: string | null
          registration_url?: string | null
          scope?: string
          season?: string | null
          show_in_calendar?: boolean
          show_in_home?: boolean
          show_in_results?: boolean
          slug: string
          sort_order?: number
          start_date: string
          status?: Database["public"]["Enums"]["live_center_status"]
          streaming_url?: string | null
          updated_at?: string
          venue?: string | null
          website_url?: string | null
        }
        Update: {
          banner_url?: string | null
          categories?: string[]
          city?: string | null
          country_code?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          facebook_url?: string | null
          gallery?: string[]
          id?: string
          instagram_url?: string | null
          is_featured?: boolean
          live_center_enabled?: boolean
          location?: string | null
          logo_url?: string | null
          name?: string
          organizer?: string | null
          published?: boolean
          region_id?: string | null
          registration_url?: string | null
          scope?: string
          season?: string | null
          show_in_calendar?: boolean
          show_in_home?: boolean
          show_in_results?: boolean
          slug?: string
          sort_order?: number
          start_date?: string
          status?: Database["public"]["Enums"]["live_center_status"]
          streaming_url?: string | null
          updated_at?: string
          venue?: string | null
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
      federation_documents: {
        Row: {
          created_at: string
          description: string | null
          doc_type: string
          federation_id: string
          file_url: string
          id: string
          published_at: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          doc_type?: string
          federation_id: string
          file_url: string
          id?: string
          published_at?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          doc_type?: string
          federation_id?: string
          file_url?: string
          id?: string
          published_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "federation_documents_federation_id_fkey"
            columns: ["federation_id"]
            isOneToOne: false
            referencedRelation: "federations"
            referencedColumns: ["id"]
          },
        ]
      }
      federations: {
        Row: {
          address: string | null
          city: string | null
          country_code: string
          cover_url: string | null
          created_at: string
          description: string | null
          email: string | null
          featured: boolean
          founded_year: number | null
          id: string
          logo_url: string | null
          name: string
          parent_id: string | null
          phone: string | null
          president: string | null
          published: boolean
          region_code: string | null
          region_name: string | null
          short_name: string | null
          slug: string
          social: Json
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country_code?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          featured?: boolean
          founded_year?: number | null
          id?: string
          logo_url?: string | null
          name: string
          parent_id?: string | null
          phone?: string | null
          president?: string | null
          published?: boolean
          region_code?: string | null
          region_name?: string | null
          short_name?: string | null
          slug: string
          social?: Json
          type?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country_code?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          featured?: boolean
          founded_year?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          parent_id?: string | null
          phone?: string | null
          president?: string | null
          published?: boolean
          region_code?: string | null
          region_name?: string | null
          short_name?: string | null
          slug?: string
          social?: Json
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "federations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "federations"
            referencedColumns: ["id"]
          },
        ]
      }
      home_modules: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      home_standings_groups: {
        Row: {
          autoplay: boolean
          competition_group: string
          created_at: string
          display_order: number
          division_name: string
          full_url: string | null
          id: string
          max_cards: number
          season: string
          subtitle: string | null
          title: string | null
          updated_at: string
          visible: boolean
        }
        Insert: {
          autoplay?: boolean
          competition_group: string
          created_at?: string
          display_order?: number
          division_name: string
          full_url?: string | null
          id?: string
          max_cards?: number
          season?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          visible?: boolean
        }
        Update: {
          autoplay?: boolean
          competition_group?: string
          created_at?: string
          display_order?: number
          division_name?: string
          full_url?: string | null
          id?: string
          max_cards?: number
          season?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      home_standings_rows: {
        Row: {
          club_logo: string | null
          club_name: string
          created_at: string
          full_url: string | null
          group_id: string
          id: string
          points: number
          position: number
          updated_at: string
        }
        Insert: {
          club_logo?: string | null
          club_name: string
          created_at?: string
          full_url?: string | null
          group_id: string
          id?: string
          points?: number
          position?: number
          updated_at?: string
        }
        Update: {
          club_logo?: string | null
          club_name?: string
          created_at?: string
          full_url?: string | null
          group_id?: string
          id?: string
          points?: number
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_standings_rows_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "home_standings_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          content: string | null
          country_code: string
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
          country_code?: string
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
          country_code?: string
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
      league_rounds: {
        Row: {
          city: string | null
          created_at: string
          event_date: string | null
          gallery: string[]
          id: string
          map_url: string | null
          name: string
          notes: string | null
          pdf_url: string | null
          poster_url: string | null
          published: boolean
          round_number: number
          season_id: string
          sort_order: number
          status: Database["public"]["Enums"]["live_center_status"]
          summary_news_id: string | null
          updated_at: string
          venue: string | null
          video_url: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          event_date?: string | null
          gallery?: string[]
          id?: string
          map_url?: string | null
          name: string
          notes?: string | null
          pdf_url?: string | null
          poster_url?: string | null
          published?: boolean
          round_number: number
          season_id: string
          sort_order?: number
          status?: Database["public"]["Enums"]["live_center_status"]
          summary_news_id?: string | null
          updated_at?: string
          venue?: string | null
          video_url?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          event_date?: string | null
          gallery?: string[]
          id?: string
          map_url?: string | null
          name?: string
          notes?: string | null
          pdf_url?: string | null
          poster_url?: string | null
          published?: boolean
          round_number?: number
          season_id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["live_center_status"]
          summary_news_id?: string | null
          updated_at?: string
          venue?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "league_rounds_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "league_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      league_seasons: {
        Row: {
          country_code: string
          created_at: string
          id: string
          is_current: boolean
          name: string
          published: boolean
          slug: string
          sort_order: number
          updated_at: string
          year_label: string | null
        }
        Insert: {
          country_code?: string
          created_at?: string
          id?: string
          is_current?: boolean
          name: string
          published?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
          year_label?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string
          id?: string
          is_current?: boolean
          name?: string
          published?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
          year_label?: string | null
        }
        Relationships: []
      }
      league_standings: {
        Row: {
          athlete_name: string | null
          category: string | null
          club: string | null
          created_at: string
          gender: string | null
          group_name: string | null
          id: string
          podiums: number
          point_diff: number | null
          points: number
          position: number
          published: boolean
          rounds_played: number
          season_id: string
          updated_at: string
          wins: number
        }
        Insert: {
          athlete_name?: string | null
          category?: string | null
          club?: string | null
          created_at?: string
          gender?: string | null
          group_name?: string | null
          id?: string
          podiums?: number
          point_diff?: number | null
          points?: number
          position?: number
          published?: boolean
          rounds_played?: number
          season_id: string
          updated_at?: string
          wins?: number
        }
        Update: {
          athlete_name?: string | null
          category?: string | null
          club?: string | null
          created_at?: string
          gender?: string | null
          group_name?: string | null
          id?: string
          podiums?: number
          point_diff?: number | null
          points?: number
          position?: number
          published?: boolean
          rounds_played?: number
          season_id?: string
          updated_at?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "league_standings_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "league_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_pages: {
        Row: {
          content: string
          created_at: string
          id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      live_results: {
        Row: {
          athlete_name: string
          category: string | null
          club: string | null
          country: string | null
          created_at: string
          distance: string | null
          event_name: string
          event_slug: string | null
          featured_in_live_center: boolean
          federation: string | null
          gap: string | null
          gender: string | null
          home_sort_order: number
          id: string
          is_highlighted: boolean
          news_id: string | null
          notes: string | null
          points: number | null
          position: number
          published: boolean
          race: string | null
          race_time: string | null
          round: string | null
          sort_order: number
          status: Database["public"]["Enums"]["live_result_status"]
          updated_at: string
        }
        Insert: {
          athlete_name?: string
          category?: string | null
          club?: string | null
          country?: string | null
          created_at?: string
          distance?: string | null
          event_name: string
          event_slug?: string | null
          featured_in_live_center?: boolean
          federation?: string | null
          gap?: string | null
          gender?: string | null
          home_sort_order?: number
          id?: string
          is_highlighted?: boolean
          news_id?: string | null
          notes?: string | null
          points?: number | null
          position?: number
          published?: boolean
          race?: string | null
          race_time?: string | null
          round?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["live_result_status"]
          updated_at?: string
        }
        Update: {
          athlete_name?: string
          category?: string | null
          club?: string | null
          country?: string | null
          created_at?: string
          distance?: string | null
          event_name?: string
          event_slug?: string | null
          featured_in_live_center?: boolean
          federation?: string | null
          gap?: string | null
          gender?: string | null
          home_sort_order?: number
          id?: string
          is_highlighted?: boolean
          news_id?: string | null
          notes?: string | null
          points?: number | null
          position?: number
          published?: boolean
          race?: string | null
          race_time?: string | null
          round?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["live_result_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_results_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      live_stream: {
        Row: {
          autoplay: boolean
          created_at: string
          embed_url: string | null
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          autoplay?: boolean
          created_at?: string
          embed_url?: string | null
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Update: {
          autoplay?: boolean
          created_at?: string
          embed_url?: string | null
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      live_timeline: {
        Row: {
          created_at: string
          entry_type: string
          event_id: string
          id: string
          message: string
          occurred_at: string
          published: boolean
        }
        Insert: {
          created_at?: string
          entry_type?: string
          event_id: string
          id?: string
          message: string
          occurred_at?: string
          published?: boolean
        }
        Update: {
          created_at?: string
          entry_type?: string
          event_id?: string
          id?: string
          message?: string
          occurred_at?: string
          published?: boolean
        }
        Relationships: []
      }
      magazine_purchases: {
        Row: {
          amount_paid: number
          id: string
          magazine_id: string
          payment_id: string | null
          purchased_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          id?: string
          magazine_id: string
          payment_id?: string | null
          purchased_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          id?: string
          magazine_id?: string
          payment_id?: string | null
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "magazine_purchases_magazine_id_fkey"
            columns: ["magazine_id"]
            isOneToOne: false
            referencedRelation: "magazines"
            referencedColumns: ["id"]
          },
        ]
      }
      magazines: {
        Row: {
          country: string
          cover_image_url: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          edition_date: string
          edition_number: number | null
          id: string
          is_active: boolean
          is_free: boolean
          issue_number: string | null
          pdf_url: string | null
          price: number
          published: boolean
          read_url: string | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          country?: string
          cover_image_url?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          edition_date: string
          edition_number?: number | null
          id?: string
          is_active?: boolean
          is_free?: boolean
          issue_number?: string | null
          pdf_url?: string | null
          price?: number
          published?: boolean
          read_url?: string | null
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          country?: string
          cover_image_url?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          edition_date?: string
          edition_number?: number | null
          id?: string
          is_active?: boolean
          is_free?: boolean
          issue_number?: string | null
          pdf_url?: string | null
          price?: number
          published?: boolean
          read_url?: string | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      medal_standings: {
        Row: {
          bronze: number
          country_code: string | null
          country_name: string
          created_at: string
          flag_url: string | null
          gold: number
          id: string
          published: boolean
          silver: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          bronze?: number
          country_code?: string | null
          country_name: string
          created_at?: string
          flag_url?: string | null
          gold?: number
          id?: string
          published?: boolean
          silver?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bronze?: number
          country_code?: string | null
          country_name?: string
          created_at?: string
          flag_url?: string | null
          gold?: number
          id?: string
          published?: boolean
          silver?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      mvp_awards: {
        Row: {
          category_age: string | null
          club: string | null
          country_code: string
          created_at: string
          full_name: string
          gender: Database["public"]["Enums"]["mvp_gender"]
          id: string
          merit: string | null
          photo_url: string | null
          points: number
          position: number
          previous_position: number | null
          published: boolean
          region: string | null
          season_id: string
          skater_id: string | null
          tier: Database["public"]["Enums"]["mvp_tier"]
          updated_at: string
        }
        Insert: {
          category_age?: string | null
          club?: string | null
          country_code?: string
          created_at?: string
          full_name: string
          gender: Database["public"]["Enums"]["mvp_gender"]
          id?: string
          merit?: string | null
          photo_url?: string | null
          points?: number
          position: number
          previous_position?: number | null
          published?: boolean
          region?: string | null
          season_id: string
          skater_id?: string | null
          tier: Database["public"]["Enums"]["mvp_tier"]
          updated_at?: string
        }
        Update: {
          category_age?: string | null
          club?: string | null
          country_code?: string
          created_at?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["mvp_gender"]
          id?: string
          merit?: string | null
          photo_url?: string | null
          points?: number
          position?: number
          previous_position?: number | null
          published?: boolean
          region?: string | null
          season_id?: string
          skater_id?: string | null
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
          competition_tag: string | null
          content: string | null
          country_code: string
          created_at: string
          created_by: string | null
          excerpt: string | null
          featured: boolean
          gallery: string[]
          hero_order: number
          id: string
          image_url: string | null
          legacy_tag: string | null
          published: boolean
          published_at: string
          read_minutes: number | null
          review_feedback: string | null
          section_id: string | null
          slug: string
          status: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at: string
          views_count: number
          writer_id: string | null
        }
        Insert: {
          author?: string
          category_id?: string | null
          competition_tag?: string | null
          content?: string | null
          country_code?: string
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          featured?: boolean
          gallery?: string[]
          hero_order?: number
          id?: string
          image_url?: string | null
          legacy_tag?: string | null
          published?: boolean
          published_at?: string
          read_minutes?: number | null
          review_feedback?: string | null
          section_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at?: string
          views_count?: number
          writer_id?: string | null
        }
        Update: {
          author?: string
          category_id?: string | null
          competition_tag?: string | null
          content?: string | null
          country_code?: string
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          featured?: boolean
          gallery?: string[]
          hero_order?: number
          id?: string
          image_url?: string | null
          legacy_tag?: string | null
          published?: boolean
          published_at?: string
          read_minutes?: number | null
          review_feedback?: string | null
          section_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["post_status"]
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
            foreignKeyName: "news_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
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
      news_clubs: {
        Row: {
          club_id: string
          created_at: string
          news_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          news_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          news_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_clubs_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_clubs_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      news_federations: {
        Row: {
          created_at: string
          federation_id: string
          news_id: string
        }
        Insert: {
          created_at?: string
          federation_id: string
          news_id: string
        }
        Update: {
          created_at?: string
          federation_id?: string
          news_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_federations_federation_id_fkey"
            columns: ["federation_id"]
            isOneToOne: false
            referencedRelation: "federations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_federations_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      news_skaters: {
        Row: {
          created_at: string
          news_id: string
          skater_id: string
        }
        Insert: {
          created_at?: string
          news_id: string
          skater_id: string
        }
        Update: {
          created_at?: string
          news_id?: string
          skater_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_skaters_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_skaters_skater_id_fkey"
            columns: ["skater_id"]
            isOneToOne: false
            referencedRelation: "skaters"
            referencedColumns: ["id"]
          },
        ]
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
      news_visibility: {
        Row: {
          channel: Database["public"]["Enums"]["visibility_channel"]
          country_code: string
          created_at: string
          news_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["visibility_channel"]
          country_code?: string
          created_at?: string
          news_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["visibility_channel"]
          country_code?: string
          created_at?: string
          news_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_visibility_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          section_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          section_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          section_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      races: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_order: number
          event_id: string
          gender: string | null
          id: string
          race_name: string
          scheduled_time: string
          status: Database["public"]["Enums"]["live_center_status"]
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          event_id: string
          gender?: string | null
          id?: string
          race_name: string
          scheduled_time?: string
          status?: Database["public"]["Enums"]["live_center_status"]
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          event_id?: string
          gender?: string | null
          id?: string
          race_name?: string
          scheduled_time?: string
          status?: Database["public"]["Enums"]["live_center_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "races_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
      result_events: {
        Row: {
          banner_url: string | null
          country: string | null
          created_at: string
          event_date: string | null
          featured_in_live_center: boolean
          id: string
          name: string
          placements: string[]
          published: boolean
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["live_result_status"]
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          country?: string | null
          created_at?: string
          event_date?: string | null
          featured_in_live_center?: boolean
          id?: string
          name: string
          placements?: string[]
          published?: boolean
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["live_result_status"]
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          country?: string | null
          created_at?: string
          event_date?: string | null
          featured_in_live_center?: boolean
          id?: string
          name?: string
          placements?: string[]
          published?: boolean
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["live_result_status"]
          updated_at?: string
        }
        Relationships: []
      }
      result_skaters: {
        Row: {
          created_at: string
          result_id: string
          skater_id: string
        }
        Insert: {
          created_at?: string
          result_id: string
          skater_id: string
        }
        Update: {
          created_at?: string
          result_id?: string
          skater_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "result_skaters_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_skaters_skater_id_fkey"
            columns: ["skater_id"]
            isOneToOne: false
            referencedRelation: "skaters"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          athlete_name: string
          club: string | null
          country: string | null
          created_at: string
          gap: string | null
          id: string
          is_highlighted: boolean
          position: number
          race_id: string
          time: string | null
          updated_at: string
        }
        Insert: {
          athlete_name: string
          club?: string | null
          country?: string | null
          created_at?: string
          gap?: string | null
          id?: string
          is_highlighted?: boolean
          position: number
          race_id: string
          time?: string | null
          updated_at?: string
        }
        Update: {
          athlete_name?: string
          club?: string | null
          country?: string | null
          created_at?: string
          gap?: string | null
          id?: string
          is_highlighted?: boolean
          position?: number
          race_id?: string
          time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_items: {
        Row: {
          category: string | null
          country_code: string
          created_at: string
          event_name: string
          id: string
          location: string | null
          published: boolean
          scheduled_at: string
          sort_order: number
          status: Database["public"]["Enums"]["schedule_status"]
          updated_at: string
        }
        Insert: {
          category?: string | null
          country_code?: string
          created_at?: string
          event_name: string
          id?: string
          location?: string | null
          published?: boolean
          scheduled_at: string
          sort_order?: number
          status?: Database["public"]["Enums"]["schedule_status"]
          updated_at?: string
        }
        Update: {
          category?: string | null
          country_code?: string
          created_at?: string
          event_name?: string
          id?: string
          location?: string | null
          published?: boolean
          scheduled_at?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["schedule_status"]
          updated_at?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
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
          country_code: string
          cover_url: string | null
          created_at: string
          dominant_foot: string | null
          featured: boolean
          full_name: string
          gallery: Json
          gender: string | null
          height_cm: number | null
          id: string
          is_legend: boolean
          palmares: Json
          personal_records: Json
          photo_url: string | null
          province: string | null
          published: boolean
          region_id: string | null
          slug: string
          social: Json
          specialty: string | null
          sponsors: Json
          total_points: number
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          active?: boolean
          bio?: string | null
          birth_year?: number | null
          category?: string | null
          club_id?: string | null
          country_code?: string
          cover_url?: string | null
          created_at?: string
          dominant_foot?: string | null
          featured?: boolean
          full_name: string
          gallery?: Json
          gender?: string | null
          height_cm?: number | null
          id?: string
          is_legend?: boolean
          palmares?: Json
          personal_records?: Json
          photo_url?: string | null
          province?: string | null
          published?: boolean
          region_id?: string | null
          slug: string
          social?: Json
          specialty?: string | null
          sponsors?: Json
          total_points?: number
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          active?: boolean
          bio?: string | null
          birth_year?: number | null
          category?: string | null
          club_id?: string | null
          country_code?: string
          cover_url?: string | null
          created_at?: string
          dominant_foot?: string | null
          featured?: boolean
          full_name?: string
          gallery?: Json
          gender?: string | null
          height_cm?: number | null
          id?: string
          is_legend?: boolean
          palmares?: Json
          personal_records?: Json
          photo_url?: string | null
          province?: string | null
          published?: boolean
          region_id?: string | null
          slug?: string
          social?: Json
          specialty?: string | null
          sponsors?: Json
          total_points?: number
          updated_at?: string
          weight_kg?: number | null
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
          country_code: string
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
          country_code?: string
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
          country_code?: string
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
          country_code: string
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
          country_code?: string
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
          country_code?: string
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
          country_code: string
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
          country_code?: string
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
          country_code?: string
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
      video_skaters: {
        Row: {
          created_at: string
          skater_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          skater_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          skater_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_skaters_skater_id_fkey"
            columns: ["skater_id"]
            isOneToOne: false
            referencedRelation: "skaters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_skaters_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          category: string | null
          club_id: string | null
          country_code: string
          created_at: string
          description: string | null
          duration_seconds: number | null
          event_id: string | null
          featured: boolean
          id: string
          news_id: string | null
          published: boolean
          published_at: string
          slug: string
          sort_order: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
          youtube_id: string | null
        }
        Insert: {
          category?: string | null
          club_id?: string | null
          country_code?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          event_id?: string | null
          featured?: boolean
          id?: string
          news_id?: string | null
          published?: boolean
          published_at?: string
          slug: string
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
          youtube_id?: string | null
        }
        Update: {
          category?: string | null
          club_id?: string | null
          country_code?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          event_id?: string | null
          featured?: boolean
          id?: string
          news_id?: string | null
          published?: boolean
          published_at?: string
          slug?: string
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          youtube_id?: string | null
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
      can_edit_country: {
        Args: { _country: string; _user_id: string }
        Returns: boolean
      }
      current_user_section_id: { Args: never; Returns: string }
      has_assigned_section: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_editorial_staff: { Args: { _user_id: string }; Returns: boolean }
      register_news_view: {
        Args: { _news_id: string; _visitor_hash: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "user" | "colaborador"
      live_center_status: "upcoming" | "live" | "finished"
      live_result_status: "en_vivo" | "finalizado" | "proxima"
      mvp_gender: "masculino" | "femenino"
      mvp_tier: "elite" | "estrella" | "promesa"
      news_scope: "General" | "Nacional" | "Internacional"
      post_status: "draft" | "pending" | "published" | "rejected"
      schedule_status: "programada" | "en_curso" | "finalizada"
      visibility_channel: "global_home" | "featured" | "breaking" | "country"
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
      app_role: ["admin", "editor", "user", "colaborador"],
      live_center_status: ["upcoming", "live", "finished"],
      live_result_status: ["en_vivo", "finalizado", "proxima"],
      mvp_gender: ["masculino", "femenino"],
      mvp_tier: ["elite", "estrella", "promesa"],
      news_scope: ["General", "Nacional", "Internacional"],
      post_status: ["draft", "pending", "published", "rejected"],
      schedule_status: ["programada", "en_curso", "finalizada"],
      visibility_channel: ["global_home", "featured", "breaking", "country"],
    },
  },
} as const
