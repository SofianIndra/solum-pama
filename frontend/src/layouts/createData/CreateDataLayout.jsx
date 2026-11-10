"use client";
import { useRef, useState } from "react";
import ConfirmDialog from "@/components/core/ConfirmDialog";
import Input from "@/components/core/Input";
import PageHeader from "@/components/core/PageHeader";
import SectionCard from "@/components/core/SectionCard";
import { showErrorToast, showSuccessToast } from "@/components/core/ToastNotification";
import ArticleSelect from "@/components/features/solum/ArticleSelect";
import SolumDefaultsGate from "@/components/features/solum/SolumDefaultsGate";
import SolumTargetFields from "@/components/features/solum/SolumTargetFields";
import StockFieldsSection from "@/components/features/stock/StockFieldsSection";
import StockSubmitPanel from "@/components/features/stock/StockSubmitPanel";
import { useItemCodeCheck } from "@/hooks/useItemCodeCheck";
import { getErrorMessage } from "@/services/PamaApi/api";
import { createStock, getStock, getStockByArticle } from "@/services/PamaApi/stockService";
import { buildStockPayload, createStockForm, previewStockStatus, validateStockForm } from "@/utils/stockForm";

const ITEM_CODE_TAKEN_MESSAGE = "Item code ini sudah digunakan. Gunakan item code lain.";
const NO_ARTICLE_LINK = { articleId: "", status: "idle", itemCode: "", message: "" };

const ITEM_CODE_HINTS = {
  idle: "Kode unik barang, satu item code hanya untuk satu data stok.",
  checking: "Mengecek apakah item code sudah digunakan...",
  available: "Item code belum digunakan.",
};

// A used item code or an article already linked to another item is shown as soon as the check answers,
// not only after Save.
const validateCreate = ({ selection, itemCode, itemCodeCheck, articleLink, form, hasTriedSubmit }) => {
  const issues = [];
  if (hasTriedSubmit && !selection.company.trim()) {
    issues.push({ id: "company", label: "Kode Company", message: "Wajib diisi." });
  }
  if (articleLink.status === "linked") {
    issues.push({
      id: "article-id",
      label: "Article",
      message: `Sudah terhubung ke item code ${articleLink.itemCode}. Pilih article lain.`,
    });
  } else if (hasTriedSubmit && !selection.articleId) {
    issues.push({ id: "article-id", label: "Article", message: "Wajib dipilih." });
  }
  if (itemCodeCheck.status === "taken") {
    issues.push({ id: "item-code", label: "Item Code", message: ITEM_CODE_TAKEN_MESSAGE });
  } else if (hasTriedSubmit && !itemCode.trim()) {
    issues.push({ id: "item-code", label: "Item Code", message: "Wajib diisi." });
  }
  return hasTriedSubmit ? [...issues, ...validateStockForm(form)] : issues;
};

