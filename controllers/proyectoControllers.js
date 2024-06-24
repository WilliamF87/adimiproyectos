import mongoose from "mongoose";
import Proyecto from "../models/Proyecto.js";
import Usuario from "../models/Usuario.js";

const obtenerProyectos = async (req, res) => {
    // const creador = req.usuario._id;
    // const proyectos = await Proyecto.find({creador}); // otra forma
    // find(): por defecto la condición es '$and' y el arreglo tiene que cumplir todas las condiciones
    const proyectos = await Proyecto.find({
        $or: [
            { colaboradores: { $in: req.usuario }},
            { creador: { $in: req.usuario }},
        ],
    })
        // .where("creador") // Esta parte ya no es necesaria porque se puso en el arreglo
        // .equals(req.usuario)
        .select("-tareas");

    return res.json(proyectos);
};

const nuevoProyecto = async (req, res) => {
    const proyecto = new Proyecto(req.body);
    proyecto.creador = req.usuario._id;

    try {
        const proyectoAlmacenado = await proyecto.save();
        return res.json(proyectoAlmacenado);
    } catch (error) {
        console.log(error);
    }

};

const obtenerProyecto = async (req, res) => {
    const { id } = req.params;
    
    // Validar si se está enviando un id que tenga la forma vaida de Mongo
    const valid = mongoose.Types.ObjectId.isValid(id);

    if(!valid) {
        const error = new Error("No encontrado");
        return res.status(404).json({msg: error.message});
    }

    // populate("tareas") trater los datos de la tabla tareas que están relacionados con el proyecto
    // select("-password") sólo se puede usar cuando es una consulta simple a un modelo especifico
    // cuando se cruzan colecciones, se pueden especificar los campos que se requieren("nombre email")
    // const proyecto = await Proyecto.findById(id)
    //     .populate("tareas")
    //     .populate("colaboradores", "nombre email");

    // Aplicar un populate a un campo que ya se le aplico un populate (primero a tareas y luego a completado)
    // select: "nombre" para traer sólo el campo nombre (siempre trae el _id). Con el menos (-) es para quitar los campos 
    const proyecto = await Proyecto.findById(id)
        .populate({ path: "tareas", populate: { path: "completado", select: "nombre"}})
        .populate("colaboradores", "nombre email");

    if(!proyecto) {
        const error = new Error("No encontrado");
        return res.status(404).json({msg: error.message});
    }

    // Comprobar que quien está tratando de acceder al proyecto es el creador o un colaborador
    //.includes no es útil en este caso, sólo sirve para validar un arreglo plano
    // .some acepta una función, es ideal cuando tenemos un objeto que tiene propiedades dentro
    if(proyecto.creador.toString() !== req.usuario._id.toString() &&
        !proyecto.colaboradores.some(colaborador =>
            colaborador._id.toString() === req.usuario._id.toString()
        )    
    ) {
        const error = new Error("Acción no Válida");
        return res.status(404).json({msg: error.message});
    }

    // Obtener las tareas del proyecto
    // const tareas = await Tarea.find().where("proyecto").equals(id);
    
    // return res.json({
    //     proyecto,
    //     tareas
    // });

    return res.json(proyecto);
};

const editarProyecto = async (req, res) => {
    const { id } = req.params;
    
    const valid = mongoose.Types.ObjectId.isValid(id);

    if(!valid) {
        const error = new Error("No encontrado");
        return res.status(404).json({msg: error.message});
    }

    const proyecto = await Proyecto.findById(id);

    if(!proyecto) {
        const error = new Error("No encontrado");
        return res.status(404).json({msg: error.message});
    }

    if(proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error("Acción no Válida");
        return res.status(404).json({msg: error.message});
    }

    // Si el usuario envia algo se acutualiza, si no lo hace se asigna lo que ya hay en la base de datos
    proyecto.nombre = req.body.nombre || proyecto.nombre;
    proyecto.descripcion = req.body.descripcion || proyecto.descripcion;
    proyecto.fechaEntrega = req.body.fechaEntrega || proyecto.fechaEntrega;
    proyecto.cliente = req.body.cliente || proyecto.cliente;

    try {
        const proyectoAlmacenado = await proyecto.save();
        return res.json(proyectoAlmacenado);
    } catch (error) {
        console.log(error);
    }
        
};

const eliminarProyecto = async (req, res) => {
    const { id } = req.params;
    
    const valid = mongoose.Types.ObjectId.isValid(id);

    if(!valid) {
        const error = new Error("No encontrado");
        return res.status(404).json({msg: error.message});
    }

    const proyecto = await Proyecto.findById(id);

    if(!proyecto) {
        const error = new Error("No encontrado");
        return res.status(404).json({msg: error.message});
    }

    if(proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error("Acción no Válida");
        return res.status(404).json({msg: error.message});
    }

    try {
        await proyecto.deleteOne();
        return res.json({ msg: "Proyecto eliminado" });
    } catch (error) {
        console.log(error);
    }
};

const buscarColaborador = async (req, res) => {
    const { email } = req.body;
    const usuario = await Usuario.findOne({email})
        .select("-confirmado -createdAt -password -token -updatedAt -__v");

    if(!usuario) {
        const error = new Error("Usuario no encontrado");
        return res.status(404).json({msg: error.message});
    }

    return res.json(usuario);
};

const agregarColaborador = async (req, res) => {
    const proyecto = await Proyecto.findById(req.params.id);

    if(!proyecto) {
        const error = new Error("Proyecto no encontrado");
        return res.status(404).json({msg: error.message});
    }

    if(proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error("Acción no valida");
        return res.status(404).json({msg: error.message});
    }

    const { email } = req.body;
    const usuario = await Usuario.findOne({email})
        .select("-confirmado -createdAt -password -token -updatedAt -__v");

    if(!usuario) {
        const error = new Error("Usuario no encontrado");
        return res.status(404).json({msg: error.message});
    }

    // El colaborador no puede ser el admin del proyecto
    if(proyecto.creador.toString() === usuario._id.toString()) {
        const error = new Error("El creador del proyecyo no puede ser colaborador");
        return res.status(404).json({msg: error.message});
    }

    // El colaborador no puede estar agregado al proyecto
    if(proyecto.colaboradores.includes(usuario._id)) {
        const error = new Error("El usuario ya pertenece al proyecto");
        return res.status(404).json({msg: error.message});
    }

    // Agregar colaborador
    proyecto.colaboradores.push(usuario._id);
    await proyecto.save();
    return res.json({msg: "Colaborador agregado correctamente"});
};

const eliminarColaborador = async (req, res) => {
    const proyecto = await Proyecto.findById(req.params.id);

    if(!proyecto) {
        const error = new Error("Proyecto no encontrado");
        return res.status(404).json({msg: error.message});
    }

    if(proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error("Acción no valida");
        return res.status(404).json({msg: error.message});
    }

    // Eliminar colaborador
    proyecto.colaboradores.pull(req.body.id);
    // push es para añadir elementos a un array y pull para eliminarlos
    await proyecto.save();

    return res.json({msg: "Colaborador eliminado correctamente"});
};

export {
    obtenerProyectos,
    nuevoProyecto,
    obtenerProyecto,
    editarProyecto,
    eliminarProyecto,
    buscarColaborador,
    agregarColaborador,
    eliminarColaborador
};