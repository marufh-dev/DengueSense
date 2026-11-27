"""Flask application factory with security headers, restricted CORS, and Blueprints."""

from flask import Flask, jsonify, request
from flask_cors import CORS
from app.config import Config
from app.routes.alerts import alerts_bp
from app.routes.auth_routes import auth_bp
from app.routes.data_health import data_health_bp
from app.routes.districts import districts_bp
from app.routes.health import health_bp
from app.routes.moderation import moderation_bp
from app.routes.reports import reports_bp
from app.routes.admin import admin_bp


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
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
        if request.path.startswith(("/api/auth", "/api/alerts", "/api/moderation", "/api/admin")):
            response.headers["Cache-Control"] = "no-store"
        if Config.FLASK_ENV == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(districts_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(moderation_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(data_health_bp)
    app.register_blueprint(admin_bp)

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
