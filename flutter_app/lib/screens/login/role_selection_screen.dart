import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../widgets/common_widgets.dart';
import 'login_screen.dart';

class RoleSelectionScreen extends StatelessWidget {
  const RoleSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F5F8),
      body: Column(
        children: [
          buildFlagBar(),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.only(top: 60, bottom: 20, left: 16, right: 16),
            color: const Color(0xFFC1272D),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ClipOval(
                  child: Image.asset('assets/locales/logo.jpg', width: 44, height: 44, fit: BoxFit.cover),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'POSTSCAN',
                      style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'DEPARTMENT OF POSTS • GOVT OF INDIA',
                      style: TextStyle(fontSize: 9, color: Color(0xFFFFC72C), fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    t(context, 'select_role'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    t(context, 'select_role_sub'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 30),
                  _buildCard(
                    context,
                    title: t(context, 'office_staff'),
                    desc: 'Scan letters, manage ocr and batch assignments',
                    icon: Icons.business_center,
                    color: const Color(0xFFC1272D),
                    role: 'office_staff',
                  ),
                  const SizedBox(height: 16),
                  _buildCard(
                    context,
                    title: t(context, 'postman'),
                    desc: 'Route coordinates sequencing and offline updates',
                    icon: Icons.pedal_bike,
                    color: const Color(0xFFFFC72C),
                    role: 'postman',
                  ),
                  const SizedBox(height: 16),
                  _buildCard(
                    context,
                    title: t(context, 'admin'),
                    desc: 'Manage beats, users, offices, and view aggregated KPIs',
                    icon: Icons.admin_panel_settings,
                    color: Colors.purple,
                    role: 'admin',
                  ),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildCard(
    BuildContext context, {
    required String title,
    required String desc,
    required IconData icon,
    required Color color,
    required String role,
  }) {
    return Card(
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => LoginScreen(role: role)),
          );
        },
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Icon(icon, size: 36, color: color),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 4),
                    Text(desc, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}