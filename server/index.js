require('dotenv').config();
const express     = require('express');
const mongoose    = require('mongoose');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const compression = require('compression');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const app = express();

app.set('trust proxy', 1);

// ── Security ──
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true })); // Allow all origins
app.use(compression());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ── Rate Limiting ──
//app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
//app.use('/api/auth/', rateLimit({ windowMs: 15 * 60 * 1000, max: 15 }));

// ── Body Parser ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── API Routes FIRST ──
app.use('/api/auth', require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/committees', require('./routes/committees'));
app.use('/api/admin', require('./routes/admin'));

// ── Static Files ──
app.use(express.static(path.join(__dirname, '../public')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// ── Frontend Routes ──
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// IMPORTANT: don't catch API routes
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Important: do NOT catch API routes
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Error Handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
});

// ── Connect DB & Start ──
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server: http://localhost:${process.env.PORT || 5000}`)
    );
  })
  .catch(err => { console.error('❌ DB Error:', err.message); process.exit(1); });
