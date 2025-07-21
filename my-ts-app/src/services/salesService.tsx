// server.js
import axios from 'axios';
const API_URL = "http://localhost:4000/api/products";

export const postsale = async (data) => {
  const response = await axios.post(`${API_URL}/sale`, data);
  return response.data;
};

export const getsales = async () => {
  const response = await axios.get(`${API_URL}/sales`);
  return response.data;
};