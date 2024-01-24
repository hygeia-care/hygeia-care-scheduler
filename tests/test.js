const app = require('../app');
const request = require('supertest');
const Scheduler = require('../models/scheduler');
const verifyJWTToken = require('../verifyJWTToken');

describe("Scheduler API", () => {
    
    verifyToken = jest.spyOn(verifyJWTToken, "verifyToken");
    verifyToken.mockImplementation(async () => Promise.resolve(true));
    const testJWT = "thisTokenWorks";
      

    describe("GET /scheduler", () => {

        const schedulers = [
            new Scheduler({
                "name": "Doctor1",
                "lastname": "ApellidoDoctor1",
                "date": new Date('2024-01-15T09:00:00.000Z'),
                "email": "doctor1@hygeia-care.us"
            }),
            new Scheduler({
                "name": "Doctor2",
                "lastname": "ApellidoDoctor2",
                "date": new Date('2024-01-16T09:00:00.000Z'),
                "email": "doctor2@hygeia-care.us"
            }),
        ];
        
        var dbFind;

        beforeEach(() => {
            dbFind = jest.spyOn(Scheduler, "find");
        });

        it("Should return all schedulers", () => {
            dbFind.mockImplementation(async () => Promise.resolve(schedulers));

            return request(app).get("/api/v1/schedulers").set("x-auth-token", testJWT).then((response) => {
                expect(response.statusCode).toBe(200);
                expect(response.body).toHaveLength(schedulers.length);
                expect(dbFind).toBeCalled();
            });
        });

        it("Should return 500 if there is a problem when retrieving all appointments", () => {
            dbFind.mockImplementation(async () => Promise.reject("Connection failed"));

            return request(app).get("/api/v1/schedulers").set("x-auth-token", testJWT).then((response) => {
                expect(response.statusCode).toBe(500);
                expect(dbFind).toBeCalled();
            });
        });
    });

    describe("POST /schedulers", () => {

        const scheduler = new Scheduler({
            "name": "Doctor3",
            "lastname": "ApellidoDoctor3",
            "date": new Date('2024-01-17T09:00:00.000Z'),
            "email": "doctor3@hygeia-care.us"
        })

        var dbSave, dbFindOne;

        beforeEach(() => {
            dbSave = jest.spyOn(Scheduler.prototype, "save");
            dbFindOne = jest.spyOn(Scheduler, "findOne");
        });

        it("Should add a new scheduler if everything is fine", () => {
            dbSave.mockImplementation(async () => Promise.resolve(true));
            dbFindOne.mockImplementation(async () => Promise.resolve(false));

            return request(app).post("/api/v1/schedulers").set("x-auth-token", testJWT).send(scheduler).then((response) => {
                expect(response.statusCode).toBe(201);
                expect(dbSave).toBeCalled();
            });
        }, 10000);

        it("Should return 500 if there is a problem with the connection", () => {
            dbSave.mockImplementation(async () => Promise.reject("Connection failed"));
            dbFindOne.mockImplementation(async () => Promise.resolve(false));

            return request(app).post("/api/v1/schedulers").set("x-auth-token", testJWT).send(scheduler).then((response) => {
                expect(response.statusCode).toBe(500);
                expect(dbSave).toBeCalled();
            });
        });
    });

    describe("DELETE /schedulers/:id", () => {
        const scheduler = new Scheduler({
            "name": "Doctor4",
            "lastname": "ApellidoDoctor4",
            "date": new Date('2024-01-18T09:00:00.000Z'),
            "email": "doctor4@hygeia-care.us"
        })
    
        var dbDeleteOne;
        
        beforeEach(() => {
            dbDeleteOne = jest.spyOn(Scheduler, "deleteOne");
        });
    
        it("Should delete scheduler given ID", () => {
            dbDeleteOne.mockImplementation(async () => Promise.resolve({ deletedCount: 1 }));
            return request(app).delete(`/api/v1/schedulers/${scheduler._id}`).set("x-auth-token", testJWT).then((response) => {
                expect(response.statusCode).toBe(200);
                expect(response.body.message).toEqual("Scheduler successfully deleted");
                expect(dbDeleteOne).toBeCalled();
            });
        });
    
        it("Should return 404 if the scheduler does not exist for the given date and patient ID", () => {
            dbDeleteOne.mockImplementation(async () => Promise.resolve({ deletedCount: 0 }));
    
            return request(app).delete(`/api/v1/schedulers/${scheduler._id}`).set("x-auth-token", testJWT).then((response) => {
                expect(response.statusCode).toBe(404);
                expect(response.body.error).toEqual("Scheduler not found");
                expect(dbDeleteOne).toBeCalled();
            });
        });
    
        it("Should return 500 if there is a problem when deleting an appointment ", () => {
            dbDeleteOne.mockImplementation(async () => Promise.reject("Connection failed"));
    
            return request(app).delete(`/api/v1/schedulers/${scheduler._id}`).set("x-auth-token", testJWT).then((response) => {
                expect(response.statusCode).toBe(500);
                expect(dbDeleteOne).toBeCalled();
            });
        });
    });

    describe("PUT /schedulers/:id", () => {
        const scheduler = new Scheduler({
            "name": "Doctor5",
            "lastname": "ApellidoDoctor5",
            "date": new Date('2024-01-19T09:00:00.000Z'),
            "email": "doctor5@hygeia-care.us"
        })

        const updatedBody = ({ "_id": scheduler._id,
                                "name": "Doctor5",
                                "lastname": "ApellidoDoctor5",
                                "date": new Date('2024-01-19T09:00:00.000Z'),
                                "email": "doctor5@hygeia-care.us"
        })

        const updatedScheduler = new Scheduler (updatedBody);

        var dbUpdateOne;

        beforeEach(() => {
            dbUpdateOne = jest.spyOn(Scheduler, "findByIdAndUpdate");
        });

        it("Should UPDATE scheduler given its id", () => {
            dbUpdateOne.mockImplementation(async () => Promise.resolve(updatedScheduler));

            dbFind = jest.spyOn(Scheduler, "find");
            dbFind.mockImplementation(async () => Promise.resolve(schedulers));

            return request(app).put(`/api/v1/schedulers/${scheduler._id}`).set("x-auth-token", testJWT).send(updatedBody).then((response) => {
                expect(response.statusCode).toBe(200);
                expect(response.body.message).toEqual("Scheduler successfully updated");
                expect(dbUpdateOne).toBeCalled();
            });
            
        });
        
        it("Should return 404 if the scheduler does not exist", () => {
            dbUpdateOne.mockImplementation(async () => Promise.resolve());     
            
            return request(app).put(`/api/v1/schedulers/${scheduler._id}`).set("x-auth-token", testJWT).send(updatedBody).then((response) => {
                expect(response.statusCode).toBe(404);
                expect(response.body.error).toEqual("Scheduler not found");
                expect(dbUpdateOne).toBeCalled();
            });
        });

        it("Should return 500 if there is a problem when deleting an scheduler ", () => {
            dbUpdateOne.mockImplementation(async () => Promise.reject("Connection failed"));            

            return request(app).put(`/api/v1/schedulers/${scheduler._id}`).set("x-auth-token", testJWT).send(updatedBody).then((response) => {
                expect(response.statusCode).toBe(500);
                expect(dbUpdateOne).toBeCalled();
            });
        });

        
    });

    
});