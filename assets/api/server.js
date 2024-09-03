const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const {v4: uuidv4} = require('uuid');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const {SerialPort} = require('serialport');
const {ReadlineParser} = require('@serialport/parser-readline');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3001;
const SECRET_KEY = "your_secret_key";

// Define TESTS_FOLDER
const TESTS_FOLDER = path.join(__dirname, 'tests');

// Ensure the tests folder exists
if (!fs.existsSync(TESTS_FOLDER)) {
    fs.mkdirSync(TESTS_FOLDER, { recursive: true });
}

app.use(bodyParser.json());
app.use(cors());

// Read chip configuration
const chipsConfig = JSON.parse(fs.readFileSync('../chips_config.json', 'utf8'));
const chips = chipsConfig.chips;

// Global queue for tests
const testQueue = [];
let isProcessingQueue = false;

// Serial port setup
const port = new SerialPort({
    path: 'COM8', // Update this to match your Teensy's port
    baudRate: 115200
});
const parser = port.pipe(new ReadlineParser({delimiter: '\n'}));
const USE_TEENSY = true; // Set this to true when you're ready to use the actual Teensy

port.on('error', (err) => {
    console.error('Serial port error:', err.message);
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (message) => {
    console.log('Received:', message);
  });
});


function calculateDuration(creationDateString, endTimeString) {
    // Assuming the dates are stored in ISO 8601 format (e.g., "2024-07-28T22:16:08.172Z")
    const startDate = new Date(creationDateString);
    const endDate = new Date(endTimeString);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error("Invalid dates in calculateDuration", { creationDateString, endTimeString });
        return 'N/A'; // This will be a flag for error in date processing
    }

    return Math.floor((endDate - startDate) / 1000); // Duration in seconds
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { 
        year: '2-digit', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
    });
}




/* -------------------------------------------------------------------------- */
/*                              Database connect                              */

/* -------------------------------------------------------------------------- */


// Update test status function
async function updateTestStatus(testId, status) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE tests SET status = ? WHERE id = ?', [status, testId], (err) => {
            if (err) {
                console.error(`Error updating test status for test ${testId}:`, err);
                reject(err);
            } else {
                console.log(`Test ${testId} status updated to ${status}`);
                resolve();
            }
        });
    });
}

async function updateTestTimes(testId, startTime, endTime) {
    const duration = calculateDuration(startTime, endTime);
    const sql = `UPDATE tests SET start_time = ?, end_time = ?, duration = ? WHERE id = ?`;
    return new Promise((resolve, reject) => {
        db.run(sql, [startTime, endTime, duration, testId], function(err) {
            if (err) reject(err);
            else resolve();
        });
    });
}




// Function to send server status to Teensy
function sendStatusToTeensy(status) {
    if (USE_TEENSY) {
        port.write(`SERVER_${status}\n`, (err) => {
            if (err) {
                console.error('Error writing to serial port:', err);
            } else {
                console.log(`Sent ${status} status to Teensy`);
            }
        });
    }
}


// Function to send chip status to Teensy
function sendChipStatusToTeensy(chipId, status) {
    if (USE_TEENSY) {
        port.write(`CHIP_STATUS ${chipId} ${status}\n`, (err) => {
            if (err) {
                console.error('Error writing to serial port:', err);
            } else {
                console.log(`Sent ${status} status for chip ${chipId} to Teensy`);
            }
        });
    }
}


// Periodically check and send server status to Teensy
setInterval(() => {
    sendStatusToTeensy('ONLINE');
}, 5000);

// Handle incoming data from Teensy
parser.on('data', async (data) => {
    console.log('Received data from Teensy:', data);
    try {
        const jsonData = JSON.parse(data);
        switch (jsonData.type) {
            case 'heartbeat':
                console.log('Received heartbeat from Teensy');
                break;
            case 'status_check':
                console.log('Received status check request from Teensy');
                sendStatusToTeensy('ONLINE');
                break;
            case 'chip_status':
                if (jsonData.chips) {
                    jsonData.chips.forEach(chip => {
                        const dbChip = chips.find(c => c.id === chip.id);
                        if (dbChip) {
                            dbChip.status = chip.status;
                        }
                    });
                }
                break;
            case 'test_completed':
                console.log(`Test ${jsonData.testId} completed on chip ${jsonData.chipId}`);
                await handleTestCompletion(jsonData.testId);
                break;
            default:
                console.log('Received message from Teensy:', jsonData);
        }
    } catch (error) {
        // Handle non-JSON data
        console.log('Received non-JSON data from Teensy:', data);
    }
});
async function handleTestCompletion(testId) {
    try {
        const endTime = new Date().toISOString();
        const test = await getTestFromDatabase(testId);
        if (!test) {
            console.error(`Test with ID ${testId} not found`);
            return;
        }
        const duration = calculateDuration(test.start_time, endTime);
        await updateTestInDatabase(testId, { status: 'Completed', duration, end_time: endTime });
        console.log(`Test ${testId} marked as completed. Duration: ${duration} seconds`);
    } catch (error) {
        console.error(`Error handling test completion for test ${testId}:`, error);
    }
}






