import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ChatSource {
  citation: string;
  type: string;
  id: string;
  title: string;
  project: string;
  excerpt: string;
}

export interface DeepReadInfo {
  files_read: { name: string; fileId: string; totalChars: number; filteredChars: number }[];
  total_read_ms: number;
  filter_ms: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  timestamp: Date;
  isError?: boolean;
  analysisFileId?: string;
  analysisProjectId?: string;
  diagnostics?: Record<string, any>;
  deepRead?: DeepReadInfo;
}

export interface Conversation {
  id: string;
  title: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UseAssistantChatOptions {
  projectId?: string;
}

export function useAssistantChat(options?: UseAssistantChatOptions) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load conversation list
  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConversations(true);
    const { data } = await supabase
      .from('assistant_conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(50);
    setConversations((data as Conversation[]) || []);
    setLoadingConversations(false);
  }, [user]);

  // Load messages for a conversation
  const loadConversation = useCallback(async (id: string) => {
    const { data } = await supabase
      .from('assistant_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data.map((m: any) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        sources: m.sources as ChatSource[] | undefined,
        timestamp: new Date(m.created_at),
        isError: m.is_error,
      })));
    }
    setConversationId(id);
  }, []);

  // Create a new conversation
  const createNewConversation = useCallback(async (title?: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('assistant_conversations')
      .insert({
        user_id: user.id,
        title: title || 'Nova conversa',
        project_id: options?.projectId || null,
      })
      .select()
      .single();

    if (data) {
      const conv = data as Conversation;
      setConversationId(conv.id);
      setMessages([]);
      setConversations(prev => [conv, ...prev]);
      return conv.id;
    }
    return null;
  }, [user, options?.projectId]);

  // Persist a message to the DB
  const persistMessage = useCallback(async (convId: string, message: ChatMessage) => {
    await supabase.from('assistant_messages').insert({
      conversation_id: convId,
      role: message.role,
      content: message.content,
      sources: message.sources ? (message.sources as any) : null,
      is_error: message.isError || false,
    });
  }, []);

  // Update conversation title & timestamp
  const updateConversationTitle = useCallback(async (convId: string, title: string) => {
    await supabase
      .from('assistant_conversations')
      .update({ title })
      .eq('id', convId);
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, title } : c)
    );
  }, []);

  // Rename conversation
  const renameConversation = useCallback(async (convId: string, newTitle: string) => {
    await updateConversationTitle(convId, newTitle);
  }, [updateConversationTitle]);

  // Delete conversation
  const deleteConversation = useCallback(async (convId: string) => {
    await supabase.from('assistant_conversations').delete().eq('id', convId);
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (conversationId === convId) {
      setConversationId(null);
      setMessages([]);
    }
  }, [conversationId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);

    // Ensure we have a conversation
    let activeConvId = conversationId;
    if (!activeConvId) {
      // Generate title from first message (first 50 chars)
      const title = content.trim().substring(0, 50) + (content.trim().length > 50 ? '...' : '');
      isNewConversationRef.current = false;
      activeConvId = await createNewConversation(title);
      if (!activeConvId) return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    await persistMessage(activeConvId, userMessage);

    // Start loading
    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Você precisa estar autenticado para usar o assistente.');
      }

      // Build conversation history for context
      const currentMessages = [...messages, userMessage];
      const historyMessages = currentMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const contextMode = options?.projectId ? 'project' : 'global';
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-answer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            query: content.trim(),
            project_ids: options?.projectId ? [options.projectId] : undefined,
            context_mode: contextMode,
            conversation_history: historyMessages,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ao processar sua pergunta (${response.status})`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || 'Desculpe, não consegui gerar uma resposta.',
        sources: data.sources || [],
        timestamp: new Date(),
        diagnostics: data._diagnostics || undefined,
        deepRead: data._deep_read || undefined,
      };

      if (data._diagnostics) {
        console.log('[RAG Diagnostics]', data._diagnostics.request_id, JSON.stringify(data._diagnostics, null, 2));
      }
      setMessages(prev => [...prev, assistantMessage]);
      await persistMessage(activeConvId, assistantMessage);

      // Update conversation timestamp
      await supabase
        .from('assistant_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeConvId);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;

      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);

      const errorChatMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Desculpe, ocorreu um erro: ${errorMessage}`,
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorChatMessage]);
      await persistMessage(activeConvId, errorChatMessage);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [isLoading, options?.projectId, conversationId, createNewConversation, persistMessage, messages]);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  // Track if user explicitly started a new conversation
  const isNewConversationRef = useRef(false);

  // Start a fresh conversation (new button)
  const startNewConversation = useCallback(() => {
    isNewConversationRef.current = true;
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load most recent conversation on mount (but not if user clicked "new")
  useEffect(() => {
    if (conversations.length > 0 && !conversationId && messages.length === 0 && !isNewConversationRef.current) {
      loadConversation(conversations[0].id);
    }
  }, [conversations, conversationId, messages.length, loadConversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const analyzeDocument = useCallback(async (fileId: string, fileName: string, fileProjectId?: string) => {
    if (isLoading) return;

    setError(null);

    // Ensure we have a conversation
    let activeConvId = conversationId;
    if (!activeConvId) {
      const title = `Análise: ${fileName.substring(0, 40)}`;
      isNewConversationRef.current = false;
      activeConvId = await createNewConversation(title);
      if (!activeConvId) return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `📄 Analise profundamente o documento: **${fileName}**`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    await persistMessage(activeConvId, userMessage);

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Você precisa estar autenticado.');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-document`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ file_id: fileId }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ao analisar documento (${response.status})`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || 'Erro ao gerar análise.',
        sources: data.sources || [],
        timestamp: new Date(),
        analysisFileId: fileId,
        analysisProjectId: fileProjectId || options?.projectId,
      };
      setMessages(prev => [...prev, assistantMessage]);
      await persistMessage(activeConvId, assistantMessage);

      await supabase
        .from('assistant_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeConvId);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);

      const errorChatMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Desculpe, ocorreu um erro: ${errorMessage}`,
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorChatMessage]);
      await persistMessage(activeConvId, errorChatMessage);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [isLoading, conversationId, createNewConversation, persistMessage]);

  return {
    messages,
    isLoading,
    error,
    conversationId,
    conversations,
    loadingConversations,
    sendMessage,
    cancelRequest,
    clearMessages,
    startNewConversation,
    loadConversation,
    renameConversation,
    deleteConversation,
    loadConversations,
    analyzeDocument,
  };
}
