import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PhoneOff, MessageSquare, Loader, X, ArrowLeft } from 'lucide-react';
import { Conversation } from '@elevenlabs/client';
import { startElevenLabsSession } from '../services';
import api from '../services/client';
import { classNames } from '../utils/helpers';
import { STATUS_LABELS, STATUS_COLORS } from '../utils/constants';
import Badge from '../components/common/Badge';

export default function VoiceSession() {
  const { order_id } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('init');
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);

  const conversationRef = useRef(null);
  const chatRef = useRef(null);
  const redirectTimerRef = useRef(null);
  const callStartRef = useRef(null);
  const messagesRef = useRef([]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      if (conversationRef.current) {
        try { conversationRef.current.endSession(); } catch {}
      }
    };
  }, []);

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
    navigate('/orders');
  };

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      <header className="bg-white border-b border-border px-4 lg:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleEndCall}
            className="p-2 -ml-2 rounded-lg text-text-secondary hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <PhoneOff size={16} className="text-primary rotate-90" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-primary">
              Voice Session — ORD-{String(order_id).padStart(3, '0')}
            </h1>
            <p className="text-xs text-text-secondary">
              {status && (
                <Badge variant={STATUS_COLORS[status] || 'blue'} dot={phase === 'conversing'}>
                  {STATUS_LABELS[status] || status}
                </Badge>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {listening && (
            <span className="flex items-center gap-1.5 text-xs text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Listening
            </span>
          )}
          {speaking && (
            <span className="flex items-center gap-1.5 text-xs text-primary">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Speaking
            </span>
          )}
          <button
            onClick={handleEndCall}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <X size={14} />
            End Call
          </button>
        </div>
      </header>

      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 space-y-4 max-w-3xl mx-auto w-full">
        {phase === 'init' && (
          <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
            <Loader size={32} className="animate-spin mb-4 text-primary" />
            <p className="text-sm">Connecting to ElevenLabs agent...</p>
          </div>
        )}

        {phase === 'conversing' && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
            <MessageSquare size={40} className="mb-3 opacity-40" />
            <p className="text-sm font-medium text-text-primary">Agent connected</p>
            <p className="text-xs mt-1">The agent will start speaking shortly.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={classNames(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start',
            )}
          >
            <div
              className={classNames(
                'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-md'
                  : 'bg-white border border-border text-text-primary rounded-bl-md shadow-sm',
              )}
            >
              <p>{msg.text}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {error && (
        <div className="max-w-3xl mx-auto w-full px-4 lg:px-6 mb-3">
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}
