import axios from 'axios';
import { API_URL } from "@/lib/config";

const BASE = `${API_URL}/products`;

export const getMyInventory = async () => {
  const response = await axios.get(`${BASE}/inventory-summary`);
  return response.data;
};

export const postexpire = async (data: { p_name: string }) => {
  const response = await axios.post(`${BASE}/expire`, data);
  return response.data;
};

export const getexpired = async () => {
  const response = await axios.get(`${BASE}/expired`);
  return response.data;
};
