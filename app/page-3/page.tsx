
'use client'

import { useEffect, useState } from 'react'
import PageNavigation from '@/components/PageNavigation'
import PageFooter from '@/components/PageFooter'
import './page-3.css'

const assets = {
  background:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Background-AYVfyfZ2jrtRlPSmsDhD65flMPS5do.png',

  header:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fixed_header-R8NOtrcQNhvGZ32Db36AgdJcm2oZx2.png',

  classroom:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/kids_and_teacher-4k6GLUhdp0BzqVRowUCxBPFL0ydEEk.png',

  guide: '/assets/page-3-guide.png',
}

/**
 * Menghapus piksel putih yang terhubung ke tepi luar gambar.
 * Area putih yang terisolasi di dalam ilustrasi dipertahankan.
 */
function removeEdgeWhite(src: string): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = image.naturalWidth
        canvas.height = image.naturalHeight

        const context = canvas.getContext('2d', {
          willReadFrequently: true,
        })

        if (!context) {
          resolve(src)
          return
        }

        context.drawImage(image, 0, 0)

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        )

        const { data, width, height } = imageData
        const visited = new Uint8Array(width * height)
        const queue = new Uint32Array(width * height)

        let queueStart = 0
        let queueEnd = 0

        const isEdgeWhite = (point: number) => {
          const index = point * 4

          const red = data[index]
          const green = data[index + 1]
          const blue = data[index + 2]
          const alpha = data[index + 3]

          const minimum = Math.min(red, green, blue)
          const maximum = Math.max(red, green, blue)

          return (
            alpha > 0 &&
            minimum >= 242 &&
            maximum - minimum <= 20
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

          if (
            visited[point] ||
            !isEdgeWhite(point)
          ) {
            return
          }

          visited[point] = 1
          queue[queueEnd] = point
          queueEnd += 1
        }

        // Mulai dari seluruh sisi gambar.
        for (let x = 0; x < width; x += 1) {
          enqueue(x, 0)
          enqueue(x, height - 1)
        }

        for (let y = 1; y < height - 1; y += 1) {
          enqueue(0, y)
          enqueue(width - 1, y)
        }

        // Flood fill empat arah.
        while (queueStart < queueEnd) {
          const point = queue[queueStart]
          queueStart += 1

          data[point * 4 + 3] = 0

          const x = point % width
          const y = Math.floor(point / width)

          if (x > 0) enqueue(x - 1, y)
          if (x < width - 1) enqueue(x + 1, y)
          if (y > 0) enqueue(x, y - 1)
          if (y < height - 1) enqueue(x, y + 1)
        }

        context.putImageData(imageData, 0, 0)

        resolve(canvas.toDataURL('image/png'))
      } catch (error) {
        console.error(
          '[POLARIA Page 3] Flood fill gagal:',
          error
        )

        resolve(src)
      }
    }

    image.onerror = () => resolve(src)
    image.src = src
  })
}

export default function PageThree() {
  const [processedAssets, setProcessedAssets] =
    useState(assets)

  useEffect(() => {
    let active = true

    Promise.all([
      removeEdgeWhite(assets.background),
      removeEdgeWhite(assets.header),
      removeEdgeWhite(assets.classroom),
      removeEdgeWhite(assets.guide),
    ])
      .then(([background, header, classroom, guide]) => {
        if (!active) return

        setProcessedAssets({
          background,
          header,
          classroom,
          guide,
        })
      })
      .catch((error) => {
        console.error(
          '[POLARIA Page 3] Gagal memproses assets:',
          error
        )
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <main className="page-shell guide-page-shell">
      <section
        className="guide-canvas"
        aria-label="Petunjuk penggunaan POLARIA"
      >
        {/* Background asli POLARIA */}
        <img
          className="guide-background"
          src={processedAssets.background}
          alt=""
          aria-hidden="true"
          draggable={false}
        />

        {/* Dekorasi kelas asli */}
        <img
          className="guide-classroom"
          src={processedAssets.classroom}
          alt=""
          aria-hidden="true"
          draggable={false}
        />

        {/* HEADER ASLI — TETAP DIPERTAHANKAN */}
        <img
          className="guide-header"
          src={processedAssets.header}
          alt="SMP Islam De Green Camp dan Kurikulum Merdeka"
          draggable={false}
        />

        {/* Artwork baru, sedikit diperkecil */}
        <div className="guide-artwork-frame">
          <img
            className="guide-artwork"
            src={processedAssets.guide}
            alt="Petunjuk penggunaan dan panduan tombol POLARIA"
            draggable={false}
          />
        </div>

        {/* Navigasi asli — tetap berfungsi */}
        <PageNavigation
          variant="dual"
          backHref="/page-2"
          backLabel="Kembali ke halaman identitas penyusun"
          forwardHref="/page-4"
          forwardLabel="Lanjut ke halaman identitas kelompok"
          className="guide-nav"
          processTransparency={true}
        />

        {/* Footer asli */}
        <PageFooter />
      </section>
    </main>
  )
}
