import UIKit
import React

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = (scene as? UIWindowScene) else { return }

    let window = UIWindow(windowScene: windowScene)
    self.window = window

    let appDelegate = UIApplication.shared.delegate as? AppDelegate
    appDelegate?.window = window

    appDelegate?.reactNativeFactory?.startReactNative(
      withModuleName: "SwappIos",
      in: window,
      launchOptions: appDelegate?.launchOptions
    )

    // Handle deep links from cold start
    if let urlContext = connectionOptions.urlContexts.first {
      _ = RCTLinkingManager.application(
        UIApplication.shared,
        open: urlContext.url,
        options: [:]
      )
    }

    // Handle universal links from cold start
    if let userActivity = connectionOptions.userActivities.first {
      _ = RCTLinkingManager.application(
        UIApplication.shared,
        continue: userActivity,
        restorationHandler: { _ in }
      )
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    if let url = URLContexts.first?.url {
      _ = RCTLinkingManager.application(
        UIApplication.shared,
        open: url,
        options: [:]
      )
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    _ = RCTLinkingManager.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
  }
}
