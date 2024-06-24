import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

const checkAuth = async (req, res, next) => {
    let token;

    if(
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
        ) {
            try {
                // split(" ")[1] divide token en 2 posiciones. 0 = Bearer y 1 = TOKEN
                token = req.headers.authorization.split(" ")[1];

                // Todo esto estaba afuera del trycatch, revisar si funciona
                try {
                    // jwt.verify permite decodificar el token
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
                    // select("-password"): quitar el password de la respuesta
                    req.usuario = await Usuario.findById(decoded.id).select(
                        "-password -confirmado -token -createdAt -updatedAt -__v"
                    );
                } catch (error) {
                    console.log(error)
                }


                return next(); // Permite pasar al siguiente middleware (por ejemplo: perfil en usuarioContoller)
            } catch (error) {
                return res.status(404).json({ msg: "Hubo un error"});                
            }
    };

    if(!token) {
        const error = new Error("Token no válido");
        return res.status(401).json({ msg: error.message });
    }
};

export default checkAuth;