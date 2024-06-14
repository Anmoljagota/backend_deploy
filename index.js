const express = require("express");
const morgan = require("morgan");
const moment = require("moment");

const app = express();
const fs = require("fs");
app.use(express.json());
// Custom Morgan Token for Date and Time
morgan.token("datetime", () => moment().format("YYYY-MM-DD HH:mm:ss"));
// Custom Morgan Format String
const morganFormat =
  ":method :url :status :res[content-length] - :response-time ms :datetime";

// Apply Morgan Middleware
app.use(morgan(morganFormat));
app.listen(8080, () => {
  console.log("server is listening on port 8080");
});

app.post("/trades", (req, res) => {
  const { type, user_id, symbol, shares, price } = req.body;
  if (!type || !user_id || !symbol || !shares || !price) {
    return res.status(400).send("provide all details");
  }
  try {
    let id;
    const readingdata = fs.readFileSync("trades.json", { encoding: "utf-8" });
    const newdata = JSON.parse(readingdata);

    if (newdata.length === 0) {
      id = 1;
    } else {
      id = newdata[newdata.length - 1].id + 1;
    }
    const savetrade = { ...req.body, id };
    newdata.push(savetrade);
    const save = JSON.stringify(newdata);
    fs.writeFileSync("trades.json", save, "utf-8");
    return res.status(200).send("data saved");
  } catch (err) {
    res.send(err);
  }
});

app.get("/trades", (req, res) => {
  fs.readFile("trades.json", "utf-8", (err, data) => {
    if (err) {
      return res.status(400).send(err);
    }
    return res.status(200).send(data);
  });
});

app.get("/trades/:id", (req, res) => {
  const readdata = fs.readFileSync("trades.json", { encoding: "utf-8" });
  const data = JSON.parse(readdata);
  const { id } = req.params;
  const singletrade = data.filter((trade) => {
    return trade.id == id;
  });
  if (singletrade.length > 0) {
    return res.status(200).send(singletrade);
  }
  return res.status(404).send("ID not found");
});

app.delete("/trades/:id", (req, res) => {
  const readdata = fs.readFileSync("trades.json", { encoding: "utf-8" });
  const data = JSON.parse(readdata);
  const { id } = req.params;
  const singletrade = data.filter((trade) => {
    return trade.id != id;
  });
  const updatedData = JSON.stringify(singletrade);
  fs.writeFile("trades.json", updatedData, (err, data) => {
    if (err) {
      res.status(400).send(err);
    } else {
      return res.status(200).send(updatedData);
    }
  });
});

// PATCH /trades/:id
app.patch("/trades/:id", (req, res) => {
  const { price } = req.body;
  if (price === undefined) {
    return res.status(400).send("Provide a price to update");
  }
  try {
    const data = fs.readFileSync("trades.json", "utf-8");
    const newdata = JSON.parse(data);
    const { id } = req.params;
    const trade = newdata.find((trade) => trade.id == id);
    console.log(trade, "tradedata");
    if (trade) {
      trade.price = price;
      fs.writeFileSync("trades.json", JSON.stringify(newdata), "utf-8");
      return res.status(200).send("Price updated");
    } else {
      return res.status(404).send("ID not found");
    }
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
});
