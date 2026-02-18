
require('dotenv').config(); // Load env vars
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path'); // Import path
const nodemailer = require('nodemailer'); // Import Nodemailer
const net = require('net'); // For network diagnostics
const dns = require('dns'); // For DNS settings
const { Graduate, Order, Ticket } = require('./database');

// --- CRITICAL FIXES ---
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

// --- EMAIL CONFIG (Simplified) ---
let transporter = null;
function createTransporter() {
    return nodemailer.createTransport({
        service: 'gmail', 
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS, 
        },
        tls: { rejectUnauthorized: false }
    });
}

// --- HELPERS ---
function encrypt3DES(str, key) {
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

app.get('/api/graduate/:id/guests', async (req, res) => {
  try {
    const tickets = await Ticket.find({ inviter_id: req.params.id, type: { $regex: /^GUEST$/i } });
    res.json(tickets.map(t => t.nombre_titular));
  } catch (err) {
    res.status(500).json([]);
  }
});

app.post('/api/guest/check-code', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.json({ valid: false });
    const grad = await Graduate.findOne({ codigo_invitacion: code });
    if (!grad) return res.json({ valid: false });
    
    // Count existing guests for this inviter (Case insensitive)
    const count = await Ticket.countDocuments({ 
        inviter_id: grad._id.toString(), 
        type: { $regex: /^GUEST$/i } 
    });
    
    if (count >= 3) return res.json({ valid: false, error: 'Limit Reached' });
    res.json({ valid: true, graduateId: grad._id, remaining: 3 - count });
  } catch (err) {
    res.status(500).json({ valid: false });
  }
});

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
    res.status(500).json({ error: 'Payment Init Error' });
  }
});

app.post('/api/payment/webhook', async (req, res) => {
  try {
    const { Ds_MerchantParameters } = req.body;
    const paramsStr = Buffer.from(Ds_MerchantParameters, 'base64').toString('utf8');
    const params = JSON.parse(paramsStr);
    const orderId = params.DS_MERCHANT_ORDER;
    const cart = JSON.parse(decodeURIComponent(params.DS_MERCHANT_MERCHANTDATA));
    
    console.log(`💰 [WEBHOOK] Order: ${orderId} | Type: ${cart.type} | Amount: ${cart.total}`);

    const ticketUUID = crypto.randomUUID();

    if (cart.type === 'GRADUATE') {
      let inviteCode = 'INV-' + orderId.slice(-6); 
      await Graduate.findByIdAndUpdate(cart.graduateId, { 
        pagado: true, 
        codigo_invitacion: inviteCode 
      });
    }

    // Force Type to Uppercase to ensure consistency
    const finalType = (cart.type || 'GUEST').toUpperCase();

    const newTicket = await Ticket.create({
      uuid: ticketUUID,
      order_id: orderId,
      type: finalType, 
      inviter_id: cart.graduateId,
      nombre_titular: cart.guestName,
      tiene_cena: (cart.basePrice >= 85),
      tiene_barra: true,
      tiene_bus: cart.bus 
    });

    console.log("✅ Ticket Created in DB:", newTicket);

    await Order.findOneAndUpdate({ order_id: orderId }, { status: 'PAID' });
    res.status(200).send('OK');
  } catch(e) {
     console.error("❌ Webhook Error:", e);
     res.status(500).send('Error');
  }
});

// 6. Scan Ticket (UPDATED LOGIC)
app.post('/api/admin/scan', async (req, res) => {
  try {
    let { uuid, mode } = req.body; // mode: CENA, BARRA, BUS_IDA, BUS_VUELTA
    uuid = uuid ? uuid.trim() : "";
    
    console.log(`🔍 [SCANNER] UUID: "${uuid}" | Mode: ${mode}`);

    // Try finding exact, then case insensitive
    let ticket = await Ticket.findOne({ uuid: uuid });
    if(!ticket) {
         ticket = await Ticket.findOne({ uuid: { $regex: new RegExp(`^${uuid}`, 'i') } });
    }

    if (!ticket) {
        console.log("❌ Ticket NO encontrado en DB");
        return res.json({ success: false, message: 'TICKET NO EXISTE' });
    }

    console.log(`📋 [TICKET] Titular: ${ticket.nombre_titular} | Type: ${ticket.type} | Bus: ${ticket.tiene_bus} | Cena: ${ticket.tiene_cena}`);

    // --- CHECK ENTITLEMENTS ---

    // 1. Check CENA
    if (mode === 'CENA' && !ticket.tiene_cena) {
        return res.json({ success: false, message: 'NO INCLUYE CENA' });
    }

    // 2. Check BUS 
    if ((mode === 'BUS_IDA' || mode === 'BUS_VUELTA') && !ticket.tiene_bus) {
        return res.json({ success: false, message: 'NO INCLUYE BUS' });
    }
    
    // 3. Check BARRA (Should be included for everyone, but just in case)
    if (mode === 'BARRA' && ticket.tiene_barra === false) {
        // Fallback: if data is old/missing, assume true unless explicitly false?
        // But schema default is true.
        return res.json({ success: false, message: 'NO INCLUYE BARRA' });
    }

    // --- CHECK IF ALREADY USED ---
    
    let fieldToUpdate = '';
    
    if (mode === 'CENA') fieldToUpdate = 'used_cena';
    else if (mode === 'BARRA') fieldToUpdate = 'used_barra';
    else if (mode === 'BUS_IDA') fieldToUpdate = 'used_bus_ida';
    else if (mode === 'BUS_VUELTA') fieldToUpdate = 'used_bus_vuelta';

    if (!fieldToUpdate) {
        return res.json({ success: false, message: 'MODO DESCONOCIDO' });
    }

    if (ticket[fieldToUpdate]) {
        let msg = 'YA USADO';
        if (mode === 'BUS_IDA') msg = 'BUS IDA: YA USADO';
        if (mode === 'BUS_VUELTA') msg = 'BUS VUELTA: YA USADO';
        if (mode === 'CENA') msg = 'CENA: YA USADA';
        if (mode === 'BARRA') msg = 'COPA: YA USADA';
        
        return res.json({ success: false, message: msg, ticket });
    }

    // --- MARK AS USED ---
    ticket[fieldToUpdate] = true;
    await ticket.save();

    console.log(`✅ Acceso Permitido. Marcado ${fieldToUpdate} = true`);
    res.json({ success: true, message: 'ACCESO PERMITIDO', ticket });
  } catch (err) {
    console.error("Scanner Error:", err);
    res.status(500).json({ success: false, message: 'ERROR SERVIDOR' });
  }
});

