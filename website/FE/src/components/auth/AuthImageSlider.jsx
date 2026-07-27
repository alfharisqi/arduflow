import defaultHeroImage from '../../assets/images/signin-hero-raspberry.jpg';

export function AuthImageSlider({
  image = defaultHeroImage,
  imageAlt = 'Raspberry Pi board for IoT learning',
  headline = 'Learn with us',
  description = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi lobortis maximus nunc, ac rhoncus odio congue quis. Sed ac semper orci, eu porttitor lacus.',
  activeSlide = 0,
  slideCount = 5,
}) {
  return (
    <section className="auth-image-slider" aria-label="Arduflow learning preview">
      <img className="auth-image-slider__image" src={image} alt={imageAlt} />
      <div className="auth-image-slider__overlay" />

      <div className="auth-image-slider__copy">
        <a className="auth-image-slider__logo" href="/">
          ARDU<span>FLOW</span>
        </a>
        <h1>{headline}</h1>
        <p>{description}</p>
      </div>

      <div className="auth-image-slider__dots" aria-hidden="true">
        {Array.from({ length: slideCount }, (_, index) => (
          <span className={index === activeSlide ? 'active' : undefined} key={index} />
        ))}
      </div>
    </section>
  );
}
