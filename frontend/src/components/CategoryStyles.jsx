export default function CategoryStyles({ categories }) {
  const css = categories
    .map(
      (cat) =>
        `[data-category="${cat.id}"] { --chip: ${cat.color}; --accent: ${cat.color}; --dot: ${cat.color}; }`
    )
    .join("\n");
  return <style>{css}</style>;
}
