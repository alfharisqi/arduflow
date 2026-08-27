import { useEffect, useState } from "react";
import ContactSelectedForm from "../features/leads/ContactSelectedForm";
import contactHeroImage from "../assets/images/contact-hero.png";
import officeMapImage from "../assets/images/library-smart-home.png";

const contactBenefits = [
  {
    icon: "◷",
    title: "Respon Cepat",
    copy: "Kami merespon 1x24 jam kerja",
  },
  {
    icon: "◇",
    title: "Aman & Rahasia",
    copy: "Data Anda aman dan tidak disebarkan",
  },
  {
    icon: "◎",
    title: "Tim Profesional",
    copy: "Tim ArduFlow siap membantu Anda",
  },
];

const contactCategories = [
  {
    index: "01",
    title: "Saya Tertarik dengan ArduFlow",
    copy: "Informasi lebih lanjut seputar ArduFlow dan cara mengaksesnya.",
  },
  {
    index: "02",
    title: "Kontak dan Kolaborasi",
    copy: "Demo, kerja sama, pelatihan, atau kolaborasi.",
  },
  {
    index: "03",
    title: "Daftar Workshop",
    copy: "Daftar sebagai peserta workshop ArduFlow.",
  },
];

const directContacts = [
  {
    title: "WhatsApp",
    value: "0812-3456-7890",
    detailTitle: "Jam Operasional",
    detailValue: "Senin-Sabtu | 08.00-17.00",
    action: "CHAT ADMIN",
    href: "https://wa.me/6281234567890",
  },
  {
    title: "Email",
    value: "info@arduflow.com",
    action: "KIRIM EMAIL",
    href: "mailto:info@arduflow.com",
  },
  {
    title: "Instagram",
    value: "@arduflow.id",
    action: "LIHAT INSTAGRAM",
    href: "#",
  },
  {
    title: "Alamat",
    value: "Jl. M.H. Thamrin No.9, Menteng, Jakarta Pusat 10340",
    action: "KUNJUNGI KAMI",
    href: "https://www.google.com/maps/search/Jl.%20M.H.%20Thamrin%20No.9%2C%20Menteng%2C%20Jakarta%20Pusat%2010340",
  },
];

const contactFaqs = [
  "Berapa lama tim ArduFlow merespon form?",
  "Apakah demo / workshop berbayar?",
  "Apakah workshop bisa diadakan di sekolah kami?",
  "Bagaimana cara mendapatkan akses ArduFlow IDE?",
];

function ContactHero() {
  return (
    <section className="contact-hero" aria-labelledby="contact-hero-title">
      <div className="contact-hero__inner">
        <div className="contact-hero__copy">
          <p className="contact-hero__eyebrow">KONTAK KAMI</p>
          <h1 id="contact-hero-title">
            Hubungi <span>ArduFlow</span>
          </h1>
          <p>
            Kirim pertanyaan, request demo, kerja sama, atau daftar workshop.
            Tim kami siap membantu Anda membangun masa depan IoT yang lebih
            baik.
          </p>
        </div>

        <div className="contact-benefits" aria-label="Keunggulan kontak">
          {contactBenefits.map((benefit) => (
            <article className="contact-benefit" key={benefit.title}>
              <strong aria-hidden="true">{benefit.icon}</strong>
              <div>
                <h2>{benefit.title}</h2>
                <p>{benefit.copy}</p>
              </div>
            </article>
          ))}
        </div>

        <img
          className="contact-hero__image"
          src={contactHeroImage}
          alt=""
          width="590"
          height="350"
        />
      </div>
    </section>
  );
}

function ContactCategories({ activeCategory, onSelectCategory }) {
  return (
    <section
      className="contact-categories"
      aria-labelledby="contact-categories-title"
    >
      <div className="contact-categories__heading">
        <h2 id="contact-categories-title">Pilih Kebutuhan Anda</h2>
        <p>Pilih salah satu kategori di bawah untuk mengisi form yang sesuai.</p>
      </div>

      <div className="contact-categories__list">
        {contactCategories.map((category) => (
          <button
            type="button"
            className={
              activeCategory === category.index
                ? "contact-category active"
                : "contact-category"
            }
            key={category.index}
            onClick={() => onSelectCategory(category.index)}
          >
            <strong>{category.index}</strong>
            <div>
              <h3>{category.title}</h3>
              <p>{category.copy}</p>
            </div>
            <span aria-hidden="true">-&gt;</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function DirectContact() {
  return (
    <section className="direct-contact" aria-labelledby="direct-contact-title">
      <div className="direct-contact__inner">
        <h2 id="direct-contact-title">Atau Hubungi Kami Langsung</h2>

        <div className="direct-contact__list">
          {directContacts.map((contact) => (
            <article className="direct-contact-card" key={contact.title}>
              <h3>{contact.title}</h3>
              <p>{contact.value}</p>
              {contact.detailTitle && <strong>{contact.detailTitle}</strong>}
              {contact.detailValue && <span>{contact.detailValue}</span>}
              <a href={contact.href}>{contact.action}</a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function OfficeFaq() {
  return (
    <section className="office-faq" aria-labelledby="office-heading">
      <div className="office-faq__inner">
        <div className="office-faq__office">
          <h2 id="office-heading">Kantor ArduFlow</h2>

          <article className="office-card">
            <div className="office-card__copy">
              <h3>
                Malang, Jawa Timur
                <br />
                Indonesia
              </h3>
              <p>
                Detail alamat akan diberikan saat konfirmasi meeting atau
                pendaftaran workshop.
              </p>
              <a href="https://www.google.com/maps/search/Malang%2C%20Jawa%20Timur%2C%20Indonesia">
                LIHAT DI GOOGLE MAPS
              </a>
            </div>

            <img
              className="office-card__image"
              src={officeMapImage}
              alt=""
              width="259"
              height="228"
            />
          </article>
        </div>

        <div className="office-faq__faq" aria-labelledby="faq-heading">
          <h2 id="faq-heading">Pertanyaan yang Sering Diajukan</h2>

          <div className="faq-list">
            {contactFaqs.map((question) => (
              <button className="faq-row" type="button" key={question}>
                <span>{question}</span>
                <i className="faq-icon" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  const [activeContactCategory, setActiveContactCategory] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return window.location.hash === "#form-daftar-workshop" || params.has("workshop_id")
      ? "03"
      : "01";
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (window.location.hash !== "#form-daftar-workshop" && !params.has("workshop_id")) {
      return;
    }

    setActiveContactCategory("03");

    window.requestAnimationFrame(() => {
      document
        .getElementById("form-daftar-workshop")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  return (
    <>
      <ContactHero />
      <ContactCategories
        activeCategory={activeContactCategory}
        onSelectCategory={setActiveContactCategory}
      />
      <ContactSelectedForm activeCategory={activeContactCategory} />
      <DirectContact />
      <OfficeFaq />
    </>
  );
}

export default Contact;
