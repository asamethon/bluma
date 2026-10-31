// Bluma: iOS 26+ ayrı Yaz düğmesi. Eski iOS gezinmesi aynı kalır.
- (NSArray<__kindof UIViewController *> *)blumaViewControllers
{
#if !TARGET_OS_TV && !TARGET_OS_VISION && __IPHONE_OS_VERSION_MAX_ALLOWED >= 260000
  if (@available(iOS 26.0, *)) {
    if (self.tabs.count > 0) return _tabScreenControllers;
  }
#endif
  return [super viewControllers];
}

- (BOOL)bluma_updateModernTabs
{
#if !TARGET_OS_TV && !TARGET_OS_VISION && __IPHONE_OS_VERSION_MAX_ALLOWED >= 260000
  if (@available(iOS 26.0, *)) {
    BOOL hasSearch = NO;
    for (RNSTabsScreenViewController *screen in _tabScreenControllers) {
      hasSearch |= screen.tabScreenComponentView.systemItem == RNSTabsScreenSystemItemSearch;
    }
    if (!hasSearch) return NO;
    NSMutableArray<UITab *> *tabs = [NSMutableArray new];
    UITab *writeTab = nil;
    for (RNSTabsScreenViewController *screen in _tabScreenControllers) {
      UITab *tab = nil;
      for (UITab *existing in self.tabs) {
        if (existing.viewController == screen) { tab = existing; break; }
      }
      BOOL isSearch = screen.tabScreenComponentView.systemItem == RNSTabsScreenSystemItemSearch;
      if (tab == nil) {
        UIViewController *(^provider)(UITab *) = ^UIViewController *(UITab *item) { return screen; };
        tab = isSearch
            ? [[UISearchTab alloc] initWithViewControllerProvider:provider]
            : [[UITab alloc] initWithTitle:screen.title ?: @"" image:nil
                identifier:screen.getScreenKeyOrNull viewControllerProvider:provider];
      }
      if (isSearch) {
        ((UISearchTab *)tab).automaticallyActivatesSearch = NO;
        writeTab = tab;
      }
      [tabs addObject:tab];
    }
    [self setTabs:tabs animated:NO];
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 270000
    if (@available(iOS 27.0, *)) self.prominentTabIdentifier = writeTab.identifier;
#endif
    return YES;
  }
#endif
  return NO;
}

- (void)bluma_updateModernTabAppearance
{
#if !TARGET_OS_TV && !TARGET_OS_VISION && __IPHONE_OS_VERSION_MAX_ALLOWED >= 260000
  if (@available(iOS 26.0, *)) {
    for (UITab *tab in self.tabs) {
      UITabBarItem *item = tab.viewController.tabBarItem;
      tab.title = item.title ?: @"";
      tab.image = item.image;
      tab.badgeValue = item.badgeValue;
      tab.accessibilityIdentifier = item.accessibilityIdentifier;
      tab.accessibilityLabel = item.accessibilityLabel;
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 260100
      if (@available(iOS 26.1, *)) tab.selectedImage = item.selectedImage ?: item.image;
#endif
    }
  }
#endif
}

#if !TARGET_OS_TV && !TARGET_OS_VISION && __IPHONE_OS_VERSION_MAX_ALLOWED >= 260000
- (BOOL)tabBarController:(UITabBarController *)host shouldSelectTab:(UITab *)tab
    API_AVAILABLE(ios(26.0))
{
  return [self tabBarController:host shouldSelectViewController:tab.viewController];
}

- (void)tabBarController:(UITabBarController *)host didSelectTab:(UITab *)tab previousTab:(UITab *)previous
    API_AVAILABLE(ios(26.0))
{
  [self tabBarController:host didSelectViewController:tab.viewController];
}
#endif
