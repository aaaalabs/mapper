# Mapper

Interactive data visualization and analytics platform with map-based insights.

## Features

- 🗺️ Interactive map visualization with clustering and custom markers
- 📊 Advanced data analytics using Nivo/Recharts
- 💳 Secure payment processing via Revolut
- 🔄 Real-time data management with Supabase
- 📱 Mobile-first responsive design
- 👤 Anonymous user session tracking
- 🌐 Public access to visualization features

## Tech Stack

- Frontend: React 18 with TypeScript
- Database: Supabase
- Visualization: Leaflet, Nivo, Recharts
- Styling: Tailwind CSS
- Build Tool: Vite
- Payment: Revolut Integration
- Routing: React Router

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Revolut merchant account (for payment features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mapper.git
cd mapper
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
- Copy `.env.example` to `.env.local`
- Fill in your Supabase and other credentials

4. Start the development server:
```bash
npm run dev
```

## Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_REVOLUT_PUBLIC_KEY=your_revolut_public_key
```

## Project Structure

```
mapper/
├── src/
    ├── components/     # React components
        ├── ui/         # Shared UI components
        ├── map/        # Map-related components
        ├── charts/     # Data visualization components
        └── payment/    # Payment-related components
    ├── services/       # API and business logic
    ├── hooks/         # Custom React hooks
    ├── utils/         # Helper functions
    ├── types/         # TypeScript types
    ├── lib/           # Shared libraries
    └── assets/        # Static assets
├── api/               # API routes
├── supabase/         # Database migrations and config
└── public/           # Static files
```

## Authentication in Mapper

### Important Authentication Rules

1. **Single Admin User**
   - Only one authenticated user: `admin@libralab.ai`
   - No other authentication or user roles
   - All other users are treated as anonymous leads

2. **No Complex Auth**
   - No role-based access control
   - No user management system
   - No additional authentication methods

3. **Authentication Flow**
   - Admin logs in with email/password
   - All other users are anonymous
   - Session tracking for analytics only

### Development Guidelines

- DO NOT add user roles or permissions
- DO NOT create additional authenticated users
- DO NOT implement complex auth flows
- DO use anonymous session tracking for leads

## Performance Considerations

### Map Rendering
- Large datasets use clustering to improve performance
- Map markers are optimized for efficient rendering
- Map data is cached when appropriate

### Data Visualization
- Charts implement proper loading states
- Data pagination for large datasets
- Optimized re-renders using React.memo

## Troubleshooting

### Database Migration Issues

#### Anonymous Session and Payment Order Policies

If you encounter 403 Forbidden errors when creating sessions or payment orders, ensure:

1. **Session Policies**: 
   - Drop existing policies before recreating them:
   ```sql
   DROP POLICY IF EXISTS "Allow anonymous users to create sessions" ON map_sessions;
   DROP POLICY IF EXISTS "Allow users to view their own sessions" ON map_sessions;
   DROP POLICY IF EXISTS "Allow users to update their own sessions" ON map_sessions;
   ```
   - Policies should allow both anonymous and authenticated users:
   ```sql
   create policy "Allow anonymous users to create sessions"
     on map_sessions for insert
     to anon, authenticated
     with check (true);
   ```

2. **Payment Order Policies**:
   - Keep policies simple for anonymous access:
   ```sql
   create policy "Allow anonymous insert" on map_payment_orders
     for insert to anon, authenticated
     with check (true);
   ```

3. **Shared Functions**:
   - Don't recreate shared functions like `update_updated_at_column()` in migrations
   - Only create triggers that use existing functions:
   ```sql
   create trigger update_sessions_updated_at
       before update on map_sessions
       for each row
       execute function update_updated_at_column();
   ```

These solutions ensure proper anonymous access while maintaining security through session tracking.

## Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit changes (`git commit -m 'feat: Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.