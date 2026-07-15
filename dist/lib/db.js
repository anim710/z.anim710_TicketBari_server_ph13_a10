import { MongoClient } from "mongodb";
import { env } from "../config/env.js";
let db;
export async function connectDB() {
    if (db)
        return db;
    const client = new MongoClient(env.MONGODB_URI);
    await client.connect();
    db = client.db(env.DB_NAME);
    console.log("✅ MongoDB connected:", env.DB_NAME);
    return db;
}
export default connectDB;
//# sourceMappingURL=db.js.map