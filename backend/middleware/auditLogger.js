const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

const auditLogger = (actionName) => async (req, res, next) => {
  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      let details = {};
      let userId = req.user ? req.user.id : null;

      if (actionName === 'LOGIN' || actionName === 'REGISTER') {
        details = { phone: req.body.phone };
        if (!userId) {
          try {
            const user = await User.findOne({ phone: req.body.phone });
            if (user) userId = user._id;
          } catch(e) {}
        }
      } else if (actionName === 'UPLOAD_RECORD') {
        details = { filename: req.file ? req.file.originalname : 'unknown' };
      } else if (actionName === 'DELETE_RECORD') {
        details = { recordId: req.params.id };
      } else if (actionName === 'QR_SCANNED') {
        details = { scannedBy: req.body.scannedBy, location: req.body.location };
      } else if (actionName === 'ADD_NOMINEE') {
        details = { name: req.body.name };
      } else if (actionName === 'REMOVE_NOMINEE') {
        details = { nomineeId: req.params.id };
      }

      try {
        await AuditLog.create({ userId, action: actionName, details, ipAddress: req.ip });
      } catch (err) { }
    }
  });
  next();
};
module.exports = auditLogger;
