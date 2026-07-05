import 'package:dio/dio.dart';

class ApiServices {
  final Dio _dio = Dio();

  final String _apiUrl = "http://localhost:5000/api";

  Options _buildOptions(String token) {
    final headers = <String, dynamic>{
      "Content-Type": "application/json",
    };

    if (token.trim().isNotEmpty) {
      headers["Authorization"] = "Bearer $token";
    }

    return Options(headers: headers);
  }

  Future<Response> fetchLetters(String token) {
    return _dio.get(
      "$_apiUrl/letters",
      options: _buildOptions(token),
    );
  }

  Future<Response> fetchPostmanRoute(String token) {
    return _dio.get(
      "$_apiUrl/routing/postman",
      options: _buildOptions(token),
    );
  }

  Future<Response> fetchAdminAnalytics(String token) {
    return _dio.get(
      "$_apiUrl/analytics/dashboard",
      options: _buildOptions(token),
    );
  }

  Future<Response> updateLetterStatus(
      String token, String id, String status) {
    return _dio.put(
      "$_apiUrl/letters/$id/status",
      data: {"status": status},
      options: _buildOptions(token),
    );
  }

  Future<Response> updateLetterDetails(
      String token,
      String id,
      Map<String, dynamic> updates,
      ) {
    return _dio.put(
      "$_apiUrl/letters/$id",
      data: updates,
      options: _buildOptions(token),
    );
  }

  Future<Response> executeOcrUpload(
      String token,
      String imagePath,
      ) async {
    final formData = FormData.fromMap({
      "label": await MultipartFile.fromFile(imagePath),
    });

    return _dio.post(
      "$_apiUrl/letters/upload",
      data: formData,
      options: _buildOptions(token),
    );
  }

  // Bytes-based version for platforms without real filesystem access (Flutter
  // web). Uses the same pattern as uploadBatchLabels, which already works on
  // web via file_picker. Prefer this one when calling from web-targeted code.
  Future<Response> executeOcrUploadBytes(
      String token,
      List<int> bytes,
      String filename,
      ) async {
    final formData = FormData.fromMap({
      "label": MultipartFile.fromBytes(bytes, filename: filename),
    });

    return _dio.post(
      "$_apiUrl/letters/upload",
      data: formData,
      options: _buildOptions(token),
    );
  }

  Future<Response> uploadBatchLabels(
      FormData formData,
      String token,
      ) {
    return _dio.post(
      "$_apiUrl/letters/batch-upload",
      data: formData,
      options: _buildOptions(token),
    );
  }

  Future<Response> triggerResetDemo(String token) {
    return _dio.post(
      "$_apiUrl/letters/reset",
      options: _buildOptions(token),
    );
  }
}