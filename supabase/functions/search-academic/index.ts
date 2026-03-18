import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NormalizedPaper {
  doi: string | null;
  title: string;
  authors: string[];
  abstract: string | null;
  publication_year: number | null;
  journal: string | null;
  citation_count: number;
  source_api: string;
  api_data: Record<string, unknown>;
  pdf_url: string | null;
  open_access: boolean;
}

// --- CrossRef ---
async function searchCrossRef(
  query: string,
  limit: number,
  yearFrom?: number,
  yearTo?: number,
): Promise<NormalizedPaper[]> {
  try {
    const params = new URLSearchParams({
      query,
      rows: String(limit),
    });
    if (yearFrom || yearTo) {
      const from = yearFrom || 1900;
      const to = yearTo || new Date().getFullYear();
      params.set("filter", `from-pub-date:${from},until-pub-date:${to}`);
    }
    const url = `https://api.crossref.org/works?${params.toString()}`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "SmartDentManager/1.0 (mailto:dev@smartdent.app)" },
    });
    if (!resp.ok) throw new Error(`CrossRef ${resp.status}`);
    const data = await resp.json();
    const items = data?.message?.items || [];
    return items.map((item: any) => ({
      doi: item.DOI || null,
      title: Array.isArray(item.title) ? item.title[0] : item.title || "Untitled",
      authors: (item.author || []).map(
        (a: any) => [a.given, a.family].filter(Boolean).join(" "),
      ),
      abstract: item.abstract?.replace(/<[^>]*>/g, "") || null,
      publication_year: item.published?.["date-parts"]?.[0]?.[0] ||
        item["published-print"]?.["date-parts"]?.[0]?.[0] ||
        null,
      journal: Array.isArray(item["container-title"])
        ? item["container-title"][0]
        : item["container-title"] || null,
      citation_count: item["is-referenced-by-count"] || 0,
      source_api: "crossref",
      api_data: { crossref: item },
      pdf_url: item.link?.find((l: any) => l["content-type"] === "application/pdf")?.URL || null,
      open_access: item["is-oa"] === true,
    }));
  } catch (err) {
    console.error("CrossRef error:", err);
    return [];
  }
}

// --- Semantic Scholar ---
async function searchSemanticScholar(
  query: string,
  limit: number,
  yearFrom?: number,
  yearTo?: number,
): Promise<NormalizedPaper[]> {
  try {
    const params = new URLSearchParams({
      query,
      limit: String(limit),
      fields: "title,authors,abstract,year,venue,citationCount,openAccessPdf,externalIds",
    });
    if (yearFrom || yearTo) {
      const from = yearFrom || "";
      const to = yearTo || "";
      params.set("year", `${from}-${to}`);
    }
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?${params.toString()}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Semantic Scholar ${resp.status}`);
    const data = await resp.json();
    const papers = data?.data || [];
    return papers.map((p: any) => ({
      doi: p.externalIds?.DOI || null,
      title: p.title || "Untitled",
      authors: (p.authors || []).map((a: any) => a.name),
      abstract: p.abstract || null,
      publication_year: p.year || null,
      journal: p.venue || null,
      citation_count: p.citationCount || 0,
      source_api: "semantic_scholar",
      api_data: { semantic_scholar: p },
      pdf_url: p.openAccessPdf?.url || null,
      open_access: !!p.openAccessPdf?.url,
    }));
  } catch (err) {
    console.error("Semantic Scholar error:", err);
    return [];
  }
}

// --- OpenAlex ---
async function searchOpenAlex(
  query: string,
  limit: number,
  yearFrom?: number,
  yearTo?: number,
  openAccessOnly?: boolean,
): Promise<NormalizedPaper[]> {
  try {
    const params = new URLSearchParams({
      search: query,
      per_page: String(limit),
    });
    const filters: string[] = [];
    if (yearFrom) filters.push(`from_publication_date:${yearFrom}-01-01`);
    if (yearTo) filters.push(`to_publication_date:${yearTo}-12-31`);
    if (openAccessOnly) filters.push("is_oa:true");
    if (filters.length > 0) params.set("filter", filters.join(","));

    const url = `https://api.openalex.org/works?${params.toString()}`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "SmartDentManager/1.0 (mailto:dev@smartdent.app)" },
    });
    if (!resp.ok) throw new Error(`OpenAlex ${resp.status}`);
    const data = await resp.json();
    const results = data?.results || [];
    return results.map((w: any) => {
      const doi = w.doi?.replace("https://doi.org/", "") || null;
      return {
        doi,
        title: w.title || "Untitled",
        authors: (w.authorships || []).map(
          (a: any) => a.author?.display_name || "Unknown",
        ),
        abstract: w.abstract_inverted_index
          ? reconstructAbstract(w.abstract_inverted_index)
          : null,
        publication_year: w.publication_year || null,
        journal: w.primary_location?.source?.display_name || null,
        citation_count: w.cited_by_count || 0,
        source_api: "openalex",
        api_data: { openalex: w },
        pdf_url: w.best_oa_location?.pdf_url || w.primary_location?.pdf_url || null,
        open_access: w.open_access?.is_oa === true,
      };
    });
  } catch (err) {
    console.error("OpenAlex error:", err);
    return [];
  }
}

