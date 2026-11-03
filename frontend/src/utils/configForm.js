import { SERVER_TYPE_ON_PREMISE, SERVER_TYPE_SAAS } from "@/constants/config";

const HOST_LABEL = "[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?";
const HOST_NAME_PATTERN = new RegExp(`^${HOST_LABEL}(\\.${HOST_LABEL})*$`);
const IPV4_PATTERN = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

// Form values are strings, so the port input can be cleared. values is the backend config or its defaults.
export const createConfigForm = (values) => ({
  server_type: values?.server_type || SERVER_TYPE_SAAS,
  on_premise_ip: values?.on_premise_ip ?? "",
  on_premise_port: values?.on_premise_port == null ? "" : String(values.on_premise_port),
  saas_api_url: values?.saas_api_url ?? "",
});

// Same rule as the backend: an IPv4/IPv6 address, or a host name that is not a malformed dotted number.
const isValidHost = (host) => {
  if (host.includes(":")) return /^[0-9A-Fa-f:.]+$/.test(host);
  if (/^[\d.]+$/.test(host)) return IPV4_PATTERN.test(host);
  return host.length <= 253 && HOST_NAME_PATTERN.test(host);
};

const isValidHttpUrl = (url) => {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) && Boolean(parsed.host);
  } catch {
    return false;
  }
};

// Returns [{ id, label, message }]. The chosen type's fields are required; the other type's are only
// checked when filled, because the backend keeps them for when the user switches back.
export const validateConfigForm = (form) => {
  const issues = [];
  const ip = form.on_premise_ip.trim();
  const port = form.on_premise_port.trim();
  const url = form.saas_api_url.trim();
  const isOnPremise = form.server_type === SERVER_TYPE_ON_PREMISE;

  if (ip && !isValidHost(ip)) {
    issues.push({ id: "config-ip", label: "IP Address", message: "Bukan IP address atau host name yang valid." });
  } else if (!ip && isOnPremise) {
    issues.push({ id: "config-ip", label: "IP Address", message: "Wajib diisi." });
  }

  if (port && !(/^\d+$/.test(port) && Number(port) >= 1 && Number(port) <= 65535)) {
    issues.push({ id: "config-port", label: "Port", message: "Harus angka 1 sampai 65535." });
  } else if (!port && isOnPremise) {
    issues.push({ id: "config-port", label: "Port", message: "Wajib diisi." });
  }

  if (url && !isValidHttpUrl(url)) {
    issues.push({ id: "config-url", label: "API URL", message: "Harus diawali http:// atau https://." });
  } else if (!url && !isOnPremise) {
    issues.push({ id: "config-url", label: "API URL", message: "Wajib diisi." });
  }

  return issues;
};

export const buildConfigPayload = (form) => ({
  server_type: form.server_type,
  on_premise_ip: form.on_premise_ip.trim() || null,
  on_premise_port: form.on_premise_port.trim() ? Number(form.on_premise_port) : null,
  saas_api_url: form.saas_api_url.trim().replace(/\/+$/, "") || null,
});

// The base URL the backend would call with this form, built the same way the backend does.
export const previewApiUrl = (form, scheme) => {
  if (form.server_type === SERVER_TYPE_ON_PREMISE) {
    const ip = form.on_premise_ip.trim();
    const port = form.on_premise_port.trim();
    if (!ip || !port) return "";
    return `${scheme}://${ip.includes(":") ? `[${ip}]` : ip}:${port}`;
  }
  return form.saas_api_url.trim().replace(/\/+$/, "");
};

export const isSameConfig = (form, values) =>
  JSON.stringify(buildConfigPayload(form)) === JSON.stringify(buildConfigPayload(createConfigForm(values)));
