// server.js
import axios from 'axios';
const API_URL = "http://localhost:4000/api/products";

export const getMyInventory = async () => {
  const response = await axios.get(`${API_URL}/inventory-summary`);
  return response.data;
};

export const postexpire = async (data) => {
  const response = await axios.post(`${API_URL}/expire`, data);
  return response.data;
};

export const getexpired = async () => {
  const response = await axios.get(`${API_URL}/expire`);
  return response.data;
};