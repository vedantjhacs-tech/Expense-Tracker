const express = require("express");
const expensesRouter = require("./routes/expenses");
const usersRouter = require("./routes/users");

const app = express();

app.use(express.json());

app.use("/api/expenses", expensesRouter);
app.use("/api/users", usersRouter);

app.get("/", (req, res) => {
    res.send("Expense Tracker API is running!");
});

module.exports = app;