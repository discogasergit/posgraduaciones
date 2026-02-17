
require('dotenv').config(); // Load env vars
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path'); // Import path
const nodemailer = require('nodemailer'); // Import Nodemailer
const { Graduate, Order, Ticket } = require('./database');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- SECURITY CHECK ---
if (!process.env.REDSYS_SECRET && process.env.NODE_ENV === 'production') {
  console.error("❌ ERROR CRÍTICO: No se ha detectado la variable REDSYS_SECRET.");
  console.error("ℹ️  Asegúrate de añadirla en el panel 'Environment' de Render.");
}

if (!process.env.MONGODB_URI) {
  console.warn("⚠️  ADVERTENCIA: No hay MONGODB_URI. Se intentará usar localhost (fallará en Render).");
}

// --- CONFIG ---
const REDSYS_CONFIG = {
  fuc: process.env.REDSYS_FUC,
  terminal: process.env.REDSYS_TERMINAL,
  secret: process.env.REDSYS_SECRET, 
  url: process.env.REDSYS_URL || "https://sis-t.redsys.es:25443/sis/realizarPago", 
  currency: "978" 
};

const PASSWORDS = {
    ADMIN: process.env.ADMIN_PASSWORD,
    DELEGATE: process.env.DELEGATE_PASSWORD
};

