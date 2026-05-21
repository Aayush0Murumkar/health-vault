const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

dotenv.config();
connectDB();
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/records', require('./routes/recordRoutes'));
app.use('/api/nominees', require('./routes/nomineeRoutes'));
app.use('/api/qr', require('./routes/qrRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/access', require('./routes/accessRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