async function processTestQueue() {
    if (isProcessingQueue || testQueue.length === 0) return;

    isProcessingQueue = true;
    const test = testQueue.shift();

    try {
        console.log(`Processing test:`, JSON.stringify(test, null, 2));
        await updateTestStatus(test.id, 'Running');
        console.log(`Test ${test.id} status updated to Running`);

        // Run test on Teensy
        await runTestOnTeensy(test);

        // Update test status to Completed
        await updateTestStatus(test.id, 'Completed');
        console.log(`Test ${test.id} completed. Status updated in database.`);

    } catch (error) {
        console.error(`Error processing test ID ${test.id}:`, error);
        await updateTestStatus(test.id, 'Failed');
        console.log(`Test ${test.id} failed. Status updated in database.`);
    } finally {
        isProcessingQueue = false;
        // Process next test in queue
        setTimeout(processTestQueue, 0);
    }
}

setInterval(processTestQueue, 5000);



async function updateTestWithResults(testId, resultsFilePath) {
    try {
        const endTime = new Date().toISOString();
        
        // Fetch the test from the database
        const test = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM tests WHERE id = ?', [testId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!test) {
            throw new Error(`Test with ID ${testId} not found`);
        }

        const duration = calculateDuration(test.start_time, endTime);
        
        return new Promise((resolve, reject) => {
            db.run('UPDATE tests SET results_file = ?, status = ?, end_time = ?, duration = ? WHERE id = ?',
                [resultsFilePath, 'Completed', endTime, duration, testId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                });
        });
    } catch (error) {
        console.error(`Error updating test results for test ${testId}:`, error);
        throw error;
    }
}
// Connect to SQLite database
const db = new sqlite3.Database('data.db', (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to database');

        // Ensure tables are created
        db.serialize(() => {
            // Create tests table
            db.run(`CREATE TABLE IF NOT EXISTS tests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                testBench TEXT,
                snrRange TEXT,
                batchSize INTEGER,
                user_id INTEGER,
                username TEXT,
                accessible_to TEXT,
                DUT TEXT,
                status TEXT NOT NULL,
                duration INTEGER,
                start_time TEXT,
                results_file TEXT,
                end_time TEXT
            )`, function(err) {
                if (err) {
                    console.error("Error creating 'tests' table", err);
                } else {
                    console.log("Successfully created the 'tests' table.");
                }
            });

            // Create notifications table
            db.run(`CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                message TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                read INTEGER DEFAULT 0
            )`, function(err) {
                if (err) {
                    console.error("Error creating 'notifications' table", err);
                } else {
                    console.log("Successfully created the 'notifications' table.");
                }
            });

            // Create users table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                password TEXT NOT NULL,
                username TEXT NOT NULL,
                bio TEXT,
                uuid TEXT NOT NULL,
                role TEXT,
                notificationUrl TEXT
            )`, function(err) {
                if (err) {
                    console.error("Error creating 'users' table", err);
                } else {
                    console.log("Successfully created the 'users' table.");
                }
            });
        });
    }
});


// Function to safely execute SQL statements
function safeDbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                console.error(`Error executing SQL: ${sql}`, err);
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
}
const getFormattedStartTimestamp = () => {
    const now = new Date();
    return now.toISOString(); // This format is universally recognized
};


const getTestFromDatabase = (testId) => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM tests WHERE id = ?`, [testId], (err, row) => {
            if (err) {
                reject(err);
            } else if (!row) {
                reject(new Error('Test not found'));
            } else {
                resolve(row);
            }
        });
    });
};


const updateTestInDatabase = (testId, updates) => {
    const { status, duration } = updates;
    return new Promise((resolve, reject) => {
        db.run(`UPDATE tests SET status = ?, duration = ? WHERE id = ?`,
            [status, duration, testId],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            }
        );
    });
};




