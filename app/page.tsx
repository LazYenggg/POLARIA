'use client'

import Link from 'next/link'

const assets = {
  background:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Background-AYVfyfZ2jrtRlPSmsDhD65flMPS5do.png',
  header:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fixed_header-R8NOtrcQNhvGZ32Db36AgdJcm2oZx2.png',
  title:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/polaria_title-RofSqHMSFg5s9iIk79HKCMGTOL9aWM.png',
  leaf:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/first_page_leaf-QCjFUz44iC4c0Cc73AMBnQfHfm0XAE.png',
  classroom:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/kids_and_teacher-4k6GLUhdp0BzqVRowUCxBPFL0ydEEk.png',
  flower:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/first_pages_sunflower-0iljBnBkNCKR1qnUVuG7ywc4bADdhA.png',
  play:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/play_button-PAFtWvkSdTrYEau6JHGVpQMK1PkvYs.png',
}

export default function Page() {
  return (
    <main className="page-shell">
      <section className="design-canvas" aria-label="POLARIA halaman judul">
        <img className="background" src={assets.background} alt="" />
        <img className="header" src={assets.header} alt="SMP Islam De Green Camp dan Kurikulum Merdeka" />

        <img className="title-art" src={assets.title} alt="POLARIA — Pola Bilangan Aksi Ceria" />

        <div className="lesson-label">
          Menemukan rumus suku ke-n<br />
          melalui masalah kontekstual
        </div>

        <img className="classroom" src={assets.classroom} alt="Tiga siswa belajar bersama di dalam kelas" />
        <img className="flower" src={assets.flower} alt="Bunga matahari dalam pot" />

        <Link className="start-button" href="/page-2" aria-label="Mulai belajar">
          <img src={assets.play} alt="PLAY" />
        </Link>
      </section>
    </main>
  )
}

