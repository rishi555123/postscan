class Beat {
  final String? beatNumber;
  final String? colorHex;
  final Map<String, dynamic>? coordinates; // contains 'lat' and 'lng'

  Beat({
    this.beatNumber,
    this.colorHex,
    this.coordinates,
  });

  factory Beat.fromJson(Map<String, dynamic> json) {
    return Beat(
      beatNumber: json['beatNumber'],
      colorHex: json['colorHex'],
      coordinates: json['coordinates'] != null 
          ? Map<String, dynamic>.from(json['coordinates']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'beatNumber': beatNumber,
      'colorHex': colorHex,
      'coordinates': coordinates,
    };
  }
}