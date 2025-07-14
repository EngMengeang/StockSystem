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

export const postProduct = async (data) => {
  const response = await axios.post(API_URL, data);
  return response.data;
}

export const deleteProduct = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
}
