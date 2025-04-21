# PayPal Multi-Party Integration Platform

A multi-tenant application built with Next.js that supports PayPal Multi-party payments. This platform allows organizations to connect their PayPal accounts and receive payments with platform fees.

## Features

- **Multi-tenant architecture**: Each organization can connect their own PayPal account
- **Platform fees**: Process payments with automatic platform fee calculation
- **Organization management**: Built-in organization switching with Clerk
- **Type-safe API**: End-to-end type safety with tRPC and TypeScript
- **Modern UI**: Beautiful interface with shadcn/ui components and TailwindCSS

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Clerk for user and organization management
- **API**: tRPC for type-safe APIs
- **UI**: shadcn/ui, TailwindCSS
- **Payment Processing**: PayPal Multi-party Integration

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- PayPal developer account
- Clerk account

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/next-paypal-multi-party.git
cd next-paypal-multi-party
```

2. Install dependencies:

```bash
pnpm install
```

3. Copy the environment variables:

```bash
cp .env.example .env.local
```

4. Update the `.env.local` file with your credentials:

   - Database URL for PostgreSQL
   - Clerk API keys
   - PayPal API credentials

5. Set up the database:

```bash
pnpm drizzle-kit generate
pnpm db:push
```

6. Run the development server:

```bash
pnpm dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## PayPal Setup

### Creating a PayPal Developer Account

1. Sign up for a [PayPal Developer Account](https://developer.paypal.com/)
2. Create a new REST API app in the [Developer Dashboard](https://developer.paypal.com/dashboard/)
3. Get your Client ID and Secret
4. Make sure to enable Third-Party Payments in your PayPal app settings

### Configuring Multi-Party Payments

1. Apply for Multi-Party capabilities by filling out the form at [PayPal Multiparty](https://developer.paypal.com/docs/multiparty/)
2. Set up your platform fee configuration in the PayPal dashboard
3. Update your environment variables with the PayPal credentials

## Deployment

The application can be deployed to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fnext-paypal-multi-party)

Make sure to add all the environment variables in your Vercel project settings.

## Usage

### Connecting a PayPal Account

1. Sign in to the platform
2. Navigate to the Dashboard
3. Select the organization you want to connect to PayPal
4. Enter your PayPal Merchant ID and other details
5. Your organization can now receive payments through the platform

### Processing Payments with Platform Fees

The application demonstrates how to:

- Create orders with platform fees
- Capture payments
- Handle webhooks for payment notifications
- Track transactions in the database

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [PayPal Developer Documentation](https://developer.paypal.com/docs/multiparty/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.dev/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [tRPC](https://trpc.io/)
