/**
 * Add Family Member Screen
 * Modal screen for adding new family members to a tree
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { FamilyService } from '../services/familyService';
import { FamilyMember, FamilyRelationType, Gender } from '../types';

interface AddFamilyMemberScreenProps {
  route: {
    params: {
      treeId: string;
      parentId?: string;
      relationType?: FamilyRelationType;
    };
  };
  navigation: any;
}

export default function AddFamilyMemberScreen({
  route,
  navigation,
}: AddFamilyMemberScreenProps) {
  const { user } = useAuth();
  const { treeId, parentId, relationType: initialRelationType } = route.params;

  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [showParentSelector, setShowParentSelector] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [placeOfDeath, setPlaceOfDeath] = useState('');
  const [occupation, setOccupation] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<Gender | undefined>();
  const [isAlive, setIsAlive] = useState(true);
  const [generation, setGeneration] = useState(0);
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(parentId);
  const [selectedRelationType, setSelectedRelationType] = useState<
    FamilyRelationType | undefined
  >(initialRelationType);

  useEffect(() => {
    loadTreeMembers();
  }, []);

  const loadTreeMembers = async () => {
    try {
      const treeMembers = await FamilyService.getTreeMembers(treeId);
      setMembers(treeMembers);
    } catch (error) {
      console.error('Error loading tree members:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please enter first and last name');
      return;
    }

    if (!selectedParentId || !selectedRelationType) {
      Alert.alert('Error', 'Please select a parent and relationship type');
      return;
    }

    try {
      setLoading(true);

      const memberData: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'> = {
        familyTreeId: treeId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        dateOfBirth: dateOfBirth || undefined,
        dateOfDeath: isAlive ? undefined : dateOfDeath || undefined,
        gender: gender || Gender.MALE,
        occupation: occupation || undefined,
        bio: bio || undefined,
        userId: undefined,
        photoURL: undefined,
        isAlive,
        generation,
        createdBy: user.id,
      };

      await FamilyService.addFamilyMember(
        memberData,
        selectedParentId,
        selectedRelationType
      );

      Alert.alert('Success', 'Family member added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error adding family member:', error);
      Alert.alert('Error', 'Failed to add family member');
    } finally {
      setLoading(false);
    }
  };

  const renderGenderSelector = () => (
    <View style={styles.genderContainer}>
      <TouchableOpacity
        style={[
          styles.genderButton,
          gender === Gender.MALE && styles.genderButtonSelected,
        ]}
        onPress={() => setGender(Gender.MALE)}
      >
        <Ionicons
          name="male"
          size={24}
          color={gender === Gender.MALE ? '#fff' : '#64748b'}
        />
        <Text
          style={[
            styles.genderText,
            gender === Gender.MALE && styles.genderTextSelected,
          ]}
        >
          Male
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.genderButton,
          gender === Gender.FEMALE && styles.genderButtonSelected,
        ]}
        onPress={() => setGender(Gender.FEMALE)}
      >
        <Ionicons
          name="female"
          size={24}
          color={gender === Gender.FEMALE ? '#fff' : '#64748b'}
        />
        <Text
          style={[
            styles.genderText,
            gender === Gender.FEMALE && styles.genderTextSelected,
          ]}
        >
          Female
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.genderButton,
          gender === Gender.OTHER && styles.genderButtonSelected,
        ]}
        onPress={() => setGender(Gender.OTHER)}
      >
        <Ionicons
          name="male-female"
          size={24}
          color={gender === Gender.OTHER ? '#fff' : '#64748b'}
        />
        <Text
          style={[
            styles.genderText,
            gender === Gender.OTHER && styles.genderTextSelected,
          ]}
        >
          Other
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderRelationTypeSelector = () => {
    const relationTypes = [
      { value: FamilyRelationType.FATHER, label: 'Father', icon: 'male' },
      { value: FamilyRelationType.MOTHER, label: 'Mother', icon: 'female' },
      { value: FamilyRelationType.SON, label: 'Son', icon: 'male' },
      { value: FamilyRelationType.DAUGHTER, label: 'Daughter', icon: 'female' },
      { value: FamilyRelationType.BROTHER, label: 'Brother', icon: 'male' },
      { value: FamilyRelationType.SISTER, label: 'Sister', icon: 'female' },
      { value: FamilyRelationType.SPOUSE, label: 'Spouse', icon: 'heart' },
      { value: FamilyRelationType.GRANDFATHER, label: 'Grandfather', icon: 'male' },
      { value: FamilyRelationType.GRANDMOTHER, label: 'Grandmother', icon: 'female' },
      { value: FamilyRelationType.GRANDSON, label: 'Grandson', icon: 'male' },
      { value: FamilyRelationType.GRANDDAUGHTER, label: 'Granddaughter', icon: 'female' },
    ];

    return (
      <View style={styles.relationTypesContainer}>
        {relationTypes.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.relationTypeButton,
              selectedRelationType === type.value && styles.relationTypeButtonSelected,
            ]}
            onPress={() => setSelectedRelationType(type.value)}
          >
            <Ionicons
              name={type.icon as any}
              size={20}
              color={selectedRelationType === type.value ? '#fff' : '#64748b'}
            />
            <Text
              style={[
                styles.relationTypeText,
                selectedRelationType === type.value && styles.relationTypeTextSelected,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderParentSelector = () => (
    <Modal
      visible={showParentSelector}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowParentSelector(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Parent/Relative</Text>
            <TouchableOpacity onPress={() => setShowParentSelector(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.memberList}>
            {members.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.memberItem,
                  selectedParentId === member.id && styles.memberItemSelected,
                ]}
                onPress={() => {
                  setSelectedParentId(member.id);
                  setShowParentSelector(false);
                }}
              >
                <View style={styles.memberInfo}>
                  <Ionicons name="person-circle" size={40} color="#3b82f6" />
                  <View style={styles.memberText}>
                    <Text style={styles.memberName}>{member.displayName}</Text>
                    <Text style={styles.memberDetails}>
                      Generation {Math.abs(member.generation)}
                      {member.occupation && ` • ${member.occupation}`}
                    </Text>
                  </View>
                </View>
                {selectedParentId === member.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const selectedParent = members.find((m) => m.id === selectedParentId);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Family Member</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.form}>
        {/* Basic Information */}
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <Text style={styles.inputLabel}>First Name *</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter first name"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.inputLabel}>Last Name *</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Enter last name"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.inputLabel}>Gender</Text>
        {renderGenderSelector()}

        {/* Relationship */}
        <Text style={styles.sectionTitle}>Relationship</Text>

        <Text style={styles.inputLabel}>Connect to *</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowParentSelector(true)}
        >
          <View style={styles.selectButtonContent}>
            {selectedParent ? (
              <>
                <Ionicons name="person-circle" size={24} color="#3b82f6" />
                <Text style={styles.selectButtonText}>{selectedParent.displayName}</Text>
              </>
            ) : (
              <>
                <Ionicons name="person-add" size={24} color="#64748b" />
                <Text style={styles.selectButtonTextPlaceholder}>
                  Select family member
                </Text>
              </>
            )}
          </View>
          <Ionicons name="chevron-forward" size={24} color="#64748b" />
        </TouchableOpacity>

        <Text style={styles.inputLabel}>Relationship Type *</Text>
        {renderRelationTypeSelector()}

        {/* Life Information */}
        <Text style={styles.sectionTitle}>Life Information</Text>

        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setIsAlive(!isAlive)}
          >
            <Ionicons
              name={isAlive ? 'checkbox' : 'square-outline'}
              size={24}
              color="#3b82f6"
            />
            <Text style={styles.checkboxLabel}>Living</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.inputLabel}>Date of Birth (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder="1990-01-01"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.inputLabel}>Place of Birth</Text>
        <TextInput
          style={styles.input}
          value={placeOfBirth}
          onChangeText={setPlaceOfBirth}
          placeholder="City, Country"
          placeholderTextColor="#94a3b8"
        />

        {!isAlive && (
          <>
            <Text style={styles.inputLabel}>Date of Death (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={dateOfDeath}
              onChangeText={setDateOfDeath}
              placeholder="2020-01-01"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Place of Death</Text>
            <TextInput
              style={styles.input}
              value={placeOfDeath}
              onChangeText={setPlaceOfDeath}
              placeholder="City, Country"
              placeholderTextColor="#94a3b8"
            />
          </>
        )}

        {/* Additional Information */}
        <Text style={styles.sectionTitle}>Additional Information</Text>

        <Text style={styles.inputLabel}>Occupation</Text>
        <TextInput
          style={styles.input}
          value={occupation}
          onChangeText={setOccupation}
          placeholder="e.g., Teacher, Engineer"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.inputLabel}>Generation (relative to root)</Text>
        <TextInput
          style={styles.input}
          value={generation.toString()}
          onChangeText={(text) => setGeneration(parseInt(text) || 0)}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.inputLabel}>Biography</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell their story..."
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={4}
        />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>Add Member</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Parent Selector Modal */}
      {renderParentSelector()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  form: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 24,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
  },
  genderButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  genderText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  genderTextSelected: {
    color: '#fff',
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
  },
  selectButtonTextPlaceholder: {
    fontSize: 16,
    color: '#94a3b8',
    marginLeft: 12,
  },
  relationTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  relationTypeButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  relationTypeText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
  },
  relationTypeTextSelected: {
    color: '#fff',
  },
  checkboxContainer: {
    marginBottom: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  memberList: {
    padding: 16,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  memberItemSelected: {
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberText: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  memberDetails: {
    fontSize: 12,
    color: '#64748b',
  },
});
