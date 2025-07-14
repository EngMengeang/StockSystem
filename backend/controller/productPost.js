import express from 'express';
import sequelize from '../ulits/database.js';
import * as psqlProduct from '../respositories/psqlProduct.js'

// get al product
export const getAllProduct = async (req, res) => {
  try {
    const products = await  psqlProduct.getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// get product by id



// update product


export const updateProduct = async (req, res) => {
  const { id } = req.params;

  // Optional: validate numeric ID
  if (isNaN(parseInt(id))) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const updatedProduct = await psqlProduct.updateProductById(Number(id), req.body);

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct
    });
  } catch (error) {
    console.error("Update error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};


// delete product
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await psqlProduct.deleteProductById(id);

    if (deleted === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// create new product
export const createProduct = async (req, res) => {
  try {
    const product = await psqlProduct.insertProduct(req.body);
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// getproduct by name

export const getProductByName = async (req, res) => {
  const { name } = req.params;  // assuming route like /products/name/:name

  try {
    const productData = await psqlProduct.getProductByName(name);

    if (!productData || productData.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(productData);
  } catch (error) {
    console.error("Error fetching product by name:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const saleProduct = async (req, res) => {
  try {
    const { p_name, quantity } = req.body;

    if (!p_name || typeof quantity !== 'number') {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }

    const result = await psqlProduct.saleProducts(p_name, quantity);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in saleProductController:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getSoldProduct = async (req, res) => {
  try {
    const sales = await psqlProduct.getAllSoldProducts();

    if (!sales.length) {
      return res.status(404).json({ message: "No sales found" });
    }

    res.status(200).json(sales);
  } catch (error) {
    console.error("Controller error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const expireProductController = async (req, res) => {
  const { p_name } = req.body;

  try {
    const result = await psqlProduct.expireProductByName(p_name);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Controller error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getExpiredProductsController = async (req, res) => {
  try {
    const expired = await psqlProduct.getAllExpiredProducts();

    if (!expired.length) {
      return res.status(404).json({ message: "No expired products found" });
    }

    res.status(200).json(expired);
  } catch (error) {
    console.error("Controller error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getInventorySummaryController = async (req, res) => {
  try {
    const summary = await psqlProduct.getProductInventorySummary();

    if (!summary || summary.length === 0) {
      return res.status(404).json({ message: "No product inventory data found." });
    }

    res.status(200).json(summary);
  } catch (error) {
    console.error("Controller error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};