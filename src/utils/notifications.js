import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import useStore from '../store/useStore';

export async function requestNotificationPermissions() {
  if (Capacitor.isNativePlatform()) {
    try {
      const { display } = await LocalNotifications.requestPermissions();
      return display === 'granted';
    } catch (e) {
      console.error("LocalNotifications permission error:", e);
      return false;
    }
  }
  return false;
}

export async function scheduleOrderNotifications(orders, settings) {
  if (!Capacitor.isNativePlatform()) return;
  
  const daysBefore = settings?.notifications?.orderDeadlineDays;
  if (!daysBefore) return; // if missing, effectively disabled

  try {
    const notificationsToSchedule = [];

    // Clear existing to avoid duplicates (simplified approach)
    await LocalNotifications.cancel({ notifications: (await LocalNotifications.getPending()).notifications });

    orders.filter(o => o.status === 'active' && o.deadline).forEach(order => {
      const deadlineDate = new Date(order.deadline);
      const notifyDate = new Date(deadlineDate);
      notifyDate.setDate(notifyDate.getDate() - daysBefore);

      // Only schedule if it's in the future
      if (notifyDate > new Date()) {
        notificationsToSchedule.push({
          title: 'Наближається дедлайн замовлення',
          body: `Замовлення "${order.name}" потрібно віддати ${deadlineDate.toLocaleDateString()}`,
          id: Math.floor(Math.random() * 1000000), // Random ID
          schedule: { at: notifyDate },
        });
      }
    });

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
    }
  } catch (e) {
    console.error("LocalNotifications order scheduling error:", e);
  }
}

export async function checkInventoryExpiry(inventory, settings) {
  if (!Capacitor.isNativePlatform()) return;
  
  const daysBefore = settings?.notifications?.expiryAlertDays;
  if (!daysBefore) return;

  try {
    const notificationsToSchedule = [];

    inventory.filter(i => i.expiryDate).forEach(item => {
      const expiryDate = new Date(item.expiryDate);
      const notifyDate = new Date(expiryDate);
      notifyDate.setDate(notifyDate.getDate() - daysBefore);

      // For inventory, let's just schedule it if it's in the future
      if (notifyDate > new Date()) {
         notificationsToSchedule.push({
           title: 'Термін придатності закінчується!',
           body: `Товар "${item.name}" придатний до ${expiryDate.toLocaleDateString()}`,
           id: Math.floor(Math.random() * 1000000),
           schedule: { at: notifyDate },
         });
      }
    });

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
    }
  } catch (e) {
    console.error("LocalNotifications inventory scheduling error:", e);
  }
}
