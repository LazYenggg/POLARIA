'use client'

import { useEffect, useState } from 'react'
import MenuButton from '@/components/MenuButton'
import PageFooter from '@/components/PageFooter'
import './page-5.css'


/* =========================================================
   REMOVE EDGE WHITE
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

      for (let x = 0; x < width; x += 1) {
        enqueue(x, 0)
        enqueue(x, height - 1)
      }

      for (let y = 1; y < height - 1; y += 1) {
        enqueue(0, y)
        enqueue(width - 1, y)
      }

      for (let index = 0; index < queue.length; index += 1) {
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
  background:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Background-AYVfyfZ2jrtRlPSmsDhD65flMPS5do.png',

  header:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fixed_header-R8NOtrcQNhvGZ32Db36AgdJcm2oZx2.png',

  classroom:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/kids_and_teacher-4k6GLUhdp0BzqVRowUCxBPFL0ydEEk.png',

  tujuanPembelajaran:
    '/assets/tujuan_pembelajaran.png',

  barisanAritmatika:
    '/assets/barisan_aritmatika.png',

  barisanGeometri:
    '/assets/barisan_geomtri.png',

  evaluasi:
    '/assets/evaluasi.png',
}


/* =========================================================
   MENU ITEMS
   ========================================================= */

const menuItems = [
  {
    key: 'tujuan',

    image: assets.tujuanPembelajaran,

    label: 'Tujuan Pembelajaran',

    href: '/page-6',

    className: 'menu-tujuan',
  },

  {
    key: 'aritmatika',

    image: assets.barisanAritmatika,

    label: 'Barisan Aritmatika',

    href: '/page-7',

    className: 'menu-aritmatika',
  },

  {
    key: 'geometri',

    image: assets.barisanGeometri,

    label: 'Barisan Geometri',

    href: '/page-10',

    className: 'menu-geometri',
  },

  {
    key: 'evaluasi',

    image: assets.evaluasi,

    label: 'Evaluasi',

    href: '/page-13',

    className: 'menu-evaluasi',
  },
]


/* =========================================================
   PAGE FIVE
   ========================================================= */

export default function PageFive() {
  const [processedAssets, setProcessedAssets] =
    useState({
      background: assets.background,
      header: assets.header,
      classroom: assets.classroom,
    })


  /* =======================================================
     PROCESS ASSETS ONLY

     TIDAK ADA ROUTE GUARD.
     TIDAK ADA LOCALSTORAGE CHECK.
     TIDAK ADA REDIRECT.
     ======================================================= */

  useEffect(() => {
    let active = true

    Promise.all([
      removeEdgeWhite(assets.background),
      removeEdgeWhite(assets.header),
      removeEdgeWhite(assets.classroom),
    ]).then(
      ([background, header, classroom]) => {
        if (!active) return

        setProcessedAssets({
          background,
          header,
          classroom,
        })
      }
    )

    return () => {
      active = false
    }
  }, [])


  return (
    <main className="menu-page-shell">

      <section
        className="menu-canvas"
        aria-label="Menu utama POLARIA"
      >

        {/* =================================================
            BACKGROUND
            ================================================= */}

        <img
          className="menu-background"
          src={processedAssets.background}
          alt=""
        />


        {/* =================================================
            CLASSROOM DECORATION
            ================================================= */}

        <img
          className="menu-classroom"
          src={processedAssets.classroom}
          alt=""
          aria-hidden="true"
        />


        {/* =================================================
            HEADER
            ================================================= */}

        <img
          className="menu-header"
          src={processedAssets.header}
          alt="SMP Islam De Green Camp dan Kurikulum Merdeka"
        />


        {/* =================================================
            TITLE
            ================================================= */}

        <h1 className="menu-title">
          MENU
        </h1>


        {/* =================================================
            MENU
            ================================================= */}

        <nav
          className="menu-buttons"
          aria-label="Pilihan menu pembelajaran"
        >
          {menuItems.map((item) => (
            <MenuButton
              key={item.key}
              href={item.href}
              image={item.image}
              label={item.label}
              className={item.className}
            />
          ))}
        </nav>

        <PageFooter />

      </section>

    </main>
  )
}