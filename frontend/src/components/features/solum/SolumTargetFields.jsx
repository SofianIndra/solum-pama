import Input from "@/components/core/Input";
import StoreSelect from "@/components/features/solum/StoreSelect";

const defaultHint = (value) => (value ? `Default: ${value}` : "Tidak ada default di .env backend.");

// Company + Store of the SOLUM store to update. Both start from the backend .env and can be changed.
const SolumTargetFields = ({ value, defaults, errors = {}, onChange }) => {
  return (
    <>
      <Input
        id="company"
        label="Kode Company"
        value={value.company}
        onChange={(company) => onChange("company", company)}
        placeholder="Contoh: ABC"
        hint={defaultHint(defaults.company)}
        error={errors.company}
        isRequired
      />
      <StoreSelect company={value.company} value={value.store} onChange={(store) => onChange("store", store)} />
    </>
  );
};

export default SolumTargetFields;
