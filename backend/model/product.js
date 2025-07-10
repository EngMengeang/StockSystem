import { Sequelize, DataTypes} from "sequelize";
import sequelize from "../ulits/database.js";

const Product = sequelize.define('products', {
  p_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  p_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  p_price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  }
}, {
    timestamps: false
}
);

export default Product;