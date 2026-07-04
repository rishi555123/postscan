import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class AppLocalizations {
  final Locale locale;
  static Map<String, dynamic> _localizedStrings = {};
  static Map<String, String> _englishStrings = {};

  AppLocalizations(this.locale);

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static final Map<String, Map<String, String>> _fallbackDict = {
    'en': {
      'title': 'PostScan',
      'tagline': 'AI-Powered Address Recognition & Delivery Routing System',
      'welcome': 'Welcome to PostScan Portal',
      'login': 'Sign In',
      'username': 'Username',
      'password': 'Password',
      'select_role': 'Select Portal Role',
      'select_role_sub': 'Choose your India Post authorization role',
      'office_staff': 'Office Staff',
      'postman': 'Postman',
      'admin': 'Administrator',
      'logout': 'Sign Out',
      'back': 'Back',
      'cancel': 'Cancel',
      'save': 'Save Changes',
      'pincode': 'Pincode',
      'beat': 'Beat Sector',
      'recipient': 'Recipient Name',
      'address': 'Full Address',
      'status': 'Delivery Status',
      'pending': 'Pending',
      'assigned': 'Assigned',
      'out_for_delivery': 'Out For Delivery',
      'delivered': 'Delivered',
      'house_locked': 'House Locked',
      'address_not_found': 'Address Not Found',
      'shifted': 'Shifted Address',
      'recipient_not_available': 'Recipient Not Available',
      'returned_to_office': 'Returned to Office',
      'weather_warnings': 'Weather Alerts',
      "heavy_rain": "Heavy Rain Alert - Slippery Roads",
      "storm": "Severe Weather - Seek Shelter",
      "low_visibility": "Low Visibility - Ride Safely",
      "clear": "Clear Conditions",
      'settings': 'Settings',
      'language': 'Language Selection',
      'profile': 'Profile Information',
      'about': 'About Application',
      'version': 'Application Version',
      'version_val': 'v2.5.0-gov',
      'future_theme': 'Visual Theme Placeholder',
      'privacy_policy': 'Privacy Policy',
      'help_support': 'Help & Support',
      'scanned_letters': 'Total Letters Scanned',
      'success_deliveries': 'Successful Deliveries',
      'ocr_accuracy': 'OCR Character Accuracy',
      'failures': 'Uncertain OCR Scans',
      'weekly_stats': 'Weekly Volume Sorting Stats',
      'letters_unit': 'letters',
      'reset_demo': 'Reset Database State',
      'reset_desc': 'Clears all status modifications and manually added user updates.',
      'restore_db': 'Restore Database Initial State',
      'add_user': 'Create User Account',
      'full_name': 'Full Name',
      'role_label': 'Role',
      'choose_hub': 'Choose Hub (Optional)',
      'add_user_btn': 'Add User Account',
      'success_user_created': 'Account created successfully!',
      'error_fields': 'Please fill in all user profile details.',
      'offline_active': 'Offline Mode Active (SQLite buffered)',
      'syncing': 'Synchronizing local cached updates...',
      'scan_letter': 'Scan Incoming Letter',
      'select_photo': 'Select Shipping Label Photo',
      'ocr_scan': 'OCR Scan',
      'batch_scan': 'Batch Scan (10-100)',
      'low_confidence_warning': 'Low Confidence character match! Please manually correct values.',
      'pipeline_scanning': 'Scanning Label...',
      'pipeline_ocr': 'OCR Extracting Text...',
      'pipeline_ai': 'AI Address Component Parsing...',
      'pipeline_beat': 'Beat Identification & Mapping...',
      'pipeline_batch': 'Adding to Postman Batch...',
      'route_sequence': 'Sequence Delivery Stops',
      'nav_maps': 'Google Maps Navigation',
      'update_status': 'Update Status',
      'remaining_dist': 'Remaining Distance',
      'estimated_time': 'Estimated Completion',
      'route_map': 'Live Ward Map',
      'db_overview': 'Letters Database Overview',
      'received': 'Received',
      'ocr_done': 'OCR Done',
      'out_for_del': 'Out for Del.',
      'assign_letter_beat': 'Assign Letter to Beat',
      'select_beat': 'Select Beat',
      'assign': 'Assign',
      'ocr_review': 'OCR Verification & Review',
      'process_batch_btn': 'Load Labels & Process Batch',
      'processing_queue': 'Processing Queue',
      'low_confidence_letters': 'Low Confidence Letters',
      'parsed_address': 'Parsed Address:',
      'raw_ocr_text': 'Raw OCR Text:',
      'review_correct': 'Review / Correct',
      'assign_to_beat': 'Assign to Beat',
      'beat_segregation': 'Beat Wise Segregation',
      'focus_map': 'Focus Map',
      'todays_batch': "Today's Batch",
      'yesterdays_batch': "Yesterday's Batch",
      'previous_batch': "Previous Batch",
      'leaflet_map': 'Leaflet Delivery Map',
      'cached_offline': 'Cached Offline'
    },
    'te': {
      "title": "పోస్ట్ స్కాన్",
      "tagline": "ఏఐ-ఆధారిత చిరునామా గుర్తింపు & డెలివరీ రూటింగ్ సిస్టమ్",
      "welcome": "పోస్ట్ స్కాన్ పోర్టల్‌కు స్వాగతం",
      "login": "లాగిన్",
      "username": "వినియోగదారు పేరు",
      "password": "పాసవర్డ్",
      "select_role": "పోర్టల్ పాత్రను ఎంచుకోండి",
      "select_role_sub": "మీ ఇండియా పోస్ట్ అధికారిక పాత్రను ఎంచుకోండి",
      "office_staff": "కార్యాలయ సిబ్బంది",
      "postman": "పోస్ట్‌మ్యాన్",
      "admin": "అడ్మినిస్ట్రేటర్",
      "logout": "లాగ్ అవుట్",
      "back": "వెనుకకు",
      "cancel": "రద్దు చేయి",
      "save": "మార్పులను సేవ్ చేయి",
      "pincode": "పిన్ కోడ్",
      "beat": "బీట్ విభాగం",
      "recipient": "గ్రహీత పేరు",
      "address": "చిరునామా",
      "status": "డెలివరీ స్థితి",
      "pending": "పెండింగ్",
      "assigned": "కేటాయించబడింది",
      "out_for_delivery": "డెలివరీకి సిద్ధంగా ఉంది",
      "delivered": "డెలివరీ చేయబడింది",
      "house_locked": "ఇల్లు తాళం వేసి ఉంది",
      "address_not_found": "చిరునామా కనుగొనబడలేదు",
      "shifted": "చిరునామా మారారు",
      "recipient_not_available": "గ్రహీత అందుబాటులో లేరు",
      "returned_to_office": "కార్యాలయానికి తిరిగి పంపబడింది",
      "weather_warnings": "వాతావరణ హెచ్చరికలు",
      "heavy_rain": "భారీ వర్షం హెచ్చరిక - జారే రోడ్లు",
      "storm": "తీవ్రమైన వాతావరణం - ఆశ్రయం పొందండి",
      "low_visibility": "తక్కువ దృశ్యమానత - సురక్షితంగా ప్రయాణించండి",
      "clear": "సాధారణ వాతావరణం",
      "settings": "సెట్టింగులు",
      "language": "భాష ఎంపిక",
      "profile": "ప్రొఫైల్ సమాచారం",
      "about": "అప్లికేషన్ గురించి",
      "version": "అప్లికేషన్ వెర్షన్",
      "version_val": "v2.5.0-gov",
      "future_theme": "విజువల్ థీమ్ ప్లేస్ హోల్డర్",
      "privacy_policy": "గోప్యతా విధానం",
      "help_support": "సహాయం & మద్దతు",
      "scanned_letters": "మొత్తం స్కాన్ చేసిన ఉత్తరాలు",
      "success_deliveries": "విజయవంతమైన డెలివరీలు",
      "ocr_accuracy": "OCR అక్షర ఖచ్చితత్వం",
      "failures": "సందిగ్ధ OCR స్కాన్లు",
      "weekly_stats": "వాతావరణ రిపోర్ట్",
      "letters_unit": "ఉత్తరాలు",
      "reset_demo": "డేటాబేస్ రీసెట్",
      "reset_desc": "అన్ని డెలివరీ స్థితులను మరియు మాన్యువల్ మార్పులను తొలగిస్తుంది.",
      "restore_db": "ప్రారంభ స్థితికి రీసెట్ చేయి",
      "add_user": "వినియోగదారు ఖాతాను సృష్టించు",
      "full_name": "పూర్తి పేరు",
      "role_label": "పాత్ర",
      "choose_hub": "హబ్‌ను ఎంచుకోండి",
      "add_user_btn": "ఖాతాను సృష్టించు",
      "success_user_created": "ఖాతా విజయవంతంగా సృష్టించబడింది!",
      "error_fields": "దయచేసి అన్ని వివరాలను నింపండి.",
      "offline_active": "ఆఫ్‌లైన్ మోడ్ యాక్టివ్ (SQLite స్టోరేజ్)",
      "syncing": "ఆఫ్‌లైన్ మార్పులను సర్వర్‌కు సమకాలీకరిస్తోంది...",
      "scan_letter": "ఉత్తరాన్ని స్కాన్ చేయి",
      "select_photo": "లేబుల్ ఫోటోను ఎంచుకోండి",
      "ocr_scan": "OCR స్కాన్",
      "batch_scan": "బ్యాచ్ స్కాన్ (10-100)",
      "low_confidence_warning": "తక్కువ OCR గుర్తింపు రేటు! దయచేసి వివరాలను సరిచూసుకోండి.",
      "pipeline_scanning": "లేబుల్ స్కాన్ అవుతోంది...",
      "pipeline_ocr": "OCR టెక్స్ట్ సేకరిస్తోంది...",
      "pipeline_ai": "ఏఐ చిరునామా విభజన చేస్తోంది...",
      "pipeline_beat": "బీట్ గుర్తింపు & మ్యాపింగ్...",
      "pipeline_batch": "పోస్ట్‌మ్యాన్ బ్యాచ్‌కు జతచేోంది...",
      "route_sequence": "డెలివరీ స్టాప్స్ క్రమం",
      "nav_maps": "గూగుల్ మ్యాప్స్ నావిగేషన్",
      "update_status": "స్థితిని అప్‌డేట్ చేయి",
      "remaining_dist": "మిగిలిన దూరం",
      "estimated_time": "అంచనా సమయం",
      "route_map": "లైవ్ వార్డ్ మ్యాప్",
      "db_overview": "డేటాబేస్ అవలోకనం",
      "received": "స్వీకరించినవి",
      "ocr_done": "OCR పూర్తయింది",
      "out_for_del": "డెలివరీలో ఉంది",
      "assign_letter_beat": "లేఖను బీట్‌కు కేటాయించు",
      "select_beat": "బీట్ ఎంచుకోండి",
      "assign": "కేటాయించు",
      "ocr_review": "OCR ధృవీకరణ & సమీక్ష",
      "process_batch_btn": "లేబుళ్లను లోడ్ చేసి బ్యాచ్ ప్రాసెస్ చేయి",
      "processing_queue": "ప్రాసెసింగ్ క్యూ",
      "low_confidence_letters": "తక్కువ ఖచ్చితత్వం గల ఉత్తరాలు",
      "parsed_address": "విశ్లేషించిన చిరునామా:",
      "raw_ocr_text": "అసలు OCR టెక్స్ట్:",
      "review_correct": "సరిచూసుకోండి",
      "assign_to_beat": "బీట్‌కు కేటాయించు",
      "beat_segregation": "బీట్ ఆధారిత విభజన",
      "focus_map": "మ్యాప్ కేంద్రీకరించు",
      "todays_batch": "నేటి బ్యాచ్",
      "yesterdays_batch": "నిన్నటి బ్యాచ్",
      "previous_batch": "మునుపటి బ్యాచ్",
      "leaflet_map": "లైవ్ డెలివరీ మ్యాప్",
      "cached_offline": "ఆఫ్‌లైన్‌లో సేవ్ చేయబడింది"
    }
  };

  Future<bool> load() async {
    if (_englishStrings.isEmpty) {
      try {
        String enJsonString = await rootBundle.loadString('assets/locales/en.json');
        Map<String, dynamic> enJsonMap = json.decode(enJsonString);
        _englishStrings = enJsonMap.map((key, value) => MapEntry(key, value.toString()));
      } catch (e) {
        debugPrint("Failed to load English baseline: $e");
        _englishStrings = _fallbackDict['en']!;
      }
    }

    try {
      String jsonString = await rootBundle.loadString('assets/locales/${locale.languageCode}.json');
      Map<String, dynamic> jsonMap = json.decode(jsonString);
      _localizedStrings = jsonMap;
      return true;
    } catch (e) {
      debugPrint("Asset load issue ($e). Defaulting to fallback translations.");
      _localizedStrings = _fallbackDict[locale.languageCode] ?? _fallbackDict['en']!;
      return true;
    }
  }

  String translate(String key) {
    return _localizedStrings[key]?.toString() ?? _englishStrings[key] ?? _fallbackDict['en']?[key] ?? key;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['en', 'te', 'hi', 'ta', 'kn', 'ml', 'mr'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    AppLocalizations localizations = AppLocalizations(locale);
    await localizations.load();
    return localizations;
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}