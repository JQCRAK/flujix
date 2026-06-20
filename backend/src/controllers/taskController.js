const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');

// Campos que un admin puede establecer; cualquier campo extra se ignora
const ADMIN_FIELDS = ['title', 'description', 'status', 'priority', 'assignedTo'];

function pickFields(body, allowed) {
  const data = {};
  for (const field of allowed) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  return data;
}

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

const POPULATE = [
  { path: 'assignedTo', select: 'name email' },
  { path: 'assignedBy', select: 'name email' },
];

// POST /api/tasks — solo admin (adminOnly en la ruta)
async function createTask(req, res) {
  try {
    const data = pickFields(req.body, ADMIN_FIELDS);

    if (!data.assignedTo || !isValidId(data.assignedTo)) {
      return res.status(400).json({ error: 'assignedTo (userId válido) es requerido' });
    }
    const assignee = await User.findById(data.assignedTo);
    if (!assignee) {
      return res.status(400).json({ error: 'El usuario asignado no existe' });
    }

    data.assignedBy = req.user.id;
    const task = await Task.create(data);
    await task.populate(POPULATE);
    return res.status(201).json(task);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// GET /api/tasks — todo usuario autenticado ve las tareas del equipo.
// Filtros opcionales: ?status=... y ?mine=true (solo las asignadas a mí).
async function getTasks(req, res) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.mine === 'true') filter.assignedTo = req.user.id;

    const tasks = await Task.find(filter).populate(POPULATE).sort({ createdAt: -1 });
    return res.status(200).json(tasks);
  } catch (err) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// GET /api/tasks/:id
async function getTaskById(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const task = await Task.findById(req.params.id).populate(POPULATE);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    return res.status(200).json(task);
  } catch (err) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// PUT /api/tasks/:id
// - admin: puede editar cualquier campo de cualquier tarea.
// - user: solo puede cambiar "status" y solo de tareas asignadas a él.
async function updateTask(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    let changes;
    if (req.user.role === 'admin') {
      changes = pickFields(req.body, ADMIN_FIELDS);
      if (changes.assignedTo !== undefined) {
        if (!isValidId(changes.assignedTo)) {
          return res.status(400).json({ error: 'assignedTo inválido' });
        }
        const assignee = await User.findById(changes.assignedTo);
        if (!assignee) {
          return res.status(400).json({ error: 'El usuario asignado no existe' });
        }
      }
    } else {
      // Usuario normal: la tarea debe ser suya...
      if (!task.assignedTo || task.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Solo puedes modificar tareas asignadas a ti' });
      }
      // ...y solo puede tocar el campo status
      const forbidden = ADMIN_FIELDS.filter(
        (f) => f !== 'status' && req.body[f] !== undefined
      );
      if (forbidden.length > 0) {
        return res.status(403).json({ error: 'Solo puedes actualizar el status de la tarea' });
      }
      changes = pickFields(req.body, ['status']);
    }

    const updated = await Task.findByIdAndUpdate(req.params.id, changes, {
      new: true,
      runValidators: true,
    }).populate(POPULATE);

    return res.status(200).json(updated);
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// DELETE /api/tasks/:id — solo admin (adminOnly en la ruta)
async function deleteTask(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    return res.status(200).json({ message: 'Tarea eliminada', task });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask };
