"use client";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/core/Button";
import ConfirmDialog from "@/components/core/ConfirmDialog";
import Input from "@/components/core/Input";
import LoadingSpinner from "@/components/core/LoadingSpinner";
import PageHeader from "@/components/core/PageHeader";
import SectionCard from "@/components/core/SectionCard";
import { showErrorToast, showSuccessToast } from "@/components/core/ToastNotification";
import ConfigSubmitPanel from "@/components/features/config/ConfigSubmitPanel";
import ServerTypeSelector from "@/components/features/config/ServerTypeSelector";
import { SERVER_TYPE_LABELS, SERVER_TYPE_ON_PREMISE } from "@/constants/config";
import { getSolumServerConfig, updateSolumServerConfig } from "@/services/PamaApi/configService";
import { buildConfigPayload, createConfigForm, isSameConfig, previewApiUrl, validateConfigForm } from "@/utils/configForm";

const ConfigContent = ({ config, onSaved }) => {
  const [form, setForm] = useState(() => createConfigForm(config));
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const issues = hasTriedSubmit ? validateConfigForm(form) : [];
  const errors = Object.fromEntries(issues.map((issue) => [issue.id, issue.message]));
  const previewUrl = previewApiUrl(form, config.on_premise_scheme);
  const isDirty = !isSameConfig(form, config);
  const isOnPremise = form.server_type === SERVER_TYPE_ON_PREMISE;

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // Only fills the form; nothing changes on the server until Save.
  const handleResetDefaults = () => {
    setForm(createConfigForm(config.defaults));
    setHasTriedSubmit(false);
  };

  const handleRequestSubmit = (event) => {
    event.preventDefault();
    setHasTriedSubmit(true);
    const submitIssues = validateConfigForm(form);
    if (submitIssues.length) {
      showErrorToast(`${submitIssues.length} field belum diisi atau belum benar. Cek daftar di panel Server Aktif.`);
      document.getElementById(submitIssues[0].id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateSolumServerConfig(buildConfigPayload(form));
      showSuccessToast(`Server SOLUM diubah ke ${SERVER_TYPE_LABELS[form.server_type]} (${previewUrl}).`);
      setIsConfirmOpen(false);
      onSaved();
    } catch {
      // The interceptor already showed the error toast.
      setIsConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
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
          <SectionCard step={1} title="Tipe Server" description="Pilih tempat AIMS SOLUM yang dipakai backend.">
            <ServerTypeSelector value={form.server_type} onChange={(value) => handleChange("server_type", value)} />
          </SectionCard>

          <SectionCard
            step={2}
            title={isOnPremise ? "Server On Premise" : "Server SaaS"}
            description={
              isOnPremise
                ? `Backend memanggil ${config.on_premise_scheme}://<IP address>:<port>.`
                : "Backend memanggil API URL ini apa adanya."
            }
          >
            {isOnPremise ? (
              <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_160px]">
                <Input
                  id="config-ip"
                  label="IP Address"
                  value={form.on_premise_ip}
                  onChange={(value) => handleChange("on_premise_ip", value)}
                  placeholder={`Contoh: ${config.defaults.on_premise_ip || "192.168.1.100"}`}
                  hint="IP address atau host name server AIMS, tanpa http:// dan tanpa port."
                  error={errors["config-ip"]}
                  isRequired
                />
                <Input
                  id="config-port"
                  label="Port"
                  type="number"
                  min={1}
                  value={form.on_premise_port}
                  onChange={(value) => handleChange("on_premise_port", value)}
                  placeholder={`Contoh: ${config.defaults.on_premise_port || 9001}`}
                  error={errors["config-port"]}
                  isRequired
                />
              </div>
            ) : (
              <Input
                id="config-url"
                label="API URL"
                type="url"
                value={form.saas_api_url}
                onChange={(value) => handleChange("saas_api_url", value)}
                placeholder="Contoh: https://asia.common.solumesl.com"
                hint="URL dari SOLUM, tanpa path /common/api/... di belakangnya."
                error={errors["config-url"]}
                isRequired
              />
            )}
            <p className="mt-4 text-xs text-muted">
              Isian {isOnPremise ? "SaaS" : "On Premise"} tetap disimpan, jadi tidak perlu diketik ulang saat pindah tipe.
            </p>
          </SectionCard>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <ConfigSubmitPanel
            config={config}
            form={form}
            previewUrl={previewUrl}
            isDirty={isDirty}
            issues={issues}
            isSubmitting={isSubmitting}
            onResetDefaults={handleResetDefaults}
          />
        </aside>
      </form>

      {isConfirmOpen && (
        <ConfirmDialog
          message={`Semua panggilan SOLUM berikutnya akan dikirim ke ${previewUrl}.`}
          onConfirm={handleSubmit}
          onClose={() => setIsConfirmOpen(false)}
          isLoading={isSubmitting}
        />
      )}
    </main>
  );
};

const ConfigLayout = () => {
  const [state, setState] = useState({ config: null, isLoading: true });
  // Bumped after a save so the form restarts from the saved row.
  const [version, setVersion] = useState(0);

  // State is only set once the request settles, so this can run from the mount effect.
  const fetchConfig = useCallback(
    () =>
      getSolumServerConfig()
        .then((config) => {
          setState({ config, isLoading: false });
          setVersion((prev) => prev + 1);
        })
        .catch(() => setState({ config: null, isLoading: false })),
    [],
  );

  const handleRetry = () => {
    setState({ config: null, isLoading: true });
    fetchConfig();
  };

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return (
    <>
      <PageHeader
        breadcrumbs={["Beranda", "Config"]}
        title="Config Server SOLUM"
        description="Tentukan server AIMS yang dipanggil backend: On Premise (IP address + port) atau SaaS (API URL)."
      />
      {state.isLoading ? (
        <div className="flex flex-1 items-center justify-center py-20 text-muted">
          <LoadingSpinner size="lg" />
        </div>
      ) : state.config ? (
        <ConfigContent key={version} config={state.config} onSaved={fetchConfig} />
      ) : (
        // The interceptor already toasted why the config could not be loaded.
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-sm text-muted">
          <p>Config server tidak dapat dimuat.</p>
          <Button variant="outline" onClick={handleRetry}>
            Coba lagi
          </Button>
        </div>
      )}
    </>
  );
};

export default ConfigLayout;
