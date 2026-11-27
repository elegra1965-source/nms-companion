# NMS Companion

Free desktop companion for No Man's Sky. No account, no ads.

- Expedition countdown with live data from nomansskyhub.app
- Portal Dialer (glyphs + hex) with Alt+Shift+P hotkey
- Atlas desk: offline answers, or your own Claude key (optional)
- Discovery catalogue for systems, bases, creatures and pets
- Alerts: new expedition, 24 h and 1 h reminders, Wednesday update day
- Laylaps, a floating sentinel that pops up alerts

Everything is saved on your own computer (Documents/NMS Companion). Use Export/Import backup in the Alerts tab to move to a new computer.

## Download
See the Releases page. The app is not code-signed, so Windows may show "unknown publisher" (More info, Run anyway) and macOS may need right-click, Open.

Built by elegra1965. Game content belongs to Hello Games. Data: Voyager's Haven, NMS Almanac, nomanssky.com posts.

## Privacy
The app sends nothing about you anywhere. It only contacts: map.nomansskyhub.app (expedition schedule, read only), nomanssky.com (official news), api.github.com (checks for a newer version and downloads updates), and, only if you add your own key, api.anthropic.com (your Atlas questions). No accounts, no analytics, no tracking. Your catalogue, settings and key stay on your computer.

## Code signing policy
Free code signing provided by [SignPath.io](https://signpath.io), certificate by [SignPath Foundation](https://signpath.org) (application pending; releases are unsigned until approved).
- Licence: MIT. All code in this repository is open source.
- Windows installers are built only by the GitHub Actions workflow in this repository, from the public source.
- Maintainer, author and approver: elegra1965 (two-step login on GitHub and SignPath). Every signing request is approved by hand.
- Privacy: see the Privacy section above.

## Build
`npm install` then `npm start`. A new release is built by every push to main (GitHub Actions).

Updates: on Windows the app updates itself from the Alerts tab (THIS APP, Download update).
