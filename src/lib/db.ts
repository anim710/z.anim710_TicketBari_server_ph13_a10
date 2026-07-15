import { MongoClient, type Db } from "mongodb";
import { env } from "../config/env.js";

let db: Db | undefined;

export async function connectDB(): Promise<Db> {
  if (db) return db;
  const client = new MongoClient(env.MONGODB_URI);
  await client.connect();
  db = client.db(env.DB_NAME);
  console.log("✅ MongoDB connected:", env.DB_NAME);
  return db;
}

export default connectDB;
