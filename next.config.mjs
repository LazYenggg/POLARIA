/** @type {import('next').NextConfig} */

const studentPageRoutes = [
  {
    oldPath: '/page-2',
    cleanPath: '/identitas-penyusun',
  },
  {
    oldPath: '/page-3',
    cleanPath: '/petunjuk-penggunaan',
  },
  {
    oldPath: '/page-4',
    cleanPath: '/identitas-kelompok',
  },
  {
    oldPath: '/page-5',
    cleanPath: '/menu',
  },
  {
    oldPath: '/page-6',
    cleanPath: '/tujuan-pembelajaran',
  },
  {
    oldPath: '/page-7',
    cleanPath: '/aritmatika-a',
  },
  {
    oldPath: '/page-8',
    cleanPath: '/aritmatika-b',
  },
  {
    oldPath: '/page-9',
    cleanPath: '/aritmatika-c',
  },
  {
    oldPath: '/page-10',
    cleanPath: '/geometri-a',
  },
  {
    oldPath: '/page-11',
    cleanPath: '/geometri-b',
  },
  {
    oldPath: '/page-12',
    cleanPath: '/geometri-c',
  },
  {
    oldPath: '/page-13',
    cleanPath: '/evaluasi',
  },
  {
    oldPath: '/page-14',
    cleanPath: '/rangkuman',
  },
]

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  // URL lama diarahkan ke URL yang lebih rapi.
  async redirects() {
    return [
      {
        source: '/page-1',
        destination: '/',
        permanent: false,
      },

      ...studentPageRoutes.map(
        ({ oldPath, cleanPath }) => ({
          source: oldPath,
          destination: cleanPath,
          permanent: false,
        })
      ),
    ]
  },

  // URL rapi tetap menggunakan halaman App Router yang sudah ada.
  async rewrites() {
    return {
      beforeFiles: studentPageRoutes.map(
        ({ oldPath, cleanPath }) => ({
          source: cleanPath,
          destination: oldPath,
        })
      ),
    }
  },
}

export default nextConfig