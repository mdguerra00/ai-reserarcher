export interface AcademicPaper {
  id: string;
  doi: string | null;
  title: string;
  authors: string[];
  abstract: string | null;
  publication_year: number | null;
  journal: string | null;
  citation_count: number;
  source_api: string;
  api_data: Record<string, any>;
  pdf_url: string | null;
  open_access: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademicPaperLink {
  id: string;
  paper_id: string;
  research_id: string;
  project_id: string | null;
  linked_by: string | null;
  relevance_score: number | null;
  notes: string | null;
  created_at: string;
  paper?: AcademicPaper;
}

export interface AcademicSearchParams {
  query: string;
  sources?: ('crossref' | 'semantic_scholar' | 'openalex')[];
  limit?: number;
  year_from?: number;
  year_to?: number;
  open_access_only?: boolean;
}

export interface AcademicSearchResult {
  papers: AcademicPaper[];
  total_results: number;
  sources_used: string[];
  cached: boolean;
}
