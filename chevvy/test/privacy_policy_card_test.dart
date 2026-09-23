import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:chevvy/widgets/privacy_policy_card.dart';

void main() {
  group('PrivacyPolicyCard', () {
    testWidgets('renders title and content', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: PrivacyPolicyCard(
              title: '1. ACCEPTANCE',
              content: 'You must accept this Privacy Policy.',
            ),
          ),
        ),
      );

      expect(find.text('1. ACCEPTANCE'), findsOneWidget);
      expect(
        find.text('You must accept this Privacy Policy.'),
        findsOneWidget,
      );
      expect(find.byType(Divider), findsOneWidget);
    });

    testWidgets('hides divider when showDivider is false', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: PrivacyPolicyCard(
              title: 'Title',
              content: 'Content',
              showDivider: false,
            ),
          ),
        ),
      );

      expect(find.byType(Divider), findsNothing);
    });
  });

  group('PrivacyPolicySectionHeader', () {
    testWidgets('renders subtitle only when provided', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: PrivacyPolicySectionHeader(
              title: 'CHEVVY PRIVACY POLICY',
              subtitle: 'Please read carefully',
            ),
          ),
        ),
      );

      expect(find.text('CHEVVY PRIVACY POLICY'), findsOneWidget);
      expect(find.text('Please read carefully'), findsOneWidget);
    });

    testWidgets('does not render an empty subtitle row', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: PrivacyPolicySectionHeader(title: 'Title'),
          ),
        ),
      );

      expect(find.text('Title'), findsOneWidget);
      expect(find.text(''), findsNothing);
    });
  });

  group('PrivacyAcceptanceCheckbox', () {
    testWidgets('toggles value on tap', (tester) async {
      bool? captured;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PrivacyAcceptanceCheckbox(
              value: false,
              onChanged: (value) => captured = value,
            ),
          ),
        ),
      );

      await tester.tap(find.byType(Checkbox));
      expect(captured, true);
    });
  });
}