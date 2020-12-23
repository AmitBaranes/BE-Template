const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./model')
const { getProfile } = require('./middleware/getProfile')
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

/**
 * @returns contract by id
 */
app.get('/contracts/:id', getProfile, async (req, res) => {

    const { Contract } = req.app.get('models')
    const { id } = req.params
    // grab profile id from headers
    const profile_id = req.headers.profile_id
    const contract = await Contract.findOne({ where: { id } })
    // check if ContractorId equal to profile_id
    if (contract.ContractorId == profile_id) return res.json(contract)
    return res.status(404).end()
})


/**
 * @returns list of contracts belonging to a user , the list should only contain non terminated contracts
 */
app.get('/contracts', getProfile, async (req, res) => {

    const { Contract } = req.app.get('models')
    // grab profile id from headers
    const profile_id = req.headers.profile_id
    // get all contracts by ContractorId and filter by terminated
    const contracts = await Contract.findAll({ where: { ContractorId: profile_id } }).then(contracts => contracts.filter(c => c.status !== "terminated"))
    if (contracts) return res.json(contracts)
    return res.status(404).end()
})

/**
 * @returns  all unpaid jobs for a user for active contracts only
 */
app.get('/jobs/unpaid', getProfile, async (req, res) => {

    const { Job } = req.app.get('models')
    const { Contract } = req.app.get('models')
    // grab profile id from headers
    const profile_id = req.headers.profile_id
    const contract = await Contract.findOne({ where: { id: profile_id } })
    // if contract not active return 404
    if (contract.status !== "in_progress") return res.status(404).end()
    // get all unpaid jobs for a user (either a client or contractor)
    const jobs = await Job.findAll({ where: { ContractId: profile_id } }).then(jobs => jobs.filter(job => job.paid !== true))
    if (jobs) return res.json(jobs)
    return res.status(404).end()
})

/**
 * @returns  all jobs
 */

// TESTING PROPESES ONLY!
app.get('/jobs', getProfile, async (req, res) => {

    const { Job } = req.app.get('models')
    const { Contract } = req.app.get('models')
    // grab profile id from headers
    const profile_id = req.headers.profile_id
    const contract = await Contract.findOne({ where: { id: profile_id } })
    // if contract not active return 404
    if (contract.status !== "in_progress") return res.status(404).end()
    // get all unpaid jobs for a user (either a client or contractor)
    const jobs = await Job.findAll()
    if (jobs) return res.json(jobs)
    return res.status(404).end()
})


// for postman : Content-Type: application/x-www-form-urlencoded

// Pay for a job
app.post('/jobs/:job_id/pay', getProfile, async (req, res) => {

    const jobID = req.params.job_id

    const { Job } = req.app.get('models')
    const { Contract } = req.app.get('models')
    const { Profile } = req.app.get('models')

    const job = await Job.findOne({ where: { id: jobID } })
    const contract = await Contract.findOne({ where: { id: job.ContractId } })
    const client = await Profile.findOne({ where: { id: contract.ClientId } })


    if (!job || job.paid == true || !client || client.type == 'client' || !contract) return res.status(404).end()

    if (client.balance >= job.price) {

        try {
            client.update({ balance: client.balance - job.price })
            contract.update({ balance: contract.balance + job.price })
            job.update({ paid: true })

            return res.status(200).end()
        }
        catch (err) {
            return res.status(404).end()
        }
    }
})


// Pay for a job
app.post('/balances/deposit/:userId', getProfile, async (req, res) => {

    const userId = req.params.userId
    const ammountOfDeposit = req.body.ammount_of_deposit
    const totalJobsPayments = 0;

    const { Job } = req.app.get('models')
    const { Contract } = req.app.get('models')
    const { Profile } = req.app.get('models')

    try{
        const client = await Profile.findOne({ where: { id: userId } })
        const contractsIDs = await Contract.findAll({ where: { ClientId: userId } }).then(con => con.map(c => c.id))
    
        const jobs = await Job.findAll()
        jobs.forEach(job => {
    
            if (contractsIDs.includes(job.ContractId) && job.paid !== true) {
    
                totalJobsPayments += job.price;
            }
    
        });
    
        // check if  ammountOfDeposit is less than 25%
        if (ammountOfDeposit <= totalJobsPayments * 0.25)
            client.update({ balance: client.balance + ammountOfDeposit })
    
        return res.status(200).end()
    }

    catch(err){
        return res.status(404).end()
    }
    
})

/**
 * @returns  the profession that earned the most money
 */
app.get('/admin/best-profession?start=<date>&end=<date>', getProfile, async (req, res) => {

    const { Job } = req.app.get('models')
    const { Contract } = req.app.get('models')
    const { Profile } = req.app.get('models')

    // filter jobs by range time

    // sum all profiles jobs
    
    // sum all profession jobs

    // returns the profession that earned the most money 


})


module.exports = app;
