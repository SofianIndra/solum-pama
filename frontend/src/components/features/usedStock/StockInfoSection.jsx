import Link from "next/link";
import { FiMinus, FiPlus, FiRefreshCw } from "react-icons/fi";
import Button from "@/components/core/Button";
import LoadingSpinner from "@/components/core/LoadingSpinner";
import SectionCard from "@/components/core/SectionCard";
import StockStatusBadge from "@/components/features/stock/StockStatusBadge";
import { SolumUpdateFailure, SolumUpdateResult } from "@/components/features/stock/SolumCallResult";
import { DEFAULT_ADJUST_AMOUNT, getStockStatus, parseAdjustAmount } from "@/utils/stockForm";

const StatTile = ({ label, value, isHighlighted = false }) => (
  <div className={`rounded-lg border px-4 py-3 ${isHighlighted ? "border-primary/20 bg-primary-soft" : "border-border bg-surface"}`}>
    <p className="text-xs text-muted">{label}</p>
    <p className={`mt-1 font-semibold tabular-nums ${isHighlighted ? "text-3xl text-primary" : "text-xl text-heading"}`}>
      {value ?? "-"}
    </p>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
    <dt className="text-muted">{label}</dt>
    <dd className="text-right font-medium text-heading">{value ?? "-"}</dd>
  </div>
);

const EmptyState = ({ children }) => (
  <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-strong px-4 py-8 text-center text-sm text-muted">
    {children}
  </div>
);

// One adjust button: shows what own_stock and the status would become.
const AdjustButton = ({ label, icon, nextOwnStock, stock, onClick, isSaving, isDisabled }) => (
  <div className="flex flex-col items-center gap-1.5">
    <Button
      variant={label === "Kurangi" ? "outline" : "primary"}
      icon={icon}
      onClick={onClick}
      isLoading={isSaving}
      isDisabled={isDisabled}
      loadingLabel="Menyimpan..."
      className="w-full"
    >
      {label}
    </Button>
    <span className="text-xs text-muted">
      {isDisabled ? "-" : `→ ${nextOwnStock} (${getStockStatus(nextOwnStock, stock.min_stock, stock.max_stock)})`}
    </span>
  </div>
);

