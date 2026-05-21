const User = require('../models/User');
const AccessRequest = require('../models/AccessRequest');
const Nominee = require('../models/Nominee');

const getPatientEmergencyData = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const patientId = req.params.id;

    if (req.user.role !== 'doctor') return res.status(403).json({ success: false, message: 'Only doctors can access patient emergency data' });

    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') return res.status(404).json({ success: false, message: 'Patient not found' });

    const access = await AccessRequest.findOne({ doctorId, patientId, status: 'approved' });
    const isApproved = !!access;

    // We get the doctor from the DB to check if they are verified
    const doctor = await User.findById(doctorId);
    const isVerifiedDoctor = doctor && doctor.isVerified;

    if (!isApproved && !isVerifiedDoctor) {
        return res.status(403).json({ success: false, message: 'Access denied. You must be an approved doctor or in emergency mode (verified).' });
    }

    const nominees = await Nominee.find({ userId: patientId });

    const emergencyData = {
        name: patient.name,
        bloodGroup: patient.bloodGroup,
        chronicDisease: patient.chronicDisease,
        allergies: patient.allergies,
        currentMedication: patient.currentMedication,
        nominees: nominees.map(n => ({ name: n.name, phone: n.phone, relationship: n.relationship }))
    };

    res.json({ success: true, emergencyData });
  } catch (error) { next(error); }
};

module.exports = { getPatientEmergencyData };
