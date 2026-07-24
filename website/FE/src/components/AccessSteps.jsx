export function AccessSteps({ steps }) {
  return (
    <div className="steps">
      {steps.map((step, index) => (
        <article className="step" key={step.title}>
          <span>{index + 1}</span>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </article>
      ))}
    </div>
  );
}
