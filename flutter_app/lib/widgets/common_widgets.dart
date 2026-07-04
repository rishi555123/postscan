import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../state/app_state.dart';
import '../localization/app_localizations.dart';
import '../app/post_scan_app.dart';
import '../screens/settings/settings_page.dart';

Widget buildFlagBar() {
  return Row(
    children: [
      Expanded(child: Container(height: 4, color: const Color(0xFFFF9933))),
      Expanded(child: Container(height: 4, color: const Color(0xFFFFFFFF))),
      Expanded(child: Container(height: 4, color: const Color(0xFF138808))),
    ],
  );
}

class FlagAppBar extends StatelessWidget implements PreferredSizeWidget {
  final PreferredSizeWidget appBar;
  const FlagAppBar({super.key, required this.appBar});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        buildFlagBar(),
        Expanded(child: appBar),
      ],
    );
  }

  @override
  Size get preferredSize => Size.fromHeight(appBar.preferredSize.height + 4);
}

class MobileFrame extends StatelessWidget {
  final Widget child;
  const MobileFrame({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final bool isWideScreen = constraints.maxWidth > 430;
        if (isWideScreen) {
          const double frameWidth = 420;
          return Material(
            color: const Color(0xFFF1F5F9),
            child: Align(
              alignment: Alignment.center,
              child: Container(
                width: frameWidth,
                margin: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: MediaQuery(
                    data: MediaQuery.of(context).copyWith(
                      size: Size(frameWidth, constraints.maxHeight - 32),
                    ),
                    child: child,
                  ),
                ),
              ),
            ),
          );
        } else {
          return child;
        }
      },
    );
  }
}

class GovHeader extends StatelessWidget {
  final AppState state;
  final String? titleOverride;
  final String? subtitleOverride;
  final bool showBackButton;
  final bool showSettingsButton;

  const GovHeader({
    super.key,
    required this.state,
    this.titleOverride,
    this.subtitleOverride,
    this.showBackButton = false,
    this.showSettingsButton = true,
  });

  @override
  Widget build(BuildContext context) {
    final double statusBarHeight = MediaQuery.of(context).padding.top;
    final double topPadding = statusBarHeight > 0 ? statusBarHeight + 8 : 16.0;

    String title = titleOverride ?? '';
    if (title.isEmpty) {
      if (state.currentRole == 'admin') {
        title = '${t(context, 'admin')} Portal';
      } else if (state.currentRole == 'office_staff') {
        title = '${t(context, 'office_staff')} Portal';
      } else {
        title = '${t(context, 'postman')} Portal';
      }
    }

    String subtitle = subtitleOverride ?? '';
    if (subtitle.isEmpty) {
      final String name = state.currentUser?.name ??
          (state.currentRole == 'admin'
              ? 'Admin Controller'
              : state.currentRole == 'office_staff'
                  ? 'Radhika Sen'
                  : 'Ramesh Kumar');
      String roleLabel = '';
      if (state.currentRole == 'admin') {
        roleLabel = t(context, 'admin');
      } else if (state.currentRole == 'office_staff') {
        roleLabel = t(context, 'office_staff');
      } else {
        roleLabel = t(context, 'postman');
      }
      String cleanName = name.replaceAll(RegExp(r'\s*\(.*?\)'), '');
      subtitle = '$cleanName ($roleLabel)';
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        buildFlagBar(),
        Container(
          color: const Color(0xFFC1272D),
          padding: EdgeInsets.fromLTRB(16, topPadding, 16, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  if (showBackButton)
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  if (showBackButton) const SizedBox(width: 8),
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 1),
                    ),
                    child: ClipOval(
                      child: Image.asset(
                        'assets/locales/logo.jpg',
                        width: 32,
                        height: 32,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          title,
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          subtitle,
                          style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFFFFC72C),
                            fontWeight: FontWeight.bold,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: () async {
                      await state.logout();
                      if (context.mounted) {
                        Navigator.pushAndRemoveUntil(
                          context,
                          MaterialPageRoute(builder: (context) => const PostScanApp()),
                          (route) => false,
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFFC72C),
                      foregroundColor: const Color(0xFF1E293B),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(4),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      t(context, 'logout'),
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Container(
                height: 1,
                color: Colors.white.withOpacity(0.15),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.language,
                        color: Colors.white70,
                        size: 16,
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xCC0F172A),
                          border: Border.all(color: Colors.white24),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Theme(
                          data: Theme.of(context).copyWith(
                            canvasColor: const Color(0xFF1E293B),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: state.currentLocale.languageCode,
                              dropdownColor: const Color(0xFF1E293B),
                              icon: const Padding(
                                padding: EdgeInsets.only(left: 4.0),
                                child: Icon(
                                  Icons.keyboard_arrow_down,
                                  color: Colors.white,
                                  size: 14,
                                ),
                              ),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                              onChanged: (val) {
                                if (val != null) {
                                  state.changeLanguage(val);
                                }
                              },
                              items: const [
                                DropdownMenuItem(value: 'en', child: Text('English')),
                                DropdownMenuItem(value: 'te', child: Text('తెలుగు (Telugu)')),
                                DropdownMenuItem(value: 'hi', child: Text('हिन्दी (Hindi)')),
                                DropdownMenuItem(value: 'ta', child: Text('தமிழ் (Tamil)')),
                                DropdownMenuItem(value: 'kn', child: Text('ಕನ್ನಡ (Kannada)')),
                                DropdownMenuItem(value: 'ml', child: Text('മലയാളം (Malayalam)')),
                                DropdownMenuItem(value: 'mr', child: Text('मराठी (Marathi)')),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (showSettingsButton)
                    IconButton(
                      icon: const Icon(
                        Icons.settings,
                        color: Colors.white70,
                        size: 20,
                      ),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => SettingsPage(state: state)),
                        );
                      },
                    )
                  else
                    const SizedBox(height: 20),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

String t(BuildContext context, String key) {
  return AppLocalizations.of(context)?.translate(key) ?? key;
}