# Datos INVENTADOS para mirar el Inicio en local (solo base elevar_e2e). Nombres «Prueba …», correos @ejemplo.com.
import random
from datetime import timedelta, datetime, time
from decimal import Decimal
from django.conf import settings
assert settings.DATABASES["default"]["NAME"] == "elevar_e2e", "solo base local"
from django.utils import timezone
from zoneinfo import ZoneInfo
from leads.models import Lead, LeadSource, LeadStatus
from orders.models import Order, OrderItem, OrderStatus
from catalog.models import Course, CourseSession, Modality, SessionStatus, WebinarRegistration
from panel import auditoria
from django.contrib.auth import get_user_model
AR = ZoneInfo("America/Argentina/Cordoba")
random.seed(7)
YA = Lead.objects.filter(email__startswith="semilla.").exclude(email__startswith="semilla.extra").exists()
u = get_user_model().objects.get(username="visor.local@ejemplo.com")
def _primera_tanda():
    hoy = timezone.localtime(timezone.now(), AR).date()
    fuentes = [s for s, _ in LeadSource.choices]
    leads = []
    for d in range(365):
        dia = hoy - timedelta(days=d)
        base = 1.2 + 1.6 * (1 - d / 365)  # viene creciendo
        if dia.weekday() >= 5: base *= 0.35
        for i in range(max(0, int(random.gauss(base, 1.2)))):
            hora = random.choice([9, 10, 10, 11, 11, 12, 14, 15, 15, 16, 17, 18, 20, 22])
            cuando = datetime.combine(dia, time(hora, random.randint(0, 59)), AR)
            estado = LeadStatus.NEW if d < 6 and random.random() < .7 else random.choice([s for s, _ in LeadStatus.choices])
            leads.append((Lead(name=f"Prueba Consulta {len(leads)+1}", email=f"semilla.{len(leads)+1}@ejemplo.com",
                               company=random.choice(["", "Laboratorio Prueba", "Lab Ficticio SA"]), source=random.choice(fuentes),
                               status=estado, subject="Consulta de prueba"), cuando))
    Lead.objects.bulk_create([l for l, _ in leads])
    for l, c in zip(Lead.objects.filter(email__startswith="semilla.").order_by("id"), [c for _, c in leads]):
        Lead.objects.filter(pk=l.pk).update(created_at=c)
    cursos = list(Course.objects.all()[:14])
    pesos = [3, 3, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1][:len(cursos)]
    n = 0
    for d in range(365):
        if random.random() > 0.22 + 0.2 * (1 - d / 365): continue
        dia = hoy - timedelta(days=d)
        cuando = datetime.combine(dia, time(random.randint(9, 21), random.randint(0, 59)), AR)
        curso = random.choices(cursos, weights=pesos)[0]; lugares = random.choice([1, 1, 1, 2, 3])
        usd = random.random() < .15
        precio = Decimal(random.choice(["180.00", "240.00"])) if usd else Decimal(random.choice(["48000.00", "65000.00", "92000.00"]))
        estado = OrderStatus.PAID if d < 10 and random.random() < .5 else OrderStatus.FULFILLED
        n += 1
        o = Order.objects.create(buyer_email=f"semilla.compra{n}@ejemplo.com", buyer_name=f"Prueba Comprador {n}", status=estado,
                                 subtotal=precio * lugares, total=precio * lugares, currency="USD" if usd else "ARS", paid_at=cuando)
        Order.objects.filter(pk=o.pk).update(created_at=cuando)
        OrderItem.objects.create(order=o, course=curso, title_snapshot=curso.title, unit_price=precio, quantity=lugares)
    web = Course.objects.filter(modality=Modality.WEBINAR).first() or cursos[0]
    for i, dias in enumerate([3, 9, 17]):
        s = CourseSession.objects.create(course=web, starts_at=timezone.now() + timedelta(days=dias), ends_at=timezone.now() + timedelta(days=dias, hours=2),
                                         status=SessionStatus.SCHEDULED, capacity=[60, 40, 80][i])
        for k in range([47, 12, 31][i]):
            WebinarRegistration.objects.create(session=s, name=f"Prueba Inscripta {i}-{k}", email=f"semilla.ins{i}-{k}@ejemplo.com")
    for accion, ent in [("consulta.estado", "lead"), ("orden.cumplida", "order"), ("curso.cambio", "course"), ("consulta.estado", "lead"), ("fecha.alta", "course_session")]:
        auditoria.registrar(actor=u, accion=accion, entidad=ent, entidad_id=1)
    print("sembrado:", len(leads), "consultas,", n, "compras")