const testCompletionHandler = async (testId) => {
    try {
        const test = await getTestFromDatabase(testId);
        if (!test.start_time || !test.end_time) {
            console.error(`Missing start_time or end_time for test ${testId}`);
            return;
        }
        const duration = calculateDuration(test.start_time, test.end_time);
        await updateTestInDatabase(testId, { status: 'Completed', duration });
    } catch (error) {
        console.error(`Error completing test ${testId}:`, error);
    }
};


// Function to check if a column exists in a table
function columnExists(table, column) {
    return new Promise((resolve, reject) => {
        db.all(`PRAGMA table_info(${table})`, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                if (Array.isArray(rows)) {
                    resolve(rows.some(row => row.name === column));
                } else if (typeof rows === 'object' && rows !== null) {
                    // If rows is an object, check if any of its properties match the column name
                    resolve(Object.values(rows).some(row => row.name === column));
                } else {
                    console.error('Unexpected result from PRAGMA table_info:', rows);
                    resolve(false);
                }
            }
        });
    });
}

db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS tests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                testBench TEXT,
                snrRange TEXT,
                batchSize INTEGER,
                user_id INTEGER,
                username TEXT,
                accessible_to TEXT,
                DUT TEXT,
                status TEXT NOT NULL,
                duration INTEGER,
                start_time TEXT,
                results_file TEXT,
                end_time TEXT
            )`, function(err) {
                if (err) {
                    console.error("Error creating 'tests' table", err);
                } else {
                    console.log("Successfully recreated the 'tests' table.");
                }
            });

            // Create notifications table
            db.run(`CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                message TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                read INTEGER DEFAULT 0
            )`, function(err) {
                if (err) {
                    console.error("Error creating 'notifications' table", err);
                } else {
                    console.log("Successfully created the 'notifications' table.");
                }
            });
});



// Updated helper functions
async function ensureUserFolder(username) {
    if (!username) {
        throw new Error('Username is required to create user folder');
    }
    const userFolder = path.join(TESTS_FOLDER, username);
    await fsp.mkdir(userFolder, { recursive: true });
    return userFolder;
}


async function saveTestConfig(username, testId, config) {
    if (!username || !testId) {
        throw new Error('Username and testId are required to save test configuration');
    }
    const userFolder = await ensureUserFolder(username);
    const configPath = path.join(userFolder, `config_${testId}.json`);
    await fsp.writeFile(configPath, JSON.stringify(config, null, 2)); // Ensure using fsp.writeFile
    return configPath;
}

async function createResultsStream(username, testId) {
    if (!username || !testId) {
        throw new Error('Username and testId are required to create results stream');
    }
    const userFolder = await ensureUserFolder(username);
    const resultsPath = path.join(userFolder, `results_${testId}.csv`);
    return fs.createWriteStream(resultsPath);
}


/* -------------------------------------------------------------------------- */
/*                              Authentication                                */
/* -------------------------------------------------------------------------- */

// Register
app.post('/register', (req, res) => {
    const {email, password, username, bio, role} = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);
    const uuid = uuidv4();

    db.run(`INSERT INTO users (email, password, username, bio, uuid, role) VALUES (?, ?, ?, ?, ?, ?)`,
        [email, hashedPassword, username, bio, uuid, role], function (err) {
            if (err) {
                console.error('Error during user registration', err);
                return res.status(500).send("User registration failed");
            }
            res.status(200).send("User registered successfully");
        });
});

// Login
app.post('/login', (req, res) => {
    const {email, password} = req.body;

    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err) {
            console.error('Error during login', err);
            return res.status(500).send("Internal server error");
        }
        if (!user) {
            return res.status(404).send("User not found");
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            return res.status(401).send("Invalid password");
        }

        const token = jwt.sign({id: user.id}, SECRET_KEY, {expiresIn: 86400}); // 24 hours
        res.status(200).send({
            access_token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                uuid: user.uuid,
                role: user.role,
                bio: user.bio,
            }
        });
    });
});

/* -------------------------------------------------------------------------- */
/*                              User endpoints                                */
/* -------------------------------------------------------------------------- */

// Fetch users
app.get('/users', (req, res) => {
    db.all(`SELECT id, email, username, role, bio FROM users`, [], (err, rows) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).send("Internal server error");
        }
        res.status(200).json(rows);
    });
});

// Fetch user by id
app.get('/users/:id', (req, res) => {
    const {id} = req.params;
    db.get(`SELECT id, username, email, uuid, role, bio FROM users WHERE id = ?`, [id], (err, user) => {
        if (err) {
            console.error('Error fetching user information', err);
            return res.status(500).send("Internal server error");
        }
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.status(200).json(user);
    });
});


// This could be a simplified version of your existing processTestQueue or a separate function triggered by a specific message from Teensy
async function markTestAsCompleted(testId, startTime) {
    const endTime = new Date();  // Capture end time

    // Update the database with end time and set status to 'Completed'
    await updateTestTimes(testId, startTime, endTime);
    await updateTestStatus(testId, 'Completed');

    console.log(`Test ID ${testId} completed. Duration: ${calculateDuration(new Date(startTime), endTime)}`);
}


// Update user
app.put('/users/:id', (req, res) => {
    const {id} = req.params;
    const {username, email, role, bio} = req.body;

    db.run(`UPDATE users SET username = ?, email = ?, role = ?, bio = ? WHERE id = ?`,
        [username, email, role, bio, id], function (err) {
            if (err) {
                console.error('Error updating user information', err);
                return res.status(500).send("User update failed");
            }
            res.status(200).send("User updated successfully");
        });
});

// Delete user
app.delete('/users/:id', (req, res) => {
    const {id} = req.params;

    db.run(`DELETE FROM users WHERE id = ?`, [id], function (err) {
        if (err) {
            console.error('Error deleting user', err);
            return res.status(500).send("User deletion failed");
        }
        res.status(200).send("User deleted successfully");
    });
});

app.delete('/api/tests/batch-delete', (req, res) => {
    const { ids } = req.body; // Expecting an array of test IDs to delete

    if (!ids || !ids.length) {
        return res.status(400).send("No test IDs provided");
    }

    const placeholders = ids.map(() => '?').join(','); // Create placeholders for query
    const sql = `DELETE FROM tests WHERE id IN (${placeholders})`;

    db.run(sql, ids, function(err) {
        if (err) {
            console.error('Error deleting tests', err);
            return res.status(500).send("Failed to delete tests");
        }
        res.status(200).send({ message: "Tests deleted successfully", count: this.changes });
    });
});




// Fetch user by uuid
app.get('/user/uuid/:uuid', (req, res) => {
    const {uuid} = req.params;

    db.get(`SELECT id, username, email, uuid, role, bio FROM users WHERE uuid = ?`, [uuid], (err, user) => {
        if (err) {
            console.error('Error fetching user information', err);
            return res.status(500).send("Internal server error");
        }
        if (!user) {
            return res.status(404).send("User not found");
        }
        res.status(200).json(user);
    });
});

// Password reset
app.post('/reset-password', (req, res) => {
    const {userId, newPassword} = req.body;

    db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err) {
            console.error('Error fetching user information', err);
            return res.status(500).send("Internal server error");
        }
        if (!user) {
            return res.status(404).send("User not found");
        }

        const hashedPassword = bcrypt.hashSync(newPassword, 8);

        db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, userId], function (err) {
            if (err) {
                console.error('Error resetting password', err);
                return res.status(500).send("Password reset failed");
            }
            res.status(200).send("Password reset successfully");
        });
    });
});

/* -------------------------------------------------------------------------- */
/*                           Notification endpoints                           */
/* -------------------------------------------------------------------------- */

// Fetch notifications
app.get('/notifications', (req, res) => {
    const user_id = req.query.user_id;
    db.all(`SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`, [user_id], (err, rows) => {
        if (err) {
            console.error('Error fetching notifications:', err);
            return res.status(500).send("Internal server error");
        }
        res.status(200).json(rows);
    });
});

// Create a new notification
app.post('/notifications', (req, res) => {
    const {user_id, message} = req.body;

    db.run(`INSERT INTO notifications (user_id, message) VALUES (?, ?)`, [user_id, message], function (err) {
        if (err) {
            console.error('Error creating notification', err);
            return res.status(500).send("Notification creation failed");
        }
        res.status(200).send({
            message: "Notification created successfully",
            notificationId: this.lastID
        });
    });
});

// Clear all notifications for a user
app.post('/notifications/clear', (req, res) => {
    const user_id = req.body.user_id;

    db.run(`DELETE FROM notifications WHERE user_id = ?`, [user_id], function (err) {
        if (err) {
            console.error('Error clearing notifications', err);
            return res.status(500).send("Failed to clear notifications");
        }
        res.status(200).send("Notifications cleared successfully");
    });
});

// Mark a notification as read
app.put('/notifications/:id/read', (req, res) => {
    const {id} = req.params;

    db.run(`UPDATE notifications SET read = 1 WHERE id = ?`, [id], function (err) {
        if (err) {
            console.error('Error marking notification as read', err);
            return res.status(500).send("Failed to mark notification as read");
        }
        res.status(200).send("Notification marked as read successfully");
    });
});

/* -------------------------------------------------------------------------- */
/*                             Tests Endpoints                                */
/* -------------------------------------------------------------------------- */

// Modify the /tests GET endpoint
app.get('/tests', (req, res) => {
    const username = req.query.username;

    if (!username) {
        return res.status(400).json({error: "Username is required"});
    }

    console.log(`Fetching tests for user: ${username}`);

    db.all(`SELECT * FROM tests WHERE JSON_EXTRACT(accessible_to, '$') LIKE ?`, [`%${username}%`], (err, rows) => {
        if (err) {
            console.error('Error fetching tests:', err);
            return res.status(500).json({error: "Internal server error"});
        }
        console.log(`Fetched ${rows.length} tests for user ${username}`);
        console.log('Tests:', JSON.stringify(rows, null, 2));
        res.status(200).json(rows);
    });
});

app.post('/tests', async (req, res) => {
    const {title, author, testBench, snrRange, batchSize, username, accessible_to, DUT} = req.body;

    try {
        const startTime = new Date().toISOString();
        db.run(`INSERT INTO tests (
            title, 
            author, 
            testBench, 
            snrRange, 
            batchSize, 
            username, 
            accessible_to, 
            DUT, 
            status, 
            start_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Queued', ?)`, [
            title, 
            author, 
            testBench, 
            snrRange, 
            batchSize, 
            username, 
            JSON.stringify(accessible_to), 
            DUT, 
            startTime
        ], function(err) {
            if (err) {
                console.error('Error creating test:', err);
                res.status(500).send("Test creation failed: " + err.message);
            } else {
                const testId = this.lastID;
                testQueue.push({
                    id: testId, 
                    snrRange, 
                    batchSize, 
                    username,
                    chipId: testBench, 
                    startTime: startTime
                });
                res.status(200).send({
                    message: "Test created and queued successfully",
                    testId: testId
                });
            }
        });
    } catch (error) {
        console.error('Error creating test:', error);
        res.status(500).send("Test creation failed: " + error.message);
    }
});




