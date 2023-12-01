var express = require('express');
var moment = require('moment');
var router = express.Router();

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
/* GET schedulers listing. */
router.get('/', function(req, res, next) {
  res.send(schedulers);
});

/* GET schedulers name lastname doctors. */
router.get('/doctors', function(req, res, next) {
  try {
    // Obtener emails únicos
    const emailsUnicos = Array.from(new Set(schedulers.map(usuario => usuario.email)));

    // Inicializar un objeto para almacenar nombres asociados a cada email
    const nombresPorEmail = {"doctors":[]};

    // Iterar sobre los emails únicos y buscar el nombre asociado a cada uno
    for (const email of emailsUnicos) {
      const usuario = schedulers.find(item => item.email === email);
      if (usuario) {
        nombresPorEmail["doctors"].push(usuario.name + '' + usuario.lastname);
      }
    }

    // Devolver el objeto con nombres asociados a cada email en formato JSON
    res.json(nombresPorEmail);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al buscar por email y guardar nombres.' });
  }
});

/* GET schedulers/dates/:name/:lastname */
router.get('/dates/:name/:lastname', function(req, res, next) {
  var name = req.params.name;
  var lastname = req.params.lastname;
  var results = schedulers.filter(c => {
    return c.name === name && c.lastname === lastname;
  });
  if(results) {
    results.sort((a, b) => {
      const dateA = moment(a.date).toDate();
      const dateB = moment(b.date).toDate();
      return dateA - dateB;
    });
    results.forEach(result => {
      const momentDate = moment(result.date);
      result.date = momentDate.format('YYYY-MM-DD'); // Fecha en formato YYYY-MM-DD
      result.time = momentDate.format('HH:mm:ss'); // Hora en formato HH:MM:SS
    });
    res.send({results});
  } else {
    res.sendStatus(404);
  }
});

module.exports = router;
