# main.py - Backend completo con autenticación y test CSI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, List
import jwt
import hashlib
from datetime import datetime, timedelta
import uuid

# ============================================
# CONFIGURACIÓN
# ============================================

app = FastAPI(
    title="API Sistema CSI",
    description="Backend para el test CSI con autenticación completa",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "tu-clave-super-secreta-cambiala-en-produccion"
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

security = HTTPBearer()

# ============================================
# BASE DE DATOS SIMULADA
# ============================================

usuarios_db = {}  # {email: {datos_usuario}}
codigos_recuperacion = {}  # {email: codigo}
tests_db = {}  # {test_id: {datos_test}}
respuestas_db = {}  # {test_id: {pregunta: respuesta}}

# ============================================
# SERVICIO DE CÁLCULO CSI
# ============================================

class CSIScoringService:
    """Calcula e interpreta los resultados del test CSI"""
    
    PERCENTILE_TABLE = {
        'REP': {0: 1, 1: 1, 2: 1, 3: 2, 4: 3, 5: 5, 6: 7, 7: 10, 8: 14, 9: 18, 10: 25, 11: 32, 12: 40, 13: 48, 14: 55, 15: 62, 16: 70, 17: 77, 18: 84, 19: 91, 20: 99},
        'AUC': {0: 1, 1: 2, 2: 4, 3: 7, 4: 11, 5: 16, 6: 23, 7: 30, 8: 38, 9: 46, 10: 54, 11: 62, 12: 70, 13: 77, 14: 84, 15: 89, 16: 93, 17: 96, 18: 98, 19: 99, 20: 99},
        'EEM': {0: 2, 1: 5, 2: 9, 3: 14, 4: 20, 5: 27, 6: 35, 7: 43, 8: 51, 9: 59, 10: 67, 11: 74, 12: 80, 13: 86, 14: 91, 15: 94, 16: 97, 17: 98, 18: 99, 19: 99, 20: 99},
        'PSD': {0: 1, 1: 3, 2: 6, 3: 10, 4: 15, 5: 21, 6: 28, 7: 36, 8: 44, 9: 52, 10: 60, 11: 68, 12: 75, 13: 81, 14: 87, 15: 92, 16: 95, 17: 97, 18: 99, 19: 99, 20: 99},
        'APS': {0: 2, 1: 4, 2: 8, 3: 13, 4: 19, 5: 26, 6: 34, 7: 42, 8: 50, 9: 58, 10: 66, 11: 73, 12: 80, 13: 86, 14: 91, 15: 94, 16: 97, 17: 98, 18: 99, 19: 99, 20: 99},
        'REC': {0: 1, 1: 2, 2: 4, 3: 7, 4: 11, 5: 16, 6: 22, 7: 29, 8: 37, 9: 45, 10: 53, 11: 61, 12: 69, 13: 76, 14: 83, 15: 89, 16: 93, 17: 96, 18: 98, 19: 99, 20: 99},
        'EVP': {0: 3, 1: 6, 2: 11, 3: 17, 4: 24, 5: 32, 6: 40, 7: 48, 8: 56, 9: 64, 10: 71, 11: 78, 12: 84, 13: 89, 14: 93, 15: 96, 16: 98, 17: 99, 18: 99, 19: 99, 20: 99},
        'RES': {0: 4, 1: 8, 2: 13, 3: 19, 4: 26, 5: 34, 6: 42, 7: 50, 8: 58, 9: 66, 10: 73, 11: 79, 12: 85, 13: 90, 14: 94, 15: 96, 16: 98, 17: 99, 18: 99, 19: 99, 20: 99}
    }
    
    INDICATOR_QUESTIONS = {
        'REP': [1, 9, 17, 25, 33],
        'AUC': [2, 10, 18, 26, 34],
        'EEM': [3, 11, 19, 27, 35],
        'PSD': [4, 12, 20, 28, 36],
        'APS': [5, 13, 21, 29, 37],
        'REC': [6, 14, 22, 30, 38],
        'EVP': [7, 15, 23, 31, 39],
        'RES': [8, 16, 24, 32, 40]
    }
    
    INTERPRETATIONS = {
        'REP': {
            'name': 'Resolución de Problemas',
            'high': 'Se presenta un puntaje alto, lo cual sugiere una tendencia activa y constructiva hacia el manejo de situaciones estresantes. La persona tiende a enfrentar los problemas de manera directa, buscando soluciones prácticas y efectivas.'
        },
        'AUC': {
            'name': 'Autocrítica',
            'high': 'Se presenta un puntaje alto, esto puede reflejar una tendencia marcada de la persona a responsabilizarse en exceso por las dificultades que enfrenta. Puede mostrar auto señalamientos, sentimientos de culpa y percepciones negativas sobre su propio desempeño.'
        },
        'EEM': {
            'name': 'Expresión Emocional',
            'high': 'Se presenta un puntaje alto, lo cual indica que la persona tiende a liberar y comunicar sus emociones de manera frecuente. Esto puede ser adaptativo en contextos de apoyo, pero también puede volverse problemático si la expresión emocional es excesiva.'
        },
        'PSD': {
            'name': 'Pensamiento Desiderativo',
            'high': 'Se presenta un puntaje alto, esto puede sugerir que la persona recurre frecuentemente a deseos o fantasías sobre cómo le gustaría que fuera la situación. Aunque esto puede proporcionar un alivio temporal, generalmente no contribuye a resolver el problema.'
        },
        'APS': {
            'name': 'Apoyo Social',
            'high': 'Se presenta un puntaje alto, lo cual refleja una disposición a buscar y aprovechar el soporte de otras personas. Este estilo de afrontamiento suele ser beneficioso, ya que permite compartir la carga emocional y fortalecer las redes de apoyo.'
        },
        'REC': {
            'name': 'Reestructuración Cognitiva',
            'high': 'Se presenta un puntaje alto, esto indica que la persona tiende a reformular mentalmente las situaciones estresantes para verlas desde una perspectiva más positiva o manejable. Esta estrategia cognitiva suele ser adaptativa.'
        },
        'EVP': {
            'name': 'Evitación de Problemas',
            'high': 'Se presenta un puntaje alto, esto puede sugerir una inclinación a esquivar o posponer la confrontación directa de los problemas. Aunque a corto plazo esto disminuya la tensión, a largo plazo tiende a perpetuar el estrés.'
        },
        'RES': {
            'name': 'Retirada Social',
            'high': 'Se presenta un puntaje alto, esto puede reflejar que la persona tiende a aislarse y reducir el contacto con su entorno. Este patrón puede dificultar el acceso a redes de apoyo y limitar las oportunidades de recibir ayuda externa.'
        }
    }
    
    def calculate_scores(self, responses: Dict[int, int]) -> Dict:
        """Calcula las puntuaciones del CSI"""
        raw_scores = {}
        for indicator, questions in self.INDICATOR_QUESTIONS.items():
            raw_scores[indicator] = sum(responses.get(q, 0) for q in questions)
        
        percentiles = {}
        for indicator, raw_score in raw_scores.items():
            raw_score = min(max(raw_score, 0), 20)
            percentiles[indicator] = self.PERCENTILE_TABLE[indicator].get(raw_score, 50)
        
        levels = {}
        for indicator, percentile in percentiles.items():
            if percentile < 35:
                levels[indicator] = 'Bajo'
            elif percentile <= 64:
                levels[indicator] = 'Medio'
            else:
                levels[indicator] = 'Alto'
        
        interpretations = {}
        for indicator, level in levels.items():
            if level == 'Alto':
                interpretations[indicator] = {
                    'name': self.INTERPRETATIONS[indicator]['name'],
                    'interpretation': self.INTERPRETATIONS[indicator]['high']
                }
        
        return {
            'raw_scores': raw_scores,
            'percentiles': percentiles,
            'levels': levels,
            'interpretations': interpretations,
            'summary': {
                'high_count': sum(1 for l in levels.values() if l == 'Alto'),
                'medium_count': sum(1 for l in levels.values() if l == 'Medio'),
                'low_count': sum(1 for l in levels.values() if l == 'Bajo')
            }
        }

scoring_service = CSIScoringService()

# ============================================
# MODELOS DE DATOS
# ============================================

class UsuarioRegistro(BaseModel):
    nombre: str
    primerApellido: str
    segundoApellido: Optional[str] = None
    email: EmailStr
    password: str
    telefono: Optional[str] = None

class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str

class CambioPassword(BaseModel):
    email: EmailStr
    codigo_validacion: str
    nueva_password: str

class IniciarTest(BaseModel):
    situacion_estresante: str = Field(..., min_length=10, max_length=2000)
    
    class Config:
        json_schema_extra = {
            "example": {
                "situacion_estresante": "Tuve un conflicto con mi jefe en el trabajo que me generó mucha ansiedad..."
            }
        }

class RespuestasTest(BaseModel):
    respuestas: Dict[int, int] = Field(..., description="Diccionario {numero_pregunta: valor (0-4)}")
    capacidad_afrontamiento: Optional[int] = Field(None, ge=0, le=4)
    
    class Config:
        json_schema_extra = {
            "example": {
                "respuestas": {
                    "1": 3, "2": 1, "3": 2, "4": 0, "5": 4,
                    "6": 2, "7": 1, "8": 0, "9": 3, "10": 2
                },
                "capacidad_afrontamiento": 3
            }
        }

# ============================================
# FUNCIONES AUXILIARES
# ============================================

def encriptar_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verificar_password(password_plana: str, password_encriptada: str) -> bool:
    return encriptar_password(password_plana) == password_encriptada

def crear_token(email: str) -> str:
    expiracion = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    datos_token = {"email": email, "exp": expiracion}
    return jwt.encode(datos_token, SECRET_KEY, algorithm=ALGORITHM)

def verificar_token(credentials: HTTPAuthorizationCredentials) -> str:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email")
        if email is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return email
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# ============================================
# ENDPOINTS DE AUTENTICACIÓN
# ============================================

@app.get("/")
def inicio():
    return {
        "mensaje": "API del Sistema CSI funcionando",
        "version": "2.0.0",
        "modulos": ["Autenticación", "Test CSI", "Resultados"]
    }

@app.post("/registro")
def registrar_usuario(usuario: UsuarioRegistro):
    if usuario.email in usuarios_db:
        raise HTTPException(status_code=400, detail="Este correo ya está registrado")
    
    # Concatenar nombre completo
    nombre_completo = f"{usuario.nombre} {usuario.primerApellido}"
    if usuario.segundoApellido:
        nombre_completo += f" {usuario.segundoApellido}"
        
    usuarios_db[usuario.email] = {
        "nombre": nombre_completo,
        "email": usuario.email,
        "password": encriptar_password(usuario.password),
        "teleforno": usuario.telefono,
        #"fecha_registro": datetime.now().isoformat(), no uso de momento
        "activo": True,
        "foto_perfil": None #futura implementacion
    }
    
    token = crear_token(usuario.email)
    return {"token": token, "tipo": "Bearer", "mensaje": f"Usuario {nombre_completo} registrado exitosamente"}

@app.post("/login")
def iniciar_sesion(credenciales: UsuarioLogin):
    if credenciales.email not in usuarios_db:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    
    usuario = usuarios_db[credenciales.email]
    
    if not verificar_password(credenciales.password, usuario["password"]):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    
    if not usuario.get("activo", True):
        raise HTTPException(status_code=403, detail="Esta cuenta ha sido desactivada")
    
    token = crear_token(credenciales.email)
    return {"token": token, "tipo": "Bearer", "mensaje": f"Bienvenido/a {usuario['nombre']}"}

@app.get("/perfil")
def obtener_perfil(credentials: HTTPAuthorizationCredentials = Depends(security)):
    email = verificar_token(credentials)
    
    if email not in usuarios_db:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    usuario = usuarios_db[email]
    return {
        "nombre": usuario["nombre"],
        "email": usuario["email"],
        "telefono": usuario.get("telefono"),
        #"fecha_registro": usuario["fecha_registro"]
    }

class ActualizarPerfil(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None

@app.put("/perfil/actualizar")
def actualizar_perfil(datos: ActualizarPerfil, credentials: HTTPAuthorizationCredentials = Depends(security)):
    email = verificar_token(credentials)
    
    if email not in usuarios_db:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if datos.nombre:
        usuarios_db[email]["nombre"] = datos.nombre
    if datos.telefono is not None:
        usuarios_db[email]["telefono"] = datos.telefono
    
    return {"mensaje": "Perfil actualizado correctamente"}

class CambiarPasswordRequest(BaseModel):
    password_actual: str
    password_nueva: str

@app.put("/perfil/cambiar-password")
def cambiar_password_perfil(datos: CambiarPasswordRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    email = verificar_token(credentials)
    
    if email not in usuarios_db:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    usuario = usuarios_db[email]
    
    if not verificar_password(datos.password_actual, usuario["password"]):
        raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")
    
    usuarios_db[email]["password"] = encriptar_password(datos.password_nueva)
    
    return {"mensaje": "Contraseña actualizada correctamente"}

# ============================================
# ENDPOINTS DEL TEST CSI
# ============================================

@app.post("/test/iniciar")
def iniciar_test(datos: IniciarTest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Inicia un nuevo test CSI
    - Guarda la situación estresante
    - Crea un ID único para este test
    - Retorna el ID para continuar
    """
    email = verificar_token(credentials)
    
    test_id = str(uuid.uuid4())
    
    tests_db[test_id] = {
        "test_id": test_id,
        "email": email,
        "situacion_estresante": datos.situacion_estresante,
        "fecha_inicio": datetime.now().isoformat(),
        "estado": "en_progreso",
        "completado": False
    }
    
    respuestas_db[test_id] = {}
    
    return {
        "test_id": test_id,
        "mensaje": "Test iniciado exitosamente",
        "siguiente_paso": "Responder las 40 preguntas usando POST /test/{test_id}/responder"
    }

@app.post("/test/{test_id}/responder")
def guardar_respuestas(
    test_id: str, 
    datos: RespuestasTest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Guarda las respuestas del test y calcula resultados
    """
    email = verificar_token(credentials)
    
    if test_id not in tests_db:
        raise HTTPException(status_code=404, detail="Test no encontrado")
    
    test = tests_db[test_id]
    
    if test["email"] != email:
        raise HTTPException(status_code=403, detail="No tienes permiso para este test")
    
    if test["completado"]:
        raise HTTPException(status_code=400, detail="Este test ya fue completado")
    
    # Validar que haya 40 respuestas
    if len(datos.respuestas) != 40:
        raise HTTPException(
            status_code=400, 
            detail=f"Se requieren 40 respuestas, recibidas: {len(datos.respuestas)}"
        )
    
    # Validar que todas las respuestas estén en rango 0-4
    for pregunta, valor in datos.respuestas.items():
        if valor < 0 or valor > 4:
            raise HTTPException(
                status_code=400,
                detail=f"La respuesta de la pregunta {pregunta} debe estar entre 0 y 4"
            )
    
    # Guardar respuestas
    respuestas_db[test_id] = datos.respuestas
    
    # Calcular resultados
    resultados = scoring_service.calculate_scores(datos.respuestas)
    
    # Actualizar test
    tests_db[test_id].update({
        "completado": True,
        "fecha_completado": datetime.now().isoformat(),
        "capacidad_afrontamiento": datos.capacidad_afrontamiento,
        "resultados": resultados
    })
    
    return {
        "test_id": test_id,
        "mensaje": "Test completado exitosamente",
        "resultados": resultados
    }

@app.get("/test/{test_id}/resultados")
def obtener_resultados(
    test_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Obtiene los resultados de un test completado
    """
    email = verificar_token(credentials)
    
    if test_id not in tests_db:
        raise HTTPException(status_code=404, detail="Test no encontrado")
    
    test = tests_db[test_id]
    
    if test["email"] != email:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver este test")
    
    if not test["completado"]:
        raise HTTPException(status_code=400, detail="El test aún no ha sido completado")
    
    return {
        "test_id": test_id,
        "situacion_estresante": test["situacion_estresante"],
        "fecha_completado": test["fecha_completado"],
        "capacidad_afrontamiento": test.get("capacidad_afrontamiento"),
        "resultados": test["resultados"]
    }

@app.get("/test/historial")
def obtener_historial(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Obtiene todos los tests del usuario
    """
    email = verificar_token(credentials)
    
    tests_usuario = [
        {
            "test_id": test_id,
            "fecha_inicio": test["fecha_inicio"],
            "completado": test["completado"],
            "fecha_completado": test.get("fecha_completado")
        }
        for test_id, test in tests_db.items()
        if test["email"] == email
    ]
    
    return {
        "total_tests": len(tests_usuario),
        "tests": tests_usuario
    }

# ============================================
# INFORMACIÓN
# ============================================

@app.get("/test/preguntas")
def obtener_preguntas():
    """
    Devuelve las 40 preguntas del test CSI
    """
    preguntas = [
        "Luché para resolver el problema",
        "Me culpé a mí mismo",
        "Dejé salir mis sentimientos para reducir el estrés",
        "Deseé que la situación nunca hubiera empezado",
        "Encontré a alguien que escuchó mi problema",
        "Repasé el problema una y otra vez en mi mente y al final vi las cosas de una forma diferente",
        "No dejé que me afectara; evité pensar en ello demasiado",
        "Pasé algún tiempo solo",
        "Me esforcé para resolver los problemas de la situación",
        "Me di cuenta de que era personalmente responsable de mis dificultades y me lo reproché",
        "Expresé mis emociones, lo que sentía",
        "Deseé que la situación no existiera o que de alguna manera terminase",
        "Hablé con una persona de confianza",
        "Cambié la forma en que veía la situación para que las cosas no parecieran tan malas",
        "Traté de olvidar por completo el asunto",
        "Evité estar con gente",
        "Hice frente al problema",
        "Me critiqué por lo ocurrido",
        "Analicé mis sentimientos y simplemente los dejé salir",
        "Deseé no encontrarme nunca más en esa situación",
        "Dejé que mis amigos me echaran una mano",
        "Me convencí de que las cosas no eran tan malas como parecían",
        "Quité importancia a la situación y no quise preocuparme de más",
        "Oculté lo que pensaba y sentía",
        "Supe lo que había que hacer, así que doblé mis esfuerzos y traté con más ímpetu de hacer que las cosas funcionaran",
        "Me recriminé por permitir que esto ocurriera",
        "Dejé desahogar mis emociones",
        "Deseé poder cambiar lo que había sucedido",
        "Pasé algún tiempo con mis amigos",
        "Me pregunté qué era realmente importante y descubrí que las cosas no estaban tan mal después de todo",
        "Me comporté como si nada hubiera pasado",
        "No dejé que nadie supiera cómo me sentía",
        "Mantuve mi postura y luché por lo que quería",
        "Fue un error mío, así que tenía que sufrir las consecuencias",
        "Mis sentimientos eran abrumadores y estallaron",
        "Me imaginé que las cosas podrían ser diferentes",
        "Pedí consejos a un amigo o familiar que respeto",
        "Me fijé en el lado bueno de las cosas",
        "Evité pensar o hacer nada",
        "Traté de ocultar mis sentimientos"
    ]
    
    return {
        "total_preguntas": len(preguntas),
        "escala": "0 = En absoluto; 1 = Un poco; 2 = Bastante; 3 = Mucho; 4 = Totalmente",
        "preguntas": [{"numero": i+1, "texto": p} for i, p in enumerate(preguntas)]
    }