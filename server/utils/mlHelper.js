const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const VENV_PYTHON_PATH = path.join(__dirname, '..', '..', 'backend', '.venv', 'Scripts', 'python.exe');
const ML_SCRIPT_PATH = path.join(__dirname, '..', 'ml', 'ml_service.py');

function runMl(mode, transactions) {
  return new Promise((resolve, reject) => {
    let pythonPath = process.env.ML_PYTHON_PATH;
    if (!pythonPath) {
      pythonPath = 'python3';
      if (fs.existsSync(VENV_PYTHON_PATH)) {
        pythonPath = VENV_PYTHON_PATH;
      }
    }

    const py = spawn(pythonPath, [ML_SCRIPT_PATH]);
    
    let stdoutData = '';
    let stderrData = '';

    py.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    py.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    py.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}. Stderr: ${stderrData}`);
        return reject(new Error(stderrData || `Python script exited with code ${code}`));
      }

      try {
        const parsed = JSON.parse(stdoutData.trim());
        if (parsed.error) {
          return reject(new Error(parsed.error));
        }
        resolve(parsed);
      } catch (err) {
        console.error('Failed to parse Python stdout JSON:', stdoutData);
        reject(err);
      }
    });

    // Write input data as JSON to stdin and end the stream
    const inputPayload = JSON.stringify({ mode, transactions });
    py.stdin.write(inputPayload);
    py.stdin.end();
  });
}

module.exports = {
  runMl
};
