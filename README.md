# Isabella Villaseñor AI — Terminal Cognitivo C.R.O.W.N.

> **Arquitectura Cognitiva Híbrida, Gobernanza Ética y Soberanía Territorial**

![Version](https://img.shields.io/badge/version-4.2.0-blue)
![License](https://img.shields.io/badge/license-CC%20BY%204.0-green)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen)

---

## Índice

1. [Qué es Isabella](#qué-es-isabella)
2. [Arquitectura](#arquitectura)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Módulos del Sistema](#módulos-del-sistema)
5. [Pipeline C.R.O.W.N.](#pipeline-crown)
6. [Sistema de Memoria](#sistema-de-memoria)
7. [Seguridad y Autenticación](#seguridad-y-autenticación)
8. [API Keys y Acceso](#api-keys-y-acceso)
9. [Intro Cinematográfico](#intro-cinematográfico)
10. [Instalación y Desarrollo](#instalación-y-desarrollo)
11. [Posicionamiento Global](#posicionamiento-global)
12. [Porcentajes de Avance](#porcentajes-de-avance)
13. [Roadmap](#roadmap)

---

## Qué es Isabella

**Isabella Villaseñor AI** es la capa cognitiva híbrida, el motor de orquestación ética y la interfaz territorial del Gemelo Digital de Real del Monte dentro del Ecosistema TAMV.

Isabella **no es**:
- Un chatbot comercial
- Un wrapper de API
- Un único LLM
- Un sistema de extracción masiva de datos
- Una novia virtual ni asistente de entretenimiento superficial
- Una AGI
- Un agente autónomo sin control humano

Isabella **es**:
- Un sistema de orquestación cognitiva con 5 nodos funcionales
- Un motor de gobernanza con política Zero Trust
- Un sistema de memoria jerárquica de 5 scopes
- Una interfaz territorial con soberanía humana
- Un framework de agentes con skills extensibles

### Doctrina de Operación

> Las inteligencias sugieren, calculan y evalúan; el humano decide, aprueba y ejecuta. Cuando exista incertidumbre, el sistema debe convertirla en retroalimentación estructurada, no en falsa certeza.

---

## Arquitectura

### Modelo: Governed Federated Cognitive AI

Isabella implementa una arquitectura de **7 Fabrics** (tejidos) distribuidos:

```
┌─────────────────────────────────────────────────────────────┐
│                    CROWN GATEWAY                            │
│              Orquestación • Ruteo • Arbitraje               │
├─────────┬─────────┬─────────┬─────────┬─────────┬──────────┤
│ COGNITIVE│ MEMORY  │ ACTION  │ TRUST   │EXPERIENCE│ECONOMIC │
│  FABRIC  │ FABRIC  │ FABRIC  │ FABRIC  │ FABRIC  │ FABRIC  │
├─────────┴─────────┴─────────┴─────────┴─────────┴──────────┤
│                INFRASTRUCTURE FABRIC                        │
│         Despliegue • Monitoreo • Resiliencia                │
└─────────────────────────────────────────────────────────────┘
```

### Nodos Cognitivos

| Nodo | Responsabilidad | Color |
|------|----------------|-------|
| **CROWN** | Orquestación, ruteo, arbitraje | Eléctrico |
| **ISA** | Presencia, tono, empatía | Rosa |
| **SOPHIA** | Epistemología, razonamiento | Iris |
| **ORION** | Ejecución, generación técnica | Esmeralda |
| **ARGUS** | Gobernanza, defensa, veto | Ámbar |

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19, TanStack Router/Start |
| **UI** | Tailwind CSS v4, Radix UI, Lucide Icons |
| **3D** | Three.js (intro cinematográfico) |
| **Estado** | React Hooks personalizados |
| **Backend** | Supabase (PostgreSQL + Auth) |
| **AI Gateway** | Lovable API Gateway (Gemini 3.6 Flash) |
| **Validación** | Zod (esquemas tipados) |
| **Build** | Vite 8, TypeScript 5.8 |
| **Seguridad** | Crypto nativo Node.js, HMAC-SHA512 |

---

## Módulos del Sistema

### 1. Motor Cognitivo (`src/lib/crown.ts`)

El corazón del sistema C.R.O.W.N.:

- **Intent Assessment**: Clasifica la intención del usuario
- **Policy Gate**: Evalúa riesgo y aplica políticas
- **Node Router**: Decide qué nodo responde
- **Risk Assessment**: Calcula nivel de riesgo
- **Audit Trail**: Registra cada decisión

### 2. Sistema de Memoria (`src/lib/agent/memory.ts`)

Memoria jerárquica de 5 scopes:

```typescript
type MemoryScope =
  | "immediate"    // Ventana corta de atención
  | "session"      // Contexto de conversación activa
  | "project"      // Contexto técnico del repositorio
  | "territorial"  // Conocimiento del territorio
  | "historical";  // Memoria persistente soberana
```

**Capacidades**:
- Búsqueda semántica por relevancia
- Promoción automática entre scopes
- Retención mínima necesaria
- Respeto a borrado y caducidad

### 3. Sistema de Skills (`src/lib/agent/skills.ts`)

Registro extensible de habilidades:

```typescript
interface Skill {
  id: string;
  name: string;
  description: string;
  risk: "low" | "medium" | "high" | "critical";
  execute: (input: unknown) => Promise<unknown>;
}
```

**Skills incluidos**:
- `memory_search` - Búsqueda en memoria
- `web_search` - Búsqueda web
- `code_analysis` - Análisis de código
- `policy_check` - Verificación de políticas
- `territory_query` - Consulta territorial
- `skill_manage` - Gestión de skills
- `memory_manage` - Gestión de memoria
- `system_status` - Estado del sistema

### 4. Intro Cinematográfico (`src/components/intro/`)

Secuencia de activación de 50 segundos:

| Fase | Tiempo | Descripción |
|------|--------|-------------|
| VOID | 0-5s | Negros profundos |
| STELLAR_FIELD | 5-12s | Estrellas 2D/3D |
| COMET_PASSAGE | 12-19s | 3 cometas con estela |
| COGNITIVE_CORE | 19-26s | Anillos concéntricos |
| LOGO_REVEAL | 26-33s | Logo geométrico |
| HEARTBEAT | 33-39s | Corazón con pulso |
| HUMMINGBIRD | 39-47s | Colibrí con vuelo |
| INTERFACE_REVEAL | 47-50s | HUD y estado |

**Características**:
- Three.js vanilla para control total
- Detección automática de performance (high/medium/low)
- `prefers-reduced-motion` compatibility
- Parallax de mouse
- Cámara cinematográfica con 4 planos
- Botón "Saltar →"

### 5. Módulo de Seguridad (`src/lib/security/`)

Infraestructura completa de seguridad:

- **Crypto**: HMAC-SHA512, AES-256-GCM, scrypt
- **API Keys**: Generación 512 bytes, rotación, validación
- **Auth**: Middleware con soporte API Key, session, HMAC
- **Headers**: CSP, HSTS, CORS, X-Frame-Options
- **Sanitization**: XSS, SQL, filename, URL, input

---

## Pipeline C.R.O.W.N.

Toda entrada pasa por este ciclo:

```
1. PERCEIVE
   └─ Sanitiza entrada, genera traceId, normaliza metadatos

2. REMEMBER
   └─ Recupera contexto desde scopes permitidos

3. POLICY GATE
   └─ ARGUS evalúa riesgo, reglas y restricciones
   └─ Resultado: allowed | requires_approval | denied

4. DECIDE
   └─ CROWN pondera nodos y determina plan de acción

5. ACT
   └─ Solo ejecuta herramientas autorizadas y validadas

6. AUDIT
   └─ Registra DecisionRecord y AuditBundle
```

### Niveles de Decisión

| Nivel | Descripción |
|-------|------------|
| **Allowed** | Ejecución estándar con monitoreo |
| **Requires Approval** | Pausa y confirmación humana |
| **Denied** | Bloqueo inmediato y auditoría |

---

## Sistema de Memoria

### Almacenamiento

- **Cliente**: localStorage con encriptación
- **Producción**: Supabase PostgreSQL
- **Caché**: Memoria en tiempo de ejecución

### Formato de Entrada

```typescript
interface MemoryEntry {
  id: string;
  scope: MemoryScope;
  content: string;
  metadata: {
    confidence: number;    // 0-1
    source: string;
    tags: string[];
    accessCount: number;
    lastAccessed: number;
  };
  createdAt: number;
  expiresAt: number | null;
}
```

### Búsqueda

- Búsqueda por similitud de texto
- Filtrado por scope, tags, fecha
- Ordenamiento por relevancia
- Límite configurable

---

## Seguridad y Autenticación

### Autenticación Criptográfica (512 bytes)

```typescript
// Generar key de 512 bytes
const { key, salt } = generate512ByteKey(passphrase);

// Crear key desde entropía
const key = create512ByteKeyFromEntropy(randomBytes(256));

// HMAC-SHA512
const signature = createHMAC512(key, data);
const isValid = verifyHMAC512(key, data, signature);
```

### API Keys

**Formato**: `isa_v1_<base64url>`

```typescript
// Generar API key
const { rawKey, keyHash, keyId } = generateAPIKey({
  name: "Production Key",
  scopes: ["cognitive:read", "cognitive:write"],
  expiresInDays: 90,
});

// Validar
const result = validateAPIKey(apiKey, storedKeys, requiredScope);
```

### Headers de Seguridad

```
Content-Security-Policy: default-src 'self'; script-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Permissions-Policy: camera=(), microphone=()
```

### Rate Limiting

- **Por minuto**: 60 requests
- **Por hora**: 1,000 requests
- **Por día**: 10,000 requests

### Sanitización

- XSS: Escapar `<`, `>`, `"`, `'`, `/`
- SQL: Escapar comillas, eliminar comments
- Filenames: Solo `[a-zA-Z0-9._-]`
- URLs: Solo `http://` y `https://`
- Input: Longitud máxima 10,000 chars

---

## API Keys y Acceso

### Crear API Key

```typescript
import { generateAPIKey, createAPIKeyRecord } from "@/lib/security";

const generated = generateAPIKey({
  name: "Mi Aplicación",
  scopes: ["api:access", "cognitive:read"],
  expiresInDays: 365,
  rateLimit: {
    requestsPerMinute: 30,
    requestsPerHour: 500,
    requestsPerDay: 5000,
  },
});

// Guardar solo el hash, NO la key cruda
const record = createAPIKeyRecord(generated);
apiKeyStore.add(record);
```

### Usar API Key

```typescript
// En headers HTTP
headers: {
  "X-API-Key": "isa_v1_...",
  // o
  "Authorization": "Bearer isa_v1_..."
}
```

### Rotar API Key

```typescript
const result = rotateAPIKey(oldKeyId, {
  name: "Nueva Key",
  scopes: ["api:access"],
});

// result.newKey.rawKey — mostrar UNA vez
// result.newRecord — guardar en base de datos
```

### Scopes Disponibles

| Scope | Descripción |
|-------|------------|
| `cognitive:read` | Leer del motor cognitivo |
| `cognitive:write` | Escribir al motor cognitivo |
| `memory:read` | Leer de la memoria |
| `memory:write` | Escribir a la memoria |
| `pipeline:execute` | Ejecutar pipeline C.R.O.W.N. |
| `skills:manage` | Gestionar skills |
| `admin:read` | Acceso administrativo lectura |
| `admin:write` | Acceso administrativo escritura |
| `api:access` | Acceso general a la API |
| `*` | Acceso total (solo admin) |

---

## Intro Cinematográfico

### Visualización

El intro se muestra automáticamente al cargar la aplicación por primera vez.

**Elementos 3D**:
- Starfield 2D/3000+ estrellas con parallax
- 3 cometas con trayectoria CatmullRom y estela de partículas
- 3 anillos concéntricos rotatorios
- Logo geométrico (Octaedro + Torus)
- Corazón 3D con doble pulso
- Colibrí con vuelo y batido de alas variable
- Líneas HUD y dots de estado

**Controles**:
- Saltar: Botón "Saltar →" en esquina inferior derecha
- Reduced Motion: Se salta automáticamente si el SO lo solicita
- Performance: Se detecta automáticamente (high/medium/low)

### Personalización

```typescript
<CinematicIntro
  onComplete={() => setIntroComplete(true)}
  onPhaseChange={(phase) => console.log(phase)}
  skipOnReducedMotion={true}
/>
```

---

## Instalación y Desarrollo

### Requisitos

- Node.js 18+
- npm o bun
- Git

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/OsoPanda1/isabella-s-core-intelligence.git
cd isabella-s-core-intelligence

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Scripts Disponibles

| Script | Descripción |
|--------|------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificación de tipos |
| `npm run format` | Prettier |

### Variables de Entorno

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

# AI Gateway
VITE_AI_GATEWAY_URL=https://ai.gateway.lovable.dev
VITE_AI_GATEWAY_API_KEY=xxx
```

### Estructura del Proyecto

```
src/
├── components/
│   ├── intro/           # Intro cinematográfico
│   └── isabella/        # Componentes de la UI
├── lib/
│   ├── agent/           # Módulos del agente
│   │   ├── memory.ts    # Sistema de memoria
│   │   ├── pipeline.ts  # Pipeline C.R.O.W.N.
│   │   ├── skills.ts    # Sistema de skills
│   │   ├── fabrics.ts   # Definiciones de fabrics
│   │   └── quantum.ts   # Quantum bridge
│   ├── security/        # Seguridad
│   │   ├── crypto.ts    # Criptografía
│   │   ├── api-keys.ts  # Gestión de API keys
│   │   ├── auth.ts      # Autenticación
│   │   └── headers.ts   # Headers y sanitización
│   ├── crown.ts         # Motor C.R.O.W.N.
│   ├── crown-ui.ts      # UI de C.R.O.W.N.
│   └── useIsabellaAgent.ts  # Hook principal
├── i18n/                # Internacionalización
├── routes/              # Rutas TanStack
└── styles.css           # Estilos Tailwind
```

---

## Posicionamiento Global

### Categoría

**Cognitive AI Governance Platform**

Isabella se posiciona como una plataforma de **gobernanza cognitiva** que combina:

1. **IA Conversacional** con contexto territorial
2. **Gobernanza Zero Trust** para decisiones críticas
3. **Memoria Jerárquica** para conocimiento persistente
4. **Auditoría Total** para trazabilidad
5. **Soberanía Humana** como principio fundamental

### Diferenciadores

| Característica | Isabella | ChatGPT | Copilot |
|---------------|---------|---------|---------|
| Gobernanza Zero Trust | ✅ | ❌ | ❌ |
| Memoria Territorial | ✅ | ❌ | ❌ |
| Auditoría Auditable | ✅ | ❌ | ❌ |
| Soberanía Humana | ✅ | ❌ | ❌ |
| Multi-Modelo | ✅ | ❌ | ❌ |
| API Keys Nativas | ✅ | ✅ | ✅ |
| Intro Cinematográfica | ✅ | ❌ | ❌ |

### Mercado Objetivo

- **Gobiernos locales** y municipios
- **Organizaciones** con datos sensibles
- **Desarrolladores** que necesitan IA gobernada
- **Empresas** con requisitos de soberanía de datos
- **Investigadores** en IA ética

---

## Porcentajes de Avance

### Estado Actual (v4.2.0)

| Módulo | Estado | Avance |
|--------|--------|--------|
| **Core C.R.O.W.N.** | ✅ Completo | 95% |
| **Pipeline de 6 etapas** | ✅ Completo | 100% |
| **Memoria Jerárquica** | ✅ Completo | 90% |
| **Sistema de Skills** | ✅ Completo | 85% |
| **UI Terminal** | ✅ Completo | 90% |
| **Intro Cinematográfico** | ✅ Completo | 100% |
| **Seguridad/Auth** | ✅ Completo | 95% |
| **API Keys** | ✅ Completo | 100% |
| **i18n (es/en)** | ✅ Completo | 80% |
| **Quantum Bridge** | 🔧 En progreso | 40% |
| **Fabric Definitions** | ✅ Completo | 70% |
| **Testing** | 🔧 En progreso | 30% |
| **Documentación** | ✅ Completo | 90% |

### Producción y Despliegue

| Fase | Estado | Avance |
|------|--------|--------|
| **Desarrollo Core** | ✅ | 95% |
| **Integración UI** | ✅ | 90% |
| **Seguridad** | ✅ | 95% |
| **Testing E2E** | 🔧 | 30% |
| **Optimización** | 🔧 | 60% |
| **Deploy** | ⏳ | 20% |
| **Documentación** | ✅ | 90% |

**Avance General para Producción: ~75%**

---

## Roadmap

### v4.3.0 (Próximo)
- [ ] Testing E2E completo
- [ ] Optimización de performance
- [ ] Quantum Bridge v2
- [ ] Dashboard de monitoreo

### v4.4.0
- [ ] Multi-idioma completo (pt, fr, de)
- [ ] Plugins de terceros
- [ ] Webhook system
- [ ] Audit export

### v5.0.0
- [ ] Federación de nodos
- [ ] Blockchain para auditoría
- [ ] Edge computing
- [ ] Mobile app

---

## Licencia

**Creative Commons Attribution 4.0 International (CC BY 4.0)**

### Autoría

- **Nombre**: Edwin Oswaldo Castillo Trejo (Anubis Villaseñor)
- **ORCID**: 0009-0008-5050-1539
- **Organización**: TAMV ONLINE NETWORK / RDM Digital Hub
- **Ubicación**: Real del Monte, Hidalgo, México

### Uso Permitido

- ✅ Uso comercial
- ✅ Modificación
- ✅ Distribución
- ✅ Uso privado
- ✅ Uso académico

### Condiciones

- 📋 **Atribución**: Incluir crédito al autor
- 📋 **Licenciar**: Usar la misma licencia para derivative works
- 📋 **Sin garantías**: El software se provee "tal cual"

---

## Contacto

- **GitHub**: [OsoPanda1/isabella-s-core-intelligence](https://github.com/OsoPanda1/isabella-s-core-intelligence)
- **ORCID**: [0009-0008-5050-1539](https://orcid.org/0009-0008-5050-1539)

---

> *"Isabella existe para coordinar inteligencia, territorio, memoria y gobernanza bajo soberanía humana."*
