-- Academic paper searches (cache + audit)
CREATE TABLE IF NOT EXISTS academic_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  source_apis TEXT[] DEFAULT '{}',
  results_count INT DEFAULT 0,
  cached_results JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Academic papers (normalized cache)
CREATE TABLE IF NOT EXISTS academic_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doi TEXT UNIQUE,
  title TEXT NOT NULL,
  authors TEXT[] DEFAULT '{}',
  abstract TEXT,
  publication_year INT,
  journal TEXT,
  citation_count INT DEFAULT 0,
  source_api TEXT NOT NULL, -- 'crossref', 'semantic_scholar', 'openalex'
  api_data JSONB DEFAULT '{}',
  pdf_url TEXT,
  open_access BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Links between papers and researches
CREATE TABLE IF NOT EXISTS academic_paper_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID REFERENCES academic_papers(id) ON DELETE CASCADE,
  research_id UUID REFERENCES researches(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  linked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  relevance_score FLOAT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(paper_id, research_id)
);

-- Indexes
CREATE INDEX idx_academic_searches_user ON academic_searches(user_id);
CREATE INDEX idx_academic_searches_project ON academic_searches(project_id);
CREATE INDEX idx_academic_searches_query ON academic_searches USING gin(to_tsvector('portuguese', query));
CREATE INDEX idx_academic_papers_doi ON academic_papers(doi);
CREATE INDEX idx_academic_papers_title ON academic_papers USING gin(to_tsvector('english', title));
CREATE INDEX idx_academic_papers_year ON academic_papers(publication_year);
CREATE INDEX idx_academic_paper_links_paper ON academic_paper_links(paper_id);
CREATE INDEX idx_academic_paper_links_research ON academic_paper_links(research_id);
CREATE INDEX idx_academic_paper_links_project ON academic_paper_links(project_id);

-- RLS
ALTER TABLE academic_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_paper_links ENABLE ROW LEVEL SECURITY;

-- Policies for academic_searches
CREATE POLICY "Users can view own searches" ON academic_searches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own searches" ON academic_searches FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for academic_papers (readable by all authenticated, insertable by all authenticated)
CREATE POLICY "Authenticated users can view papers" ON academic_papers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert papers" ON academic_papers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update papers" ON academic_papers FOR UPDATE USING (auth.role() = 'authenticated');

-- Policies for academic_paper_links
CREATE POLICY "Users can view links in their projects" ON academic_paper_links FOR SELECT USING (
  linked_by = auth.uid() OR
  project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert links" ON academic_paper_links FOR INSERT WITH CHECK (auth.uid() = linked_by);
CREATE POLICY "Users can delete own links" ON academic_paper_links FOR DELETE USING (auth.uid() = linked_by);
