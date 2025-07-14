import axios from "axios";

const API_BASE_URL = "http://localhost:4000";

export const getinvoice = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/invoices/${id}`);
  return response.data;
};