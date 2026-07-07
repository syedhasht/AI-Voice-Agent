import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square } from 'lucide-react';
import { classNames } from '../utils/helpers';

export default function VoiceInput({ onTranscript, disabled }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [manualText, setManualText] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'ur-PK';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setManualText(text);
      onTranscript(text);
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, [onTranscript]);

  const toggleListening = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      setManualText('');
      try {
        recognitionRef.current?.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  }, [listening]);

  const handleManualSubmit = () => {
    const text = manualText.trim();
    if (text) {
      onTranscript(text);
      setManualText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleManualSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {supported ? (
          <button
            onClick={toggleListening}
            disabled={disabled}
            className={classNames(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200',
              listening
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                : 'bg-primary text-white hover:bg-primary-dark shadow-sm',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            {listening ? <Square size={16} /> : <Mic size={16} />}
            {listening ? 'Stop' : 'Speak'}
          </button>
        ) : (
          <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
            Speech recognition not supported in this browser. Use text input below.
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={supported ? '...or type your message here' : 'Type your message here...'}
          disabled={disabled}
          className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
        />
        <button
          onClick={handleManualSubmit}
          disabled={disabled || !manualText.trim()}
          className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
