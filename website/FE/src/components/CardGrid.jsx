export function CardGrid({ items }) {
  return (
    <div className="card-grid">
      {items.map((item) => (
        <article className="card" key={item.title}>
          {(item.category || item.level || item.type) && <p className="tag">{item.category || item.level || item.type}</p>}
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </article>
      ))}
    </div>
  );
}
