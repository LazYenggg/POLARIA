'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import Link from 'next/link'
import './page-navigation.css'

function removeEdgeWhite(src: string) {
  return new Promise<string>((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return resolve(src)
      context.drawImage(image, 0, 0)
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
      const { data, width, height } = pixels
      const visited = new Uint8Array(width * height)
      const queue: number[] = []
      const isEdgeWhite = (point: number) => {
        const index = point * 4
        return data[index] > 242 && data[index + 1] > 242 && data[index + 2] > 242 && data[index + 3] > 0
      }
      const enqueue = (x: number, y: number) => {
        const point = y * width + x
        if (!visited[point] && isEdgeWhite(point)) {
          visited[point] = 1
          queue.push(point)
        }
      }
      for (let x = 0; x < width; x += 1) { enqueue(x, 0); enqueue(x, height - 1) }
      for (let y = 1; y < height - 1; y += 1) { enqueue(0, y); enqueue(width - 1, y) }
      for (let index = 0; index < queue.length; index += 1) {
        const point = queue[index]
        data[point * 4 + 3] = 0
        const x = point % width
        const y = Math.floor(point / width)
        if (x > 0) enqueue(x - 1, y)
        if (x < width - 1) enqueue(x + 1, y)
        if (y > 0) enqueue(x, y - 1)
        if (y < height - 1) enqueue(x, y + 1)
      }
      context.putImageData(pixels, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = () => resolve(src)
    image.src = src
  })
}

const navigationAssets = {
  backward: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/backward_icon-V0I2FmyYTCT08HTIVFJHQW6DNSehWV.png',
  home: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/home_icon-cXYu3cywNAezOxlbp1bkBsbf7kYAZZ.png',
  forward: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/forward-1FNPr3VFE6ZK7Tgdv0v8tnT5EasxcQ.png',
}

interface PageNavigationProps {
  backHref?: string
  backLabel?: string
  homeHref?: string
  homeLabel?: string
  forwardHref?: string
  forwardLabel?: string
  className?: string
  variant?: 'forward-only' | 'dual' | 'full'
  processTransparency?: boolean
  onBackClick?: (event: MouseEvent<HTMLAnchorElement>) => void | Promise<void>
  onHomeClick?: (event: MouseEvent<HTMLAnchorElement>) => void | Promise<void>
  onForwardClick?: (event: MouseEvent<HTMLAnchorElement>) => void | Promise<void>
}

export default function PageNavigation({
  backHref,
  backLabel = 'Kembali',
  homeHref,
  homeLabel = 'Menu utama',
  forwardHref,
  forwardLabel = 'Lanjut',
  className = '',
  variant = 'dual',
  processTransparency = false,
  onBackClick,
  onHomeClick,
  onForwardClick,
}: PageNavigationProps) {
  const [processedAssets, setProcessedAssets] = useState(navigationAssets)

  useEffect(() => {
    if (!processTransparency) return

    let active = true
    Promise.all([
      removeEdgeWhite(navigationAssets.backward),
      removeEdgeWhite(navigationAssets.home),
      removeEdgeWhite(navigationAssets.forward),
    ]).then(([backward, home, forward]) => {
      if (active) setProcessedAssets({ backward, home, forward })
    })
    return () => { active = false }
  }, [processTransparency])

  // Forward-only variant (Page 2)
  if (variant === 'forward-only' && forwardHref) {
    return (
      <Link
        className={`page-nav-forward-only ${className}`}
        href={forwardHref}
        aria-label={forwardLabel}
        onClick={onForwardClick}
      >
        <img src={processedAssets.forward} alt={forwardLabel} />
      </Link>
    )
  }

  // Full variant (Page 3: back, home, forward)
  if (variant === 'full') {
    return (
      <nav className={`page-nav-container page-nav-full ${className}`} aria-label="Navigasi halaman">
        {backHref && (
          <Link
            href={backHref}
            aria-label={backLabel}
            onClick={onBackClick}
          >
            <img src={processedAssets.backward} alt={backLabel} />
          </Link>
        )}
        {homeHref && (
          <Link
            href={homeHref}
            aria-label={homeLabel}
            onClick={onHomeClick}
          >
            <img src={processedAssets.home} alt={homeLabel} />
          </Link>
        )}
        {forwardHref && (
          <Link
            href={forwardHref}
            aria-label={forwardLabel}
            onClick={onForwardClick}
          >
            <img src={processedAssets.forward} alt={forwardLabel} />
          </Link>
        )}
      </nav>
    )
  }

  // Dual variant (Page 4: back, forward)
  return (
    <nav className={`page-nav-container page-nav-dual ${className}`} aria-label="Navigasi halaman">
      {backHref && (
        <Link
            href={backHref}
            aria-label={backLabel}
            onClick={onBackClick}
          >
          <img src={processedAssets.backward} alt={backLabel} />
        </Link>
      )}
      {forwardHref && (
        <Link
            href={forwardHref}
            aria-label={forwardLabel}
            onClick={onForwardClick}
          >
          <img src={processedAssets.forward} alt={forwardLabel} />
        </Link>
      )}
    </nav>
  )
}