function runTestOnTeensy(testParams) {
    return new Promise((resolve, reject) => {
        if (!testParams || !testParams.id || !testParams.snrRange || !testParams.batchSize || !testParams.chipId) {
            reject(new Error(`Invalid test parameters: ${JSON.stringify(testParams)}`));
            return;
        }

        console.log('Sending test parameters to Teensy:', testParams);
        port.write(`TEST${testParams.id} ${testParams.chipId} ${testParams.snrRange} ${testParams.batchSize}\n`, (err) => {
            if (err) {
                console.error('Error writing to serial port:', err);
                reject(err);
            } else {
                console.log('Test parameters sent successfully');
            }
        });

        const dataHandler = (data) => {
            console.log('Received data from Teensy:', data);
            
            try {
                const parsedData = JSON.parse(data);
                if (parsedData.type === "test_completed" && parsedData.testId === testParams.id) {
                    parser.removeListener('data', dataHandler);
                    console.log(`Test ${testParams.id} completed on chip ${testParams.chipId}`);
                    resolve();
                }
            } catch (err) {
                console.error('Error parsing JSON:', err, 'Raw data:', data);
            }
        };

        parser.on('data', dataHandler);

        setTimeout(() => {
            parser.removeListener('data', dataHandler);
            reject(new Error('Test timeout: did not complete in time'));
        }, 30000 * 60); // 30 minute timeout for long-running tests
    });
}



