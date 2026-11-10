import axios from 'axios';
import { API_URL } from "@/lib/config";

export interface OverviewData {
  range: { from: string; to: string; days: number; bucket: 'day' | 'week'; first_sale: string | null };
  totals: { revenue: number; profit: number; units: number; orders: number; expired_loss: number; expired_units: number; stock_value: number };
  growth_pct: number | null;
  daily: { day: string; revenue: number; profit: number; orders: number; prev_revenue: number | null }[];
  by_category: { category: string; revenue: number; profit: number }[];
  top_products: { name: string; revenue: number; units: number }[];
  products: { p_id: number; name: string; category: string; revenue: number; profit: number; units: number }[];
  monthly: { label: string; revenue: number; profit: number }[];
  category_trend: { day: string; category: string; revenue: number }[];
  heatmap: { dow: number; hour: number; revenue: number }[];
  stock_levels: { p_id: number; name: string; qty: number; reorder: number }[];
  by_weekday: { dow: number; revenue: number }[];
  low_stock: { p_id: number; p_name: string; s_quantity: number }[];
}

// from / to are YYYY-MM-DD (inclusive)
export const getOverview = async (from?: string, to?: string, productId?: number | null, categoryId?: number | null): Promise<OverviewData> => {
  const response = await axios.get(`${API_URL}/analytics/overview`, { params: { from, to, product_id: productId ?? undefined, category_id: categoryId ?? undefined } });
  return response.data;
};


export interface InventoryAnalytics {
  cover: { name: string; qty: number; reorder: number; per_day: number; days: number | null }[];
  flow: { week: string; delivered: number; sold: number; expired: number }[];
  waste: { name: string; units: number; loss: number }[];
  value_by_category: { category: string; value: number }[];
}

export const getInventoryAnalytics = async (): Promise<InventoryAnalytics> => {
  const response = await axios.get(`${API_URL}/analytics/inventory`);
  return response.data;
};
