export const navigation = [
  { label: 'Beranda', path: '/' },
  { label: 'Tutorial', path: '/tutorial' },
  { label: 'Proyek', path: '/project' },
  { label: 'Workshop', path: '/workshop' },
  { label: 'Tentang Kami', path: '/partner' },
  { label: 'Kontak', path: '/kontak' },
];

export const accessSteps = [
  { title: 'Daftar', text: 'Calon pengguna mengisi form akses, workshop, demo, atau kerja sama.' },
  { title: 'Pembayaran', text: 'Admin mengonfirmasi program dan pembayaran sesuai kebutuhan pengguna.' },
  { title: 'Token IDE', text: 'Pengguna menerima token untuk membuka akses ArduFlow IDE.' },
  { title: 'Masuk IDE', text: 'Pengguna yang sudah memiliki token dapat mulai belajar dan membuat project.' },
];

export const problems = [
  'Pemula bingung harus mulai belajar IoT dari mana.',
  'Coding Arduino terasa sulit untuk siswa atau peserta baru.',
  'Project IoT membutuhkan banyak komponen, library, dan konfigurasi.',
  'Sekolah atau komunitas membutuhkan media belajar yang mudah dipandu.',
  'Pengguna membutuhkan contoh project yang bisa langsung dipelajari.',
];

export const programs = [
  { title: 'Workshop Dasar Arduino', category: 'Workshop', text: 'Kelas pengenalan Arduino, wiring, sensor, aktuator, dan upload program.' },
  { title: 'Training IoT Sekolah', category: 'Training', text: 'Program belajar terstruktur untuk kelas, guru, dan laboratorium sekolah.' },
  { title: 'Demo ArduFlow IDE', category: 'Demo', text: 'Sesi pengenalan IDE visual dan alur mendapatkan token akses.' },
];

export const tutorials = [
  { title: 'Mulai dari LED', level: 'Pemula', text: 'Belajar output digital dan logika sederhana menggunakan LED.' },
  { title: 'Sensor Suhu dan Kelembapan', level: 'Dasar', text: 'Membaca sensor dan menampilkan data ke serial monitor.' },
  { title: 'Smart Home Mini', level: 'Menengah', text: 'Menggabungkan sensor, relay, dan kontrol otomatis sederhana.' },
];

export const projects = [
  { title: 'Lampu Otomatis', type: 'Arduino', text: 'Kontrol lampu berdasarkan sensor cahaya.' },
  { title: 'Monitoring Ruangan', type: 'IoT', text: 'Dashboard sederhana untuk membaca kondisi ruangan.' },
  { title: 'Smart Door Alert', type: 'Smart Home', text: 'Notifikasi pintu terbuka menggunakan sensor magnet.' },
];

export const partners = ['Sekolah', 'Komunitas IoT', 'Laboratorium', 'Penyelenggara Workshop'];
