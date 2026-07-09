import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, Loader2, FileText, Send, X, MessageSquare, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';

import { PageTransition } from '../components/layout';
import { Card, Button, Badge } from '../components/common';
import { queryRAG } from '../services';

const SUGGESTED_QUESTIONS = [
  "What is the refund policy?",
  "Can medicines be exchanged?",
  "When should orders be escalated?",
  "How are prescriptions verified?",
  "What are cold-chain medicines?",
  "What is the storage instruction for Panadol?",
  "Who handles customer complaints?"
];

const INDEXED_DOCUMENTS = [
  "Medicine Catalog.pdf",
  "SOP.pdf",
  "Exchange and Refund Policy.pdf"
];

export default function RAGAssistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (overrideQuestion) => {
    const q = (overrideQuestion || input).trim();
    if (!q || loading) return;

    if (!overrideQuestion) {
      setInput('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }

    // Append user message
    const userMessage = { role: 'user', content: q };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await queryRAG(q);

      // Append bot message with matches and synthesized answer
      const botMessage = {
        role: 'assistant',
        question: q,
        matches: response.matches || [],
        answer: response.answer || '',
        is_error: false
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage = {
        role: 'assistant',
        question: q,
        matches: [],
        summary: err.message || 'Failed to query local vector store.',
        is_error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <PageTransition className="h-full">
      <div className="flex flex-col h-full max-w-5xl mx-auto overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 py-3 px-1 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <BookOpen size={20} className="text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">RAG Knowledge Assistant</h1>
            <p className="text-xs text-text-secondary">Retrieve verified chunks from internal pharmacy documentation locally</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-500 text-xs font-semibold">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            Policy
          </div>
        </div>

        {/* Chat Area — matches the exact layout of AIAssistant */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-border bg-surface/50 p-4 space-y-5 mb-3 min-h-0">

          {/* Empty state */}
          {isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center text-center space-y-6 py-8"
            >
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
                  <BookOpen size={28} className="text-violet-500" />
                </div>
                <h2 className="text-lg font-bold text-text-primary">Search pharmacy policy documents</h2>
                <p className="text-sm text-text-secondary max-w-md mx-auto">
                  I search across local PDFs to retrieve verified chunks.
                  Ask about exchanges, prescription rules, catalog products, or SOP instructions.
                </p>
                <p className="text-xs text-text-tertiary mt-2">
                  Searching inside: <span className="font-semibold text-text-secondary">Medicine Catalog.pdf</span> · <span className="font-semibold text-text-secondary">SOP.pdf</span> · <span className="font-semibold text-text-secondary">Exchange and Refund Policy.pdf</span>
                </p>
              </div>

              {/* Suggested questions */}
              <div className="w-full max-w-2xl">
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Suggested questions</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSubmit(q)}
                      className="text-left text-xs text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-surface-tertiary border border-border hover:border-primary/30 px-3 py-2.5 rounded-xl transition-all group"
                    >
                      <span className="group-hover:text-primary transition-colors">→</span>
                      {' '}{q}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Chat Messages */}
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {/* Typing/Searching indicator */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SearchingIndicator />
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area — pinned at the bottom, matches AIAssistant */}
        <div className="shrink-0">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a policy question… e.g. What is the refund policy?"
                rows={1}
                disabled={loading}
                className="w-full pl-4 pr-12 py-3 bg-surface border border-border rounded-2xl text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 resize-none transition-all disabled:opacity-60 max-h-32 overflow-y-auto"
                style={{ lineHeight: '1.5' }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                }}
              />
            </div>
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || loading}
              className="h-11 w-11 rounded-2xl bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-sm shadow-primary/20 shrink-0"
            >
              {loading
                ? <Loader2 size={17} className="animate-spin" />
                : <Send size={17} />
              }
            </button>
          </div>
          <p className="text-xs text-text-tertiary mt-2 text-center">
            <MessageSquare size={11} className="inline mr-1" />
            Press <kbd className="px-1 py-0.5 rounded text-[10px] bg-surface-secondary border border-border font-mono">Enter</kbd> to send
            · Local semantic search · Documents parsed and indexed locally
          </p>
        </div>

      </div>
    </PageTransition>
  );
}

// ─── Message Bubble Component ──────────────────────────────────────────────────

function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] flex items-start gap-2.5">
          <div className="bg-primary text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-sm">
            {message.content}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="max-w-full w-full flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <BookOpen size={15} className="text-violet-500" />
        </div>
        <div className="flex-1 space-y-3 min-w-0">

          {/* Error Message */}
          {message.is_error && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>{message.summary}</p>
            </div>
          )}

          {/* RAG Retrieval Results */}
          {!message.is_error && (
            <div className="space-y-3">
              {message.answer ? (
                <Card className="p-5 border border-violet-500/10 bg-gradient-to-br from-violet-500/5 to-surface/80 shadow-[0_4px_20px_rgba(139,92,246,0.04)] backdrop-blur-[2px] transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-violet-500 animate-pulse" />
                    <span className="text-xs font-bold text-violet-500 uppercase tracking-wide">Synthesized Policy Answer</span>
                  </div>
                  
                  <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap select-text font-sans">
                    {message.answer}
                  </p>

                  {/* Dynamic Source PDF Badges */}
                  {message.matches && message.matches.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-3.5 mt-3.5 border-t border-border/30 shrink-0">
                      <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider self-center mr-1">Sources:</span>
                      {Array.from(new Set(message.matches.map(m => m.document))).map((doc, idx) => (
                        <span 
                          key={idx} 
                          className="text-[10px] font-semibold bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-lg flex items-center gap-1 select-none"
                          title={doc}
                        >
                          <FileText size={10} className="text-violet-500 shrink-0" />
                          {doc}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-border bg-surface-secondary text-sm text-text-secondary text-center">
                  No answer could be generated from matching policy documents.
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}

// ─── Searching Indicator Component ─────────────────────────────────────────────

function SearchingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
        <BookOpen size={15} className="text-violet-500" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-surface-secondary border border-border flex items-center gap-1.5">
        <Loader2 size={14} className="text-violet-500 animate-spin" />
        <span className="text-xs text-text-secondary">LLM is thinking...</span>
        <span className="flex gap-0.5 ml-1">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="w-1 h-1 rounded-full bg-violet-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
