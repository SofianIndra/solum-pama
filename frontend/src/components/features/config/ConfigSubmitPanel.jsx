import Button from "@/components/core/Button";
import IssueList from "@/components/core/IssueList";
import { SERVER_TYPE_LABELS } from "@/constants/config";

const SummaryRow = ({ label, value, isMono = false }) => (
  <div className="flex justify-between gap-4">
    <dt className="shrink-0 text-muted">{label}</dt>
    <dd className={`text-right font-medium text-heading ${isMono ? "break-all font-mono text-xs leading-5" : ""}`}>
      {value || "-"}
    </dd>
  </div>
);

const formatSavedAt = (config) => {
  if (!config.is_saved) return "Default .env (belum pernah disimpan)";
  const date = new Date(config.updated_at);
  const time = Number.isNaN(date.getTime()) ? config.updated_at : date.toLocaleString("id-ID");
  return `${time} oleh ${config.updated_by || "-"}`;
};

// config is the saved backend config (the server in use now); form is what Save would store.
const ConfigSubmitPanel = ({ config, form, previewUrl, isDirty, issues, isSubmitting, onResetDefaults }) => {
  return (
    <div className="rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-heading">Server Aktif</h2>
        <p className="text-xs text-muted">Semua panggilan SOLUM dari backend dikirim ke sini.</p>
      </div>
      <dl className="space-y-3 px-5 py-4 text-sm">
        <SummaryRow label="Tipe" value={SERVER_TYPE_LABELS[config.server_type] ?? config.server_type} />
        <SummaryRow label="URL" value={config.api_url} isMono />
        <SummaryRow label="Sumber" value={formatSavedAt(config)} />
      </dl>

      <div className="border-t border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-heading">Setelah Disimpan</h2>
        <dl className="mt-3 space-y-3 text-sm">
          <SummaryRow label="Tipe" value={SERVER_TYPE_LABELS[form.server_type]} />
          <SummaryRow label="URL" value={previewUrl} isMono />
        </dl>
      </div>

      <div className="space-y-3 border-t border-border px-5 py-4">
        {isDirty ? (
          <p className="rounded-lg border border-warning/20 bg-warning-soft px-3 py-2 text-xs text-warning">
            Ada perubahan yang belum disimpan. Panggilan SOLUM berikutnya pindah ke server baru setelah disimpan.
          </p>
        ) : (
          <p className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted">
            Tidak ada perubahan dari server aktif.
          </p>
        )}
        {issues.length > 0 && <IssueList issues={issues} />}
        <Button type="submit" isLoading={isSubmitting} isDisabled={!isDirty} className="w-full">
          Simpan Config
        </Button>
        <Button variant="outline" onClick={onResetDefaults} isDisabled={isSubmitting} className="w-full">
          Isi dengan Default .env
        </Button>
      </div>
    </div>
  );
};

export default ConfigSubmitPanel;
