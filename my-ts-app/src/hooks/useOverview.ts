import { useEffect, useState } from "react";
import { getOverview, type OverviewData } from "@/services/overviewService";
import { getMyProducts, getCategories } from "@/services/productService";
import { errorText } from "@/lib/session";
import { useFilters } from "./useFilters";

/** Loads the overview numbers for the shared filters (dates, product, type) and reloads when they change. */
export function useOverview() {
  const { from, to, productId, categoryId, setRange, setProductId, setCategoryId: setCategory } = useFilters();
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<{ p_id: number; p_name: string; category_id: number | null }[]>([]);
  const [categories, setCategories] = useState<{ category_id: number; name: string }[]>([]);
  const [attempt, setAttempt] = useState(0);   // bumped by retry()

  useEffect(() => {
    getMyProducts().then(setProducts).catch(() => setProducts([]));
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, [attempt]);

  // picking a different type clears a product that no longer belongs to it
  const setCategoryId = (id: number | null) => {
    setCategory(id);
    if (productId !== null && id !== null && products.find((p) => p.p_id === productId)?.category_id !== id) setProductId(null);
  };

  useEffect(() => {
    if (from > to) return;
    // If the filters change again before this answer arrives, the old answer is ignored
    // (otherwise a slow earlier request could overwrite the newer one with stale numbers).
    let ignore = false;
    setLoading(true);
    getOverview(from, to, productId, categoryId)
      .then((d) => { if (!ignore) { setData(d); setError(""); } })
      .catch((e) => { if (!ignore) setError(errorText(e, "Could not load the data.")); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [from, to, productId, categoryId, attempt]);

  return {
    data, error, loading, from, to, productId, setProductId, categoryId, setCategoryId, categories, products, setRange,
    retry: () => { setError(""); setAttempt((n) => n + 1); },
  };
}
