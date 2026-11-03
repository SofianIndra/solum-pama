import Input from "@/components/core/Input";
import SectionCard from "@/components/core/SectionCard";
import { STOCK_NUMBER_FIELDS } from "@/utils/stockForm";

// ms_stock columns shared by Edit Data and Create Data. header goes above the fields (e.g. the item code),
// leadingFields at the start of the grid (e.g. the item code input), extraFields at the end (e.g. the
// active status). errors is keyed by "stock-<column>".
const StockFieldsSection = ({ step, form, errors, onChange, header, leadingFields, extraFields }) => {
  return (
    <SectionCard
      step={step}
      title="Data Stok"
      description="Stock status dihitung otomatis dari Own Stock terhadap Min dan Max Stock."
    >
      {header}
      <div className="grid gap-5 sm:grid-cols-2">
        {leadingFields}
        <Input
          id="stock-item_name"
          label="Item Name"
          value={form.item_name}
          onChange={(value) => onChange("item_name", value)}
          placeholder="Contoh: OAP DISPENSER LARGE"
          hint="Dikirim ke SOLUM sebagai Mat_Desc."
          error={errors["stock-item_name"]}
          isRequired
          className="sm:col-span-2"
        />
        <Input
          id="stock-mnemonic"
          label="Mnemonic"
          value={form.mnemonic}
          onChange={(value) => onChange("mnemonic", value)}
          placeholder="Contoh: OAP-L"
        />
        <Input
          id="stock-storage_bin"
          label="Storage Bin"
          value={form.storage_bin}
          onChange={(value) => onChange("storage_bin", value)}
          placeholder="Contoh: A-01-02"
        />
        {STOCK_NUMBER_FIELDS.map(({ key, label, isRequired }) => (
          <Input
            key={key}
            id={`stock-${key}`}
            label={label}
            type="number"
            min={0}
            value={form[key]}
            onChange={(value) => onChange(key, value)}
            placeholder="0"
            error={errors[`stock-${key}`]}
            isRequired={isRequired}
          />
        ))}
        {extraFields}
      </div>
    </SectionCard>
  );
};

export default StockFieldsSection;
