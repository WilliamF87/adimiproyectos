import mongoose from "mongoose";

const conectarBD = async () => {
    const user = process.env.USER;
    const password = process.env.PASSWORD;
    const db = process.env.DB;

    try {
        const connection = await mongoose.connect(
            // `mongodb+srv://${user}:${password}@cluster0.2r9dx.mongodb.net/${db}?retryWrites=true&w=majority`,
            `mongodb+srv://${user}:${password}@cluster0.huenyqh.mongodb.net/${db}`,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }
        );

        const url = `${connection.connection.host}:${connection.connection.port}`;
        console.log(`MongoDB conectado en: ${url}`)
    } catch (error) {
        console.log(`error: ${error.message}`);
        process.exit(1);
        // process.exit(1): va a terminar los procesos en caso de que la app no se pueda conectar a la BD
        // 0 es un código de éxito y 1 un código de error. Normalmente Node termina sus procesos con 0
    }
}

export default conectarBD;