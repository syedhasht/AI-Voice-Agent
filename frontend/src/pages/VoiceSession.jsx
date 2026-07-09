import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, MessageSquare, Loader2, X, ArrowLeft, Volume2, Mic, Phone, Award } from 'lucide-react';
import { Conversation } from '@elevenlabs/client';
import { startElevenLabsSession } from '../services';
import api from '../services/client';
import { classNames } from '../utils/helpers';
import { STATUS_LABELS, STATUS_COLORS } from '../utils/constants';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';

export default function VoiceSession() {
  const { order_id } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('init');
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [duration, setDuration] = useState(0);

  const conversationRef = useRef(null);
  const chatRef = useRef(null);
  const redirectTimerRef = useRef(null);
  const callStartRef = useRef(null);
  const messagesRef = useRef([]);

  // Auto-scroll chat transcript
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Duration Counter
  useEffect(() => {
    let timer;
    if (phase === 'conversing') {
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(timer);
  }, [phase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      if (conversationRef.current) {
        try { conversationRef.current.endSession(); } catch {}
      }
    };
  }, []);

  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const saveTranscript = useCallback(async (currentMessages) => {
    const durationMs = callStartRef.current ? (Date.now() - callStartRef.current) : 0;
    const durationSec = Math.round(durationMs / 1000);
    try {
      const payload = {
        call_duration_seconds: durationSec
      };
      if (currentMessages && currentMessages.length > 0) {
        payload.transcript_json = JSON.stringify(
          currentMessages.map((m) => ({
            speaker: m.role === 'user' ? 'Customer' : 'AI',
            text: m.text,
            timestamp: new Date().toISOString()
          }))
        );
      } else {
        payload.transcript_json = "[]";
      }
      await api.put(`/orders/${order_id}`, payload);
      console.log('Saved conversation details successfully.');
    } catch (err) {
      console.error('Failed to save conversation details:', err);
    }
  }, [order_id]);

  const triggerAutoHangup = useCallback(() => {
    setTimeout(async () => {
      if (conversationRef.current) {
        try {
          console.log('Auto-ending ElevenLabs session after tool call...');
          await conversationRef.current.endSession();
        } catch (err) {
          console.error('Failed to auto-end session:', err);
        }
      }
    }, 4500);
  }, []);

  const doStartConversation = useCallback(async () => {
    setPhase('init');
    setError(null);
    try {
      const data = await startElevenLabsSession(order_id);
      setStatus('elevenlabs_session');

      console.log('Starting ElevenLabs session');

      const conversation = await Conversation.startSession({
        signedUrl: data.signed_url || undefined,
        agentId: data.signed_url ? undefined : data.agent_id,
        connectionType: 'websocket',
        clientTools: {
          confirm_order: async () => {
            console.log('clientTool: confirm_order called');
            try {
              const res = await api.post('/agent/confirm-order', { order_id: Number(order_id) });
              console.log('confirm_order success:', res.data);
              setStatus('completed');
              triggerAutoHangup();
              return 'Order successfully confirmed.';
            } catch (err) {
              console.error('confirm_order failed:', err);
              return 'Failed to confirm order.';
            }
          },
          'confirm-order': async () => {
            console.log('clientTool: confirm-order called');
            try {
              const res = await api.post('/agent/confirm-order', { order_id: Number(order_id) });
              console.log('confirm_order success:', res.data);
              setStatus('completed');
              triggerAutoHangup();
              return 'Order successfully confirmed.';
            } catch (err) {
              console.error('confirm_order failed:', err);
              return 'Failed to confirm order.';
            }
          },
          modify_order: async ({ quantity }) => {
            console.log('clientTool: modify_order called with quantity:', quantity);
            try {
              const res = await api.post('/agent/modify-order', {
                order_id: Number(order_id),
                quantity: Number(quantity)
              });
              console.log('modify_order success:', res.data);
              setStatus('completed');
              triggerAutoHangup();
              return `Order successfully modified to quantity ${quantity}.`;
            } catch (err) {
              console.error('modify_order failed:', err);
              return 'Failed to modify order.';
            }
          },
          'modify-order': async ({ quantity }) => {
            console.log('clientTool: modify-order called with quantity:', quantity);
            try {
              const res = await api.post('/agent/modify-order', {
                order_id: Number(order_id),
                quantity: Number(quantity)
              });
              console.log('modify_order success:', res.data);
              setStatus('completed');
              triggerAutoHangup();
              return `Order successfully modified to quantity ${quantity}.`;
            } catch (err) {
              console.error('modify_order failed:', err);
              return 'Failed to modify order.';
            }
          },
          cancel_order: async () => {
            console.log('clientTool: cancel_order called');
            try {
              const res = await api.post('/agent/cancel-order', { order_id: Number(order_id) });
              console.log('cancel_order success:', res.data);
              setStatus('rejected');
              triggerAutoHangup();
              return 'Order successfully cancelled.';
            } catch (err) {
              console.error('cancel_order failed:', err);
              return 'Failed to cancel order.';
            }
          },
          'cancel-order': async () => {
            console.log('clientTool: cancel-order called');
            try {
              const res = await api.post('/agent/cancel-order', { order_id: Number(order_id) });
              console.log('cancel_order success:', res.data);
              setStatus('rejected');
              triggerAutoHangup();
              return 'Order successfully cancelled.';
            } catch (err) {
              console.error('cancel_order failed:', err);
              return 'Failed to cancel order.';
            }
          },
          request_human: async ({ reason }) => {
            console.log('clientTool: request_human called with reason:', reason);
            try {
              const res = await api.post('/agent/request-human', {
                order_id: Number(order_id),
                reason: reason || ''
              });
              console.log('request_human success:', res.data);
              setStatus('need_human');
              triggerAutoHangup();
              return 'Human representative requested.';
            } catch (err) {
              console.error('request_human failed:', err);
              return 'Failed to request human.';
            }
          },
          'request-human': async ({ reason }) => {
            console.log('clientTool: request-human called with reason:', reason);
            try {
              const res = await api.post('/agent/request-human', {
                order_id: Number(order_id),
                reason: reason || ''
              });
              console.log('request_human success:', res.data);
              setStatus('need_human');
              triggerAutoHangup();
              return 'Human representative requested.';
            } catch (err) {
              console.error('request_human failed:', err);
              return 'Failed to request human.';
            }
          }
        },
        dynamicVariables: {
          customer: data.customer || '',
          medicine: data.medicine || '',
          quantity: String(data.quantity || '1'),
        },
        onConnect: ({ conversationId }) => {
          console.log('ElevenLabs connected:', conversationId);
          setPhase('conversing');
          callStartRef.current = Date.now();
        },
        onDisconnect: () => {
          console.log('ElevenLabs disconnected');
          setPhase('done');
          saveTranscript(messagesRef.current);
          redirectTimerRef.current = setTimeout(() => {
            navigate(`/orders/${order_id}`);
          }, 3000);
        },
        onMessage: (msg) => {
          setMessages((prev) => [...prev, { role: msg.role || 'agent', text: msg.message }]);
        },
        onModeChange: ({ mode }) => {
          setSpeaking(mode === 'speaking');
          setListening(mode === 'listening');
        },
        onError: (message) => {
          console.error('ElevenLabs error:', message);
          setError(message);
        },
      });

      conversationRef.current = conversation;
      setPhase('conversing');
    } catch (err) {
      console.error('Session start failed:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to start session');
      setPhase('done');
    }
  }, [order_id, triggerAutoHangup, saveTranscript, navigate]);

  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    doStartConversation();
  }, [doStartConversation]);

  const handleEndCall = async () => {
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    if (conversationRef.current) {
      try { await conversationRef.current.endSession(); } catch {}
    }
    await saveTranscript(messagesRef.current);
    navigate(`/orders/${order_id}`);
  };

  // Determine active visualizer state
  const visualizerState = speaking ? 'speaking' : (listening ? 'listening' : 'idle');

  return (
    <div className="h-screen bg-surface-secondary flex flex-col overflow-hidden">
      
      {/* Header Bar */}
      <header className="bg-surface border-b border-border px-4 lg:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleEndCall}
            className="p-2 -ml-2 rounded-lg text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Phone size={16} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-text-primary">
              Live Calling Dashboard · ORD-{String(order_id).padStart(3, '0')}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              {status && (
                <Badge variant={STATUS_COLORS[status] || 'blue'}>
                  {STATUS_LABELS[status] || status}
                </Badge>
              )}
              {phase === 'conversing' && (
                <span className="text-[11px] text-text-tertiary flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-ping" />
                  Live Line
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pinned call controls */}
        <div className="flex items-center gap-4">
          {phase === 'conversing' && (
            <span className="font-mono text-sm font-bold text-text-primary bg-surface-secondary px-3 py-1.5 rounded-xl border border-border">
              {formatDuration(duration)}
            </span>
          )}
          <button
            onClick={handleEndCall}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 transition-all shadow-sm shadow-rose-500/20"
          >
            <PhoneOff size={14} />
            Hang Up
          </button>
        </div>
      </header>

      {/* Main Split Console */}
      <div className="flex-1 flex flex-col md:flex-row gap-5 p-5 min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN: Animated Call Monitor Panel (WOW Factor) */}
        <div className="w-full md:w-[380px] shrink-0 flex flex-col gap-4">
          <Card className="flex-1 flex flex-col items-center justify-center p-6 border border-border bg-gradient-to-b from-surface to-surface-secondary/40 text-center relative overflow-hidden">
            {/* Soft decorative background circles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

            {/* Glowing Orb Visualizer */}
            <div className="relative z-10 flex flex-col items-center justify-center my-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={visualizerState}
                  variants={{
                    speaking: {
                      scale: [1, 1.15, 1],
                      boxShadow: [
                        "0 0 0px 0px rgba(139, 92, 246, 0)",
                        "0 0 40px 15px rgba(139, 92, 246, 0.25)",
                        "0 0 0px 0px rgba(139, 92, 246, 0)"
                      ],
                      transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                    },
                    listening: {
                      scale: [1, 1.08, 1],
                      boxShadow: [
                        "0 0 0px 0px rgba(16, 185, 129, 0)",
                        "0 0 35px 12px rgba(16, 185, 129, 0.2)",
                        "0 0 0px 0px rgba(16, 185, 129, 0)"
                      ],
                      transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                    },
                    idle: {
                      scale: 1,
                      boxShadow: "0 0 0px 0px rgba(0,0,0,0)"
                    }
                  }}
                  animate={visualizerState}
                  className={classNames(
                    "w-28 h-28 rounded-full border flex items-center justify-center transition-colors duration-500",
                    speaking 
                      ? "bg-violet-500/10 border-violet-500/40 text-violet-500" 
                      : (listening 
                          ? "bg-emerald/10 border-emerald/30 text-emerald" 
                          : "bg-surface-secondary border-border text-text-tertiary")
                  )}
                >
                  {speaking && <Volume2 size={36} className="animate-bounce" />}
                  {listening && <Mic size={36} className="animate-pulse" />}
                  {!speaking && !listening && <PhoneOff size={32} />}
                </motion.div>
              </AnimatePresence>

              {/* Status Ripple Rings */}
              {phase === 'conversing' && (
                <div className="absolute inset-0 w-28 h-28 mx-auto rounded-full border border-primary/20 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
              )}
            </div>

            {/* Calling Details Text */}
            <div className="relative z-10 space-y-2 mt-2">
              <h2 className="text-base font-bold text-text-primary">
                {phase === 'init' && "Establishing Connection..."}
                {phase === 'conversing' && (speaking ? "AI Assistant Speaking" : (listening ? "Listening to Customer..." : "Line Connected"))}
                {phase === 'done' && "Call Session Finished"}
              </h2>
              <p className="text-xs text-text-secondary max-w-xs mx-auto">
                {phase === 'init' && "Fetching secure token credentials & connecting voice socket..."}
                {phase === 'conversing' && "Your AI agent is dynamically handling order queries, updates, and confirmations."}
                {phase === 'done' && "Disconnecting line. Storing call transcript summaries to database..."}
              </p>
            </div>

            {/* Mini Audio Equalizer Wave (Active State) */}
            {phase === 'conversing' && (
              <div className="flex items-end justify-center gap-1.5 h-10 mt-6 z-10">
                {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                  <motion.div
                    key={bar}
                    className={classNames(
                      "w-1.5 rounded-full",
                      speaking ? "bg-violet-500" : (listening ? "bg-emerald" : "bg-text-tertiary/40")
                    )}
                    animate={{
                      height: speaking 
                        ? [12, 36, 16, 28, 12][bar % 5] 
                        : (listening ? [12, 22, 16, 12][bar % 4] : 12)
                    }}
                    transition={{
                      duration: speaking ? 0.6 : 1.2,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: bar * 0.1
                    }}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Chat Transcript Container */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-surface border border-border rounded-2xl shadow-sm">
          {/* Transcript Header */}
          <div className="border-b border-border p-4 bg-surface-secondary/30 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare size={13} className="text-primary" />
              Live Conversation Transcript
            </span>
            <span className="text-[10px] text-text-tertiary bg-surface border border-border px-2 py-0.5 rounded font-mono">
              Live Sync
            </span>
          </div>

          {/* Transcript Scroll Window */}
          <div 
            ref={chatRef} 
            className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0 select-text"
          >
            {/* Loading Connection */}
            {phase === 'init' && (
              <div className="h-full flex flex-col items-center justify-center text-center text-text-tertiary space-y-3">
                <Loader2 size={32} className="animate-spin text-primary" />
                <p className="text-sm font-medium text-text-primary">Opening WebSocket secure connection...</p>
                <p className="text-xs">Exchanging session variables: Customer Name & Medicine Details</p>
              </div>
            )}

            {/* Waiting for speak */}
            {phase === 'conversing' && messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-text-tertiary space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-surface-secondary flex items-center justify-center text-primary border border-border">
                  <Volume2 size={22} className="animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-text-primary">Line is connected</p>
                <p className="text-xs max-w-xs">Waiting for ElevenLabs AI voice module to begin greeting.</p>
              </div>
            )}

            {/* Live Message Bubbles */}
            <AnimatePresence>
              {messages.map((msg, i) => {
                const isUser = msg.role === 'user';
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={classNames(
                      'flex items-start gap-2.5 max-w-[85%]',
                      isUser ? 'ml-auto justify-end' : 'justify-start',
                    )}
                  >
                    {/* Bot Avatar Icon */}
                    {!isUser && (
                      <div className="w-7 h-7 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5 select-none">
                        <Phone size={12} className="text-violet-500" />
                      </div>
                    )}
                    <div
                      className={classNames(
                        'rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                        isUser
                          ? 'bg-primary text-white rounded-tr-sm'
                          : 'bg-surface-secondary border border-border text-text-primary rounded-tl-sm',
                      )}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Transcript Footer Info */}
          <div className="bg-surface-secondary/20 border-t border-border/50 px-4 py-2 text-center text-[10px] text-text-tertiary shrink-0">
            Transcript dynamically synced from ElevenLabs Client Audio Connection
          </div>
        </div>

      </div>

      {/* Error alert wrapper */}
      {error && (
        <div className="px-5 pb-5 shrink-0">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm flex items-center gap-2 shadow-sm animate-pulse">
            <X size={16} className="shrink-0" />
            <p className="font-semibold">Connection Error: {error}</p>
          </div>
        </div>
      )}

    </div>
  );
}
