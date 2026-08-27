import { useEffect, useMemo, useState } from 'react';
import defaultHeroImage from '../../assets/images/signin-hero-raspberry.jpg';
import workshopGroupImage from '../../assets/images/workshop-experience-group.png';
import workshopStudentImage from '../../assets/images/workshop-experience-student.png';
import tutorialDeviceImage from '../../assets/images/tutorial-device.png';
import projectPreviewImage from '../../assets/images/project-hero-reference.png';

const defaultSlides = [
  {
    image: defaultHeroImage,
    alt: 'Raspberry Pi board for IoT learning',
  },
  {
    image: workshopGroupImage,
    alt: 'Arduflow workshop learning session',
  },
  {
    image: workshopStudentImage,
    alt: 'Student working on an IoT learning project',
  },
  {
    image: tutorialDeviceImage,
    alt: 'IoT device tutorial preview',
  },
  {
    image: projectPreviewImage,
    alt: 'Arduflow project interface preview',
  },
];

export function AuthImageSlider({
  image,
  imageAlt = 'Raspberry Pi board for IoT learning',
  slides = defaultSlides,
  headline = 'Learn with us',
  description = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi lobortis maximus nunc, ac rhoncus odio congue quis. Sed ac semper orci, eu porttitor lacus.',
  activeSlide = 0,
  intervalMs = 10000,
}) {
  const sliderItems = useMemo(() => {
    if (image) {
      return [{ image, alt: imageAlt }];
    }

    return slides.length > 0 ? slides : defaultSlides;
  }, [image, imageAlt, slides]);

  const [currentSlide, setCurrentSlide] = useState(() => {
    return activeSlide >= 0 && activeSlide < sliderItems.length ? activeSlide : 0;
  });

  useEffect(() => {
    setCurrentSlide(activeSlide >= 0 && activeSlide < sliderItems.length ? activeSlide : 0);
  }, [activeSlide, sliderItems.length]);

  useEffect(() => {
    if (sliderItems.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentSlide((slide) => (slide + 1) % sliderItems.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs, sliderItems.length]);

  const selectedSlide = sliderItems[currentSlide] || sliderItems[0];

  return (
    <section className="auth-image-slider" aria-label="Arduflow learning preview">
      <img className="auth-image-slider__image" src={selectedSlide.image} alt={selectedSlide.alt} />
      <div className="auth-image-slider__overlay" />

      <div className="auth-image-slider__copy">
        <a className="auth-image-slider__logo" href="/">
          ARDU<span>FLOW</span>
        </a>
        <h1>{headline}</h1>
        <p>{description}</p>
      </div>

      <div className="auth-image-slider__dots" aria-label="Pilih gambar slide">
        {sliderItems.map((slide, index) => (
          <button
            aria-label={`Tampilkan slide ${index + 1}`}
            aria-pressed={index === currentSlide}
            className={index === currentSlide ? 'active' : undefined}
            key={slide.image}
            onClick={() => setCurrentSlide(index)}
            type="button"
          />
        ))}
      </div>
    </section>
  );
}
