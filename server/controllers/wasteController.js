// server/controllers/wasteController.js
const pool = require("../config/db");

exports.recordWaste = async (req, res) => {
  const { route_id, waste_type, weight_kg, collection_date, assign_id } = req.body;
  if (!route_id || !weight_kg) {
    return res.status(400).json({ error: "Missing route_id or weight_kg" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO Waste_Record (route_id, waste_type, weight_kg, collection_date, assign_id) VALUES (?, ?, ?, ?, ?)",
      [route_id, waste_type || null, weight_kg, collection_date || new Date(), assign_id || null]
    );
    res.status(201).json({ message: "Waste recorded successfully", record_id: result.insertId });
  } catch (err) {
    console.error("Record waste error:", err);
    res.status(500).json({ error: "Failed to record waste collection" });
  }
};