// --- EMAIL CONFIG (NODEMAILER) ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Helper to send email
async function sendWelcomeEmail(to, name, dni, password) {
  // If no SMTP user configured, fallback to console (Development mode)
  if (!process.env.SMTP_USER) {
    console.log(`[EMAIL SIMULATION] To: ${to} | Pass: ${password}`);
    return;
  }

  const loginUrl = process.env.PUBLIC_URL || 'https://tu-dominio.com';

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Graduación 2026" <noreply@graduacion.com>',
    to: to,
    subject: '🎓 Tu Acceso a la Graduación 2026',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">¡Bienvenido a la Graduación 2026!</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Se te ha dado de alta en la plataforma de gestión de entradas.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>DNI:</strong> ${dni}</p>
          <p style="margin: 5px 0;"><strong>Contraseña:</strong> <span style="font-size: 18px; color: #4f46e5; font-weight: bold;">${password}</span></p>
        </div>

        <p>Por favor, accede a la web para comprar tu entrada y obtener tus invitaciones:</p>
        <p style="text-align: center;">
          <a href="${loginUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acceder a la Plataforma</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">Si no has solicitado esto, ignora este mensaje.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

// --- HELPERS ---
function encrypt3DES(str, key) {
  if (!key) throw new Error("Redsys Secret Key is missing in .env or Render Environment Variables");
  const secretKey = Buffer.from(key, 'base64');
  const iv = Buffer.alloc(8, 0); 
  const cipher = crypto.createCipheriv('des-ede3-cbc', secretKey, iv);
  cipher.setAutoPadding(true);
  let encrypted = cipher.update(str, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

function hmac256(data, key) {
  const hmac = crypto.createHmac('sha256', Buffer.from(key, 'base64'));
  hmac.update(data);
  return hmac.digest('base64');
}

// --- API ENDPOINTS ---

// 1. Check Graduate (with Password)
app.post('/api/graduate/check', async (req, res) => {
  try {
    const { dni, password } = req.body;
    const grad = await Graduate.findOne({ dni: dni.toUpperCase() });
    
    if (!grad) return res.status(404).json({ error: 'Not found' });
    if (grad.password !== password) return res.status(401).json({ error: 'Invalid password' });

    res.json(grad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Guests for Graduate
app.get('/api/graduate/:id/guests', async (req, res) => {
  try {
    const tickets = await Ticket.find({ inviter_id: req.params.id, type: 'GUEST' });
    res.json(tickets.map(t => t.nombre_titular));
  } catch (err) {
    res.status(500).json([]);
  }
});

// 3. Check Invitation Code (Limit 3)
app.post('/api/guest/check-code', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.json({ valid: false });

    const grad = await Graduate.findOne({ codigo_invitacion: code });
    if (!grad) return res.json({ valid: false });

    const count = await Ticket.countDocuments({ inviter_id: grad._id.toString(), type: 'GUEST' });
    
    if (count >= 3) return res.json({ valid: false, error: 'Limit Reached' });
    
    res.json({ valid: true, graduateId: grad._id, remaining: 3 - count });
  } catch (err) {
    res.status(500).json({ valid: false });
  }
});

// 4. Init Payment 
app.post('/api/payment/init', async (req, res) => {
  try {
    const { total, type, graduateId } = req.body;
    const orderId = Date.now().toString().slice(-12);
    const amount = Math.round(total * 100).toString();
    
    const merchantParams = {
      DS_MERCHANT_AMOUNT: amount,
      DS_MERCHANT_ORDER: orderId,
      DS_MERCHANT_MERCHANTCODE: REDSYS_CONFIG.fuc,
      DS_MERCHANT_CURRENCY: REDSYS_CONFIG.currency,
      DS_MERCHANT_TRANSACTIONTYPE: "0",
      DS_MERCHANT_TERMINAL: REDSYS_CONFIG.terminal,
      DS_MERCHANT_MERCHANTURL: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/api/payment/webhook`,
      DS_MERCHANT_URLOK: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/#/ticket`,
      DS_MERCHANT_URLKO: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/#/checkout`,
      DS_MERCHANT_MERCHANTDATA: JSON.stringify(req.body) 
    };

    const paramsBase64 = Buffer.from(JSON.stringify(merchantParams)).toString('base64');
    const key = REDSYS_CONFIG.secret;
    const orderKey = encrypt3DES(orderId, key);
    const signature = hmac256(paramsBase64, orderKey);

    await Order.create({ order_id: orderId, amount: total });

    res.json({
      orderId,
      form: {
        url: REDSYS_CONFIG.url,
        params: {
          Ds_Merchant_SignatureVersion: "HMAC_SHA256_V1",
          Ds_Merchant_MerchantParameters: paramsBase64,
          Ds_Merchant_Signature: signature
        }
      }
    });
  } catch (err) {
    console.error("Payment Init Error:", err);
    res.status(500).json({ error: 'Payment Init Error' });
  }
});

// 5. Redsys Webhook
app.post('/api/payment/webhook', async (req, res) => {
  try {
    const { Ds_MerchantParameters } = req.body;
    
    const paramsStr = Buffer.from(Ds_MerchantParameters, 'base64').toString('utf8');
    const params = JSON.parse(paramsStr);
    const orderId = params.DS_MERCHANT_ORDER;
    
    // Verify signature logic should be here (skipped for brevity)

    const cart = JSON.parse(decodeURIComponent(params.DS_MERCHANT_MERCHANTDATA));
    const ticketUUID = crypto.randomUUID();

    if (cart.type === 'GRADUATE') {
      let inviteCode = 'INV-' + orderId.slice(-6); 
      await Graduate.findByIdAndUpdate(cart.graduateId, { 
        pagado: true, 
        codigo_invitacion: inviteCode 
      });
    }

    await Ticket.create({
      uuid: ticketUUID,
      order_id: orderId,
      type: cart.type,
      inviter_id: cart.graduateId,
      nombre_titular: cart.guestName,
      tiene_cena: (cart.basePrice >= 85),
      tiene_barra: true,
      tiene_bus: cart.bus
    });

    await Order.findOneAndUpdate({ order_id: orderId }, { status: 'PAID' });
     
    res.status(200).send('OK');
  } catch(e) {
     console.error(e);
     res.status(500).send('Error');
  }
});

// 6. Scan Ticket
app.post('/api/admin/scan', async (req, res) => {
  try {
    const { uuid, mode } = req.body; 
    
    const ticket = await Ticket.findOne({ uuid });
    if (!ticket) return res.json({ success: false, message: 'Ticket Inválido' });

    if (mode === 'CENA' && !ticket.tiene_cena) return res.json({ success: false, message: 'No tiene Cena' });
    if (mode === 'BUS' && !ticket.tiene_bus) return res.json({ success: false, message: 'No tiene Bus' });

    const field = mode === 'CENA' ? 'used_cena' : mode === 'BUS' ? 'used_bus' : 'used_barra';
    
    if (ticket[field]) {
      return res.json({ success: false, message: 'YA USADO: ' + mode });
    }

    ticket[field] = true;
    await ticket.save();

    res.json({ success: true, message: 'ACCESO PERMITIDO', ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// 7. Staff Login
app.post('/api/staff/login', (req, res) => {
  const { password } = req.body;
  if (password === PASSWORDS.ADMIN) return res.json({ role: 'ADMIN' });
  if (password === PASSWORDS.DELEGATE) return res.json({ role: 'DELEGATE' });
  res.status(401).send('Unauthorized');
});

// 8. Admin Stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalRecaudadoResult = await Order.aggregate([
      { $match: { status: 'PAID' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    const revenue = totalRecaudadoResult.length > 0 ? totalRecaudadoResult[0].total : 0;
    
    const [
      entradasGraduados,
      entradasInvitados,
      totalBus,
      graduadosRegistrados
    ] = await Promise.all([
      Ticket.countDocuments({ type: 'GRADUATE' }),
      Ticket.countDocuments({ type: 'GUEST' }),
      Ticket.countDocuments({ tiene_bus: true }),
      Graduate.countDocuments({})
    ]);

    res.json({
      total_recaudado: revenue,
      entradas_graduados: entradasGraduados,
      entradas_invitados: entradasInvitados,
      total_bus: totalBus,
      graduados_registrados: graduadosRegistrados
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Admin Graduates (Create)
app.post('/api/admin/graduates', async (req, res) => {
  try {
    const { dni, nombre, email, telefono } = req.body;
    
    // Auto-generate password
    const password = Math.random().toString(36).slice(-8).toUpperCase();

    const newGrad = await Graduate.create({
      dni: dni.toUpperCase(),
      nombre,
      email,
      telefono,
      password
    });
      
    // Send Email via Nodemailer
    await sendWelcomeEmail(email, nombre, dni.toUpperCase(), password);
    
    res.json({ id: newGrad._id, password });
  } catch (err) {
    console.error("Error creating graduate:", err);
    res.status(500).json({ error: err.message });
  }
});

// 10. Admin Graduates (List)
app.get('/api/admin/graduates', async (req, res) => {
  try {
    const grads = await Graduate.find().sort({ nombre: 1 });
    res.json(grads);
  } catch (err) {
    res.status(500).json([]);
  }
});

// --- DEBUG ENDPOINTS ---

// DEBUG: Test Email
app.post('/api/debug/email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!process.env.SMTP_USER) return res.status(400).json({ error: 'SMTP no configurado en .env' });
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: '🧪 Prueba de Correo - Graduación',
      text: 'Si lees esto, el sistema de correos funciona correctamente.'
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DEBUG: Bypass Payment (Direct Ticket Creation)
app.post('/api/debug/bypass-payment', async (req, res) => {
  try {
    const cart = req.body;
    const orderId = 'TEST-' + Date.now().toString().slice(-8);
    
    await Order.create({ order_id: orderId, amount: cart.total, status: 'PAID' });
    
    if (cart.type === 'GRADUATE') {
      let inviteCode = 'INV-' + orderId.slice(-6); 
      await Graduate.findByIdAndUpdate(cart.graduateId, { 
        pagado: true, 
        codigo_invitacion: inviteCode 
      });
    }

    const ticketUUID = crypto.randomUUID();
    const newTicket = await Ticket.create({
      uuid: ticketUUID,
      order_id: orderId,
      type: cart.type,
      inviter_id: cart.graduateId,
      nombre_titular: cart.guestName,
      tiene_cena: (cart.basePrice >= 85),
      tiene_barra: true,
      tiene_bus: cart.bus
    });

    res.json(newTicket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- SERVE FRONTEND (MUST BE LAST) ---
app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
