import pg from "pg"
import dotenv from "dotenv"
dotenv.config()

const {Pool} =pg;


const pool=new Pool({
    host:process.env.POSTGRE_HOST,
    user:process.env.POSTGRE_USER,
    password:process.env.POSTGRE_PASSWORD,
    database:process.env.POSTGRE_DB,
    port:5432
})

pool.on("connect",()=>{
    console.log("PostgreSQL connected")
})
pool.on("error",()=>{
    console.log("PostgreSQL error")
})


export default pool;