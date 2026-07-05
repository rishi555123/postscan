class Letter {
  final String id;
  final String? trackingId;
  final String? recipientName;
  final Map<String, dynamic>? address;     // contains 'pincode' and 'fullAddress'
  final Map<String, dynamic>? coordinates; // contains 'lat' and 'lng'
  final String status;
  final Map<String, dynamic>? beatId;      // contains 'beatNumber' and 'colorHex'
  final double? ocrConfidence;
  final bool? lowConfidence;
  final String? ocrText;
  final DateTime? createdAt;
  final bool? cachedLocal;

  Letter({
    required this.id,
    this.trackingId,
    this.recipientName,
    this.address,
    this.coordinates,
    required this.status,
    this.beatId,
    this.ocrConfidence,
    this.lowConfidence,
    this.ocrText,
    this.createdAt,
    this.cachedLocal,
  });

  factory Letter.fromJson(Map<String, dynamic> json) {
    return Letter(
      id: json['_id'] ?? json['id'] ?? '',
      trackingId: json['trackingId'],
      recipientName: json['recipientName'],
      address: json['address'] != null ? Map<String, dynamic>.from(json['address']) : null,
      coordinates: json['coordinates'] != null ? Map<String, dynamic>.from(json['coordinates']) : null,
      status: json['status'] ?? 'pending',
      beatId: json['beatId'] is Map<String, dynamic> ? Map<String, dynamic>.from(json['beatId']) : null,
      ocrConfidence: (json['ocrConfidence'] as num?)?.toDouble(),
      lowConfidence: json['lowConfidence'],
      ocrText: json['ocrText'],
      createdAt: json['createdAt'] != null
    ? DateTime.parse(json['createdAt'])
    : null,
      cachedLocal: json['cachedLocal'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'id': id,
      'trackingId': trackingId,
      'recipientName': recipientName,
      'address': address,
      'coordinates': coordinates,
      'status': status,
      'beatId': beatId,
      'ocrConfidence': ocrConfidence,
      'lowConfidence': lowConfidence,
      'ocrText': ocrText,
      'createdAt': createdAt?.toIso8601String(),
      'cachedLocal': cachedLocal,
    };
  }
}