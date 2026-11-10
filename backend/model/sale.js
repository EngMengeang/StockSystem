import sequelize from "../ulits/database.js";
import { DataTypes } from "sequelize";

const Sale = sequelize.define('sale', {
  sale_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  // price at the time of sale, so revenue stays correct if the product price changes later
  unit_price: { type: DataTypes.FLOAT, allowNull: false },
}, {
  indexes: [{ fields: ['createdAt'] }, { fields: ['p_id'] }],   // fast date / product filters
});

export default Sale;
