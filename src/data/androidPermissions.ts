export interface PermissionDef {
  name: string;
  simpleName: string;
  isSensitive: boolean;
  category: 'CAMERA' | 'MICROPHONE' | 'LOCATION' | 'CONTACTS' | 'SMS' | 'PHONE' | 'STORAGE' | 'SYSTEM';
  description: string;
  whyDangerous: string;
}

export const ANDROID_PERMISSION_DICTIONARY: Record<string, PermissionDef> = {
  'android.permission.ACCESS_FINE_LOCATION': {
    name: 'android.permission.ACCESS_FINE_LOCATION',
    simpleName: 'ACCESS_FINE_LOCATION',
    isSensitive: true,
    category: 'LOCATION',
    description: 'Allows an app to access precise physical location from GPS and network location sources.',
    whyDangerous: 'Enables continuous spatial tracking of where the user lives, works, and visits with meter-level precision.',
  },
  'android.permission.ACCESS_COARSE_LOCATION': {
    name: 'android.permission.ACCESS_COARSE_LOCATION',
    simpleName: 'ACCESS_COARSE_LOCATION',
    isSensitive: true,
    category: 'LOCATION',
    description: 'Allows an app to access approximate location derived from cellular network and Wi-Fi beacons.',
    whyDangerous: 'Can infer general neighbourhood, city, and transit patterns without GPS lock.',
  },
  'android.permission.ACCESS_BACKGROUND_LOCATION': {
    name: 'android.permission.ACCESS_BACKGROUND_LOCATION',
    simpleName: 'ACCESS_BACKGROUND_LOCATION',
    isSensitive: true,
    category: 'LOCATION',
    description: 'Allows an app to request location in the background without any active user interaction or foreground UI.',
    whyDangerous: 'Critical privacy hazard: creates round-the-clock movement telemetry logs without visible indicator on screen.',
  },
  'android.permission.CAMERA': {
    name: 'android.permission.CAMERA',
    simpleName: 'CAMERA',
    isSensitive: true,
    category: 'CAMERA',
    description: 'Required to access optical camera devices to take photos or record video.',
    whyDangerous: 'Can capture private physical spaces, documents, credentials, and facial imagery.',
  },
  'android.permission.RECORD_AUDIO': {
    name: 'android.permission.RECORD_AUDIO',
    simpleName: 'RECORD_AUDIO',
    isSensitive: true,
    category: 'MICROPHONE',
    description: 'Allows an application to record audio streams from hardware microphones.',
    whyDangerous: 'Allows listening to ambient acoustic environment, confidential speech, and vocal conversations.',
  },
  'android.permission.READ_CONTACTS': {
    name: 'android.permission.READ_CONTACTS',
    simpleName: 'READ_CONTACTS',
    isSensitive: true,
    category: 'CONTACTS',
    description: 'Allows an application to read personal contacts, phone numbers, and address books.',
    whyDangerous: 'Exposes social graphs, personal phone numbers, and identities of private associates.',
  },
  'android.permission.WRITE_CONTACTS': {
    name: 'android.permission.WRITE_CONTACTS',
    simpleName: 'WRITE_CONTACTS',
    isSensitive: true,
    category: 'CONTACTS',
    description: 'Allows an application to modify or delete the user contact data.',
    whyDangerous: 'Malicious applications could tamper with or overwrite emergency contact numbers.',
  },
  'android.permission.READ_SMS': {
    name: 'android.permission.READ_SMS',
    simpleName: 'READ_SMS',
    isSensitive: true,
    category: 'SMS',
    description: 'Allows an application to read stored and incoming SMS text messages.',
    whyDangerous: 'High threat to authentication security: SMS messages frequently deliver two-factor authorization (2FA) and banking OTPs.',
  },
  'android.permission.RECEIVE_SMS': {
    name: 'android.permission.RECEIVE_SMS',
    simpleName: 'RECEIVE_SMS',
    isSensitive: true,
    category: 'SMS',
    description: 'Allows an application to monitor and intercept incoming SMS messages.',
    whyDangerous: 'Allows eavesdropping on real-time OTP verification tokens as they arrive on the device.',
  },
  'android.permission.SEND_SMS': {
    name: 'android.permission.SEND_SMS',
    simpleName: 'SEND_SMS',
    isSensitive: true,
    category: 'SMS',
    description: 'Allows an application to dispatch SMS messages.',
    whyDangerous: 'Toll fraud hazard: rogue software can send unauthorized messages to premium-rate numbers.',
  },
  'android.permission.READ_CALL_LOG': {
    name: 'android.permission.READ_CALL_LOG',
    simpleName: 'READ_CALL_LOG',
    isSensitive: true,
    category: 'PHONE',
    description: 'Allows an application to read phone call history and records.',
    whyDangerous: 'Exposes incoming and outgoing telephony habits, durations, and timestamps.',
  },
  'android.permission.READ_PHONE_STATE': {
    name: 'android.permission.READ_PHONE_STATE',
    simpleName: 'READ_PHONE_STATE',
    isSensitive: true,
    category: 'PHONE',
    description: 'Allows read access to phone state, cellular network information, and phone numbers.',
    whyDangerous: 'Can access device serials, carrier identifiers, and active telephony state.',
  },
  'android.permission.READ_EXTERNAL_STORAGE': {
    name: 'android.permission.READ_EXTERNAL_STORAGE',
    simpleName: 'READ_EXTERNAL_STORAGE',
    isSensitive: true,
    category: 'STORAGE',
    description: 'Allows an application to read from external storage partitions.',
    whyDangerous: 'Can inspect user photos, downloaded documents, and cached media across shared storage.',
  },
  'android.permission.MANAGE_EXTERNAL_STORAGE': {
    name: 'android.permission.MANAGE_EXTERNAL_STORAGE',
    simpleName: 'MANAGE_EXTERNAL_STORAGE',
    isSensitive: true,
    category: 'STORAGE',
    description: 'Special access granting broad file system read and write permissions.',
    whyDangerous: 'Allows unrestricted file traversal across non-app-specific directories.',
  },
  'android.permission.SYSTEM_ALERT_WINDOW': {
    name: 'android.permission.SYSTEM_ALERT_WINDOW',
    simpleName: 'SYSTEM_ALERT_WINDOW',
    isSensitive: true,
    category: 'SYSTEM',
    description: 'Allows an app to draw windows over all other running applications.',
    whyDangerous: 'Common tapjacking and phishing vector: malicious overlays can masquerade over legitimate banking prompts.',
  },
  'android.permission.REQUEST_INSTALL_PACKAGES': {
    name: 'android.permission.REQUEST_INSTALL_PACKAGES',
    simpleName: 'REQUEST_INSTALL_PACKAGES',
    isSensitive: true,
    category: 'SYSTEM',
    description: 'Allows an application to request installation of packages via package installer.',
    whyDangerous: 'Can serve as a dropper or staged payload delivery vehicle for untrusted APK binaries.',
  },
  'android.permission.INTERNET': {
    name: 'android.permission.INTERNET',
    simpleName: 'INTERNET',
    isSensitive: false,
    category: 'SYSTEM',
    description: 'Allows applications to open network sockets to the internet.',
    whyDangerous: 'Standard Android capability. Becomes critical when paired with sensitive hardware sensors.',
  },
  'android.permission.ACCESS_NETWORK_STATE': {
    name: 'android.permission.ACCESS_NETWORK_STATE',
    simpleName: 'ACCESS_NETWORK_STATE',
    isSensitive: false,
    category: 'SYSTEM',
    description: 'Allows applications to query connectivity states (Wi-Fi, Mobile Data).',
    whyDangerous: 'Standard platform capability.',
  },
  'android.permission.VIBRATE': {
    name: 'android.permission.VIBRATE',
    simpleName: 'VIBRATE',
    isSensitive: false,
    category: 'SYSTEM',
    description: 'Allows access to the tactile vibration motor.',
    whyDangerous: 'Benign hardware utility.',
  },
  'android.permission.WAKE_LOCK': {
    name: 'android.permission.WAKE_LOCK',
    simpleName: 'WAKE_LOCK',
    isSensitive: false,
    category: 'SYSTEM',
    description: 'Allows using PowerManager WakeLocks to keep processor from sleeping.',
    whyDangerous: 'Can prevent device sleep state, potentially impacting battery life.',
  },
  'android.permission.POST_NOTIFICATIONS': {
    name: 'android.permission.POST_NOTIFICATIONS',
    simpleName: 'POST_NOTIFICATIONS',
    isSensitive: false,
    category: 'SYSTEM',
    description: 'Allows app to post status bar alerts and notifications (Android 13+).',
    whyDangerous: 'Standard user-facing notification channel.',
  },
};

