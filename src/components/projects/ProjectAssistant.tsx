import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Loader2,
  Bot,
  Sparkles,
  MessageSquare,
  Trash2,
  FolderOpen,
  FileSearch,
} from 'lucide-react';
import { useAssistantChat } from '@/hooks/useAssistantChat';
import { ChatMessage } from '@/components/assistant/ChatMessage';
import { AnalyzeFilePicker } from '@/components/assistant/AnalyzeFilePicker';
import { cn } from '@/lib/utils';

interface ProjectAssistantProps {
  projectId: string;
  projectName: string;
}

export function ProjectAssistant({ projectId, projectName }: ProjectAssistantProps) {
  const { messages, isLoading, sendMessage, clearMessages, analyzeDocument } = useAssistantChat({ projectId });
  const [input, setInput] = useState('');
  const [showFilePicker, setShowFilePicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Dynamic suggested questions based on project context
  const suggestedQuestions = [
    `Quais insights foram extraídos do projeto ${projectName}?`,
    'Resuma os principais resultados encontrados',
    'Quais materiais foram testados neste projeto?',
    'Quais lacunas de conhecimento foram identificadas?',
  ];


  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleSuggestionClick = (question: string) => {
    sendMessage(question);
  };


  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden bg-background">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Assistente IA</h3>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Projeto
                </Badge>
                <Badge variant="outline" className="bg-primary/10 text-xs">
                  <FolderOpen className="h-3 w-3 mr-1" />
                  {projectName}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Contexto profundo — prioriza este projeto
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {hasMessages && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMessages}
                className="h-8 gap-1 text-xs"
              >
                <Trash2 className="h-3 w-3" />
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilePicker(true)}
              className="h-8 gap-1 text-xs"
              disabled={isLoading}
            >
              <FileSearch className="h-3 w-3" />
              Analisar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSources(!showSources)}
              className="h-8 gap-1 text-xs"
            >
              {showSources ? (
                <PanelRightClose className="h-3 w-3" />
              ) : (
                <PanelRightOpen className="h-3 w-3" />
              )}
              Fontes
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="p-4 space-y-4">
            {!hasMessages ? (
              // Empty State
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-center mb-1">
                  Pergunte sobre o projeto
                </h3>
                <p className="text-muted-foreground text-center text-sm max-w-md mb-6">
                  Faça perguntas sobre os documentos e insights específicos deste projeto.
                </p>

                <div className="w-full space-y-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Sugestões:
                  </p>
                  <div className="grid gap-2">
                    {suggestedQuestions.map((question, i) => (
                      <Card
                        key={i}
                        className="p-2 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleSuggestionClick(question)}
                      >
                        <p className="text-xs">{question}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Messages List
              <>
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onSourceClick={handleSourceClick}
                  />
                ))}
                {isLoading && (
                  <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">Assistente IA</span>
                        <Badge variant="secondary" className="text-xs">
                          Analisando...
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.3s]" />
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.15s]" />
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t bg-muted/30 p-3">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua pergunta..."
                disabled={isLoading}
                className="flex-1 h-9 text-sm"
              />
              <Button type="submit" disabled={isLoading || !input.trim()} size="sm" className="h-9">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Sources Panel */}
      {showSources && (
        <div className="w-72 border-l hidden md:block">
          <SourcesPanel
            sources={allSources}
            highlightedCitation={highlightedCitation}
            onClose={() => setShowSources(false)}
            projectContext={projectName}
          />
        </div>
      )}

      {/* Analyze File Picker */}
      <AnalyzeFilePicker
        open={showFilePicker}
        onClose={() => setShowFilePicker(false)}
        onSelect={(fileId, fileName, fileProjectId) => analyzeDocument(fileId, fileName, fileProjectId)}
        projectId={projectId}
      />
    </div>
  );
}