const CreateDataContent = ({ defaults }) => {
  // Only the link check for the article picked last may land, even if an older request finishes later.
  const latestArticleId = useRef("");

  const [selection, setSelection] = useState(() => ({
    company: defaults.company,
    store: defaults.store,
    articleId: "",
    articleName: "",
  }));
  const [articleLink, setArticleLink] = useState(NO_ARTICLE_LINK);
  const [itemCode, setItemCode] = useState("");
  const [form, setForm] = useState(() => createStockForm());
  // Codes the backend rejected as duplicates, or that were just created, so the check needs no new request.
  const [takenCodes, setTakenCodes] = useState([]);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemCodeCheck = useItemCodeCheck(itemCode, takenCodes);
  const issues = validateCreate({ selection, itemCode, itemCodeCheck, articleLink, form, hasTriedSubmit });
  const errors = Object.fromEntries(issues.map((issue) => [issue.id, issue.message]));
  const itemCodeHint = itemCodeCheck.status === "error" ? itemCodeCheck.message : ITEM_CODE_HINTS[itemCodeCheck.status];

  // Looks up whether another ms_stock row already uses this article. A failed lookup does not block Save:
  // the backend checks it again.
  const checkArticleLink = async (articleId) => {
    latestArticleId.current = articleId;
    if (!articleId) {
      setArticleLink(NO_ARTICLE_LINK);
      return;
    }
    setArticleLink({ articleId, status: "checking", itemCode: "", message: "" });
    try {
      const row = await getStockByArticle(articleId);
      if (latestArticleId.current !== articleId) return;
      setArticleLink(row ? { articleId, status: "linked", itemCode: row.item_code, message: "" } : { ...NO_ARTICLE_LINK, articleId, status: "free" });
    } catch (error) {
      if (latestArticleId.current !== articleId) return;
      setArticleLink({ articleId, status: "error", itemCode: "", message: getErrorMessage(error, "Article gagal dicek.") });
    }
  };

  const handleSelectionChange = (key, value) => {
    setSelection((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "company" ? { store: "" } : {}),
      articleId: "",
      articleName: "",
    }));
    checkArticleLink("");
  };

  // The SOLUM article name fills Item Name, unless the user already typed one.
  const handleArticleChange = (article) => {
    setSelection((prev) => ({ ...prev, articleId: article?.articleId ?? "", articleName: article?.articleName ?? "" }));
    if (article?.articleName) setForm((prev) => (prev.item_name.trim() ? prev : { ...prev, item_name: article.articleName }));
    checkArticleLink(article?.articleId ?? "");
  };

  const handleRequestSubmit = (event) => {
    event.preventDefault();
    setHasTriedSubmit(true);
    const submitIssues = validateCreate({ selection, itemCode, itemCodeCheck, articleLink, form, hasTriedSubmit: true });
    if (submitIssues.length) {
      showErrorToast(`${submitIssues.length} field belum diisi atau belum benar. Cek daftar di panel Ringkasan.`);
      document.getElementById(submitIssues[0].id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleSubmit = async () => {
    const code = itemCode.trim();
    const { articleId } = selection;
    setIsSubmitting(true);
    try {
      await createStock({ item_code: code, article_id: articleId, ...buildStockPayload(form) });
      showSuccessToast(`Data stok ${code} berhasil dibuat dan terhubung ke article ${articleId}.`);
      setTakenCodes((prev) => [...prev, code]);
      // Keep company and store for the next article; clear the rest.
      setSelection((prev) => ({ ...prev, articleId: "", articleName: "" }));
      checkArticleLink("");
      setItemCode("");
      setForm(createStockForm());
      setHasTriedSubmit(false);
    } catch (error) {
      // A 400 can be a duplicate made by someone else after the checks; ask again to tell which one.
      const isBadRequest = error.response?.status === 400;
      const [codeRow, articleRow] = isBadRequest
        ? await Promise.all([getStock(code).catch(() => null), getStockByArticle(articleId).catch(() => null)])
        : [null, null];
      if (codeRow) {
        setTakenCodes((prev) => [...prev, code]);
        showErrorToast(`Item code ${code} sudah digunakan. Gunakan item code lain.`);
      } else if (articleRow) {
        setArticleLink({ articleId, status: "linked", itemCode: articleRow.item_code, message: "" });
        showErrorToast(`Article ${articleId} sudah terhubung ke item code ${articleRow.item_code}. Pilih article lain.`);
      } else {
        showErrorToast(`Data stok tidak disimpan. ${getErrorMessage(error)}`);
      }
    } finally {
      setIsSubmitting(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <form
        onSubmit={handleRequestSubmit}
        noValidate
        className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div className="space-y-6">
          <SectionCard
            step={1}
            title="Artikel SOLUM"
            description="Article yang dihubungkan dengan data stok ini. Label dan LED article ini yang diperbarui saat stok diubah."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <SolumTargetFields value={selection} defaults={defaults} errors={errors} onChange={handleSelectionChange} />
              <ArticleSelect
                company={selection.company}
                store={selection.store}
                articleId={selection.articleId}
                articleName={selection.articleName}
                onChange={handleArticleChange}
                error={errors["article-id"] || (articleLink.status === "error" ? articleLink.message : "")}
                className="sm:col-span-2"
              />
            </div>
          </SectionCard>
          <StockFieldsSection
            step={2}
            form={form}
            errors={errors}
            onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
            leadingFields={
              <Input
                id="item-code"
                label="Item Code"
                value={itemCode}
                onChange={setItemCode}
                placeholder="Contoh: B100001"
                hint={itemCodeHint}
                error={errors["item-code"]}
                isRequired
                className="sm:col-span-2"
              />
            }
          />
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <StockSubmitPanel
            rows={[
              { label: "Company", value: selection.company },
              { label: "Store", value: selection.store },
              { label: "Article ID", value: selection.articleId },
              { label: "Item Code", value: itemCode.trim() },
            ]}
            status={previewStockStatus(form)}
            note="Data disimpan ke database. Label SOLUM diperbarui saat stok diubah di tab Used Stock atau Edit Data."
            issues={issues}
            isSubmitting={isSubmitting}
            submitLabel="Simpan Data Stok"
          />
        </aside>
      </form>

      {isConfirmOpen && (
        <ConfirmDialog
          message={`Data stok ${itemCode.trim()} akan disimpan dan dihubungkan ke article ${selection.articleId}.`}
          onConfirm={handleSubmit}
          onClose={() => setIsConfirmOpen(false)}
          isLoading={isSubmitting}
        />
      )}
    </main>
  );
};

const CreateDataLayout = () => {
  return (
    <>
      <PageHeader
        breadcrumbs={["Beranda", "Create Data"]}
        title="Create Data Stok"
        description="Hubungkan article SOLUM dengan data stok baru. Stock status dihitung otomatis dari Own, Min, dan Max Stock."
      />
      <SolumDefaultsGate>{(defaults) => <CreateDataContent defaults={defaults} />}</SolumDefaultsGate>
    </>
  );
};

export default CreateDataLayout;