export function getPermissionMetadata(permName: string): PermissionDef {
  if (ANDROID_PERMISSION_DICTIONARY[permName]) {
    return ANDROID_PERMISSION_DICTIONARY[permName];
  }

  const simpleName = permName.split('.').pop() || permName;
  const isSensitive = permName.includes('LOCATION') ||
    permName.includes('CAMERA') ||
    permName.includes('AUDIO') ||
    permName.includes('RECORD') ||
    permName.includes('CONTACTS') ||
    permName.includes('SMS') ||
    permName.includes('CALL') ||
    permName.includes('STORAGE') ||
    permName.includes('ALERT_WINDOW') ||
    permName.includes('INSTALL_PACKAGES');

  let category: PermissionDef['category'] = 'SYSTEM';
  if (permName.includes('LOCATION')) category = 'LOCATION';
  else if (permName.includes('CAMERA')) category = 'CAMERA';
  else if (permName.includes('AUDIO') || permName.includes('RECORD')) category = 'MICROPHONE';
  else if (permName.includes('CONTACTS')) category = 'CONTACTS';
  else if (permName.includes('SMS')) category = 'SMS';
  else if (permName.includes('PHONE') || permName.includes('CALL')) category = 'PHONE';
  else if (permName.includes('STORAGE')) category = 'STORAGE';

  return {
    name: permName,
    simpleName,
    isSensitive,
    category,
    description: `Android platform permission declared in package manifest (${simpleName}).`,
    whyDangerous: isSensitive ? 'Exposes sensitive hardware sensor or personal user profile data.' : 'Standard Android platform capability.',
  };
}
