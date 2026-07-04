import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:image_picker/image_picker.dart';

import '../../widgets/common_widgets.dart';
import '../../state/app_state.dart';
import '../../models/letter.dart';
import 'batch_scan_screen.dart';
import 'ocr_review_screen.dart';

class OfficeDashboardScreen extends StatefulWidget {
  final AppState state;
  const OfficeDashboardScreen({super.key, required this.state});

  @override
  State<OfficeDashboardScreen> createState() => _OfficeDashboardScreenState();
}

class _OfficeDashboardScreenState extends State<OfficeDashboardScreen> {
  final ScrollController _scrollController = ScrollController(); 
  final GlobalKey _batchTargetKey = GlobalKey(); // Safe global key anchor for database overview
  final GlobalKey _dropdownCardKey = GlobalKey(); // ✅ NEW: Safe anchor to scroll exactly to the layout output card top point
  int _activePipelineStep = -1;
  bool _isProcessingSingle = false;
  double _ocrConfidence = 91.2;
  bool _lowConfidence = false;
  // 🔥 Today's letters list dropdown track cheyadaniki kotha variables
  bool _isTodayBatchDropdownOpen = false;
  String? _selectedActiveBeatForBatch;
  
  final _recipientController = TextEditingController(text: 'K. R. Rao');
  final _ocrOutputController = TextEditingController(text: 'K. R. Rao\\nH.No. 3-4-12, Begumpet Main Rd\\nHyd - 500016');
  final _aiCorrectedController = TextEditingController(text: 'H.No. 3-4-12, Meera Nilayam, Begumpet Main Road, Hyderabad, Telangana, 500016');

  final ImagePicker _picker = ImagePicker();
  final MapController _mapController = MapController();
  String? _selectedBeat;

  @override
  void dispose() {
    _scrollController.dispose(); 
    _recipientController.dispose();
    _ocrOutputController.dispose();
    _aiCorrectedController.dispose();
    super.dispose();
  }

  // Helper to safely extract beat strings without type-crash exceptions
  String _safeGetBeatNumber(dynamic beatId) {
    if (beatId == null) return 'Unassigned';
    if (beatId is Map) return beatId['beatNumber'] ?? 'Unassigned';
    try {
      return beatId.beatNumber ?? 'Unassigned';
    } catch (_) {}
    return beatId.toString();
  }

  void _runLivePipeline() async {
    setState(() {
      _isProcessingSingle = true;
      _activePipelineStep = 0;
    });

    for (int i = 1; i <= 5; i++) {
      await Future.delayed(const Duration(milliseconds: 500));
      if (!mounted) return;
      setState(() {
        _activePipelineStep = i;
      });
    }

    setState(() {
      _isProcessingSingle = false;
    });
  }

  void _pickLabelImage() async {
    try {
      final XFile? photo = await _picker.pickImage(source: ImageSource.gallery);
      if (photo != null) {
        _runLivePipeline();
      }
    } catch (e) {
      debugPrint("Error picking image: " + e.toString() + ". Running mock pipeline.");
      _runLivePipeline();
    }
  }

