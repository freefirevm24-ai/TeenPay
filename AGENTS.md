# Project Guidance

## User Preferences

- Fun, meme-friendly, Gen-Z aesthetic with dark mode and glassmorphism
- Simulation and game only, with no real money involved
- Loud, Paytm/PhonePe-style soundbox alerts customized for fun

## Accepted Requirements

- Virtual wallet with a fake starting balance (default ₹10,000 or custom)
- Friend list with add-by-username and add-by-QR-code
- Fake UPI transfers that instantly deduct from sender and add to receiver with fun notes
- Cash-register sound effect on receiving virtual money
- Text-to-speech funny message announcing sender and amount
- Custom card creator with neon backgrounds, stickers, funny titles, and custom logos
- QR scanner overlay that opens a Send Virtual Money popup
- Dark mode with glassmorphism and sleek animations
- Confetti celebration on large transfers
- Leaderboard of who has the most fake money
- First-open onboarding form with Full Name, Class & Section, Roll Number, and Instagram ID

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- TanStack Router: a Layout using useRouterState/Link must render inside RouterProvider; wrapping RouterProvider in Layout throws "Cannot read properties of null (reading '__store')" and blanks the screen after onboarding.
- Friend search matches on the stored Instagram handle; normalize a typed username by stripping a leading '@' and comparing case-insensitively so '@handle' and 'handle' both resolve.
- The app is dark-first (index.css dark tokens) but no code adds the 'dark' class to documentElement, so the light :root tokens render; apply the dark class in main.tsx if the dark palette is required.
- QR decoding relies on the browser BarcodeDetector with a jsQR CDN fallback; the CDN request is blocked in the sandboxed browser, so QR scanning cannot be verified there.
- Backend commands from src/backend/: mops check --fix, mops build. Frontend commands from src/frontend/: pnpm typecheck, pnpm fix, pnpm build. Bindings from root: pnpm bindgen.
