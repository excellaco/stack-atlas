import type { Category } from "../types";

interface Props {
  categories: Category[];
}

export default function CategoryStyles({ categories }: Readonly<Props>): React.JSX.Element {
  const css = categories
    .map(
      (cat) =>
        `[data-category="${cat.id}"] { --chip: ${cat.color}; --accent: ${cat.color}; --dot: ${cat.color}; }`
    )
    .join("\n");
  return <style>{css}</style>;
}
