
// server.js
import axios from 'axios';
const API_URL = "http://localhost:4000/api/products";

export const getMyProducts = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const getProductByName = async (p_name) => {
  const response = await axios.get(`${API_URL}/name/${p_name}`);
  return response.data;
}
