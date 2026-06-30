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

let db;
try {
  const pool = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123456",
    database: "alpha_ecommerce_database",
  });
  db = pool.promise();
} catch (err) {
  console.error("Database connection error: " + err.message);
}

// Routes to serve pages
app.get("/login", (req, res) => {
  if (req.session.uid) {
    if (req.session.role === "admin") {
      return res.sendFile(path.join(__dirname, "views", "admin-products.html"));
    } else {
      return res.sendFile(path.join(__dirname, "public", "index.html"));
    }
  }
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/register", (req, res) => {
  if (req.session.uid) {
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
  if (req.session.uid && req.session.role == "admin") {
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
////////////////////////////////////////////////////////////////////////////

// User related operations
app.post("/api/register-user", upload.none(), async (req, res) => {
  if (req.session.uid && req.session.role === "admin") {
    try {
      const { fname, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      await db.execute(
        "insert into users (fullname, email, password) values (?, ?, ?)",
        [fname, email, hashedPassword],
      );
      res.json({ success: true, message: "Successfully Added" });
    } catch (err) {
      res.json({ success: false, message: "Something went wrong!" });
    }
  }
  res.send("Unauthorized");
});

app.post("/api/login", upload.none(), async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = null;

    const [result] = await db.execute(
      "select * from users where email = ? LIMIT 1",
      [email],
    );
    user = result[0] ?? null;

    if (!user) {
      return res.json({
        success: false,
        message: "Email is not registered!",
      });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.json({
        success: false,
        message: "Password is not correct!",
      });
    } else {
      if (user.isSuspended) {
        return res.json({
          success: false,
          message: "Sorry, your account is suspended!",
        });
      }
      req.session.uid = user.id;
      req.session.fname = user.fullname;
      req.session.role = user.role;
      req.session.isSuspended = user.isSuspended;

      req.session.save((err) => {
        if (!err) {
          return res.json({
            success: true,
            redirectUrl: result[0].role == "admin" ? "/admin-dashboard" : "/",
          });
        }
      });
    }
  } catch (error) {
    return res.json({ success: false, message: "Something went wrong!" });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (!err) {
      res.clearCookie("connect.sid");
      return res.json({ success: true });
    }
  });
});

app.get("/api/list-all-users", async (req, res) => {
  if (req.session.uid && req.session.role === "admin") {
    try {
      const [result] = await db.execute(
        `select * from users where role = 'customer'`,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      res.json({ success: false });
    }
  } else {
    res.send("Unauthorized!");
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
    res.json({ success: false });
  }
});

app.get("/api/search-user/:uname", async (req, res) => {
  if (req.session.uid && req.session.role === "admin") {
    try {
      const uname = req.params.uname;
      const result = await db.execute(
        "select * from users where role = 'customer' and fullname like ? LIMIT 1",
        [`%${uname}%`],
      );
      res.json({ success: true, data: result[0] });
    } catch (error) {
      res.json({ success: false });
    }
  } else {
    res.send("Unauthorized!");
  }
});

app.get("/api/get-user-stat", async (req, res) => {
  if (req.session.uid && req.session.role === "admin") {
    try {
      const [customerResult] = await db.execute(
        `select * from users where role = 'customer'`,
      );
      const totalCustomers = customerResult.length;

      const [suspendedResult] = await db.execute(
        `select * from users where role = 'customer' and isSuspended = '1'`,
      );
      const totalSuspended = suspendedResult.length;

      const [activeResult] = await db.execute(
        `select * from users where role = 'customer' and isSuspended = '0'`,
      );
      const totalActive = activeResult.length;

      const stat = { totalCustomers, totalSuspended, totalActive };
      res.json({ success: true, stat: stat });
    } catch (error) {
      res.json({ success: false });
    }
  } else {
    res.send("Unauthorized!");
  }
});

app.delete("/api/delete-user/:id", async (req, res) => {
  if (req.session.uid && req.session.role === "admin") {
    try {
      const id = req.params.id;
      await db.execute(`delete from users where id = ?`, [id]);
      res.json({ success: true });
    } catch (error) {
      res.json({ success: false });
    }
  } else {
    res.send("Unauthorized!");
  }
});

app.put("/api/suspend-user/:id", async (req, res) => {
  if (req.session.uid && req.session.role === "admin") {
    try {
      const id = req.params.id;

      await db.execute(`update users set isSuspended = '1' where id = ?`, [id]);
      res.json({ success: true });
    } catch (error) {
      res.json({ success: false });
    }
  } else {
    res.send("Unauthorized!");
  }
});

app.put("/api/unsuspend-user/:id", async (req, res) => {
  if (req.session.uid && req.session.role === "admin") {
    try {
      const id = req.params.id;

      await db.execute(`update users set isSuspended = '0' where id = ?`, [id]);
      res.json({ success: true });
    } catch (error) {
      res.json({ success: false });
    }
  } else {
    res.send("Unauthorized!");
  }
});

//////////////////////////////////////////////////////////////////////////////

// Cart related operations
app.post("/api/add-to-cart/:id", (req, res) => {
  const itemId = req.params.id;
  if (!req.session.cart) {
    req.session.cart = [];
  }
  const exists = req.session.cart.find((cart) => cart.itemId == itemId);
  if (!exists) {
    req.session.cart.push({ itemId: itemId, quantity: 1 });
    req.session.save((err) => {
      if (!err) {
        res.json({ success: true });
      }
    });
  } else {
    res.json({ success: true });
  }
});

app.get("/api/get-cart-items", async (req, res) => {
  if (req.session.cart && req.session.cart.length != 0) {
    try {
      const items = [];
      const itemsId = req.session.cart.map((cart) => cart.itemId);
      const [result] = await db.execute(
        `select * from items where id in (${[...itemsId]})`,
      );

      result.forEach((item, index) => {
        item.quantity = req.session.cart[index].quantity;
        items.push(item);
      });

      res.json({ success: true, items: items });
    } catch (error) {
      res.json({ success: false });
    }
  } else {
    res.json({ success: true, items: [] });
  }
});

app.put("/api/adjust-cart-quantity/:id/:quantity", (req, res) => {
  if (req.session.cart) {
    const { id, quantity } = req.params;

    req.session.cart = req.session.cart.map((item) => {
      return item.itemId == id ? { ...item, quantity: quantity } : item;
    });

    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

app.delete("/api/delete-cart-element/:id", (req, res) => {
  if (req.session.cart) {
    const id = req.params.id;
    let carts = req.session.cart;
    carts = carts.filter((item) => item.itemId != id);
    req.session.cart = carts;
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

app.get("/api/get-cart-subtotal", async (req, res) => {
  if (req.session.cart) {
    if (req.session.cart.length === 0) return res.json({ success: false });

    try {
      const itemsId = req.session.cart.map((item) => item.itemId);
      const [result] = await db.execute(
        `select price from items where id in (${[...itemsId]})`,
      );
      const total = req.session.cart.reduce((accu, item, index) => {
        return accu + +item.quantity * result[index].price;
      }, 0);

      res.json({ success: true, total: total });
    } catch (error) {
      res.json({ success: false });
    }
  } else {
    res.json({ success: false });
  }
});

app.post("/api/checkout/:total", async (req, res) => {
  if (req.session.uid) {
    try {
      const total = +req.params.total;
      await db.execute(`insert into orders (total_price) values(?)`, [total]);
      res.json({ success: true });
    } catch (error) {
      res.json({ success: false });
    }
  } else {
    res.json({ success: false });
  }
});
//////////////////////////////////////////////////////////////////////////////////////////

//Item related operations
app.post("/api/upload-product", upload.single("image"), async (req, res) => {
  try {
    const imagePath = "/images/" + req.file.filename;
    const { title, category, description, price, stock } = req.body;

    await db.execute("insert into items values (?, ?, ?, ?, ?, ?, ?)", [
      null,
      title,
      category,
      description,
      price,
      stock,
      imagePath,
    ]);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false });
  }
});

app.get("/api/list-all-items", async (req, res) => {
  try {
    const [result] = await db.execute("select * from items");
    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false });
  }
});

app.get("/api/list-by-category/:cat", async (req, res) => {
  try {
    const cat = req.params.cat;
    const [result] = await db.execute(
      "select * from items where category = ?",
      [cat],
    );

    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false });
  }
});

app.get("/api/search-item/:value", async (req, res) => {
  try {
    const value = req.params.value;
    const [result] = await db.execute(
      "select * from items where title like ?",
      [`%${value}%`],
    );

    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false });
  }
});

app.get("/api/get-product-stat", async (req, res) => {
  if (req.session.role) {
    try {
      const [productResult] = await db.execute(`select * from items`);
      const totalProduct = productResult.length;
      const [salesResult] = await db.execute(`select * from orders`);
      const totalSales = salesResult.reduce((accu, order) => {
        return accu + +order.total_price;
      }, 0);
      const stat = { totalProduct, totalSales };
      res.json({ success: true, stat: stat });
    } catch (error) {
      res.json({ success: false });
    }
  } else {
    res.json({ success: false });
  }
});

app.get("/api/product/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const [result] = await db.execute("select * from items where id = ?", [id]);
    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false });
  }
});

app.post("/api/edit-item/:id", upload.single("image"), async (req, res) => {
  try {
    const id = req.params.id;
    const imagePath = "/images/" + req.file.filename;
    const { title, category, description, price, stock } = req.body;

    await db.execute(
      `update items set title = ?, category = ?, description = ?, price = ?, stock = ?, img = ? where id = ${id}`,
      [title, category, description, price, stock, imagePath],
    );
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false });
  }
});

app.post("/api/delete-item/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await db.execute("delete from items where id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false });
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Server started at port ${process.env.PORT}`),
);
