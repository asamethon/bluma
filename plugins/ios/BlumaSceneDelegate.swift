import UIKit
import React

// SDK 56 için UIScene köprüsü. Expo'nun yerleşik desteğine geçildiğinde kaldırılabilir.
class BlumaSceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?
  private var appDelegate: AppDelegate? { UIApplication.shared.delegate as? AppDelegate }

  func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options: UIScene.ConnectionOptions) {
    guard let windowScene = scene as? UIWindowScene,
      let appDelegate, let factory = appDelegate.reactNativeFactory else { return }

    if let existing = appDelegate.window {
      window = existing
      existing.windowScene = windowScene
      existing.makeKeyAndVisible()
    } else {
      let window = UIWindow(windowScene: windowScene)
      self.window = window
      // Expo Updates ve geliştirme istemcisi bu uyumluluk tutamacını kullanır.
      appDelegate.window = window
      var launchOptions = appDelegate.sceneLaunchOptions ?? [:]
      if let context = options.urlContexts.first {
        launchOptions[.url] = context.url
        launchOptions[.sourceApplication] = context.options.sourceApplication
        launchOptions[.annotation] = context.options.annotation
      }
      if let activity = options.userActivities.first {
        launchOptions[.userActivityDictionary] = [
          "UIApplicationLaunchOptionsUserActivityKey": activity,
          "UIApplicationLaunchOptionsUserActivityTypeKey": activity.activityType,
        ]
      }
      if let response = options.notificationResponse {
        launchOptions[.remoteNotification] = response.notification.request.content.userInfo
      }
      factory.startReactNative(withModuleName: "main", in: window, launchOptions: launchOptions)
      appDelegate.sceneLaunchOptions = nil
    }

    // OAuth ve Expo geliştirme bağlantıları native AppDelegate abonelerine de ulaşmalı.
    for context in options.urlContexts { open(context) }
    for activity in options.userActivities { self.scene(scene, continue: activity) }
    if let shortcut = options.shortcutItem {
      appDelegate.application(UIApplication.shared, performActionFor: shortcut, completionHandler: { _ in })
    }
  }

  private func open(_ context: UIOpenURLContext) {
    var options: [UIApplication.OpenURLOptionsKey: Any] = [.openInPlace: context.options.openInPlace]
    options[.sourceApplication] = context.options.sourceApplication
    options[.annotation] = context.options.annotation
    _ = appDelegate?.application(UIApplication.shared, open: context.url, options: options)
  }

  func scene(_ scene: UIScene, openURLContexts contexts: Set<UIOpenURLContext>) {
    for context in contexts { open(context) }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    _ = appDelegate?.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
  }

  func sceneDidBecomeActive(_ scene: UIScene) {
    appDelegate?.applicationDidBecomeActive(UIApplication.shared)
  }

  func sceneWillResignActive(_ scene: UIScene) {
    appDelegate?.applicationWillResignActive(UIApplication.shared)
  }

  func sceneWillEnterForeground(_ scene: UIScene) {
    appDelegate?.applicationWillEnterForeground(UIApplication.shared)
  }

  func sceneDidEnterBackground(_ scene: UIScene) {
    appDelegate?.applicationDidEnterBackground(UIApplication.shared)
  }

  func windowScene(_ windowScene: UIWindowScene, performActionFor shortcut: UIApplicationShortcutItem,
    completionHandler: @escaping (Bool) -> Void) {
    guard let appDelegate else { completionHandler(false); return }
    appDelegate.application(UIApplication.shared, performActionFor: shortcut, completionHandler: completionHandler)
  }
}
