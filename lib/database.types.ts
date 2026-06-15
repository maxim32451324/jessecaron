export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" }
  public: {
    Tables: {
      courses: {
        Row: { access_type: string; cover_image: string | null; created_at: string; description: string | null; id: string; is_published: boolean; slug: string; sort: number; title: string; updated_at: string }
        Insert: { access_type?: string; cover_image?: string | null; created_at?: string; description?: string | null; id?: string; is_published?: boolean; slug: string; sort?: number; title: string; updated_at?: string }
        Update: { access_type?: string; cover_image?: string | null; created_at?: string; description?: string | null; id?: string; is_published?: boolean; slug?: string; sort?: number; title?: string; updated_at?: string }
        Relationships: []
      }
      enrollments: {
        Row: { course_id: string; enrolled_at: string; id: string; status: string; user_id: string }
        Insert: { course_id: string; enrolled_at?: string; id?: string; status?: string; user_id: string }
        Update: { course_id?: string; enrolled_at?: string; id?: string; status?: string; user_id?: string }
        Relationships: []
      }
      intakes: {
        Row: { created_at: string; email: string; format: string | null; id: string; level: string | null; message: string | null; name: string; phone: string | null; sport: string | null; status: string }
        Insert: { created_at?: string; email: string; format?: string | null; id?: string; level?: string | null; message?: string | null; name: string; phone?: string | null; sport?: string | null; status?: string }
        Update: { created_at?: string; email?: string; format?: string | null; id?: string; level?: string | null; message?: string | null; name?: string; phone?: string | null; sport?: string | null; status?: string }
        Relationships: []
      }
      lesson_progress: {
        Row: { completed_at: string | null; id: string; lesson_id: string; updated_at: string; user_id: string; watch_seconds: number }
        Insert: { completed_at?: string | null; id?: string; lesson_id: string; updated_at?: string; user_id: string; watch_seconds?: number }
        Update: { completed_at?: string | null; id?: string; lesson_id?: string; updated_at?: string; user_id?: string; watch_seconds?: number }
        Relationships: []
      }
      lessons: {
        Row: { attachments: Json; body: string | null; created_at: string; duration_sec: number | null; id: string; is_preview: boolean; module_id: string; playback_id: string | null; slug: string; sort: number; title: string; updated_at: string; video_provider: string | null }
        Insert: { attachments?: Json; body?: string | null; created_at?: string; duration_sec?: number | null; id?: string; is_preview?: boolean; module_id: string; playback_id?: string | null; slug: string; sort?: number; title: string; updated_at?: string; video_provider?: string | null }
        Update: { attachments?: Json; body?: string | null; created_at?: string; duration_sec?: number | null; id?: string; is_preview?: boolean; module_id?: string; playback_id?: string | null; slug?: string; sort?: number; title?: string; updated_at?: string; video_provider?: string | null }
        Relationships: []
      }
      modules: {
        Row: { course_id: string; id: string; sort: number; title: string }
        Insert: { course_id: string; id?: string; sort?: number; title: string }
        Update: { course_id?: string; id?: string; sort?: number; title?: string }
        Relationships: []
      }
      profiles: {
        Row: { avatar_url: string | null; created_at: string; full_name: string | null; id: string; role: string }
        Insert: { avatar_url?: string | null; created_at?: string; full_name?: string | null; id: string; role?: string }
        Update: { avatar_url?: string | null; created_at?: string; full_name?: string | null; id?: string; role?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      is_enrolled: { Args: { p_course_id: string }; Returns: boolean }
      is_owner: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
