"use client";
import { useState } from "react";
import SearchSelect from "@/components/core/SearchSelect";
import { useSearchOptions } from "@/hooks/useSearchOptions";
import { listStores } from "@/services/PanamaApi/solumService";

// Store dropdown filled from SOLUM for the company typed in the form; disabled until there is a company.
// Typing searches by store name (SOLUM matches it case-sensitively).
const StoreSelect = ({ company, value, onChange, className = "" }) => {
  const companyCode = company.trim();
  const hasCompany = Boolean(companyCode);
  const [query, setQuery] = useState("");
  // The list changes with every search, so remember the picked store's name to show it while closed.
  const [picked, setPicked] = useState(null);
  const { items: stores, error, isLoading } = useSearchOptions(
    listStores,
    { company: companyCode, storeName: query.trim() },
    hasCompany,
  );

  return (
    <SearchSelect
      id="store"
      label="Store"
      value={value}
      selectedLabel={picked?.value === value ? picked.label : value}
      onChange={(option) => {
        setPicked(option);
        onChange(option?.value ?? "");
      }}
      query={query}
      onQueryChange={setQuery}
      // The user picks by name; the store code is what goes to SOLUM (?store=...).
      options={stores.map(({ store, storeName }) => ({ value: store, label: storeName || store, description: store }))}
      isLoading={isLoading}
      placeholder={hasCompany ? "Pilih store" : "Isi Kode Company dulu"}
      searchPlaceholder="Cari nama store..."
      emptyMessage={query.trim() ? "Store tidak ditemukan" : `Belum ada store untuk company ${companyCode} di SOLUM.`}
      hint={hasCompany ? "Daftar store diambil dari SOLUM AIMS." : "Aktif setelah Kode Company diisi."}
      error={error}
      isDisabled={!hasCompany}
      className={className}
    />
  );
};

export default StoreSelect;
