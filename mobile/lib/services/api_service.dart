import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Online public secure Tailscale Funnel endpoint
  final String baseUrl = 'https://xlcmrn.tailc45dc7.ts.net/api';
  String? authToken;

  Future<bool> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        authToken = data['token'];
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<bool> markAttendance(String qrPayload) async {
    if (authToken == null) return false;
    
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/attendance/scan'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken'
        },
        body: jsonEncode({
          'qr_payload': qrPayload,
          'employee_id': 1 // Mocking current user ID
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
