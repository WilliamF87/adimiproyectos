import mongoose from "mongoose";
import bcrypt from "bcryptjs"

const usuarioSchema = mongoose.Schema({
    // Documentación: https://mongoosejs.com/docs/guide.html
        nombre: {
            type: String,
            require: true,
            trim: true
            // trim quita los espacios en blanco al inicio y al final
        },
        password: {
            type: String,
            require: true,
            trim: true
        },
        email: {
            type: String,
            require: true,
            trim: true,
            unique: true
            // unique no permite que se repita este atributo (permite un sólo correo por cuenta)
        },
        confirmado: {
            type: Boolean,
            default: false
        },
        token: {
            type: String,
        }
    },
    {
        timestamps: true,
        // Crea dos columnas más: una de creado (createAt) y otra de actualizadio (updateAt)
    }
);

// Este codigo se ejecuta antes de guardar (documentación: https://mongoosejs.com/docs/middleware.html)
usuarioSchema.pre('save', async function(next) {
    // Este codigo comprueba que el password no haya sido modificado para no hashearlo
    // dos veces (se pierde el string original). Esto pasa cuando el usuario edita su perfil
    // Si se cumple la condición, next() indica que no se debe ejectar el siguiente middleware
    // middleware es un bloque de cógido (en este caso, las siguientes dos lineas)
    if(!this.isModified("password")) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

usuarioSchema.methods.comprobarPassword = async function (passwordFormulario) {
    // Compara un string que no está hasheado con uno que sí lo está y nos dice si está correcto ese passwrord
    return await bcrypt.compare(passwordFormulario, this.password)
};

const Usuario = mongoose.model("Usuario", usuarioSchema);
export default Usuario;