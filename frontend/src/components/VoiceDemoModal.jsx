import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PhoneOff, Mic, Square, MessageSquare, Loader } from 'lucide-react';
import { simulateCall, voiceTurn } from '../services';
import { classNames } from '../utils/helpers';
import { STATUS_LABELS, STATUS_COLORS } from '../utils/constants';
import VoiceOutput from './VoiceOutput';
import Badge from './common/Badge';

export default function VoiceDemoModal({ order, onClose, onComplete }) {
  const [phase, setPhase] = useState('init'); // init → greeting → conversing → done
  const [turns, setTurns] = useState([]);
  const [status, setStatus] = useState(order.status);
  const [error, setError] = useState(null);
  const [listening, setListening] = useState(false);
  const [manualText, setManualText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [finalStatus, setFinalStatus] = useState(null);

  const recognitionRef = useRef(null);
  const chatRef = useRef(null);

  // Scroll to bottom on new turns
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [turns]);

  // Initialise SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ur-PK';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setManualText(text);
        handleSend(text);
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
    }
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  // Initialise simulation on mount
  const initSimulation = useCallback(async () => {
    setPhase('init');
    setError(null);
    try {
      const result = await simulateCall(order.id);
      setGreeting(result.greeting);
      setStatus(result.status);
      setTurns([{ role: 'ai', text: result.greeting }]);
      setPhase('greeting');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to start simulation');
      setPhase('done');
    }
  }, [order.id]);

  useEffect(() => {
    initSimulation();
  }, [initSimulation]);

  const handleSend = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || processing) return;

    setManualText('');
    setProcessing(true);
    setTurns((prev) => [...prev, { role: 'user', text: trimmed }]);

    try {
      const result = await voiceTurn(order.id, trimmed);
      setStatus(result.status);

      setTurns((prev) => [...prev, { role: 'ai', text: result.response_text, result }]);

      if (result.is_final) {
        setFinalStatus(result.status);
        setPhase('done');
        if (onComplete) onComplete(result.status);
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || 'Request failed';
      setTurns((prev) => [...prev, { role: 'ai', text: `System error: ${errMsg}`, result: { status: 'error', reason: errMsg } }]);
    } finally {
      setProcessing(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      // Fallback: just focus the input
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setManualText('');
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  };

  const handleManualSubmit = () => {
    if (manualText.trim()) {
      handleSend(manualText.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleManualSubmit();
    }
  };

  const handleEndCall = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    onClose();
  };

  const speakingText = turns.length > 0 && turns[turns.length - 1].role === 'ai'
    ? turns[turns.length - 1].text
    : '';

  const lastResult = turns.length > 0 && turns[turns.length - 1].role === 'ai'
    ? turns[turns.length - 1].result
    : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) handleEndCall(); }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-border"
        >
          {/* ── Header ─────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <PhoneOff size={16} className="text-primary rotate-90" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  Simulate Call — {order.displayId}
                </h2>
                <p className="text-xs text-text-secondary">
                  {order.customer} &middot; {order.medicine}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {status && (
                <Badge variant={STATUS_COLORS[status] || 'blue'} dot={phase !== 'done'}>
                  {STATUS_LABELS[status] || status}
                </Badge>
              )}
              <button
                onClick={handleEndCall}
                className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Order info bar ─────────────────────────────── */}
          <div className="px-5 py-2 bg-surface-secondary/50 border-b border-border text-xs text-text-secondary flex gap-4">
            <span>Qty: <strong>{order.quantity}</strong></span>
            <span>Phone: <strong>{order.phone}</strong></span>
          </div>

          {/* ── Transcript area ────────────────────────────── */}
          <div ref={chatRef} className="h-[340px] overflow-y-auto px-5 py-4 space-y-3">
            {/* Loading state */}
            {phase === 'init' && (
              <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
                <Loader size={28} className="animate-spin mb-3 text-primary" />
                <p className="text-sm">Initialising call...</p>
              </div>
            )}

            {/* Empty state */}
            {phase === 'greeting' && turns.length <= 1 && (
              <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
                <MessageSquare size={36} className="mb-2 opacity-40" />
                <p className="text-sm">AI is greeting the customer...</p>
                <p className="text-xs mt-1">Speak or type your response below.</p>
              </div>
            )}

            {/* Messages */}
            {turns.map((turn, i) => (
              <div
                key={i}
                className={classNames(
                  'flex',
                  turn.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                <div
                  className={classNames(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                    turn.role === 'user'
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-surface border border-border text-text-primary rounded-bl-md',
                  )}
                >
                  <p className="leading-relaxed">{turn.text}</p>
                  {turn.result?.status === 'error' && (
                    <p className="text-xs text-red-500 mt-1">{turn.result.reason}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {processing && (
              <div className="flex justify-start">
                <div className="bg-surface border border-border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Final state banner ─────────────────────────── */}
          {phase === 'done' && finalStatus && (
            <div className="mx-5 mb-3 px-4 py-3 rounded-xl bg-surface-tertiary border border-border text-sm">
              <p className="font-medium text-text-primary">
                Call completed — {STATUS_LABELS[finalStatus] || finalStatus}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {lastResult?.reason || 'Conversation finished.'}
              </p>
            </div>
          )}

          {/* ── Error banner ───────────────────────────────── */}
          {error && (
            <div className="mx-5 mb-3 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ── Input area ─────────────────────────────────── */}
          {phase !== 'done' && (
            <div className="px-5 py-4 border-t border-border bg-surface">
              <div className="flex gap-2 mb-2">
                {recognitionRef.current && (
                  <button
                    onClick={toggleListening}
                    disabled={processing}
                    className={classNames(
                      'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                      listening
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                        : 'bg-white border border-border text-text-secondary hover:bg-surface-hover',
                      processing && 'opacity-50 cursor-not-allowed',
                    )}
                    title={listening ? 'Stop listening' : 'Start speaking'}
                  >
                    {listening ? <Square size={14} /> : <Mic size={14} />}
                    {listening ? 'Stop' : 'Speak'}
                  </button>
                )}
                <input
                  type="text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={recognitionRef.current ? '...or type a message' : 'Type your message...'}
                  disabled={processing}
                  className="flex-1 rounded-xl border border-border bg-white px-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
                />
                <button
                  onClick={handleManualSubmit}
                  disabled={processing || !manualText.trim()}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
              <VoiceOutput text={speakingText} />
            </div>
          )}

          {/* ── Done footer ────────────────────────────────── */}
          {phase === 'done' && (
            <div className="px-5 py-4 border-t border-border bg-surface flex justify-end">
              <button
                onClick={handleEndCall}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                <X size={14} />
                Close
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
