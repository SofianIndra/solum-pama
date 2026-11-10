"use client";
import { useEffect, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import Button from "@/components/core/Button";
import ConfirmDialog from "@/components/core/ConfirmDialog";
import Input from "@/components/core/Input";
import MessageDialog from "@/components/core/MessageDialog";
import PageHeader from "@/components/core/PageHeader";
import SectionCard from "@/components/core/SectionCard";
import Select from "@/components/core/Select";
import { showErrorToast, showSuccessToast, showWarningToast } from "@/components/core/ToastNotification";
import StockTableSection from "@/components/features/editData/StockTableSection";
import ArticleSelect from "@/components/features/solum/ArticleSelect";
import SolumDefaultsGate from "@/components/features/solum/SolumDefaultsGate";
import SolumTargetFields from "@/components/features/solum/SolumTargetFields";
import { SolumUpdateFailure, SolumUpdateResult } from "@/components/features/stock/SolumCallResult";
import StockFieldsSection from "@/components/features/stock/StockFieldsSection";
import StockSubmitPanel from "@/components/features/stock/StockSubmitPanel";
import { ACTIVE_OPTIONS } from "@/constants/stock";
import { getErrorMessage } from "@/services/PamaApi/api";
import { deleteStock, filterStocks, getStock, getStockByArticle, updateStock } from "@/services/PamaApi/stockService";
import { buildStockPayload, createStockForm, previewStockStatus, validateStockForm } from "@/utils/stockForm";

const EMPTY_KEYS = { itemCode: "", articleId: "", articleName: "" };

// item_code and article_id of the row being edited; both can be changed, the backend keeps them unique.
const createKeys = (row) => ({ itemCode: row?.item_code ?? "", articleId: row?.article_id ?? "", articleName: "" });

const validateEdit = (form, keys, target) => {
  const issues = [];
  if (!keys.itemCode.trim()) issues.push({ id: "item-code", label: "Item Code", message: "Wajib diisi." });
  if (!keys.articleId) issues.push({ id: "article-id", label: "Article", message: "Wajib dipilih." });
  if (!target.company.trim()) issues.push({ id: "company", label: "Kode Company", message: "Wajib diisi." });
  return [...issues, ...validateStockForm(form)];
};

// After a 400 the backend may have refused a duplicate item code or article; ask again which one, so the
// dialog can name the row that already uses it. Returns one message per duplicate, or [] for other errors.
const findDuplicates = async (selected, itemCode, articleId) => {
  const [codeRow, articleRow] = await Promise.all([
    itemCode !== selected.item_code ? getStock(itemCode).catch(() => null) : null,
    articleId !== selected.article_id ? getStockByArticle(articleId).catch(() => null) : null,
  ]);
  const messages = [];
  if (codeRow && codeRow.id !== selected.id) {
    messages.push(`Item code ${itemCode} sudah digunakan oleh data stok lain (${codeRow.item_name || "tanpa nama"}).`);
  }
  if (articleRow && articleRow.id !== selected.id) {
    messages.push(`Article ${articleId} sudah terhubung ke item code ${articleRow.item_code}.`);
  }
  return messages;
};

const EditDataContent = ({ defaults }) => {
  const [search, setSearch] = useState("");
  const [list, setList] = useState(null);
  const [isListLoading, setIsListLoading] = useState(true);

  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(() => createStockForm());
  const [keys, setKeys] = useState(EMPTY_KEYS);
  const [active, setActive] = useState("ACTIVE");
  const [target, setTarget] = useState(() => ({ company: defaults.company, store: defaults.store }));
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // An update response, or { failure } when the backend refused the update (e.g. a SOLUM API failed).
  const [result, setResult] = useState(null);
  // Messages of the duplicate dialog; null while it is closed.
  const [duplicateMessages, setDuplicateMessages] = useState(null);

  const issues = hasTriedSubmit ? validateEdit(form, keys, target) : [];
  const errors = Object.fromEntries(issues.map((issue) => [issue.id, issue.message]));

  const loadList = async (nextSearch, page) => {
    setIsListLoading(true);
    try {
      setList(await filterStocks({ search: nextSearch.trim(), page }));
    } catch {
      // The interceptor already showed the error toast; keep the previous page.
    } finally {
      setIsListLoading(false);
    }
  };

  // First page on open; afterwards the list only reloads on search, paging, or a saved change.
  useEffect(() => {
    filterStocks({ page: 1 })
      .then(setList)
      .catch(() => {})
      .finally(() => setIsListLoading(false));
  }, []);

  const handleSelect = (row) => {
    setSelected(row);
    setForm(createStockForm(row));
    setKeys(createKeys(row));
    setActive(row.active || "ACTIVE");
    setHasTriedSubmit(false);
    setResult(null);
    requestAnimationFrame(() => document.getElementById("stock-item_name")?.focus());
  };

  const handleTargetChange = (key, value) => {
    setTarget((prev) => ({ ...prev, [key]: value, ...(key === "company" ? { store: "" } : {}) }));
  };

  const handleRequestSubmit = (event) => {
    event.preventDefault();
    setHasTriedSubmit(true);
    const submitIssues = validateEdit(form, keys, target);
    if (submitIssues.length) {
      showErrorToast(`${submitIssues.length} field belum diisi atau belum benar. Cek daftar di panel Ringkasan.`);
      document.getElementById(submitIssues[0].id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleSubmit = async () => {
    const itemCode = keys.itemCode.trim();
    setIsSubmitting(true);
    try {
      // The path keeps the saved item_code; the body may carry a new one.
      const data = await updateStock(selected.item_code, {
        ...buildStockPayload(form),
        item_code: itemCode,
        article_id: keys.articleId,
        active,
        company: target.company.trim(),
        store: target.store,
      });
      setResult(data);
      setSelected(data.data);
      setForm(createStockForm(data.data));
      setKeys((prev) => ({ ...createKeys(data.data), articleName: prev.articleName }));
      showSuccessToast(`Data stok ${data.data.item_code} berhasil disimpan.`);
      if (!data.solum_led.is_sent) showWarningToast(`Data tersimpan, tapi tidak dikirim ke SOLUM: ${data.solum_led.message}`);
      else if (!data.solum_led.is_success) showErrorToast(`Data tersimpan, tapi LED gagal dinyalakan. ${data.solum_led.message}`);
      loadList(search, list?.page ?? 1);
    } catch (error) {
      // Nothing was saved; keep the form so the user can fix it.
      const duplicates = error.response?.status === 400 ? await findDuplicates(selected, itemCode, keys.articleId) : [];
      if (duplicates.length) {
        setResult(null);
        setDuplicateMessages(duplicates);
        return;
      }
      // Any other failure, e.g. a SOLUM API that could not be reached; the message names that API.
      const message = getErrorMessage(error, "Data stok gagal disimpan.");
      setResult({ failure: message });
      showErrorToast(`Data tidak disimpan. ${message}`);
    } finally {
      setIsSubmitting(false);
      setIsConfirmOpen(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteStock(selected.item_code);
      showSuccessToast(`Data stok ${selected.item_code} berhasil dihapus.`);
      setSelected(null);
      setForm(createStockForm());
      setKeys(EMPTY_KEYS);
      setHasTriedSubmit(false);
      setResult(null);
      loadList(search, list?.page ?? 1);
    } catch {
      // The interceptor already showed the error toast; nothing was deleted.
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
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
          <StockTableSection
            search={search}
            onSearchChange={setSearch}
            onSearch={() => loadList(search, 1)}
            list={list}
            isLoading={isListLoading}
            selectedCode={selected?.item_code}
            onSelect={handleSelect}
            onPageChange={(page) => loadList(search, page)}
          />

          {selected && (
            <>
              <StockFieldsSection
                step={2}
                form={form}
                errors={errors}
                onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
                leadingFields={
                  <Input
                    id="item-code"
                    label="Item Code"
                    value={keys.itemCode}
                    onChange={(itemCode) => setKeys((prev) => ({ ...prev, itemCode }))}
                    placeholder="Contoh: B100001"
                    hint={
                      keys.itemCode.trim() !== selected.item_code
                        ? `Item code lama: ${selected.item_code}. Tidak boleh sama dengan data stok lain.`
                        : "Kode unik barang, tidak boleh sama dengan data stok lain."
                    }
                    error={errors["item-code"]}
                    isRequired
                    className="sm:col-span-2"
                  />
                }
                extraFields={
                  <Select
                    id="stock-active"
                    label="Status Data"
                    value={active}
                    onChange={setActive}
                    options={ACTIVE_OPTIONS}
                    placeholder="Pilih status"
                    isRequired
                  />
                }
              />
              <SectionCard
                step={3}
                title="Artikel & Tujuan SOLUM"
                description="Article yang dihubungkan dengan data stok ini, dan store yang label serta LED-nya diperbarui."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <SolumTargetFields value={target} defaults={defaults} errors={errors} onChange={handleTargetChange} />
                  <ArticleSelect
                    company={target.company}
                    store={target.store}
                    articleId={keys.articleId}
                    articleName={keys.articleName}
                    onChange={(article) =>
                      setKeys((prev) => ({ ...prev, articleId: article?.articleId ?? "", articleName: article?.articleName ?? "" }))
                    }
                    error={errors["article-id"]}
                    className="sm:col-span-2"
                  />
                </div>
                {selected.article_id && keys.articleId && keys.articleId !== selected.article_id && (
                  <p className="mt-4 rounded-lg border border-warning/20 bg-warning-soft px-3 py-2 text-xs text-warning">
                    Article diganti dari {selected.article_id} ke {keys.articleId}. Semua data stok dikirim ke article baru;
                    label article lama tidak diubah.
                  </p>
                )}
              </SectionCard>
            </>
          )}

          {result && (
            <SectionCard title="Hasil Proses">
              {result.failure ? <SolumUpdateFailure message={result.failure} /> : <SolumUpdateResult result={result} />}
            </SectionCard>
          )}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
          <StockSubmitPanel
            rows={[
              { label: "Item Code", value: selected ? keys.itemCode.trim() : "" },
              { label: "Article ID", value: selected ? keys.articleId : "" },
              { label: "Company", value: target.company },
              { label: "Store", value: target.store || defaults.store },
              { label: "Durasi LED", value: defaults.led_duration },
            ]}
            status={selected ? previewStockStatus(form) : null}
            note={selected ? "Perubahan langsung dikirim ke SOLUM AIMS dan LED label akan menyala." : "Pilih data stok dulu."}
            issues={issues}
            isSubmitting={isSubmitting}
            isDisabled={!selected}
            submitLabel="Simpan & Kirim ke SOLUM"
          />
          {selected && (
            <Button
              variant="danger"
              icon={<FiTrash2 />}
              onClick={() => setIsDeleteOpen(true)}
              isDisabled={isSubmitting}
              className="w-full border border-danger/30 bg-white"
            >
              Hapus Data Stok
            </Button>
          )}
        </aside>
      </form>

      {isDeleteOpen && (
        <ConfirmDialog
          title="Yakin ingin menghapus data ini?"
          message={`Data stok ${selected.item_code} (article ${selected.article_id || "-"}) akan dihapus permanen dari database dan tidak bisa dikembalikan. Label di SOLUM tidak berubah.`}
          confirmLabel="Ya, hapus"
          cancelLabel="Tidak, batal"
          isDanger
          onConfirm={handleDelete}
          onClose={() => setIsDeleteOpen(false)}
          isLoading={isDeleting}
        />
      )}

      {isConfirmOpen && (
        <ConfirmDialog
          message={`Data stok ${keys.itemCode.trim()}${
            keys.itemCode.trim() !== selected.item_code ? ` (sebelumnya ${selected.item_code})` : ""
          } akan disimpan, dikirim ke SOLUM article ${keys.articleId}, dan LED label dinyalakan.`}
          onConfirm={handleSubmit}
          onClose={() => setIsConfirmOpen(false)}
          isLoading={isSubmitting}
        />
      )}

      {duplicateMessages && (
        <MessageDialog
          title="Data tidak disimpan karena duplikat"
          messages={duplicateMessages}
          onClose={() => setDuplicateMessages(null)}
        />
      )}
    </main>
  );
};

const EditDataLayout = () => {
  return (
    <>
      <PageHeader
        breadcrumbs={["Beranda", "Edit Data"]}
        title="Edit Data Stok"
        description="Ubah data ms_stock. Field yang tampil di label dikirim ke SOLUM AIMS, lalu LED label menyala sesuai status stok."
      />
      <SolumDefaultsGate>{(defaults) => <EditDataContent defaults={defaults} />}</SolumDefaultsGate>
    </>
  );
};

export default EditDataLayout;
