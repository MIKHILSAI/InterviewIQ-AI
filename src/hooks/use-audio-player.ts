import { useState, useRef, useCallback, useEffect } from 'react';
import { Language } from '@/lib/types';

export interface UseAudioPlayerReturn {
  speak: (text: string, audioUrl?: string | null, lang?: Language) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  needsUserGesture: boolean;
  clearGestureNeeded: () => void;
  error?: string;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      audioElementRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const clearGestureNeeded = useCallback(() => {
    setNeedsUserGesture(false);
  }, []);

  const speak = useCallback(
    async (text: string, audioUrl?: string | null, lang: Language = 'en'): Promise<void> => {
      stop();
      setError(undefined);
      setNeedsUserGesture(false);
      setIsSpeaking(true);

      // Strategy 1: Real audioUrl if provided
      if (audioUrl) {
        return new Promise<void>((resolve, reject) => {
          const audio = new Audio(audioUrl);
          audioElementRef.current = audio;

          audio.onended = () => {
            setIsSpeaking(false);
            audioElementRef.current = null;
            resolve();
          };

          audio.onerror = () => {
            audioElementRef.current = null;
            // Fall back to speechSynthesis if audioUrl fails
            fallbackSpeechSynthesis(text, lang)
              .then(resolve)
              .catch(reject);
          };

          audio.play().catch((playErr) => {
            setNeedsUserGesture(true);
            setIsSpeaking(false);
            reject(playErr);
          });
        });
      }

      // Strategy 2: Browser SpeechSynthesis Fallback
      return fallbackSpeechSynthesis(text, lang);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stop]
  );

  const fallbackSpeechSynthesis = (text: string, lang: Language): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        // If not supported in browser, simulate speech duration ~60wpm
        const words = text.split(' ').length;
        const duration = Math.min(8000, Math.max(2000, words * 280));
        setTimeout(() => {
          setIsSpeaking(false);
          resolve();
        }, duration);
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      const langMap: Record<Language, string> = {
        en: 'en-IN',
        ta: 'ta-IN',
        hi: 'hi-IN',
      };
      utterance.lang = langMap[lang] || 'en-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      // Select matching voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.toLowerCase().includes(langMap[lang].toLowerCase()) ||
          v.lang.toLowerCase().includes(lang.toLowerCase())
      );
      if (preferred) {
        utterance.voice = preferred;
      }

      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        resolve();
      };

      utterance.onerror = (e) => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        if (e.error === 'not-allowed') {
          setNeedsUserGesture(true);
        }
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    speak,
    stop,
    isSpeaking,
    needsUserGesture,
    clearGestureNeeded,
    error,
  };
}
