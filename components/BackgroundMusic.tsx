'use client'

import { useEffect, useRef } from 'react'

/**
 * POLARIA global background music.
 *
 * The component lives in RootLayout so it stays mounted while
 * the user moves between pages with client-side navigation.
 * Playback is attempted immediately. If the browser blocks
 * autoplay, the first user interaction starts the music.
 */
export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    audio.volume = 0.35
    audio.loop = true

    const removeInteractionListeners = () => {
      window.removeEventListener('pointerdown', startAfterInteraction)
      window.removeEventListener('keydown', startAfterInteraction)
      window.removeEventListener('touchstart', startAfterInteraction)
    }

    const startPlayback = async () => {
      try {
        await audio.play()
        removeInteractionListeners()
      } catch {
        // Autoplay can be blocked by the browser.
        // The first real user interaction will retry playback.
      }
    }

    const startAfterInteraction = () => {
      void startPlayback()
    }

    window.addEventListener('pointerdown', startAfterInteraction, {
      once: true,
    })
    window.addEventListener('keydown', startAfterInteraction, {
      once: true,
    })
    window.addEventListener('touchstart', startAfterInteraction, {
      once: true,
      passive: true,
    })

    void startPlayback()

    return () => {
      removeInteractionListeners()
      audio.pause()
    }
  }, [])

  return (
    <audio
      ref={audioRef}
      src="/assets/backsound.mp3"
      preload="auto"
      loop
      aria-hidden="true"
    />
  )
}
