# ClawOps Command Center

Internal dashboard for claw machine business operations.

## Features

- **Location Management**: Track all your claw machine locations
- **Maintenance Reporting**: QR-based public reporting and internal tracking
- **Revenue Tracking**: Log and analyze machine revenue
- **Mileage Tracking**: Track business travel for tax purposes
- **Inventory Management**: Track plush and prize inventory
- **Team Management**: Invite and manage team members
- **Compliance Lookup**: State-by-state amusement device regulations

## Technology Stack

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Supabase (Database, Auth, Edge Functions)

## Development

```sh
# Install dependencies
npm install

# Start development server
npm run dev
```

## Environment

The application uses environment variables for configuration. Key variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key

## PWA Support

ClawOps is a Progressive Web App (PWA) and can be installed on mobile devices for a native-like experience.
