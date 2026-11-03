import { panamaApi } from "./api";

// Returns { company, store, led_duration } from the backend .env; the forms start with these values.
export const getSolumDefaults = async () => {
  const response = await panamaApi.get("/solum/defaults");
  return response.data;
};

// Returns [{ store, storeName }]. The error is shown under the store dropdown, so no toast.
export const listStores = async ({ company, storeName }, signal) => {
  const response = await panamaApi.get("/solum/stores", {
    params: { company, store_name: storeName || undefined },
    signal,
    skipErrorToast: true,
  });
  return response.data.map(({ store, store_name: name }) => ({ store, storeName: name }));
};

// Returns [{ articleId, articleName }] matching name. The error is shown under the article dropdown, so no toast.
export const listArticles = async ({ company, store, name }, signal) => {
  const response = await panamaApi.get("/solum/articles", {
    params: { company, store, name: name || undefined },
    signal,
    skipErrorToast: true,
  });
  return response.data.map(({ article_id: articleId, article_name: articleName }) => ({ articleId, articleName }));
};
