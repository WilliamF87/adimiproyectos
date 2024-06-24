import mongoose from "mongoose";
import Proyecto from "../models/Proyecto.js";
import Tarea from "../models/Tarea.js";

const agregarTarea = async (req, res) => {

    const { proyecto } = req.body;

    const valid = mongoose.Types.ObjectId.isValid(proyecto);

    if(!valid) {
        const error = new Error("No encontrado");
        return res.status(404).json({ msg: error.message });
    }

    const existeProyecto = await Proyecto.findById(proyecto);
    
    if(!existeProyecto) {
        const error = new Error("El Proyecto no existe");
        return res.status(404).json({ msg: error.message });
    }

    if(existeProyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error("No tienes los permisos para añadir tareas");
        return res.status(404).json({ msg: error.message });
    }

    try {
        // const tarea = new Tarea(req.body);
        // const tareaAlmacenada = await tarea.save(); // Otra forma
        const tareaAlmacenada = await Tarea.create(req.body);

        // Almacenar el Id de la Tarea en el Proyecto
        existeProyecto.tareas.push(tareaAlmacenada._id);
        await existeProyecto.save();

        return res.json(tareaAlmacenada);
    } catch (error) {
        console.log(error);
    }
};

const obtenerTarea = async (req, res) => {
    const { id } = req.params;

    const valid = mongoose.Types.ObjectId.isValid(id);

    if(!valid) {
        const error = new Error("No encontrado");
        return res.status(404).json({ msg: error.message });
    }

    // populate: permite cruzar las colecciones Tareas y Proyectos para evitar una doble consulta a la BD
    // Los datos de Proyecto están asociados a Tarea por el atributo ref 
    // Errores 404: no se econtró algo, 403: no se tienen los permisos, 401: rerquiere autenticación
    const tarea = await Tarea.findById(id).populate("proyecto");

    if(!tarea) {
        const error = new Error("Tarea no encontrada");
        return res.status(404).json({ msg: error.message });
    }

    if(tarea.proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error("Acción no válida");
        return res.status(403).json({ msg: error.message });
    }

    return res.json(tarea);
};

const actualizarTarea = async (req, res) => {
    const { id } = req.params;

    const valid = mongoose.Types.ObjectId.isValid(id);

    if(!valid) {
        const error = new Error("No encontrado");
        return res.status(404).json({ msg: error.message });
    }

    const tarea = await Tarea.findById(id).populate("proyecto");

    if(!tarea) {
        const error = new Error("Tarea no encontrada");
        return res.status(404).json({ msg: error.message });
    }

    if(tarea.proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error("Acción no válida");
        return res.status(403).json({ msg: error.message });
    }

    tarea.nombre = req.body.nombre || tarea.nombre;
    tarea.descripcion = req.body.descripcion || tarea.descripcion;
    tarea.prioridad = req.body.prioridad || tarea.prioridad;
    tarea.fechaEntrega = req.body.fechaEntrega || tarea.fechaEntrega;

    try {
        const tareaActualizada = await tarea.save();
        return res.json(tareaActualizada);
    } catch (error) {
        console.log(error);
    }

};

const eliminarTarea = async (req, res) => {
    const { id } = req.params;

    const valid = mongoose.Types.ObjectId.isValid(id);

    if(!valid) {
        const error = new Error("No encontrado");
        return res.status(404).json({ msg: error.message });
    }

    const tarea = await Tarea.findById(id).populate("proyecto");

    if(!tarea) {
        const error = new Error("Tarea no encontrada");
        return res.status(404).json({ msg: error.message });
    }

    if(tarea.proyecto.creador.toString() !== req.usuario._id.toString()) {
        const error = new Error("Acción no válida");
        return res.status(403).json({ msg: error.message });
    }

    // const proyecto = tarea.proyecto;

    try {
        // Eliminar el Id de la Tarea en el Proyecto
        const proyecto = await Proyecto.findById(tarea.proyecto);
        proyecto.tareas.pull(req.params.id);
        
        // Promise.allSettled las dos lineas del arreglo se inician al mismo tiempo
        // y sólo pasa a la siguiente lineacuando los dos se hayan ejecutado
        await Promise.allSettled([await proyecto.save(), await tarea.deleteOne()]);
        
        return res.json({msg: "La Tarea se eliminó"});
    } catch (error) {
        console.log(error);
    }

};

const cambiarEstado = async (req, res) => {
    const { id } = req.params;

    const valid = mongoose.Types.ObjectId.isValid(id);

    if(!valid) {
        const error = new Error("No encontrado");
        return res.status(404).json({ msg: error.message });
    }

    const tarea = await Tarea.findById(id).populate("proyecto");

    if(!tarea) {
        const error = new Error("Tarea no encontrada");
        return res.status(404).json({ msg: error.message });
    }

    if(tarea.proyecto.creador.toString() !== req.usuario._id.toString() &&
    !tarea.proyecto.colaboradores.some(colaborador =>
        colaborador._id.toString() === req.usuario._id.toString()
        )
    ) {
        const error = new Error("Acción no válida");
        return res.status(403).json({ msg: error.message });
    }

    tarea.estado = !tarea.estado;
    tarea.completado = req.usuario._id;
    await tarea.save();

    // Se hace está consulta para poder mostrar en la respuesta el campo completado con sus atributos
    // Si se muestra tarea (despues del tarea.completado = req.usuario._id) el campo completado
    // muestra unicamente su id, si efectuar el llamado de los atributos con el populate
    const tareaAlmacenada = await Tarea.findById(id).populate("proyecto").populate("completado");
    
    res.json(tareaAlmacenada);
};

export {
    agregarTarea,
    obtenerTarea,
    actualizarTarea,
    eliminarTarea,
    cambiarEstado
};