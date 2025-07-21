import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart } from '@mui/x-charts/LineChart';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Plus, Save, Trash2 } from "lucide-react";
import {
  getMyProducts,
  postProduct,
  updateProduct,
  deleteProduct,
} from "@/services/productService";

export const ProductAnalysis = () => {
  const [products, setProducts] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productForm, setProductForm] = useState({ p_name: "", p_price: "", imp_quantity: "" });
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [edit , setedit]= useState(false);

  //
  const [categories, setCategories] = useState([]);
  const [prices, setPrices] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

  const fetchProducts = async () => {
    try {
      const data = await getMyProducts();
      setProducts(data);
      const names = data.map((item) => item.p_name);
        const productPrices = data.map((item) => item.p_price);
        const lowStock = data.filter((item) => item.Stock.s_quantity <= 10);
        
        setLowStockItems(lowStock);
        setCategories(names);
        setPrices(productPrices);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...productForm,
        p_price: parseFloat(productForm.p_price),
        imp_quantity: parseInt(productForm.imp_quantity),
      };

      if (!productData.p_name || isNaN(productData.p_price) || isNaN(productData.imp_quantity)) {
        alert("Please fill in all fields correctly.");
        return;
      }

      if (editingProduct) {
        console.log()
        await updateProduct(productData, editingProduct.p_id);
        setEditingProduct(null);
      } else {
        await postProduct(productData);
      }

      setProductForm({ p_name: "", p_price: "", imp_quantity: "" });
      setIsDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleEdit = (product) => {
  setEditingProduct(product);
  setProductForm({
    p_name: product.p_name || "",
    p_price: product.p_price !== undefined ? parseFloat(product.p_price).toString() : "",
    imp_quantity: product.imp_quantity !== undefined ? parseInt(product.imp_quantity).toString() : "",
  });
  setIsDialogOpen(true);
  console.log(edit)
};

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(id);
      fetchProducts();
      
    }
  };

  const filteredProducts = products.filter((p) =>
    p.p_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Product Analysis</h2>
          <p className="text-muted-foreground">Detailed insights into product performance and inventory</p>
        </div>
        <div className="mb-10">
          <Input
            type="text"
            placeholder="Search by product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="bar-chart">Stock Levels</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Products</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({ p_name: "", p_price: "", imp_quantity: "" });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                    <DialogDescription>
                      {editingProduct ? "Update product information" : "Enter product information below"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="productname">Product Name</Label>
                      <Input
                        id="productname"
                        value={productForm.p_name}
                        onChange={(e) => setProductForm({ ...productForm, p_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="unitprice">Unit Price</Label>
                        <Input
                          id="unitprice"
                          type="number"
                          step="0.01"
                          value={productForm.p_price}
                          onChange={(e) => setProductForm({ ...productForm, p_price: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stockquantity">Stock Quantity</Label>
                        <Input
                          id="stockquantity"
                          type="number"
                          value={productForm.imp_quantity}
                          onChange={(e) => setProductForm({ ...productForm, imp_quantity: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-blue-500 text-white hover:bg-blue-300">
                      <Save className="w-4 h-4 mr-2" /> {editingProduct ? "Update Product" : "Add Product"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent className="overflow-y-auto max-h-110">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-indigo-700">Product Name</TableHead>
                    <TableHead className="text-indigo-700">Price</TableHead>
                    <TableHead className="text-indigo-700">Stock</TableHead>
                    <TableHead className="text-right text-indigo-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <TableRow key={product.p_id}>
                        <TableCell>{product.p_name}</TableCell>
                        <TableCell>${product.p_price}</TableCell>
                        <TableCell>{product.Stock?.s_quantity ?? 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => {handleEdit(product); setedit(true)}}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(product.p_id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No matching products
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bar-chart">
          {/* Add bar chart visualization here */}
          <Card className="pr-6">
          <CardHeader>
            <CardTitle>Sales Price</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Sales chart will be displayed here</p>
          </CardContent>
          <LineChart
            xAxis={[
              {
                id: 'products',
                data: categories,
                scaleType: 'point',
              },
            ]}
            series={[
              {
                data: prices,
                label: 'Price ($)',
                color: '#007bff',
              },
            ]}
            height={300}
          />
        </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
