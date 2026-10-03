import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Login screen for Chevvy app
class LoginScreen extends StatelessWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDarkMode = theme.brightness == Brightness.dark;

    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // App logo/title
              Semantics(
                label: 'Chevvy app',
                child: Icon(
                  Icons.lock_outline,
                  size: 80,
                  color: isDarkMode ? Colors.pinkAccent : const Color(0xFFD81B60),
                ),
              ),
              const SizedBox(height: 32),
              // Email field
              TextField(
                decoration: InputDecoration(
                  labelText: 'Email',
                  labelStyle: theme.textTheme.bodyLarge,
                  hintText: 'Enter your email',
                  border: OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.email),
                ),
                keyboardType: TextInputType.emailAddress,
                
              ),
              const SizedBox(height: 16),
              // Password field
              TextField(
                decoration: InputDecoration(
                  labelText: 'Password',
                  labelStyle: theme.textTheme.bodyLarge,
                  hintText: 'Enter your password',
                  border: OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.lock),
                ),
                obscureText: true,
              ),
              const SizedBox(height: 24),
              // Login button
              ElevatedButton(
                onPressed: () {
                  // TODO: Implement login logic
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Login pressed')),
                  );
                },
                child: const Text('Login'),
              ),
              const SizedBox(height: 16),
              // Register link
              TextButton(
                onPressed: () {
                  GoRouter.of(context).go('/register');
                },
                child: const Text('Create account'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
