import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button";
import { Package, TrendingUp, AlertCircle, Edit, Settings, Plus, Save, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
// api
import { getMyProducts, getProductByName, postProduct } from '@/services/productService'

export const ProductAnalysis = () => {
  const [products, setProduct] = useState([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [productForm, setProductForm] = useState({
    "p_name": "",
    "p_price": "",
    "imp_quantity": ""
  })
  const [editingProduct, setEditingProduct] = useState(null);
  const [loadAllData, setLoadAllData] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, []);

  useEffect(() => {
    if (loadAllData) {
      fetchProduct();
      setLoadAllData(false);
    }
  }, [loadAllData]);

  const fetchProduct= async () => {
      try {
        const data = await getMyProducts();
        setProduct(data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
  };

  // Product functions
  const handleAddProduct = (e) => {
    e.preventDefault()
    const productData = {
      ...productForm,
      p_price: Number.parseFloat(productForm.p_price),
      imp_quantity: Number.parseInt(productForm.imp_quantity)
    }

    // if (editingProduct) {
    //   // productAPI.update(editingProduct.productid, productData)
    //   updateProduct(editingProduct.productid, productData)
    //   setEditingProduct(null)
    // } else {
      // productAPI.create(productData)
      postProduct(productData);
    // }
    setProductForm({
      "p_name": "",
      "p_price": "",
      "imp_quantity": ""
    })
    setIsProductDialogOpen(false)
    setLoadAllData(true);
  }

  // const handleEditProduct = (product) => {
  //   setEditingProduct(product)
  //   setProductForm({
  //     productname: product.productname,
  //     unitprice: product.unitprice.toString(),
  //     producttype: product.producttype,
  //     supplier: product.supplier,
  //     stockquantity: product.stockquantity.toString(),
  //   })
  //   setIsProductDialogOpen(true)
  // }

  // const handleDeleteProduct = (id) => {
  //   if (confirm("Are you sure you want to delete this product?")) {
  //     deleteProduct(id)
  //     setLoadAllData(true);
  //   }
  // }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Product Analysis</h2>
        <p className="text-muted-foreground">
          Detailed insights into product performance and inventory
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Product Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              Active categories
            </p>
          </CardContent>
        </Card> */}

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Selling</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Snacks</div>
            <p className="text-xs text-muted-foreground">
              Top category by volume
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Products need restocking
            </p>
          </CardContent>
        </Card> */}
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="stock">Stock Levels</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
              <CardTitle>Products</CardTitle>
              <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingProduct(null)
                      setProductForm({
                        "p_name": "",
                        "p_price": "",
                        "imp_quantity": ""
                      })
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                    <DialogDescription>
                      {editingProduct ? "Update product information" : "Enter product information below"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="productname">Product Name</Label>
                      <Input
                        id="productname"
                        placeholder="Enter product name"
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
                          placeholder="Enter price"
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
                          placeholder="Enter stock quantity"
                          value={productForm.imp_quantity}
                          onChange={(e) => setProductForm({ ...productForm, imp_quantity: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-blue-500 text-white hover:bg-blue-300">
                      <Save className="w-4 h-4 mr-2" />
                      {editingProduct ? "Update Product" : "Add Product"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-110">
              <Table>
                <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      {/* <TableHead>Status</TableHead> */}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  { products.length > 0 ? products.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{product.p_name}</TableCell>
                    <TableCell>${product.p_price}</TableCell>
                    <TableCell>{product.Stock.s_quantity}</TableCell>
                    {/* <TableCell>
                      <Badge variant={product.lowStock ? "destructive" : "default"}>
                        {product.lowStock ? "Low Stock" : "In Stock"}
                      </Badge>
                    </TableCell> */}
                    <TableCell>
                      <div className="space-x-2 text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No products found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>    
            </CardContent>
          </Card>
        </TabsContent>

        {/* <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Stock Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Motor Oil 5W-30</span>
                  <Badge variant="destructive">Low (3 units)</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Energy Drinks</span>
                  <Badge variant="destructive">Low (12 units)</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Candy Bars</span>
                  <Badge variant="secondary">Good (156 units)</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Coffee</span>
                  <Badge variant="secondary">Good (89 units)</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Category performance chart will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>
    </div>
  );
};