// Edit test
app.put('/tests/:id', (req, res) => {
    const {id} = req.params;
    const {title, author, DUT, status, duration} = req.body;

    db.run(`UPDATE tests SET title = ?, author = ?, DUT = ?, status = ?, duration = ? WHERE id = ?`,
        [title, author, DUT, status, duration, id], function (err) {
            if (err) {
                console.error('Error modifying test', err);
                return res.status(500).send("Test modification failed");
            }
            res.status(200).send("Test modified successfully");
        });
});

// Fetch a single test by ID
app.get('/tests/:id', (req, res) => {
    const {id} = req.params;
    db.get(`SELECT * FROM tests WHERE id = ?`, [id], (err, row) => {
        if (err) {
            console.error('Error fetching test:', err);
            return res.status(500).json({error: "Internal server error"});
        }
        if (!row) {
            return res.status(404).json({error: "Test not found"});
        }
        row.results = JSON.parse(row.results);
        res.status(200).json(row);
    });
});

// Delete test
app.delete('/tests/:id', (req, res) => {
    const {id} = req.params;

    db.run(`DELETE FROM tests WHERE id = ?`, [id], function (err) {
        if (err) {
            console.error('Error deleting test', err);
            return res.status(500).send("Test deletion failed");
        }
        res.status(200).send("Test deleted successfully");
    });
});

