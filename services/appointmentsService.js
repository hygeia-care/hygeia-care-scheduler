const axios = require('axios');
//const urlJoin = require('url-join');
const debug = require('debug')('appointment-service:appointment');

const APPOINTMENT_SERVICE = process.env.ASSURANCE_SERVICE || 'http://localhost:3335';
const API_VERSION = "/api/v1/appointments";

//codigo de acceso, funcion asincrona
const getAppointment = async function(){
    try{
        //const url = urlJoin(ASSURANCE_SERVICE, API_VERSION);
        const url = APPOINTMENT_SERVICE + API_VERSION;
        //console.log("URL-llamada a AssuranceService:" , url);
        const response = await axios.get(url) ; // variable espera la respuesta de axios
        debug("response: " + response);
        return response.data;
    }catch (error){
        console.error("error en la llamada al MS Assurance: ", error);
        return null;
    }
}

module.exports = {
    "getAppointment": getAppointment
}