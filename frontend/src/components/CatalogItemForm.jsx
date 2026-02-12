import { useEffect, useState } from "react";

function parseCommaSeparated(value) {
  if (!value.trim()) return undefined;
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinArray(arr) {
  return (arr || []).join(", ");
}

function or(val, fallback) {
  return val ?? fallback;
}

function TextInput({ placeholder, value, onChange, required }) {
  return (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    />
  );
}

function SelectInput({ value, onChange, options, labelKey }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((opt) => {
        const val = labelKey ? opt.id : opt;
        const label = labelKey ? opt[labelKey] : opt;
        return (
          <option key={val} value={val}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

function buildFormResult(fields) {
  const result = {
    id: fields.id.trim(),
    name: fields.name.trim(),
    category: fields.category,
    type: fields.type,
  };
  const optionalFields = [
    ["synonyms", fields.synonyms],
    ["parents", fields.parents],
    ["commonWith", fields.commonWith],
    ["tags", fields.tags],
  ];
  for (const [key, val] of optionalFields) {
    const parsed = parseCommaSeparated(val);
    if (parsed) result[key] = parsed;
  }
  return result;
}

function getItemDefaults(item) {
  return {
    id: or(item?.id, ""),
    name: or(item?.name, ""),
    category: or(item?.category, ""),
    type: or(item?.type, ""),
    synonyms: joinArray(item?.synonyms),
    parents: joinArray(item?.parents),
    commonWith: joinArray(item?.commonWith),
    tags: joinArray(item?.tags),
  };
}

function getInitialState(item, initialDesc, categories, types) {
  const defaults = getItemDefaults(item);
  return {
    ...defaults,
    category: defaults.category || or(categories[0]?.id, ""),
    type: defaults.type || or(types[0], ""),
    description: or(initialDesc, ""),
  };
}

function CatalogFormFields({ state, setters }) {
  return (
    <>
      <TextInput placeholder="ID" value={state.id} onChange={setters.setId} required />
      <TextInput placeholder="Name" value={state.name} onChange={setters.setName} required />
      <SelectInput
        value={state.category}
        onChange={setters.setCategory}
        options={setters.categories}
        labelKey="name"
      />
      <SelectInput value={state.type} onChange={setters.setType} options={setters.types} />
      <textarea
        placeholder="Description"
        value={state.description}
        onChange={(e) => setters.setDescription(e.target.value)}
        rows={2}
      />
      <TextInput
        placeholder="Synonyms (comma-separated)"
        value={state.synonyms}
        onChange={setters.setSynonyms}
      />
      <TextInput
        placeholder="Parents (comma-separated IDs)"
        value={state.parents}
        onChange={setters.setParents}
      />
      <TextInput
        placeholder="Common with (comma-separated IDs)"
        value={state.commonWith}
        onChange={setters.setCommonWith}
      />
      <TextInput
        placeholder="Tags (comma-separated)"
        value={state.tags}
        onChange={setters.setTags}
      />
    </>
  );
}

function useAutoId(item, name, setId) {
  useEffect(() => {
    if (!item && name) {
      setId(
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  }, [name, item, setId]);
}

function useFormState(item, initialDesc, categories, types) {
  const init = getInitialState(item, initialDesc, categories, types);
  const [id, setId] = useState(init.id);
  const [name, setName] = useState(init.name);
  const [category, setCategory] = useState(init.category);
  const [type, setType] = useState(init.type);
  const [description, setDescription] = useState(init.description);
  const [synonyms, setSynonyms] = useState(init.synonyms);
  const [parents, setParents] = useState(init.parents);
  const [commonWith, setCommonWith] = useState(init.commonWith);
  const [tags, setTags] = useState(init.tags);
  useAutoId(item, name, setId);
  const state = { id, name, category, type, description, synonyms, parents, commonWith, tags };
  const setters = {
    setId,
    setName,
    setCategory,
    setType,
    setDescription,
    setSynonyms,
    setParents,
    setCommonWith,
    setTags,
    categories,
    types,
  };
  return { state, setters };
}

export default function CatalogItemForm({
  item,
  description: initialDesc,
  categories,
  types,
  onSave,
  onCancel,
}) {
  const { state, setters } = useFormState(item, initialDesc, categories, types);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(buildFormResult(state), state.description.trim());
  };

  return (
    <form className="catalog-form" onSubmit={handleSubmit}>
      <CatalogFormFields state={state} setters={setters} />
      <div className="catalog-form-actions">
        <button type="submit" className="primary" disabled={!state.id.trim() || !state.name.trim()}>
          Save
        </button>
        <button type="button" className="ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
