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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alias_cache: {
        Row: {
          cached_at: string
          entity_type: string
          hit_count: number
          last_hit_at: string
          project_id: string
          result: Json
          term_norm: string
        }
        Insert: {
          cached_at?: string
          entity_type: string
          hit_count?: number
          last_hit_at?: string
          project_id: string
          result: Json
          term_norm: string
        }
        Update: {
          cached_at?: string
          entity_type?: string
          hit_count?: number
          last_hit_at?: string
          project_id?: string
          result?: Json
          term_norm?: string
        }
        Relationships: []
      }
      assistant_conversations: {
        Row: {
          created_at: string
          id: string
          project_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_error: boolean
          role: string
          sources: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_error?: boolean
          role: string
          sources?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_error?: boolean
          role?: string
          sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "assistant_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "assistant_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      benchmarks: {
        Row: {
          as_of_date: string
          baseline_unit: string
          baseline_unit_canonical: string | null
          baseline_value: number
          baseline_value_canonical: number | null
          created_at: string
          experiment_id: string | null
          id: string
          material_label: string | null
          measurement_id: string | null
          metric_key: string
          notes: string | null
          project_id: string
          scope_definition: Json | null
          source_claim_id: string | null
          source_excerpt: string | null
          source_file_id: string | null
          status: string
          superseded_at: string | null
          superseded_by_benchmark_id: string | null
          superseded_by_measurement_id: string | null
          updated_at: string
        }
        Insert: {
          as_of_date: string
          baseline_unit: string
          baseline_unit_canonical?: string | null
          baseline_value: number
          baseline_value_canonical?: number | null
          created_at?: string
          experiment_id?: string | null
          id?: string
          material_label?: string | null
          measurement_id?: string | null
          metric_key: string
          notes?: string | null
          project_id: string
          scope_definition?: Json | null
          source_claim_id?: string | null
          source_excerpt?: string | null
          source_file_id?: string | null
          status?: string
          superseded_at?: string | null
          superseded_by_benchmark_id?: string | null
          superseded_by_measurement_id?: string | null
          updated_at?: string
        }
        Update: {
          as_of_date?: string
          baseline_unit?: string
          baseline_unit_canonical?: string | null
          baseline_value?: number
          baseline_value_canonical?: number | null
          created_at?: string
          experiment_id?: string | null
          id?: string
          material_label?: string | null
          measurement_id?: string | null
          metric_key?: string
          notes?: string | null
          project_id?: string
          scope_definition?: Json | null
          source_claim_id?: string | null
          source_excerpt?: string | null
          source_file_id?: string | null
          status?: string
          superseded_at?: string | null
          superseded_by_benchmark_id?: string | null
          superseded_by_measurement_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "benchmarks_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "current_best"
            referencedColumns: ["experiment_id"]
          },
          {
            foreignKeyName: "benchmarks_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benchmarks_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "current_best"
            referencedColumns: ["measurement_id"]
          },
          {
            foreignKeyName: "benchmarks_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "measurements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benchmarks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benchmarks_source_claim_id_fkey"
            columns: ["source_claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benchmarks_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benchmarks_superseded_by_benchmark_id_fkey"
            columns: ["superseded_by_benchmark_id"]
            isOneToOne: false
            referencedRelation: "benchmarks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benchmarks_superseded_by_measurement_id_fkey"
            columns: ["superseded_by_measurement_id"]
            isOneToOne: false
            referencedRelation: "current_best"
            referencedColumns: ["measurement_id"]
          },
          {
            foreignKeyName: "benchmarks_superseded_by_measurement_id_fkey"
            columns: ["superseded_by_measurement_id"]
            isOneToOne: false
            referencedRelation: "measurements"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          claim_type: string
          confidence: number | null
          created_at: string
          entities: string[] | null
          evidence_date: string | null
          excerpt: string
          id: string
          metric_key: string | null
          project_id: string
          scope_definition: Json | null
          source_experiment_id: string | null
          source_file_id: string | null
          status: string
          superseded_at: string | null
          superseded_by: string | null
          superseded_reason: string | null
          updated_at: string
        }
        Insert: {
          claim_type: string
          confidence?: number | null
          created_at?: string
          entities?: string[] | null
          evidence_date?: string | null
          excerpt: string
          id?: string
          metric_key?: string | null
          project_id: string
          scope_definition?: Json | null
          source_experiment_id?: string | null
          source_file_id?: string | null
          status?: string
          superseded_at?: string | null
          superseded_by?: string | null
          superseded_reason?: string | null
          updated_at?: string
        }
        Update: {
          claim_type?: string
          confidence?: number | null
          created_at?: string
          entities?: string[] | null
          evidence_date?: string | null
          excerpt?: string
          id?: string
          metric_key?: string | null
          project_id?: string
          scope_definition?: Json | null
          source_experiment_id?: string | null
          source_file_id?: string | null
          status?: string
          superseded_at?: string | null
          superseded_by?: string | null
          superseded_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_source_experiment_id_fkey"
            columns: ["source_experiment_id"]
            isOneToOne: false
            referencedRelation: "current_best"
            referencedColumns: ["experiment_id"]
          },
          {
            foreignKeyName: "claims_source_experiment_id_fkey"
            columns: ["source_experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      correlation_jobs: {
        Row: {
          completed_at: string | null
          contradictions_found: number | null
          created_at: string
          created_by: string
          error_message: string | null
          gaps_found: number | null
          id: string
          insights_created: number | null
          metrics_analyzed: number | null
          patterns_found: number | null
          project_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          contradictions_found?: number | null
          created_at?: string
          created_by: string
          error_message?: string | null
          gaps_found?: number | null
          id?: string
          insights_created?: number | null
          metrics_analyzed?: number | null
          patterns_found?: number | null
          project_id: string
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          contradictions_found?: number | null
          created_at?: string
          created_by?: string
          error_message?: string | null
          gaps_found?: number | null
          id?: string
          insights_created?: number | null
          metrics_analyzed?: number | null
          patterns_found?: number | null
          project_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "correlation_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      document_structure: {
        Row: {
          content_preview: string | null
          created_at: string
          end_chunk_id: string | null
          file_id: string
          id: string
          project_id: string
          section_index: number
          section_title: string | null
          section_type: string
          start_chunk_id: string | null
        }
        Insert: {
          content_preview?: string | null
          created_at?: string
          end_chunk_id?: string | null
          file_id: string
          id?: string
          project_id: string
          section_index?: number
          section_title?: string | null
          section_type?: string
          start_chunk_id?: string | null
        }
        Update: {
          content_preview?: string | null
          created_at?: string
          end_chunk_id?: string | null
          file_id?: string
          id?: string
          project_id?: string
          section_index?: number
          section_title?: string | null
          section_type?: string
          start_chunk_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_structure_end_chunk_id_fkey"
            columns: ["end_chunk_id"]
            isOneToOne: false
            referencedRelation: "search_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_structure_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_structure_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_structure_start_chunk_id_fkey"
            columns: ["start_chunk_id"]
            isOneToOne: false
            referencedRelation: "search_chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_aliases: {
        Row: {
          alias: string
          alias_norm: string
          approved: boolean
          approved_at: string | null
          approved_by: string | null
          canonical_name: string
          confidence: number
          created_at: string
          deleted_at: string | null
          embedding: string | null
          entity_type: string
          id: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          source: string
        }
        Insert: {
          alias: string
          alias_norm: string
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          canonical_name: string
          confidence?: number
          created_at?: string
          deleted_at?: string | null
          embedding?: string | null
          entity_type: string
          id?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          source?: string
        }
        Update: {
          alias?: string
          alias_norm?: string
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          canonical_name?: string
          confidence?: number
          created_at?: string
          deleted_at?: string | null
          embedding?: string | null
          entity_type?: string
          id?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          source?: string
        }
        Relationships: []
      }
      experiment_citations: {
        Row: {
          cell_range: string | null
          chunk_id: string | null
          created_at: string
          excerpt: string
          experiment_id: string
          file_id: string
          id: string
          measurement_id: string | null
          page: number | null
          sheet_name: string | null
        }
        Insert: {
          cell_range?: string | null
          chunk_id?: string | null
          created_at?: string
          excerpt: string
          experiment_id: string
          file_id: string
          id?: string
          measurement_id?: string | null
          page?: number | null
          sheet_name?: string | null
        }
        Update: {
          cell_range?: string | null
          chunk_id?: string | null
          created_at?: string
          excerpt?: string
          experiment_id?: string
          file_id?: string
          id?: string
          measurement_id?: string | null
          page?: number | null
          sheet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiment_citations_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "search_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_citations_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "current_best"
            referencedColumns: ["experiment_id"]
          },
          {
            foreignKeyName: "experiment_citations_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_citations_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_citations_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "current_best"
            referencedColumns: ["measurement_id"]
          },
          {
            foreignKeyName: "experiment_citations_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "measurements"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_conditions: {
        Row: {
          created_at: string
          experiment_id: string
          id: string
          key: string
          value: string
        }
        Insert: {
          created_at?: string
          experiment_id: string
          id?: string
          key: string
          value: string
        }
        Update: {
          created_at?: string
          experiment_id?: string
          id?: string
          key?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiment_conditions_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "current_best"
            referencedColumns: ["experiment_id"]
          },
          {
            foreignKeyName: "experiment_conditions_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          created_at: string
          deleted_at: string | null
          doc_date: string | null
          evidence_date: string | null
          expected_outcome: string | null
          extracted_by: string
          extraction_job_id: string | null
          hypothesis: string | null
          id: string
          is_qualitative: boolean
          objective: string | null
          project_id: string
          source_file_id: string
          source_type: string
          summary: string | null
          title: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          doc_date?: string | null
          evidence_date?: string | null
          expected_outcome?: string | null
          extracted_by: string
          extraction_job_id?: string | null
          hypothesis?: string | null
          id?: string
          is_qualitative?: boolean
          objective?: string | null
          project_id: string
          source_file_id: string
          source_type?: string
          summary?: string | null
          title: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          doc_date?: string | null
          evidence_date?: string | null
          expected_outcome?: string | null
          extracted_by?: string
          extraction_job_id?: string | null
          hypothesis?: string | null
          id?: string
          is_qualitative?: boolean
          objective?: string | null
          project_id?: string
          source_file_id?: string
          source_type?: string
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiments_extraction_job_id_fkey"
            columns: ["extraction_job_id"]
            isOneToOne: false
            referencedRelation: "extraction_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiments_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_jobs: {
        Row: {
          completed_at: string | null
          content_fingerprint: string | null
          content_truncated: boolean | null
          created_at: string
          created_by: string
          error_message: string | null
          file_hash: string
          file_id: string
          id: string
          items_extracted: number | null
          parsing_quality: string | null
          project_id: string | null
          sheets_found: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["extraction_status"]
          tokens_used: number | null
        }
        Insert: {
          completed_at?: string | null
          content_fingerprint?: string | null
          content_truncated?: boolean | null
          created_at?: string
          created_by: string
          error_message?: string | null
          file_hash: string
          file_id: string
          id?: string
          items_extracted?: number | null
          parsing_quality?: string | null
          project_id?: string | null
          sheets_found?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["extraction_status"]
          tokens_used?: number | null
        }
        Update: {
          completed_at?: string | null
          content_fingerprint?: string | null
          content_truncated?: boolean | null
          created_at?: string
          created_by?: string
          error_message?: string | null
          file_hash?: string
          file_id?: string
          id?: string
          items_extracted?: number | null
          parsing_quality?: string | null
          project_id?: string | null
          sheets_found?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["extraction_status"]
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "extraction_jobs_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      indexing_jobs: {
        Row: {
          chunks_created: number | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          job_type: string
          priority: number
          project_id: string | null
          retry_count: number | null
          source_id: string | null
          source_type: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          chunks_created?: number | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_type: string
          priority?: number
          project_id?: string | null
          retry_count?: number | null
          source_id?: string | null
          source_type?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          chunks_created?: number | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_type?: string
          priority?: number
          project_id?: string | null
          retry_count?: number | null
          source_id?: string | null
          source_type?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "indexing_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_facts: {
        Row: {
          authoritative: boolean | null
          category: string
          created_at: string
          created_by: string
          description: string | null
          embedding: string | null
          id: string
          key: string
          priority: number | null
          project_id: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          updated_by: string | null
          value: Json
          version: number | null
        }
        Insert: {
          authoritative?: boolean | null
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          embedding?: string | null
          id?: string
          key: string
          priority?: number | null
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          updated_by?: string | null
          value: Json
          version?: number | null
        }
        Update: {
          authoritative?: boolean | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          embedding?: string | null
          id?: string
          key?: string
          priority?: number | null
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_facts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_facts_logs: {
        Row: {
          action: string
          details: Json | null
          fact_id: string
          id: number
          timestamp: string
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          fact_id: string
          id?: number
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          fact_id?: string
          id?: number
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_facts_logs_fact_id_fkey"
            columns: ["fact_id"]
            isOneToOne: false
            referencedRelation: "knowledge_facts"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_facts_versions: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string | null
          fact_id: string
          id: number
          old_title: string
          old_value: Json
          version: number
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          fact_id: string
          id?: number
          old_title: string
          old_value: Json
          version: number
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          fact_id?: string
          id?: number
          old_title?: string
          old_value?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_facts_versions_fact_id_fkey"
            columns: ["fact_id"]
            isOneToOne: false
            referencedRelation: "knowledge_facts"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_items: {
        Row: {
          auto_validated: boolean | null
          auto_validation_reason: string | null
          category: Database["public"]["Enums"]["knowledge_category"]
          confidence: number | null
          content: string
          deleted_at: string | null
          deleted_by: string | null
          evidence: string | null
          evidence_page: number | null
          evidence_verified: boolean | null
          extracted_at: string
          extracted_by: string
          extraction_job_id: string | null
          human_verified: boolean | null
          id: string
          neighbor_chunk_ids: string[] | null
          project_id: string | null
          ref_condition_key: string | null
          ref_experiment_id: string | null
          ref_metric_key: string | null
          related_items: string[] | null
          relationship_type: string | null
          source_chunk_id: string | null
          source_file_id: string | null
          title: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          auto_validated?: boolean | null
          auto_validation_reason?: string | null
          category: Database["public"]["Enums"]["knowledge_category"]
          confidence?: number | null
          content: string
          deleted_at?: string | null
          deleted_by?: string | null
          evidence?: string | null
          evidence_page?: number | null
          evidence_verified?: boolean | null
          extracted_at?: string
          extracted_by: string
          extraction_job_id?: string | null
          human_verified?: boolean | null
          id?: string
          neighbor_chunk_ids?: string[] | null
          project_id?: string | null
          ref_condition_key?: string | null
          ref_experiment_id?: string | null
          ref_metric_key?: string | null
          related_items?: string[] | null
          relationship_type?: string | null
          source_chunk_id?: string | null
          source_file_id?: string | null
          title: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          auto_validated?: boolean | null
          auto_validation_reason?: string | null
          category?: Database["public"]["Enums"]["knowledge_category"]
          confidence?: number | null
          content?: string
          deleted_at?: string | null
          deleted_by?: string | null
          evidence?: string | null
          evidence_page?: number | null
          evidence_verified?: boolean | null
          extracted_at?: string
          extracted_by?: string
          extraction_job_id?: string | null
          human_verified?: boolean | null
          id?: string
          neighbor_chunk_ids?: string[] | null
          project_id?: string | null
          ref_condition_key?: string | null
          ref_experiment_id?: string | null
          ref_metric_key?: string | null
          related_items?: string[] | null
          relationship_type?: string | null
          source_chunk_id?: string | null
          source_file_id?: string | null
          title?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_items_extraction_job_id_fkey"
            columns: ["extraction_job_id"]
            isOneToOne: false
            referencedRelation: "extraction_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_items_ref_experiment_id_fkey"
            columns: ["ref_experiment_id"]
            isOneToOne: false
            referencedRelation: "current_best"
            referencedColumns: ["experiment_id"]
          },
          {
            foreignKeyName: "knowledge_items_ref_experiment_id_fkey"
            columns: ["ref_experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_items_source_chunk_id_fkey"
            columns: ["source_chunk_id"]
            isOneToOne: false
            referencedRelation: "search_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_items_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          cell_addr: string | null
          col_idx: number | null
          confidence: string | null
          created_at: string
          evidence_date: string | null
          experiment_id: string
          header_raw: string | null
          id: string
          method: string | null
          metric: string
          notes: string | null
          raw_metric_name: string | null
          row_idx: number | null
          sheet_name: string | null
          source_excerpt: string
          unit: string
          unit_canonical: string | null
          value: number
          value_canonical: number | null
          value_raw: string | null
        }
        Insert: {
          cell_addr?: string | null
          col_idx?: number | null
          confidence?: string | null
          created_at?: string
          evidence_date?: string | null
          experiment_id: string
          header_raw?: string | null
          id?: string
          method?: string | null
          metric: string
          notes?: string | null
          raw_metric_name?: string | null
          row_idx?: number | null
          sheet_name?: string | null
          source_excerpt: string
          unit: string
          unit_canonical?: string | null
          value: number
          value_canonical?: number | null
          value_raw?: string | null
        }
        Update: {
          cell_addr?: string | null
          col_idx?: number | null
          confidence?: string | null
          created_at?: string
          evidence_date?: string | null
          experiment_id?: string
          header_raw?: string | null
          id?: string
          method?: string | null
          metric?: string
          notes?: string | null
          raw_metric_name?: string | null
          row_idx?: number | null
          sheet_name?: string | null
          source_excerpt?: string
          unit?: string
          unit_canonical?: string | null
          value?: number
          value_canonical?: number | null
          value_raw?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "measurements_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "current_best"
            referencedColumns: ["experiment_id"]
          },
          {
            foreignKeyName: "measurements_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics_catalog: {
        Row: {
          aliases: string[]
          canonical_name: string
          canonical_unit: string | null
          category: string
          conversion_factor: number | null
          created_at: string
          display_name: string
          id: string
          unit: string
          unit_aliases: string[] | null
        }
        Insert: {
          aliases?: string[]
          canonical_name: string
          canonical_unit?: string | null
          category?: string
          conversion_factor?: number | null
          created_at?: string
          display_name: string
          id?: string
          unit: string
          unit_aliases?: string[] | null
        }
        Update: {
          aliases?: string[]
          canonical_name?: string
          canonical_unit?: string | null
          category?: string
          conversion_factor?: number | null
          created_at?: string
          display_name?: string
          id?: string
          unit?: string
          unit_aliases?: string[] | null
        }
        Relationships: []
      }
      migration_logs: {
        Row: {
          context: Json | null
          created_at: string
          id: number
          message: string
          severity: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: number
          message: string
          severity?: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: number
          message?: string
          severity?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string
          full_name: string | null
          id: string
          job_title: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email: string
          full_name?: string | null
          id: string
          job_title?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_board_columns: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_blocked_column: boolean | null
          is_done_column: boolean | null
          name: string
          position: number
          project_id: string
          status_key: string
          wip_limit: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_blocked_column?: boolean | null
          is_done_column?: boolean | null
          name: string
          position?: number
          project_id: string
          status_key: string
          wip_limit?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_blocked_column?: boolean | null
          is_done_column?: boolean | null
          name?: string
          position?: number
          project_id?: string
          status_key?: string
          wip_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_board_columns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_file_versions: {
        Row: {
          created_at: string
          file_id: string
          id: string
          size_bytes: number | null
          storage_path: string
          upload_comment: string | null
          uploaded_by: string
          version_number: number
        }
        Insert: {
          created_at?: string
          file_id: string
          id?: string
          size_bytes?: number | null
          storage_path: string
          upload_comment?: string | null
          uploaded_by: string
          version_number: number
        }
        Update: {
          created_at?: string
          file_id?: string
          id?: string
          size_bytes?: number | null
          storage_path?: string
          upload_comment?: string | null
          uploaded_by?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_file_versions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          content_fingerprint: string | null
          created_at: string
          current_version: number
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: string
          mime_type: string | null
          name: string
          project_id: string | null
          size_bytes: number | null
          storage_path: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          content_fingerprint?: string | null
          created_at?: string
          current_version?: number
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          mime_type?: string | null
          name: string
          project_id?: string | null
          size_bytes?: number | null
          storage_path: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          content_fingerprint?: string | null
          created_at?: string
          current_version?: number
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          project_id?: string | null
          size_bytes?: number | null
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          project_id: string
          role_in_project: Database["public"]["Enums"]["project_role"]
          token_hash: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          project_id: string
          role_in_project?: Database["public"]["Enums"]["project_role"]
          token_hash: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          project_id?: string
          role_in_project?: Database["public"]["Enums"]["project_role"]
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_invites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          project_id: string
          role_in_project: Database["public"]["Enums"]["project_role"]
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          project_id: string
          role_in_project?: Database["public"]["Enums"]["project_role"]
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          project_id?: string
          role_in_project?: Database["public"]["Enums"]["project_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          objectives: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          objectives?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          objectives?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: []
      }
      rag_logs: {
        Row: {
          chunks_count: number | null
          chunks_used: string[] | null
          citation_coverage: number | null
          complexity_tier: string | null
          contradiction_flag: boolean | null
          created_at: string | null
          diagnostics: Json | null
          groundedness_score: number | null
          id: string
          latency_ms: number | null
          model_escalated: boolean | null
          model_used: string | null
          query: string
          query_embedding: string | null
          request_id: string | null
          response_summary: string | null
          tokens_input: number | null
          tokens_output: number | null
          user_id: string
        }
        Insert: {
          chunks_count?: number | null
          chunks_used?: string[] | null
          citation_coverage?: number | null
          complexity_tier?: string | null
          contradiction_flag?: boolean | null
          created_at?: string | null
          diagnostics?: Json | null
          groundedness_score?: number | null
          id?: string
          latency_ms?: number | null
          model_escalated?: boolean | null
          model_used?: string | null
          query: string
          query_embedding?: string | null
          request_id?: string | null
          response_summary?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          user_id: string
        }
        Update: {
          chunks_count?: number | null
          chunks_used?: string[] | null
          citation_coverage?: number | null
          complexity_tier?: string | null
          contradiction_flag?: boolean | null
          created_at?: string | null
          diagnostics?: Json | null
          groundedness_score?: number | null
          id?: string
          latency_ms?: number | null
          model_escalated?: boolean | null
          model_used?: string | null
          query?: string
          query_embedding?: string | null
          request_id?: string | null
          response_summary?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string
        }
        Relationships: []
      }
      report_attachments: {
        Row: {
          added_at: string
          added_by: string
          file_id: string
          id: string
          report_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          file_id: string
          id?: string
          report_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          file_id?: string
          id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_attachments_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_attachments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_versions: {
        Row: {
          content: string | null
          id: string
          is_autosave: boolean
          report_id: string
          saved_at: string
          saved_by: string
          summary: string | null
          title: string
          version_number: number
        }
        Insert: {
          content?: string | null
          id?: string
          is_autosave?: boolean
          report_id: string
          saved_at?: string
          saved_by: string
          summary?: string | null
          title: string
          version_number?: number
        }
        Update: {
          content?: string | null
          id?: string
          is_autosave?: boolean
          report_id?: string
          saved_at?: string
          saved_by?: string
          summary?: string | null
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_versions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          ai_model_used: string | null
          approved_at: string | null
          approved_by: string | null
          archived_at: string | null
          archived_by: string | null
          content: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          generated_by_ai: boolean | null
          id: string
          project_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_insights_count: number | null
          status: Database["public"]["Enums"]["report_status"]
          submitted_at: string | null
          submitted_by: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_model_used?: string | null
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          archived_by?: string | null
          content?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          generated_by_ai?: boolean | null
          id?: string
          project_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_insights_count?: number | null
          status?: Database["public"]["Enums"]["report_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_model_used?: string | null
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          archived_by?: string | null
          content?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          generated_by_ai?: boolean | null
          id?: string
          project_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_insights_count?: number | null
          status?: Database["public"]["Enums"]["report_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      search_chunks: {
        Row: {
          chunk_hash: string
          chunk_index: number
          chunk_text: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json
          project_id: string | null
          source_id: string
          source_type: string
          tsv: unknown
        }
        Insert: {
          chunk_hash: string
          chunk_index?: number
          chunk_text: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json
          project_id?: string | null
          source_id: string
          source_type: string
          tsv?: unknown
        }
        Update: {
          chunk_hash?: string
          chunk_index?: number
          chunk_text?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json
          project_id?: string | null
          source_id?: string
          source_type?: string
          tsv?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "search_chunks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      task_activity_log: {
        Row: {
          action: string
          created_at: string
          field_changed: string | null
          id: string
          new_value: string | null
          old_value: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          task_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          blocked_reason: string | null
          checklist: Json | null
          column_id: string | null
          column_order: number | null
          completed_at: string | null
          conclusion: string | null
          created_at: string
          created_by: string
          decision: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          due_date: string | null
          external_links: string[] | null
          hypothesis: string | null
          id: string
          partial_results: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          procedure: string | null
          project_id: string
          status: Database["public"]["Enums"]["task_status"]
          success_criteria: string | null
          tags: string[] | null
          target_metrics: string[] | null
          title: string
          updated_at: string
          variables_changed: string[] | null
        }
        Insert: {
          assigned_to?: string | null
          blocked_reason?: string | null
          checklist?: Json | null
          column_id?: string | null
          column_order?: number | null
          completed_at?: string | null
          conclusion?: string | null
          created_at?: string
          created_by: string
          decision?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          due_date?: string | null
          external_links?: string[] | null
          hypothesis?: string | null
          id?: string
          partial_results?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          procedure?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["task_status"]
          success_criteria?: string | null
          tags?: string[] | null
          target_metrics?: string[] | null
          title: string
          updated_at?: string
          variables_changed?: string[] | null
        }
        Update: {
          assigned_to?: string | null
          blocked_reason?: string | null
          checklist?: Json | null
          column_id?: string | null
          column_order?: number | null
          completed_at?: string | null
          conclusion?: string | null
          created_at?: string
          created_by?: string
          decision?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          due_date?: string | null
          external_links?: string[] | null
          hypothesis?: string | null
          id?: string
          partial_results?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          procedure?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          success_criteria?: string | null
          tags?: string[] | null
          target_metrics?: string[] | null
          title?: string
          updated_at?: string
          variables_changed?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "project_board_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      condition_metric_summary: {
        Row: {
          avg_value: number | null
          condition_key: string | null
          condition_value: string | null
          max_value: number | null
          median_value: number | null
          metric: string | null
          min_value: number | null
          n: number | null
          project_id: string | null
          stddev_value: number | null
          unit: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      current_best: {
        Row: {
          confidence: string | null
          doc_id: string | null
          evidence_date: string | null
          excerpt: string | null
          experiment_id: string | null
          experiment_title: string | null
          measurement_id: string | null
          metric_key: string | null
          project_id: string | null
          raw_metric_name: string | null
          unit: string | null
          unit_canonical: string | null
          value: number | null
          value_canonical: number | null
        }
        Relationships: [
          {
            foreignKeyName: "experiments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiments_source_file_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_metric_summary: {
        Row: {
          avg_confidence: number | null
          avg_value: number | null
          experiment_id: string | null
          experiment_title: string | null
          max_value: number | null
          median_value: number | null
          method: string | null
          metric: string | null
          min_value: number | null
          n: number | null
          project_id: string | null
          raw_metric_name: string | null
          source_file_id: string | null
          stddev_value: number | null
          unit: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiments_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurements_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "current_best"
            referencedColumns: ["experiment_id"]
          },
          {
            foreignKeyName: "measurements_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_and_supersede_claims: {
        Args: {
          p_metric_key: string
          p_new_evidence_date: string
          p_new_measurement_id: string
          p_new_value_canonical: number
          p_project_id: string
        }
        Returns: number
      }
      create_default_board_columns: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      get_project_role: {
        Args: { _project_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["project_role"]
      }
      global_search:
        | {
            Args: { search_query: string }
            Returns: {
              project_id: string
              project_name: string
              relevance: number
              result_id: string
              result_type: string
              subtitle: string
              title: string
            }[]
          }
        | {
            Args: { p_user_id: string; search_query: string }
            Returns: {
              id: string
              project_id: string
              project_name: string
              relevance: number
              subtitle: string
              title: string
              type: string
            }[]
          }
      has_project_role: {
        Args: {
          _min_role: Database["public"]["Enums"]["project_role"]
          _project_id: string
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      search_chunks_hybrid: {
        Args: {
          p_fts_weight?: number
          p_limit?: number
          p_project_ids: string[]
          p_query_embedding: string
          p_query_text: string
          p_semantic_weight?: number
        }
        Returns: {
          chunk_id: string
          chunk_index: number
          chunk_text: string
          metadata: Json
          project_id: string
          project_name: string
          score_final: number
          score_fts: number
          score_semantic: number
          source_id: string
          source_title: string
          source_type: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "user"
      extraction_status: "pending" | "processing" | "completed" | "failed"
      knowledge_category:
        | "compound"
        | "parameter"
        | "result"
        | "method"
        | "observation"
        | "finding"
        | "correlation"
        | "anomaly"
        | "benchmark"
        | "recommendation"
        | "cross_reference"
        | "pattern"
        | "contradiction"
        | "gap"
      project_role: "owner" | "manager" | "researcher" | "viewer"
      project_status:
        | "planning"
        | "in_progress"
        | "review"
        | "completed"
        | "archived"
      report_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "archived"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status:
        | "todo"
        | "in_progress"
        | "review"
        | "done"
        | "backlog"
        | "blocked"
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
      app_role: ["admin", "user"],
      extraction_status: ["pending", "processing", "completed", "failed"],
      knowledge_category: [
        "compound",
        "parameter",
        "result",
        "method",
        "observation",
        "finding",
        "correlation",
        "anomaly",
        "benchmark",
        "recommendation",
        "cross_reference",
        "pattern",
        "contradiction",
        "gap",
      ],
      project_role: ["owner", "manager", "researcher", "viewer"],
      project_status: [
        "planning",
        "in_progress",
        "review",
        "completed",
        "archived",
      ],
      report_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "archived",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: [
        "todo",
        "in_progress",
        "review",
        "done",
        "backlog",
        "blocked",
      ],
    },
  },
} as const
