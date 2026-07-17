import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/privacy_service.dart';
import '../services/auth_guard_service.dart';

/// Guard to protect routes and ensure privacy policy acceptance
class PrivacyGuard {
  static final PrivacyGuard _instance = PrivacyGuard._internal();

  final PrivacyService _privacyService = PrivacyService();
  final AuthGuardService _authGuardService = AuthGuardService();

  factory PrivacyGuard() {
    return _instance;
  }

  PrivacyGuard._internal();

  /// Initialize the guard
  Future<void> initialize() async {
    await _privacyService.initialize();
    await _authGuardService.initialize();
  }

  /// Check if user can access protected routes
  Future<bool> canAccessProtectedRoute() async {
    try {
      return await _authGuardService.isUserAuthenticatedAndAccepted();
    } catch (e) {
      print('Error in privacy guard: $e');
      return false;
    }
  }

  /// Redirect function for GoRouter
  Future<String?> redirect(BuildContext context, GoRouterState state) async {
    try {
      await initialize();

      final isAuthenticated = _authGuardService.getCurrentUser() != null;
      if (!isAuthenticated) {
        return '/login';
      }

      final hasAcceptedPrivacy =
          await _privacyService.checkPrivacyAcceptance();
      if (!hasAcceptedPrivacy) {
        return '/privacy-policy';
      }

      return null;
    } catch (e) {
      print('Error in redirect: $e');
      return '/login';
    }
  }

  /// List of protected routes that require privacy acceptance
  static const List<String> protectedRoutes = [
    '/dashboard',
    '/notes',
    '/scheduler',
    '/spotify',
    '/settings',
  ];

  /// Check if a route is protected
  static bool isRouteProtected(String route) {
    return protectedRoutes.any((protectedRoute) => route.startsWith(protectedRoute));
  }
}
