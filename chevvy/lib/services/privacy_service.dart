import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user_privacy_model.dart';

/// Service to manage user privacy policy acceptance
class PrivacyService {
  static final PrivacyService _instance = PrivacyService._internal();

  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  late final SharedPreferences _prefs;
  final _secureStorage = const FlutterSecureStorage();

  factory PrivacyService() {
    return _instance;
  }

  PrivacyService._internal();

  /// Initialize the service
  Future<void> initialize() async {
    _prefs = await SharedPreferences.getInstance();
  }

  /// Check if user has accepted privacy policy locally
  Future<bool> isPrivacyAcceptedLocally() async {
    await initialize();
    return _prefs.getBool('privacyAccepted') ?? false;
  }

  /// Get local privacy acceptance timestamp
  Future<String?> getLocalAcceptanceTimestamp() async {
    await initialize();
    return _prefs.getString('privacyAcceptedAt');
  }

  /// Check if user has accepted privacy policy from Firestore
  Future<bool> isPrivacyAcceptedInFirestore() async {
    try {
      final user = _auth.currentUser;
      if (user == null) return false;

      final doc = await _firestore.collection('users').doc(user.uid).get();
      if (!doc.exists) return false;

      final data = doc.data() as Map<String, dynamic>;
      return data['privacyAccepted'] as bool? ?? false;
    } catch (e) {
      print('Error checking Firestore privacy status: $e');
      return false;
    }
  }

  /// Get privacy model from Firestore
  Future<UserPrivacyModel?> getPrivacyModel() async {
    try {
      final user = _auth.currentUser;
      if (user == null) return null;

      final doc = await _firestore.collection('users').doc(user.uid).get();
      if (!doc.exists) return null;

      return UserPrivacyModel.fromFirestore(doc);
    } catch (e) {
      print('Error fetching privacy model: $e');
      return null;
    }
  }

  /// Accept privacy policy
  Future<void> acceptPrivacyPolicy() async {
    try {
      await initialize();
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final now = DateTime.now();

      // Update Firestore
      await _firestore.collection('users').doc(user.uid).update({
        'privacyAccepted': true,
        'privacyAcceptedAt': Timestamp.fromDate(now),
        'updatedAt': Timestamp.fromDate(now),
      });

      // Update local storage
      await _prefs.setBool('privacyAccepted', true);
      await _prefs.setString('privacyAcceptedAt', now.toIso8601String());

      // Store securely
      await _secureStorage.write(
        key: 'privacyAccepted_${user.uid}',
        value: 'true',
      );
    } catch (e) {
      print('Error accepting privacy policy: $e');
      rethrow;
    }
  }

  /// Decline privacy policy and logout
  Future<void> declinePrivacyPolicy() async {
    try {
      await initialize();
      final user = _auth.currentUser;

      // Clear local storage
      await _prefs.clear();

      // Clear secure storage
      if (user != null) {
        await _secureStorage.delete(key: 'privacyAccepted_${user.uid}');
      }

      // Sign out
      await _auth.signOut();
    } catch (e) {
      print('Error declining privacy policy: $e');
      rethrow;
    }
  }

  /// Create user document with privacy acceptance
  Future<void> createUserWithPrivacy({
    required String uid,
    required String email,
    required bool privacyAccepted,
  }) async {
    try {
      final now = DateTime.now();
      final model = UserPrivacyModel(
        uid: uid,
        email: email,
        privacyAccepted: privacyAccepted,
        privacyAcceptedAt:
            privacyAccepted ? now : null,
        createdAt: now,
        updatedAt: now,
      );

      await _firestore.collection('users').doc(uid).set(model.toFirestore());
    } catch (e) {
      print('Error creating user with privacy: $e');
      rethrow;
    }
  }

  /// Check privacy acceptance (combines local and Firestore)
  Future<bool> checkPrivacyAcceptance() async {
    try {
      // Try Firestore first
      final firestoreAccepted = await isPrivacyAcceptedInFirestore();
      if (firestoreAccepted) {
        return true;
      }

      // Fall back to local
      return await isPrivacyAcceptedLocally();
    } catch (e) {
      print('Error checking privacy acceptance: $e');
      return false;
    }
  }

  /// Clear all privacy-related data
  Future<void> clearAllPrivacyData() async {
    try {
      await initialize();
      final user = _auth.currentUser;

      await _prefs.remove('privacyAccepted');
      await _prefs.remove('privacyAcceptedAt');

      if (user != null) {
        await _secureStorage.delete(key: 'privacyAccepted_${user.uid}');
      }
    } catch (e) {
      print('Error clearing privacy data: $e');
      rethrow;
    }
  }
}
