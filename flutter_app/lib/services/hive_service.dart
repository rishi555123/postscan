import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class Hive {
  static final Map<String, HiveBox> _boxes = {};

  static Future<void> initFlutter() async {}

  static Future<HiveBox> openBox(String boxName) async {
    if (_boxes.containsKey(boxName)) {
      return _boxes[boxName]!;
    }
    final box = HiveBox(boxName);
    await box.load();
    _boxes[boxName] = box;
    return box;
  }
}

class HiveBox {
  final String name;
  Map<String, dynamic> _data = {};

  HiveBox(this.name);

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString('hive_box_$name') ?? '{}';
    _data = Map<String, dynamic>.from(json.decode(jsonStr));
  }

  Future<void> save() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('hive_box_$name', json.encode(_data));
  }

  dynamic get(dynamic key, {dynamic defaultValue}) {
    return _data[key.toString()] ?? defaultValue;
  }

  Future<void> put(dynamic key, dynamic value) async {
    _data[key.toString()] = value;
    await save();
  }

  Future<void> delete(dynamic key) async {
    _data.remove(key.toString());
    await save();
  }

  List<dynamic> get values => _data.values.toList();
  
  Future<void> clear() async {
    _data.clear();
    await save();
  }
}