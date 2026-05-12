import dotenv from "dotenv";
import path from "path";

// Cargar variables de entorno desde .env en la carpeta raíz
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export default {
  schema: path.resolve(__dirname, "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    path: path.resolve(__dirname, "migrations"),
  },
};
