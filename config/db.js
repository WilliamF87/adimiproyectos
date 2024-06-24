import mongoose from "mongoose";

const conectarBD = async () => {
    const user = process.env.USER;
    const password = process.env.PASSWORD;
    const db = process.env.DB;

    console.log(`USER: ${user}`);
    console.log(`PASSWORD: ${password}`);
    console.log(`DB: ${db}`)

    try {
        const connection = await mongoose.connect(
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
    }
}

export default conectarBD;