/**
 * Smart Things Service
 * IoT device management and control
 */

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  getDoc,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { SmartDevice, DeviceType, DeviceStatus, DeviceControl, DeviceLog } from '../types';

export class SmartThingsService {
  /**
   * Get all devices
   */
  static async getAllDevices(villageId?: string): Promise<SmartDevice[]> {
    try {
      let q = query(collection(db, 'smartDevices'));

      if (villageId) {
        q = query(q, where('villageId', '==', villageId));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SmartDevice));
    } catch (error) {
      console.error('Error getting devices:', error);
      return [];
    }
  }

  /**
   * Get device by ID
   */
  static async getDevice(deviceId: string): Promise<SmartDevice | null> {
    try {
      const deviceDoc = await getDoc(doc(db, 'smartDevices', deviceId));
      if (deviceDoc.exists()) {
        return { id: deviceDoc.id, ...deviceDoc.data() } as SmartDevice;
      }
      return null;
    } catch (error) {
      console.error('Error getting device:', error);
      return null;
    }
  }

  /**
   * Add new device
   */
  static async addDevice(device: Omit<SmartDevice, 'id' | 'installedAt' | 'lastActive'>): Promise<string> {
    try {
      const deviceRef = doc(collection(db, 'smartDevices'));
      await setDoc(deviceRef, {
        ...device,
        installedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      });

      return deviceRef.id;
    } catch (error) {
      console.error('Error adding device:', error);
      throw error;
    }
  }

  /**
   * Update device
   */
  static async updateDevice(deviceId: string, updates: Partial<SmartDevice>): Promise<void> {
    try {
      const deviceRef = doc(db, 'smartDevices', deviceId);
      await updateDoc(deviceRef, {
        ...updates,
        lastActive: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating device:', error);
      throw error;
    }
  }

  /**
   * Delete device
   */
  static async deleteDevice(deviceId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'smartDevices', deviceId));
    } catch (error) {
      console.error('Error deleting device:', error);
      throw error;
    }
  }

  /**
   * Control device (turn on/off, adjust settings, etc.)
   */
  static async controlDevice(
    deviceId: string,
    action: string,
    parameters: Record<string, any>,
    userId: string
  ): Promise<void> {
    try {
      // Log the control action
      const controlRef = doc(collection(db, 'deviceControls'));
      await setDoc(controlRef, {
        deviceId,
        action,
        parameters,
        userId,
        timestamp: serverTimestamp(),
      });

      // Update device status
      await this.updateDevice(deviceId, {
        lastActive: Timestamp.now(),
      });

      // In a real implementation, this would send a command to the actual device
      // via MQTT, WebSocket, or REST API
      console.log(`Device ${deviceId} controlled: ${action}`, parameters);
    } catch (error) {
      console.error('Error controlling device:', error);
      throw error;
    }
  }

  /**
   * Get device control history
   */
  static async getDeviceHistory(deviceId: string, limitCount = 50): Promise<DeviceControl[]> {
    try {
      const q = query(
        collection(db, 'deviceControls'),
        where('deviceId', '==', deviceId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ ...doc.data() } as DeviceControl));
    } catch (error) {
      console.error('Error getting device history:', error);
      return [];
    }
  }

  /**
   * Log device event
   */
  static async logDeviceEvent(
    deviceId: string,
    event: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      const logRef = doc(collection(db, 'deviceLogs'));
      await setDoc(logRef, {
        deviceId,
        event,
        data,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error logging device event:', error);
    }
  }

  /**
   * Get device logs
   */
  static async getDeviceLogs(deviceId: string, limitCount = 100): Promise<DeviceLog[]> {
    try {
      const q = query(
        collection(db, 'deviceLogs'),
        where('deviceId', '==', deviceId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as DeviceLog));
    } catch (error) {
      console.error('Error getting device logs:', error);
      return [];
    }
  }

  /**
   * Update device permissions (who can control it)
   */
  static async updateDevicePermissions(
    deviceId: string,
    controllableBy: string[]
  ): Promise<void> {
    try {
      const deviceRef = doc(db, 'smartDevices', deviceId);
      await updateDoc(deviceRef, {
        controllableBy,
      });
    } catch (error) {
      console.error('Error updating device permissions:', error);
      throw error;
    }
  }

  /**
   * Get devices by type
   */
  static async getDevicesByType(type: DeviceType): Promise<SmartDevice[]> {
    try {
      const q = query(collection(db, 'smartDevices'), where('type', '==', type));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SmartDevice));
    } catch (error) {
      console.error('Error getting devices by type:', error);
      return [];
    }
  }

  /**
   * Get devices by status
   */
  static async getDevicesByStatus(status: DeviceStatus): Promise<SmartDevice[]> {
    try {
      const q = query(collection(db, 'smartDevices'), where('status', '==', status));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SmartDevice));
    } catch (error) {
      console.error('Error getting devices by status:', error);
      return [];
    }
  }

  /**
   * Bulk control devices (e.g., turn off all lights in a village)
   */
  static async bulkControlDevices(
    deviceIds: string[],
    action: string,
    parameters: Record<string, any>,
    userId: string
  ): Promise<void> {
    try {
      const promises = deviceIds.map((deviceId) =>
        this.controlDevice(deviceId, action, parameters, userId)
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error bulk controlling devices:', error);
      throw error;
    }
  }

  /**
   * Get device statistics
   */
  static async getDeviceStats(): Promise<any> {
    try {
      const devices = await this.getAllDevices();

      const stats = {
        total: devices.length,
        online: devices.filter((d) => d.status === DeviceStatus.ONLINE).length,
        offline: devices.filter((d) => d.status === DeviceStatus.OFFLINE).length,
        error: devices.filter((d) => d.status === DeviceStatus.ERROR).length,
        byType: {} as Record<DeviceType, number>,
      };

      // Count by type
      Object.values(DeviceType).forEach((type) => {
        stats.byType[type] = devices.filter((d) => d.type === type).length;
      });

      return stats;
    } catch (error) {
      console.error('Error getting device stats:', error);
      return { total: 0, online: 0, offline: 0, error: 0, byType: {} };
    }
  }
}
