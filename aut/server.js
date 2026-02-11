const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const { nanoid } = require("nanoid");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

const dbFile = path.join(__dirname, "db.json");
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { users: [], todos: [] });

async function initDb() {
  await db.read();
  db.data ||= { users: [], todos: [] };

  // seed user: testuser / password123
  const exists = db.data.users.find(u => u.username === "testuser");
  if (!exists) {
    const passwordHash = bcrypt.hashSync("password123", 10);
    db.data.users.push({ id: "u1", username: "testuser", passwordHash });
    await db.write();
  }
}
function auth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  await db.read();
  const user = db.data.users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ userId: user.id, username }, JWT_SECRET, { expiresIn: "2h" });
  return res.json({ token });
});

app.get("/api/todos", auth, async (req, res) => {
  await db.read();
  const todos = db.data.todos.filter(t => t.userId === req.user.userId);
  res.json({ todos });
});

app.post("/api/todos", auth, async (req, res) => {
  const { title } = req.body || {};
  if (!title) return res.status(400).json({ error: "title required" });

  await db.read();
  const todo = { id: nanoid(), userId: req.user.userId, title, done: false, createdAt: Date.now() };
  db.data.todos.unshift(todo);
  await db.write();
  res.status(201).json({ todo });
});

app.patch("/api/todos/:id", auth, async (req, res) => {
  await db.read();
  const todo = db.data.todos.find(t => t.id === req.params.id && t.userId === req.user.userId);
  if (!todo) return res.status(404).json({ error: "Not found" });

  const { done, title } = req.body || {};
  if (typeof done === "boolean") todo.done = done;
  if (typeof title === "string") todo.title = title;

  await db.write();
  res.json({ todo });
});

app.delete("/api/todos/:id", auth, async (req, res) => {
  await db.read();
  const before = db.data.todos.length;
  db.data.todos = db.data.todos.filter(t => !(t.id === req.params.id && t.userId === req.user.userId));
  const after = db.data.todos.length;
  await db.write();
  if (before === after) return res.status(404).json({ error: "Not found" });
  res.status(204).send();
});

// serve UI
app.use("/", express.static(path.join(__dirname, "ui")));

// Fallback: serve index.html for non-API routes without using '*' patterns
app.use((req, res, next) => {
  // Let API & health routes behave normally
  if (req.path.startsWith("/api") || req.path.startsWith("/health")) return next();

  // Only handle GET requests for SPA-like behavior
  if (req.method !== "GET") return next();

  return res.sendFile(path.join(__dirname, "ui", "index.html"));
});

initDb().then(() => {
  app.listen(PORT, () => console.log(`AUT running on http://localhost:${PORT}`));
});
