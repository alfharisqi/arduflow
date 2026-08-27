import facebookIcon from '../assets/icons/icon-facebook-1.svg';
import instagramIcon from '../assets/icons/icon-instagram-1.svg';
import mailIcon from '../assets/icons/icon-mail-1.svg';
import mapPinIcon from '../assets/icons/icon-map-pin-1.svg';
import phoneIcon from '../assets/icons/icon-phone-1.svg';
import twitterIcon from '../assets/icons/icon-twitter-1.svg';
import youtubeIcon from '../assets/icons/icon-youtube-1.svg';

const footerMenus = [
  {
    title: 'Menu',
    links: [
      ['Beranda', '/'],
      ['Tutorial', '/tutorial'],
      ['Proyek', '/project'],
      ['Program / Workshop', '/workshop'],
      ['Tentang Kami', '/about'],
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
      ['Hasil Karya Siswa', '/project'],
      ['Dokumentasi Kegiatan', '/project'],
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
