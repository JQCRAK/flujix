const User = require('../models/User');
const Task = require('../models/Task');

// GET /api/users — solo admin.
// Lista usuarios con la cantidad de tareas asignadas a cada uno.
async function getUsers(req, res) {
  try {
    const [users, counts] = await Promise.all([
      User.find().sort({ createdAt: 1 }),
      Task.aggregate([
        { $match: { assignedTo: { $ne: null } } },
        { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      ]),
    ]);

    const countByUser = Object.fromEntries(
      counts.map((c) => [c._id.toString(), c.count])
    );

    const result = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      taskCount: countByUser[u._id.toString()] || 0,
    }));

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { getUsers };
