# Datos INVENTADOS para las pruebas de punta a punta del panel (base local elevar_e2e).
# Se corre con `manage.py shell` desde tests-e2e/panel/ayudas.ts. Crea datos nuevos en cada corrida
# (RUN_ID) y al final imprime una línea JSON con lo que las pruebas necesitan.
import json
import os
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from catalog.models import Category, Course, CourseSession, Modality, WebinarRegistration
from leads.models import Lead, LeadSource
from orders.models import Order, OrderItem, OrderStatus

corrida = os.environ["RUN_ID"]
ahora = timezone.now()
categoria, _ = Category.objects.get_or_create(slug="pruebas-e2e", defaults={"name": "Pruebas E2E", "order": 99})

consulta = Lead.objects.create(
    name=f"Comunidad Prueba {corrida}", email=f"comunidad.{corrida}@ejemplo.com", company="Lab Ficticio",
    phone="+54 9 3446 000000", source=LeadSource.COMUNIDAD,
)
Lead.objects.create(name=f"Formulario Prueba {corrida}", email=f"form.{corrida}@ejemplo.com",
                    message="Consulta inventada", source=LeadSource.CONTACTO)

webinar = Course.objects.create(
    code=f"W{corrida[-6:]}", title=f"Webinar de prueba {corrida}", slug=f"webinar-prueba-{corrida}",
    category=categoria, modality=Modality.WEBINAR, price=Decimal("0"), is_published=True,
)
fecha_webinar = CourseSession.objects.create(
    course=webinar, starts_at=ahora + timedelta(days=3), ends_at=ahora + timedelta(days=3, hours=2), capacity=80,
)
for i in range(3):
    WebinarRegistration.objects.create(session=fecha_webinar, email=f"inscripto{i}.{corrida}@ejemplo.com",
                                       name=f"Inscripto {i} {corrida}")

en_vivo = Course.objects.create(
    code=f"V{corrida[-6:]}", title=f"Curso en vivo de prueba {corrida}", slug=f"curso-vivo-prueba-{corrida}",
    category=categoria, modality=Modality.LIVE, price=Decimal("48000.00"), is_published=True,
    objectives="Objetivos inventados.",
)

orden = Order.objects.create(
    buyer_email=f"comprador.{corrida}@ejemplo.com", buyer_name=f"Comprador {corrida}", buyer_dni="30123456",
    status=OrderStatus.PAID, subtotal=Decimal("48000.00"), total=Decimal("48000.00"), paid_at=ahora,
)
OrderItem.objects.create(order=orden, course=en_vivo, title_snapshot=en_vivo.title, unit_price=Decimal("48000.00"))

print("DATOS " + json.dumps({
    "consulta": consulta.name,
    "webinar": webinar.title,
    "inscriptos": 3,
    "curso_id": en_vivo.pk,
    "curso_slug": en_vivo.slug,
    "orden": str(orden.public_id),
}))
