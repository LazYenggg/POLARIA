'use client'

import { useEffect, useState } from 'react'
import './page-14.css'
import PageFooter from '@/components/PageFooter'


/* =========================================================
   REMOVE EDGE WHITE
   Menghapus putih yang terhubung dengan sisi luar PNG
   untuk asset standar halaman.
   ========================================================= */

function removeEdgeWhite(src: string) {
  return new Promise<string>((resolve) => {
    const image = new Image()

    image.crossOrigin = 'anonymous'

    image.onload = () => {
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

      const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      )

      const { data, width, height } = pixels

      const visited = new Uint8Array(width * height)
      const queue: number[] = []

      const isEdgeWhite = (point: number) => {
        const index = point * 4

        return (
          data[index] > 242 &&
          data[index + 1] > 242 &&
          data[index + 2] > 242 &&
          data[index + 3] > 0
        )
      }

      const enqueue = (x: number, y: number) => {
        const point = y * width + x

        if (!visited[point] && isEdgeWhite(point)) {
          visited[point] = 1
          queue.push(point)
        }
      }

      /* -----------------------------------------------------
         Start dari seluruh sisi gambar
         ----------------------------------------------------- */

      for (let x = 0; x < width; x += 1) {
        enqueue(x, 0)
        enqueue(x, height - 1)
      }

      for (let y = 1; y < height - 1; y += 1) {
        enqueue(0, y)
        enqueue(width - 1, y)
      }

      /* -----------------------------------------------------
         Flood fill
         ----------------------------------------------------- */

      for (
        let index = 0;
        index < queue.length;
        index += 1
      ) {
        const point = queue[index]

        data[point * 4 + 3] = 0

        const x = point % width
        const y = Math.floor(point / width)

        if (x > 0) {
          enqueue(x - 1, y)
        }

        if (x < width - 1) {
          enqueue(x + 1, y)
        }

        if (y > 0) {
          enqueue(x, y - 1)
        }

        if (y < height - 1) {
          enqueue(x, y + 1)
        }
      }

      context.putImageData(pixels, 0, 0)

      resolve(canvas.toDataURL('image/png'))
    }

    image.onerror = () => {
      resolve(src)
    }

    image.src = src
  })
}


/* =========================================================
   ASSETS
   ========================================================= */

const assets = {
  background: '/assets/Background.png',
  header: '/assets/header.png',
  classroom: '/assets/kids_and_teacher.png',
  summary: '/assets/page-14-summary.png',
  homeIcon: '/assets/home_icon.png',
}


/* =========================================================
   PAGE 14 — RANGKUMAN MATERI
   ========================================================= */

export default function PageFourteen() {
  const [processedAssets, setProcessedAssets] = useState({
    background: assets.background,
    header: assets.header,
    classroom: assets.classroom,
    homeIcon: assets.homeIcon,
  })


  /* =======================================================
     PROCESS STANDARD PAGE ASSETS
     ======================================================= */

  useEffect(() => {
    let active = true

    Promise.all([
      removeEdgeWhite(assets.background),
      removeEdgeWhite(assets.header),
      removeEdgeWhite(assets.classroom),
      removeEdgeWhite(assets.homeIcon),
    ]).then(([background, header, classroom, homeIcon]) => {
      if (!active) return

      setProcessedAssets({
        background,
        header,
        classroom,
        homeIcon,
      })
    })

    return () => {
      active = false
    }
  }, [])


  /* =======================================================
     HOME
     =======================================================

     Hanya satu tombol navigation:
     Home -> /page-5

     Dibuat mengikuti pola Page 6 agar tetap berada
     di tengah dan di atas footer.
     ======================================================= */

  const handleHome = () => {
    window.location.href = '/page-5'
  }


  return (
    <main className="page-shell page-fourteen-shell">

      <section
        className="page-fourteen-canvas"
        aria-label="Rangkuman Materi POLARIA"
      >

        {/* =================================================
            BACKGROUND
            ================================================= */}

        <img
          className="page-fourteen-background"
          src={processedAssets.background}
          alt=""
          aria-hidden="true"
        />


        {/* =================================================
            CLASSROOM DECORATION
            ================================================= */}

        <img
          className="page-fourteen-classroom"
          src={processedAssets.classroom}
          alt=""
          aria-hidden="true"
          draggable={false}
        />


        {/* =================================================
            HEADER
            ================================================= */}

        <img
          className="page-fourteen-header"
          src={processedAssets.header}
          alt="SMP Islam De Green Camp dan Kurikulum Merdeka"
          draggable={false}
        />


        {/* =================================================
            SUMMARY ARTWORK

            Ukuran mengikuti halaman terakhir pada
            full_design.pdf.

            Reference image approximately:
            left   = 10.5%
            top    = 8%
            width  = 78.8%
            ================================================= */}

        <img
          className="page-fourteen-summary"
          src={assets.summary}
          alt="Rangkuman Materi Barisan Aritmatika dan Barisan Geometri"
          draggable={false}
        />


        {/* =================================================
            HOME BUTTON
            ================================================= */}

        <button
          type="button"
          className="page-fourteen-home-button"
          onClick={handleHome}
          aria-label="Kembali ke menu utama"
        >
          <img
            className="page-fourteen-home-icon"
            src={processedAssets.homeIcon}
            alt="Kembali ke menu utama"
            draggable={false}
          />
        </button>


        <PageFooter />

      </section>

    </main>
  )
}
