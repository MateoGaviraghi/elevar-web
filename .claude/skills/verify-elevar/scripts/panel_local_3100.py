# Ajuste local fuera del repo: el puerto 3000 está ocupado por otro proyecto; el sitio corre en 3100.
from config.settings.development import *  # noqa: F401,F403
from config.settings import development as _d

CSRF_TRUSTED_ORIGINS = [*_d.CSRF_TRUSTED_ORIGINS, "http://localhost:3100"]
CORS_ALLOWED_ORIGINS = [*getattr(_d, "CORS_ALLOWED_ORIGINS", []), "http://localhost:3100"]
