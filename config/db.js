const postgres = require("postgres");

const sql = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
});

const testDBConnection = async () => {
  try {
    await sql`select 1`;
    console.log("✅ Database connected successfully (Supabase)");
  } catch (error) {
    console.error("❌ Database connection failed");
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = {
  sql,
  testDBConnection,
};
