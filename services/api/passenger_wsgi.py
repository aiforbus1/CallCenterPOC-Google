"""
Passenger WSGI Entrypoint for CloudLinux / cPanel / Namecheap Python App.
Wraps the FastAPI ASGI application into standard WSGI using a2wsgi.
"""
import os
import sys
import logging
from pathlib import Path

# Set up logging for cPanel Passenger stderr/stdout
logging.basicConfig(stream=sys.stderr, level=logging.INFO)
logger = logging.getLogger("passenger_wsgi")

# 1. Add application directory and parent to sys.path
APP_DIR = Path(__file__).resolve().parent
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

# 2. Load environment variables from .env if present
from dotenv import load_dotenv
env_path = APP_DIR / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=True)
    logger.info(f"Loaded environment variables from {env_path}")
else:
    logger.warning(f"No .env file found at {env_path}. Using system environment variables.")

# 3. Import FastAPI ASGI application
try:
    from app.main import app as asgi_app
except Exception as e:
    logger.critical(f"Failed to import FastAPI 'app' from app.main: {e}", exc_info=True)
    raise

# 4. Wrap ASGI app with a2wsgi for CloudLinux Phusion Passenger
try:
    from a2wsgi import ASGIMiddleware
    # CloudLinux Passenger expects 'application'
    application = ASGIMiddleware(asgi_app)
    logger.info("FastAPI successfully adapted to WSGI via a2wsgi for cPanel Passenger.")
except ImportError:
    logger.error("a2wsgi is not installed. Please install it via: pip install a2wsgi")
    def application(environ, start_response, exc_info=None):
        status = '500 Internal Server Error'
        output = b"500 Internal Server Error: 'a2wsgi' package is required on cPanel Passenger. Run: pip install a2wsgi"
        headers = [('Content-Type', 'text/plain; charset=utf-8'), ('Content-Length', str(len(output)))]
        start_response(status, headers, exc_info)
        return [output]
