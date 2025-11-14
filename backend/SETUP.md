# Backend Setup Guide

## Step 1: Navigate to Backend Directory
```bash
cd backend
```

## Step 2: Create Virtual Environment

### For macOS/Linux:
```bash
python3 -m venv venv
```

### For Windows:
```bash
python -m venv venv
```

This creates a `venv` folder in your backend directory.

## Step 3: Activate Virtual Environment

### For macOS/Linux:
```bash
source venv/bin/activate
```

### For Windows (Command Prompt):
```bash
venv\Scripts\activate
```

### For Windows (PowerShell):
```bash
venv\Scripts\Activate.ps1
```

**Note:** When activated, you'll see `(venv)` at the beginning of your terminal prompt.

## Step 4: Install Requirements
```bash
pip install -r requirements.txt
```

This will install all the packages listed in `requirements.txt`:
- fastapi
- uvicorn
- sqlalchemy
- pydantic
- python-multipart

## Step 5: Run the Backend Server
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload
```

The server will start at `http://localhost:8000`

## Step 6: Deactivate Virtual Environment (when done)
```bash
deactivate
```

## SMTP & Admin email setup

If you want the app to send email notifications to admins (new orders, bookings, inquiries), set these environment variables before starting the backend. The `send_email` helper reads these at send time.

Example (zsh / macOS):

```bash
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"       # or 465 for SSL
export SMTP_USER="your-smtp-username@example.com"
export SMTP_PASS="your-smtp-password-or-app-password"
# Optional: control STARTTLS behaviour (true by default)
export SMTP_USE_TLS="true"

# Configure admin recipients (comma-separated)
export ADMIN_NOTIFICATION_EMAILS="admin1@example.com,admin2@example.com"
```

Notes:
- For Gmail, use an App Password (recommended) and ensure the account allows SMTP connections.
- The backend will raise a clear error if SMTP_HOST/SMTP_USER/SMTP_PASS are not set when attempting to send.

Quick test: start the backend, then trigger an inquiry or booking from the frontend or use a curl call to the inquiries endpoint:

```bash
curl -X POST "http://localhost:8000/api/inquiries" -H "Content-Type: application/json" -d '{"service_name":"Test","customer_name":"You","email":"you@example.com","phone":"9999999999","message":"Hello"}'
```

The backend will attempt to send an admin notification email and also persist an in-app admin notification.

## Cloudinary / Image uploads

To upload product images to Cloudinary (recommended), set these environment variables before starting the backend:

```bash
export CLOUDINARY_CLOUD_NAME="your_cloud_name"
export CLOUDINARY_API_KEY="your_api_key"
export CLOUDINARY_API_SECRET="your_api_secret"
```

The admin UI uploads images via the backend `/api/upload` endpoint. If Cloudinary is configured, the backend forwards the file to Cloudinary and returns a JSON response `{ "image_url": "https://..." }`. If Cloudinary is not configured or the upload fails, the backend saves the file locally under `backend/static/uploads/` and returns a relative URL like `/static/uploads/<filename>`.

Quick upload test using curl:

```bash
curl -F "file=@/path/to/test.jpg" http://localhost:8000/api/upload
```

If you run frontend and backend on different origins, note that local fallback URLs are returned as relative paths (`/static/uploads/...`). Either serve frontend from the same origin or update the frontend to prefix the backend origin when an image URL starts with `/static/`.

## Troubleshooting

### If `python3` command not found:
- Try `python` instead
- Make sure Python 3.7+ is installed

### If `pip` command not found:
- Try `pip3` instead
- On some systems: `python -m pip install -r requirements.txt`

### If you get permission errors:
- Make sure you're using a virtual environment (not installing globally)
- Check that the venv is activated

### If you need to recreate the virtual environment:
```bash
# Remove the old one
rm -rf venv  # macOS/Linux
# or
rmdir /s venv  # Windows

# Create a new one
python3 -m venv venv  # macOS/Linux
python -m venv venv   # Windows
```

