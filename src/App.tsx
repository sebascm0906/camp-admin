import './App.css'

const quickLinks = [
  { label: 'Campers', hint: 'Revisa y edita registros' },
  { label: 'Staff', hint: 'Importa asignaciones' },
  { label: 'Actividades', hint: 'Configura slots semanales' },
  { label: 'CSV Imports', hint: 'Carga datos masivos' },
]

function App() {
  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">CampApp · Admin Portal</p>
        <h1>Panel oscuro listo para conectar tus APIs.</h1>
        <p className="lede">
          Una base React + Vite con tema nocturno para que enfoques tu energía
          en la integración con FastAPI y Firebase.
        </p>
        <div className="cta-row">
          <button type="button">Iniciar sesión</button>
          <a className="ghost-btn" href="https://vite.dev" target="_blank" rel="noreferrer">
            Ver documentación
          </a>
        </div>
      </header>

      <section className="panels">
        {quickLinks.map((item) => (
          <article key={item.label} className="panel">
            <div>
              <h2>{item.label}</h2>
              <p>{item.hint}</p>
            </div>
            <span aria-hidden="true">→</span>
          </article>
        ))}
      </section>
    </main>
  )
}

export default App
