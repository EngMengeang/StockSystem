import sequelize from "../ulits/database.js";
import Product from "../model/product.js";
import ImportProduct from "../model/importProduct.js";
import ExpireProduct from "../model/expireProduct.js";
import Stock from "../model/stock.js";
import { Sequelize } from "sequelize";
import Sale from "../model/sale.js";
// get all product
export async function getProducts() {
  try {
    const products = await Product.findAll({
      attributes: ['p_id', 'p_name', 'p_price'],
      include: [
        {
          model: Stock,
          as: 'Stock',
          attributes: ['s_quantity']
        }
      ]
    });

    return products;
  } catch (error) {
    console.error("Error fetching products:", error.message);
    throw error;
  }
}
 // get specific product

// update product
export async function updateProductById(p_id, updateData) {
  try {
    const { p_price } = updateData;

    // Check if product exists
    const product = await Product.findOne({ where: { p_id } });

    if (!product) {
      return null; // ❌ Product not found
    }

    // Update price if provided
    if (p_price !== undefined) {
      product.p_price = p_price;
      await product.save();
    }

    return product; // ✅ Return updated product

  } catch (error) {
    console.error("Error updating product price:", error.message);
    throw error;
  }
}

// delete product
export async function deleteProductById(p_id) {
  try {
    // Optional: delete related records manually (if cascade not set)
    await ImportProduct.destroy({ where: { p_id } });
    await ExpireProduct.destroy({ where: { p_id } });
    await Stock.destroy({ where: { p_id } });
    await Sale.destroy({ where: { p_id } });

    // Now delete the product
    const deletedCount = await Product.destroy({
      where: { p_id }
    });

    return deletedCount; // 1 if deleted, 0 if not found
  } catch (error) {
    console.error("Error deleting product:", error.message);
    throw error;
  }
}
// create new product

export async function insertProduct(data) {
  try {
    const { p_name, p_price, imp_quantity } = data;

    // Check if product exists
    let product = await Product.findOne({ where: { p_name } });

    if (product) {
      // Update product price
      product.p_price = p_price;
      await product.save();

      // Insert into import table
      await ImportProduct.create({
        p_id: product.p_id,
        imp_quantity
      });

      // Update stock
      const stock = await Stock.findOne({ where: { p_id: product.p_id } });
      if (stock) {
        stock.s_quantity += imp_quantity;
        await stock.save();
      } else {
        await Stock.create({
          p_id: product.p_id,
          s_quantity: imp_quantity
        });
      }

      return { message: "Product updated with new import and stock" };
    } else {
      // Create product, import, and stock
      const newProduct = await Product.create(
        {
          p_name,
          p_price,
          ImportProduct: [{ imp_quantity }],
          Stock: { s_quantity: imp_quantity }
        },
        {
          include: [
            { model: ImportProduct, as: "ImportProduct" },
            { model: Stock, as: "Stock" }
          ]
        }
      );

      return { message: "New product created with import and stock" };
    }
  } catch (error) {
    console.error("Error inserting product:", error.message);
    throw error;
  }
}


export async function getProductByName(p_name) {
  try {
    const product = await Product.findOne({
      where: { p_name },
      attributes: ['p_id', 'p_name', 'p_price'],
      include: [
        {
          model: Stock,
          as: 'Stock',
          attributes: ['s_quantity']
        }
      ]
    });

    if (!product) return null;

    return {
      p_id: product.p_id,
      p_name: product.p_name,
      p_price: product.p_price,
      s_quantity: product.Stock ? product.Stock.s_quantity : 0
    };

  } catch (error) {
    console.error("Error fetching product by name:", error.message);
    throw error;
  }
}


