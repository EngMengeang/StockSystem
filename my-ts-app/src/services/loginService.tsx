import axios from 'axios';
import { API_URL } from "@/lib/config";
import { setToken } from "@/lib/session";

export const getlogin = async (data: { username: string; password: string }) => {
  const response = await axios.post(`${API_URL}/login`, data);
  if (response.data?.token) setToken(response.data.token);
  return response.data;
};
