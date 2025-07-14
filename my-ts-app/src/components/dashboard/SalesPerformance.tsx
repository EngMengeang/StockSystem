import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { AlertTriangle, Package, Fuel, Edit, Settings  } from "lucide-react";
// select
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// table
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button";
// api
import { getgasstation } from "@/services/stationService";
import { getinvoice } from "@/services/invoiceService";

export const SalesPerformance = () => {
      const [stations, setStations] = useState([]);
      const [selectedStation, setSelectedStation] = useState();
      const [invoice, setInvoice] = useState([]);

      useEffect(() => {
        fetchStations();
    }, []);

      useEffect(() => {
        console.log("Selected station:", selectedStation);
          fetchInvoice();
      }, [selectedStation]);

    useEffect(() => {
      console.log("Invoice state updated:", invoice.map(item => item));
    }, [invoice]);

    const fetchStations = async () => {
      try {
              const data = await getgasstation();
              setStations(data);
          } catch (error) {
              console.error("Error fetching stations:", error);
        }
    }

    const fetchInvoice = async () => {
      try {
              const data = await getinvoice(selectedStation);
              setInvoice(data);
          } catch (error) {
              console.error("Error fetching stations:", error);
        }
    }
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Sales Performance</h2>
            <p className="text-muted-foreground">
            Analyze sales trends and product performance
            </p>
        </div>
        <div className="flex items-center space-x-4">
            <Label htmlFor="role">Campus</Label>
            <Select value={selectedStation} onValueChange={(value) => setSelectedStation(value)} >
                <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="w-48 max-h-60 rounded-md background-white shadow-lg">
                    {
                        stations.map((station) => (
                            <SelectItem key={station.gasstationid} value={station.gasstationid}>
                                {station.gasstationname}
                            </SelectItem>
                        ))
                    }
                </SelectContent>
            </Select>
        </div>
      </div>
      {/* table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Invoices</CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-135">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Gasstation</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Total Price</TableHead>
                {/* <TableHead className="text-right">Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.length > 0 ? (
                invoice.map((item) => (
                  <TableRow key={item.invoiceid}>
                    <TableCell>{item.customername}</TableCell>
                    <TableCell>{item.productname}</TableCell>
                    <TableCell>{item.gasstationname}</TableCell>
                    <TableCell>{item.quantitysold}</TableCell>
                    <TableCell>{(item.sellingprice / 26139).toFixed(2)} $</TableCell>
                    <TableCell>{(item.total_price / 26139).toFixed(2)} $</TableCell>
                    {/* <TableCell className="space-x-2 text-right">
                      <Button variant="outline" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </TableCell> */}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No products found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};