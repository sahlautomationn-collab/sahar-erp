# SAHAR ERP System

A comprehensive Restaurant Management System built with Next.js 16, React 19, and Supabase.

## 🚀 Features

- **Dashboard** - Real-time financial performance and orders summary
- **Point of Sale (POS)** - Easy order management and checkout
- **Menu Management** - Complete menu item management with image upload
- **Inventory Tracking** - Real-time inventory monitoring and alerts
- **Kitchen Display** - Order preparation workflow
- **Financial Reports** - Income, expenses, and profit tracking
- **Customer Management** - Customer database and history
- **Recipe Management** - Cost calculation and recipe tracking
- **Supplier Management** - Vendor information and orders

## 🛠️ Tech Stack

- **Frontend**: Next.js 16.1.1, React 19.2.3
- **Backend**: Supabase (PostgreSQL database + Auth + Storage)
- **Styling**: Tailwind CSS v4
- **Icons**: Font Awesome, Lucide React
- **Notifications**: Toastify JS
- **Fonts**: Tajawal (Arabic), Poppins (English)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ and npm
- Git
- A Supabase account (free tier works)

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd sahar-erp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application Settings
NEXT_PUBLIC_APP_NAME=SAHAR ERP
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Copy your project URL and anon key to `.env.local`

2. **Create Database Tables**

Run the following SQL in your Supabase SQL Editor (see `database-setup.sql` for complete schema):

```sql
-- Users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Menu table
CREATE TABLE IF NOT EXISTS menu (
  id INTEGER PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  category TEXT DEFAULT 'hot',
  price DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2) DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  image TEXT,
  is_available BOOLEAN DEFAULT true,
  is_trending BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  order_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  customer_name TEXT,
  table_number INTEGER,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'Visa', 'Electronic')),
  is_paid BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'completed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- And more tables (order_items, customers, inventory, suppliers, recipes, expenses)
```

3. **Create Storage Bucket**

Create a public storage bucket named `menu_images` for uploading menu item images.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Usage

### First Time Setup

1. **Create an Admin User**
   - Sign up at `/login` or use Supabase Auth to create a user
   - Manually assign admin role in the `user_roles` table:
   ```sql
   INSERT INTO user_roles (id, role)
   VALUES ('your-user-uuid', 'admin');
   ```

2. **Login**
   - Go to [http://localhost:3000/login](http://localhost:3000/login)
   - Enter your credentials
   - You'll be redirected to the admin dashboard

### Managing Menu Items

1. Navigate to **Menu** section
2. Fill in the form with item details:
   - Name (Arabic & English)
   - Category
   - Price, Discount, Cost
   - Upload image
3. Click **Add** to create the item

### Processing Orders

1. Navigate to **POS** section
2. Select items from the menu
3. Choose customer or add walk-in
4. Select payment method
5. Click **Place Order**

### Tracking Inventory

1. Navigate to **Inventory** section
2. View current stock levels
3. Add new inventory items
4. Set minimum quantity alerts
5. Track supplier information

## 🔒 Security Features

- **Input Validation** - All user inputs are validated before processing
- **Input Sanitization** - Prevents XSS and injection attacks
- **Authentication** - Secure login with Supabase Auth
- **Session Management** - Automatic session timeout after 24 hours
- **Error Boundaries** - Graceful error handling
- **Environment Variables** - Sensitive data stored in `.env.local`

## 🛡️ What's Been Fixed

All critical issues have been addressed:

### ✅ Security Improvements
- Moved API credentials to environment variables
- Added input validation on all forms
- Implemented input sanitization to prevent XSS
- Added authentication middleware
- Improved session management

### ✅ Code Quality
- Replaced all `alert()` with user-friendly toast notifications
- Replaced all `console.error()` with proper logging system
- Added error boundaries for graceful error handling
- Standardized error handling across all components
- Added validation utilities

### ✅ Developer Experience
- Created comprehensive documentation
- Added environment configuration
- Implemented reusable utilities (validation, sanitization, logging, toast)
- Fixed inconsistent import paths
- Added proper TypeScript-ready structure (future migration)

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Missing Supabase environment variables"
- **Solution**: Ensure `.env.local` file exists and contains valid Supabase credentials

**Issue**: "Authentication failed"
- **Solution**: Check that your user has a role assigned in the `user_roles` table

**Issue**: "Images not uploading"
- **Solution**: Ensure the `menu_images` bucket exists in Supabase Storage and is set to public

**Issue**: "Build errors"
- **Solution**: Delete `.next` folder and run `npm run dev` again

## 📦 Building for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
sahar-erp/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── admin/        # Admin dashboard sections
│   │   ├── login/        # Login page
│   │   └── layout.js     # Root layout with ErrorBoundary
│   ├── components/       # React components
│   │   ├── Dashboard.js
│   │   ├── Menu.js
│   │   ├── Finance.js
│   │   ├── Orders.js
│   │   ├── POS.js
│   │   └── ...
│   └── lib/              # Utility libraries
│       ├── supabase.js   # Database client (uses env vars)
│       ├── utils.js      # Validation & sanitization
│       ├── logger.js     # Structured logging
│       ├── toast.js      # Toast notifications
│       └── auth.js       # Authentication & session management
├── .env.local            # Environment variables (create this)
├── package.json
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support, email support@saharcoffee.com or open an issue in the repository.

## 🙏 Acknowledgments

- Supabase for the amazing backend infrastructure
- Next.js team for the excellent framework
- Font Awesome for icons
- All contributors and users of SAHAR ERP

---

**Version**: 1.0.0
**Last Updated**: January 2026
