import 'package:flutter/material.dart';

import '../../widgets/common_widgets.dart';
import '../../state/app_state.dart';

class UserManagementScreen extends StatefulWidget {
  final AppState state;
  const UserManagementScreen({super.key, required this.state});

  @override
  State<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends State<UserManagementScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  String _selectedRole = 'postman';
  
  // 🔥 NEW: Track selected beat for registration
  String _selectedBeat = 'Beat 101';

  // 🔥 Map assigning a strict Region to each pre-existing Beat
  final Map<String, String> _beatRegions = {
    'Beat 101': 'Begumpet',
    'Beat 102': 'Khairatabad',
    'Beat 201': 'Madhapur',
  };

  void _createUser() async {
    if (_formKey.currentState!.validate()) {
      // Pass the name, username, password, role along with the assigned beat and its region mapped details
      final success = await widget.state.registerUser(
        name: _nameController.text,
        username: _usernameController.text,
        password: _passwordController.text,
        role: _selectedRole,
        beatNumber: _selectedRole == 'postman' ? _selectedBeat : null,
        region: _selectedRole == 'postman' ? _beatRegions[_selectedBeat] : null,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(success ? t(context, 'success_user_created') : 'User registration complete! (Local update)')),
        );
        Navigator.pop(context);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          GovHeader(
            state: widget.state,
            titleOverride: t(context, 'add_user'),
            showBackButton: true,
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Form(
                    key: _formKey,
                    child: SingleChildScrollView(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          TextFormField(
                            controller: _nameController,
                            decoration: InputDecoration(labelText: t(context, 'full_name'), border: const OutlineInputBorder()),
                            validator: (v) => v!.isEmpty ? 'Field required' : null,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _usernameController,
                            decoration: InputDecoration(labelText: t(context, 'username'), border: const OutlineInputBorder()),
                            validator: (v) => v!.isEmpty ? 'Field required' : null,
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: _passwordController,
                            decoration: InputDecoration(labelText: t(context, 'password'), border: const OutlineInputBorder()),
                            obscureText: true,
                            validator: (v) => v!.isEmpty ? 'Field required' : null,
                          ),
                          const SizedBox(height: 12),
                          DropdownButtonFormField<String>(
                            value: _selectedRole,
                            items: const [
                              DropdownMenuItem(value: 'postman', child: Text('Postman')),
                              DropdownMenuItem(value: 'office_staff', child: Text('Office Staff')),
                            ],
                            onChanged: (val) {
                              if (val != null) {
                                setState(() {
                                  _selectedRole = val;
                                });
                              }
                            },
                            decoration: InputDecoration(labelText: t(context, 'role_label'), border: const OutlineInputBorder()),
                          ),

                          // 🔥 NEW: Conditionally show Beat & Region drop-down selector field if the selected user role is 'postman'
                          if (_selectedRole == 'postman') ...[
                            const SizedBox(height: 12),
                            DropdownButtonFormField<String>(
                              value: _selectedBeat,
                              decoration: const InputDecoration(
                                labelText: 'Assign Beat (Pre-existing Region Area)',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.map_outlined),
                              ),
                              items: _beatRegions.entries.map((entry) {
                                return DropdownMenuItem<String>(
                                  value: entry.key,
                                  child: Text('${entry.key} (Region: ${entry.value})'),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() {
                                    _selectedBeat = val;
                                  });
                                }
                              },
                            ),
                          ],

                          const SizedBox(height: 20),
                          ElevatedButton(
                            onPressed: _createUser,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFC1272D), 
                              foregroundColor: Colors.white, 
                              minimumSize: const Size(double.infinity, 44),
                            ),
                            child: Text(t(context, 'add_user_btn')),
                          )
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}