// Share a test with a user
app.post('/tests/:id/share', (req, res) => {
    const {id} = req.params;
    const {username} = req.body;

    db.get(`SELECT accessible_to FROM tests WHERE id = ?`, [id], (err, row) => {
        if (err) {
            console.error('Error fetching test:', err);
            return res.status(500).send("Internal server error");
        }
        if (!row) {
            return res.status(404).send("Test not found");
        }

        let accessibleTo = JSON.parse(row.accessible_to);
        if (!Array.isArray(accessibleTo)) {
            accessibleTo = [];
        }

        if (!accessibleTo.includes(username)) {
            accessibleTo.push(username);
        }

        db.run(`UPDATE tests SET accessible_to = ? WHERE id = ?`,
            [JSON.stringify(accessibleTo), id], (err) => {
                if (err) {
                    console.error('Error updating test:', err);
                    return res.status(500).send("Failed to share test");
                }
                res.status(200).send("Test shared successfully");
            });
    });
});



// Remove a user's access to a test
app.post('/tests/:id/remove-access', (req, res) => {
    const {id} = req.params;
    const {username} = req.body;

    db.get(`SELECT accessible_to FROM tests WHERE id = ?`, [id], (err, row) => {
        if (err) {
            console.error('Error fetching test:', err);
            return res.status(500).send("Internal server error");
        }
        if (!row) {
            return res.status(404).send("Test not found");
        }

        let accessibleTo = JSON.parse(row.accessible_to);
        if (!Array.isArray(accessibleTo)) {
            accessibleTo = [];
        }

        accessibleTo = accessibleTo.filter(user => user !== username);

        db.run(`UPDATE tests SET accessible_to = ? WHERE id = ?`,
            [JSON.stringify(accessibleTo), id], (err) => {
                if (err) {
                    console.error('Error updating test:', err);
                    return res.status(500).send("Failed to remove access");
                }
                res.status(200).send("Access removed successfully");
            });
    });
});

// Update test threshold
app.put('/tests/:id/threshold', (req, res) => {
    const {id} = req.params;
    const {threshold} = req.body;
    db.run(`UPDATE tests SET threshold = ? WHERE id = ?`, [threshold, id], (err) => {
        if (err) {
            console.error('Error updating threshold:', err);
            return res.status(500).json({error: "Failed to update threshold"});
        }
        res.status(200).json({message: "Threshold updated successfully"});
    });
});

// Rerun test
app.post('/tests/:id/rerun', (req, res) => {
    const {id} = req.params;
    // This is a placeholder for actual test logic
    const newResults = Array(5).fill().map((_, i) => ({
        snr: -5 + i * 2,
        ber: Math.random() * 0.1,
        fer: Math.random() * 0.2
    }));
    db.run(`UPDATE tests SET results = ?, status = ? WHERE id = ?`,
        [JSON.stringify(newResults), 'Completed', id],
        (err) => {
            if (err) {
                console.error('Error rerunning test:', err);
                return res.status(500).json({error: "Failed to rerun test"});
            }
            res.status(200).json({message: "Test rerun successfully", results: newResults});
        }
    );
});

// Download results
app.get('/tests/:id/download', (req, res) => {
    const {id} = req.params;
    db.get(`SELECT title, results_file FROM tests WHERE id = ?`, [id], (err, row) => {
        if (err) {
            console.error('Error fetching test results:', err);
            return res.status(500).json({error: "Failed to fetch test results"});
        }
        if (!row) {
            return res.status(404).json({error: "Test not found"});
        }
        if (!row.results_file) {
            return res.status(404).json({error: "Test results file not found"});
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${row.title.replace(/\s+/g, '_')}_results.csv`);
        res.sendFile(row.results_file);
    });
});

// Fetch chip statuses
app.get('/chips', (req, res) => {
    res.json(chips);
});


// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});


  

server.listen(PORT, () => {
    console.log(`Rest API and WebSocket server started. Running on port ${PORT}`);
    sendStatusToTeensy('ONLINE'); // Send initial status when server starts
});