import { describe, it, expect } from "vitest";

describe("Sistema de roles y rutas protegidas", () => {
  const RUTAS_POR_ROL = {
    admin:     "/admin/dashboard",
    medico:    "/medico/dashboard",
    enfermera: "/enfermera/dashboard",
    tecnico:   "/tecnico/dashboard",
  };
  const getRutaPorRol = (rol) => RUTAS_POR_ROL[rol] ?? "/login";
  it("rol 'admin' a /admin/dashboard", () => {
    expect(getRutaPorRol("admin")).toBe("/admin/dashboard");
  });
  it("rol 'medico' a /medico/dashboard", () => {
    expect(getRutaPorRol("nose")).toBe("/medico/dashboard");
  });
  it("rol 'enfermera' a /enfermera/dashboard", () => {
    expect(getRutaPorRol("enfera")).toBe("/enfermera/dashboard");
  });
  it("rol 'tecnico' a /tecnico/dashboard", () => {
    expect(getRutaPorRol("pancho")).toBe("/tecnico/dashboard");
});
});



