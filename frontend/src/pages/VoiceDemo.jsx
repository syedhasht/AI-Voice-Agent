import { useState, useRef, useEffect } from 'react';
import { MessageSquare, RefreshCw } from 'lucide-react';
import VoiceInput from '../components/VoiceInput';
import VoiceOutput from '../components/VoiceOutput';
import { demoVoice } from '../services/api';
import { classNames } from '../utils/helpers';

function generateSessionId() {
  return `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function VoiceDemo() {
  const [sessionId, setSessionId] = useState(generateSessionId());
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleTranscript = async (text) => {
    const userMsg = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const data = await demoVoice(text, sessionId);
      const botMsg = {
        role: 'assistant',
        text: data.response_text || 'Sorry, I could not process that.',
        status: data.status,
        reason: data.reason,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || 'Failed to get response';
      setError(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'System error. Please try again.',
          status: 'error',
          reason: errMsg,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetSession = () => {
    setSessionId(generateSessionId());
    setMessages([]);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Voice Demo</h1>
          <p className="text-sm text-text-secondary mt-1">
            Speak or type to test the AI Voice Agent. No phone call needed.
          </p>
        </div>
        <button
          onClick={resetSession}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text-secondary hover:bg-surface-hover transition-colors"
        >
          <RefreshCw size={14} />
          Reset
        </button>
      </div>

      {/* Chat area */}
      <div
        ref={chatRef}
        className="h-[400px] overflow-y-auto space-y-4 rounded-2xl bg-surface border border-border p-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
            <MessageSquare size={40} className="mb-3 opacity-40" />
            <p className="text-sm">Click "Speak" or type a message to start.</p>
            <p className="text-xs mt-1">Try: "Mujhe dawai chahiye" or "Order status"</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={classNames(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start',
            )}
          >
            <div
              className={classNames(
                'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-md'
                  : 'bg-white border border-border text-text-primary rounded-bl-md shadow-sm',
              )}
            >
              <p>{msg.text}</p>
              {msg.role === 'assistant' && msg.reason && (
                <p className="text-xs text-text-tertiary mt-1.5 border-t border-border pt-1.5">
                  {msg.status} &middot; {msg.reason}
                </p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 rounded-xl px-4 py-2">
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="bg-surface rounded-2xl border border-border p-4">
        <VoiceInput onTranscript={handleTranscript} disabled={loading} />
        {messages.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <VoiceOutput
              text={messages[messages.length - 1]?.role === 'assistant' ? messages[messages.length - 1].text : ''}
            />
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-xs text-text-tertiary space-y-1 bg-surface rounded-xl px-4 py-3 border border-border">
        <p><strong>Tips:</strong></p>
        <p>• Speak clearly in Urdu or English (or mix both).</p>
        <p>• The agent can handle order inquiries, medicine requests, and general questions.</p>
        <p>• Demo mode uses browser API — no phone call or Retell credits consumed.</p>
        <p className="text-amber-600">Note: Gemini free-tier may be rate-limited. Fallback response will be used if quota exhausted.</p>
      </div>
    </div>
  );
}
