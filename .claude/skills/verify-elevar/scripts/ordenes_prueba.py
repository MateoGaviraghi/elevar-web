# Órdenes de prueba de la pantalla de la orden (solo base elevar_e2e). Dos modos, por variable de entorno:
#   MODO=devolver ORDENES=<carpeta>/ordenes.json  → devuelve la orden «devuelta» por el mismo camino que el
#       aviso de Mercado Pago (apply_payment_outcome con «refunded»): queda refunded_at y se liberan los lugares.
#   MODO=borrar                                   → borra las órdenes con correo prueba.<estado>@ejemplo.com.
# Se corre con: manage.py shell -c "exec(open(r'<skill>/scripts/ordenes_prueba.py', encoding='utf-8').read())"
import json, os
from django.conf import settings
assert settings.DATABASES["default"]["NAME"] == "elevar_e2e", "solo base local"
from django.db import transaction
from orders.models import Order
from orders.services import apply_payment_outcome

modo = os.environ.get("MODO")
if modo == "devolver":
    pid = json.load(open(os.environ["ORDENES"], encoding="utf-8"))["devuelta"]
    with transaction.atomic():
        o = Order.objects.select_for_update().get(public_id=pid)
        print("devolución:", apply_payment_outcome(o, mp_status="refunded", mp_payment_id=o.mp_payment_id))
elif modo == "borrar":
    correos = [f"prueba.{e}@ejemplo.com" for e in ("pagada", "devuelta", "fallida", "pendiente")]
    print("borradas:", Order.objects.filter(buyer_email__in=correos).delete())
else:
    raise SystemExit("MODO=devolver o MODO=borrar")
