import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'firebase_options.dart';
import 'screens/privacy_policy_screen.dart';
import 'services/privacy_service.dart';
import 'services/auth_guard_service.dart';
import 'guards/privacy_guard.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Initialize services
  await PrivacyService().initialize();
  await AuthGuardService().initialize();
  await PrivacyGuard().initialize();

  runApp(const ChevvyApp());
}

class ChevvyApp extends StatefulWidget {
  const ChevvyApp({Key? key}) : super(key: key);

  @override
  State<ChevvyApp> createState() => _ChevvyAppState();
}

class _ChevvyAppState extends State<ChevvyApp> {
  late GoRouter _router;
  late PrivacyGuard _privacyGuard;

  @override
  void initState() {
    super.initState();
    _privacyGuard = PrivacyGuard();
    _router = _buildRouter();
  }

  /// Build GoRouter with privacy guard
  GoRouter _buildRouter() {
    return GoRouter(
      initialLocation: '/splash',
      redirect: (BuildContext context, GoRouterState state) async {
        // Skip redirect for splash and login screens
        if (state.matchedLocation == '/splash' ||
            state.matchedLocation == '/login' ||
            state.matchedLocation == '/privacy-policy') {
          return null;
        }

        // Check authentication and privacy
        final user = FirebaseAuth.instance.currentUser;
        if (user == null) {
          return '/login';
        }

        final privacyService = PrivacyService();
        final hasAcceptedPrivacy =
            await privacyService.checkPrivacyAcceptance();
        if (!hasAcceptedPrivacy) {
          return '/privacy-policy';
        }

        return null;
      },
      routes: [
        GoRoute(
          path: '/splash',
          name: 'splash',
          builder: (context, state) => const SplashScreen(),
        ),
        GoRoute(
          path: '/login',
          name: 'login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/privacy-policy',
          name: 'privacy-policy',
          builder: (context, state) => const PrivacyPolicyScreen(),
        ),
        GoRoute(
          path: '/dashboard',
          name: 'dashboard',
          builder: (context, state) => const DashboardScreen(),
        ),
        GoRoute(
          path: '/notes',
          name: 'notes',
          builder: (context, state) => const NotesScreen(),
        ),
        GoRoute(
          path: '/scheduler',
          name: 'scheduler',
          builder: (context, state) => const SchedulerScreen(),
        ),
        GoRoute(
          path: '/spotify',
          name: 'spotify',
          builder: (context, state) => const SpotifyScreen(),
        ),
        GoRoute(
          path: '/settings',
          name: 'settings',
          builder: (context, state) => const SettingsScreen(),
        ),
      ],
      errorBuilder: (context, state) => const ErrorScreen(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Chevvy',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFD81B60),
          brightness: Brightness.light,
        ),
        fontFamily: 'Roboto',
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFD81B60),
          brightness: Brightness.dark,
        ),
        fontFamily: 'Roboto',
      ),
      themeMode: ThemeMode.system,
      routerConfig: _router,
      debugShowCheckedModeBanner: false,
    );
  }
}

/// Splash Screen
class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    await Future.delayed(const Duration(seconds: 2));

    if (mounted) {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        final privacyService = PrivacyService();
        final hasAcceptedPrivacy =
            await privacyService.checkPrivacyAcceptance();

        if (mounted) {
          if (hasAcceptedPrivacy) {
            context.go('/dashboard');
          } else {
            context.go('/privacy-policy');
          }
        }
      } else {
        if (mounted) {
          context.go('/login');
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              const Color(0xFFFFC107),
              Colors.white,
              const Color(0xFFFF1744),
            ],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.favorite,
                size: 80,
                color: Color(0xFFD81B60),
              ),
              const SizedBox(height: 24),
              Text(
                'Chevvy',
                style: Theme.of(context).textTheme.displayLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFFD81B60),
                    ),
              ),
              const SizedBox(height: 48),
              const CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFD81B60)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Login Screen (Placeholder)
class LoginScreen extends StatelessWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Login'),
      ),
      body: const Center(
        child: Text('Login Screen - Spotify Auth Implementation Here'),
      ),
    );
  }
}

/// Dashboard Screen (Protected)
class DashboardScreen extends StatelessWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.dashboard,
              size: 80,
              color: Color(0xFFD81B60),
            ),
            const SizedBox(height: 16),
            Text(
              'Welcome, ${user?.email ?? 'User'}!',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            const Text('Privacy Policy Accepted'),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/notes'),
              child: const Text('Go to Notes'),
            ),
          ],
        ),
      ),
    );
  }
}

/// Notes Screen (Protected)
class NotesScreen extends StatelessWidget {
  const NotesScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notes'),
      ),
      body: const Center(
        child: Text('Notes Screen'),
      ),
    );
  }
}

/// Scheduler Screen (Protected)
class SchedulerScreen extends StatelessWidget {
  const SchedulerScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scheduler'),
      ),
      body: const Center(
        child: Text('Scheduler Screen'),
      ),
    );
  }
}

/// Spotify Screen (Protected)
class SpotifyScreen extends StatelessWidget {
  const SpotifyScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Spotify'),
      ),
      body: const Center(
        child: Text('Spotify Screen'),
      ),
    );
  }
}

/// Settings Screen (Protected)
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: const Center(
        child: Text('Settings Screen'),
      ),
    );
  }
}

/// Error Screen
class ErrorScreen extends StatelessWidget {
  const ErrorScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Error'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error,
              size: 80,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              'Page Not Found',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/dashboard'),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    );
  }
}
