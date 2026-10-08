'use client'

import { useEffect, useState } from 'react'

function removeEdgeWhite(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', {
        willReadFrequently: true,
      })

      if (!ctx) {
        resolve(src)
        return
      }

      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight

      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      )

      const { data, width, height } = imageData

      const visited = new Uint8Array(width * height)
      const queue: number[] = []

      const isWhite = (index: number) => {
        return (
          data[index] >= 245 &&
          data[index + 1] >= 245 &&
          data[index + 2] >= 245 &&
          data[index + 3] > 0
        )
      }

      const enqueue = (x: number, y: number) => {
        if (
          x < 0 ||
          y < 0 ||
          x >= width ||
          y >= height
        ) {
          return
        }

        const point = y * width + x

        if (visited[point]) return

        const pixelIndex = point * 4

        if (!isWhite(pixelIndex)) return

        visited[point] = 1
        queue.push(point)
      }

      // Semua titik di tepi gambar
      for (let x = 0; x < width; x += 1) {
        enqueue(x, 0)
        enqueue(x, height - 1)
      }

      for (let y = 0; y < height; y += 1) {
        enqueue(0, y)
        enqueue(width - 1, y)
      }

      // Flood fill putih dari tepi
      let pointer = 0

      while (pointer < queue.length) {
        const point = queue[pointer]
        pointer += 1

        const pixelIndex = point * 4
        data[pixelIndex + 3] = 0

        const x = point % width
        const y = Math.floor(point / width)

        enqueue(x + 1, y)
        enqueue(x - 1, y)
        enqueue(x, y + 1)
        enqueue(x, y - 1)
      }

      ctx.putImageData(imageData, 0, 0)

      resolve(canvas.toDataURL('image/png'))
    }

    img.onerror = () => {
      reject(new Error('Gagal memuat footer.png'))
    }

    img.src = src
  })
}

export default function PageFooter() {
  const [footerSrc, setFooterSrc] = useState('/assets/footer.png')

  useEffect(() => {
    let active = true

    removeEdgeWhite('/assets/footer.png')
      .then((processed) => {
        if (active) {
          setFooterSrc(processed)
        }
      })
      .catch((error) => {
        console.error('Gagal memproses footer:', error)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <img
      src={footerSrc}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="page-footer-overlay"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        objectFit: 'fill',
        pointerEvents: 'none',
        zIndex: 20,
        transform: 'translateY(6%)',
      }}
    />
  )
}