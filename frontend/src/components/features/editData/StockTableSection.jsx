import { FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";
import Button from "@/components/core/Button";
import LoadingSpinner from "@/components/core/LoadingSpinner";
import SectionCard from "@/components/core/SectionCard";
import StockStatusBadge from "@/components/features/stock/StockStatusBadge";

// ms_stock rows, searchable by item code or name. list is the backend page { data, page, total_items, total_page }.
// The search box is not a <form> because the whole page already is one; Enter runs the search instead.
const StockTableSection = ({ search, onSearchChange, onSearch, list, isLoading, selectedCode, onSelect, onPageChange }) => {
  const rows = list?.data ?? [];
  const page = list?.page ?? 1;
  const totalPage = list?.total_page ?? 0;

  return (
    <SectionCard step={1} title="Pilih Data Stok" description="Cari berdasarkan Item Code, Article ID, atau Item Name, lalu pilih Edit.">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            id="stock-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              onSearch();
            }}
            placeholder="Cari item code / article ID / item name..."
            aria-label="Cari data stok"
            className="w-full rounded-lg border border-border-strong bg-white py-2 pl-9 pr-3 text-sm text-heading shadow-sm placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
          />
        </div>
        <Button variant="outline" onClick={onSearch} isDisabled={isLoading}>
          Cari
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="bg-surface text-xs font-medium uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2.5">Item Code</th>
              <th className="px-3 py-2.5">Article ID</th>
              <th className="px-3 py-2.5">Item Name</th>
              <th className="px-3 py-2.5 text-right">Own</th>
              <th className="px-3 py-2.5 text-right">Min</th>
              <th className="px-3 py-2.5 text-right">Max</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5" aria-label="Aksi" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-muted">
                  <LoadingSpinner className="mx-auto" />
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-muted">
                  Data stok tidak ditemukan.
                </td>
              </tr>
            )}
            {!isLoading &&
              rows.map((row) => {
                const isSelected = row.item_code === selectedCode;
                return (
                  <tr key={row.id} className={isSelected ? "bg-primary-soft" : "hover:bg-surface"}>
                    <td className="min-w-44 px-3 py-2.5 font-medium text-heading">{row.item_code}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-muted">{row.article_id || "-"}</td>
                    <td className="max-w-56 truncate px-3 py-2.5">{row.item_name}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.own_stock}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.min_stock}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.max_stock}</td>
                    <td className="px-3 py-2.5">
                      <StockStatusBadge status={row.stock_status} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Button variant="ghost" size="sm" onClick={() => onSelect(row)} isDisabled={isSelected}>
                        {isSelected ? "Dipilih" : "Edit"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-sm text-muted">
        <span>
          {list ? `${list.total_items} data · halaman ${totalPage ? page : 0} dari ${totalPage}` : "-"}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<FiChevronLeft />}
            ariaLabel="Halaman sebelumnya"
            onClick={() => onPageChange(page - 1)}
            isDisabled={isLoading || page <= 1}
          />
          <Button
            variant="outline"
            size="sm"
            icon={<FiChevronRight />}
            ariaLabel="Halaman berikutnya"
            onClick={() => onPageChange(page + 1)}
            isDisabled={isLoading || page >= totalPage}
          />
        </div>
      </div>
    </SectionCard>
  );
};

export default StockTableSection;
