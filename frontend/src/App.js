// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://neurometrica-backend.onrender.com';

// ============================================
// UTILIDADES
// ============================================
const capitalizarPrimeraLetra = (texto) => {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};

const formatearFecha = (fecha, opciones) => {
  return new Date(fecha).toLocaleDateString('es-MX', opciones);
};

const manejarErrores = (data) => {
  if (typeof data.detail === 'string') {
    return data.detail;
  }
  if (Array.isArray(data.detail)) {
    return data.detail.map(error => {
      if (error.msg?.includes('valid email address') || 
          error.msg?.includes('email') || 
          error.msg?.includes('@')) {
        return 'Ingresa un correo electrónico válido';
      }
      return error.msg;
    }).join(', ');
  }
  if (data.detail && typeof data.detail === 'object') {
    return data.detail.msg || 'Error de validación';
  }
  return 'Error en el servidor';
};

// ============================================
// COMPONENTE: LAYOUT PROFESIONAL
// ============================================
const LayoutProfesional = ({ children, usuario, onCerrarSesion, onCambiarPagina }) => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [perfilMenuAbierto, setPerfilMenuAbierto] = useState(false);

  const cerrarMenus = () => {
    setMenuAbierto(false);
    setPerfilMenuAbierto(false);
  };

  const navegarA = (pagina) => {
    onCambiarPagina(pagina);
    cerrarMenus();
  };

  const opcionesMenu = [
    { id: 'dashboard', texto: 'Inicio' },
    { id: 'directorio', texto: 'Directorio de psicólogos' },
    { id: 'empresa', texto: 'Regístrate como empresa' },
    { id: 'cursos', texto: 'Cursos' },
    { id: 'articulos', texto: 'Artículos' }
  ];

  return (
    <div className="layout-profesional">
      {/* Header */}
      <header className="header-profesional">
        <div className="header-izquierda">
        <button 
          className={`menu-hamburguesa ${menuAbierto ? 'abierto' : ''}`}
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-labelledby="toggle-label"
        >
          <div className="hamburguesa-icono">
            <span className="hamburguesa-lineas"></span>
            <span className="hamburguesa-lineas"></span>
            <span className="hamburguesa-lineas"></span>
          </div>
          <span id="toggle-label" className="hamburguesa-texto">Menú</span>
        </button>
      </div>

        <div className="header-centro">
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); navegarA('directorio'); }} 
            className="logo-header-link"
          >
            <img 
              src="/LogoNeurometrica500px.png"
              alt="Logo NeuroMétrica" 
              className="logo-img" 
            />
            <span className="logo-texto">NeuroMétrica</span>
          </a>
        </div>

        <div className="header-derecha">
          <button 
            className="perfil-dropdown-toggle"
            onClick={() => setPerfilMenuAbierto(!perfilMenuAbierto)}
            aria-label="Perfil de usuario"
          >
            <div className="perfil-avatar">
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </div>
          </button>
          {perfilMenuAbierto && (
            <div className="perfil-dropdown-menu">
              <button onClick={() => navegarA('perfil')}>
                Mi Perfil
              </button>
              <button onClick={onCerrarSesion}>
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="contenedor-principal">
        {/* Sidebar */}
        <aside 
          className={`sidebar-overlay ${menuAbierto ? 'visible' : ''}`} 
          onClick={cerrarMenus}
        >
          <div 
            className={`sidebar-nuevo ${menuAbierto ? 'abierto' : ''}`} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sidebar-header-logo">
              <img src="/Logo500px.png" alt="Logo" className="sidebar-logo-img" />
              <span className="sidebar-logo-texto">NeuroMétrica</span>
            </div>
            <nav className="sidebar-nav">
              {opcionesMenu.map(opcion => (
                <button 
                  key={opcion.id}
                  className="sidebar-item" 
                  onClick={() => navegarA(opcion.id)}
                >
                  <span className="sidebar-icono">{opcion.icono}</span>
                  <span className="sidebar-texto">{opcion.texto}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Contenido */}
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
// COMPONENTE: AUTENTICACIÓN
// ============================================
const PantallaAuth = ({ onLogin }) => {
  const [modo, setModo] = useState('login');
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

  const actualizarCampo = (campo, valor) => {
    const valorProcesado = ['nombre', 'primerApellido', 'segundoApellido'].includes(campo)
      ? capitalizarPrimeraLetra(valor)
      : valor;
    setFormData({ ...formData, [campo]: valorProcesado });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje('');

    try {
      const endpoint = modo === 'login' ? '/login' : '/registro';
      const body = modo === 'login' 
        ? { email: formData.email, password: formData.password, recordarme }
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
        setMensaje(manejarErrores(data));
      }
    } catch (error) {
      setMensaje('Error de conexión. Verifica que el backend esté corriendo.');
    } finally {
      setCargando(false);
    }
  };

  const camposRegistro = [
    { name: 'nombre', placeholder: 'Nombre', required: true },
    { name: 'primerApellido', placeholder: 'Primer Apellido', required: true },
    { name: 'segundoApellido', placeholder: 'Segundo Apellido (Opcional)', required: false }
  ];

  return (
    <div className="pantalla-auth">
      <div className="auth-container">
        <div className="auth-logo">
          <img src="/LogoNeurometrica500px.png" alt="Logo NeuroMétrica" />
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
          {modo === 'registro' && camposRegistro.map(campo => (
            <input
              key={campo.name}
              type="text"
              placeholder={campo.placeholder}
              value={formData[campo.name]}
              onChange={(e) => actualizarCampo(campo.name, e.target.value)}
              required={campo.required}
            />
          ))}
          
          <input
            type="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChange={(e) => actualizarCampo('email', e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={(e) => actualizarCampo('password', e.target.value)}
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
// COMPONENTE: DASHBOARD
// ============================================
const PantallaDashboard = ({ onCambiarPagina, usuario }) => {
  const [infoExpandida, setInfoExpandida] = useState(false);
  const primerNombre = usuario?.nombre?.split(' ')[0] || '';
  const nombreCapitalizado = capitalizarPrimeraLetra(primerNombre);

  const acciones = [
    {
      icono: '📝',
      titulo: 'Realizar Nuevo Test',
      descripcion: 'Tu perfil comienza aquí',
      accion: () => onCambiarPagina('catalogo'),
      textBoton: 'Comenzar Test'
    },
    {
      icono: '📊',
      titulo: 'Ver Historial',
      descripcion: 'Consulta tus tests anteriores y resultados',
      accion: () => onCambiarPagina('historial'),
      textBoton: 'Ver Historial'
    }
  ];

  return (
    <div className="contenido-pagina">
      <h1>¡Bienvenido {nombreCapitalizado}!</h1>
      <p className="pagina-descripcion">
        Tu desarrollo empieza aquí: conoce quién eres y qué puedes lograr
      </p>

      <div className="cards-grid-acciones">
        {acciones.map((accion, index) => (
          <div key={index} className="card-accion">
            <div className="card-icono">{accion.icono}</div>
            <h3>{accion.titulo}</h3>
            <p>{accion.descripcion}</p>
            <button onClick={accion.accion} className="btn-card">
              {accion.textBoton}
            </button>
          </div>
        ))}
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
              NeuroMétrica es una plataforma de evaluación psicológica y psicométrica diseñada para ayudar a las personas a conocer su perfil personal y profesional. Los usuarios pueden realizar distintos test para descubrir fortalezas, habilidades y áreas de mejora, mientras que las empresas pueden acceder a perfiles completos para tomar decisiones informadas sobre selección de talento y desarrollo de equipos.
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

// ============================================
// COMPONENTE: CATÁLOGO DE TESTS
// ============================================
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
      <p className="pagina-descripcion">Selecciona el test que deseas realizar</p>

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
            <button 
              onClick={() => onSeleccionarTest(test.id)}
              className={`btn-card ${!test.disponible ? 'btn-disabled' : ''}`}
              disabled={!test.disponible}
            >
              {test.disponible ? 'Iniciar Test' : 'Próximamente'}
            </button>
          </div>
        ))}
      </div>

      <button onClick={onVolver} className="btn-link">
        ← Volver a Inicio
      </button>
    </div>
  );
};

// ============================================
// COMPONENTE: TEST CSI
// ============================================
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
        preguntas.forEach((_, i) => respuestasIniciales[i + 1] = null);
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
          respuestas,
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

  const rellenarAleatorio = () => {
  const respuestasAleatorias = {};
  preguntas.forEach((_, i) => {
    respuestasAleatorias[i + 1] = Math.floor(Math.random() * 5); // 0-4
  });
  setRespuestas(respuestasAleatorias);
  setCapacidadAfrontamiento(Math.floor(Math.random() * 5)); // 0-4
  setMensaje('✅ Respuestas rellenadas automáticamente');
  };

  // Paso 1: Instrucciones
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

  // Paso 2: Descripción de situación
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

  // Paso 3: Preguntas
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
          {['En absoluto', 'Un poco', 'Bastante', 'Mucho', 'Totalmente'].map((texto, i) => (
            <span key={i}><strong>{i}</strong> = {texto}</span>
          ))}
        </div>
      </div>

      <div className="progreso-container">
        <div className="progreso-barra">
          <div className="progreso-fill" style={{ width: `${progreso}%` }}></div>
        </div>
        <p className="progreso-texto">
          {preguntasRespondidas} de 40 preguntas respondidas
        </p>
        {/* Botón para rellenar las respuestas de manera aleatoria para agilizar la muestra del funcionamiento */}
        <button 
          onClick={rellenarAleatorio}
          className="btn-secondary"
          style={{ marginTop: '15px', width: '100%' }}
        >
          🎲 Rellenar Aleatoriamente (Modo Prueba)
        </button>
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
};

// ============================================
// COMPONENTE: RESULTADOS
// ============================================
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
          Volver a Inicio
        </button>
      </div>
    );
  }

  const { resultados: res } = resultados;
  const { levels: niveles, interpretations: interpretaciones, percentiles } = res;

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

  const capacidadTexto = ['nada', 'poco', 'moderadamente', 'muy', 'totalmente'];

  return (
    <div className="pantalla pantalla-resultados">
      <h1>Resultados de tu Test CSI</h1>
      <p className="fecha-test">
        Completado el {formatearFecha(resultados.fecha_completado, {
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
          {['high', 'medium', 'low'].map((level, i) => (
            <div key={level} className="stat-card">
              <span className="stat-numero">{res.summary[`${level}_count`]}</span>
              <span className="stat-label">
                Indicadores {['Altos', 'Medios', 'Bajos'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfica de barras */}
      <div className="seccion-grafica">
        <h2>Tus Estrategias de Afrontamiento</h2>
        <div className="grafica-barras">
          {Object.entries(indicadoresInfo).map(([codigo, info]) => (
            <div key={codigo} className="barra-container">
              <div className="barra-label">
                <span className="barra-nombre">{info.nombre}</span>
                <span className={`barra-nivel nivel-${niveles[codigo].toLowerCase()}`}>
                  {niveles[codigo]}
                </span>
              </div>
              <div className="barra-fondo">
                <div 
                  className="barra-fill"
                  style={{ 
                    width: `${percentiles[codigo]}%`,
                    backgroundColor: info.color
                  }}
                >
                  <span className="barra-percentil">{percentiles[codigo]}</span>
                </div>
              </div>
            </div>
          ))}
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
            Te consideraste <strong>{capacidadTexto[resultados.capacidad_afrontamiento]}</strong> capaz de afrontar la situación.
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
        <button onClick={() => window.print()} className="btn-secondary">
          Imprimir Resultados
        </button>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: HISTORIAL
// ============================================
const PantallaHistorial = ({ token, onVolver, onVerResultado, onIrACatalogo }) => {
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
          Volver a Inicio
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
          <button onClick={onIrACatalogo} className="btn-primary">
            Realizar Test
          </button>
        </div>
      ) : (
        <>
          <p className="historial-info">
            Has completado <strong>{tests.filter(t => t.completado).length}</strong> tests
          </p>

          <div className="tests-lista">
            {tests.map((test) => (
              <div key={test.test_id} className="test-card">
                <div className="test-card-header">
                  <div className="test-fecha">
                    <span className="fecha-dia">
                      {formatearFecha(test.fecha_inicio, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="fecha-hora">
                      {formatearFecha(test.fecha_inicio, {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className={`test-estado ${test.completado ? 'completado' : 'pendiente'}`}>
                    {test.completado ? 'Completado' : 'En progreso'}
                  </div>
                </div>

                <div className="test-card-body">
                  {test.completado ? (
                    <>
                      <p className="test-completado-texto">
                        Test completado el {formatearFecha(test.fecha_completado, {
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
            ))}
          </div>
        </>
      )}

      <button onClick={onVolver} className="btn-link btn-volver">
        ← Volver a Inicio
      </button>
    </div>
  );
};

// ============================================
// COMPONENTE: PERFIL
// ============================================
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

  const realizarPeticion = async (url, body) => {
    setCargando(true);
    setMensaje('');

    try {
      const response = await fetch(`${API_URL}${url}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      return { ok: response.ok, data };
    } catch (error) {
      return { ok: false, data: { detail: 'Error de conexión' } };
    } finally {
      setCargando(false);
    }
  };

  const handleGuardarPerfil = async () => {
    const { ok, data } = await realizarPeticion('/perfil/actualizar', datosEdicion);

    if (ok) {
      setMensaje('✅ ' + data.mensaje);
      setModoEdicion(false);
      usuario.nombre = datosEdicion.nombre;
      usuario.telefono = datosEdicion.telefono;
    } else {
      setMensaje('❌ ' + data.detail);
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

    const { ok, data } = await realizarPeticion('/perfil/cambiar-password', {
      password_actual: passwordData.actual,
      password_nueva: passwordData.nueva
    });

    if (ok) {
      setMensaje('✅ ' + data.mensaje);
      setModoPassword(false);
      setPasswordData({ actual: '', nueva: '', confirmar: '' });
    } else {
      setMensaje('❌ ' + data.detail);
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
            {['actual', 'nueva', 'confirmar'].map((campo) => (
              <input
                key={campo}
                type="password"
                placeholder={
                  campo === 'actual' ? 'Contraseña actual' :
                  campo === 'nueva' ? 'Nueva contraseña' :
                  'Confirmar nueva contraseña'
                }
                value={passwordData[campo]}
                onChange={(e) => setPasswordData({...passwordData, [campo]: e.target.value})}
              />
            ))}
            <div className="perfil-botones">
              <button onClick={handleCambiarPassword} disabled={cargando} className="btn-primary">
                {cargando ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
              <button 
                onClick={() => { 
                  setModoPassword(false); 
                  setPasswordData({actual: '', nueva: '', confirmar: ''}); 
                }} 
                className="btn-secondary"
              >
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

  const navegarConTest = (pagina, testId = null) => {
    setPaginaActual(pagina);
    if (testId) setTestIdActual(testId);
  };

  if (!autenticado) {
    return <PantallaAuth onLogin={handleLogin} />;
  }

  const renderizarPagina = () => {
    const paginas = {
      dashboard: <PantallaDashboard onCambiarPagina={setPaginaActual} usuario={usuario} />,
      catalogo: <PantallaCatalogoTests onSeleccionarTest={(id) => id === 'csi' && setPaginaActual('test')} onVolver={() => setPaginaActual('dashboard')} />,
      test: <PantallaTest token={token} onVolver={() => setPaginaActual('dashboard')} onTestCompletado={(id) => navegarConTest('resultados', id)} />,
      resultados: <PantallaResultados token={token} testId={testIdActual} onVolver={() => setPaginaActual('dashboard')} />,
      historial: <PantallaHistorial token={token} onVolver={() => setPaginaActual('dashboard')} onVerResultado={(id) => navegarConTest('resultados', id)} onIrACatalogo={() => setPaginaActual('catalogo')} />,
      perfil: <PantallaPerfil usuario={usuario} token={token} />
    };

    return paginas[paginaActual] || paginas.dashboard;
  };

  return (
    <LayoutProfesional
      usuario={usuario}
      onCerrarSesion={handleCerrarSesion}
      onCambiarPagina={setPaginaActual}
    >
      {renderizarPagina()}
    </LayoutProfesional>
  );
}

export default App;