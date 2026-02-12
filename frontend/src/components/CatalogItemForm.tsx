import { useEffect, useState } from "react";
import type { Category, RawItem } from "../types";

function parseCommaSeparated(value: string): string[] | undefined {
  if (!value.trim()) return undefined;
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinArray(arr: string[] | undefined): string {
  return (arr || []).join(", ");
}

function or<T>(val: T | undefined | null, fallback: T): T {
  return val ?? fallback;
}

interface TextInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

function TextInput({
  placeholder,
  value,
  onChange,
  required,
}: Readonly<TextInputProps>): React.JSX.Element {
  return (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      required={required}
    />
  );
}

interface SelectInputProps {
  value: string;
  onChange: (value: string) => void;
  options: (Category | string)[];
  labelKey?: string;
}

function SelectInput({
  value,
  onChange,
  options,
  labelKey,
}: Readonly<SelectInputProps>): React.JSX.Element {
  return (
    <select
      value={value}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
    >
      {options.map((opt) => {
        const val = labelKey ? (opt as Category).id : (opt as string);
        const label = labelKey ? (opt as Category)[labelKey as keyof Category] : (opt as string);
        return (
          <option key={val} value={val}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

interface FormFields {
  id: string;
  name: string;
  category: string;
  type: string;
  synonyms: string;
  parents: string;
  commonWith: string;
  tags: string;
  description: string;
}

function buildFormResult(fields: FormFields): RawItem {
  const result: Record<string, unknown> = {
    id: fields.id.trim(),
    name: fields.name.trim(),
    category: fields.category,
    type: fields.type,
  };
  const optionalFields: [string, string][] = [
    ["synonyms", fields.synonyms],
    ["parents", fields.parents],
    ["commonWith", fields.commonWith],
    ["tags", fields.tags],
  ];
  for (const [key, val] of optionalFields) {
    const parsed = parseCommaSeparated(val);
    if (parsed) result[key] = parsed;
  }
  return result as unknown as RawItem;
}

function getItemDefaults(item: RawItem | null | undefined) {
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

function getInitialState(
  item: RawItem | null | undefined,
  initialDesc: string,
  categories: Category[],
  types: string[]
): FormFields {
  const defaults = getItemDefaults(item);
  return {
    ...defaults,
    category: defaults.category || or(categories[0]?.id, ""),
    type: defaults.type || or(types[0], ""),
    description: or(initialDesc, ""),
  };
}

interface FormSetters {
  setId: React.Dispatch<React.SetStateAction<string>>;
  setName: React.Dispatch<React.SetStateAction<string>>;
  setCategory: React.Dispatch<React.SetStateAction<string>>;
  setType: React.Dispatch<React.SetStateAction<string>>;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  setSynonyms: React.Dispatch<React.SetStateAction<string>>;
  setParents: React.Dispatch<React.SetStateAction<string>>;
  setCommonWith: React.Dispatch<React.SetStateAction<string>>;
  setTags: React.Dispatch<React.SetStateAction<string>>;
  categories: Category[];
  types: string[];
}

interface CatalogFormFieldsProps {
  state: FormFields;
  setters: FormSetters;
}

function CatalogFormFields({
  state,
  setters,
}: Readonly<CatalogFormFieldsProps>): React.JSX.Element {
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
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setters.setDescription(e.target.value)
        }
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

function useAutoId(
  item: RawItem | null | undefined,
  name: string,
  setId: React.Dispatch<React.SetStateAction<string>>
): void {
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

function useFormState(
  item: RawItem | null | undefined,
  initialDesc: string,
  categories: Category[],
  types: string[]
): { state: FormFields; setters: FormSetters } {
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
  const state: FormFields = {
    id,
    name,
    category,
    type,
    description,
    synonyms,
    parents,
    commonWith,
    tags,
  };
  const setters: FormSetters = {
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

interface Props {
  item: RawItem | null;
  description: string;
  categories: Category[];
  types: string[];
  onSave: (itemData: RawItem, description: string) => void;
  onCancel: () => void;
}

export default function CatalogItemForm({
  item,
  description: initialDesc,
  categories,
  types,
  onSave,
  onCancel,
}: Readonly<Props>): React.JSX.Element {
  const { state, setters } = useFormState(item, initialDesc, categories, types);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>): void => {
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
