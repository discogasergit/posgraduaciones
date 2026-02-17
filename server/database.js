
// server/database.js
const mongoose = require('mongoose');

// Connect to MongoDB
// Ensure process.env.MONGODB_URI is set in Render/Vultr
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/graduation_event';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas/Local'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- SCHEMAS ---

const graduateSchema = new mongoose.Schema({
  dni: { type: String, required: true, unique: true, uppercase: true },
  nombre: { type: String, required: true },
  email: { type: String },
  telefono: { type: String },
  password: { type: String },
  pagado: { type: Boolean, default: false },
  codigo_invitacion: { type: String, unique: true, sparse: true } // sparse allow nulls to not be unique
});

// Virtual for 'id' to match frontend expectations
graduateSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

const orderSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'PENDING' },
  created_at: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
  uuid: { type: String, required: true, unique: true },
  order_id: { type: String },
  type: { type: String, enum: ['GRADUATE', 'GUEST'] },
  inviter_id: { type: String }, // MongoDB ObjectId as string
  nombre_titular: { type: String },
  tiene_cena: { type: Boolean, default: false },
  tiene_barra: { type: Boolean, default: true },
  tiene_bus: { type: Boolean, default: false },
  used_cena: { type: Boolean, default: false },
  used_barra: { type: Boolean, default: false },
  used_bus: { type: Boolean, default: false }
});

// --- MODELS ---
const Graduate = mongoose.model('Graduate', graduateSchema);
const Order = mongoose.model('Order', orderSchema);
const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = {
  Graduate,
  Order,
  Ticket
};