function reconstructAbstract(
  invertedIndex: Record<string, number[]>,
): string {
  const words: [number, string][] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words.push([pos, word]);
    }
  }
  words.sort((a, b) => a[0] - b[0]);
  return words.map((w) => w[1]).join(" ");
}

function deduplicateByDoi(papers: NormalizedPaper[]): NormalizedPaper[] {
  const seen = new Map<string, NormalizedPaper>();
  const noDoi: NormalizedPaper[] = [];

  for (const paper of papers) {
    if (paper.doi) {
      const existing = seen.get(paper.doi);
      if (!existing || paper.citation_count > existing.citation_count) {
        seen.set(paper.doi, paper);
      }
    } else {
      noDoi.push(paper);
    }
  }

  return [...seen.values(), ...noDoi];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const {
      query,
      sources = ["crossref", "semantic_scholar", "openalex"],
      limit = 10,
      year_from,
      year_to,
      open_access_only = false,
    } = await req.json();

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Query must be at least 2 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Search APIs in parallel
    const searchPromises: Promise<NormalizedPaper[]>[] = [];
    const sourcesUsed: string[] = [];

    if (sources.includes("crossref")) {
      searchPromises.push(searchCrossRef(query, limit, year_from, year_to));
      sourcesUsed.push("crossref");
    }
    if (sources.includes("semantic_scholar")) {
      searchPromises.push(searchSemanticScholar(query, limit, year_from, year_to));
      sourcesUsed.push("semantic_scholar");
    }
    if (sources.includes("openalex")) {
      searchPromises.push(searchOpenAlex(query, limit, year_from, year_to, open_access_only));
      sourcesUsed.push("openalex");
    }

    const results = await Promise.all(searchPromises);
    let allPapers = results.flat();

    // Filter open access only if requested
    if (open_access_only) {
      allPapers = allPapers.filter((p) => p.open_access);
    }

    // Deduplicate by DOI
    const deduplicated = deduplicateByDoi(allPapers);

    // Sort by citation count descending
    deduplicated.sort((a, b) => b.citation_count - a.citation_count);

    // Limit results
    const finalPapers = deduplicated.slice(0, limit);

    // Upsert papers into academic_papers table and collect DB records with IDs
    const savedPapers: any[] = [];
    for (const paper of finalPapers) {
      if (paper.doi) {
        const { data: upsertedData, error: upsertError } = await supabase
          .from("academic_papers")
          .upsert(
            {
              doi: paper.doi,
              title: paper.title,
              authors: paper.authors,
              abstract: paper.abstract,
              publication_year: paper.publication_year,
              journal: paper.journal,
              citation_count: paper.citation_count,
              source_api: paper.source_api,
              api_data: paper.api_data,
              pdf_url: paper.pdf_url,
              open_access: paper.open_access,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "doi" },
          )
          .select()
          .single();
        if (upsertError) {
          console.warn("Upsert error for DOI", paper.doi, upsertError.message);
        } else if (upsertedData) {
          savedPapers.push(upsertedData);
        }
      } else {
        const { data: insertedData, error: insertError } = await supabase
          .from("academic_papers")
          .insert({
            title: paper.title,
            authors: paper.authors,
            abstract: paper.abstract,
            publication_year: paper.publication_year,
            journal: paper.journal,
            citation_count: paper.citation_count,
            source_api: paper.source_api,
            api_data: paper.api_data,
            pdf_url: paper.pdf_url,
            open_access: paper.open_access,
          })
          .select()
          .single();
        if (insertError) {
          console.warn("Insert error for paper", paper.title, insertError.message);
        } else if (insertedData) {
          savedPapers.push(insertedData);
        }
      }
    }

    // Cache the search
    await supabase.from("academic_searches").insert({
      user_id: user.id,
      query,
      source_apis: sourcesUsed,
      results_count: savedPapers.length,
      cached_results: savedPapers,
    });

    return new Response(
      JSON.stringify({
        papers: savedPapers,
        total_results: savedPapers.length,
        sources_used: sourcesUsed,
        cached: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Academic search error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
