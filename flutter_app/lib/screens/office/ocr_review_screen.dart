import 'package:flutter/material.dart';

import '../../widgets/common_widgets.dart';
import '../../state/app_state.dart';
import '../../models/letter.dart';

class OcrReviewScreen extends StatefulWidget {
  final Letter letter;
  final AppState state;
  const OcrReviewScreen({super.key, required this.letter, required this.state});

  @override
  State<OcrReviewScreen> createState() => _OcrReviewScreenState();
}

class _OcrReviewScreenState extends State<OcrReviewScreen> {
  late TextEditingController _recipientController;
  late TextEditingController _addressController;
  late TextEditingController _pincodeController;
  late String _overrideBeat;
  bool _isSaving = false; // Track saving state for UI feedback

  @override
  void initState() {
    super.initState();
    _recipientController = TextEditingController(text: widget.letter.recipientName);
    _addressController = TextEditingController(text: widget.letter.address?['fullAddress'] ?? widget.letter.ocrText);
    _pincodeController = TextEditingController(text: widget.letter.address?['pincode']);
    
    // 🔥 FIX: Normalize database string to prevent dropdown value match crashes
    String rawBeat = widget.letter.beatId?['beatNumber'] ?? 'Beat 101';
    _overrideBeat = 'Beat 101';
    if (rawBeat.contains('Beat 102')) _overrideBeat = 'Beat 102';
    if (rawBeat.contains('Beat 201')) _overrideBeat = 'Beat 201';
  }

  @override
  void dispose() {
    _recipientController.dispose();
    _addressController.dispose();
    _pincodeController.dispose();
    super.dispose();
  }

  void _saveReview() async {
    setState(() {
      _isSaving = true;
    });

    // 1. Commit text edits (Name, Address) to backend database
    bool textSuccess = await widget.state.correctLetterDetails(
      widget.letter.id,
      _recipientController.text,
      _addressController.text,
    );

    // 2. Commit the assigned beat routing zone selection
    bool beatSuccess = await widget.state.assignLetterToBeat(
      widget.letter.id,
      _overrideBeat,
    );

    if (!mounted) return;

    setState(() {
      _isSaving = false;
    });

    if (textSuccess && beatSuccess) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Verification Saved successfully!')),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to save corrections. Please check your network connection.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final double confidence = widget.letter.ocrConfidence ?? 90.0;
    final isLowConf = confidence < 70.0;

    return Scaffold(
      body: Column(
        children: [
          GovHeader(
            state: widget.state,
            titleOverride: 'OCR Verification & Review',
            showBackButton: true,
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  if (isLowConf)
                    Card(
                      color: Colors.red[50],
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Row(
                          children: [
                            const Icon(Icons.warning, color: Colors.red),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                t(context, 'low_confidence_warning') + ' (${confidence.toStringAsFixed(1)}%)',
                                style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 12),
                              ),
                            )
                          ],
                        ),
                      ),
                    ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _recipientController,
                    decoration: const InputDecoration(labelText: 'Recipient Name', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _addressController,
                    maxLines: 3,
                    decoration: const InputDecoration(labelText: 'Full Address', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _pincodeController,
                    decoration: const InputDecoration(labelText: 'Pincode', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _overrideBeat,
                    items: const [
                      DropdownMenuItem(value: 'Beat 101', child: Text('Beat 101 (Begumpet)')),
                      DropdownMenuItem(value: 'Beat 102', child: Text('Beat 102 (Khairatabad)')),
                      DropdownMenuItem(value: 'Beat 201', child: Text('Beat 201 (Madhapur)')),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setState(() {
                          _overrideBeat = val;
                        });
                      }
                    },
                    decoration: const InputDecoration(labelText: 'Assigned Beat Sector', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _isSaving ? null : _saveReview,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFC1272D), 
                      foregroundColor: Colors.white, 
                      minimumSize: const Size(double.infinity, 44)
                    ),
                    child: _isSaving 
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
                        : Text(t(context, 'save')),
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