import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize( process.env.DB_NAME, process.env.DB_USER, 'Alg0r1thm@c#',
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
  }
);

export default sequelize;