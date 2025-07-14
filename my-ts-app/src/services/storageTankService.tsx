import axios from "axios";

const API_BASE_URL = "http://localhost:4000";

export const getStorageTanks = async () => {
  const response = await axios.get(`${API_BASE_URL}/storageTanks`);
  return response.data;
};

export const getStorageTankById = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/storageTanks/${id}`);
  return response.data;
}