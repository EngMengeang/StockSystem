import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, TrendingUp, Edit, Settings, Plus, Save, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect, use } from "react";

// table
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button";

// api
import { getcustomer, deleteCustomer, addCustomer, updateCustomer, gettotalCustomer } from "@/services/customerService";

export const CustomerInsights = () => {
  const [customers, setCustomers] = useState([]);
  const [totalCustomer, setTotalCustomer] = useState(0);

  // Dialog states
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)

  // Editing state
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [loadAllData, setLoadAllData] = useState(false);

  // customer form state
    const [customerForm, setCustomerForm] = useState({
    customername: "",
    address: "",
    phonenumber: "",
    email: "",
    notes: "",
    vehicletypename: "",
    licenseplate: "",
  })

  useEffect(() => {
    // Fetch customers when component mounts
    fetchCustomer();
    fetchtotalCustomer();
  }, []);

  useEffect(() => {
    fetchCustomer();
    setLoadAllData(false);
  }, [loadAllData]);

  const fetchtotalCustomer= async () => {
        try {
          const data = await gettotalCustomer(); 
          setTotalCustomer(data.count);
        } catch (error) {
          console.error("Error fetching customers:", error);
        }
    };
  // Customer functions
  const handleAddCustomer = (e) => {
    e.preventDefault()
    if (editingCustomer) {
      // customerAPI.update(editingCustomer.customerid, customerForm)
      console.log ("Updating customer:", editingCustomer.customerid, customerForm)
      updateCustomer(editingCustomer.customerid, customerForm)
      setEditingCustomer(null)
    } else {
      // customerAPI.create(customerForm)
      addCustomer(customerForm)
    }
    setCustomerForm({
      customername: "",
      address: "",
      phonenumber: "",
      email: "",
      notes: "",
      vehicletypename: "",
      licenseplate: "",
    })
    setIsCustomerDialogOpen(false)
    setLoadAllData(true)
  }

  // handle edit customer
  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer)
    setCustomerForm({
      customername: customer.customername,
      address: customer.address,
      phonenumber: customer.phonenumber,
      email: customer.email,
      notes: customer.notes,
      vehicletypename: customer.vehicletypename,
      licenseplate: customer.licenseplate,
    })
    setIsCustomerDialogOpen(true)
  }

  const handleDeleteCustomer = (id) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      deleteCustomer(id)
        .then(() => {
          setLoadAllData(true)
        })
        .catch((error) => {
          console.error("Error deleting customer:", error);
        });
    }
  }

  const fetchCustomer = async () => {
      try {
              const data = await getcustomer();
              setCustomers(data);
          } catch (error) {
              console.error("Error fetching stations:", error);
          }
      };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Customer Insights</h2>
        <p className="text-muted-foreground">
          Understand customer behavior and loyalty patterns
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomer}</div>
            <p className="text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repeat Customers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground">
              Customer retention rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Spend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$42.18</div>
            <p className="text-xs text-muted-foreground">
              Per customer visit
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Customers by Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">John Smith</p>
                  <p className="text-xs text-muted-foreground">john@email.com</p>
                  <p className="text-xs text-muted-foreground">Vehicle: Sedan | ABC-123</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">$1,234.56</p>
                  <p className="text-xs text-muted-foreground">Total spent</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Sarah Johnson</p>
                  <p className="text-xs text-muted-foreground">sarah@email.com</p>
                  <p className="text-xs text-muted-foreground">Vehicle: SUV | XYZ-789</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">$987.43</p>
                  <p className="text-xs text-muted-foreground">Total spent</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* <Card>
          <CardHeader>
            <CardTitle>Customer Visit Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Customer frequency chart will be displayed here</p>
          </CardContent>
        </Card> */}
      </div>

      <Card>
        <div className="flex justify-between items-center space-y-0 pr-8 pb-2">
        <CardHeader>
          <CardTitle>Customers</CardTitle>
        </CardHeader>
        {/* Insert new customer */}
        <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingCustomer(null)
                      setCustomerForm({
                        customername: "",
                        address: "",
                        phonenumber: "",
                        email: "",
                        notes: "",
                        vehicletypename: "",
                        licenseplate: "",
                      })
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Customer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-white">
                  <DialogHeader>
                    <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
                    <DialogDescription>
                      {editingCustomer ? "Update customer information" : "Enter customer information below"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddCustomer} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customername">Customer Name</Label>
                        <Input
                          id="customername"
                          placeholder="Enter customer name"
                          value={customerForm.customername}
                          onChange={(e) => setCustomerForm({ ...customerForm, customername: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter email address"
                          value={customerForm.email}
                          onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phonenumber">Phone Number</Label>
                        <Input
                          id="phonenumber"
                          placeholder="Enter phone number"
                          value={customerForm.phonenumber}
                          onChange={(e) => setCustomerForm({ ...customerForm, phonenumber: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="licenseplate">License Plate</Label>
                        <Input
                          id="licenseplate"
                          placeholder="Enter license plate"
                          value={customerForm.licenseplate}
                          onChange={(e) => setCustomerForm({ ...customerForm, licenseplate: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        placeholder="Enter full address"
                        value={customerForm.address}
                        onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehicletypename">Vehicle Type</Label>
                      <Select
                        value={customerForm.vehicletypename}
                        onValueChange={(value) => setCustomerForm({ ...customerForm, vehicletypename: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="Sedan" className="hover:bg-black hover:text-white">Sedan</SelectItem>
                          <SelectItem value="SUV" className="hover:bg-black hover:text-white">SUV</SelectItem>
                          <SelectItem value="Truck" className="hover:bg-black hover:text-white">Truck</SelectItem>
                          <SelectItem value="Compact" className="hover:bg-black hover:text-white">Compact</SelectItem>
                          <SelectItem value="Van" className="hover:bg-black hover:text-white">Van</SelectItem>
                          <SelectItem value="Motorcycle" className="hover:bg-black hover:text-white">Motorcycle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Enter any additional notes"
                        value={customerForm.notes}
                        onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      {editingCustomer ? "Update Customer" : "Add Customer"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
        </div>
        <CardContent className="overflow-y-auto max-h-90">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone number</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vehicletypename</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length > 0 ? (
                customers.map((item) => (
                  <TableRow key={item.customerid}>
                    <TableCell>{item.customername}</TableCell>
                    <TableCell>{item.phonenumber}</TableCell>
                    <TableCell>{item.address}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{item.vehicletypename}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditCustomer(item)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDeleteCustomer(item.customerid)}>
                        < Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
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