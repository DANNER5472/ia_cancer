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