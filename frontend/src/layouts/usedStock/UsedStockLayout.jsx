"use client";
import { useRef, useState } from "react";
import PageHeader from "@/components/core/PageHeader";
import { showErrorToast, showSuccessToast, showWarningToast } from "@/components/core/ToastNotification";
import SolumDefaultsGate from "@/components/features/solum/SolumDefaultsGate";
import ArticlePickerSection from "@/components/features/usedStock/ArticlePickerSection";
import StockInfoSection from "@/components/features/usedStock/StockInfoSection";
import { getErrorMessage } from "@/services/PanamaApi/api";
import { getStockByArticle, updateStock } from "@/services/PanamaApi/stockService";
import { parseAdjustAmount } from "@/utils/stockForm";

const IDLE_VIEW = { status: "idle", data: null, message: "" };

const UsedStockContent = ({ defaults }) => {
  // Only the answer for the article picked last may land, even if an older request finishes later.
  const latestArticleId = useRef("");

  const [selection, setSelection] = useState(() => ({
    company: defaults.company,
    store: defaults.store,
    articleId: "",
    articleName: "",
  }));
  const [view, setView] = useState(IDLE_VIEW);
  // Empty means 1 (see parseAdjustAmount); the input keeps what the user typed between saves of the same
  // article and is cleared when another article, store or company is picked.
  const [quantity, setQuantity] = useState("");
  const [savingDirection, setSavingDirection] = useState(0);
  const [lastResult, setLastResult] = useState(null);

  const loadStock = async (articleId) => {
    latestArticleId.current = articleId;
    setLastResult(null);
    if (!articleId) {
      setView(IDLE_VIEW);
      return;
    }

    setView({ status: "loading", data: null, message: "" });
    try {
      const stock = await getStockByArticle(articleId);
      if (latestArticleId.current !== articleId) return;
      setView(stock ? { status: "ready", data: stock, message: "" } : { status: "missing", data: null, message: "" });
    } catch (error) {
      if (latestArticleId.current !== articleId) return;
      setView({ status: "error", data: null, message: getErrorMessage(error, "Data stok gagal dimuat.") });
    }
  };

  // Stores belong to one company and articles to one store, so changing either clears what depends on it.
  // A different article starts again from the default amount of 1.
  const handleSelectionChange = (key, value) => {
    setSelection((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "company" ? { store: "" } : {}),
      articleId: "",
      articleName: "",
    }));
    setQuantity("");
    loadStock("");
  };

  const handleArticleChange = (article) => {
    setSelection((prev) => ({ ...prev, articleId: article?.articleId ?? "", articleName: article?.articleName ?? "" }));
    setQuantity("");
    loadStock(article?.articleId ?? "");
  };

  // direction is -1 (take out) or 1 (put back). The backend saves own_stock, recomputes the status,
  // sends the label data to SOLUM and blinks the LED in the status color.
  const handleAdjust = async (direction) => {
    const stock = view.data;
    const nextOwnStock = stock.own_stock + direction * parseAdjustAmount(quantity).amount;
    setSavingDirection(direction);
    try {
      const result = await updateStock(stock.item_code, {
        own_stock: nextOwnStock,
        company: selection.company.trim(),
        store: selection.store,
      });
      setView({ status: "ready", data: result.data, message: "" });
      setLastResult(result);
      showSuccessToast(`Own stock ${result.data.item_code} sekarang ${result.data.own_stock} (${result.data.stock_status}).`);
      if (!result.solum_led.is_sent) showWarningToast(`Stok tersimpan, tapi tidak dikirim ke SOLUM: ${result.solum_led.message}`);
      else if (!result.solum_led.is_success) showErrorToast(`Stok tersimpan, tapi LED gagal dinyalakan. ${result.solum_led.message}`);
    } catch (error) {
      // Nothing was saved. The message names the SOLUM API that failed, so it also stays under the buttons.
      const message = getErrorMessage(error, "Stok gagal disimpan.");
      setLastResult({ failure: message });
      showErrorToast(`Stok tidak disimpan. ${message}`);
    } finally {
      setSavingDirection(0);
    }
  };

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:items-start">
      <ArticlePickerSection
        selection={selection}
        defaults={defaults}
        onChange={handleSelectionChange}
        onArticleChange={handleArticleChange}
      />
      <StockInfoSection
        view={view}
        articleId={selection.articleId}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onAdjust={handleAdjust}
        onReload={() => loadStock(selection.articleId)}
        savingDirection={savingDirection}
        lastResult={lastResult}
      />
    </main>
  );
};

const UsedStockLayout = () => {
  return (
    <>
      <PageHeader
        breadcrumbs={["Beranda", "Used Stock"]}
        title="Used Stock"
        description="Pilih artikel, lalu kurangi atau tambah Own Stock. Label ESL dan LED-nya ikut diperbarui."
      />
      <SolumDefaultsGate>{(defaults) => <UsedStockContent defaults={defaults} />}</SolumDefaultsGate>
    </>
  );
};

export default UsedStockLayout;
