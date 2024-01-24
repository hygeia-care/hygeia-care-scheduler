const Scheduler = require('../../models/scheduler');
const dbConnectTest = require('./envDBIntegrationTest');
const mongoose = require('mongoose');

//jest
jest.setTimeout(3000);

describe("Integration Tests for Scheduler API", () => {

    beforeAll((done) => {
        
        if (dbConnectTest.readyState == 1) {

            done();
            /*
            dbConnectTest.close(() => {
                // Una vez cerrada, establece una nueva conexión
                dbConnectTest.once("connected", () => done());
                dbConnectTest.connect(process.env.DB_URL_TEST);
            });*/

           
        } else {
            
            dbConnectTest.on("connected", () => done());
        }
    });

    describe("Scheduler DB connection", () => {
        const scheduler = new Scheduler({
            "name": "Doctor3",
            "lastname": "ApellidoDoctor3",
            "date": new Date('2024-01-17T09:00:00.000Z'),
            "email": "doctor3@hygeia-care.us"
        })

        beforeAll(async () => {
            await Scheduler.deleteMany({});
        });

        it("Writes a scheduler in the DB", async () => {
            await scheduler.save();
            result = await Scheduler.find();
            expect(result).toBeArrayOfSize(1);
        });

        it("Reads scheduler from the DB", async () => {
            result = await Scheduler.findById(scheduler._id);
            expect(result.name).toEqual("Doctor3");
        });

        it("Deletes scheduler from the DB", async () => {
            await Scheduler.deleteOne(scheduler._id);
            result = await Scheduler.findById(scheduler._id);
            expect(result).toEqual(null);
        });

        afterAll(async () => {
            await Scheduler.deleteMany({});
        });
    });

    afterAll(async () => {
        if(dbConnectTest.readyState == 1){
            await dbConnectTest.close();
        }
        await mongoose.disconnect();
    });
    

});