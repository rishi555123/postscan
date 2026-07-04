import 'package:flutter/material.dart';

import '../../widgets/common_widgets.dart';
import '../../state/app_state.dart';
import 'analytics_dashboard_screen.dart';
import 'user_management_screen.dart';

class AdminDashboardScreen extends StatefulWidget {
  final AppState state;
  const AdminDashboardScreen({super.key, required this.state});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  @override
  Widget build(BuildContext context) {
    final totalLetters = widget.state.adminAnalytics['totalLetters']?.toString() ?? widget.state.letters.length.toString();
    final delivered = widget.state.adminAnalytics['deliveredCount']?.toString() ?? widget.state.letters.where((l) => l.status == 'delivered').length.toString();
    final failed = widget.state.adminAnalytics['failedCount']?.toString() ?? '1';
    final accuracy = widget.state.adminAnalytics['ocrAccuracy']?.toString() ?? '92';

    return Scaffold(
      body: Column(
        children: [
          GovHeader(state: widget.state),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 1.5,
                    children: [
                      _buildKpiCard(t(context, 'scanned_letters'), totalLetters, const Color(0xFFC1272D)),
                      _buildKpiCard(t(context, 'success_deliveries'), delivered, Colors.green),
                      _buildKpiCard(t(context, 'failures'), failed, Colors.amber),
                      _buildKpiCard(t(context, 'ocr_accuracy'), '$accuracy%', Colors.blue),
                    ],
                  ),
                  const SizedBox(height: 16),

                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.analytics, color: Color(0xFFC1272D)),
                      title: Text(t(context, 'weekly_stats')),
                      subtitle: const Text('Detailed charts analysis dashboard'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => AnalyticsDashboardScreen(state: widget.state)),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 16),

                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.people, color: Color(0xFFC1272D)),
                      title: Text(t(context, 'add_user')),
                      subtitle: const Text('Register postmen and sorting operators'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => UserManagementScreen(state: widget.state)),
                        );
                      },
                    ),
                  ),
                  // 🚫 "Reset Database" section has been completely removed from here!
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKpiCard(String label, String value, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey), textAlign: TextAlign.center),
            const SizedBox(height: 6),
            Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }
}