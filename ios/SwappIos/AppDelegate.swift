import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import GoogleMaps
import Auth0
import FirebaseCore
import UserNotifications
import FirebaseMessaging

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {
  var window: UIWindow?
  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    self.launchOptions = launchOptions

    // Initialize Firebase if GoogleService-Info.plist is present
    if Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil {
      FirebaseApp.configure()
      print("[Firebase] Configured successfully.")
    } else {
      print("[Firebase] GoogleService-Info.plist not found in bundle. Skipping initialization.")
    }

    // Set notification delegates & register for remote notifications
    UNUserNotificationCenter.current().delegate = self
    Messaging.messaging().delegate = self
    application.registerForRemoteNotifications()

    // Initialize Google Maps
    GMSServices.provideAPIKey("AIzaSyDbCCPsto9OSDAYX7D9vm1ibB1VKVOoTeI")

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    return true
  }

  // MARK: UISceneSession Lifecycle

  func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
  }

  func application(_ application: UIApplication, didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
  }

  // APNs device token registration callback
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    Messaging.messaging().apnsToken = deviceToken
    print("[Firebase] APNs token registered with Firebase successfully.")
  }

  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("[Firebase] Failed to register for remote notifications: \(error.localizedDescription)")
  }

  // MessagingDelegate
  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    print("[Firebase] FCM registration token: \(fcmToken ?? "")")
  }

  // UNUserNotificationCenterDelegate for foreground notifications
  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    if #available(iOS 14.0, *) {
      completionHandler([.banner, .list, .sound, .badge])
    } else {
      completionHandler([.alert, .sound, .badge])
    }
  }

  // Handle Auth0 Redirect
  func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
      return RCTLinkingManager.application(app, open: url, options: options)
  }

  // Handle Universal Links
  func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
      return RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
