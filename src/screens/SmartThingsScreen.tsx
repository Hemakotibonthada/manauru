/**
 * Smart Things Screen
 * IoT device dashboard and control panel
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Switch,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { useAuth } from '../hooks/useAuth';
import { SmartThingsService } from '../services/smartThingsService';
import { PermissionService } from '../services/permissionService';
import { SmartDevice, DeviceType, DeviceStatus, UserRole } from '../types';

export default function SmartThingsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<SmartDevice | null>(null);
  const [showControlModal, setShowControlModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState<DeviceType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<DeviceStatus | 'all'>('all');

  useEffect(() => {
    if (!user || !PermissionService.hasPermission(user.role, PermissionService.PERMISSIONS.VIEW_DEVICES)) {
      Alert.alert('Access Denied', 'You do not have permission to view devices');
      navigation.goBack();
      return;
    }
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const villageId = user?.role === UserRole.VILLAGE_HEAD ? user?.villageId : undefined;
      const data = await SmartThingsService.getAllDevices(villageId);
      setDevices(data);
    } catch (error) {
      console.error('Error loading devices:', error);
      Alert.alert('Error', 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const canControlDevice = (device: SmartDevice): boolean => {
    if (!user) return false;
    return PermissionService.canControlDevice(user.role, user.id, device.controllableBy);
  };

  const handleToggleDevice = async (device: SmartDevice, newState: boolean) => {
    if (!canControlDevice(device)) {
      Alert.alert('Access Denied', 'You do not have permission to control this device');
      return;
    }

    try {
      await SmartThingsService.controlDevice(
        device.id,
        newState ? 'turn_on' : 'turn_off',
        { state: newState },
        user!.id
      );
      Alert.alert('Success', `Device ${newState ? 'turned on' : 'turned off'}`);
      loadDevices();
    } catch (error) {
      Alert.alert('Error', 'Failed to control device');
    }
  };

  const handleDeleteDevice = async (device: SmartDevice) => {
    if (!PermissionService.hasPermission(user!.role, PermissionService.PERMISSIONS.REMOVE_DEVICES)) {
      Alert.alert('Access Denied', 'You do not have permission to remove devices');
      return;
    }

    Alert.alert(
      'Delete Device',
      `Are you sure you want to delete ${device.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await SmartThingsService.deleteDevice(device.id);
              Alert.alert('Success', 'Device deleted successfully');
              loadDevices();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete device');
            }
          },
        },
      ]
    );
  };

  const filteredDevices = devices.filter((device) => {
    const matchesType = filterType === 'all' || device.type === filterType;
    const matchesStatus = filterStatus === 'all' || device.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const getDeviceIcon = (type: DeviceType): string => {
    const icons: Record<DeviceType, string> = {
      [DeviceType.LIGHT]: 'bulb',
      [DeviceType.CAMERA]: 'camera',
      [DeviceType.SENSOR]: 'radio',
      [DeviceType.LOCK]: 'lock-closed',
      [DeviceType.THERMOSTAT]: 'thermometer',
      [DeviceType.IRRIGATION]: 'water',
      [DeviceType.WATER_PUMP]: 'water-outline',
      [DeviceType.STREET_LIGHT]: 'flashlight',
      [DeviceType.ALARM]: 'notifications',
      [DeviceType.GATE]: 'remove-circle',
      [DeviceType.OTHER]: 'hardware-chip',
    };
    return icons[type] || 'hardware-chip';
  };

  const getStatusColor = (status: DeviceStatus): string => {
    switch (status) {
      case DeviceStatus.ONLINE:
        return '#27AE60';
      case DeviceStatus.OFFLINE:
        return '#95A5A6';
      case DeviceStatus.ERROR:
        return '#E74C3C';
      case DeviceStatus.MAINTENANCE:
        return '#F39C12';
      default:
        return colors.text.secondary;
    }
  };

  const renderDevice = ({ item }: { item: SmartDevice }) => {
    const isOnline = item.status === DeviceStatus.ONLINE;
    const canControl = canControlDevice(item);

    return (
      <TouchableOpacity
        style={styles.deviceCard}
        onPress={() => {
          setSelectedDevice(item);
          setShowControlModal(true);
        }}
      >
        <View style={[styles.deviceIcon, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Ionicons
            name={getDeviceIcon(item.type) as any}
            size={28}
            color={getStatusColor(item.status)}
          />
        </View>
        
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.deviceLocation}>{item.location}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        {canControl && isOnline && (
          <Switch
            value={item.metadata?.isOn || false}
            onValueChange={(value) => handleToggleDevice(item, value)}
            trackColor={{ false: '#767577', true: colors.primary.main + '80' }}
            thumbColor={item.metadata?.isOn ? colors.primary.main : '#f4f3f4'}
          />
        )}

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => {
            setSelectedDevice(item);
            setShowControlModal(true);
          }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const deviceTypes = Object.values(DeviceType);
  const deviceStatuses = Object.values(DeviceStatus);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Things</Text>
        {PermissionService.hasPermission(user?.role!, PermissionService.PERMISSIONS.ADD_DEVICES) && (
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Ionicons name="add-circle" size={28} color={colors.primary.main} />
          </TouchableOpacity>
        )}
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{devices.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#27AE60' }]}>
            {devices.filter((d) => d.status === DeviceStatus.ONLINE).length}
          </Text>
          <Text style={styles.statLabel}>Online</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#95A5A6' }]}>
            {devices.filter((d) => d.status === DeviceStatus.OFFLINE).length}
          </Text>
          <Text style={styles.statLabel}>Offline</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#E74C3C' }]}>
            {devices.filter((d) => d.status === DeviceStatus.ERROR).length}
          </Text>
          <Text style={styles.statLabel}>Error</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'all' && styles.activeFilterChip]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterText, filterType === 'all' && styles.activeFilterText]}>
              All Types
            </Text>
          </TouchableOpacity>
          {deviceTypes.slice(0, 5).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterChip, filterType === type && styles.activeFilterChip]}
              onPress={() => setFilterType(type)}
            >
              <Ionicons
                name={getDeviceIcon(type) as any}
                size={16}
                color={filterType === type ? colors.background.default : colors.text.secondary}
              />
              <Text style={[styles.filterText, filterType === type && styles.activeFilterText]}>
                {type.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Devices List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      ) : (
        <FlatList
          data={filteredDevices}
          renderItem={renderDevice}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="hardware-chip-outline" size={64} color={colors.text.secondary} />
              <Text style={styles.emptyText}>No devices found</Text>
            </View>
          }
        />
      )}

      {/* Device Control Modal */}
      <Modal
        visible={showControlModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowControlModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDevice && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedDevice.name}</Text>
                  <TouchableOpacity onPress={() => setShowControlModal(false)}>
                    <Ionicons name="close" size={24} color={colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.deviceDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type:</Text>
                    <Text style={styles.detailValue}>{selectedDevice.type.replace('_', ' ')}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={[styles.detailValue, { color: getStatusColor(selectedDevice.status) }]}>
                      {selectedDevice.status}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location:</Text>
                    <Text style={styles.detailValue}>{selectedDevice.location}</Text>
                  </View>
                </View>

                {canControlDevice(selectedDevice) && selectedDevice.status === DeviceStatus.ONLINE && (
                  <View style={styles.controlsSection}>
                    <Text style={styles.sectionTitle}>Controls</Text>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => handleToggleDevice(selectedDevice, !selectedDevice.metadata?.isOn)}
                    >
                      <Ionicons
                        name={selectedDevice.metadata?.isOn ? 'power' : 'power-outline'}
                        size={24}
                        color={colors.background.default}
                      />
                      <Text style={styles.controlButtonText}>
                        {selectedDevice.metadata?.isOn ? 'Turn Off' : 'Turn On'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {PermissionService.hasPermission(user!.role, PermissionService.PERMISSIONS.REMOVE_DEVICES) && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      setShowControlModal(false);
                      handleDeleteDevice(selectedDevice);
                    }}
                  >
                    <Ionicons name="trash" size={20} color={colors.error.main} />
                    <Text style={styles.deleteButtonText}>Delete Device</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.paper,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.background.paper,
    marginBottom: spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.primary.main,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  filtersSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background.paper,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  activeFilterChip: {
    backgroundColor: colors.primary.main,
  },
  filterText: {
    ...typography.body2,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  activeFilterText: {
    color: colors.background.default,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  deviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  deviceLocation: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  moreButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    ...typography.body1,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  deviceDetails: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  detailLabel: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  detailValue: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  controlsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  controlButtonText: {
    ...typography.button,
    color: colors.background.default,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error.main,
    gap: spacing.sm,
  },
  deleteButtonText: {
    ...typography.button,
    color: colors.error.main,
  },
});
