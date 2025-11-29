import { MongoClient, Db } from "mongodb";

const uri = "mongodb://localhost:27017";
const dbName = "cosim";

let cachedDb: Db | null = null;

export async function getMongoDB(): Promise<Db> {
  if (cachedDb) return cachedDb;

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  cachedDb = db;
  return db;
}
