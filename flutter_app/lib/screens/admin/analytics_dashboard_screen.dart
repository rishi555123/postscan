import 'package:flutter/material.dart';

import '../../widgets/common_widgets.dart';
import '../../state/app_state.dart';

class AnalyticsDashboardScreen extends StatelessWidget {
  final AppState state;
  const AnalyticsDashboardScreen({super.key, required this.state});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          GovHeader(
            state: state,
            titleOverride: t(context, 'weekly_stats'),
            showBackButton: true,
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Weekly Sorting Volume Distribution', style: TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              _buildBar('Mon', 40),
                              _buildBar('Tue', 65),
                              _buildBar('Wed', 85),
                              _buildBar('Thu', 50),
                              _buildBar('Fri', 95),
                            ],
                          )
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('OCR System Diagnostic Metrics', style: TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 12),
                          _buildMetricRow('Average Character Match Accuracy', '92%'),
                          const Divider(),
                          _buildMetricRow('Low Confidence Correction Rate', '87%'),
                          const Divider(),
                          _buildMetricRow('API Pipeline Execution Time', '420ms'),
                        ],
                      ),
                    ),
                  )
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBar(String label, double val) {
    return Column(
      children: [
        Container(
          height: val,
          width: 16,
          decoration: BoxDecoration(color: const Color(0xFFC1272D), borderRadius: BorderRadius.circular(4)),
        ),
        const SizedBox(height: 8),
        Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildMetricRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}