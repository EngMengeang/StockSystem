import axios from "axios";

const API_BASE_URL = "http://localhost:4000";

export const getgasstation = async () => {
  const response = await axios.get(`${API_BASE_URL}/gasstations`);
  return response.data;
};