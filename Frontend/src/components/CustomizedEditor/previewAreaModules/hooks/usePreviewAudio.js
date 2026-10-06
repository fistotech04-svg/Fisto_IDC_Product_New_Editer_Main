import { useState, useRef, useEffect, useCallback } from 'react';

export const usePreviewAudio = ({
  otherSetupSettings,
  activeDevice
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isFlipMuted, setIsFlipMuted] = useState(false);
  const [flipTrigger, setFlipTrigger] = useState(0);

  const [mobileIsMuted, setMobileIsMuted] = useState(false);
  const [mobileIsFlipMuted, setMobileIsFlipMuted] = useState(false);
  const [mobileFlipTrigger, setMobileFlipTrigger] = useState(0);

  const audioRef = useRef(null);

  // Background audio sync
  useEffect(() => {
    const sound = otherSetupSettings?.sound;
    const isMobile = activeDevice === 'Mobile';
    const muted = isMobile ? mobileIsMuted : isMuted;

    if (!sound?.enabled || !sound?.url) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(sound.url);
      audioRef.current.loop = sound.loop ?? true;
    } else if (audioRef.current.src !== sound.url) {
      audioRef.current.src = sound.url;
    }

    audioRef.current.muted = muted;
    audioRef.current.volume = (sound.volume ?? 100) / 100;

    if (!muted) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [otherSetupSettings?.sound, isMuted, mobileIsMuted, activeDevice]);

  const handleToggleAudio = useCallback(() => {
    if (activeDevice === 'Mobile') {
      setMobileIsMuted(prev => !prev);
    } else {
      setIsMuted(prev => !prev);
    }
  }, [activeDevice]);

  return {
    isMuted,
    setIsMuted,
    isFlipMuted,
    setIsFlipMuted,
    flipTrigger,
    setFlipTrigger,
    mobileIsMuted,
    setMobileIsMuted,
    mobileIsFlipMuted,
    setIsFlipMuted,
    mobileFlipTrigger,
    setMobileFlipTrigger,
    handleToggleAudio
  };
};

export default usePreviewAudio;
