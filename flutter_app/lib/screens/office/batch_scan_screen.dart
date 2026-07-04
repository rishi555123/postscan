import 'package:flutter/material.dart';

import '../../widgets/common_widgets.dart';
import '../../state/app_state.dart';

class BatchScanScreen extends StatefulWidget {
  final AppState state;
  const BatchScanScreen({super.key, required this.state});

  @override
  State<BatchScanScreen> createState() => _BatchScanScreenState();
}

class _BatchScanScreenState extends State<BatchScanScreen> {
  bool _uploading = false;
  List<Map<String, dynamic>> _queue = [];

  void _triggerBatchProcessing() async {
    setState(() {
      _uploading = true;
      _queue = [
        {'name': 'label_1.png', 'progress': 20, 'status': 'processing', 'recipient': 'K. L. Reddy'},
        {'name': 'label_2.png', 'progress': 0, 'status': 'pending', 'recipient': 'P. Sen'},
        {'name': 'label_3.png', 'progress': 0, 'status': 'pending', 'recipient': 'M. A. Khan'},
      ];
    });

    for (int i = 0; i < _queue.length; i++) {
      setState(() {
        _queue[i]['status'] = 'processing';
      });
      for (int progress = 20; progress <= 100; progress += 40) {
        await Future.delayed(const Duration(milliseconds: 300));
        setState(() {
          _queue[i]['progress'] = progress;
        });
      }
      setState(() {
        _queue[i]['status'] = 'complete';
      });

      widget.state.addLetter({
        '_id': 'L_BATCH_${DateTime.now().millisecond}_$i',
        'trackingId': 'IN-BT${DateTime.now().millisecond}$i',
        'recipientName': _queue[i]['recipient'],
        'address': {
          'pincode': '500016',
          'fullAddress': 'H.No. 402, Ameerpet, Hyderabad, Telangana, 500016',
        },
        'coordinates': {'lat': 17.4375, 'lng': 78.4482},
        'status': 'assigned',
        'beatId': {'beatNumber': 'Beat 101', 'colorHex': '#C1272D'},
        'ocrConfidence': 89.0,
        'lowConfidence': false,
      });
    }

    setState(() {
      _uploading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          GovHeader(
            state: widget.state,
            titleOverride: t(context, 'batch_scan'),
            showBackButton: true,
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        children: [
                          const Icon(Icons.folder_open, size: 48, color: Color(0xFFC1272D)),
                          const SizedBox(height: 12),
                          Text(t(context, 'select_photo'), style: const TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: _uploading ? null : _triggerBatchProcessing,
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFC1272D), foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 44)),
                            child: _uploading ? const CircularProgressIndicator(color: Colors.white) : const Text('Load labels and Process Batch'),
                          )
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text('Processing Queue', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Expanded(
                    child: ListView.builder(
                      itemCount: _queue.length,
                      itemBuilder: (context, index) {
                        final item = _queue[index];
                        return ListTile(
                          leading: Icon(
                            item['status'] == 'complete' ? Icons.check_circle : Icons.hourglass_empty,
                            color: item['status'] == 'complete' ? Colors.green : Colors.grey,
                          ),
                          title: Text(item['name']),
                          subtitle: LinearProgressIndicator(value: item['progress'] / 100.0),
                          trailing: Text(item['status'].toString().toUpperCase()),
                        );
                      },
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
}