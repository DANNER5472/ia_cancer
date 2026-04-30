/**
 * Unit Tests — Frontend React
 * Proyecto: Sistema de Detección Temprana de Cáncer con IA
 * Autor: Danner Jamanca — UNIFRANZ
 *
 * Setup requerido:
 *   npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
 *
 * Agregar en vite.config.js:
 *   test: { environment: "jsdom", globals: true, setupFiles: "./src/test/setup.js" }
 *
 * Crear src/test/setup.js con:
 *   import "@testing-library/jest-dom";
 *
 * Cómo correr:
 *   npx vitest run          (una vez)
 *   npx vitest              (modo watch)
 *   npx vitest --coverage   (con cobertura)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ---------------------------------------------------------------------------
// BLOQUE 1: Lógica de umbrales (pura, sin React)
// ---------------------------------------------------------------------------

describe("Lógica de umbrales de clasificación cervical", () => {
  /**
   * Esta función debe existir en tu código frontend
   * (en el componente de resultado o en un utils.js).
   * Si no existe aún, créala con este mismo código.
   */
  const clasificarResultado = (probAnormal) => {
    if (probAnormal < 0.40) return "NORMAL";
    if (probAnormal <= 0.60) return "NO CONCLUYENTE";
    return "ANORMAL";
  };

  it("0% de probabilidad → NORMAL", () => {
    expect(clasificarResultado(0.0)).toBe("NORMAL");
  });

  it("25% de probabilidad → NORMAL", () => {
    expect(clasificarResultado(0.25)).toBe("NORMAL");
  });

  it("39.9% → todavía NORMAL (justo bajo el umbral)", () => {
    expect(clasificarResultado(0.399)).toBe("NORMAL");
  });

  it("40% exacto → NO CONCLUYENTE (límite inclusivo)", () => {
    expect(clasificarResultado(0.40)).toBe("NO CONCLUYENTE");
  });

  it("50% → NO CONCLUYENTE", () => {
    expect(clasificarResultado(0.50)).toBe("NO CONCLUYENTE");
  });

  it("60% exacto → NO CONCLUYENTE (límite superior inclusivo)", () => {
    expect(clasificarResultado(0.60)).toBe("NO CONCLUYENTE");
  });

  it("60.1% → ANORMAL", () => {
    expect(clasificarResultado(0.601)).toBe("ANORMAL");
  });

  it("100% → ANORMAL", () => {
    expect(clasificarResultado(1.0)).toBe("ANORMAL");
  });
});


// ---------------------------------------------------------------------------
// BLOQUE 2: Lógica del cuestionario de factores de riesgo
// ---------------------------------------------------------------------------

describe("Cuestionario de factores de riesgo cervical", () => {
  const PESOS = {
    inicio_sexual_temprano:  1.00,
    multiples_parejas:       1.00,
    vph_diagnosticado:       4.50,
    tabaquismo:              0.75,
    anticonceptivos_5_anios: 0.50,
    mas_3_embarazos:         0.30,
    antecedente_familiar:    2.50,
    sin_papanicolaou_3_anios:1.50,
    inmunosupresion:         1.50,
  };

  // Replica la lógica del componente FactoresRiesgo.jsx
  const calcularRiesgoAdicional = (respuestas) => {
    let total = 0;
    for (const [factor, peso] of Object.entries(PESOS)) {
      if (respuestas[factor] === true) {
        total += peso;
      }
      // false y null/undefined no suman (solo suma, nunca resta)
    }
    return parseFloat(total.toFixed(4));
  };

  it("todas las respuestas en 'No' → riesgo adicional 0%", () => {
    const respuestas = Object.fromEntries(
      Object.keys(PESOS).map((k) => [k, false])
    );
    expect(calcularRiesgoAdicional(respuestas)).toBe(0);
  });

  it("todas las respuestas en 'No sabe' (null) → riesgo adicional 0%", () => {
    const respuestas = Object.fromEntries(
      Object.keys(PESOS).map((k) => [k, null])
    );
    expect(calcularRiesgoAdicional(respuestas)).toBe(0);
  });

  it("solo VPH positivo → suma 4.5%", () => {
    const respuestas = Object.fromEntries(
      Object.keys(PESOS).map((k) => [k, false])
    );
    respuestas.vph_diagnosticado = true;
    expect(calcularRiesgoAdicional(respuestas)).toBeCloseTo(4.5, 2);
  });

  it("VPH + antecedente familiar → suma 7.0%", () => {
    const respuestas = Object.fromEntries(
      Object.keys(PESOS).map((k) => [k, false])
    );
    respuestas.vph_diagnosticado = true;
    respuestas.antecedente_familiar = true;
    expect(calcularRiesgoAdicional(respuestas)).toBeCloseTo(7.0, 2);
  });

  it("'No sabe' en VPH no suma nada (mismo resultado que 'No')", () => {
    const conNo = Object.fromEntries(Object.keys(PESOS).map((k) => [k, false]));
    conNo.tabaquismo = true;

    const conNoSabe = { ...conNo, vph_diagnosticado: null };

    expect(calcularRiesgoAdicional(conNo)).toBe(
      calcularRiesgoAdicional(conNoSabe)
    );
  });

  it("todos los factores en 'Sí' → máximo ~13.55%", () => {
    const respuestas = Object.fromEntries(
      Object.keys(PESOS).map((k) => [k, true])
    );
    expect(calcularRiesgoAdicional(respuestas)).toBeCloseTo(13.55, 1);
  });

  it("el riesgo nunca es negativo", () => {
    const respuestas = Object.fromEntries(
      Object.keys(PESOS).map((k) => [k, false])
    );
    expect(calcularRiesgoAdicional(respuestas)).toBeGreaterThanOrEqual(0);
  });
});


