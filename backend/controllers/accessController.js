const AccessRequest = require('../models/AccessRequest');
const User = require('../models/User');

const requestAccess = async (req, res, next) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Only doctors can request access' });
    }
    const { patientId } = req.body;
    if (!patientId) return res.status(400).json({ success: false, message: 'Patient ID is required' });

    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') return res.status(404).json({ success: false, message: 'Patient not found' });

    const existingRequest = await AccessRequest.findOne({ doctorId: req.user.id, patientId });
    if (existingRequest) return res.status(400).json({ success: false, message: 'Access request already exists', status: existingRequest.status });

    const accessRequest = await AccessRequest.create({ doctorId: req.user.id, patientId });
    res.status(201).json({ success: true, accessRequest });
  } catch (error) { next(error); }
};

const getPendingRequests = async (req, res, next) => {
  try {
    const pendingRequests = await AccessRequest.find({ patientId: req.user.id, status: 'pending' }).populate('doctorId', 'name hospital specialization isVerified');
    res.json({ success: true, pendingRequests });
  } catch (error) { next(error); }
};

const approveRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const accessRequest = await AccessRequest.findById(requestId);
    if (!accessRequest) return res.status(404).json({ success: false, message: 'Request not found' });
    if (accessRequest.patientId.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    accessRequest.status = 'approved';
    await accessRequest.save();
    res.json({ success: true, message: 'Access approved successfully', accessRequest });
  } catch (error) { next(error); }
};

module.exports = { requestAccess, getPendingRequests, approveRequest };
