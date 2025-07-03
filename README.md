# Wellcheck.io

A modern web application designed to automate and streamline welfare check calls to service users through automated voice interactions.

## Overview

Wellcheck.io helps organizations and caregivers maintain regular contact with their service users through automated welfare check calls. The system uses voice AI technology to make calls, gather responses, and track the well-being of service users.

## Features

- **Service User Management**: Add and manage service users with their contact information
- **Automated Welfare Calls**: Schedule and initiate automated check-in calls
- **Real-time Status Tracking**: Monitor call statuses (pending, initialized, failed)
- **Dashboard Analytics**: View statistics and trends of welfare calls
- **Voice AI Integration**: Utilizes VAPI for natural voice interactions

## Important Requirements

### Phone Number Format

⚠️ **CRITICAL**: Service users' phone numbers must be in US format to work properly. The application uses VAPI which currently only supports US phone numbers.

Valid phone number formats:
- +1XXXXXXXXXX
- 1XXXXXXXXXX
- XXXXXXXXXX (will be automatically prefixed with +1)

Example: `+14155552671` or `4155552671`

## Technical Stack

- **Frontend**: React with TypeScript
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **Voice Service**: VAPI AI
- **Deployment**: Vercel

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd mindful-welfare-pilot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_VAPI_API_KEY=your_vapi_api_key
```

4. Run the development server:
```bash
npm run dev
```

## Call Status Meanings

- **Pending**: Call is queued but not yet initiated
- **Initialized**: Call has been successfully initiated and is either in progress or completed
- **Failed**: Call failed to connect or encountered an error

## Security & Privacy

- All data is stored securely in Supabase
- User authentication is required
- Call recordings and transcripts are handled according to privacy standards
- Service user data is protected with row-level security

## Support

For issues or questions:
1. Check the documentation
2. Open an issue in the repository
3. Contact the development team

## License

This project is licensed under the MIT License - see the LICENSE file for details
