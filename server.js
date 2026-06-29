import express from "express";
import multer from "multer";
import mysql from "mysql2";
import bcrypt from "bcrypt";
import session from "express-session";
import "dotenv/config";
import path from "path";
import url from "url";

const app = express();
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);

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

app.get("/login", (req, res) => {
  if (req.session.role) {
    if (req.session.role === "admin") {
      return res.sendFile(path.join(__dirname, "views", "admin-products.html"));
    } else {
      return res.sendFile(path.join(__dirname, "public", "index.html"));
    }
  }
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/register", (req, res) => {
  if (req.session.role) {
    if (req.session.role === "admin") {
      return res.sendFile(path.join(__dirname, "views", "admin-products.html"));
    } else {
      return res.sendFile(path.join(__dirname, "public", "index.html"));
    }
  }
  res.sendFile(path.join(__dirname, "views", "register.html"));
});

app.get("/product", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "product.html"));
});

app.get("/carts", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "carts.html"));
});

app.get("/admin-dashboard", (req, res) => {
  if (req.session.role && req.session.role == "admin") {
    res.sendFile(path.join(__dirname, "views", "admin-products.html"));
  } else {
    res.send("Unauthorized access!");
  }
});

app.get("/admin-users", (req, res) => {
  if (req.session.role && req.session.role == "admin") {
    res.sendFile(path.join(__dirname, "views", "admin-users.html"));
  } else {
    res.send("Unauthorized access!");
  }
});

app.get("/api/get-cart-items", async (req, res) => {
  if (req.session.cart && req.session.cart.length != 0) {
    const items = [];
    const itemsId = req.session.cart.map((cart) => cart.itemId);
    const result = await db
      .promise()
      .query(`select * from items where id in (${[...itemsId]})`);

    result[0].forEach((item, index) => {
      item.quantity = req.session.cart[index].quantity;
      items.push(item);
    });

    res.json({ success: true, items: items });
  } else {
    res.json({ success: true, items: [] });
  }
});

app.get("/get-user-info", (req, res) => {
  if (req.session.uid) {
    return res.json({
      success: true,
      uid: req.session.uid,
      uname: req.session.fname,
      role: req.session.role,
      isSuspended: req.session.isSuspended,
    });
  } else {
    return res.json({ success: false });
  }
});

app.get("/api/get-cart-subtotal", async (req, res) => {
  if (req.session.cart) {
    if (req.session.cart.length == 0) return res.json({ success: false });

    const itemsId = req.session.cart.map((item) => item.itemId);
    const result = await db
      .promise()
      .query(`select price from items where id in (${[...itemsId]})`);
    const total = req.session.cart.reduce((accu, item, index) => {
      return accu + +item.quantity * result[0][index].price;
    }, 0);

    res.json({ success: true, total: total });
  } else {
    res.json({ success: false });
  }
});

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

