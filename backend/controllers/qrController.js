const crypto = require('crypto');
const QRCode = require('qrcode');
const User = require('../models/User');
const Nominee = require('../models/Nominee');
const EmergencyLog = require('../models/EmergencyLog');

const algorithm = 'aes-256-cbc';
const ivLength = 16;

const encrypt = (text, keyString) => {
  const iv = crypto.randomBytes(ivLength);
  const key = Buffer.from(keyString.padEnd(32, '0').substring(0, 32), 'utf-8');
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

const decrypt = (encryptedText, keyString) => {
  const [ivString, encryptedData] = encryptedText.split(':');
  const iv = Buffer.from(ivString, 'hex');
  const key = Buffer.from(keyString.padEnd(32, '0').substring(0, 32), 'utf-8');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

const generateQR = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const nominees = await Nominee.find({ userId: req.user.id });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const emergencyData = {
      patientId: user._id,
      name: user.name,
      bloodGroup: user.bloodGroup,
      allergies: user.allergies,
      chronicDisease: user.chronicDisease,
      currentMedication: user.currentMedication,
      nominees: nominees.map(n => ({ name: n.name, phone: n.phone, relationship: n.relationship }))
    };

    const key = process.env.ENCRYPTION_KEY || 'default_encryption_key_12345678';
    const encryptedData = encrypt(JSON.stringify(emergencyData), key);

    const qrImageUrl = await QRCode.toDataURL(encryptedData);

    res.json({
      success: true,
      qrImageUrl,
      encryptedData
    });
  } catch (error) {
    next(error);
  }
};

const scanQR = async (req, res, next) => {
  try {
    const { encryptedData, scannedBy, location } = req.body;

    if (!encryptedData) {
      return res.status(400).json({ success: false, message: 'Encrypted data is required' });
    }

    const key = process.env.ENCRYPTION_KEY || 'default_encryption_key_12345678';

    let decryptedData;
    try {
      decryptedData = JSON.parse(decrypt(encryptedData, key));
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid or corrupted encrypted data' });
    }

    if (decryptedData.patientId) {
      await EmergencyLog.create({
        patientId: decryptedData.patientId,
        scannedBy: scannedBy || 'Anonymous Responder',
        location: location || 'Unknown',
        accessedData: decryptedData
      });
    }

    res.json({ success: true, emergencyInfo: decryptedData });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateQR,
  scanQR
};
