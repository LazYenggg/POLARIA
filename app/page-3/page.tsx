'use client'

import { useEffect, useState } from 'react'
import PageNavigation from '@/components/PageNavigation'
import PageFooter from '@/components/PageFooter'
import './page-3.css'


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
        if (
          x < 0 ||
          y < 0 ||
          x >= width ||
          y >= height
        ) {
          return
        }

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

  textbox:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/scroll-textbox-gqfIYRBPlL3oSRYoZa3ttQAcZW8F1c.png',

  backward:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/backward_icon-V0I2FmyYTCT08HTIVFJHQW6DNSehWV.png',

  home:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/home_icon-cXYu3cywNAezOxlbp1bkBsbf7kYAZZ.png',

  forward:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/forward-1FNPr3VFE6ZK7Tgdv0v8tnT5EasxcQ.png',
}


/* =========================================================
   INSTRUCTIONS
   ========================================================= */

const instructions = [
  <>1. Berdoalah sebelum mengerjakan</>,

  <>2. Tulis nama dan kelas dikolom identitas</>,

  <>
    3. Baca dan ikuti setiap langkah kegiatan
    <br />
    dengan teliti
  </>,

  <>
    4. Diskusikan jawaban bersama teman dan
    <br />
    guru
  </>,

  <>
    5. Tanyakan pada guru jika ada yang belum
    <br />
    dipahami
  </>,
]


/* =========================================================
   BUTTON GUIDE
   ========================================================= */

const guideRows = [
  {
    key: 'backward' as const,
    label: 'Kembali ke halaman sebelumnya',
    alt: 'Tombol kembali',
  },

  {
    key: 'home' as const,
    label: 'Kembali ke menu utama',
    alt: 'Tombol menu utama',
  },

  {
    key: 'forward' as const,
    label: 'Lanjut ke halaman berikutnya',
    alt: 'Tombol lanjut',
  },
]


/* =========================================================
   PAGE 3
   ========================================================= */

export default function PageThree() {
  const [processedTextboxAssets, setProcessedTextboxAssets] =
    useState({
      background: assets.background,
      header: assets.header,
      classroom: assets.classroom,
      textbox: assets.textbox,
    })

  const [processedGuideIcons, setProcessedGuideIcons] =
    useState({
      backward: assets.backward,
      home: assets.home,
      forward: assets.forward,
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
      removeEdgeWhite(assets.textbox),
      removeEdgeWhite(assets.backward),
      removeEdgeWhite(assets.home),
      removeEdgeWhite(assets.forward),
    ]).then(
      ([
        background,
        header,
        classroom,
        textbox,
        backward,
        home,
        forward,
      ]) => {
        if (!active) return

        setProcessedTextboxAssets({
          background,
          header,
          classroom,
          textbox,
        })

        setProcessedGuideIcons({
          backward,
          home,
          forward,
        })
      }
    )

    return () => {
      active = false
    }
  }, [])


  return (
    <main className="page-shell guide-page-shell">

      <section
        className="guide-canvas"
        aria-label="Petunjuk penggunaan"
      >

        {/* =================================================
            BACKGROUND
           ================================================= */}

        <img
          className="guide-background"
          src={processedTextboxAssets.background}
          alt=""
          aria-hidden="true"
          draggable={false}
        />


        {/* =================================================
            CLASSROOM
           ================================================= */}

        <img
          className="guide-classroom"
          src={processedTextboxAssets.classroom}
          alt=""
          aria-hidden="true"
          draggable={false}
        />


        {/* =================================================
            HEADER
           ================================================= */}

        <img
          className="guide-header"
          src={processedTextboxAssets.header}
          alt="SMP Islam De Green Camp dan Kurikulum Merdeka"
          draggable={false}
        />


        {/* =================================================
            PAGE TITLE
           ================================================= */}

        <h1 className="guide-title">
          PETUNJUK PENGUNAAN
        </h1>


        {/* =================================================
            INSTRUCTIONS PANEL
           ================================================= */}

        <section
          className="guide-panel instructions-panel"
          aria-labelledby="instructions-title"
        >

          <img
            src={processedTextboxAssets.textbox}
            alt=""
            aria-hidden="true"
            draggable={false}
          />

          <div className="panel-copy">

            <h2
              id="instructions-title"
              className="sr-only"
            >
              Petunjuk penggunaan
            </h2>

            {instructions.map(
              (instruction, index) => (
                <p key={index}>
                  {instruction}
                </p>
              )
            )}

          </div>

        </section>


        {/* =================================================
            BUTTON GUIDE TITLE
           ================================================= */}

        <h2 className="guide-title guide-title-secondary">
          PANDUAN TOMBOL
        </h2>


        {/* =================================================
            BUTTON GUIDE PANEL
           ================================================= */}

        <section
          className="guide-panel buttons-panel"
          aria-labelledby="buttons-title"
        >

          <img
            src={processedTextboxAssets.textbox}
            alt=""
            aria-hidden="true"
            draggable={false}
          />

          <div className="panel-copy button-guide-copy">

            <h3
              id="buttons-title"
              className="sr-only"
            >
              Panduan tombol
            </h3>

            {guideRows.map((row) => (
              <div
                className="guide-row"
                key={row.key}
              >

                <span className="guide-icon-box">

                  <img
                    src={processedGuideIcons[row.key]}
                    alt={row.alt}
                    draggable={false}
                  />

                </span>

                <span>
                  {row.label}
                </span>

              </div>
            ))}

          </div>

        </section>


        {/* =================================================
            NAVIGATION

            Z-INDEX 30:
            berada di atas PageFooter z-index 20.
           ================================================= */}

        <PageNavigation
          variant="dual"
          backHref="/page-2"
          backLabel="Kembali ke halaman identitas penyusun"
          forwardHref="/page-4"
          forwardLabel="Lanjut ke halaman berikutnya"
          className="guide-nav"
          processTransparency={true}
        />


        {/* =================================================
            FOOTER

            PageFooter sendiri menggunakan z-index 20.
           ================================================= */}

        <PageFooter />

      </section>

    </main>
  )
}