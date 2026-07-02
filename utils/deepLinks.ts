// Bluma share / deep links
// -------------------------
// We don't own a custom domain, so Universal Links / App Links (which need
// verification files hosted on a domain you control) are not an option.
//
// Instead we share a link to a tiny "smart redirect" page hosted for free on
// Firebase Hosting (the project is `bluma-dc10e`). That page:
//   1. tries to open the installed app via the `bluma://` custom scheme, and
//   2. if the app isn't installed, bounces the visitor to the App Store /
//      Play Store after a short timeout.
// The page lives in /public/link.html and is wired up in firebase.json.
//
// In-app, expo-router automatically maps the `bluma://` scheme to file routes,
// so `bluma://user/<id>` opens app/user/[id].tsx — no extra handling needed.

// Firebase Hosting default domain for project `bluma-dc10e`.
// If you later connect a custom domain, change this one constant.
export const WEB_BASE = 'https://bluma-dc10e.web.app';

/** Canonical, shareable link to a user profile. */
export function buildProfileShareUrl(userId: string): string {
  return `${WEB_BASE}/user/${userId}`;
}

/** Canonical, shareable link to a story. */
export function buildStoryShareUrl(storyId: string): string {
  return `${WEB_BASE}/story/${storyId}`;
}