// Container 2: the article's ms_stock row and the buttons that take stock out or put it back.
// view.status is idle | loading | missing | error | ready; view.data is the ms_stock row when ready.
const StockInfoSection = ({ view, articleId, quantity, onQuantityChange, onAdjust, onReload, savingDirection, lastResult }) => {
  let content;
  if (view.status === "idle") {
    content = <EmptyState>Pilih Company, Store, dan Article dulu untuk melihat stoknya.</EmptyState>;
  } else if (view.status === "loading") {
    content = (
      <EmptyState>
        <LoadingSpinner size="lg" />
        Memuat data stok {articleId}...
      </EmptyState>
    );
  } else if (view.status === "missing") {
    content = (
      <EmptyState>
        <p>
          Article <span className="font-semibold text-heading">{articleId}</span> belum punya data stok.
        </p>
        <Link href="/create-data" className="text-sm font-semibold text-primary hover:underline">
          Buat di tab Create Data →
        </Link>
      </EmptyState>
    );
  } else if (view.status === "error") {
    content = (
      <EmptyState>
        <p className="text-danger">{view.message}</p>
        <Button variant="outline" size="sm" icon={<FiRefreshCw />} onClick={onReload}>
          Coba lagi
        </Button>
      </EmptyState>
    );
  } else {
    const stock = view.data;
    const { amount, error: amountError } = parseAdjustAmount(quantity);
    const isAmountValid = amount > 0;
    const isOverOwnStock = isAmountValid && stock.own_stock - amount < 0;
    const isSaving = Boolean(savingDirection);
    let amountMessage = `Kosongkan untuk ${DEFAULT_ADJUST_AMOUNT}.`;
    if (amountError) amountMessage = amountError;
    else if (isOverOwnStock && stock.own_stock === 0) amountMessage = "Own Stock sudah 0, tidak bisa dikurangi lagi.";
    else if (isOverOwnStock) amountMessage = `Kurangi maksimal ${stock.own_stock} (sisa Own Stock).`;

    content = (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-heading">{stock.item_name}</p>
            <p className="text-sm text-muted">
              Item Code {stock.item_code} · Article {stock.article_id || "-"}
            </p>
          </div>
          <StockStatusBadge status={stock.stock_status} isLedShown />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Own Stock" value={stock.own_stock} isHighlighted />
          <StatTile label="Min Stock" value={stock.min_stock} />
          <StatTile label="Max Stock" value={stock.max_stock} />
        </div>

        <dl className="text-sm">
          <DetailRow label="Mnemonic" value={stock.mnemonic || "-"} />
          <DetailRow label="Storage Bin" value={stock.storage_bin || "-"} />
          <DetailRow label="Stock On Hand" value={stock.stock_on_hand} />
          <DetailRow label="Stock On Hand RFID" value={stock.stock_on_hand_rfid} />
          <DetailRow label="Status data" value={stock.active} />
          <DetailRow
            label="Terakhir diubah"
            value={stock.updated_at ? `${new Date(stock.updated_at).toLocaleString("id-ID")} · ${stock.updated_by}` : "-"}
          />
        </dl>

        <div className="rounded-lg border border-border p-4">
          <p className="text-sm font-medium text-heading">Ubah Own Stock</p>
          <p className="mt-0.5 text-xs text-muted">
            Isi jumlah yang mau dikurangi atau ditambah, lalu klik tombolnya. Setiap perubahan langsung disimpan,
            dikirim ke label SOLUM, dan menyalakan LED sesuai status stok.
          </p>
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)] items-start gap-3">
            <AdjustButton
              label="Kurangi"
              icon={<FiMinus />}
              nextOwnStock={stock.own_stock - amount}
              stock={stock}
              onClick={() => onAdjust(-1)}
              isSaving={savingDirection === -1}
              isDisabled={!isAmountValid || isOverOwnStock || isSaving}
            />
            <div>
              <input
                id="adjust-quantity"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={quantity}
                onChange={(event) => onQuantityChange(event.target.value)}
                onFocus={(event) => event.target.select()}
                placeholder={String(DEFAULT_ADJUST_AMOUNT)}
                aria-label="Jumlah"
                aria-invalid={Boolean(amountError || isOverOwnStock)}
                aria-describedby="adjust-quantity-hint"
                className={`w-full rounded-lg border bg-white px-3 py-2 text-center text-base font-semibold text-heading shadow-sm placeholder:text-muted/70 focus:outline-none focus:ring-4 ${
                  amountError || isOverOwnStock
                    ? "border-danger focus:ring-danger/15"
                    : "border-border-strong focus:border-primary focus:ring-primary/15"
                }`}
              />
              <p className="mt-1.5 text-center text-xs font-medium text-heading">Jumlah</p>
            </div>
            <AdjustButton
              label="Tambah"
              icon={<FiPlus />}
              nextOwnStock={stock.own_stock + amount}
              stock={stock}
              onClick={() => onAdjust(1)}
              isSaving={savingDirection === 1}
              isDisabled={!isAmountValid || isSaving}
            />
          </div>
          <p
            id="adjust-quantity-hint"
            className={`mt-3 text-center text-xs ${amountError || isOverOwnStock ? "text-danger" : "text-muted"}`}
          >
            {amountMessage}
          </p>
        </div>

        {/* lastResult is an update response, or { failure } when the backend refused the update */}
        {lastResult?.failure && <SolumUpdateFailure message={lastResult.failure} />}
        {lastResult && !lastResult.failure && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-heading">
              Hasil terakhir · {lastResult.company} / {lastResult.store}
            </p>
            <SolumUpdateResult result={lastResult} />
          </div>
        )}
      </div>
    );
  }

  return (
    <SectionCard step={2} title="Informasi Stok" description="Data ms_stock untuk article yang dipilih.">
      {content}
    </SectionCard>
  );
};

export default StockInfoSection;
