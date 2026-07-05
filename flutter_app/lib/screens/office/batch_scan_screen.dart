import 'package:flutter/material.dart';
import '../../widgets/common_widgets.dart';
import '../../state/app_state.dart';
import 'package:file_picker/file_picker.dart';
import 'package:dio/dio.dart';
import '../../services/api_services.dart';

class BatchScanScreen extends StatefulWidget {
  final AppState state;
  const BatchScanScreen({super.key, required this.state});

  @override
  State<BatchScanScreen> createState() => _BatchScanScreenState();
}

class _BatchScanScreenState extends State<BatchScanScreen> {
  bool _uploading = false;
  final ApiServices _api = ApiServices();
  List<PlatformFile> _selectedFiles = [];
  List<Map<String, dynamic>> _queue = [];

  Future<void> _pickImages() async {
  FilePickerResult? result = await FilePicker.platform.pickFiles(
    allowMultiple: true,
    type: FileType.image,
  );

  if (result == null) return;

  setState(() {
    _selectedFiles = result.files;
  });
}

  Future<void> _triggerBatchProcessing() async {
  if (_selectedFiles.isEmpty) return;

  setState(() {
    _uploading = true;
  });

  try {
    final formData = FormData();

    for (final file in _selectedFiles) {
      formData.files.add(
        MapEntry(
          'labels',
          MultipartFile.fromBytes(
            file.bytes!,
            filename: file.name,
          ),
        ),
      );
    }

    final response = await _api.uploadBatchLabels(
      formData,
      widget.state.token,
    );

    debugPrint(response.data.toString());

    if (response.data["success"] == true) {
  final letters = response.data["letters"] as List;

  setState(() {
    _queue = letters
        .map<Map<String, dynamic>>(
          (e) => {
            "name": e["trackingId"],
            "progress": 100,
            "status": "complete",
          },
        )
        .toList();
  });
}

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("Batch uploaded successfully"),
      ),
    );

  } catch (e) {
    print(e);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(e.toString()),
      ),
    );
  }

  setState(() {
    _uploading = false;
    _selectedFiles.clear();
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
                            onPressed: _uploading
    ? null
    : () async {
        if (_selectedFiles.isEmpty) {
          await _pickImages();
        } else {
          await _triggerBatchProcessing();
        }
      },
                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFC1272D), foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 44)),
                            child: _uploading ? const CircularProgressIndicator(color: Colors.white) : Text(
  _selectedFiles.isEmpty
      ? 'Select Postal Labels'
      : '${_selectedFiles.length} Images Selected',
)
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