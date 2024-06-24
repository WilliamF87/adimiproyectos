import express from "express";
import checkAuth from "../middleware/checkAuth.js";
import {
    autenticar,
    comprobarToken,
    confirmar,
    nuevoPassword,
    olvidePassword,
    perfil,
    registrar
} from "../controllers/usuarioController.js";

const router = express.Router();

// Autenticación, Registro y Confrimación de Usuarios
router.post("/", registrar); // Crea un nuevo Usuario
router.post("/login", autenticar); // Autenticar Usuario
router.get("/confirmar/:token", confirmar); // Los dos puntos en :token permiten generar routing dinamico en express
router.post("/olvide-password", olvidePassword); // Solicitar Token para recuperar password
router.route("/olvide-password/:token")
    .get(comprobarToken) // Validar Token para recuperar password
    .post(nuevoPassword); // Almacenar el nuevo password

router.get("/perfil", checkAuth, perfil);
// next me permite saltar al siguiente middleware (desde checkAuth a perfil)

export default router;