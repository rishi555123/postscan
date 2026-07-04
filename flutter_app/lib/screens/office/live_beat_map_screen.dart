import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../widgets/common_widgets.dart';
import '../../state/app_state.dart';

class LiveBeatMapScreen extends StatefulWidget {
  final AppState state;
  const LiveBeatMapScreen({super.key, required this.state});

  @override
  State<LiveBeatMapScreen> createState() => _LiveBeatMapScreenState();
}

class _LiveBeatMapScreenState extends State<LiveBeatMapScreen> {
  final MapController _mapController = MapController();

  void _fitBounds() {
    if (widget.state.letters.isEmpty) return;

    double minLat = 90.0;
    double maxLat = -90.0;
    double minLng = 180.0;
    double maxLng = -180.0;

    for (var l in widget.state.letters) {
      final coords = l['coordinates'] ?? {'lat': 17.44, 'lng': 78.47};
      final double lat = coords['lat'];
      final double lng = coords['lng'];
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }

    _mapController.fitBounds(
      LatLngBounds(
        LatLng(minLat - 0.005, minLng - 0.005),
        LatLng(maxLat + 0.005, maxLng + 0.005),
      ),
      options: const FitBoundsOptions(
        padding: EdgeInsets.all(24),
      ),
    );
  }

  void _showDeliveryInfo(Map<String, dynamic> l) {
    final beat = l['beatId']?['beatNumber'] ?? 'Unassigned';
    final addr = l['address']?['fullAddress'] ?? l['fullAddress'] ?? 'No Address';
    final confidence = l['ocrConfidence'] ?? 100.0;
    final status = l['status'] ?? 'pending';

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
                      l['recipientName'] ?? 'Recipient',
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
                      Text(status.toString().toUpperCase(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text('OCR Confidence:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey)),
                      Text('${confidence.toStringAsFixed(1)}%', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
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

  List<Marker> _buildBeatMarkers() {
    return widget.state.letters.map((l) {
      final coords = l['coordinates'] ?? {'lat': 17.44, 'lng': 78.47};
      final colorHex = l['beatId']?['colorHex'] ?? '#C1272D';
      
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
    final markers = _buildBeatMarkers();
    return Scaffold(
      body: Column(
        children: [
          GovHeader(
            state: widget.state,
            titleOverride: t(context, 'route_map'),
            showBackButton: true,
          ),
          Expanded(
            child: FlutterMap(
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
                  markers: markers,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}