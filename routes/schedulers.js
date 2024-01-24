var express = require('express');
var moment = require('moment');
var router = express.Router();
var debug = require('debug')('scheduler-2:server');
var Scheduler = require('../models/scheduler');
var verifyJWTToken = require('../verifyJWTToken');
var appointmentsService = require('../services/appointmentsService');

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

  try {
    await verifyJWTToken.verifyToken(req, res, next);
  } catch (e){
    console.error(e);
    return true;
  }


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
    if (e.errors) {
      debug("Validation problem when saving");
      res.status(400).send({error: e.message});
    } else {
      debug("DB problem - post schedulers", e);
      res.sendStatus(500);
    }
  }
});

/* GET schedulers listing. */
router.get('/', async function(req, res, next) {

  try {
    await verifyJWTToken.verifyToken(req, res, next);
  } catch (e){
    console.error(e);
    return true;
  }

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
    await verifyJWTToken.verifyToken(req, res, next);
  } catch (e){
    console.error(e);
    return true;
  }


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
    await verifyJWTToken.verifyToken(req, res, next);
  } catch (e){
    console.error(e);
    return true;
  }

  try {
    const result = await Scheduler.findByIdAndUpdate(schedulerId, updateData, { new: true });

    if (result) {
      res.status(200).json({ message: 'Scheduler successfully updated', result });
    }else{
      res.status(404).json({ error: 'Scheduler not found' });
    }
    
  } catch(e) {
    
    if (e.errors) {
      debug("Validation problem when updating scheduler");
      res.status(400).send({ error: e.message });
    } else {
      debug("DB problem", e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

/* DELETE scheduler by ID */
router.delete('/:id', async function(req, res, next) {
  const idDoctor = req.params.id;

  try {
    await verifyJWTToken.verifyToken(req, res, next);
  } catch (e){
    console.error(e);
    return true;
  }

  try {
    // Intenta eliminar el contacto por su ID
    const result = await Scheduler.deleteOne({ _id: idDoctor });
    if (result.deletedCount > 0) {
      // Si se eliminó al menos un documento, responde con un código 204 (No Content)
      res.status(200).json({ message: 'Scheduler successfully deleted' });
    } else {
      // Si no se eliminó ningún documento (porque el ID no se encontró), responde con un código 404 (Not Found)
      res.status(404).json({ error: 'Scheduler not found'});
    }
  } catch (e) {
    if (e.errors) {
      debug("Validation problem when saving");
      res.status(400).send({error: e.message});
    } else {
      console.log("DB problem - delete scheduler", e);
      res.sendStatus(500);
    }
  }
});


/* GET schedulers name lastname doctors. */
router.get('/doctors', async function(req, res, next) {
  
  try {
    await verifyJWTToken.verifyToken(req, res, next);
  } catch (e){
    console.error(e);
    return true;
  }
  
  try {
    const schedulers = await Scheduler.find();
    const emailsUnicos = Array.from(new Set(schedulers.map(usuario => usuario.email)));
    const appointments = await appointmentsService.getAppointment();
    const datosPorEmail = { doctors: {} };

    for (const email of emailsUnicos) {
      
      const usuario = await Scheduler.findOne({ email: email });
      
      if (usuario) {
        const appointmentsDoctor = appointments.filter(appointment =>
          appointment.nameDoctor === usuario.name && appointment.lastnameDoctor === usuario.lastname
        );

        const nombreCompleto = usuario.name + ' ' + usuario.lastname;
        
        datosPorEmail.doctors[nombreCompleto] = {
          name: usuario.name,
          lastname: usuario.lastname,
          email: usuario.email,
          appointments: appointmentsDoctor
        };
      }
    }

    if (Object.keys(datosPorEmail.doctors).length > 0) {
      res.status(200).json(datosPorEmail);
    } else {
      res.status(404).json({ error: 'No se encontraron datos para los doctores.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});



/* GET schedulers/dates/:name/:lastname */
router.get('/dates/:name/:lastname', async function(req, res, next) {

  try {
    await verifyJWTToken.verifyToken(req, res, next);
  } catch (e){
    console.error(e);
    return true;
  }

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
    await verifyJWTToken.verifyToken(req, res, next);
  } catch (e){
    console.error(e);
    return true;
  }

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
