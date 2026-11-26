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


# --- Tercera tanda (2026-11-25): lo que pide Órdenes. Stripe en dólares, participantes, demoradas y devueltas. ---
def _tercera_tanda():
    if Order.objects.filter(buyer_email__startswith="semilla.orden").exists():
        print("tercera tanda ya sembrada"); return
    from orders.models import PaymentMethod
    ahora = timezone.now()
    cursos = list(Course.objects.all()[:4])
    filas = [
        # (nombre, medio, moneda, total, estado, horas desde el pago, devuelta, participantes)
        ("Prueba Stripe Uno", PaymentMethod.STRIPE, "USD", "180.00", OrderStatus.PAID, 3, False, 2),
        ("Prueba Demorada", PaymentMethod.MERCADOPAGO, "ARS", "96000.00", OrderStatus.PAID, 50, False, 1),
        ("Prueba Laboratorio Con Un Nombre Largo de Verdad SRL", PaymentMethod.MERCADOPAGO, "ARS", "144000.00", OrderStatus.PAID, 8, False, 3),
        ("Prueba Devuelta", PaymentMethod.MERCADOPAGO, "ARS", "48000.00", OrderStatus.PAID, 30, True, 1),
        ("Prueba Stripe Devuelta", PaymentMethod.STRIPE, "USD", "90.00", OrderStatus.FULFILLED, 120, True, 1),
        ("Prueba Cumplida Stripe", PaymentMethod.STRIPE, "USD", "90.00", OrderStatus.FULFILLED, 70, False, 1),
    ]
    for k, (nombre, medio, moneda, total, estado, horas, devuelta, gente) in enumerate(filas):
        pagada = ahora - timedelta(hours=horas)
        o = Order.objects.create(
            buyer_email=f"semilla.orden{k}@ejemplo.com", buyer_name=nombre, buyer_phone="3446000000", buyer_dni="30111222",
            buyer_company="Laboratorio Prueba" if k % 2 else "", status=estado, payment_method=medio, currency=moneda,
            total=Decimal(total), subtotal=Decimal(total), paid_at=pagada,
            fulfilled_at=pagada + timedelta(hours=2) if estado == OrderStatus.FULFILLED else None,
            refunded_at=pagada + timedelta(hours=5) if devuelta else None,
            mp_payment_id=f"pago-prueba-{k}" if medio == PaymentMethod.MERCADOPAGO else "",
            stripe_payment_intent_id=f"pi_prueba_{k}" if medio == PaymentMethod.STRIPE else "",
        )
        Order.objects.filter(pk=o.pk).update(created_at=pagada - timedelta(minutes=4))
        curso = cursos[k % len(cursos)]
        OrderItem.objects.create(order=o, course=curso, title_snapshot=curso.title, unit_price=Decimal(total) / gente, quantity=gente,
                                 attendees=[{"name": f"Prueba Participante {k}-{j + 1}", "email": f"semilla.orden{k}.p{j + 1}@ejemplo.com"} for j in range(gente)])
        if devuelta:
            auditoria.registrar(actor=None, accion="orden.devuelta", entidad="order", entidad_id=o.public_id,
                                detalle={"motivo": "refunded", "medio": medio, "pago": "prueba"})
    print("tercera tanda sembrada")


# --- Cuarta tanda (2026-11-25): lo que pide Inscripciones. Órdenes pagadas de cursos en vivo con su fecha y sus
# participantes: una fecha llena, una con un comprador que no cargó a su gente y una devuelta que no cuenta. ---
def _cuarta_tanda():
    if Order.objects.filter(buyer_email__startswith="semilla.vivo").exists():
        print("cuarta tanda ya sembrada"); return
    ahora = timezone.now()
    fechas = list(CourseSession.objects.filter(course__modality=Modality.LIVE, starts_at__gte=ahora, status=SessionStatus.SCHEDULED)
                  .select_related("course").order_by("starts_at")[:3])
    if len(fechas) < 3:
        print("cuarta tanda: faltan fechas en vivo"); return
    # (fecha, comprador, estado, lugares, participantes con nombre, devuelta, horas desde el pago)
    filas = [
        (0, "Prueba Laboratorio Norte", OrderStatus.FULFILLED, 2, 2, False, 200),
        (0, "Prueba Ana Vivo", OrderStatus.PAID, 2, 2, False, 20),
        (1, "Prueba Laboratorio Sur", OrderStatus.PAID, 3, 3, False, 60),
        (1, "Prueba Sin Participantes", OrderStatus.PAID, 2, 0, False, 10),
        (1, "Prueba Vivo Devuelta", OrderStatus.PAID, 1, 1, True, 90),
        (2, "Prueba María de los Ángeles Fernández Echeverría", OrderStatus.FULFILLED, 1, 1, False, 400),
    ]
    for k, (n, nombre, estado, lugares, nombrados, devuelta, horas) in enumerate(filas):
        f = fechas[n]
        pagada = ahora - timedelta(hours=horas)
        total = Decimal("48000.00") * lugares
        o = Order.objects.create(
            buyer_email=f"semilla.vivo{k}@ejemplo.com", buyer_name=nombre, buyer_phone="3446000000", status=estado,
            total=total, subtotal=total, paid_at=pagada, mp_payment_id=f"pago-vivo-{k}",
            fulfilled_at=pagada + timedelta(hours=2) if estado == OrderStatus.FULFILLED else None,
            refunded_at=pagada + timedelta(hours=5) if devuelta else None,
        )
        Order.objects.filter(pk=o.pk).update(created_at=pagada - timedelta(minutes=4))
        OrderItem.objects.create(
            order=o, course=f.course, session=f, title_snapshot=f.course.title, unit_price=Decimal("48000.00"), quantity=lugares,
            attendees=[{"name": f"Prueba Asistente {k}-{j + 1}", "email": f"semilla.vivo{k}.p{j + 1}@ejemplo.com"} for j in range(nombrados)],
        )
    # Los lugares ocupados, como los deja el aviso de pago (las devueltas los liberan). La primera queda llena.
    for n, f in enumerate(fechas):
        ocupados = sum(l for (m, _a, _b, l, _c, dev, _h) in filas if m == n and not dev)
        CourseSession.objects.filter(pk=f.pk).update(seats_taken=ocupados, capacity=ocupados if n == 0 else 20)
    print("cuarta tanda sembrada")


if YA:
    print("primera tanda ya sembrada")
else:
    _primera_tanda()
_segunda_tanda()
_tercera_tanda()
_cuarta_tanda()
