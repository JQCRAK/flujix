const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título es requerido'],
      trim: true,
      maxlength: [100, 'El título no puede exceder 100 caracteres'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pendiente', 'en_progreso', 'completado'],
        message: 'Status inválido: {VALUE}',
      },
      default: 'pendiente',
    },
    priority: {
      type: String,
      enum: {
        values: ['baja', 'media', 'alta'],
        message: 'Prioridad inválida: {VALUE}',
      },
      default: 'media',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'assignedTo es requerido'],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true, // createdAt y updatedAt automáticos
    versionKey: false,
  }
);

module.exports = mongoose.model('Task', taskSchema);
