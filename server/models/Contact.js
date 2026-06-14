const mongoose = require('mongoose');
const { RELATIONSHIP_TYPES } = require('../utils/constants');

const contactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\+91[6-9]\d{9}$/, 'Phone must be in +91XXXXXXXXXX format'],
    },
    relationship: {
      type: String,
      enum: {
        values: RELATIONSHIP_TYPES,
        message: `Relationship must be one of: ${RELATIONSHIP_TYPES.join(', ')}`,
      },
      default: 'Family',
    },
    isSosContact: {
      type: Boolean,
      default: true,
    },
    whatsappEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index: user's contacts, SOS-enabled contacts
contactSchema.index({ userId: 1, isSosContact: 1 });

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
