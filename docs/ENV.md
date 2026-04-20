# Variables de entorno (frontend)

Guarda estos valores en `.env` (build) o `.env.local` (desarrollo).  
Reinicia `npm run dev` cada vez que agregues o cambies un `VITE_*`.

| Variable       | Descripción                                                | Ejemplo               |
|----------------|------------------------------------------------------------|-----------------------|
| `VITE_API_URL` | Base URL del backend FastAPI (`/admin/...`).               | `http://localhost:8000` |

Notas:

1. El frontend no se conecta directo a Cloud SQL; toda la data pasa por el backend.
2. Si agregas nuevas variables públicas, documenta aquí y en `.env.example`.
