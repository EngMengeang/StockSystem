import axios from 'axios';
import { API_URL } from "@/lib/config";

const BASE = `${API_URL}/products`;

export const postsale = async (data: { p_name: string; quantity: number }) => {
  const response = await axios.post(`${BASE}/sale`, data);
  return response.data;
};

export const getsales = async () => {
  const response = await axios.get(`${BASE}/sales`);
  return response.data;
};
