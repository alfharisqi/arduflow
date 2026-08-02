<<<<<<< HEAD
=======
import facebookIcon from '../assets/icons/icon-facebook-1.svg';
import instagramIcon from '../assets/icons/icon-instagram-1.svg';
import mailIcon from '../assets/icons/icon-mail-1.svg';
import mapPinIcon from '../assets/icons/icon-map-pin-1.svg';
import phoneIcon from '../assets/icons/icon-phone-1.svg';
import twitterIcon from '../assets/icons/icon-twitter-1.svg';
import youtubeIcon from '../assets/icons/icon-youtube-1.svg';

>>>>>>> main
const footerMenus = [
  {
    title: 'Menu',
    links: [
      ['Beranda', '/'],
      ['Tutorial', '/tutorial'],
      ['Proyek', '/project'],
<<<<<<< HEAD
      ['Program / Workshop', '/program'],
=======
      ['Program / Workshop', '/workshop'],
>>>>>>> main
      ['Tentang Kami', '/tentang-kami'],
      ['Kontak', '/kontak'],
    ],
  },
  {
    title: 'Tutorial',
    links: [
      ['Apa itu Arduflow', '/tutorial'],
      ['Cara daftar', '/akses'],
      ['Cara masuk IDE', '/ide'],
      ['Tutorial LED', '/tutorial'],
      ['Tutorial Sensor', '/tutorial'],
      ['Tutorial IoT', '/tutorial'],
    ],
  },
  {
    title: 'Proyek / Galeri',
    links: [
      ['Contoh Proyek', '/project'],
      ['Hasil Karya Siswa', '/galeri'],
      ['Dokumentasi Kegiatan', '/galeri'],
    ],
  },
];

const socials = [
  ['instagram', '#'],
  ['facebook', '#'],
  ['youtube', '#'],
  ['twitter', '#'],
];

const contacts = [
  ['phone', '0812-3456-7890'],
  ['mail', 'admin@arduflow.id'],
  ['pin', 'Indonesia'],
];

<<<<<<< HEAD
function FooterIcon({ type, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  };

  if (type === 'instagram') {
    return (
      <svg {...common}>
        <path d="M7 2H17A5 5 0 0 1 22 7V17A5 5 0 0 1 17 22H7A5 5 0 0 1 2 17V7A5 5 0 0 1 7 2Z" />
        <path d="M12 16A4 4 0 1 0 12 8A4 4 0 0 0 12 16Z" />
        <path d="M17.5 6.5H17.51" />
      </svg>
    );
  }

  if (type === 'facebook') {
    return (
      <svg {...common}>
        <path d="M15 8H13A2 2 0 0 0 11 10V12H8V15H11V22H14V15H17L18 12H14V10A1 1 0 0 1 15 9H18V6H15Z" />
      </svg>
    );
  }

  if (type === 'youtube') {
    return (
      <svg {...common}>
        <path d="M22 8.5A3 3 0 0 0 19.9 6.4C18 6 12 6 12 6S6 6 4.1 6.4A3 3 0 0 0 2 8.5A31.4 31.4 0 0 0 2 15.5A3 3 0 0 0 4.1 17.6C6 18 12 18 12 18S18 18 19.9 17.6A3 3 0 0 0 22 15.5A31.4 31.4 0 0 0 22 8.5Z" />
        <path d="M10 9L15 12L10 15V9Z" />
      </svg>
    );
  }

  if (type === 'twitter') {
    return (
      <svg {...common}>
        <path d="M22 4.5C21.2 5 20.4 5.4 19.4 5.5A4.4 4.4 0 0 0 12 9.5V10.5A10.5 10.5 0 0 1 3 6S-1 15 8 19A11.7 11.7 0 0 1 1 21C10 26 21 21 21 9.5C21 9.2 21 8.9 21 8.6A7.5 7.5 0 0 0 22 4.5Z" />
      </svg>
    );
  }

  if (type === 'phone') {
    return (
      <svg {...common}>
        <path d="M22 16.92V19.92A2 2 0 0 1 19.82 21.92A19.8 19.8 0 0 1 11.19 18.85A19.5 19.5 0 0 1 5.19 12.85A19.8 19.8 0 0 1 2.12 4.18A2 2 0 0 1 4.11 2H7.11A2 2 0 0 1 9.11 3.72C9.24 4.68 9.46 5.62 9.76 6.52A2 2 0 0 1 9.31 8.63L8.04 9.9A16 16 0 0 0 14.04 15.9L15.31 14.63A2 2 0 0 1 17.42 14.18C18.32 14.48 19.26 14.7 20.22 14.83A2 2 0 0 1 22 16.92Z" />
      </svg>
    );
  }

  if (type === 'mail') {
    return (
      <svg {...common}>
        <path d="M4 4H20A2 2 0 0 1 22 6V18A2 2 0 0 1 20 20H4A2 2 0 0 1 2 18V6A2 2 0 0 1 4 4Z" />
        <path d="M22 6L12 13L2 6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M21 10C21 17 12 23 12 23S3 17 3 10A9 9 0 1 1 21 10Z" />
      <path d="M12 13A3 3 0 1 0 12 7A3 3 0 0 0 12 13Z" />
    </svg>
=======
const footerIconAssets = {
  facebook: facebookIcon,
  instagram: instagramIcon,
  mail: mailIcon,
  phone: phoneIcon,
  pin: mapPinIcon,
  twitter: twitterIcon,
  youtube: youtubeIcon,
};

function FooterIcon({ type, size = 20 }) {
  const src = footerIconAssets[type] || footerIconAssets.pin;

  return (
    <img
      className="asset-icon footer-asset-icon"
      src={src}
      alt=""
      aria-hidden="true"
      style={{ width: size, height: size }}
    />
>>>>>>> main
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <section className="footer-brand-block">
          <a className="footer-logo" href="/">
            ARDU<span>FLOW</span>
          </a>
          <p>
            Arduflow adalah platform edukasi IoT berbasis visual programming untuk membantu siswa,
            guru, dan komunitas dalam membuat proyek Arduino dan IoT dengan cara yang mudah,
            terstruktur, dan menyenangkan.
          </p>
          <div className="footer-socials" aria-label="Media sosial Arduflow">
            {socials.map(([type, href]) => (
              <a href={href} aria-label={type} key={type}>
                <FooterIcon type={type} />
              </a>
            ))}
          </div>
        </section>

        {footerMenus.map((group, index) => (
          <nav className={`footer-column footer-column-${index + 1}`} aria-label={group.title} key={group.title}>
            <h2>{group.title}</h2>
            <ul>
              {group.links.map(([label, href]) => (
                <li key={label}>
                  <a href={href}>{label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <section className="footer-contact">
          <h2>Kontak Admin</h2>
          <ul>
            {contacts.map(([type, label]) => (
              <li key={type}>
                <FooterIcon type={type} size={16} />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="footer-bottom">
          <p>&copy; 2026 Arduflow. Hak Cipta Dilindungi Undang-Undang.</p>
        </div>
      </div>
    </footer>
  );
}
