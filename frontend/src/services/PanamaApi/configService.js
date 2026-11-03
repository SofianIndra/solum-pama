import { panamaApi } from "./api";

// Returns { server_type, on_premise_ip, on_premise_port, saas_api_url, api_url, on_premise_scheme, is_saved,
// updated_at, updated_by, defaults }. While nothing is saved, the values are the backend .env defaults.
export const getSolumServerConfig = async () => {
  const response = await panamaApi.get("/ms-config/solum-server");
  return response.data;
};

// Returns { message }. Every SOLUM call made by the backend after this goes to the new server.
export const updateSolumServerConfig = async (payload) => {
  const response = await panamaApi.put("/ms-config/update/solum-server", payload);
  return response.data;
};
