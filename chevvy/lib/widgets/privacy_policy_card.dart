import 'package:flutter/material.dart';

/// Reusable card widget for displaying privacy policy content
class PrivacyPolicyCard extends StatelessWidget {
  final String title;
  final String content;
  final bool showDivider;
  final EdgeInsets padding;

  const PrivacyPolicyCard({
    Key? key,
    required this.title,
    required this.content,
    this.showDivider = true,
    this.padding = const EdgeInsets.symmetric(vertical: 12.0, horizontal: 16.0),
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDarkMode = theme.brightness == Brightness.dark;

    return Semantics(
      label: title,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: padding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: isDarkMode
                        ? Colors.pinkAccent
                        : const Color(0xFFD81B60),
                  ),
                  semanticsLabel: 'Section: $title',
                ),
                const SizedBox(height: 8.0),
                Text(
                  content,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: isDarkMode
                        ? Colors.grey[300]
                        : Colors.grey[700],
                    height: 1.5,
                  ),
                  semanticsLabel: content,
                ),
              ],
            ),
          ),
          if (showDivider)
            Divider(
              color: isDarkMode
                  ? Colors.grey[700]
                  : Colors.grey[300],
              indent: 16.0,
              endIndent: 16.0,
              height: 24.0,
            ),
        ],
      ),
    );
  }
}

/// Section header widget for privacy policy
class PrivacyPolicySectionHeader extends StatelessWidget {
  final String title;
  final String subtitle;

  const PrivacyPolicySectionHeader({
    Key? key,
    required this.title,
    this.subtitle = '',
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDarkMode = theme.brightness == Brightness.dark;

    return Semantics(
      header: true,
      label: title,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: theme.textTheme.displaySmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: isDarkMode
                  ? Colors.white
                  : Colors.black87,
            ),
          ),
          if (subtitle.isNotEmpty) ...[]
            const SizedBox(height: 4.0),
            Text(
              subtitle,
              style: theme.textTheme.bodyLarge?.copyWith(
                color: isDarkMode
                    ? Colors.grey[400]
                    : Colors.grey[600],
              ),
            ),
          ],
          const SizedBox(height: 16.0),
        ],
      ),
    );
  }
}

/// Acceptance checkbox widget
class PrivacyAcceptanceCheckbox extends StatelessWidget {
  final bool value;
  final ValueChanged<bool?> onChanged;
  final String label;

  const PrivacyAcceptanceCheckbox({
    Key? key,
    required this.value,
    required this.onChanged,
    this.label = 'I have read and agree to the Privacy Policy.',
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDarkMode = theme.brightness == Brightness.dark;

    return Semantics(
      checkbox: true,
      enabled: true,
      onTap: () => onChanged(!value),
      label: label,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => onChanged(!value),
          child: Row(
            children: [
              Checkbox(
                value: value,
                onChanged: onChanged,
                activeColor: const Color(0xFFD81B60),
                checkColor: Colors.white,
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(left: 8.0),
                  child: Text(
                    label,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: isDarkMode
                          ? Colors.grey[200]
                          : Colors.grey[800],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
