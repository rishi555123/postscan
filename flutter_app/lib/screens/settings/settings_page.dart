import 'package:flutter/material.dart';

import '../../widgets/common_widgets.dart';
import '../../state/app_state.dart';
import '../login/role_selection_screen.dart';

class SettingsPage extends StatefulWidget {
  final AppState state;
  const SettingsPage({super.key, required this.state});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  void _showChangePasswordDialog() {
    final oldPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final parentContext = context;

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text("Change Password"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: oldPasswordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: "Current Password",
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: newPasswordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: "New Password",
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            onPressed: () async {
              final oldPass = oldPasswordController.text;
              final newPass = newPasswordController.text;

              if (oldPass.isEmpty || newPass.isEmpty) {
                ScaffoldMessenger.of(dialogContext).showSnackBar(
                  const SnackBar(content: Text("Please fill both fields")),
                );
                return;
              }

              final result = await widget.state.changePassword(oldPass, newPass);
              Navigator.pop(dialogContext);

              if (parentContext.mounted) {
                ScaffoldMessenger.of(parentContext).showSnackBar(
                  SnackBar(content: Text(result == 'success' ? "Password changed successfully" : result)),
                );
              }
            },
            child: const Text("Save"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          GovHeader(
            state: widget.state,
            titleOverride: t(context, 'settings'),
            showBackButton: true,
            showSettingsButton: false,
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                Card(
                  child: ListTile(
                    title: Text(t(context, 'language')),
                    subtitle: Text(widget.state.currentLocale.languageCode.toUpperCase()),
                    trailing: SizedBox(
                      width: 120,
                      child: DropdownButton<String>(
                        isExpanded: true,
                        value: widget.state.currentLocale.languageCode,
                        items: const [
                          DropdownMenuItem(value: 'en', child: Text('English')),
                          DropdownMenuItem(value: 'te', child: Text('తెలుగు (Telugu)')),
                          DropdownMenuItem(value: 'hi', child: Text('हिन्दी (Hindi)')),
                          DropdownMenuItem(value: 'ta', child: Text('தமிழ் (Tamil)')),
                          DropdownMenuItem(value: 'kn', child: Text('ಕನ್ನಡ (Kannada)')),
                          DropdownMenuItem(value: 'ml', child: Text('മലയാളం (Malayalam)')),
                          DropdownMenuItem(value: 'mr', child: Text('मराठी (Marathi)')),
                        ],
                        onChanged: (val) {
                          if (val != null) {
                            widget.state.changeLanguage(val);
                          }
                        },
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                Card(
                  child: ListTile(
                    leading: const Icon(Icons.person),
                    title: Text(t(context, 'profile')),
                    subtitle: Text(widget.state.currentUser?.name ?? 'User Profile'),
                  ),
                ),
                const SizedBox(height: 12),
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.lock),
                    title: const Text('Change Password'),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                    onTap: () {
                      _showChangePasswordDialog();
                    },
                  ),
                ),
                const SizedBox(height: 12),

                Card(
                  child: ListTile(
                    leading: const Icon(Icons.info_outline),
                    title: Text(t(context, 'about')),
                    subtitle: Text('${t(context, 'version')}: ${t(context, 'version_val')}'),
                  ),
                ),
                const SizedBox(height: 12),

                Card(
                  child: ListTile(
                    leading: const Icon(Icons.policy),
                    title: Text(t(context, 'privacy_policy')),
                    onTap: () {},
                  ),
                ),
                const SizedBox(height: 12),

                Card(
                  child: ListTile(
                    leading: const Icon(Icons.help_outline),
                    title: Text(t(context, 'help_support')),
                    onTap: () {},
                  ),
                ),
                const SizedBox(height: 24),

                ElevatedButton(
                  onPressed: () {
                    widget.state.logout();
                    Navigator.pushAndRemoveUntil(
                      context,
                      MaterialPageRoute(builder: (context) => const RoleSelectionScreen()),
                      (route) => false,
                    );
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFC1272D), foregroundColor: Colors.white, minimumSize: const Size(double.infinity, 44)),
                  child: Text(t(context, 'logout')),
                )
              ],
            ),
          ),
        ],
      ),
    );
  }
}