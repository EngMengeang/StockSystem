import { DataTypes } from "sequelize";
import sequelize from "../ulits/database.js";

const ImportProduct = sequelize.define('imports', {
  imp_id: { primaryKey: true, autoIncrement: true, type: DataTypes.INTEGER },
  imp_quantity: { type: DataTypes.INTEGER, allowNull: false },
  unit_cost: { type: DataTypes.FLOAT, allowNull: true },                 // cost per unit on this delivery
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }, // when it arrived
}, { timestamps: false, indexes: [{ fields: ['createdAt'] }] });

export default ImportProduct;
