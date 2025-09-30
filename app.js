const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// --- Connexion MySQL ---
let connection;
async function initDB() {
  connection = await mysql.createConnection({
    host: "mysql",
    user: "user",
    password: "userpassword",
    database: "reservation"
  });
  await connection.execute(`CREATE TABLE IF NOT EXISTS rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    capacity INT
  )`);
  await connection.execute(`CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255)
  )`);
  await connection.execute(`CREATE TABLE IF NOT EXISTS reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    roomId INT,
    userId INT,
    date DATE
  )`);
}
initDB().catch(console.error);

// --- API ---

// Lister les salles
app.get("/rooms", async (req, res) => {
  const [rows] = await connection.execute("SELECT * FROM rooms");
  res.json(rows);
});

// Ajouter une salle
app.post("/rooms", async (req, res) => {
  const { name, capacity } = req.body;
  if (!name || !capacity) return res.status(400).json({ error: "name et capacity requis" });
  const [result] = await connection.execute(
    "INSERT INTO rooms (name, capacity) VALUES (?, ?)",
    [name, Number(capacity)]
  );
  res.status(201).json({ id: result.insertId, name, capacity: Number(capacity) });
});

// Lister les utilisateurs
app.get("/users", async (req, res) => {
  const [rows] = await connection.execute("SELECT * FROM users");
  res.json(rows);
});

// Créer une réservation
app.post("/reservations", async (req, res) => {
  const { roomId, userId, date } = req.body;
  if (!roomId || !userId || !date) return res.status(400).json({ error: "roomId, userId, date requis" });

  const [conflict] = await connection.execute(
    "SELECT * FROM reservations WHERE roomId = ? AND date = ?",
    [roomId, date]
  );
  if (conflict.length > 0) return res.status(400).json({ error: "Salle déjà réservée à cette date" });

  const [result] = await connection.execute(
    "INSERT INTO reservations (roomId, userId, date) VALUES (?, ?, ?)",
    [Number(roomId), Number(userId), date]
  );
  res.status(201).json({ id: result.insertId, roomId: Number(roomId), userId: Number(userId), date });
});

// Lister toutes les réservations
app.get("/reservations", async (req, res) => {
  const [rows] = await connection.execute("SELECT * FROM reservations");
  res.json(rows);
});

// Supprimer une réservation
app.delete("/reservations/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [result] = await connection.execute("DELETE FROM reservations WHERE id = ?", [id]);
  res.json({ message: result.affectedRows > 0 ? "Réservation supprimée" : "Aucune réservation trouvée" });
});

// Démarrage
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});


