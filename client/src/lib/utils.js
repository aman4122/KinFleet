import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return clsx(inputs);
}

export function formatINR(amount) {
  if (amount === null || amount === undefined) return '₹0';
  const num = Number(amount);
  if (isNaN(num)) return '₹0';
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

export function formatINRFull(amount) {
  if (amount === null || amount === undefined) return '₹0';
  const num = Number(amount);
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
}

export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

export function formatDateLong(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

export function formatRelativeDate(date) {
  if (!date) return '';
  const now = new Date();
  const target = new Date(date);
  if (isNaN(target.getTime())) return '';
  const diffMs = target - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0) return `in ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

export function getComplianceColor(dueDate) {
  if (!dueDate) return 'text-text-muted';
  const now = new Date();
  const target = new Date(dueDate);
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'text-danger';
  if (diffDays <= 7) return 'text-warning';
  if (diffDays <= 30) return 'text-accent';
  return 'text-success';
}

export function getComplianceBadge(dueDate) {
  if (!dueDate) return { label: 'Unknown', variant: 'secondary' };
  const now = new Date();
  const target = new Date(dueDate);
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Expired', variant: 'destructive' };
  if (diffDays <= 7) return { label: `${diffDays}d left`, variant: 'warning' };
  if (diffDays <= 30) return { label: `${diffDays}d left`, variant: 'outline' };
  return { label: 'Valid', variant: 'success' };
}

export function getComplianceDot(dueDate) {
  if (!dueDate) return 'bg-text-muted';
  const now = new Date();
  const target = new Date(dueDate);
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'bg-danger';
  if (diffDays <= 7) return 'bg-warning';
  if (diffDays <= 30) return 'bg-accent';
  return 'bg-success';
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'Petrol+CNG'];

export const VEHICLE_TYPES = ['Hatchback', 'Sedan', 'SUV', 'MPV', 'Coupe SUV', 'Pickup'];
