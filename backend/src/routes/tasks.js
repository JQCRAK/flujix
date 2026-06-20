const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

const router = express.Router();

// Todas las rutas de tareas requieren autenticación
router.use(auth);

router.post('/', adminOnly, createTask);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', adminOnly, deleteTask);

module.exports = router;
