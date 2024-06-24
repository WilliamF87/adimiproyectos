import express from "express";
import dotenv from "dotenv";
import conectarBD from "./config/db.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import proyectoRoutes from "./routes/proyectoRoutes.js";
import tareaRoutes from "./routes/tareaRoutes.js";
import cors from "cors";

const app = express();
app.use(express.json());
// Permite que la app procese la inofmación de tipo json

dotenv.config();

conectarBD();

// Configurar CORS
const whiteList = [process.env.FRONTED_URL, process.env.FRONTED_URL_2];

const corsOptions = {
    origin: function(origin, callback) {
        if(whiteList.includes(origin)) {
            // Puede consultar la API
            callback(null, true);
            // Le damos el acceso con el true
        } else {
            // No está permitido
            callback(new Error("Error de Cors"));
        }
    }
};

app.use(cors(corsOptions));

// Routing
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/proyectos", proyectoRoutes);
app.use("/api/tareas", tareaRoutes);

const PORT = process.env.PORT || 4000;
// Esta variable de entorno se va a crear en el servidor de producción automaticamente
// En caso de que no exista (cuando estamos en local) se le asiga el puerto 4000

const servidor = app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// Socket.io (los import pueden ir arriba)
import { Server } from "socket.io";

const io = new Server(servidor, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.FRONTED_URL,
    }
});

io.on("connection", (socket) => {
    // console.log("Conectado a Socket.io");
    // emit es para crear el evento y on es qué voy a hacer cuando ese evento ocurra

    // Definir los eventos de socket io
    socket.on("abrir proyecto", (proyecto) => {
        socket.join(proyecto);
        // join: cuando los usuario entran a proyecto, cada uno entra a un socket diferente
        // Es como si cada uno entrara a un cuarto diferente
    });
    
    socket.on("nueva tarea", tarea => {
        const proyecto = tarea.proyecto;
        socket.to(proyecto).emit("tarea agregada", tarea);
        // socket.to(proyecto): emite el evento a los usuarios que se encuentren en ese proyecto (in o to son iguales)
    });

    socket.on("eliminar tarea", tarea => {
        const proyecto = tarea.proyecto;
        socket.to(proyecto).emit("tarea eliminada", tarea);
    });

    socket.on("actualizar tarea", tarea => {
        const proyecto = tarea.proyecto._id;
        socket.to(proyecto).emit("tarea actualizada", tarea);
    });

    socket.on("cambiar estado", tarea => {
        const proyecto = tarea.proyecto._id;
        socket.to(proyecto).emit("nuevo estado", tarea);
    });
});

