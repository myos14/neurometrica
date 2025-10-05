// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://127.0.0.1:8000';

// ============================================
// COMPONENTE: LAYOUT PROFESIONAL (con sidebar)
// ============================================
const LayoutProfesional = ({ children, usuario, onCerrarSesion, paginaActual, onCambiarPagina }) => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [perfilMenuAbierto, setPerfilMenuAbierto] = useState(false);

  return (
    <div className="layout-profesional">
      {/* Header fijo */}
      <header className="header-profesional">
        <div className="header-izquierda">
          <button 
            className="menu-hamburguesa"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            {/* Contenedor para las líneas */}
            <div className="hamburguesa-icono">
              <span className="hamburguesa-lineas"></span>
              <span className="hamburguesa-lineas"></span>
              <span className="hamburguesa-lineas"></span>
            </div>
            <span className="hamburguesa-texto">Menú</span>
          </button>
        </div>

        <div className="header-centro">
          <div className="logo-header">
            <div className="logo-img">🧠</div>
            <span className="logo-texto">NeuroMétrica</span>
          </div>
        </div>

        <div className="header-derecha">
          <button 
            className="perfil-dropdown-toggle"
            onClick={() => setPerfilMenuAbierto(!perfilMenuAbierto)}
          >
            <div className="perfil-avatar">
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </div>
          </button>
          {perfilMenuAbierto && (
            <div className="perfil-dropdown-menu">
              <button onClick={() => { onCambiarPagina('perfil'); setPerfilMenuAbierto(false); }}>
                <span>👤</span> Mi Perfil
              </button>
              <button onClick={onCerrarSesion}>
                <span>🚪</span> Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="contenedor-principal">
        {/* Sidebar */}
        <aside className={`sidebar-overlay ${menuAbierto ? 'visible' : ''}`} onClick={() => setMenuAbierto(false)}>
          <div className={`sidebar-nuevo ${menuAbierto ? 'abierto' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-header-logo">
              <img src="/Logo500px.png" alt="Logo" className="sidebar-logo-img" />
              <span className="sidebar-logo-texto">NeuroMétrica</span>
            </div>
            <nav className="sidebar-nav">
              <button className="sidebar-item" onClick={() => { onCambiarPagina('dashboard'); setMenuAbierto(false); }}>
                <span className="sidebar-icono">🏠</span>
                <span className="sidebar-texto">Inicio</span>
              </button>
              <button className="sidebar-item" onClick={() => { onCambiarPagina('directorio'); setMenuAbierto(false); }}>
                <span className="sidebar-icono">🔍</span>
                <span className="sidebar-texto">Directorio de Psicólogos</span>
              </button>
              <button className="sidebar-item" onClick={() => { onCambiarPagina('empresa'); setMenuAbierto(false); }}>
                <span className="sidebar-icono">🏢</span>
                <span className="sidebar-texto">Regístrate como Empresa</span>
              </button>
              <button className="sidebar-item" onClick={() => { onCambiarPagina('cursos'); setMenuAbierto(false); }}>
                <span className="sidebar-icono">📚</span>
                <span className="sidebar-texto">Cursos</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Área de contenido */}
        <main className="contenido-principal">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="footer-profesional">
        <p>© Copyright 2025 NeuroMétrica. Todos los derechos reservados. Aviso legal, privacidad y cookies</p>
      </footer>
    </div>
  );
};

// ============================================
// PANTALLA: LOGIN/REGISTRO (sin layout)
// ============================================
const PantallaAuth = ({ onLogin }) => {
  const [modo, setModo] = useState('login'); // 'login' o 'registro'
  const [formData, setFormData] = useState({
    nombre: '',
    primerApellido: '',
    segundoApellido: '',
    email: '',
    password: ''
  });
  const [recordarme, setRecordarme] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const capitalizarPrimeraLetra = (texto) => {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};

 const handleSubmit = async (e) => {
  e.preventDefault();
  setCargando(true);
  setMensaje('');

  try {
    const endpoint = modo === 'login' ? '/login' : '/registro';
    const body = modo === 'login' 
      ? { 
          email: formData.email, 
          password: formData.password,
          recordarme: recordarme
        }
      : formData;

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (response.ok) {
      const perfilResponse = await fetch(`${API_URL}/perfil`, {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });
      const perfilData = await perfilResponse.json();
      
      onLogin(data.token, perfilData);
    } else {
      // Manejar diferentes formatos de error
      let mensajeError = '';
      
      if (typeof data.detail === 'string') {
        // Error en formato string simple
        mensajeError = data.detail;
      } else if (Array.isArray(data.detail)) {
        // Error de validación Pydantic (array de errores)
        mensajeError = data.detail.map(error => {
          // Personalizar el mensaje de error de email
          if (error.msg && error.msg.includes('valid email address') || 
              error.msg && error.msg.includes('email') ||
              error.msg && error.msg.includes('@')) {
            return 'Ingresa un correo electrónico válido';
          }
          return error.msg;
        }).join(', ');
      } else if (data.detail && typeof data.detail === 'object') {
        // Error en formato objeto
        mensajeError = data.detail.msg || 'Error de validación';
      } else {
        // Formato desconocido
        mensajeError = 'Error en el servidor';
      }
      
      setMensaje(mensajeError);
    }
  } catch (error) {
    setMensaje('Error de conexión. Verifica que el backend esté corriendo.');
  } finally {
    setCargando(false);
  }
};

  return (
    <div className="pantalla-auth">
      <div className="auth-container">
        <div className="auth-logo">
          <img src="/Logo500px.png" alt="Logo Sistema CSI" />
        </div>
        
        <h1>NeuroMétrica</h1>
        <p className="auth-subtitulo">Plataforma de evaluación psicológica y psicométrica</p>

        <div className="auth-tabs">
          <button 
            className={modo === 'login' ? 'activo' : ''}
            onClick={() => setModo('login')}
          >
            Iniciar Sesión
          </button>
          <button 
            className={modo === 'registro' ? 'activo' : ''}
            onClick={() => setModo('registro')}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {modo === 'registro' && (
            <>
              <input
                type="text"
                placeholder="Nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: capitalizarPrimeraLetra(e.target.value)})}
                required
              />
              <input
                type="text"
                placeholder="Primer Apellido"
                value={formData.primerApellido}
                onChange={(e) => setFormData({...formData, primerApellido: capitalizarPrimeraLetra(e.target.value)})}
                required
              />
              <input
                type="text"
                placeholder="Segundo Apellido"
                value={formData.segundoApellido}
                onChange={(e) => setFormData({...formData, segundoApellido: capitalizarPrimeraLetra(e.target.value)})}
              />
            </>
          )}
          <input
            type="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            minLength="6"
          />
          
          {modo === 'login' && (
            <div className="login-options">
              <label className="recordarme">
                <input
                  type="checkbox"
                  checked={recordarme}
                  onChange={(e) => setRecordarme(e.target.checked)}
                />
                Recordarme
              </label>
              <a href="#" className="olvidaste-contrasena">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          )}
          
          <button type="submit" disabled={cargando} className="btn-auth">
            {cargando ? 'Procesando...' : (modo === 'login' ? 'Accede' : 'Crear Cuenta')}
          </button>
        </form>

        {mensaje && <div className="auth-mensaje">{mensaje}</div>}
      </div>
    </div>
  );
};

// ============================================
// PANTALLA PRINCIPAL
// ============================================
const PantallaDashboard = ({ onCambiarPagina, usuario }) => {
  const [infoExpandida, setInfoExpandida] = useState(false);
  const primerNombre = usuario?.nombre?.split(' ')[0] || '';
  const nombreCapitalizado = primerNombre.charAt(0).toUpperCase() + primerNombre.slice(1);


  return (
    <div className="contenido-pagina">
      <h1>Bienvenido {nombreCapitalizado}</h1>
      <p className="pagina-descripcion">
        Tu desarrollo empieza aquí: conoce quién eres y qué puedes lograr
      </p>

      <div className="cards-grid-acciones">
        <div className="card-accion">
          <div className="card-icono">📝</div>
          <h3>Realizar Nuevo Test</h3>
          <p>Tu perfil comienza aquí</p>
          <button onClick={() => onCambiarPagina('catalogo')} className="btn-card">
            Comenzar Test
          </button>
        </div>

        <div className="card-accion">
          <div className="card-icono">📊</div>
          <h3>Ver Historial</h3>
          <p>Consulta tus tests anteriores y resultados</p>
          <button onClick={() => onCambiarPagina('historial')} className="btn-card">
            Ver Historial
          </button>
        </div>
      </div>

      <div className="info-expandible">
        <button 
          className="info-toggle"
          onClick={() => setInfoExpandida(!infoExpandida)}
        >
          <span className="info-icono">ℹ️</span>
          <span>Acerca de NeuroMétrica</span>
          <span className="toggle-arrow">{infoExpandida ? '▼' : '▶'}</span>
        </button>
        
        {infoExpandida && (
          <div className="info-contenido">
            <p>
              NeuroMétrica es una plataforma de evaluación psicológica y psicométrica diseñada para ayudar a las personas a conocer su perfil personal y profesional. Los usuarios pueden realizar distintos tests para descubrir fortalezas, habilidades y áreas de mejora, mientras que las empresas pueden acceder a perfiles completos para tomar decisiones informadas sobre selección de talento y desarrollo de equipos.
            </p>
            <p>
              Creemos en el valor de conocer tus capacidades y tu potencial para crecer de manera consciente y efectiva. Nuestros resultados son claros y confiables, buscando apoyar el crecimiento y desarrollo de cada persona.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const PantallaCatalogoTests = ({ onSeleccionarTest, onVolver }) => {
  const tests = [
    {
      id: 'csi',
      nombre: 'Test CSI',
      descripcion: 'Inventario de Estrategias de Afrontamiento',
      icono: '📝',
      duracion: '40 min',
      preguntas: 40,
      disponible: true
    },
    {
      id: 'inteligencia',
      nombre: 'Test de Inteligencia',
      descripcion: 'Evalúa capacidades cognitivas',
      icono: '🧠',
      duracion: '30 min',
      preguntas: 50,
      disponible: false
    },
    {
      id: 'personalidad',
      nombre: 'Test de Personalidad',
      descripcion: 'Conoce tu perfil profesional',
      icono: '💼',
      duracion: '25 min',
      preguntas: 60,
      disponible: false
    }
  ];

  return (
    <div className="contenido-pagina">
      <h1>Catálogo de Evaluaciones</h1>
      <p className="pagina-descripcion">
        Selecciona el test que deseas realizar
      </p>

      <div className="catalogo-tests">
        {tests.map(test => (
          <div 
            key={test.id} 
            className={`test-catalogo-card ${!test.disponible ? 'no-disponible' : ''}`}
          >
            <div className="test-catalogo-icono">{test.icono}</div>
            <h3>{test.nombre}</h3>
            <p className="test-descripcion">{test.descripcion}</p>
            <div className="test-info">
              <span>⏱️ {test.duracion}</span>
              <span>📊 {test.preguntas} preguntas</span>
            </div>
            {test.disponible ? (
              <button 
                onClick={() => onSeleccionarTest(test.id)}
                className="btn-card"
              >
                Iniciar Test
              </button>
            ) : (
              <button className="btn-card btn-disabled" disabled>
                Próximamente
              </button>
            )}
          </div>
        ))}
      </div>

      <button onClick={onVolver} className="btn-link">
        ← Volver a Inicio
      </button>
    </div>
  );
};

const PantallaTest = ({ token, onVolver, onTestCompletado }) => {
  const [paso, setPaso] = useState(1);
  const [situacion, setSituacion] = useState('');
  const [testId, setTestId] = useState(null);
  const [respuestas, setRespuestas] = useState({});
  const [capacidadAfrontamiento, setCapacidadAfrontamiento] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const preguntas = [
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
  ];

  const iniciarTest = async () => {
    if (situacion.length < 10) {
      setMensaje('Por favor, describe la situación con más detalle (mínimo 10 caracteres)');
      return;
    }

    setCargando(true);
    setMensaje('');

    try {
      const response = await fetch(`${API_URL}/test/iniciar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ situacion_estresante: situacion })
      });

      const data = await response.json();

      if (response.ok) {
        setTestId(data.test_id);
        setPaso(3);
        const respuestasIniciales = {};
        for (let i = 1; i <= 40; i++) {
          respuestasIniciales[i] = null;
        }
        setRespuestas(respuestasIniciales);
      } else {
        setMensaje('❌ ' + data.detail);
      }
    } catch (error) {
      setMensaje('❌ Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const finalizarTest = async () => {
    const todasRespondidas = Object.values(respuestas).every(r => r !== null);
    if (!todasRespondidas) {
      setMensaje('❌ Por favor, responde todas las preguntas');
      window.scrollTo(0, 0);
      return;
    }

    if (capacidadAfrontamiento === null) {
      setMensaje('❌ Por favor, evalúa tu capacidad de afrontamiento');
      return;
    }

    setCargando(true);
    setMensaje('');

    try {
      const response = await fetch(`${API_URL}/test/${testId}/responder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          respuestas: respuestas,
          capacidad_afrontamiento: capacidadAfrontamiento
        })
      });

      const data = await response.json();

      if (response.ok) {
        onTestCompletado(testId);
      } else {
        setMensaje('❌ ' + data.detail);
      }
    } catch (error) {
      setMensaje('❌ Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  };

  if (paso === 1) {
    return (
      <div className="pantalla pantalla-test">
        <h2>Inventario de Estrategias de Afrontamiento (CSI)</h2>
        
        <div className="instrucciones">
          <h3>Instrucciones</h3>
          <p>
            El CSI es un cuestionario que sirve para conocer cómo enfrentas y manejas 
            las situaciones de estrés o problemas en tu vida. <strong>No mide si lo 
            haces bien o mal</strong>, sino qué tipo de estrategias utilizas con más 
            frecuencia.
          </p>
          <p>
            El test consiste en 40 preguntas y ayuda a identificar si tu manera de 
            afrontar las dificultades es más activa y constructiva, o más bien evasiva 
            o negativa.
          </p>
          <h3>¿Qué debes hacer?</h3>
          <ol>
            <li>Piensa en una situación que ha sido muy estresante para ti en el último mes</li>
            <li>Describe esa situación con detalle</li>
            <li>Responde 40 preguntas sobre cómo manejaste esa situación</li>
          </ol>
          <p className="nota">
            <strong>Nota:</strong> No hay respuestas correctas o incorrectas. 
            Solo se evalúa lo que tú hiciste, pensaste o sentiste en ese momento.
          </p>
        </div>

        <div className="botones">
          <button onClick={() => setPaso(2)} className="btn-primary">
            Continuar
          </button>
          <button onClick={onVolver} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (paso === 2) {
    return (
      <div className="pantalla pantalla-test">
        <h2>Describe tu situación estresante</h2>
        
        <div className="instrucciones">
          <p>
            Piensa durante unos minutos en un hecho o situación que ha sido muy 
            estresante para ti en el último mes. Por estresante entendemos una 
            situación que causa problemas, te hace sentir mal o que cuesta mucho 
            enfrentarse a ella.
          </p>
          <p>
            Puede ser con la familia, en la escuela, en el trabajo, con los amigos, etc.
          </p>
        </div>

        <textarea
          value={situacion}
          onChange={(e) => setSituacion(e.target.value)}
          placeholder="Describe qué ocurrió, incluye detalles como el lugar, quién o quiénes estaban implicados, por qué le diste importancia y qué hiciste..."
          rows="8"
          className="textarea-situacion"
        />

        <p className="contador-caracteres">
          {situacion.length} caracteres (mínimo 10)
        </p>

        {mensaje && <p className="mensaje">{mensaje}</p>}

        <div className="botones">
          <button 
            onClick={iniciarTest} 
            className="btn-primary"
            disabled={cargando}
          >
            {cargando ? 'Iniciando...' : 'Comenzar Test'}
          </button>
          <button onClick={() => setPaso(1)} className="btn-secondary">
            Atrás
          </button>
        </div>
      </div>
    );
  }

  if (paso === 3) {
    const preguntasRespondidas = Object.values(respuestas).filter(r => r !== null).length;
    const progreso = (preguntasRespondidas / 40) * 100;

    return (
      <div className="pantalla pantalla-test test-preguntas">
        <h2>Responde las siguientes preguntas</h2>
        
        <div className="instrucciones-escala">
          <p>
            Basándote en la situación que describiste, indica el grado en que hiciste 
            lo que cada frase indica:
          </p>
          <div className="escala-explicacion">
            <span><strong>0</strong> = En absoluto</span>
            <span><strong>1</strong> = Un poco</span>
            <span><strong>2</strong> = Bastante</span>
            <span><strong>3</strong> = Mucho</span>
            <span><strong>4</strong> = Totalmente</span>
          </div>
        </div>

        <div className="progreso-container">
          <div className="progreso-barra">
            <div className="progreso-fill" style={{ width: `${progreso}%` }}></div>
          </div>
          <p className="progreso-texto">
            {preguntasRespondidas} de 40 preguntas respondidas
          </p>
        </div>

        <div className="preguntas-lista">
          {preguntas.map((pregunta, index) => {
            const numero = index + 1;
            return (
              <div key={numero} className="pregunta-item">
                <div className="pregunta-header">
                  <span className="pregunta-numero">{numero}.</span>
                  <span className="pregunta-texto">{pregunta}</span>
                </div>
                <div className="pregunta-opciones">
                  {[0, 1, 2, 3, 4].map(valor => (
                    <label key={valor} className="opcion-radio">
                      <input
                        type="radio"
                        name={`pregunta-${numero}`}
                        value={valor}
                        checked={respuestas[numero] === valor}
                        onChange={() => setRespuestas({...respuestas, [numero]: valor})}
                      />
                      <span className="opcion-label">{valor}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pregunta-item pregunta-especial">
          <div className="pregunta-header">
            <span className="pregunta-texto">
              <strong>Me consideré capaz de afrontar la situación</strong>
            </span>
          </div>
          <div className="pregunta-opciones">
            {[0, 1, 2, 3, 4].map(valor => (
              <label key={valor} className="opcion-radio">
                <input
                  type="radio"
                  name="capacidad-afrontamiento"
                  value={valor}
                  checked={capacidadAfrontamiento === valor}
                  onChange={() => setCapacidadAfrontamiento(valor)}
                />
                <span className="opcion-label">{valor}</span>
              </label>
            ))}
          </div>
        </div>

        {mensaje && <p className="mensaje">{mensaje}</p>}

        <div className="botones">
          <button 
            onClick={finalizarTest} 
            className="btn-primary btn-grande"
            disabled={cargando}
          >
            {cargando ? 'Procesando...' : 'Finalizar Test'}
          </button>
        </div>
      </div>
    );
  }
};

const PantallaResultados = ({ token, testId, onVolver }) => {
  const [resultados, setResultados] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarResultados();
  }, []);

  const cargarResultados = async () => {
    try {
      const response = await fetch(`${API_URL}/test/${testId}/resultados`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        setResultados(data);
      } else {
        setError('Error al cargar los resultados: ' + data.detail);
      }
    } catch (error) {
      setError('Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="pantalla">
        <div className="cargando">
          <div className="spinner"></div>
          <p>Cargando resultados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pantalla">
        <h2>Error</h2>
        <p className="mensaje">{error}</p>
        <button onClick={onVolver} className="btn-primary">
          Volver al Dashboard
        </button>
      </div>
    );
  }

  const { resultados: res } = resultados;
  const niveles = res.levels;
  const interpretaciones = res.interpretations;
  const percentiles = res.percentiles;

  const indicadoresInfo = {
    'REP': { nombre: 'Resolución de Problemas', color: '#4caf50' },
    'AUC': { nombre: 'Autocrítica', color: '#f44336' },
    'EEM': { nombre: 'Expresión Emocional', color: '#ff9800' },
    'PSD': { nombre: 'Pensamiento Desiderativo', color: '#9c27b0' },
    'APS': { nombre: 'Apoyo Social', color: '#2196f3' },
    'REC': { nombre: 'Reestructuración Cognitiva', color: '#00bcd4' },
    'EVP': { nombre: 'Evitación de Problemas', color: '#ff5722' },
    'RES': { nombre: 'Retirada Social', color: '#795548' }
  };

  return (
    <div className="pantalla pantalla-resultados">
      <h1>Resultados de tu Test CSI</h1>
      <p className="fecha-test">
        Completado el {new Date(resultados.fecha_completado).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>

      {/* Resumen general */}
      <div className="resumen-general">
        <h2>Resumen General</h2>
        <div className="resumen-stats">
          <div className="stat-card">
            <span className="stat-numero">{res.summary.high_count}</span>
            <span className="stat-label">Indicadores Altos</span>
          </div>
          <div className="stat-card">
            <span className="stat-numero">{res.summary.medium_count}</span>
            <span className="stat-label">Indicadores Medios</span>
          </div>
          <div className="stat-card">
            <span className="stat-numero">{res.summary.low_count}</span>
            <span className="stat-label">Indicadores Bajos</span>
          </div>
        </div>
      </div>

      {/* Gráfica de barras */}
      <div className="seccion-grafica">
        <h2>Tus Estrategias de Afrontamiento</h2>
        <div className="grafica-barras">
          {Object.entries(indicadoresInfo).map(([codigo, info]) => {
            const percentil = percentiles[codigo];
            const nivel = niveles[codigo];
            
            return (
              <div key={codigo} className="barra-container">
                <div className="barra-label">
                  <span className="barra-nombre">{info.nombre}</span>
                  <span className={`barra-nivel nivel-${nivel.toLowerCase()}`}>
                    {nivel}
                  </span>
                </div>
                <div className="barra-fondo">
                  <div 
                    className="barra-fill"
                    style={{ 
                      width: `${percentil}%`,
                      backgroundColor: info.color
                    }}
                  >
                    <span className="barra-percentil">{percentil}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="leyenda-grafica">
          <span>0 (Bajo)</span>
          <span>35</span>
          <span>64</span>
          <span>100 (Alto)</span>
        </div>
      </div>

      {/* Interpretaciones detalladas */}
      {Object.keys(interpretaciones).length > 0 && (
        <div className="seccion-interpretaciones">
          <h2>Interpretación de Resultados</h2>
          <p className="intro-interpretaciones">
            Se muestran únicamente los indicadores con nivel <strong>Alto</strong>, 
            que requieren mayor atención:
          </p>
          
          {Object.entries(interpretaciones).map(([codigo, data]) => (
            <div key={codigo} className="interpretacion-card">
              <div 
                className="interpretacion-header"
                style={{ borderLeftColor: indicadoresInfo[codigo].color }}
              >
                <h3>{data.name}</h3>
                <span className="badge-alto">Alto</span>
              </div>
              <p className="interpretacion-texto">{data.interpretation}</p>
            </div>
          ))}
        </div>
      )}

      {/* Capacidad de afrontamiento */}
      {resultados.capacidad_afrontamiento !== null && (
        <div className="seccion-capacidad">
          <h2>Capacidad de Afrontamiento Percibida</h2>
          <div className="capacidad-visual">
            <div className="capacidad-escala">
              {[0, 1, 2, 3, 4].map(valor => (
                <div 
                  key={valor}
                  className={`capacidad-punto ${
                    resultados.capacidad_afrontamiento === valor ? 'activo' : ''
                  }`}
                >
                  {valor}
                </div>
              ))}
            </div>
            <div className="capacidad-labels">
              <span>En absoluto</span>
              <span>Totalmente</span>
            </div>
          </div>
          <p className="capacidad-resultado">
            Te consideraste <strong>
              {resultados.capacidad_afrontamiento === 0 && 'nada'}
              {resultados.capacidad_afrontamiento === 1 && 'poco'}
              {resultados.capacidad_afrontamiento === 2 && 'moderadamente'}
              {resultados.capacidad_afrontamiento === 3 && 'muy'}
              {resultados.capacidad_afrontamiento === 4 && 'totalmente'}
            </strong> capaz de afrontar la situación.
          </p>
        </div>
      )}

      {/* Situación descrita */}
      <div className="seccion-situacion">
        <h2>Situación Evaluada</h2>
        <div className="situacion-box">
          <p>{resultados.situacion_estresante}</p>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="botones-resultados">
        <button onClick={onVolver} className="btn-primary">
          Volver a Inicio
        </button>
        <button 
          onClick={() => window.print()} 
          className="btn-secondary"
        >
          Imprimir Resultados
        </button>
      </div>
    </div>
  );
};

const PantallaHistorial = ({ token, onVolver, onVerResultado }) => {
  const [tests, setTests] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      const response = await fetch(`${API_URL}/test/historial`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        setTests(data.tests);
      } else {
        setError('Error al cargar el historial: ' + data.detail);
      }
    } catch (error) {
      setError('Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="pantalla">
        <div className="cargando">
          <div className="spinner"></div>
          <p>Cargando historial...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pantalla">
        <h2>Error</h2>
        <p className="mensaje">{error}</p>
        <button onClick={onVolver} className="btn-primary">
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="pantalla pantalla-historial">
      <h2>Historial de Tests</h2>
      
      {tests.length === 0 ? (
        <div className="historial-vacio">
          <div className="icono-vacio">📋</div>
          <h3>No tienes tests realizados</h3>
          <p>Realiza un test para empezar a construir tu perfil psicológico.</p>
          <button onClick={onVolver} className="btn-primary">
            Realizar Test
          </button>
        </div>
      ) : (
        <>
          <p className="historial-info">
            Has completado <strong>{tests.filter(t => t.completado).length}</strong> tests
          </p>

          <div className="tests-lista">
            {tests.map((test) => {
              const fecha = new Date(test.fecha_inicio);
              const fechaFormateada = fecha.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
              const horaFormateada = fecha.toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div key={test.test_id} className="test-card">
                  <div className="test-card-header">
                    <div className="test-fecha">
                      <span className="fecha-dia">{fechaFormateada}</span>
                      <span className="fecha-hora">{horaFormateada}</span>
                    </div>
                    <div className={`test-estado ${test.completado ? 'completado' : 'pendiente'}`}>
                      {test.completado ? 'Completado' : 'En progreso'}
                    </div>
                  </div>

                  <div className="test-card-body">
                    {test.completado ? (
                      <>
                        <p className="test-completado-texto">
                          Test completado el {new Date(test.fecha_completado).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                        <button 
                          onClick={() => onVerResultado(test.test_id)}
                          className="btn-primary btn-small"
                        >
                          Ver Resultados
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="test-pendiente-texto">
                          Test iniciado pero no completado
                        </p>
                        <button className="btn-secondary btn-small" disabled>
                          Incompleto
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <button onClick={onVolver} className="btn-link btn-volver">
        ← Volver a Inicio
      </button>
    </div>
  );
};

const PantallaPerfil = ({ usuario, token }) => {
  const [modoEdicion, setModoEdicion] = useState(false);
  const [modoPassword, setModoPassword] = useState(false);
  const [datosEdicion, setDatosEdicion] = useState({
    nombre: usuario?.nombre || '',
    telefono: usuario?.telefono || ''
  });
  const [passwordData, setPasswordData] = useState({
    actual: '',
    nueva: '',
    confirmar: ''
  });
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleGuardarPerfil = async () => {
    setCargando(true);
    setMensaje('');

    try {
      const response = await fetch(`${API_URL}/perfil/actualizar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosEdicion)
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje('✅ ' + data.mensaje);
        setModoEdicion(false);
        // Actualizar datos locales
        usuario.nombre = datosEdicion.nombre;
        usuario.telefono = datosEdicion.telefono;
      } else {
        setMensaje('❌ ' + data.detail);
      }
    } catch (error) {
      setMensaje('❌ Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  const handleCambiarPassword = async () => {
    if (passwordData.nueva !== passwordData.confirmar) {
      setMensaje('❌ Las contraseñas no coinciden');
      return;
    }

    if (passwordData.nueva.length < 6) {
      setMensaje('❌ La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setCargando(true);
    setMensaje('');

    try {
      const response = await fetch(`${API_URL}/perfil/cambiar-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          password_actual: passwordData.actual,
          password_nueva: passwordData.nueva
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje('✅ ' + data.mensaje);
        setModoPassword(false);
        setPasswordData({ actual: '', nueva: '', confirmar: '' });
      } else {
        setMensaje('❌ ' + data.detail);
      }
    } catch (error) {
      setMensaje('❌ Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="contenido-pagina">
      <h1>Mi Perfil</h1>
      
      {mensaje && <div className="mensaje-perfil">{mensaje}</div>}

      <div className="perfil-card">
        <div className="perfil-avatar-grande">
          {usuario?.nombre?.charAt(0).toUpperCase()}
        </div>

        {!modoEdicion ? (
          <div className="perfil-info-display">
            <div className="perfil-campo">
              <label>Nombre:</label>
              <span>{usuario?.nombre}</span>
            </div>
            <div className="perfil-campo">
              <label>Email:</label>
              <span>{usuario?.email}</span>
            </div>
            <div className="perfil-campo">
              <label>Teléfono:</label>
              <span>{usuario?.telefono || 'No especificado'}</span>
            </div>
            <button onClick={() => setModoEdicion(true)} className="btn-card">
              Editar Perfil
            </button>
          </div>
        ) : (
          <div className="perfil-form">
            <input
              type="text"
              placeholder="Nombre completo"
              value={datosEdicion.nombre}
              onChange={(e) => setDatosEdicion({...datosEdicion, nombre: e.target.value})}
            />
            <input
              type="tel"
              placeholder="Teléfono (opcional)"
              value={datosEdicion.telefono}
              onChange={(e) => setDatosEdicion({...datosEdicion, telefono: e.target.value})}
            />
            <div className="perfil-botones">
              <button onClick={handleGuardarPerfil} disabled={cargando} className="btn-primary">
                {cargando ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => setModoEdicion(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="perfil-card">
        <h3>Seguridad</h3>
        {!modoPassword ? (
          <button onClick={() => setModoPassword(true)} className="btn-secondary">
            Cambiar Contraseña
          </button>
        ) : (
          <div className="perfil-form">
            <input
              type="password"
              placeholder="Contraseña actual"
              value={passwordData.actual}
              onChange={(e) => setPasswordData({...passwordData, actual: e.target.value})}
            />
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={passwordData.nueva}
              onChange={(e) => setPasswordData({...passwordData, nueva: e.target.value})}
            />
            <input
              type="password"
              placeholder="Confirmar nueva contraseña"
              value={passwordData.confirmar}
              onChange={(e) => setPasswordData({...passwordData, confirmar: e.target.value})}
            />
            <div className="perfil-botones">
              <button onClick={handleCambiarPassword} disabled={cargando} className="btn-primary">
                {cargando ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
              <button onClick={() => { setModoPassword(false); setPasswordData({actual: '', nueva: '', confirmar: ''}); }} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL: APP
// ============================================
function App() {
  const [autenticado, setAutenticado] = useState(false);
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [paginaActual, setPaginaActual] = useState('dashboard');
  const [testIdActual, setTestIdActual] = useState(null);

  const handleLogin = (tokenRecibido, datosUsuario) => {
    setToken(tokenRecibido);
    setUsuario(datosUsuario);
    setAutenticado(true);
    setPaginaActual('dashboard');
  };

  const handleCerrarSesion = () => {
    setToken(null);
    setUsuario(null);
    setAutenticado(false);
    setPaginaActual('dashboard');
  };

  // Si no está autenticado, mostrar login
  if (!autenticado) {
    return <PantallaAuth onLogin={handleLogin} />;
  }

  // Si está autenticado, mostrar layout profesional
  return (
    <LayoutProfesional
      usuario={usuario}
      onCerrarSesion={handleCerrarSesion}
      paginaActual={paginaActual}
      onCambiarPagina={setPaginaActual}
    >
      {paginaActual === 'dashboard' && (
        <PantallaDashboard 
          onCambiarPagina={setPaginaActual}
          usuario={usuario}
        />
      )}
      
      {paginaActual === 'catalogo' && (
        <PantallaCatalogoTests
          onSeleccionarTest={(testId) => {
            if (testId === 'csi') {
              setPaginaActual('test');
            }
          }}
          onVolver={() => setPaginaActual('dashboard')}
        />
      )}

      {paginaActual === 'test' && (
        <PantallaTest
          token={token}
          onVolver={() => setPaginaActual('dashboard')}
          onTestCompletado={(testId) => {
            setTestIdActual(testId);
            setPaginaActual('resultados');
          }}
        />
      )}

      {paginaActual === 'resultados' && (
        <PantallaResultados
          token={token}
          testId={testIdActual}
          onVolver={() => setPaginaActual('dashboard')}
        />
      )}

      {paginaActual === 'historial' && (
        <PantallaHistorial
          token={token}
          onVolver={() => setPaginaActual('dashboard')}
          onVerResultado={(testId) => {
            setTestIdActual(testId);
            setPaginaActual('resultados');
          }}
        />
      )}

      {paginaActual === 'perfil' && (
        <PantallaPerfil usuario={usuario} token={token} />
      )}
    </LayoutProfesional>
  );
}

export default App;