# POLARIA CMS + Admin + Tes Ulang

## 1. Install dependency

pnpm add firebase-admin@14.5.0

## 2. Firebase Authentication

Aktifkan provider `Email/Password`.
Buat satu user admin dari Firebase Console Authentication > Users.
Pastikan email admin sudah terverifikasi.

## 3. Service account untuk server

Firebase Console > Project settings > Service accounts > Generate new private key.
Jangan commit file JSON/private key ke Git.

Masukkan tiga nilai berikut ke `.env.local`:

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

Tambahkan juga:

POLARIA_ADMIN_EMAIL=alamat-email-admin
NEXT_PUBLIC_APP_URL=http://localhost:3000

Untuk deployment, ganti `NEXT_PUBLIC_APP_URL` dengan URL aplikasi produksi.

## 4. Beri role admin

Setelah user dibuat di Firebase Authentication dan emailnya terverifikasi:

pnpm admin:grant

Script memakai `POLARIA_ADMIN_EMAIL` dan Firebase Admin credentials untuk menambahkan custom claim `admin: true`.

Untuk mencabut role:

pnpm admin:revoke

Setelah grant, login ulang di `/cms/login` agar token baru membawa claim admin.

## 5. Routes

/cms/login              Login admin
/cms                    Dashboard submission
/cms/submissions/:id    Detail semua jawaban

## 6. Tes ulang

Admin membuka detail submission lalu klik `Tes Ulang`.
Server membuat token sekali pakai yang berlaku 24 jam dan menghasilkan URL:

/page-4?retry=TOKEN

Link dikirim ke siswa.
Saat dibuka, sesi anonymous siswa menebus token melalui server.
Server membuat submission baru dengan identitas kelompok yang sama, lalu Page 4 mengaktifkan submission baru tersebut.
Submission lama tetap utuh.

Token hanya dapat digunakan sekali.

## 7. Routing guard siswa

/page-4 tanpa session -> boleh dibuka untuk membuat submission.
/page-4 dengan session valid -> otomatis ke /page-5.
/page-5 s.d. /page-14 tanpa session valid -> otomatis ke /page-4.
/page-4?retry=TOKEN -> dilewatkan agar token dapat ditebus.

Jadi membuka URL halaman aktivitas secara langsung tanpa submission tidak dapat melewati identitas kelompok.

## 8. Firestore rules

Rules submission yang sudah ada tetap dipakai.
`retrySessions` tidak diberikan akses client dan tetap ditolak oleh catch-all rule.
Operasi admin/tes ulang berlangsung lewat server menggunakan Firebase Admin SDK.

## 9. Pengujian incognito

Gunakan jendela incognito untuk alur siswa agar localStorage dan anonymous auth dimulai dari sesi baru.

Urutan uji:

1. / -> Page 2 -> Page 3 -> Page 4.
2. Isi identitas -> Page 5.
3. Buka Page 4 langsung -> harus dilempar ke Page 5.
4. Buka Page 7-14 langsung tanpa submission di incognito baru -> harus ke Page 4.
5. Isi Page 7-9 -> modal submit Page 9 -> setelah submit kembali ke Page 5.
6. Masuk lagi ke Page 9 -> semua jawaban harus read-only.
7. Ulangi untuk Page 10-12.
8. Isi Page 13 -> `Unduh Rangkuman` -> modal -> `Kumpulkan & Unduh` -> Page 14.
9. Kembali ke Page 13 -> jawaban harus tetap tampil dan read-only.
10. Login /cms/login -> submission harus muncul.
11. Buka detail -> semua jawaban terlihat.
12. Klik `Tes Ulang` -> salin link.
13. Buka link tes ulang dari incognito siswa -> submission baru terbentuk.
14. Submission lama tetap terlihat di CMS.
