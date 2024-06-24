// npm i jsonwebtoken: instalar dependencia
import jwt from "jsonwebtoken";

const generarJWT = (id) => {
    return jwt.sign( { id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    } );
    // sign: permite generar el JWT
    // expiresIn: tiempo que va a estar vigente el token (depende de qué tan sensible es la información)
};

export default generarJWT;