/**
 * Application-wide constants
 */

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'EV', 'Strong Hybrid'];

const INDIAN_STATES = {
  AN: 'Andaman and Nicobar Islands',
  AP: 'Andhra Pradesh',
  AR: 'Arunachal Pradesh',
  AS: 'Assam',
  BR: 'Bihar',
  CH: 'Chandigarh',
  CG: 'Chhattisgarh',
  DD: 'Dadra and Nagar Haveli and Daman and Diu',
  DL: 'Delhi',
  GA: 'Goa',
  GJ: 'Gujarat',
  HR: 'Haryana',
  HP: 'Himachal Pradesh',
  JK: 'Jammu and Kashmir',
  JH: 'Jharkhand',
  KA: 'Karnataka',
  KL: 'Kerala',
  LA: 'Ladakh',
  LD: 'Lakshadweep',
  MP: 'Madhya Pradesh',
  MH: 'Maharashtra',
  MN: 'Manipur',
  ML: 'Meghalaya',
  MZ: 'Mizoram',
  NL: 'Nagaland',
  OD: 'Odisha',
  PY: 'Puducherry',
  PB: 'Punjab',
  RJ: 'Rajasthan',
  SK: 'Sikkim',
  TN: 'Tamil Nadu',
  TS: 'Telangana',
  TR: 'Tripura',
  UK: 'Uttarakhand',
  UP: 'Uttar Pradesh',
  WB: 'West Bengal',
};

const RELATIONSHIP_TYPES = [
  'Family',
  'Fleet Manager',
  'Roadside Assistance',
  'Mechanic',
  'Insurance Agent',
  'Other',
];

const REMINDER_TYPES = ['Service', 'PUC', 'Insurance', 'Custom'];

const REMINDER_STATUS = ['Pending', 'Notified', 'Completed', 'Overdue'];

const PAYMENT_MODES = ['FASTag', 'Cash', 'UPI'];

module.exports = {
  FUEL_TYPES,
  INDIAN_STATES,
  RELATIONSHIP_TYPES,
  REMINDER_TYPES,
  REMINDER_STATUS,
  PAYMENT_MODES,
};
