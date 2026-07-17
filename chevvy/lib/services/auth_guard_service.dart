import 'package:firebase_auth/firebase_auth.dart';
import 'privacy_service.dart';

/// Service to guard authentication and privacy checks
class AuthGuardService {
  static final AuthGuardService _instance = AuthGuardService._internal();

  final FirebaseAuth _auth = FirebaseAuth.instance;
  final PrivacyService _privacyService = PrivacyService();

  factory AuthGuardService() {
    return _instance;
  }

  AuthGuardService._internal();

  /// Initialize the service
  Future<void> initialize() async {
    await _privacyService.initialize();
  }

  /// Check if user is authenticated and has accepted privacy policy
  Future<bool> isUserAuthenticatedAndAccepted() async {
    try {
      final user = _auth.currentUser;
      if (user == null) return false;

      return await _privacyService.checkPrivacyAcceptance();
    } catch (e) {
      print('Error checking auth and privacy: $e');
      return false;
    }
  }

  /// Check if user needs to accept privacy policy
  Future<bool> doesUserNeedToAcceptPrivacy() async {
    try {
      final user = _auth.currentUser;
      if (user == null) return false;

      final accepted = await _privacyService.checkPrivacyAcceptance();
      return !accepted;
    } catch (e) {
      print('Error checking privacy requirement: $e');
      return false;
    }
  }

  /// Get current authenticated user
  User? getCurrentUser() {
    return _auth.currentUser;
  }

  /// Sign out user
  Future<void> signOut() async {
    try {
      await _privacyService.declinePrivacyPolicy();
    } catch (e) {
      print('Error signing out: $e');
      rethrow;
    }
  }

  /// Stream of authentication state
  Stream<User?> authStateChanges() {
    return _auth.authStateChanges();
  }
}
