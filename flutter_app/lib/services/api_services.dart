import 'package:dio/dio.dart';

class ApiServices {
  final Dio _dio = Dio();
  final String _apiUrl = "http://localhost:5000/api";

  Options _buildOptions(String token) => Options(
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

  Future<Response> fetchLetters(String token) {
    return _dio.get('$_apiUrl/letters', options: _buildOptions(token));
  }

  Future<Response> fetchPostmanRoute(String token) {
    return _dio.get('$_apiUrl/routing/postman', options: _buildOptions(token));
  }

  Future<Response> fetchAdminAnalytics(String token) {
    return _dio.get('$_apiUrl/analytics/dashboard', options: _buildOptions(token));
  }

  Future<Response> updateLetterStatus(String token, String id, String status) {
    return _dio.put(
      '$_apiUrl/letters/$id/status',
      data: {'status': status},
      options: _buildOptions(token),
    );
  }

  // 🔥 NEW: Sends updated fields (corrected address, name, or beatId mapping) to the backend
  Future<Response> updateLetterDetails(String token, String id, Map<String, dynamic> updates) {
    return _dio.put(
      '$_apiUrl/letters/$id',
      data: updates,
      options: _buildOptions(token),
    );
  }

  Future<Response> executeOcrUpload(String token, String imagePath) async {
    final formData = FormData.fromMap({
      'label': await MultipartFile.fromFile(imagePath),
    });
    return _dio.post('$_apiUrl/letters/upload', data: formData, options: _buildOptions(token));
  }

  Future<Response> triggerResetDemo(String token) {
    return _dio.post('$_apiUrl/letters/reset', options: _buildOptions(token));
  }
}