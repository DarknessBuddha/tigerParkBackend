const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors')
const crypto = require('crypto');
const { AsyncLocalStorage } = require('async_hooks');
const { start } = require('repl');

app.use(cors());
app.options('*', cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const computeHash = (password, salt)=>{
    let hash = crypto.createHash('sha256')
	.update(password + salt)
	.digest('base64')
    
	return hash
}

const available = Array(24)
for (let i = 0; i < available.length; i++) { 
    available[i] = {}
}

const reserved = {}

const numSpots = 5
const lots = [
    {   name: "C-01",
        address: "Hunnicutt Creek, Clemson, SC 29631",
        open: 1260,
        capacity: 1260,
        spots: {}
    },
    {   name:"C-02",
        address: "C-12, Clemson, SC 29631",
        open: 656,
        capacity: 656,
        spots: {}
    },
    {   name: "C-09",
        address: "Centennial Blvd, Clemson, SC 29631",
        open: 77,
        capacity: 77,
        spots: {}
    },
    {   name:"C-11",
        address: "C-11, Clemson, SC 29631",
        open: 433,
        capacity: 433,
        spots: {}
    },
        {   name: "C-12",
        address: "C-12, Clemson, SC 29631",
        open: 112,
        capacity: 112,
        spots: {}
    },
    {   name: "C-13",
        address: "Woodland Cemetery, Clemson, SC 29631",
        open: 176,
        capacity: 176,
        spots: {}
    },
    {   name: "C-14",
        address: "108 Perimeter Rd, Clemson, SC 29631",
        open: 200,
        capacity: 200,
        spots: {}
    },
    {   name: "C-15",
        address: "129 Old Greenville Hwy #1, Clemson, SC 29631",
        open: 75,
        capacity: 75,
        spots: {}
    },
    {   name: "C-16",
        address: "E Beach Dr, Clemson, SC 29631",
        open: 175,
        capacity: 175,
        spots: {}
    },
    {   name: "C-2A",
        address: "2002 Williamson Rd, Clemson, SC 2963",
        open: 56,
        capacity: 56,
        spots: {}
    },
    {   name: "E-01",
        address: "120 McGinty Ct, Clemson, SC 29634",
        open: 60,
        capacity: 60,
        spots: {}
    },
    {   name: "E-07",
        address: "220 Perimeter Rd, Clemson, SC 29634",
        open: 74,
        capacity: 74,
        spots: {}
    },
    {   name: "E-31",
        address: "Old Greenville Hwy, Clemson, SC 29631",
        open: 61,
        capacity: 61,
        spots: {}
    },
    {   name: "P-01",
        address: "221 Track Dr, Clemson, SC 29634",
        open: 49,
        capacity: 49,
        spots: {}
    },
    {   name: "P-04",
        address: "P-4, Clemson, SC 29631",
        open: 179,
        capacity: 179,
        spots: {}
    },
    {   name: "P-05",
        address: "355 Anderson Hwy, Clemson, SC 29631",
        open: 61,
        capacity: 61,
        spots: {}
    },
    {   name: "P-06",
        address: "250 Campus View Trail, Seneca, SC 29678",
        open: 37,
        capacity: 37,
        spots: {}
    },
    {   name: "P-07",
        address: "355 Anderson Hwy, Clemson, SC 29631",
        open: 33,
        capacity: 33,
        spots: {}
    },
    {   name: "P-09",
        address: "E Beach Dr, Clemson, SC 29631",
        open: 20,
        capacity: 20,
        spots: {}
    }
]

lots.map(lot => {
    for (let i = 0; i < lot.capacity; i++) { 
        lot.spots[i] = true
    }
})

const users = {
    "jtmarks": {
        salt: "absdfabsdffffr444",
        passwordHash: "7iIoQwfnJlIeOTuZS4dyRtqIUBLlYLs4ZO15TLPr0zM=",
        tickets: 100
    }
}

const loggedIn = {}

lots.forEach(lot => {
    for (let i = 0; i < available.length; i++) { 
        available[i][lot.name] = lot.spots
    }
})


app.post('/newUser', (req, res) => {
    const {username, password} = req.body;
    const salt = new Date().toString()

    if (username in users) {
        return res.status(401).send("User Already Exists")
    }

    users[username] = {
        salt,
        passwordHash: computeHash(password, salt),
        tickets: 0
    }

    return res.sendStatus(200)
})

app.post('/auth', (req, res) => {
    const {username, password} = req.body;

	if(!username || username == ""){
        res.sendStatus(401)
		return;
	}
    
	if(!password || password == ""){
        res.sendStatus(401)
		return;
	}

    if (username in users) {
        user = users[username]
        
        if (computeHash(password, user.salt) === user.passwordHash) {
            loggedIn[username] = true
            console.log(loggedIn)

            return res.sendStatus(200)
        }
    }

    return res.sendStatus(400)
})

app.post('/logout', (req, res) => {
    const username = req.body.username

    delete loggedIn[username]
    console.log(loggedIn)

    return res.sendStatus(200)
})

app.get('/lots/allLotName', (req, res) => {
    return res.json(Object.keys(lots))
})

app.post('/lots/reserve', (req, res) => {
    const lotName = req.body.name
    const spot = req.body.spot
    const username = req.body.username
    const startTime = req.body.startTime
    const endTime = req.body.endTime

    if (!(username in loggedIn)) {
        return res.status(401).send("Not authenticated")
    }

    let lot = lots.filter(s => s.name === lotName)[0]

    if (username in reserved) {
        const {lotName, spot, startTime, endTime} = reserved[username]

        for (let i = startTime; i <= endTime; i++) { 
            available[i][lotName][spot] = true
        }
        lot = lots.filter(s => s.name === lotName)[0]
        lot.open += 1
        delete reserved[username]

        return res.sendStatus(200)
    }

    for (let i = startTime; i <= endTime; i++) { 
        if (!(spot in available[i][lotName])) {
            return res.status(401).send("Tried to reserve an unavailable spot")
        }
    }

    reserved[username] = {
        lotName,
        spot,
        startTime,
        endTime
    }

    for (let i = startTime; i <= endTime; i++) { 
        delete available[i][lotName][spot]
    }

    lot.open -= 1

    console.log(reserved)

    return res.sendStatus(200)
})

app.get('/lots/available', (req, res) => {
    const startTime = parseInt(req.query.startTime)
    const endTime = parseInt(req.query.endTime)

    const result = Object.keys(available[startTime]).flatMap(name => {
        const lot = available[startTime][name]
        return {[name]: Object.entries(lot).filter(spot => {
            for (let i = startTime + 1; i <= endTime; i++) { 
                if (!(spot[0] in available[i][name])) {
                    return false
                }
            }
            return true
        })}
    })

    const reformatted = {}
    result.forEach(obj => {
        const k = Object.keys(obj)[0]
        reformatted[k] = obj[k].map(spot => ({"id": parseInt(spot[0])}))
    })

    const combined = [...lots]
    combined.map(lot => lot.spots = reformatted[lot.name])

    return res.json(combined)
})

app.get('/lots/all', (req, res) => {
    return res.json(lots)
})

app.get('*', (req, res) => {
    return res.sendStatus(200)
});

//listens on port 3000 or the one set in the env vars
const port = process.env.PORT || 3000
app.listen(port, () => console.log(`listening on ${port}`))