var express = require('express');
var moment = require('moment');
var router = express.Router();
var debug = require('debug')('scheduler-2:server');
var Scheduler = require('../models/scheduler');

const { Resend } = require('resend');

const resend = new Resend('re_3AmhcDUK_CLy3CYa2SEVkDkXzxL2S3wNV');

var schedulers = [
  {
    "name": "pepe",
    "lastname": "pérez jaldón",
    "date": new Date("2023-12-01T14:00:00"),
    "email": "pepe@hygeia-care.us"
  },
  {
    "name": "juan",
    "lastname": "castro díaz",
    "date": new Date("2023-12-01T19:00:00"),
    "email": "juan@hygeia-care.us"
  },
  {
    "name": "juan",
    "lastname": "castro díaz",
    "date": new Date("2023-12-01T16:00:00"),
    "email": "juan@hygeia-care.us"
  },
  {
    "name": "juan",
    "lastname": "castro díaz",
    "date": new Date("2023-12-02T16:00:00"),
    "email": "juan@hygeia-care.us"
  },
  {
    "name": "juan",
    "lastname": "castro díaz",
    "date": new Date("2023-12-03T16:00:00Z"),
    "email": "juan@hygeia-care.us"
  },
]

/*  POST email */

router.post('/email', async function(req, res, next) {
  const {email, date} = req.body;
  try {
    resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Cita Registrada',
      html: '<p>Tienes una cita: <strong>'+ date +'</strong>.</p>'
    });

    res.sendStatus(201);
  } catch (e) {
      debug("Validation problem when saving");
      res.status(400).send({error: e.message});
  }
});

/* GET schedulers listing. */
router.get('/', async function(req, res, next) {
  try {
    const result = await Scheduler.find();
    console.log(result)
    res.send(result.map((c) => c.cleanup()));
  } catch(e) {
    // debug("DB problem", e);
    console.error(e);
    res.sendStatus(500);
  }
});


/* POST scheduler  */
router.post('/', async function(req, res, next) {
  const {name, lastname, date, email} = req.body;

  
  try {
    const existingScheduler = await Scheduler.findOne({
      name,
      lastname,
      date,
      email
    });
    if(existingScheduler){
      debug("Duplicate scheduler detected");
      return res.status(409).send({ error: "Duplicate scheduler detected" });
    }
    
    const scheduler = new Scheduler({
      name,
      lastname,
      date,
      email
    });

    await scheduler.save();
    res.sendStatus(201);

  } catch (e) {
    if (e.errors) {
      debug("Validation problem when saving");
      res.status(400).send({error: e.message});
    } else {
      debug("DB problem", e);
      res.sendStatus(500);
    }
  }
});

// EDIT scheduler by ID
router.put('/:id', async function(req, res, next) {
  const schedulerId = req.params.id;
  const updateData = req.body;

  try {
    const result = await Scheduler.findByIdAndUpdate(schedulerId, updateData, { new: true });

    if (!result) {
      return res.status(404).send("Scheduler not found");
    }

    res.send(result.cleanup()); 
  } catch(e) {
    
    if (e.errors) {
      debug("Validation problem when updating scheduler");
      return res.status(400).send({ error: e.message });
    } else {
      debug("DB problem", e);
      return res.sendStatus(500);
    }
  }
});

/* DELETE scheduler by ID */
router.delete('/:id', async function(req, res, next) {
  const idDoctor = req.params.id;

  try {
    // Intenta eliminar el contacto por su ID
    const result = await Scheduler.deleteOne({ _id: idDoctor });
    if (result.deletedCount > 0) {
      // Si se eliminó al menos un documento, responde con un código 204 (No Content)
      res.sendStatus(204);
    } else {
      // Si no se eliminó ningún documento (porque el ID no se encontró), responde con un código 404 (Not Found)
      res.sendStatus(404);
    }
  } catch (e) {
    // Error al intentar eliminar el contacto
    console.error("DB problem", e);
    res.sendStatus(500);
  }
});


/* GET schedulers name lastname doctors. */
router.get('/doctors', async function(req, res, next) {
  try {
    // Obtener todos los documentos de Scheduler
    const schedulers = await Scheduler.find();

    // Obtener emails únicos
    const emailsUnicos = Array.from(new Set(schedulers.map(usuario => usuario.email)));

    // Inicializar un objeto para almacenar nombres asociados a cada email
    const nombresPorEmail = {"doctors":[]};

    // Iterar sobre los emails únicos y buscar el nombre asociado a cada uno
    for (const email of emailsUnicos) {
      // Usar findOne para buscar un usuario por su correo electrónico
      const usuario = await Scheduler.findOne({ email: email });

      if (usuario) {
        nombresPorEmail["doctors"].push(usuario.name + ' ' + usuario.lastname);
      }
    }

    // Devolver el objeto con nombres asociados a cada email en formato JSON
    if(nombresPorEmail.length > 0){
      res.status(200).json(nombresPorEmail);
    }else{
      res.status(404).json({ error: 'Error al buscar por email y guardar nombres.' });
    }
    
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});


/* GET schedulers/dates/:name/:lastname */
router.get('/dates/:name/:lastname', async function(req, res, next) {
  try {
    const name = req.params.name;
    const lastname = req.params.lastname;

    // Utilizar Mongoose find con un objeto de consulta
    const results = await Scheduler.find({ name: name, lastname: lastname });

    if (results && results.length > 0) {
      // Ordenar los resultados por fecha
      results.sort((a, b) => {
        const dateA = moment(a.date).toDate();
        const dateB = moment(b.date).toDate();
        return dateA - dateB;
      });

      // Formatear fecha y hora
      const formattedResults = results.map(result => {
        const momentDate = moment(result.date);
        return {
          name: result.name,
          lastname: result.lastname,
          date: result.date,
          day: momentDate.format('YYYY-MM-DD'),
          time: momentDate.format('HH:mm:ss'),
          email: result.email
        };
      });

      // Enviar los resultados formateados
      res.send(formattedResults);
    } else {
      res.sendStatus(404).json({ error: 'Error al buscar fechas.' });
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

//DELETE ALL SCHEDULERS
router.delete('/', async (req, res) => {
  try {
    const result = await Scheduler.deleteMany({});

    if (result.deletedCount > 0) {
      res.status(200).json({ message: 'All schedulers successfully deleted' });
    } else {
      res.status(404).json({ error: 'No schedulers found' });
    }
  } catch (e) {
    debug("DB problem", e);
    res.sendStatus(500);
  }
});


module.exports = router;
