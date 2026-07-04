class User {
  final String id;
  final String name;
  final String username;
  final String role;
  
  // 🔥 ADD THESE FIELDS TO MATCH YOUR NEW BACKEND PAYLOAD
  final String? beatNumber;
  final String? region;
  final String languagePreference;

  User({
    required this.id,
    required this.name,
    required this.username,
    required this.role,
    this.beatNumber,
    this.region,
    required this.languagePreference,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? json['_id'] ?? '',
      name: json['name'] ?? '',
      username: json['username'] ?? '',
      role: json['role'] ?? 'postman',
      
      // 🔥 FIX: Safely extract the new keys coming from server routing responses
      beatNumber: json['beatNumber'],
      region: json['region'],
      
      languagePreference: json['languagePreference'] ?? 'en',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'username': username,
      'role': role,
      'beatNumber': beatNumber,
      'region': region,
      'languagePreference': languagePreference,
    };
  }
}