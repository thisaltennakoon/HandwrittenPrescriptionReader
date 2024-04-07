const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    console.log('Image uploaded successfully. File path: ', filePath);
    res.json({ filepath: filePath });
});

app.post('/runcmd', (req, res) => {
    const { filePath } = req.body;
    console.log('runcmd File path: ', filePath);
    if (!filePath) {
        return res.status(400).send('File path is required');
    }
    const pythonProcess = spawn('python', ['main_model.py', filePath]);
    let outputData = '';
    console.log('Processing started File path: ', filePath);
    pythonProcess.stdout.on('data', (data) => {
        outputData = outputData + "##" + data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
    });

    pythonProcess.on('close', (code) => {
        console.log('outputData: ', outputData);
        var responseArray = outputData.split("##")
        console.log('responseArray: ', responseArray);
        var resultArray = (responseArray[3]).split("||");
        console.log('resultArray: ', resultArray);
        const responseObj = { "name": (resultArray[0]).trim(), "accuracy": ((resultArray[1].replace('\r', '')).replace('\n', '')).trim() };
        res.send(responseObj);
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