// ---------------------------------------------------------------------------
// BLOQUE 3: Validación de imágenes en ImagenUploader
// ---------------------------------------------------------------------------

describe("Validación de archivos en ImagenUploader", () => {
  const EXTENSIONES_VALIDAS = ["image/jpeg", "image/png", "image/tiff"];
  const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

  const validarArchivo = (file) => {
    const errores = [];
    if (!EXTENSIONES_VALIDAS.includes(file.type)) {
      errores.push("Formato no soportado. Use JPG, PNG o TIFF.");
    }
    if (file.size > MAX_BYTES) {
      errores.push("El archivo supera el límite de 10 MB.");
    }
    if (file.size === 0) {
      errores.push("El archivo está vacío.");
    }
    return errores;
  };

  const crearArchivo = (nombre, tipo, bytes) =>
    new File([new ArrayBuffer(bytes)], nombre, { type: tipo });

  it("JPG de 1MB es válido (sin errores)", () => {
    const f = crearArchivo("muestra.jpg", "image/jpeg", 1 * 1024 * 1024);
    expect(validarArchivo(f)).toHaveLength(0);
  });

  it("PNG de 5MB es válido", () => {
    const f = crearArchivo("celulas.png", "image/png", 5 * 1024 * 1024);
    expect(validarArchivo(f)).toHaveLength(0);
  });

  it("TIFF de 8MB es válido", () => {
    const f = crearArchivo("papanicolaou.tif", "image/tiff", 8 * 1024 * 1024);
    expect(validarArchivo(f)).toHaveLength(0);
  });

  it("Archivo PDF retorna error de formato", () => {
    const f = crearArchivo("doc.pdf", "application/pdf", 1024);
    const errores = validarArchivo(f);
    expect(errores.length).toBeGreaterThan(0);
    expect(errores[0]).toMatch(/formato/i);
  });

  it("Imagen de 11MB retorna error de tamaño", () => {
    const f = crearArchivo("grande.jpg", "image/jpeg", 11 * 1024 * 1024);
    const errores = validarArchivo(f);
    expect(errores.some((e) => e.includes("10 MB"))).toBe(true);
  });

  it("Archivo vacío retorna error de contenido", () => {
    const f = crearArchivo("vacio.jpg", "image/jpeg", 0);
    const errores = validarArchivo(f);
    expect(errores.some((e) => e.includes("vacío"))).toBe(true);
  });

  it("Exactamente 10MB es válido (límite inclusivo)", () => {
    const f = crearArchivo("limite.jpg", "image/jpeg", 10 * 1024 * 1024);
    expect(validarArchivo(f)).toHaveLength(0);
  });
});


// ---------------------------------------------------------------------------
// BLOQUE 4: Lógica de roles y redirección
// ---------------------------------------------------------------------------

describe("Sistema de roles y rutas protegidas", () => {
  const RUTAS_POR_ROL = {
    admin:     "/admin/dashboard",
    medico:    "/medico/dashboard",
    enfermera: "/enfermera/dashboard",
    tecnico:   "/tecnico/dashboard",
  };

  const getRutaPorRol = (rol) => RUTAS_POR_ROL[rol] ?? "/login";

  it("rol 'admin' redirige a /admin/dashboard", () => {
    expect(getRutaPorRol("admin")).toBe("/admin/dashboard");
  });

  it("rol 'medico' redirige a /medico/dashboard", () => {
    expect(getRutaPorRol("medico")).toBe("/medico/dashboard");
  });

  it("rol 'enfermera' redirige a /enfermera/dashboard", () => {
    expect(getRutaPorRol("enfermera")).toBe("/enfermera/dashboard");
  });

  it("rol 'tecnico' redirige a /tecnico/dashboard", () => {
    expect(getRutaPorRol("tecnico")).toBe("/tecnico/dashboard");
  });

  it("rol desconocido redirige a /login", () => {
    expect(getRutaPorRol("hacker")).toBe("/login");
  });

  it("rol vacío redirige a /login", () => {
    expect(getRutaPorRol("")).toBe("/login");
  });

  it("rol undefined redirige a /login", () => {
    expect(getRutaPorRol(undefined)).toBe("/login");
  });
});


// ---------------------------------------------------------------------------
// BLOQUE 5: Lógica de notificaciones
// ---------------------------------------------------------------------------

describe("Flujo de notificaciones entre roles", () => {
  /**
   * Replica la lógica de qué tipo de notificación se genera
   * según la acción del actor, como está definido en el flujo del sistema.
   */
  const TIPOS_NOTIFICACION = {
    caso_pendiente:   { de: "enfermera", para: "tecnico" },
    imagen_lista:     { de: "tecnico",   para: "medico"  },
    imagen_rechazada: { de: "medico",    para: "tecnico" },
    no_concluyente:   { de: "medico",    para: "tecnico" },
    resultado_normal: { de: "medico",    para: "enfermera" },
  };

  const obtenerDestinatario = (tipoNotificacion) =>
    TIPOS_NOTIFICACION[tipoNotificacion]?.para ?? null;

  it("caso_pendiente va dirigido al técnico", () => {
    expect(obtenerDestinatario("caso_pendiente")).toBe("tecnico");
  });

  it("imagen_lista va dirigida al médico", () => {
    expect(obtenerDestinatario("imagen_lista")).toBe("medico");
  });

  it("imagen_rechazada va dirigida al técnico", () => {
    expect(obtenerDestinatario("imagen_rechazada")).toBe("tecnico");
  });

  it("resultado_normal va dirigido a la enfermera", () => {
    expect(obtenerDestinatario("resultado_normal")).toBe("enfermera");
  });

  it("tipo de notificación desconocido retorna null", () => {
    expect(obtenerDestinatario("notificacion_inventada")).toBeNull();
  });
});