import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Bot, User, AlertCircle, Lightbulb, DatabaseZap, Loader2, Check, ExternalLink, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/hooks/useAssistantChat';
import { SaveInsightModal } from './SaveInsightModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ChatMessageProps {
  message: ChatMessageType;
  onSourceClick?: (citation: string) => void; // kept for backward compat but unused
  userQuestion?: string;
}

function getSourceRoute(source: { type?: string; id?: string }): string | null {
  const t = source.type?.toLowerCase() || '';
  if (t.includes('task')) return '/tasks';
  if (t.includes('report')) return '/reports';
  if (t.includes('knowledge') || t.includes('insight')) return '/knowledge';
  if (t.includes('file') || t.includes('excel')) return '/files';
  if (t.includes('experiment') || t.includes('measurement')) return '/knowledge';
  return null;
}

export function ChatMessage({ message, userQuestion }: ChatMessageProps) {
  const navigate = useNavigate();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savingInsights, setSavingInsights] = useState(false);
  const [insightsSaved, setInsightsSaved] = useState<number | null>(null);
  const isUser = message.role === 'user';
  const isError = message.isError;
  const isAnalysis = !!message.analysisFileId;

  const handleSaveAnalysisInsights = async () => {
    if (!message.analysisFileId || !message.analysisProjectId) return;
    setSavingInsights(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Não autenticado');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-analysis-insights`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            analysis_text: message.content,
            file_id: message.analysisFileId,
            project_id: message.analysisProjectId,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar insights');

      setInsightsSaved(data.insights_saved || 0);
      toast({
        title: `${data.insights_saved} insights salvos!`,
        description: 'Os conhecimentos foram adicionados à Base de Conhecimento.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar insights',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSavingInsights(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          'flex gap-3 p-4 rounded-lg group',
          isUser 
            ? 'bg-muted/50' 
            : isError 
              ? 'bg-destructive/10 border border-destructive/20'
              : 'bg-background'
        )}
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback 
            className={cn(
              isUser 
                ? 'bg-primary text-primary-foreground' 
                : isError
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-secondary text-secondary-foreground'
            )}
          >
            {isUser ? (
              <User className="h-4 w-4" />
            ) : isError ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {isUser ? 'Você' : 'Assistente IA'}
            </span>
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            {/* Save insight button for assistant messages */}
            {!isUser && !isError && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setShowSaveModal(true)}
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Salvar na Base de Conhecimento</TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => {
                  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">{children}</a>;
                },
                p: ({ children }) => <p>{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-foreground">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>,
                code: ({ children }) => (
                  <code className="bg-muted px-1 py-0.5 rounded text-sm">{children}</code>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3 rounded-lg border border-border">
                    <table className="min-w-full text-xs">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-muted/70 border-b border-border">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
                tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors">{children}</tr>,
                th: ({ children }) => (
                  <th className="px-3 py-2 text-left font-semibold text-foreground text-xs whitespace-nowrap">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 text-foreground text-xs align-top">
                    {children}
                  </td>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {message.sources && message.sources.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              <span className="text-xs text-muted-foreground">Fontes:</span>
              {message.sources.map((source) => {
                const route = getSourceRoute(source);
                return (
                  <Badge
                    key={source.citation}
                    variant="outline"
                    className={cn(
                      "text-xs gap-1",
                      route ? "cursor-pointer hover:bg-accent" : ""
                    )}
                    onClick={() => route && navigate(route)}
                  >
                    [{source.citation}] {source.title}
                    {route && <ExternalLink className="h-2.5 w-2.5" />}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Inject insights button for analysis messages */}
          {isAnalysis && !isError && (
            <div className="pt-3 border-t border-border/50">
              {insightsSaved !== null ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{insightsSaved} insights salvos na Base de Conhecimento</span>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleSaveAnalysisInsights}
                  disabled={savingInsights}
                >
                  {savingInsights ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <DatabaseZap className="h-4 w-4" />
                  )}
                  {savingInsights ? 'Extraindo e salvando...' : 'Injetar na Base de Conhecimento'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <SaveInsightModal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        messageContent={message.content}
        userQuestion={userQuestion}
      />
    </>
  );
}
