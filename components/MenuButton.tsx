'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import './menu-button.css'

function removeMenuBackground(src: string) {
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
      
      // Sample corner pixels to estimate background color
      const sampleCorners = [
        { x: 0, y: 0 },
        { x: width - 1, y: 0 },
        { x: 0, y: height - 1 },
        { x: width - 1, y: height - 1 },
      ]
      
      let sumR = 0, sumG = 0, sumB = 0, count = 0
      for (const corner of sampleCorners) {
        const idx = (corner.y * width + corner.x) * 4
        if (data[idx + 3] > 0) {
          sumR += data[idx]
          sumG += data[idx + 1]
          sumB += data[idx + 2]
          count++
        }
      }
      
      const bgR = count > 0 ? sumR / count : 255
      const bgG = count > 0 ? sumG / count : 255
      const bgB = count > 0 ? sumB / count : 255
      
      // Color distance function
      const colorDistance = (r: number, g: number, b: number) => {
        const dr = r - bgR
        const dg = g - bgG
        const db = b - bgB
        return Math.sqrt(dr * dr + dg * dg + db * db)
      }
      
      // Check if pixel is background-like (more aggressive tolerance)
      const isBackground = (idx: number) => {
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        const a = data[idx + 3]
        
        if (a === 0) return true
        
        // More aggressive: consider pixels within distance of 40 as background
        // This catches off-white, cream, and light gray backgrounds
        return colorDistance(r, g, b) < 40
      }
      
      // Flood-fill from all edges
      const visited = new Uint8Array(width * height)
      const queue: number[] = []
      
      const enqueue = (x: number, y: number) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return
        const point = y * width + x
        if (visited[point]) return
        
        const idx = point * 4
        if (isBackground(idx)) {
          visited[point] = 1
          queue.push(point)
        }
      }
      
      // Start from all edge pixels
      for (let x = 0; x < width; x++) {
        enqueue(x, 0)
        enqueue(x, height - 1)
      }
      for (let y = 1; y < height - 1; y++) {
        enqueue(0, y)
        enqueue(width - 1, y)
      }
      
      // Process flood-fill queue
      for (let i = 0; i < queue.length; i++) {
        const point = queue[i]
        const x = point % width
        const y = Math.floor(point / width)
        
        // Remove this background pixel
        data[point * 4 + 3] = 0
        
        // Enqueue neighbors
        enqueue(x - 1, y)
        enqueue(x + 1, y)
        enqueue(x, y - 1)
        enqueue(x, y + 1)
      }
      
      // Second pass: clean up anti-aliased edges (halo removal)
      // For pixels near removed background with partial alpha or similar color
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const point = y * width + x
          const idx = point * 4
          
          if (data[idx + 3] === 0) continue // Already transparent
          
          // Check if any neighbor was removed
          let hasRemovedNeighbor = false
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue
              const nx = x + dx
              const ny = y + dy
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nPoint = ny * width + nx
                if (visited[nPoint]) {
                  hasRemovedNeighbor = true
                  break
                }
              }
            }
            if (hasRemovedNeighbor) break
          }
          
          if (hasRemovedNeighbor) {
            const r = data[idx]
            const g = data[idx + 1]
            const b = data[idx + 2]
            const dist = colorDistance(r, g, b)
            
            // If this edge pixel is very close to background color, reduce or remove it
            if (dist < 25) {
              // Very close to background - remove completely
              data[idx + 3] = 0
            } else if (dist < 40) {
              // Somewhat close - reduce alpha to blend better
              const alphaReduction = 1 - (dist / 40)
              data[idx + 3] = Math.max(0, data[idx + 3] * (1 - alphaReduction * 0.7))
            }
          }
        }
      }
      
      context.putImageData(pixels, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = () => resolve(src)
    image.src = src
  })
}

interface MenuButtonProps {
  href: string
  image: string
  label: string
  className?: string
}

export default function MenuButton({ href, image, label, className = '' }: MenuButtonProps) {
  const [processedImage, setProcessedImage] = useState(image)

  useEffect(() => {
    let active = true
    removeMenuBackground(image).then((processed) => {
      if (active) setProcessedImage(processed)
    })
    return () => { active = false }
  }, [image])

  return (
    <Link 
      href={href} 
      className={`menu-button ${className}`}
      aria-label={label}
    >
      <div className="menu-button-image-wrapper">
        <img className="menu-button-image" src={processedImage} alt={label} />
      </div>
      <span className="menu-button-label">{label}</span>
    </Link>
  )
}
