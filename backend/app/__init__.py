"""Flask application factory with security headers and restricted CORS."""

from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = Config.MAX_CONTENT_LENGTH

    CORS(
        app,
        resources={r"/api/*": {"origins": Config.ALLOWED_ORIGINS}},
        supports_credentials=False,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    @app.after_request
    def apply_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if Config.FLASK_ENV == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "service": "denguesense-api"}), 200

    @app.errorhandler(404)
    def not_found(_err):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(413)
    def payload_too_large(_err):
        return jsonify({"error": "Payload too large (max 6 MB)"}), 413

    @app.errorhandler(500)
    def internal_error(_err):
        return jsonify({"error": "Internal server error"}), 500

    return app