# --- Segunda tanda (2026-11-24): lo que piden los tres pisos del Inicio. No se repite. ---
def _segunda_tanda():
    if Lead.objects.filter(email__startswith="semilla.extra").exists():
        print("segunda tanda ya sembrada"); return
    ahora = timezone.now()
    # Un pedido de arrepentimiento sin contestar, de hace 5 horas (vence en 19).
    a = Lead.objects.create(name="Prueba Arrepentimiento", email="semilla.extra.arrep@ejemplo.com",
                            source=LeadSource.ARREPENTIMIENTO, status=LeadStatus.NEW, subject="Arrepentimiento de prueba")
    Lead.objects.filter(pk=a.pk).update(created_at=ahora - timedelta(hours=5))
    # Compras que no se completaron: fallidas, canceladas y pendientes viejas.
    for k, (estado, horas) in enumerate([(OrderStatus.FAILED, 30), (OrderStatus.PENDING, 6), (OrderStatus.CANCELLED, 80),
                                         (OrderStatus.FAILED, 200), (OrderStatus.PENDING, 400), (OrderStatus.FAILED, 9)]):
        o = Order.objects.create(buyer_email=f"semilla.extra.intento{k}@ejemplo.com", buyer_name=f"Prueba Intento {k + 1}",
                                 status=estado, total=Decimal("65000.00"), subtotal=Decimal("65000.00"))
        Order.objects.filter(pk=o.pk).update(created_at=ahora - timedelta(hours=horas))
    # Las inscripciones al próximo webinar repartidas en los últimos 20 días, para el ritmo.
    prox = CourseSession.objects.filter(starts_at__gte=ahora, status=SessionStatus.SCHEDULED).order_by("starts_at").first()
    if prox:
        for k, r in enumerate(WebinarRegistration.objects.filter(session=prox).order_by("id")):
            WebinarRegistration.objects.filter(pk=r.pk).update(created_at=ahora - timedelta(days=20 - (k * 20) // 47, hours=k % 5))
    # Algunas inscriptas que después compraron (mismo correo, pago posterior).
    regs = list(WebinarRegistration.objects.filter(email__startswith="semilla.ins").order_by("id")[:9])
    curso = Course.objects.first()
    for r in regs:
        o = Order.objects.create(buyer_email=r.email, buyer_name=r.name, status=OrderStatus.FULFILLED,
                                 total=Decimal("65000.00"), subtotal=Decimal("65000.00"), paid_at=ahora - timedelta(hours=3))
        OrderItem.objects.create(order=o, course=curso, title_snapshot=curso.title, unit_price=Decimal("65000.00"), quantity=1)
    # Consultas contestadas desde el panel, para el tiempo de respuesta (la auditoría queda con la hora de ahora).
    for horas in (2, 3, 5, 8, 26, 40):
        lead = Lead.objects.create(name="Prueba Contestada", email=f"semilla.extra.resp{horas}@ejemplo.com",
                                   source=LeadSource.CONTACTO, status=LeadStatus.CONTACTED)
        Lead.objects.filter(pk=lead.pk).update(created_at=ahora - timedelta(hours=horas))
        auditoria.registrar(actor=u, accion="consulta.estado", entidad="lead", entidad_id=lead.pk)
    print("segunda tanda sembrada")



if YA:
    print("primera tanda ya sembrada")
else:
    _primera_tanda()
_segunda_tanda()