// 7. Staff Login
app.post('/api/staff/login', (req, res) => {
  const { password } = req.body;
  if (password === PASSWORDS.ADMIN) return res.json({ role: 'ADMIN' });
  if (password === PASSWORDS.DELEGATE) return res.json({ role: 'DELEGATE' });
  res.status(401).send('Unauthorized');
});

// 8. Stats (Debugging added)
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalRecaudadoResult = await Order.aggregate([
      { $match: { status: 'PAID' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const revenue = totalRecaudadoResult.length > 0 ? totalRecaudadoResult[0].total : 0;
    
    // Use regex to be Case Insensitive
    const entradasGraduados = await Ticket.countDocuments({ type: { $regex: /^GRADUATE$/i } });
    const entradasInvitados = await Ticket.countDocuments({ type: { $regex: /^GUEST$/i } });
    
    const totalBus = await Ticket.countDocuments({ tiene_bus: true });
    const graduadosRegistrados = await Graduate.countDocuments({});

    res.json({
      total_recaudado: revenue,
      entradas_graduados: entradasGraduados,
      entradas_invitados: entradasInvitados,
      total_bus: totalBus,
      graduados_registrados: graduadosRegistrados
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 9. Admin Create Grad
app.post('/api/admin/graduates', async (req, res) => {
  try {
    const { dni, nombre, email, telefono } = req.body;
    const password = Math.random().toString(36).slice(-8).toUpperCase();
    const newGrad = await Graduate.create({
      dni: dni.toUpperCase(),
      nombre,
      email,
      telefono,
      password
    });
    res.json({ id: newGrad._id, password });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/graduates', async (req, res) => {
  try {
    const grads = await Graduate.find().sort({ nombre: 1 });
    res.json(grads);
  } catch (err) { res.status(500).json([]); }
});

// NEW: Delete Graduate
app.delete('/api/admin/graduates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const grad = await Graduate.findById(id);
        if (!grad) return res.status(404).json({ error: 'Not found' });
        
        // Optional: Block if Paid
        // if (grad.pagado) return res.status(400).json({ error: 'Cannot delete paid graduate' });

        await Graduate.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// NEW: Get All Tickets
app.get('/api/admin/tickets', async (req, res) => {
    try {
        // Return latest tickets first
        const tickets = await Ticket.find().sort({ _id: -1 }).limit(300); 
        res.json(tickets);
    } catch (err) { res.status(500).json([]); }
});

// --- DEBUG ---
app.post('/api/debug/bypass-payment', async (req, res) => {
  try {
    const cart = req.body;
    const orderId = 'TEST-' + Date.now().toString().slice(-8);
    await Order.create({ order_id: orderId, amount: cart.total, status: 'PAID' });
    
    console.log("🛠️ [BYPASS] Creating ticket Type:", cart.type);

    if (cart.type === 'GRADUATE') {
      let inviteCode = 'INV-' + orderId.slice(-6); 
      await Graduate.findByIdAndUpdate(cart.graduateId, { pagado: true, codigo_invitacion: inviteCode });
    }

    const finalType = (cart.type || 'GUEST').toUpperCase();
    const ticketUUID = crypto.randomUUID();
    const newTicket = await Ticket.create({
      uuid: ticketUUID,
      order_id: orderId,
      type: finalType,
      inviter_id: cart.graduateId,
      nombre_titular: cart.guestName,
      tiene_cena: (cart.basePrice >= 85),
      tiene_barra: true,
      tiene_bus: cart.bus
    });
    res.json(newTicket);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SERVE FRONTEND ---
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
