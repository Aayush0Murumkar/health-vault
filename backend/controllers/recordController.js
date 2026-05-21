const MedicalRecord = require('../models/MedicalRecord');
const { cloudinary } = require('../config/cloudinary');
const { validationResult } = require('express-validator');

const getRecords = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    let query = { patientId: req.user.id };
    if (category) query.category = category;
    if (search) query.originalName = { $regex: search, $options: 'i' };
    const records = await MedicalRecord.find(query).sort({ uploadedAt: -1 });
    res.json({ success: true, count: records.length, records });
  } catch (error) { next(error); }
};

const uploadRecord = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    if (!req.file) return res.status(400).json({ success: false, message: 'Upload a file' });
    const fileType = req.file.mimetype.includes('pdf') ? 'PDF' : 'Image';
    const record = await MedicalRecord.create({
      patientId: req.user.id, filename: req.file.filename, originalName: req.file.originalname,
      fileUrl: req.file.path, fileType, category: req.body.category
    });
    res.status(201).json({ success: true, record });
  } catch (error) { next(error); }
};

const deleteRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    if (record.patientId.toString() !== req.user.id) return res.status(401).json({ success: false, message: 'Not authorized' });
    if (record.filename) {
        try { await cloudinary.uploader.destroy(record.filename); } catch(cloudErr) { }
    }
    await MedicalRecord.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Record removed' });
  } catch (error) { next(error); }
};

const downloadRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    if (record.patientId.toString() !== req.user.id) return res.status(401).json({ success: false, message: 'Not authorized' });
    res.json({ success: true, fileUrl: record.fileUrl });
  } catch (error) { next(error); }
};

module.exports = { getRecords, uploadRecord, deleteRecord, downloadRecord };
