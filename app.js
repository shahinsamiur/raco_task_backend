const express = require("express");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const projectsRoutes = require("./routes/projectsRoutes");
const requestRoute = require("./routes/requestRoute");
const app = express();

app.use(express.json());
app.get("/", (req, res) => {
  res.send("right endpoint");
});
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/request", requestRoute);
app.use("/api/tasks", requestRoute);
// error handler MUST be last
app.use(errorHandler);

module.exports = app;
