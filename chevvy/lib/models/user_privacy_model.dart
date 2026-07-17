import 'package:cloud_firestore/cloud_firestore.dart';

/// Model representing user privacy acceptance status
class UserPrivacyModel {
  final String uid;
  final String email;
  final bool privacyAccepted;
  final DateTime? privacyAcceptedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  UserPrivacyModel({
    required this.uid,
    required this.email,
    required this.privacyAccepted,
    this.privacyAcceptedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Create from Firestore document
  factory UserPrivacyModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return UserPrivacyModel(
      uid: data['uid'] as String,
      email: data['email'] as String,
      privacyAccepted: data['privacyAccepted'] as bool? ?? false,
      privacyAcceptedAt: data['privacyAcceptedAt'] != null
          ? (data['privacyAcceptedAt'] as Timestamp).toDate()
          : null,
      createdAt: (data['createdAt'] as Timestamp).toDate(),
      updatedAt: (data['updatedAt'] as Timestamp).toDate(),
    );
  }

  /// Convert to Firestore document
  Map<String, dynamic> toFirestore() {
    return {
      'uid': uid,
      'email': email,
      'privacyAccepted': privacyAccepted,
      'privacyAcceptedAt': privacyAcceptedAt != null
          ? Timestamp.fromDate(privacyAcceptedAt!)
          : null,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(DateTime.now()),
    };
  }

  /// Create a copy with modified fields
  UserPrivacyModel copyWith({
    String? uid,
    String? email,
    bool? privacyAccepted,
    DateTime? privacyAcceptedAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return UserPrivacyModel(
      uid: uid ?? this.uid,
      email: email ?? this.email,
      privacyAccepted: privacyAccepted ?? this.privacyAccepted,
      privacyAcceptedAt: privacyAcceptedAt ?? this.privacyAcceptedAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  String toString() =>
      'UserPrivacyModel(uid: $uid, email: $email, privacyAccepted: $privacyAccepted, privacyAcceptedAt: $privacyAcceptedAt)';
}