export async function saleProducts(p_name, quantity) {
  try {
    // Find product by name with stock info
    const product = await Product.findOne({
      where: { p_name },
      include: [{ model: Stock, as: "Stock" }]
    });

    if (!product) {
      return { success: false, message: "Product not found" };
    }

    const stock = product.Stock;

    if (!stock || stock.s_quantity < quantity) {
      return { success: false, message: "Insufficient stock" };
    }

    // Deduct stock quantity
    stock.s_quantity -= quantity;
    await stock.save();

    // Create sale record
    await Sale.create({
      p_id: product.p_id,
      quantity
    });

    return { success: true, message: "Sale successful", remaining_stock: stock.s_quantity };
  } catch (error) {
    console.error("Error processing sale:", error.message);
    throw error;
  }
}

// change --by manh seila
export async function getAllSoldProducts() {
  try {
    const results = await Sale.findAll({
      attributes: [
        [Sequelize.col('product.p_id'), 'p_id'],
        [Sequelize.col('product.p_name'), 'p_name'],
        [Sequelize.fn('SUM', Sequelize.col('sale.quantity')), 'total_quantity_sold'],
      ],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: [], // already selecting needed fields manually
        },
      ],
      group: ['product.p_id', 'product.p_name'],
      order: [[Sequelize.literal('total_quantity_sold'), 'DESC']],
    });

    return results.map((sale) => ({
      p_id: sale.get('p_id'),
      p_name: sale.get('p_name'),
      quantity: Number(sale.get('total_quantity_sold')),
    }));
  } catch (error) {
    console.error("Error fetching sold products:", error.message);
    throw error;
  }
}


export async function expireProductByName(p_name) {
  try {
    // Find product with stock
    const product = await Product.findOne({
      where: { p_name },
      include: [{ model: Stock, as: "Stock" }]
    });

    if (!product) {
      return { success: false, message: "Product not found" };
    }

    const stock = product.Stock;

    if (!stock || stock.s_quantity <= 0) {
      return { success: false, message: "No stock available to expire" };
    }

    const quantityToExpire = stock.s_quantity;

    // Insert into ExpireProduct table
    await ExpireProduct.create({
      p_id: product.p_id,
      quantity: quantityToExpire
    });

    // Update stock to zero
    stock.s_quantity = 0;
    await stock.save();

    return {
      success: true,
      message: `Expired ${quantityToExpire} unit(s) of '${p_name}'`,
      expired_quantity: quantityToExpire
    };

  } catch (error) {
    console.error("Repository error (expireProductByName):", error.message);
    throw error;
  }
}

export async function getAllExpiredProducts() {
  try {
    const results = await ExpireProduct.findAll({
      include: [
        {
          model: Product,
          as: "product", // ✅ Must match alias in association
          attributes: ["p_name"]
        }
      ],
      attributes: ["quantity"]
    });

    return results.map(entry => ({
      p_name: entry.product?.p_name || "Unknown",
      quantity: entry.quantity
    }));

  } catch (error) {
    console.error("Error fetching expired products:", error);
    throw error;
  }
}

export async function getProductInventorySummary() {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        p.p_id,
        p.p_name,
        COALESCE(SUM(DISTINCT i.total_import), 0) AS total_import,
        COALESCE(SUM(s.total_sold), 0) AS quantity_sold,
        COALESCE(SUM(e.total_expired), 0) AS quantity_expired
      FROM products p
      LEFT JOIN (
        SELECT p_id, SUM(imp_quantity) AS total_import
        FROM imports
        GROUP BY p_id
      ) i ON p.p_id = i.p_id
      LEFT JOIN (
        SELECT p_id, SUM(quantity) AS total_sold
        FROM sales
        GROUP BY p_id
      ) s ON p.p_id = s.p_id
      LEFT JOIN (
        SELECT p_id, SUM(quantity) AS total_expired
        FROM expires
        GROUP BY p_id
      ) e ON p.p_id = e.p_id
      GROUP BY p.p_id, p.p_name
      ORDER BY p.p_name ASC
    `);

    return results;

  } catch (error) {
    console.error("Error fetching inventory summary:", error.message);
    throw error;
  }
}