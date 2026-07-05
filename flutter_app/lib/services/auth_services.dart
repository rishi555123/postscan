import 'package:dio/dio.dart';

class AuthServices {
  final Dio _dio = Dio();
  final String _apiUrl = "http://localhost:5000/api";

  Options _buildOptions(String token) {
  final headers = <String, dynamic>{
    'Content-Type': 'application/json',
  };

  if (token.trim().isNotEmpty) {
    headers['Authorization'] = 'Bearer $token';
  }

  return Options(headers: headers);
}

  Future<Response> executeLogin(String username, String password) {
    return _dio.post(
      '$_apiUrl/auth/login',
      data: {
        'username': username,
        'password': password,
      },
    );
  }

  Future<Response> syncLanguagePreference(String token, String langCode) {
    return _dio.put(
      '$_apiUrl/auth/preferences',
      data: {'language': langCode},
      options: _buildOptions(token),
    );
  }

  Future<Response> executeChangePassword(String token, String oldPassword, String newPassword) {
    return _dio.put(
      '$_apiUrl/auth/change-password',
      data: {
        'oldPassword': oldPassword,
        'newPassword': newPassword,
      },
      options: _buildOptions(token),
    );
  }

  Future<Response> executeUserRegistration(String token, Map<String, dynamic> userPayload) {
    return _dio.post(
      '$_apiUrl/auth/register',
      data: userPayload,
      options: _buildOptions(token),
    );
  }
}

