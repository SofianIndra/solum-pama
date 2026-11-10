"use client";
import { useState } from "react";
import SearchSelect from "@/components/core/SearchSelect";
import { useSearchOptions } from "@/hooks/useSearchOptions";
import { listArticles } from "@/services/PamaApi/solumService";

// Article dropdown for the chosen store's SOLUM articles: lists them all, and typing searches by name.
// Disabled until a store is picked. onChange gets { articleId, articleName }, or null when cleared.
const ArticleSelect = ({ company, store, articleId, articleName, onChange, error, className = "" }) => {
  const [query, setQuery] = useState("");
  const name = query.trim();
  const hasStore = Boolean(company.trim() && store);
  const {
    items: articles,
    error: loadError,
    isLoading,
  } = useSearchOptions(listArticles, { company: company.trim(), store, name }, hasStore);

  let selectedLabel = "";
  if (articleId) selectedLabel = articleName && articleName !== articleId ? `${articleName} (${articleId})` : articleId;

  return (
    <SearchSelect
      id="article-id"
      label="Article"
      value={articleId}
      selectedLabel={selectedLabel}
      onChange={(option) => onChange(option ? { articleId: option.value, articleName: option.label } : null)}
      query={query}
      onQueryChange={setQuery}
      options={articles.map((article) => ({
        value: article.articleId,
        label: article.articleName || article.articleId,
        description: article.articleId,
      }))}
      isLoading={isLoading}
      placeholder={hasStore ? "Pilih article" : "Pilih Store dulu"}
      searchPlaceholder="Cari nama article..."
      emptyMessage={name ? "Article tidak ditemukan" : "Belum ada article di store ini"}
      hint={hasStore ? "Pilih dari daftar, atau ketik nama article untuk mencari." : "Aktif setelah Store dipilih."}
      error={error || loadError}
      isRequired
      isDisabled={!hasStore}
      className={className}
    />
  );
};

export default ArticleSelect;
