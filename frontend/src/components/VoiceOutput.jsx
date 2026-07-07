import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { classNames } from '../utils/helpers';

export default function VoiceOutput({ text }) {
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (!text || muted) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Try to find an Urdu voice, fall back to any voice
    const voices = window.speechSynthesis.getVoices();
    const urduVoice = voices.find((v) => v.lang.startsWith('ur'));
    if (urduVoice) {
      utterance.voice = urduVoice;
    }
    utterance.lang = 'ur-PK';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [text, muted]);

  const toggleMute = () => {
    if (!muted) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
    setMuted(!muted);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleMute}
        className={classNames(
          'p-2 rounded-lg transition-colors',
          muted
            ? 'text-text-tertiary hover:text-text-secondary'
            : 'text-primary hover:bg-primary/5',
        )}
        title={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      {speaking && !muted && (
        <div className="flex items-center gap-1">
          <span className="w-1 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
      {!speaking && text && !muted && (
        <span className="text-xs text-text-tertiary">Speaking complete</span>
      )}
    </div>
  );
}
