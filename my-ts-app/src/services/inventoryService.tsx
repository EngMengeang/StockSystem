import axios from "axios";

const API_BASE_URL = "http://localhost:4000";

export const getinventory = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/inventorytransactions/${id}`);
  return response.data;
};


export const deleteInventory = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/inventorytransactions/${id}`);
  return response.data;
};
