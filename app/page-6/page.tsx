'use client'

import { useEffect, useState } from 'react'
import './page-6.css'
import PageFooter from '@/components/PageFooter';


/* =========================================================
   REMOVE EDGE WHITE
   Menghapus putih yang terhubung dengan sisi luar PNG,
   tetapi mempertahankan putih yang merupakan bagian artwork.
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

      resolve(
        canvas.toDataURL('image/png')
      )
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
  background:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Background-AYVfyfZ2jrtRlPSmsDhD65flMPS5do.png',

  header:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fixed_header-R8NOtrcQNhvGZ32Db36AgdJcm2oZx2.png',

  classroom:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/kids_and_teacher-4k6GLUhdp0BzqVRowUCxBPFL0ydEEk.png',

  scrollTextbox:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/scroll-textbox-gqfIYRBPlL3oSRYoZa3ttQAcZW8F1c.png',

  homeIcon:
    '/assets/home_icon.png',
}


/* =========================================================
   PAGE 6
   ========================================================= */

export default function PageSix() {
  const [processedAssets, setProcessedAssets] =
    useState({
      background: assets.background,
      header: assets.header,
      classroom: assets.classroom,
      scrollTextbox: assets.scrollTextbox,
      homeIcon: assets.homeIcon,
    })


  /* =======================================================
     PROCESS ASSETS
     ======================================================= */

  useEffect(() => {
    let active = true

    Promise.all([
      removeEdgeWhite(assets.background),
      removeEdgeWhite(assets.header),
      removeEdgeWhite(assets.classroom),
      removeEdgeWhite(assets.scrollTextbox),
      removeEdgeWhite(assets.homeIcon),
    ]).then(
      ([
        background,
        header,
        classroom,
        scrollTextbox,
        homeIcon,
      ]) => {
        if (!active) return

        setProcessedAssets({
          background,
          header,
          classroom,
          scrollTextbox,
          homeIcon,
        })
      }
    )

    return () => {
      active = false
    }
  }, [])


  /* =======================================================
     HOME
     ======================================================= */

  const handleHome = () => {
    window.location.href = '/page-5'
  }


  return (
    <main className="page-shell learning-objective-page-shell">

      <section
        className="learning-objective-canvas"
        aria-label="Tujuan Pembelajaran"
      >

        {/* =================================================
            BACKGROUND
            ================================================= */}

        <img
          className="learning-objective-background"
          src={processedAssets.background}
          alt=""
          aria-hidden="true"
        />


        {/* =================================================
            CLASSROOM DECORATION
            ================================================= */}

        <img
          className="learning-objective-classroom"
          src={processedAssets.classroom}
          alt=""
          aria-hidden="true"
          draggable={false}
        />


        {/* =================================================
            HEADER
            ================================================= */}

        <img
          className="learning-objective-header"
          src={processedAssets.header}
          alt="SMP Islam De Green Camp dan Kurikulum Merdeka"
          draggable={false}
        />


        {/* =================================================
            TITLE
            ================================================= */}

        <h1 className="learning-objective-title">
          TUJUAN PEMBELAJARAN
        </h1>


        {/* =================================================
            PARCHMENT / CONTENT
            ================================================= */}

        <div className="learning-objective-card">

          <img
            className="learning-objective-parchment"
            src={processedAssets.scrollTextbox}
            alt=""
            aria-hidden="true"
            draggable={false}
          />

          <div className="learning-objective-text">
            <p>
              Siswa mampu menentukan rumus suku ke-n dari suatu
              pola bilangan sederhana dan menggunakannya untuk
              memprediksi suku berikutnya
            </p>
          </div>

        </div>


        {/* =================================================
            HOME BUTTON

            Hanya satu navigation:
            Home → Page 5

            Posisi:
            top: 91.5%
            ================================================= */}

        <button
          type="button"
          className="learning-objective-home-button"
          onClick={handleHome}
          aria-label="Kembali ke menu utama"
        >
          <img
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