  void _saveVerifiedLetter() {
    widget.state.addLetter({
      '_id': 'L' + DateNow(),
      'trackingId': 'IN-' + DateNow().substring(8),
      'recipientName': _recipientController.text,
      'address': {
        'pincode': '500016',
        'fullAddress': _aiCorrectedController.text,
      },
      'coordinates': {'lat': 17.4455, 'lng': 78.4720},
      'status': 'assigned',
      'beatId': {'beatNumber': 'Beat 101', 'colorHex': '#C1272D'},
      'ocrConfidence': _ocrConfidence,
      'lowConfidence': _lowConfidence,
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Verified letter added to dispatch queue.')),
    );
    setState(() {
      _activePipelineStep = -1;
    });
  }

  String DateNow() {
    return DateTime.now().millisecondsSinceEpoch.toString();
  }

  void _fitBounds() {
    if (widget.state.letters.isEmpty) return;

    double minLat = 90.0;
    double maxLat = -90.0;
    double minLng = 180.0;
    double maxLng = -180.0;

    for (var l in widget.state.letters) {
      final coords = l.coordinates ?? {'lat': 17.44, 'lng': 78.47};
      final double lat = coords['lat'];
      final double lng = coords['lng'];
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }

    _mapController.fitCamera(
      CameraFit.bounds(
        bounds: LatLngBounds(
          LatLng(minLat - 0.005, minLng - 0.005),
          LatLng(maxLat + 0.005, maxLng + 0.005),
        ),
        padding: const EdgeInsets.all(24),
      ),
    );
  }

  void _fitBeatBounds(String beatNumber) {
    final beatLetters = widget.state.letters.where((l) => _safeGetBeatNumber(l.beatId) == beatNumber).toList();
    if (beatLetters.isEmpty) return;

    double minLat = 90.0;
    double maxLat = -90.0;
    double minLng = 180.0;
    double maxLng = -180.0;

    for (var l in beatLetters) {
      final coords = l.coordinates ?? {'lat': 17.44, 'lng': 78.47};
      final double lat = coords['lat'];
      final double lng = coords['lng'];
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }

    _mapController.fitCamera(
      CameraFit.bounds(
        bounds: LatLngBounds(
          LatLng(minLat - 0.003, minLng - 0.003),
          LatLng(maxLat + 0.003, maxLng + 0.003),
        ),
        padding: const EdgeInsets.all(20),
      ),
    );
  }

  void _showDeliveryInfo(Letter l) {
    final beat = _safeGetBeatNumber(l.beatId);
    final addr = l.address?['fullAddress'] ?? l.ocrText ?? 'No Address';
    final confidence = l.ocrConfidence ?? 100.0;
    final status = l.status;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      l.recipientName ?? 'Recipient',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFC1272D).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      beat,
                      style: const TextStyle(color: Color(0xFFC1272D), fontWeight: FontWeight.bold, fontSize: 12),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text('Address:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey)),
              Text(addr, style: const TextStyle(fontSize: 14)),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Status:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey)),
                      Text(status.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text('OCR Confidence:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey)),
                      Text(confidence.toStringAsFixed(1) + '%', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  void _showAssignBeatDialog(Letter letter) {
    showDialog(
      context: context,
      builder: (context) {
        String rawBeat = _safeGetBeatNumber(letter.beatId);
        String currentBeat = 'Beat 101';
        if (rawBeat.contains('Beat 102')) currentBeat = 'Beat 102';
        if (rawBeat.contains('Beat 201')) currentBeat = 'Beat 201';

        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Assign Letter to Beat'),
              content: DropdownButtonFormField<String>(
                value: currentBeat,
                items: const [
                  DropdownMenuItem(value: 'Beat 101', child: Text('Beat 101 (Begumpet)')),
                  DropdownMenuItem(value: 'Beat 102', child: Text('Beat 102 (Khairatabad)')),
                  DropdownMenuItem(value: 'Beat 201', child: Text('Beat 201 (Madhapur)')),
                ],
                onChanged: (val) {
                  if (val != null) {
                    setDialogState(() {
                      currentBeat = val;
                    });
                  }
                },
                decoration: const InputDecoration(labelText: 'Select Beat', border: OutlineInputBorder()),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    bool success = await widget.state.assignLetterToBeat(letter.id, currentBeat);
                    if (!mounted) return;
                    Navigator.pop(context);
                    if (success) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Reassigned to ' + currentBeat)),
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFC1272D), foregroundColor: Colors.white),
                  child: const Text('Assign'),
                )
              ],
            );
          },
        );
      },
    );
  }

  List<Marker> _buildBeatMarkers() {
    return widget.state.letters.map((l) {
      final coords = l.coordinates ?? {'lat': 17.44, 'lng': 78.47};
      
      String colorHex = '#C1272D';
      final dynamic beatData = l.beatId; 
      if (beatData is Map) {
        colorHex = beatData['colorHex'] ?? '#C1272D';
      }
      
      Color markerColor;
      try {
        markerColor = Color(int.parse(colorHex.replaceFirst('#', '0xFF')));
      } catch (e) {
        markerColor = const Color(0xFFC1272D);
      }

      return Marker(
        point: LatLng(coords['lat'], coords['lng']),
        width: 40,
        height: 40,
        child: GestureDetector(
          onTap: () {
            _showDeliveryInfo(l);
          },
          child: Icon(
            Icons.location_on,
            color: markerColor,
            size: 32,
          ),
        ),
      );
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final Map<String, List<Letter>> grouped = {};
    for (var l in widget.state.letters) {
      final beat = _safeGetBeatNumber(l.beatId);
      grouped.putIfAbsent(beat, () => []).add(l);
    }

    final lowConfidenceLetters = widget.state.letters.where((l) {
      return l.lowConfidence == true; 
    }).toList();

    final totalLetters101 = widget.state.letters.where((l) => _safeGetBeatNumber(l.beatId) == 'Beat 101').toList();
    final delivered101 = totalLetters101.where((l) => l.status == 'delivered').length;
    final pending101 = totalLetters101.length - delivered101;
    
    final totalLetters102 = widget.state.letters.where((l) => _safeGetBeatNumber(l.beatId) == 'Beat 102').toList();
    final delivered102 = totalLetters102.where((l) => l.status == 'delivered').length;
    final pending102 = totalLetters102.length - delivered102;

    final totalLetters201 = widget.state.letters.where((l) => _safeGetBeatNumber(l.beatId) == 'Beat 201').toList();
    final delivered201 = totalLetters201.where((l) => l.status == 'delivered').length;
    final pending201 = totalLetters201.length - delivered201;

    final totalLetters = widget.state.letters.length;
    final totalDelivered = widget.state.letters.where((l) => l.status == 'delivered').length;
    final totalAssigned = widget.state.letters.where((l) => l.status != 'pending').length;
    final totalOutForDelivery = widget.state.letters.where((l) => l.status == 'out_for_delivery').length;

    return Scaffold(
      body: Column(
        children: [
          GovHeader(state: widget.state),
          Expanded(
            child: SingleChildScrollView(
              controller: _scrollController, 
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.qr_code_scanner, color: Color(0xFFC1272D), size: 18),
                              const SizedBox(width: 8),
                              Text(t(context, 'scan_letter'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: _pickLabelImage,
                                  icon: const Icon(Icons.photo_library, size: 16),
                                  label: Text(t(context, 'select_photo'), style: const TextStyle(fontSize: 11)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.white,
                                    foregroundColor: const Color(0xFFC1272D),
                                    side: const BorderSide(color: Color(0xFFC1272D)),
                                    padding: const EdgeInsets.symmetric(vertical: 10),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: _runLivePipeline,
                                  icon: const Icon(Icons.document_scanner, size: 16),
                                  label: Text(t(context, 'ocr_scan'), style: const TextStyle(fontSize: 11)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFFC1272D),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 10),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          ElevatedButton.icon(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (context) => BatchScanScreen(state: widget.state)),
                              );
                            },
                            icon: const Icon(Icons.library_books, size: 16),
                            label: Text(t(context, 'batch_scan'), style: const TextStyle(fontSize: 12)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFFFC72C),
                              foregroundColor: Colors.black,
                              minimumSize: const Size(double.infinity, 40),
                            ),
                          ),
                          const SizedBox(height: 16),
                          const Text('OCR Processing Pipeline', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey)),
                          const SizedBox(height: 8),
                          _buildPipelineStep(0, t(context, 'pipeline_scanning'), Icons.document_scanner),
                          _buildPipelineStep(1, t(context, 'pipeline_ocr'), Icons.text_fields),
                          _buildPipelineStep(2, t(context, 'pipeline_ai'), Icons.psychology),
                          _buildPipelineStep(3, t(context, 'pipeline_beat'), Icons.map),
                          _buildPipelineStep(4, t(context, 'pipeline_batch'), Icons.delivery_dining),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  if (_activePipelineStep == 5) ...[
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('AI Address Corrections & Comparer', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Icon(
                                  _ocrConfidence < 70 ? Icons.error_outline : Icons.check_circle_outline,
                                  color: _ocrConfidence < 70 ? Colors.red : Colors.green,
                                  size: 16,
                                ),
                                const SizedBox(width: 6),
                                Text('OCR Character Scan Accuracy: ' + _ocrConfidence.toStringAsFixed(1) + '%'),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: _ocrOutputController,
                                    maxLines: 3,
                                    decoration: const InputDecoration(labelText: 'Raw OCR Output', border: OutlineInputBorder()),
                                    readOnly: true,
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: TextField(
                                    controller: _aiCorrectedController,
                                    maxLines: 3,
                                    decoration: const InputDecoration(labelText: 'AI Corrected Address', border: OutlineInputBorder()),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: _saveVerifiedLetter,
                              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFC1272D), foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 44)),
                              child: Text(t(context, 'save')),
                            )
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  if (lowConfidenceLetters.isNotEmpty) ...[
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                      child: Row(
                        children: [
                          Icon(Icons.warning_amber_rounded, color: Color(0xFFB45309), size: 18),
                          SizedBox(width: 8),
                          Text('Low Confidence Letters', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        ],
                      ),
                    ),
                    ...lowConfidenceLetters.map((l) {
                      final confidence = l.ocrConfidence ?? 100.0;
                      final addr = l.address?['fullAddress'] ?? l.ocrText ?? 'No Address';
                      return Card(
                        color: const Color(0xFFFFFBEB),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                          side: const BorderSide(color: Color(0xFFFDE68A), width: 1),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      l.recipientName ?? 'No Recipient Name',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFB45309).withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      confidence.toStringAsFixed(1) + '%',
                                      style: const TextStyle(color: Color(0xFFB45309), fontWeight: FontWeight.bold, fontSize: 11),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              const Text('Parsed Address:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.grey)),
                              Text(addr, style: const TextStyle(fontSize: 12)),
                              const SizedBox(height: 4),
                              const Text('Raw OCR Text:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Colors.grey)),
                              Text(l.ocrText ?? l.recipientName ?? 'No Raw OCR Text', style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Colors.black54)),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  TextButton(
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(builder: (context) => OcrReviewScreen(letter: l, state: widget.state)),
                                      ).then((_) {
                                        if (mounted) setState(() {});
                                      });
                                    },
                                    child: const Text('Review / Correct', style: TextStyle(color: Color(0xFFC1272D), fontSize: 11)),
                                  ),
                                  const SizedBox(width: 8),
                                  ElevatedButton(
                                    onPressed: () {
                                      _showAssignBeatDialog(l);
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFFFFC72C),
                                      foregroundColor: Colors.black,
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      minimumSize: Size.zero,
                                    ),
                                    child: const Text('Assign to Beat', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              )
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                    const SizedBox(height: 16),
                  ],

                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                    child: Row(
                      children: [
                        Icon(Icons.filter_hdr_outlined, color: Color(0xFFC1272D), size: 18),
                        SizedBox(width: 8),
                        Text('Beat Wise Segregation', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      ],
                    ),
                  ),
                  _buildBeatCard('Beat 101', 'Ramesh Kumar', totalLetters101.length, delivered101, pending101, const Color(0xFFC1272D)),
                  const SizedBox(height: 8),
                  _buildBeatCard('Beat 102', 'Suresh Kumar', totalLetters102.length, delivered102, pending102, const Color(0xFF10B981)),
                  const SizedBox(height: 8),
                  _buildBeatCard('Beat 201', 'Mahesh Kumar', totalLetters201.length, delivered201, pending201, const Color(0xFFFFC72C)),
                  const SizedBox(height: 16),

                  // 🔥 Dynamic Dropdown Panel to show Today's Letters & Addresses
                  if (_isTodayBatchDropdownOpen && _selectedActiveBeatForBatch != null) ...[
                    Builder(
                      builder: (context) {
                        // Filter the list of letters matching the selected beat sector zone
                        final targetLetters = widget.state.letters.where((l) => 
                          _safeGetBeatNumber(l.beatId) == _selectedActiveBeatForBatch
                        ).toList();

                        return Card(
                          key: _dropdownCardKey, // ✅ FIX: Added the exact dropdown card tracking anchor target key
                          color: const Color(0xFFF8FAFC),
                          margin: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 2.0),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: Colors.grey[300]!, width: 1),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'Today\'s Batch: $_selectedActiveBeatForBatch Letters',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blueGrey),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.close, size: 16, color: Colors.grey),
                                      onPressed: () => setState(() => _isTodayBatchDropdownOpen = false),
                                    )
                                  ],
                                ),
                                const Divider(height: 16),
                                if (targetLetters.isEmpty)
                                  const Padding(
                                    padding: EdgeInsets.symmetric(vertical: 12.0),
                                    child: Text(
                                      'No letters found inside this beat sector today.', 
                                      style: TextStyle(fontSize: 12, color: Colors.grey, fontStyle: FontStyle.italic),
                                    ),
                                  )
                                else
                                  ListView.separated(
                                    shrinkWrap: true,
                                    physics: const NeverScrollableScrollPhysics(),
                                    itemCount: targetLetters.length,
                                    separatorBuilder: (context, index) => Divider(color: Colors.grey[200]),
                                    itemBuilder: (context, index) {
                                      final item = targetLetters[index];
                                      final fullAddr = item.address?['fullAddress'] ?? item.ocrText ?? 'No Address Details';
                                      return Padding(
                                        padding: const EdgeInsets.symmetric(vertical: 6.0),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                const Icon(Icons.person_pin, size: 16, color: Color(0xFFC1272D)),
                                                const SizedBox(width: 6),
                                                Text(
                                                  item.recipientName ?? 'Unknown Recipient',
                                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87),
                                                ),
                                                const Spacer(),
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color: item.status == 'delivered' ? Colors.green[50] : Colors.blue[50],
                                                    borderRadius: BorderRadius.circular(4),
                                                  ),
                                                  child: Text(
                                                    item.status.toUpperCase(),
                                                    style: TextStyle(
                                                      color: item.status == 'delivered' ? Colors.green[700] : Colors.blue[700], 
                                                      fontWeight: FontWeight.bold, 
                                                      fontSize: 9,
                                                    ),
                                                  ),
                                                )
                                              ],
                                            ),
                                            const SizedBox(height: 4),
                                            Padding(
                                              padding: const EdgeInsets.only(left: 22.0),
                                              child: Text(
                                                'Address: $fullAddr',
                                                style: TextStyle(fontSize: 12, color: Colors.grey[700], height: 1.3),
                                              ),
                                            ),
                                          ],
                                        ),
                                      );
                                    },
                                  ),
                              ],
                            ),
                          ),
                        );
                      }
                    ),
                    const SizedBox(height: 8),
                  ],
                  Padding(
                    key: _batchTargetKey, 
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                    child: const Row(
                      children: [
                        Icon(Icons.storage, color: Color(0xFFC1272D), size: 18),
                        SizedBox(width: 8),
                        Text('Database Overview', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      ],
                    ),
                  ),
                  _buildBatchCard(
                    "Today's Batch",
                    received: totalLetters,
                    ocr: totalLetters,
                    assigned: totalAssigned,
                    outForDelivery: totalOutForDelivery,
                    delivered: totalDelivered,
                  ),
                  const SizedBox(height: 8),
                  _buildBatchCard(
                    "Yesterday's Batch",
                    received: 45,
                    ocr: 45,
                    assigned: 45,
                    outForDelivery: 0,
                    delivered: 43,
                  ),
                  const SizedBox(height: 8),
                  _buildBatchCard(
                    "Previous Batch",
                    received: 38,
                    ocr: 38,
                    assigned: 38,
                    outForDelivery: 0,
                    delivered: 38,
                  ),
                  const SizedBox(height: 16),

                  Card(
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Row(
                            children: [
                              const Icon(Icons.map, color: Color(0xFFC1272D), size: 18),
                              const SizedBox(width: 8),
                              Text(t(context, 'leaflet_map'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            ],
                          ),
                        ),
                        SizedBox(
                          height: 320,
                          child: FlutterMap(
                            key: const ValueKey('office_dashboard_map'),
                            mapController: _mapController,
                            options: MapOptions(
                              initialCenter: const LatLng(17.4448, 78.4728),
                              initialZoom: 13.0,
                              onMapReady: () {
                                _fitBounds();
                              },
                            ),
                            children: [
                              TileLayer(
                                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                userAgentPackageName: 'com.example.postscan',
                              ),
                              MarkerLayer(
                                markers: _buildBeatMarkers(),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPipelineStep(int index, String label, IconData icon) {
    bool isCompleted = _activePipelineStep > index;
    bool isCurrent = _activePipelineStep == index;
    Color iconColor = isCompleted ? Colors.green : isCurrent ? const Color(0xFFC1272D) : Colors.grey;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Icon(icon, color: iconColor, size: 20),
          const SizedBox(width: 12),
          Text(
            label,
            style: TextStyle(
              fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
              color: isCurrent ? const Color(0xFFC1272D) : Colors.black,
            ),
          ),
          const Spacer(),
          if (isCompleted) const Icon(Icons.check_circle, color: Colors.green, size: 16),
          if (isCurrent) const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2)),
        ],
      ),
    );
  }

  Widget _buildBeatCard(String beatNumber, String postmanName, int total, int delivered, int pending, Color accentColor) {
    bool isSelected = _selectedBeat == beatNumber;
    return Card(
      elevation: isSelected ? 3 : 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(color: isSelected ? accentColor : const Color(0xFFE2E8F0), width: isSelected ? 2 : 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start, 
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(color: accentColor, shape: BoxShape.circle),
                    ),
                    const SizedBox(width: 8),
                    Text(beatNumber, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  ],
                ),
                Text(
                  'Postman: ' + postmanName,
                  style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w500),
                ),
              ],
            ),
            const Divider(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildBeatStat(t(context, 'assigned'), total.toString(), Colors.blue),
                _buildBeatStat(t(context, 'delivered'), delivered.toString(), Colors.green),
                _buildBeatStat(t(context, 'pending'), pending.toString(), Colors.orange),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.end, 
              children: [
                ElevatedButton.icon(
                  onPressed: () {
                    setState(() {
                      _selectedBeat = beatNumber;
                    });
                    _fitBeatBounds(beatNumber);
                  },
                  icon: const Icon(Icons.center_focus_strong, size: 12),
                  label: const Text('Focus Map', style: TextStyle(fontSize: 11)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: accentColor,
                    side: BorderSide(color: accentColor),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    minimumSize: Size.zero,
                  ),
                ),
                
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  onPressed: () {
                    setState(() {
                      if (_selectedActiveBeatForBatch == beatNumber) {
                        _isTodayBatchDropdownOpen = !_isTodayBatchDropdownOpen;
                      } else {
                        _selectedActiveBeatForBatch = beatNumber;
                        _isTodayBatchDropdownOpen = true;
                      }
                    });

                    // ✅ FIXED: Changes scroll target window from Overview container down directly to the open card anchor top bounds!
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      final targetContext = _dropdownCardKey.currentContext;
                      if (targetContext != null) {
                        Scrollable.ensureVisible(
                          targetContext,
                          alignment: 0.0,
                          duration: const Duration(milliseconds: 500),
                          curve: Curves.easeInOut,
                        );
                      }
                    });
                  },
                  icon: Icon(
                    _isTodayBatchDropdownOpen && _selectedActiveBeatForBatch == beatNumber
                        ? Icons.arrow_drop_up
                        : Icons.arrow_downward,
                    size: 12,
                  ),
                  label: const Text('View Today\'s Batch', style: TextStyle(fontSize: 11)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.blueGrey[700],
                    side: BorderSide(color: Colors.blueGrey[200]!),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    minimumSize: Size.zero,
                  ),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildBeatStat(String label, String val, Color color) {
    return Column(
      children: [
        Text(val, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: color)),
        Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
      ],
    );
  }

  Widget _buildBatchCard(String title, {required int received, required int ocr, required int assigned, required int outForDelivery, required int delivered}) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: _buildMiniStat(t(context, 'received'), received.toString())),
                Expanded(child: _buildMiniStat(t(context, 'ocr_done'), ocr.toString())),
                Expanded(child: _buildMiniStat(t(context, 'assigned'), assigned.toString())),
                Expanded(child: _buildMiniStat(t(context, 'out_for_del'), outForDelivery.toString())),
                Expanded(child: _buildMiniStat(t(context, 'delivered'), delivered.toString())),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMiniStat(String label, String val) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(val, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFFC1272D))),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(fontSize: 8, color: Colors.grey),
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }
}