app.get("/api/list-all-users", async (req, res) => {
  const response = await db
    .promise()
    .query(`select * from users where role = 'customer'`);
  res.json({ success: true, data: response[0] });
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

app.get("/api/search-user/:uname", async (req, res) => {
  const uname = req.params.uname;
  console.log(uname);
  const result = await db
    .promise()
    .query("select * from users where role = 'customer' and fullname like ?", [
      `%${uname}%`,
    ]);
  res.json({ success: true, data: result[0] });
});

app.get("/api/get-product-stat", async (req, res) => {
  if (req.session.role) {
    const productResult = await db.promise().query(`select * from items`);
    const totalProduct = productResult[0].length;
    const salesResult = await db.promise().query(`select * from orders`);
    const totalSales = salesResult[0].reduce((accu, order) => {
      return accu + +order.total_price;
    }, 0);
    const stat = { totalProduct, totalSales };
    res.json({ success: true, stat: stat });
  } else {
    res.json({ success: false });
  }
});

app.get("/api/get-user-stat", async (req, res) => {
  const customerResult = await db
    .promise()
    .query(`select * from users where role = 'customer'`);
  const totalCustomers = customerResult[0].length;

  const suspendedResult = await db
    .promise()
    .query(`select * from users where role = 'customer' and isSuspended = '1'`);
  const totalSuspended = suspendedResult[0].length;

  const activeResult = await db
    .promise()
    .query(`select * from users where role = 'customer' and isSuspended = '0'`);
  const totalActive = activeResult[0].length;

  const stat = { totalCustomers, totalSuspended, totalActive };

  res.json({ success: true, stat: stat });
});

app.get("/api/product/:id", (req, res) => {
  const id = req.params.id;

  db.query("select * from items where id = ?", [id], (err, result) => {
    if (err) {
      console.log(err.message);
      res.json({ success: false });
    } else {
      res.json({ success: true, data: result });
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

app.post("/api/checkout/:total", (req, res) => {
  if (req.session.uid) {
    const total = +req.params.total;
    db.query(`insert into orders (total_price) values(?)`, [total], (err) => {
      if (err) {
        console.log("Error at checkout" + err.message);
        res.json({ success: false });
      } else {
        res.json({ success: true });
      }
    });
  } else {
    res.json({ success: false });
  }
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

app.delete("/api/delete-user/:id", async (req, res) => {
  const id = req.params.id;

  await db.promise().query(`delete from users where id = ?`, [id]);
  res.json({ success: true });
});

app.put("/api/suspend-btn/:id", async (req, res) => {
  const id = req.params.id;

  await db
    .promise()
    .query(`update users set isSuspended = '1' where id = ?`, [id]);
  res.json({ success: true });
});

app.put("/api/unsuspend-user/:id", async (req, res) => {
  const id = req.params.id;

  await db
    .promise()
    .query(`update users set isSuspended = '0' where id = ?`, [id]);
  res.json({ success: true });
});

app.post("/api/register-user", upload.none(), async (req, res) => {
  const { fname, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    "insert into users (fullname, email, password) values (?, ?, ?)",
    [fname, email, hashedPassword],
    (err) => {
      if (err) {
        console.log(err.message);
        res.json({ success: false, message: "Something went wrong!" });
      } else {
        res.json({ success: true, message: "Successfully Added" });
      }
    },
  );
});

app.delete("/api/delete-cart-element/:id", (req, res) => {
  if (req.session.cart) {
    const id = req.params.id;
    let carts = req.session.cart;
    carts = carts.filter((item) => item.itemId != id);
    req.session.cart = carts;
    res.json({ success: true });
  }
});

app.put("/api/adjust-cart-quantity/:id/:quantity", (req, res) => {
  if (req.session.cart) {
    const { id, quantity } = req.params;

    req.session.cart = req.session.cart.map((item) => {
      return item.itemId == id ? { ...item, quantity: quantity } : item;
    });

    res.json({ success: true });
  }
});

app.post("/api/add-to-cart/:id", (req, res) => {
  const itemId = req.params.id;
  if (!req.session.cart) {
    req.session.cart = [];
  }
  const exists = req.session.cart.find((cart) => cart.itemId == itemId);
  if (!exists) {
    req.session.cart.push({ itemId: itemId, quantity: 1 });
    req.session.save((err) => {
      if (err) {
        console.log(err.message);
        res.json({ success: false });
      } else {
        res.json({ success: true });
      }
    });
  } else {
    res.json({ success: true });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("couldnt logout");
    } else {
      res.clearCookie("connect.sid");
      return res.json({ success: true });
    }
  });
});

app.post("/api/login", upload.none(), (req, res) => {
  const { email, password } = req.body;
  db.query(
    "select * from users where email = ?",
    [email],
    async (err, result) => {
      if (err) {
        console.log("err");
        return res.json({ success: false, message: "Something went wrong!" });
      } else {
        if (result.length === 0) {
          return res.json({
            success: false,
            message: "Email is not registered!",
          });
        }

        const valid = await bcrypt.compare(password, result[0].password);

        if (!valid) {
          return res.json({
            success: false,
            message: "Password is not correct!",
          });
        } else {
          if (result[0].isSuspended) {
            return res.json({
              success: false,
              message: "Sorry, your account is suspended!",
            });
          }
          req.session.uid = result[0].id;
          req.session.fname = result[0].fullname;
          req.session.role = result[0].role;
          req.session.isSuspended = result[0].isSuspended;

          req.session.save((err) => {
            if (err) {
              console.log(err.message);
            } else {
              return res.json({
                success: true,
                redirectUrl:
                  result[0].role == "admin" ? "/admin-dashboard" : "/",
              });
            }
          });
        }
      }
    },
  );
});

app.listen(process.env.PORT, () => console.log("Server started at port 4000"));
