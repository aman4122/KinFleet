const Contact = require('../models/Contact');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/contacts
 * Get user's contacts
 */
const getContacts = async (req, res, next) => {
  try {
    const { isSosContact, relationship } = req.query;

    const filter = { userId: req.user._id };

    if (isSosContact !== undefined) {
      filter.isSosContact = isSosContact === 'true';
    }

    if (relationship) {
      filter.relationship = relationship;
    }

    const contacts = await Contact.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        contacts,
        totalContacts: contacts.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/contacts
 * Add a new contact
 */
const createContact = async (req, res, next) => {
  try {
    const { name, phone, relationship, isSosContact, whatsappEnabled } = req.body;

    // Check for duplicate contact (same user + phone)
    const existingContact = await Contact.findOne({
      userId: req.user._id,
      phone,
    });

    if (existingContact) {
      throw new AppError('A contact with this phone number already exists', 409);
    }

    const contact = await Contact.create({
      userId: req.user._id,
      name,
      phone,
      relationship: relationship || 'Family',
      isSosContact: isSosContact !== undefined ? isSosContact : true,
      whatsappEnabled: whatsappEnabled !== undefined ? whatsappEnabled : true,
    });

    res.status(201).json({
      success: true,
      message: 'Contact added successfully',
      data: { contact },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/contacts/:id
 * Update a contact
 */
const updateContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    if (contact.userId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to update this contact', 403);
    }

    const allowedUpdates = ['name', 'phone', 'relationship', 'isSosContact', 'whatsappEnabled'];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        contact[field] = req.body[field];
      }
    });

    // Check for duplicate phone if phone was changed
    if (req.body.phone && req.body.phone !== contact.phone) {
      const duplicate = await Contact.findOne({
        userId: req.user._id,
        phone: req.body.phone,
        _id: { $ne: contact._id },
      });

      if (duplicate) {
        throw new AppError('A contact with this phone number already exists', 409);
      }
    }

    await contact.save();

    res.status(200).json({
      success: true,
      message: 'Contact updated successfully',
      data: { contact },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/contacts/:id
 * Delete a contact
 */
const deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    if (contact.userId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to delete this contact', 403);
    }

    await Contact.findByIdAndDelete(contact._id);

    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
};
