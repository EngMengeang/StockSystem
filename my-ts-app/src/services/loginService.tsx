import axios from 'axios';
const API_URL = "http://localhost:4000/api";

export const getlogin = async (data) => {
  const response = await axios.post(`${API_URL}/login`, data);
  console.log(response.data)
  return response.data;
};