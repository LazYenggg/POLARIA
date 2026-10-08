'use client'

import { useEffect, useState } from 'react'
import PageNavigation from '@/components/PageNavigation'
import PageFooter from '@/components/PageFooter'
import './page-2.css'


/* =========================================================
   REMOVE EDGE WHITE
   Menghapus putih yang terhubung ke sisi luar PNG,
   tetapi mempertahankan putih yang merupakan bagian
   dari artwork parchment.
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
         Mulai dari seluruh sisi gambar
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
   DATA
   ========================================================= */

const author = {
  name: 'Maria Suhaila',
  nim: '2303020058',
  programStudi: 'Pendidikan Matematika',
  photo: '/assets/fotomaria.jpeg',
}

const lecturer = {
  name: 'Aang Yudho Prastowo, M.Pd.',
  nidn: '199103242022031007',
  programStudi: 'Pendidikan Matematika',
  photo: '/assets/fotodosen.jpeg',
}


/* =========================================================
   ASSETS
   ========================================================= */

const assets = {
  background: '/assets/Background.png',
  header: '/assets/header.png',
  classroom: '/assets/kids_and_teacher.png',
  scrollTextbox: '/assets/scroll-textbox.png',
}


/* =========================================================
   PROFILE PANEL
   ========================================================= */

function ProfilePanel({
  title,
  profile,
  identifierLabel,
  identifierValue,
  scrollSrc,
}: {
  title: string
  profile: {
    name: string
    programStudi: string
    photo: string
  }
  identifierLabel: string
  identifierValue: string
  scrollSrc: string
}) {
  return (
    <section
      className={`profile-panel ${
        title === 'PENYUSUN'
          ? 'author-panel'
          : 'lecturer-panel'
      }`}
      aria-label={title}
    >

      {/* =================================================
          PARCHMENT
         ================================================= */}

      <img
        className="profile-scroll"
        src={scrollSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
      />


      {/* =================================================
          CONTENT
         ================================================= */}

      <div className="profile-panel-content">

        <h2 className="profile-panel-title">
          {title}
        </h2>


        <div className="profile-content-grid">

          {/* FOTO */}

          <div className="profile-photo-frame">
            <img
              className="profile-photo"
              src={profile.photo}
              alt={`Foto ${profile.name}`}
              draggable={false}
            />
          </div>


          {/* IDENTITAS */}

          <dl className="profile-info">

            <div className="profile-field">
              <dt>Nama</dt>
              <dd>{profile.name}</dd>
            </div>

            <div className="profile-field">
              <dt>{identifierLabel}</dt>
              <dd>{identifierValue}</dd>
            </div>

            <div className="profile-field">
              <dt>Program Studi</dt>
              <dd>{profile.programStudi}</dd>
            </div>

          </dl>

        </div>

      </div>

    </section>
  )
}


/* =========================================================
   PAGE 2
   ========================================================= */

export default function PageTwo() {
  const [
    processedScrollTextbox,
    setProcessedScrollTextbox,
  ] = useState(assets.scrollTextbox)


  /* =======================================================
     PROCESS SCROLL TEXTBOX
     ======================================================= */

  useEffect(() => {
    let active = true

    removeEdgeWhite(assets.scrollTextbox)
      .then((processed) => {
        if (!active) return

        setProcessedScrollTextbox(processed)
      })

    return () => {
      active = false
    }
  }, [])


  return (
    <main className="page-shell author-page-shell">

      <section
        className="author-canvas"
        aria-label="Identitas penyusun dan dosen pembimbing"
      >

        {/* =================================================
            BACKGROUND
           ================================================= */}

        <img
          className="author-background"
          src={assets.background}
          alt=""
          aria-hidden="true"
          draggable={false}
        />


        {/* =================================================
            CLASSROOM
           ================================================= */}

        <img
          className="author-classroom"
          src={assets.classroom}
          alt=""
          aria-hidden="true"
          draggable={false}
        />


        {/* =================================================
            HEADER
           ================================================= */}

        <img
          className="author-header"
          src={assets.header}
          alt="SMP Islam De Green Camp dan Kurikulum Merdeka"
          draggable={false}
        />


        {/* =================================================
            PAGE TITLE
           ================================================= */}

        <h1 className="author-title">
          IDENTITAS PENYUSUN
        </h1>


        {/* =================================================
            PENYUSUN
           ================================================= */}

        <ProfilePanel
          title="PENYUSUN"
          profile={author}
          identifierLabel="NIM"
          identifierValue={author.nim}
          scrollSrc={processedScrollTextbox}
        />


        {/* =================================================
            DOSEN PEMBIMBING
           ================================================= */}

        <ProfilePanel
          title="DOSEN PEMBIMBING"
          profile={lecturer}
          identifierLabel="NIP"
          identifierValue={lecturer.nidn}
          scrollSrc={processedScrollTextbox}
        />


        {/* =================================================
            FOOTER
           ================================================= */}

        <PageFooter />


        {/* =================================================
            FORWARD NAVIGATION

            Tetap menggunakan shared PageNavigation.
            processTransparency = true agar PNG tombol
            tidak membawa background putih.
           ================================================= */}

        <PageNavigation
          variant="forward-only"
          forwardHref="/page-3"
          forwardLabel="Lanjut ke halaman berikutnya"
          processTransparency={true}
          className="author-forward-nav"
        />

      </section>

    </main>
  )
}