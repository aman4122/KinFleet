const cron = require('node-cron');
const Vehicle = require('../models/Vehicle');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const { sendComplianceAlert } = require('./notificationService');

/**
 * Check vehicles with upcoming service due dates (within 7 days)
 */
const checkServiceDue = async () => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const vehicles = await Vehicle.find({
      isActive: true,
      nextServiceDate: { $lte: sevenDaysFromNow },
    }).populate('userId');

    console.log(`🔧 Service check: Found ${vehicles.length} vehicle(s) with service due within 7 days`);

    for (const vehicle of vehicles) {
      if (!vehicle.userId) continue;

      // Create or update reminder
      const existingReminder = await Reminder.findOne({
        vehicleId: vehicle._id,
        type: 'Service',
        status: { $in: ['Pending', 'Notified'] },
      });

      if (!existingReminder) {
        await Reminder.create({
          userId: vehicle.userId._id,
          vehicleId: vehicle._id,
          type: 'Service',
          title: `Service due for ${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})`,
          description: `Next service date: ${vehicle.nextServiceDate.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}. Next service mileage: ${vehicle.nextServiceMileage} km.`,
          dueDate: vehicle.nextServiceDate,
          status: 'Notified',
          notifiedAt: now,
        });
      } else if (existingReminder.status === 'Pending') {
        existingReminder.status = 'Notified';
        existingReminder.notifiedAt = now;
        await existingReminder.save();
      }

      // Send WhatsApp notification
      await sendComplianceAlert(vehicle.userId, vehicle, 'Service', vehicle.nextServiceDate);
    }
  } catch (error) {
    console.error('❌ Service check error:', error.message);
  }
};

/**
 * Check vehicles with PUC expiring within 7 days
 */
const checkPUCExpiry = async () => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const vehicles = await Vehicle.find({
      isActive: true,
      pucExpiry: { $lte: sevenDaysFromNow },
    }).populate('userId');

    console.log(`📋 PUC check: Found ${vehicles.length} vehicle(s) with PUC expiring within 7 days`);

    for (const vehicle of vehicles) {
      if (!vehicle.userId) continue;

      const existingReminder = await Reminder.findOne({
        vehicleId: vehicle._id,
        type: 'PUC',
        status: { $in: ['Pending', 'Notified'] },
      });

      if (!existingReminder) {
        await Reminder.create({
          userId: vehicle.userId._id,
          vehicleId: vehicle._id,
          type: 'PUC',
          title: `PUC expiring for ${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})`,
          description: `PUC expiry date: ${vehicle.pucExpiry.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}`,
          dueDate: vehicle.pucExpiry,
          status: 'Notified',
          notifiedAt: now,
        });
      } else if (existingReminder.status === 'Pending') {
        existingReminder.status = 'Notified';
        existingReminder.notifiedAt = now;
        await existingReminder.save();
      }

      await sendComplianceAlert(vehicle.userId, vehicle, 'PUC', vehicle.pucExpiry);
    }
  } catch (error) {
    console.error('❌ PUC check error:', error.message);
  }
};

/**
 * Check vehicles with insurance expiring within 7 days
 */
const checkInsuranceExpiry = async () => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const vehicles = await Vehicle.find({
      isActive: true,
      insuranceExpiry: { $lte: sevenDaysFromNow },
    }).populate('userId');

    console.log(`🛡️  Insurance check: Found ${vehicles.length} vehicle(s) with insurance expiring within 7 days`);

    for (const vehicle of vehicles) {
      if (!vehicle.userId) continue;

      const existingReminder = await Reminder.findOne({
        vehicleId: vehicle._id,
        type: 'Insurance',
        status: { $in: ['Pending', 'Notified'] },
      });

      if (!existingReminder) {
        await Reminder.create({
          userId: vehicle.userId._id,
          vehicleId: vehicle._id,
          type: 'Insurance',
          title: `Insurance expiring for ${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})`,
          description: `Insurance expiry date: ${vehicle.insuranceExpiry.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}`,
          dueDate: vehicle.insuranceExpiry,
          status: 'Notified',
          notifiedAt: now,
        });
      } else if (existingReminder.status === 'Pending') {
        existingReminder.status = 'Notified';
        existingReminder.notifiedAt = now;
        await existingReminder.save();
      }

      await sendComplianceAlert(vehicle.userId, vehicle, 'Insurance', vehicle.insuranceExpiry);
    }
  } catch (error) {
    console.error('❌ Insurance check error:', error.message);
  }
};

/**
 * Mark overdue reminders
 */
const markOverdueReminders = async () => {
  try {
    const now = new Date();

    const result = await Reminder.updateMany(
      {
        status: { $in: ['Pending', 'Notified'] },
        dueDate: { $lt: now },
      },
      {
        $set: { status: 'Overdue' },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`⏰ Marked ${result.modifiedCount} reminder(s) as overdue`);
    }
  } catch (error) {
    console.error('❌ Mark overdue error:', error.message);
  }
};

/**
 * Initialize the scheduler
 * Runs daily at 6:00 AM IST (which is 00:30 UTC)
 */
const initScheduler = () => {
  // '30 0 * * *' = 00:30 UTC = 06:00 IST
  const scheduledTask = cron.schedule(
    '30 0 * * *',
    async () => {
      console.log('⏰ Running daily compliance check at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

      await markOverdueReminders();
      await checkServiceDue();
      await checkPUCExpiry();
      await checkInsuranceExpiry();

      console.log('✅ Daily compliance check completed');
    },
    {
      timezone: 'Asia/Kolkata',
    }
  );

  console.log('✅ Scheduler initialized — daily compliance check at 6:00 AM IST');

  return scheduledTask;
};

module.exports = {
  initScheduler,
  checkServiceDue,
  checkPUCExpiry,
  checkInsuranceExpiry,
  markOverdueReminders,
};
