import axios from "axios";

const API_BASE_URL = "http://localhost:4000";

export const getcustomer = async () => {
  const response = await axios.get(`${API_BASE_URL}/customers`);
  return response.data;
};

export const addCustomer = async (customerData: any) => {
  const response = await axios.post(`${API_BASE_URL}/customers`, customerData);
  return response.data;
};

export const updateCustomer = async (customerId: string, customerData: any) => {
  console.log("Updating customer with ID:", customerId, "Data:", customerData);
  const response = await axios.put(`${API_BASE_URL}/customers/${customerId}`, customerData);
  return response.data;
};

export const deleteCustomer = async (customerId: string) => {
  const response = await axios.delete(`${API_BASE_URL}/customers/${customerId}`);
  return response.data;
};

export const gettotalCustomer = async () => {
  const response = await axios.get(`${API_BASE_URL}/customers/total`);
  return response.data;
}