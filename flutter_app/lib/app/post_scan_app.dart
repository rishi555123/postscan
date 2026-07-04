import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import '../state/app_state.dart';
import '../localization/app_localizations.dart';
import '../widgets/common_widgets.dart';
import '../screens/login/splash_screen.dart';
import '../screens/admin/admin_dashboard_screen.dart';
import '../screens/office/office_dashboard_screen.dart';
import '../screens/postman/postman_dashboard_screen.dart';

class PostScanApp extends StatefulWidget {
  const PostScanApp({super.key});

  @override
  State<PostScanApp> createState() => _PostScanAppState();
}

class _PostScanAppState extends State<PostScanApp> {
  late AppState _state;

  @override
  void initState() {
    super.initState();
    _state = AppState();
    _state.addListener(() {
      if (mounted) setState(() {});
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PostScan',
      debugShowCheckedModeBanner: false,
      locale: _state.currentLocale,
      supportedLocales: const [
        Locale('en'),
        Locale('te'),
        Locale('hi'),
        Locale('ta'),
        Locale('kn'),
        Locale('ml'),
        Locale('mr'),
      ],
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFC1272D),
          primary: const Color(0xFFC1272D),
          secondary: const Color(0xFFFFC72C),
          background: const Color(0xFFF4F5F8),
        ),
        textTheme: GoogleFonts.robotoTextTheme(),
        cardTheme: CardThemeData(
          color: Colors.white,
          surfaceTintColor: Colors.white,
          elevation: 1,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
            side: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
        ),
      ),
      builder: (context, child) {
        return MobileFrame(child: child!);
      },
      home: _state.isAuthenticated 
        ? _buildDashboard() 
        : const SplashScreen(),
    );
  }

  Widget _buildDashboard() {
    switch (_state.currentRole) {
      case 'admin':
        return AdminDashboardScreen(state: _state);
      case 'office_staff':
        return OfficeDashboardScreen(state: _state);
      case 'postman':
      default:
        return PostmanDashboardScreen(state: _state);
    }
  }
}