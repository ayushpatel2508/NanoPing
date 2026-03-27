import pg from "pg"
import dotenv from "dotenv"
dotenv.config()

const {Pool} =pg;


const config = process.env.DATABASE_URL 
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.POSTGRE_HOST,
        user: process.env.POSTGRE_USER,
        password: process.env.POSTGRE_PASSWORD,
        database: process.env.POSTGRE_DB,
        port: 5432
      };

const pool = new Pool(config);

pool.on("connect",()=>{
    console.log("PostgreSQL connected")
})
pool.on("error",()=>{
    console.log("PostgreSQL error")
})


export default pool;