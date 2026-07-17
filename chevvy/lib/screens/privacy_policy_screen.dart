import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/privacy_service.dart';
import '../widgets/privacy_policy_card.dart';

/// Privacy Policy Screen - Must be accepted before accessing the app
class PrivacyPolicyScreen extends StatefulWidget {
  const PrivacyPolicyScreen({Key? key}) : super(key: key);

  @override
  State<PrivacyPolicyScreen> createState() => _PrivacyPolicyScreenState();
}

class _PrivacyPolicyScreenState extends State<PrivacyPolicyScreen> {
  late PrivacyService _privacyService;
  bool _isAccepted = false;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _privacyService = PrivacyService();
    _privacyService.initialize();
  }

  /// Handle accept button
  Future<void> _handleAccept() async {
    if (!_isAccepted) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await _privacyService.acceptPrivacyPolicy();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Privacy Policy accepted. Welcome to Chevvy!'),
            backgroundColor: Color(0xFFD81B60),
            duration: Duration(seconds: 2),
          ),
        );

        // Navigate to dashboard
        context.go('/dashboard');
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error accepting privacy policy: ${e.toString()}';
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_errorMessage ?? 'An error occurred'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  /// Handle decline button
  Future<void> _handleDecline() async {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Confirm Decline'),
          content: const Text(
            'Are you sure? Declining the Privacy Policy will log you out and you will not be able to use Chevvy.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                _declinePrivacyPolicy();
              },
              child: const Text(
                'Decline',
                style: TextStyle(color: Colors.red),
              ),
            ),
          ],
        );
      },
    );
  }

  /// Decline privacy policy and logout
  Future<void> _declinePrivacyPolicy() async {
    setState(() {
      _isLoading = true;
    });

    try {
      await _privacyService.declinePrivacyPolicy();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'You must accept the Privacy Policy to use Chevvy.',
            ),
            backgroundColor: Colors.amber,
            duration: Duration(seconds: 3),
          ),
        );

        // Navigate to login
        context.go('/login');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDarkMode = theme.brightness == Brightness.dark;
    final mediaQuery = MediaQuery.of(context);
    final isLargeScreen = mediaQuery.size.width > 600;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: isDarkMode
                ? [
                    Colors.grey[900]!,
                    Colors.grey[800]!,
                    Colors.grey[900]!,
                  ]
                : [
                    const Color(0xFFFFC107), // Yellow
                    Colors.white,
                    const Color(0xFFFF1744), // Pink
                  ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            child: Semantics(
              label: 'Privacy Policy',
              enabled: true,
              child: Padding(
                padding: EdgeInsets.all(
                  isLargeScreen ? 32.0 : 16.0,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Cherry Logo
                    Semantics(
                      image: true,
                      label: 'Chevvy logo',
                      child: Center(
                        child: Icon(
                          Icons.favorite,
                          size: isLargeScreen ? 80 : 60,
                          color: isDarkMode
                              ? Colors.pinkAccent
                              : const Color(0xFFD81B60),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24.0),

                    // Main Card
                    Card(
                      elevation: 8.0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20.0),
                      ),
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20.0),
                          color: isDarkMode
                              ? Colors.grey[900]
                              : Colors.white,
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Title
                              PrivacyPolicySectionHeader(
                                title: 'CHEVVY PRIVACY POLICY',
                                subtitle: 'Please read carefully',
                              ),

                              // Policy Content
                              _buildPolicyContent(theme, isDarkMode),

                              const SizedBox(height: 24.0),

                              // Acceptance Checkbox
                              PrivacyAcceptanceCheckbox(
                                value: _isAccepted,
                                onChanged: (value) {
                                  setState(() {
                                    _isAccepted = value ?? false;
                                  });
                                },
                              ),

                              const SizedBox(height: 24.0),

                              // Error Message
                              if (_errorMessage != null)
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 16.0),
                                  child: Container(
                                    padding: const EdgeInsets.all(12.0),
                                    decoration: BoxDecoration(
                                      color: Colors.red[100],
                                      borderRadius: BorderRadius.circular(8.0),
                                      border: Border.all(color: Colors.red),
                                    ),
                                    child: Text(
                                      _errorMessage!,
                                      style: theme.textTheme.bodyMedium?.copyWith(
                                        color: Colors.red[900],
                                      ),
                                    ),
                                  ),
                                ),

                              // Action Buttons
                              Semantics(
                                button: true,
                                enabled: true,
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: OutlinedButton(
                                        onPressed: _isLoading ? null : _handleDecline,
                                        style: OutlinedButton.styleFrom(
                                          padding: const EdgeInsets.symmetric(
                                            vertical: 12.0,
                                          ),
                                          shape: RoundedRectangleBorder(
                                            borderRadius:
                                                BorderRadius.circular(12.0),
                                          ),
                                          side: BorderSide(
                                            color: isDarkMode
                                                ? Colors.grey[600]!
                                                : Colors.grey[300]!,
                                          ),
                                        ),
                                        child: Text(
                                          'Decline',
                                          style: theme.textTheme.labelLarge
                                              ?.copyWith(
                                            color: isDarkMode
                                                ? Colors.grey[300]
                                                : Colors.grey[700],
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12.0),
                                    Expanded(
                                      child: ElevatedButton(
                                        onPressed: !_isAccepted || _isLoading
                                            ? null
                                            : _handleAccept,
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor:
                                              const Color(0xFFD81B60),
                                          disabledBackgroundColor:
                                              Colors.grey[400],
                                          padding: const EdgeInsets.symmetric(
                                            vertical: 12.0,
                                          ),
                                          shape: RoundedRectangleBorder(
                                            borderRadius:
                                                BorderRadius.circular(12.0),
                                          ),
                                        ),
                                        child: _isLoading
                                            ? SizedBox(
                                                height: 20.0,
                                                width: 20.0,
                                                child: CircularProgressIndicator(
                                                  valueColor:
                                                      AlwaysStoppedAnimation<
                                                          Color>(
                                                    isDarkMode
                                                        ? Colors.white
                                                        : Colors.black,
                                                  ),
                                                ),
                                              )
                                            : Text(
                                                'Accept & Continue',
                                                style: theme.textTheme
                                                    .labelLarge
                                                    ?.copyWith(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  /// Build privacy policy content
  Widget _buildPolicyContent(ThemeData theme, bool isDarkMode) {
    return Column(
      children: [
        PrivacyPolicyCard(
          title: '1. ACCEPTANCE',
          content:
              'You must accept this Privacy Policy before using the application. Declining this Privacy Policy results in immediate loss of access to all application services.',
        ),
        PrivacyPolicyCard(
          title: '2. INFORMATION COLLECTED',
          content:
              'The application may collect: Account Information, Spotify Account Information, Scheduling Information, Notes, Notification Preferences, and Usage Analytics.',
        ),
        PrivacyPolicyCard(
          title: '3. SPOTIFY ACCESS',
          content:
              'Spotify permissions are used for: Login, Playlist Access, Music Playback, and Alarm Music Selection.',
        ),
        PrivacyPolicyCard(
          title: '4. MICROPHONE ACCESS',
          content:
              'Microphone is used for: Voice-to-Text Notes and Speech Recognition functionality.',
        ),
        PrivacyPolicyCard(
          title: '5. NOTIFICATION ACCESS',
          content:
              'Notifications are used for: Task Reminders, Alarms, and Recurring Notifications.',
        ),
        PrivacyPolicyCard(
          title: '6. DATA USAGE',
          content:
              'Data is used for: Productivity Features, Scheduling, Notes, Spotify Integration, Security, and Analytics.',
        ),
        PrivacyPolicyCard(
          title: '7. ADMINISTRATIVE ACCESS',
          content:
              'Administrators may access stored user data only for: Maintenance, Technical Support, Abuse Prevention, Security Investigations, and Legal Compliance. Administrators cannot view user passwords. Passwords are securely hashed.',
        ),
        PrivacyPolicyCard(
          title: '8. USER OWNERSHIP',
          content:
              'Users retain ownership of: Notes, Tasks, Schedules, and all User-Generated Content.',
        ),
        PrivacyPolicyCard(
          title: '9. ACCOUNT SECURITY',
          content:
              'Account security includes: Encryption, Authentication, Session Protection, and Access Controls.',
        ),
        PrivacyPolicyCard(
          title: '10. DATA PROTECTION',
          content:
              'Your data is protected with: Encryption in Transit and Encryption at Rest.',
        ),
        PrivacyPolicyCard(
          title: '11. DATA RETENTION',
          content:
              'We retain your data as needed for service provision. You may request deletion of your data and associated account information at any time.',
        ),
        PrivacyPolicyCard(
          title: '12. USER RIGHTS',
          content:
              'You may: Access Your Data, Correct Data, Delete Data, and Request Information about your account.',
        ),
        PrivacyPolicyCard(
          title: '13. CONSENT',
          content:
              'By selecting "Accept & Continue", you consent to the Collection, Storage, and Processing of information described in this policy.',
        ),
        PrivacyPolicyCard(
          title: '14. LIMITATION OF LIABILITY',
          content:
              'IN NO EVENT SHALL CHEVVY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR IN CONNECTION WITH THIS POLICY OR THE USE OF THE APPLICATION.',
        ),
        PrivacyPolicyCard(
          title: '15. POLICY CHANGES',
          content:
              'We may update this Privacy Policy from time to time. Continued use of the application constitutes acceptance of any changes. You will be notified of significant changes.',
          showDivider: false,
        ),
      ],
    );
  }
}
