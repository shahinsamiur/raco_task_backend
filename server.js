require("dotenv").config();

const app = require("./app");
const { testDBConnection } = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await testDBConnection();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();
