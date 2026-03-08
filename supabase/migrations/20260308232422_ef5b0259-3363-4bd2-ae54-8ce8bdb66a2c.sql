
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.product_lifecycle_status AS ENUM ('development', 'active', 'discontinued', 'obsolete');
CREATE TYPE public.research_status AS ENUM ('draft', 'in_progress', 'concluded', 'promoted');
CREATE TYPE public.knowledge_destination AS ENUM ('archived', 'continue_research', 'escalate_product_dev', 'escalate_product_change', 'escalate_capa', 'escalate_process_change');
CREATE TYPE public.product_dev_status AS ENUM ('planning', 'design_input', 'design_output', 'verification', 'validation', 'transfer', 'released', 'cancelled');
CREATE TYPE public.product_change_status AS ENUM ('draft', 'under_review', 'approved', 'implemented', 'rejected');
CREATE TYPE public.change_origin AS ENUM ('research', 'capa', 'complaint', 'supplier', 'process', 'regulatory', 'other');
CREATE TYPE public.timeline_event_type AS ENUM ('creation', 'research_linked', 'development_milestone', 'change_approved', 'change_implemented', 'document_updated', 'risk_reviewed', 'version_released');

-- ============================================================
-- TABLE: products
-- ============================================================
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  family TEXT,
  intended_use TEXT,
  regulatory_status TEXT DEFAULT 'pending',
  lifecycle_status public.product_lifecycle_status NOT NULL DEFAULT 'development',
  current_version TEXT DEFAULT '1.0',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view products" ON public.products
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Authenticated can create products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can update products" ON public.products
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all products" ON public.products
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TABLE: researches
-- ============================================================
CREATE TABLE public.researches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  objective TEXT,
  hypothesis TEXT,
  motivation TEXT,
  responsible_id UUID,
  method TEXT,
  results TEXT,
  conclusions TEXT,
  learnings TEXT,
  keywords TEXT[] DEFAULT '{}',
  future_application TEXT,
  knowledge_destination public.knowledge_destination,
  status public.research_status NOT NULL DEFAULT 'draft',
  linked_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.researches ENABLE ROW LEVEL SECURITY;

-- Members of the linked project can view
CREATE POLICY "Members can view project researches" ON public.researches
  FOR SELECT TO authenticated USING (deleted_at IS NULL AND project_id IS NOT NULL AND is_project_member(auth.uid(), project_id));

-- Global researches (no project) visible to creator
CREATE POLICY "Creator can view own researches" ON public.researches
  FOR SELECT TO authenticated USING (deleted_at IS NULL AND created_by = auth.uid());

-- Admins can view all
CREATE POLICY "Admins can view all researches" ON public.researches
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Researchers in project can create
CREATE POLICY "Researchers can create researches" ON public.researches
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = created_by AND (
      project_id IS NULL OR has_project_role(auth.uid(), project_id, 'researcher'::project_role)
    )
  );

-- Researchers in project can update
CREATE POLICY "Researchers can update researches" ON public.researches
  FOR UPDATE TO authenticated USING (
    project_id IS NULL AND created_by = auth.uid()
    OR project_id IS NOT NULL AND has_project_role(auth.uid(), project_id, 'researcher'::project_role)
  );

-- Managers can delete
CREATE POLICY "Managers can delete researches" ON public.researches
  FOR DELETE TO authenticated USING (
    project_id IS NULL AND created_by = auth.uid()
    OR project_id IS NOT NULL AND has_project_role(auth.uid(), project_id, 'manager'::project_role)
  );

CREATE TRIGGER update_researches_updated_at BEFORE UPDATE ON public.researches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TABLE: product_developments
-- ============================================================
CREATE TABLE public.product_developments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  code TEXT,
  intended_use TEXT,
  design_inputs TEXT,
  design_outputs TEXT,
  risk_summary TEXT,
  verification_status TEXT DEFAULT 'pending',
  validation_status TEXT DEFAULT 'pending',
  transfer_status TEXT DEFAULT 'pending',
  regulatory_status TEXT DEFAULT 'pending',
  status public.product_dev_status NOT NULL DEFAULT 'planning',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.product_developments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view product developments" ON public.product_developments
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Authenticated can create product developments" ON public.product_developments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator or project researcher can update" ON public.product_developments
  FOR UPDATE TO authenticated USING (
    auth.uid() = created_by
    OR (project_id IS NOT NULL AND has_project_role(auth.uid(), project_id, 'researcher'::project_role))
  );

CREATE POLICY "Admins can manage all product developments" ON public.product_developments
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_product_developments_updated_at BEFORE UPDATE ON public.product_developments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TABLE: product_changes
-- ============================================================
CREATE TABLE public.product_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  version_from TEXT,
  version_to TEXT,
  description TEXT NOT NULL,
  reason TEXT,
  origin public.change_origin DEFAULT 'other',
  technical_impact TEXT,
  regulatory_impact TEXT,
  risk_impact TEXT,
  process_impact TEXT,
  needs_verification BOOLEAN DEFAULT false,
  needs_validation BOOLEAN DEFAULT false,
  affected_documents TEXT[] DEFAULT '{}',
  implementation_date DATE,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  status public.product_change_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.product_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view product changes" ON public.product_changes
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Authenticated can create product changes" ON public.product_changes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator or project researcher can update changes" ON public.product_changes
  FOR UPDATE TO authenticated USING (
    auth.uid() = created_by
    OR (project_id IS NOT NULL AND has_project_role(auth.uid(), project_id, 'researcher'::project_role))
  );

CREATE POLICY "Admins can manage all product changes" ON public.product_changes
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_product_changes_updated_at BEFORE UPDATE ON public.product_changes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TABLE: product_timeline_events
-- ============================================================
CREATE TABLE public.product_timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  event_type public.timeline_event_type NOT NULL DEFAULT 'creation',
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_type TEXT,
  source_id UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view timeline events" ON public.product_timeline_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can create timeline events" ON public.product_timeline_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all timeline events" ON public.product_timeline_events
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- TABLE: research_links
-- ============================================================
CREATE TABLE public.research_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  research_id UUID NOT NULL REFERENCES public.researches(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  link_type TEXT NOT NULL DEFAULT 'related',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.research_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view research links" ON public.research_links
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can create research links" ON public.research_links
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can delete research links" ON public.research_links
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all research links" ON public.research_links
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
