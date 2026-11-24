# Usuario local inventado para mirar el panel (solo base elevar_e2e). Escribe clave y secreto en un archivo, no los imprime.
import secrets, json, os
from django.conf import settings
assert settings.DATABASES["default"]["NAME"] == "elevar_e2e", "solo base local"
from django.contrib.auth import get_user_model
from django_otp.plugins.otp_totp.models import TOTPDevice
from panel.models import Perfil
email = "visor.local@ejemplo.com"
User = get_user_model()
u, _ = User.objects.get_or_create(username=email, defaults={"email": email, "first_name": "Visor"})
clave = secrets.token_urlsafe(12); u.set_password(clave); u.first_name = "Visor"; u.save()
p, _ = Perfil.objects.get_or_create(user=u, defaults={"email": email, "rol": "admin"})
p.debe_cambiar_clave = False; p.segundo_factor_listo = True; p.clave_temporal_vence = None; p.save()
TOTPDevice.objects.filter(user=u).delete()
d = TOTPDevice.objects.create(user=u, name="panel", confirmed=True)
json.dump({"email": email, "clave": clave, "key": d.key}, open(os.environ["SALIDA_VISOR"], "w"))
print("visor listo")
