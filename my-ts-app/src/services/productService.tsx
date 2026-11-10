// server.js
import axios from 'axios';
import { API_URL as API } from "@/lib/config";

const API_URL = `${API}/products`;

export const getMyProducts = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const getProductByName = async (p_name: string) => {
  const response = await axios.get(`${API_URL}/name/${p_name}`);
  return response.data;
}

export const postProduct = async (data: Record<string, unknown>) => {
  const response = await axios.post(API_URL, data);
  return response.data;
}

export const deleteProduct = async (id: number) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
}

export const updateProduct = async (data: Record<string, unknown>, id: number) => {
  const response = await axios.put(`${API_URL}/${id}`, data);
  return response.data;
}

// categories (used by the product form)
export const getCategories = async () => {
  const response = await axios.get(`${API}/categories`);
  return response.data;
};

export const postCategory = async (name: string) => {
  const response = await axios.post(`${API}/categories`, { name });
  return response.data;
};


// several sales at once (cart checkout / CSV import). Rejects with the server's per-row errors if anything is wrong.
export const postSalesBatch = async (items: { p_id?: number; p_name?: string; quantity: number; date?: string }[]) => {
  const response = await axios.post(`${API}/sales/batch`, { items });
  return response.data as { success: boolean; lines: number; units: number; total: number };
};

// add / update many products at once (CSV import)
export const postProductsImport = async (rows: { p_name: string; category?: string; p_price: number; p_cost?: number; stock?: number; reorder_level?: number }[]) => {
  const response = await axios.post(`${API}/products/import`, { rows });
  return response.data as { success: boolean; created: number; updated: number; stock_added: number };
};
