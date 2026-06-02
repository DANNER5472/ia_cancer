import { describe, it, expect } from "vitest";

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

  it("PDF retorna error de formato", () => {
    const f = crearArchivo("doc.pdf", "application/pdf", 1024);
    const errores = validarArchivo(f);
    expect(errores.length).toBeGreaterThan(0);
    expect(errores[0]).toMatch(/formato/i);
  });

  it("Imagen de 11MB retorna error de tamaño", () => {
    const f = crearArchivo("grande.jpg", "image/jpeg", 11 * 1024 * 1024);
    expect(validarArchivo(f).some((e) => e.includes("10 MB"))).toBe(true);
  });

  it("Exactamente 10MB es válido (límite inclusivo)", () => {
    const f = crearArchivo("limite.jpg", "image/jpeg", 10 * 1024 * 1024);
    expect(validarArchivo(f)).toHaveLength(0);
  });
});

///npx vitest run src/test/validacion_imagen.test.js