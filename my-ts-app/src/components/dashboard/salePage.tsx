import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SaleForm() {
  const [form, setForm] = useState({ p_name: "", quantity: "" });
  const [response, setResponse] = useState<{ success?: boolean; message?: string; remaining_stock?: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResponse(null);

    try {
      const res = await fetch("http://localhost:4000/api/products/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, quantity: Number(form.quantity) }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ success: false, message: "Something went wrong" });
    }
  };

  return (
    <div className="flex items-center min-h-screen">
    <Card className="max-w-md mx-auto mt-10 p-4 shadow-lg">
      <CardHeader>
        <CardTitle>Create Sale</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="p_name">Product Name</Label>
            <Input
              id="p_name"
              placeholder="e.g. Mango"
              value={form.p_name}
              onChange={(e) => setForm({ ...form, p_name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
            />
          </div>
          <Button type="submit" className="w-full bg-blue-500 text-white hover:bg-blue-300">
            Submit Sale
          </Button>
        </form>

        {response && (
          <div className="mt-4 text-sm">
            {response.success ? (
              <p className="text-green-600">
                ✅ {response.message} - Remaining Stock: {response.remaining_stock}
              </p>
            ) : (
              <p className="text-red-600">❌ {response.message}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
