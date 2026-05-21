const Nominee = require('../models/Nominee');

const getNominees = async (req, res, next) => {
  try {
    const nominees = await Nominee.find({ userId: req.user.id });
    res.json({ success: true, count: nominees.length, nominees });
  } catch (error) {
    next(error);
  }
};

const addNominee = async (req, res, next) => {
  try {
    const { name, relationship, phone, email } = req.body;

    if (!name || !relationship || !phone) {
      return res.status(400).json({ success: false, message: 'Name, relationship, and phone are required' });
    }

    const nominee = await Nominee.create({
      userId: req.user.id,
      name,
      relationship,
      phone,
      email
    });

    res.status(201).json({ success: true, nominee });
  } catch (error) {
    next(error);
  }
};

const removeNominee = async (req, res, next) => {
  try {
    const nominee = await Nominee.findById(req.params.id);

    if (!nominee) {
      return res.status(404).json({ success: false, message: 'Nominee not found' });
    }

    if (nominee.userId.toString() !== req.user.id) {
       return res.status(401).json({ success: false, message: 'Not authorized to remove this nominee' });
    }

    await Nominee.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Nominee removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNominees,
  addNominee,
  removeNominee
};
