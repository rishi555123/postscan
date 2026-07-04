import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../widgets/common_widgets.dart';
import '../../state/app_state.dart';
import '../../models/letter.dart';

class PostmanDashboardScreen extends StatefulWidget {
  final AppState state;
  const PostmanDashboardScreen({super.key, required this.state});

  @override
  State<PostmanDashboardScreen> createState() => _PostmanDashboardScreenState();
}

class _PostmanDashboardScreenState extends State<PostmanDashboardScreen> {
  final MapController _mapController = MapController();
  double _zoomLevel = 14.0;

  void _launchGoogleMaps(double lat, double lng) async {
    final Uri url = Uri.parse(
      "https://www.google.com/maps/dir/?api=1&destination=$lat,$lng",
    );

    if (await canLaunchUrl(url)) {
      await launchUrl(
        url,
        mode: LaunchMode.externalApplication,
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Could not open Google Maps"),
        ),
      );
    }
  }

  void _showStopDetails(Letter stop) {
    final addr = stop.address?['fullAddress'] ?? stop.ocrText ?? 'No Address';
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
              Text(
                stop.recipientName ?? 'Recipient',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(height: 8),
              Text(addr),
              const SizedBox(height: 12),
              Text(
                'Status: ${stop.status.toUpperCase()}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  _showStatusSheet(stop.id);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFC1272D),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 44),
                ),
                child: const Text('Update Delivery Status'),
              ),
            ],
          ),
        );
      },
    );
  }

  List<Marker> _buildClusteredMarkers(List<Letter> stops) {
    List<Marker> markers = [];

    markers.add(
      Marker(
        point: LatLng(widget.state.currentLocation['lat'], widget.state.currentLocation['lng']),
        width: 40,
        height: 40,
        child: const Icon(Icons.circle, color: Colors.blue, size: 18),
      ),
    );

    debugPrint("Total Beats: ${widget.state.beats.length}");
    for (var beat in widget.state.beats) {
      debugPrint("Beat: $beat");
      final coords = beat.coordinates;
      if (coords == null) continue;

      Color beatColor;
      try {
        beatColor = Color(
          int.parse((beat.colorHex ?? '#C1272D').replaceFirst('#', '0xFF')),
        );
      } catch (_) {
        beatColor = const Color(0xFFC1272D);
      }

      markers.add(
        Marker(
          point: LatLng(coords['lat'], coords['lng']),
          width: 36,
          height: 36,
          child: Icon(
            Icons.flag,
            color: beatColor,
            size: 28,
          ),
        ),
      );
    }

    for (var stop in stops) {
      final coords = stop.coordinates ?? {'lat': 17.44, 'lng': 78.47};
      final colorHex = stop.beatId?['colorHex'] ?? '#C1272D';
      final isDelivered = stop.status == 'delivered';

      Color pinColor;
      if (isDelivered) {
        pinColor = Colors.green;
      } else {
        try {
          pinColor = Color(int.parse(colorHex.replaceFirst('#', '0xFF')));
        } catch (e) {
          pinColor = const Color(0xFFC1272D);
        }
      }

      markers.add(
        Marker(
          point: LatLng(coords['lat'], coords['lng']),
          width: 40,
          height: 40,
          child: GestureDetector(
            onTap: () {
              _showStopDetails(stop);
            },
            child: Icon(
              Icons.location_on,
              color: pinColor,
              size: 32,
            ),
          ),
        ),
      );
    }
    return markers;
  }

  List<LatLng> _buildRoutePoints(List<Letter> stops) {
    List<LatLng> points = [];
    points.add(LatLng(widget.state.dispatchHub['lat'], widget.state.dispatchHub['lng']));
    
    for (var stop in stops) {
      final coords = stop.coordinates ?? {'lat': 17.44, 'lng': 78.47};
      points.add(LatLng(coords['lat'], coords['lng']));
    }
    return points;
  }

  void _fitMarkersBounds() {
    if (widget.state.letters.isEmpty) return;
    
    double minLat = widget.state.currentLocation['lat'];
    double maxLat = widget.state.currentLocation['lat'];
    double minLng = widget.state.currentLocation['lng'];
    double maxLng = widget.state.currentLocation['lng'];

    for (var stop in widget.state.letters) {
      final coords = stop.coordinates ?? {'lat': 17.44, 'lng': 78.47};
      minLat = min(minLat, coords['lat']);
      maxLat = max(maxLat, coords['lat']);
      minLng = min(minLng, coords['lng']);
      maxLng = max(maxLng, coords['lng']);
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

  @override
  Widget build(BuildContext context) {
    final activeStops = widget.state.letters.where((l) => l.status != 'delivered' && l.status != 'returned_to_office').toList();

    return Scaffold(
      body: Column(
        children: [
          GovHeader(state: widget.state),
          Expanded(
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  color: Colors.white,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            widget.state.isOffline ? Icons.cloud_off : Icons.cloud_done,
                            color: widget.state.isOffline ? Colors.red : Colors.green,
                            size: 18,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            widget.state.isOffline ? 'OFFLINE (SQLite/Hive Cache)' : 'ONLINE (Server synced)',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                        ],
                      ),
                      Switch(
                        value: widget.state.isOffline,
                        onChanged: (val) {
                          widget.state.toggleOffline(val);
                        },
                      )
                    ],
                  ),
                ),

                if (widget.state.isSyncing)
                  Container(
                    color: const Color(0xFFFFC72C).withOpacity(0.2),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    width: double.infinity,
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)),
                        SizedBox(width: 10),
                        Text('Uploading local offline cached changes online...', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),

                Expanded(
                  flex: 3,
                  child: Stack(
                    children: [
                      FlutterMap(
                        mapController: _mapController,
                        options: MapOptions(
                          initialCenter: LatLng(widget.state.currentLocation['lat'], widget.state.currentLocation['lng']),
                          initialZoom: _zoomLevel,
                          onMapReady: () {
                            _fitMarkersBounds();
                          },
                          onPositionChanged: (position, hasGesture) {
                            if (position.zoom != null) {
                              _zoomLevel = position.zoom!;
                            }
                          },
                        ),
                        children: [
                          TileLayer(
                            urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                            userAgentPackageName: 'com.example.postscan',
                          ),
                          PolylineLayer(
                            polylines: [
                              Polyline(
                                points: _buildRoutePoints(widget.state.letters),
                                color: const Color(0xFFC1272D),
                                strokeWidth: 4.0,
                              ),
                            ],
                          ),
                          MarkerLayer(
                            markers: _buildClusteredMarkers(widget.state.letters),
                          ),
                        ],
                      ),
                      Positioned(
                        top: 10,
                        right: 10,
                        child: FloatingActionButton.small(
                          onPressed: _fitMarkersBounds,
                          backgroundColor: Colors.white,
                          child: const Icon(Icons.gps_fixed, color: Color(0xFFC1272D)),
                        ),
                      ),
                      Positioned(
                        bottom: 10,
                        left: 10,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          color: Colors.white.withOpacity(0.9),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text('Remaining Dist: ${widget.state.remainingDistance.toStringAsFixed(2)} km', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                              Text('ETA: ${widget.state.estimatedArrival}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                            ],
                          ),
                        ),
                      )
                    ],
                  ),
                ),

                Expanded(
                  flex: 2,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: activeStops.length,
                    itemBuilder: (context, index) {
                      final stop = activeStops[index];
                      final isCached = stop.cachedLocal == true;
                      final addr = stop.address?['fullAddress'] ?? stop.ocrText ?? 'No Address';

                      return Card(
                        child: Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'STOP ${index + 1}: ${stop.recipientName ?? 'No Recipient'}',
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                  if (isCached)
                                    const Text('Cached Offline', style: TextStyle(color: Colors.amber, fontSize: 10, fontWeight: FontWeight.bold)),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(addr, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Expanded(
                                    child: ElevatedButton.icon(
                                      onPressed: () {
                                        final coords = stop.coordinates ?? {'lat': 17.44, 'lng': 78.47};
                                        _launchGoogleMaps(coords['lat'], coords['lng']);
                                      },
                                      icon: const Icon(Icons.navigation, size: 14),
                                      label: FittedBox(
                                        fit: BoxFit.scaleDown,
                                        child: Text(t(context, 'nav_maps')),
                                      ),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFFFFC72C),
                                        foregroundColor: Colors.black,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: ElevatedButton(
                                      onPressed: () => _showStatusSheet(stop.id),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFFC1272D),
                                        foregroundColor: Colors.white,
                                      ),
                                      child: FittedBox(
                                        fit: BoxFit.scaleDown,
                                        child: Text(t(context, 'update_status')),
                                      ),
                                    ),
                                  ),
                                ],
                              )
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                )
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showStatusSheet(String id) {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(t(context, 'update_status'), style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ListTile(
                title: Text(t(context, 'delivered')),
                onTap: () {
                  widget.state.updateDeliveryStatus(id, 'delivered');
                  Navigator.pop(context);
                },
              ),
              ListTile(
                title: Text(t(context, 'house_locked')),
                onTap: () {
                  widget.state.updateDeliveryStatus(id, 'house_locked');
                  Navigator.pop(context);
                },
              ),
              ListTile(
                title: Text(t(context, 'address_not_found')),
                onTap: () {
                  widget.state.updateDeliveryStatus(id, 'address_not_found');
                  Navigator.pop(context);
                },
              ),
              ListTile(
                title: Text(t(context, 'shifted')),
                onTap: () {
                  widget.state.updateDeliveryStatus(id, 'shifted');
                  Navigator.pop(context);
                },
              )
            ],
          ),
        );
      },
    );
  }
}