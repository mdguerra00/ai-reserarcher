import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Send,
  Loader2,
  Bot,
  Sparkles,
  MessageSquare,
  PanelLeftOpen,
  PanelLeftClose,
  FileSearch,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAssistantChat } from '@/hooks/useAssistantChat';
import { ChatMessage } from '@/components/assistant/ChatMessage';
import { ConversationList } from '@/components/assistant/ConversationList';
import { AnalyzeFilePicker } from '@/components/assistant/AnalyzeFilePicker';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const suggestedQuestions = [
  'Qual a resistência média dos materiais testados?',
  'Quais foram os principais resultados obtidos?',
  'Resuma os insights mais importantes dos projetos',
  'Quais materiais apresentaram melhor desempenho?',
];

export default function Assistant() {
  const {
    messages,
    isLoading,
    sendMessage,
    startNewConversation,
    conversationId,
    conversations,
    loadingConversations,
    loadConversation,
    renameConversation,
    deleteConversation,
    analyzeDocument,
  } = useAssistantChat();

  const [input, setInput] = useState('');
  const [showSources, setShowSources] = useState(false);
  const [showConversations, setShowConversations] = useState(true);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [highlightedCitation, setHighlightedCitation] = useState<string>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allSources = messages
    .filter(m => m.role === 'assistant' && m.sources)
    .flatMap(m => m.sources || [])
    .filter((source, index, self) =>
      index === self.findIndex(s => s.citation === source.citation)
    );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-show sources when they appear
  useEffect(() => {
    if (allSources.length > 0 && !showSources) {
      setShowSources(true);
    }
  }, [allSources.length]);

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

  const handleSourceClick = (citation: string) => {
    setHighlightedCitation(citation);
    setShowSources(true);
    setTimeout(() => setHighlightedCitation(undefined), 2000);
  };

  const getUserQuestionBefore = (index: number): string | undefined => {
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i].content;
    }
    return undefined;
  };

  const hasMessages = messages.length > 0;
  const currentConversation = conversations.find(c => c.id === conversationId);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Conversation Sidebar */}
      {showConversations && (
        <div className="w-60 border-r hidden md:flex flex-col shrink-0">
          <ConversationList
            conversations={conversations}
            activeConversationId={conversationId}
            loading={loadingConversations}
            onSelect={loadConversation}
            onNew={startNewConversation}
            onRename={renameConversation}
            onDelete={deleteConversation}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Compact Header */}
        <div className="flex items-center h-12 px-3 border-b bg-background shrink-0">
          {/* Left: toggle + title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:inline-flex h-7 w-7 shrink-0"
                  onClick={() => setShowConversations(!showConversations)}
                >
                  {showConversations ? (
                    <PanelLeftClose className="h-3.5 w-3.5" />
                  ) : (
                    <PanelLeftOpen className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {showConversations ? 'Ocultar conversas' : 'Mostrar conversas'}
              </TooltipContent>
            </Tooltip>

            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary shrink-0">
              <Bot className="h-3.5 w-3.5 text-primary-foreground" />
            </div>

            <span className="text-sm font-medium truncate">
              {currentConversation?.title || 'Nova Conversa'}
            </span>

            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px] gap-1 shrink-0 hidden sm:flex">
              <span className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
              Global
            </Badge>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={startNewConversation}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Nova conversa</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowFilePicker(true)}
                  disabled={isLoading}
                >
                  <FileSearch className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Analisar documento</TooltipContent>
            </Tooltip>

            {conversationId && (
              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Excluir conversa</TooltipContent>
                </Tooltip>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Todas as mensagens desta conversa serão removidas permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteConversation(conversationId)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Separator orientation="vertical" className="h-4 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showSources ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowSources(!showSources)}
                >
                  {showSources ? (
                    <PanelRightClose className="h-3.5 w-3.5" />
                  ) : (
                    <PanelRightOpen className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {showSources ? 'Ocultar fontes' : 'Mostrar fontes'}
                {allSources.length > 0 && ` (${allSources.length})`}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
            {!hasMessages ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-5">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-center mb-1">
                  Olá! Como posso ajudar?
                </h2>
                <p className="text-muted-foreground text-center text-sm max-w-md mb-8">
                  Pergunte sobre seus documentos, insights e projetos em linguagem natural.
                </p>

                <div className="w-full max-w-lg space-y-3">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Sugestões:
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {suggestedQuestions.map((question, i) => (
                      <Card
                        key={i}
                        className="p-3 cursor-pointer hover:bg-accent transition-colors text-sm"
                        onClick={() => handleSuggestionClick(question)}
                      >
                        {question}
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onSourceClick={handleSourceClick}
                    userQuestion={
                      message.role === 'assistant'
                        ? getUserQuestionBefore(index)
                        : undefined
                    }
                  />
                ))}
                {isLoading && (
                  <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-medium text-muted-foreground">Analisando...</span>
                      <div className="flex gap-1 mt-1">
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
        <div className="border-t bg-background p-3">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua pergunta..."
                disabled={isLoading}
                className="flex-1 h-9 text-sm"
              />
              <Button type="submit" disabled={isLoading || !input.trim()} size="sm" className="h-9 px-3">
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
        <div className="w-72 border-l hidden lg:flex flex-col shrink-0">
          <SourcesPanel
            sources={allSources}
            highlightedCitation={highlightedCitation}
            onClose={() => setShowSources(false)}
          />
        </div>
      )}

      {/* Analyze File Picker */}
      <AnalyzeFilePicker
        open={showFilePicker}
        onClose={() => setShowFilePicker(false)}
        onSelect={(fileId, fileName, projectId) => analyzeDocument(fileId, fileName, projectId)}
      />
    </div>
  );
}
