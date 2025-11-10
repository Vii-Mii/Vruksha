# Vruksha Services Platform

A comprehensive full-stack service platform for Chennai, offering online services, catering, beauty services, pooja items, flower decoration, tuition, clothing, and toys.

## Tech Stack

- **Frontend**: React 18 with React Router
- **Backend**: Python FastAPI
- **Database**: SQLite
- **Styling**: Custom CSS with white minimalist design and golden accents

## Features

### Service Categories
1. **Online Services** - PAN Card, Passport, Aadhar, Driving License
2. **Catering Services** - Weddings, Corporate Events, Parties
3. **Beautician Services** - Makeup, Hair Styling, Facials, Mehndi
4. **Pooja Services** - Pooja items store and booking services
5. **Flower Decoration** - Wedding and event decorations
6. **Tuition Services** - Classes 9-12, all boards and subjects
7. **Clothing Store** - Women's clothing e-commerce
8. **Toys Store** - Educational and fun toys e-commerce

### Additional Pages
- Homepage with service categories
- About Us
- Contact Us
- Shopping Cart
- Checkout

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the backend server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Project Structure

```
Vruksha/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── vruksha.db          # SQLite database (created on first run)
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Features Overview

### E-commerce Functionality
- Add to cart (localStorage + backend)
- Shopping cart with quantity management
- Checkout with delivery details
- Product filtering (category, price, size, age)

### Service Booking
- Inquiry forms for all services
- Booking forms with date/time selection
- Form validation
- Backend API integration

### Design
- White minimalist design
- Golden accents (#D4AF37)
- Responsive mobile-friendly layout
- Modern UI/UX

## API Endpoints

### Products
- `GET /api/products` - Get all products (optional category filter)
- `GET /api/products/{id}` - Get product by ID

### Services
- `GET /api/services` - Get all services (optional category filter)

### Bookings
- `POST /api/bookings` - Create a booking

### Inquiries
- `POST /api/inquiries` - Submit an inquiry

### Orders
- `POST /api/orders` - Place an order

## Database Schema

- **products** - Product information (clothing, toys, pooja items)
- **services** - Service information and pricing
- **bookings** - Service bookings
- **inquiries** - Customer inquiries
- **orders** - E-commerce orders

## Development Notes

- The backend automatically creates sample data on first startup
- Cart is stored in localStorage for persistence
- All forms submit to the backend API
- CORS is enabled for localhost development

## Future Enhancements

- User authentication
- Payment gateway integration
- Order tracking
- Product reviews
- Admin dashboard
- Email notifications

## License

This project is created for demonstration purposes.

