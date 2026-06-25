import express from "express";
import multer from "multer";
import mysql from "mysql2";

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "alpha_ecommerce_database",
});
db.connect();

app.get("/api/list-all-items", (req, res) => {
  db.query("select * from items", (err, result) => {
    if (err) {
      console.log(err.message);
      res.send("error");
    } else {
      res.json(result);
    }
  });
});

app.get("/api/list-by-category/:cat", (req, res) => {
  const cat = req.params.cat;

  db.query("select * from items where category = ?", [cat], (err, result) => {
    if (err) {
      console.log(err.message);
      res.send("error");
    } else {
      res.json(result);
    }
  });
});

app.get("/api/search-item/:value", (req, res) => {
  const value = req.params.value;

  db.query(
    "select * from items where title like ?",
    [`%${value}%`],
    (err, result) => {
      if (err) {
        console.log(err.message);
        res.send("error");
      } else {
        res.json(result);
      }
    },
  );
});

app.get("/api/product/:id", (req, res) => {
  const id = req.params.id;

  db.query("select * from items where id = ?", [id], (err, result) => {
    if (err) {
      console.log(err.message);
      res.send("error");
    } else {
      res.json(result);
    }
  });
});

app.post("/api/upload-product", upload.single("image"), (req, res) => {
  const imagePath = "/images/" + req.file.filename;
  const { title, category, description, price, stock } = req.body;

  db.query(
    "insert into items values (?, ?, ?, ?, ?, ?, ?)",
    [null, title, category, description, price, stock, imagePath],
    (err) => {
      if (err) {
        console.log(err.message);
        res.send("error");
      } else {
        console.log("Successfully added!");
        res.send("success");
      }
    },
  );
});

app.post("/api/edit-item/:id", upload.single("image"), (req, res) => {
  const id = req.params.id;
  const imagePath = "/images/" + req.file.filename;
  const { title, category, description, price, stock } = req.body;

  db.query(
    `update items set title = ?, category = ?, description = ?, price = ?, stock = ?, img = ? where id = ${id}`,
    [title, category, description, price, stock, imagePath],
    (err) => {
      if (err) {
        console.log(err.message);
        res.send("error");
      } else {
        console.log("Successfully edited");
        res.send("success");
      }
    },
  );
});

app.post("/api/delete-item/:id", upload.single("image"), (req, res) => {
  const id = req.params.id;

  db.query("delete from items where id = ?", [id], (err) => {
    if (err) {
      console.log(err.message);
      res.send("error");
    } else {
      console.log("Successfully edited");
      res.send("success");
    }
  });
});

app.listen(4000, () => console.log("Server started at port 4000"));
